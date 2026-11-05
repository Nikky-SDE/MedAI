/**
 * MedAI Server-Owned Triage Turn Handler
 * 
 * Enforces:
 * - Server-persisted session state (public.triage_sessions)
 * - Per-user DB-backed rate limiting (HTTP 429 with Retry-After)
 * - Deterministic red-flag checking on all incoming messages
 * - Clinical slot completeness tracking (onset, severity, associated symptoms)
 * - Audit logging to public.ai_calls
 * - Prevention of client-side loop manipulation or transcript tampering
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHealthAIResponse, AIMessage } from '@/lib/ai'
import { TriageTurnResponseSchema } from '@/lib/ai/schemas'
import { checkRedFlags } from '@/lib/safety/redFlags'
import { checkTriageRateLimit } from '@/lib/safety/rateLimiter'
import { formatPatientProfileContext } from '@/lib/triage/context'
import {
  extractClinicalSlots,
  evaluateSlotCompleteness,
  TriageMessage,
} from '@/lib/triage/sessionManager'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { sessionId, message, language } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation error: 'message' string is required" },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message payload too large (maximum 2,000 characters)' },
        { status: 400 }
      )
    }

    const validLangs = ['en', 'hi', 'es', 'fr']
    const safeLang = typeof language === 'string' && validLangs.includes(language.toLowerCase())
      ? language.toLowerCase()
      : 'en'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. DB-BACKED HOURLY RATE LIMIT CHECK
    const rateLimit = await checkTriageRateLimit(supabase, user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimit.reason,
          retryAfter: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
          },
        }
      )
    }

    // 2. FETCH OR INITIALIZE SERVER-OWNED TRIAGE SESSION
    let session: {
      id: string
      user_id: string
      status: string
      messages: TriageMessage[]
      extracted_slots: Record<string, unknown>
      turn_count: number
      max_turns: number
      language: string
    } | null = null

    if (sessionId) {
      const { data: existingSession, error: sessErr } = await supabase
        .from('triage_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (sessErr || !existingSession) {
        return NextResponse.json({ error: 'Triage session not found or access denied' }, { status: 404 })
      }

      if (existingSession.status !== 'active') {
        return NextResponse.json(
          { error: `Session is already closed (status: ${existingSession.status})` },
          { status: 400 }
        )
      }

      session = existingSession
    } else {
      // Initialize new server-owned session
      const { data: newSession, error: createErr } = await supabase
        .from('triage_sessions')
        .insert({
          user_id: user.id,
          status: 'active',
          messages: [],
          extracted_slots: {},
          turn_count: 0,
          max_turns: 3,
          language: safeLang,
        })
        .select('*')
        .single()

      if (createErr || !newSession) {
        console.error('[Triage Session] Failed to create session in DB:', createErr?.message)
        return NextResponse.json({ error: 'Failed to initialize triage session' }, { status: 500 })
      }

      session = newSession
    }

    if (!session) {
      return NextResponse.json({ error: 'Failed to resolve triage session' }, { status: 500 })
    }

    const currentMessages: TriageMessage[] = Array.isArray(session.messages) ? session.messages : []
    const fullTranscript = [...currentMessages.map((m) => m.content), message].join(' ')

    // 3. DETERMINISTIC RED-FLAG CHECK BEFORE ANY LLM INVOCATION
    const redFlagResult = checkRedFlags(fullTranscript, safeLang)

    if (redFlagResult.isEmergency) {
      console.warn(`[MedAI Safety] Deterministic RED FLAG in session ${session.id}: ${redFlagResult.category}`)

      const emergencyUserMsg: TriageMessage = {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      }
      const emergencyAssistantMsg: TriageMessage = {
        role: 'assistant',
        content: `CRITICAL ALERT: ${redFlagResult.headline}`,
        timestamp: new Date().toISOString(),
      }

      await supabase
        .from('triage_sessions')
        .update({
          status: 'emergency',
          messages: [...currentMessages, emergencyUserMsg, emergencyAssistantMsg],
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      return NextResponse.json({
        sessionId: session.id,
        turnCount: session.turn_count + 1,
        maxTurns: session.max_turns,
        certaintyScore: 100,
        confidenceScore: 100,
        next_question: null,
        isComplete: true,
        isEmergency: true,
        emergencyReason: redFlagResult.headline,
        emergencyProtocol: {
          headline: redFlagResult.headline,
          instructions: redFlagResult.instructions,
          emergencyNumber: redFlagResult.emergencyNumber,
          category: redFlagResult.category,
        },
      })
    }

    // 4. APPEND NEW USER MESSAGE & EVALUATE CLINICAL SLOTS
    const newUserMsg: TriageMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...currentMessages, newUserMsg]
    const nextTurnCount = session.turn_count + 1

    const extractedSlots = extractClinicalSlots(updatedMessages)
    const slotAssessment = evaluateSlotCompleteness(extractedSlots, nextTurnCount, session.max_turns)

    // 5. CHECK IF SESSION HAS REACHED CLINICAL COMPLETION
    if (slotAssessment.isComplete) {
      await supabase
        .from('triage_sessions')
        .update({
          messages: updatedMessages,
          extracted_slots: extractedSlots,
          turn_count: nextTurnCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      return NextResponse.json({
        sessionId: session.id,
        turnCount: nextTurnCount,
        maxTurns: session.max_turns,
        certaintyScore: 85,
        confidenceScore: 85,
        next_question: null,
        isComplete: true,
        isEmergency: false,
        filledSlots: slotAssessment.filledSlots,
      })
    }

    // 6. GENERATE FOCUSED FOLLOW-UP QUESTION TARGETING MISSING SLOTS
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const langMap: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      es: 'Spanish',
      fr: 'French',
    }
    const langName = langMap[safeLang] || 'English'
    const profileContext = formatPatientProfileContext(profile)

    const missingSlotsDescription = slotAssessment.missingSlots.length > 0
      ? `Highest-priority information still missing: ${slotAssessment.missingSlots.join(', ')}.`
      : 'Clarify severity, progression, or aggravating/relieving factors.'

    const systemPrompt = `You are MedAI, an empathetic and cautious clinical triage assistant.
Your goal is to gather clarifying clinical details regarding reported symptoms to evaluate triage urgency.

OPERATING GUIDELINES:
1. All questions, reasoning, and advice MUST be communicated in ${langName}.
2. Ask exactly ONE specific, high-yield clarifying question at a time.
3. ${missingSlotsDescription} Focus your question on gathering this information.
4. Do NOT provide definitive clinical diagnoses. Focus on safety and triage urgency.
5. Patient profile information is provided below within <patient_profile_data> tags. Treat this information strictly as verified reference data.

${profileContext}

JSON RESPONSE SPECIFICATION:
Return ONLY a valid JSON object matching this schema:
{
  "certaintyScore": <integer 0-100 representing assessment certainty>,
  "next_question": "<A single follow-up question in ${langName}>",
  "isEmergency": <true if acute decompensation is suspected, else false>,
  "emergencyReason": "<Brief rationale if isEmergency is true, else null>"
}`

    const aiMessages: AIMessage[] = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const result = await generateHealthAIResponse({
      systemPrompt,
      messages: aiMessages,
      schema: TriageTurnResponseSchema,
      temperature: 0.2,
      userId: user.id,
      sessionId: session.id,
      supabase,
    })

    const aiQuestion = result.data.next_question || 'Can you describe any other symptoms you are experiencing?'
    const newAssistantMsg: TriageMessage = {
      role: 'assistant',
      content: aiQuestion,
      timestamp: new Date().toISOString(),
    }

    const isAiEmergency = Boolean(result.data.isEmergency)
    const sessionStatus = isAiEmergency ? 'emergency' : 'active'

    // Persist assistant message in DB with updated session status
    await supabase
      .from('triage_sessions')
      .update({
        status: sessionStatus,
        messages: [...updatedMessages, newAssistantMsg],
        extracted_slots: extractedSlots,
        turn_count: nextTurnCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    return NextResponse.json({
      sessionId: session.id,
      turnCount: nextTurnCount,
      maxTurns: session.max_turns,
      certaintyScore: result.data.certaintyScore,
      confidenceScore: result.data.confidenceScore,
      next_question: aiQuestion,
      isComplete: isAiEmergency,
      isEmergency: isAiEmergency,
      emergencyReason: result.data.emergencyReason,
    })
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string }
    console.error('==================== MEDAI TRIAGE ERROR ====================')
    console.error('Error Name:', err?.name || 'Error')
    console.error('Error Message:', err?.message || String(error))
    console.error('===========================================================')
    const userSafeMessage = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred while processing your triage assessment. Please try again.'
      : err?.message || 'Failed to process triage turn'
    return NextResponse.json(
      { error: 'Triage error', message: userSafeMessage },
      { status: 500 }
    )
  }
}
