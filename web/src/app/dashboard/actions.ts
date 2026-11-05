'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generateHealthAIResponse, AIMessage } from '@/lib/ai'
import { FinalReportResponseSchema } from '@/lib/ai/schemas'
import { checkRedFlags } from '@/lib/safety/redFlags'
import { checkOTCInteractions } from '@/lib/safety/otcInteractions'
import { checkReportRateLimit } from '@/lib/safety/rateLimiter'
import { formatPatientProfileContext } from '@/lib/triage/context'


export async function analyzeSymptoms(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const requestedSessionId = (formData.get('sessionId') as string || '').trim()
  const rawSymptoms = (formData.get('symptoms') as string || '').trim()
  const rawMeds = formData.get('medications') as string || ''
  const medications = rawMeds.trim().slice(0, 500)
  const imageFile = formData.get('image') as File | null
  const requestedLang = (formData.get('language') as string || 'en').toLowerCase()
  const validLanguages = ['en', 'hi', 'es', 'fr']
  const languageCode = validLanguages.includes(requestedLang) ? requestedLang : 'en'

  // 1. IDEMPOTENCY CHECK: If report already exists for this session, return existing report
  if (requestedSessionId) {
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('session_id', requestedSessionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingReport) {
      console.log(`[MedAI Idempotency] Existing report ${existingReport.id} found for session ${requestedSessionId}. Redirecting...`)
      redirect(`/report/${existingReport.id}`)
    }
  }

  // 2. DAILY REPORT RATE LIMIT CHECK
  const rateLimit = await checkReportRateLimit(supabase, user.id)
  if (!rateLimit.allowed) {
    redirect('/dashboard?error=' + encodeURIComponent(rateLimit.reason || 'Daily report generation limit reached.'))
  }

  // 3. RECONSTRUCT SYMPTOMS FROM SERVER-OWNED SESSION TRANSCRIPT
  let symptoms = rawSymptoms
  let activeSessionId: string | null = requestedSessionId || null

  if (requestedSessionId) {
    const { data: session } = await supabase
      .from('triage_sessions')
      .select('*')
      .eq('id', requestedSessionId)
      .eq('user_id', user.id)
      .single()

    if (session && Array.isArray(session.messages) && session.messages.length > 0) {
      symptoms = session.messages
        .map((m: { role: string; content: string }) => `[${(m.role || 'user').toUpperCase()}]: ${m.content}`)
        .join('\n')
    }
  }

  if (!symptoms || symptoms.length < 3) {
    redirect('/dashboard?error=' + encodeURIComponent('Please describe your symptoms in at least a few words.'))
  }

  // Prevent token inflation or prompt overflow
  if (symptoms.length > 5000) {
    redirect('/dashboard?error=' + encodeURIComponent('Symptom description is too long (maximum 5,000 characters).'))
  }

  // If no server session exists yet, create one for audit tracking
  if (!activeSessionId) {
    const { data: newSession } = await supabase
      .from('triage_sessions')
      .insert({
        user_id: user.id,
        status: 'completed',
        messages: [{ role: 'user', content: symptoms, timestamp: new Date().toISOString() }],
        turn_count: 1,
        max_turns: 3,
        language: languageCode,
      })
      .select('id')
      .single()

    activeSessionId = newSession?.id || null
  }

  let imageUrl: string | null = null
  let imageBase64: string | null = null
  let mimeType: string | null = null

  if (imageFile && imageFile.size > 0) {
    // 1. Enforce 5MB upload size limit
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024
    if (imageFile.size > MAX_IMAGE_SIZE) {
      redirect('/dashboard?error=' + encodeURIComponent('Uploaded image exceeds 5MB size limit.'))
    }

    // 2. Enforce strict whitelist of allowed image MIME types
    const ALLOWED_MIME_TYPES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }

    const safeExt = ALLOWED_MIME_TYPES[imageFile.type]
    if (!safeExt) {
      redirect('/dashboard?error=' + encodeURIComponent('Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF.'))
    }

    // Store in user-isolated private folder: <user_id>/<timestamp>-<uuid>.<ext>
    const fileId = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`
    const storagePath = `${user.id}/${fileId}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('symptoms')
      .upload(storagePath, imageFile, { contentType: imageFile.type, upsert: false })

    if (!uploadError && uploadData) {
      imageUrl = uploadData.path
    } else if (uploadError) {
      console.error('Storage upload failed:', uploadError.message)
    }

    const arrayBuffer = await imageFile.arrayBuffer()
    imageBase64 = Buffer.from(arrayBuffer).toString('base64')
    mimeType = imageFile.type
  }

  // 1. DETERMINISTIC RED-FLAG CHECK BEFORE ANY LLM CALL
  const redFlag = checkRedFlags(symptoms, languageCode)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. CURATED OTC INTERACTION & SAFETY CONTRAINDICATION CHECKS
  const otcCheck = checkOTCInteractions({
    medications: profile?.medications_list,
    allergies: profile?.allergies,
    isPregnant: profile?.is_pregnant,
    medicalHistory: profile?.medical_history,
    age: profile?.age,
  })

  const langMap: Record<string, string> = {
    en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French'
  }
  const targetLanguage = langMap[languageCode] || 'English'

  let aiResponse: {
    condition: string
    certaintyLevel: 'High' | 'Medium' | 'Low'
    confidenceLevel: 'High' | 'Medium' | 'Low'
    explanation: string
    isEmergency: boolean
    otcMedicineAdvice: string
    recommendation: string
  }
  let isEmergency = false

  if (redFlag.isEmergency) {
    console.warn(`[MedAI Safety] Deterministic RED FLAG triggered in final report: ${redFlag.category}`)
    isEmergency = true
    aiResponse = {
      condition: redFlag.headline,
      certaintyLevel: 'High',
      confidenceLevel: 'High',
      explanation: `${redFlag.headline}\n\nClinical safety heuristics detected symptoms consistent with an acute emergency (${redFlag.matchedKeyword || 'critical signs'}). Immediate evaluation at an emergency medical department is required.`,
      isEmergency: true,
      otcMedicineAdvice: 'CRITICAL SAFETY CONTRAINDICATION: Do NOT self-medicate or take over-the-counter drugs. Seek emergency medical services immediately.',
      recommendation: [
        ...redFlag.instructions.map((step) => `- ${step}`),
        `- Direct Emergency Line: ${redFlag.emergencyNumber}`,
      ].join('\n'),
    }
  } else {
    const profileContext = formatPatientProfileContext(profile)

    let otcContraindicationDirectives = ''
    if (otcCheck.hasWarning) {
      const warningsText = otcCheck.warnings
        .map((w) => `- CONTRAINDICATION: ${w.drugCategory} is unsafe due to ${w.interactingFactor}. ${w.recommendation}`)
        .join('\n')
      otcContraindicationDirectives = `\n<safety_contraindications>\n${warningsText}\n</safety_contraindications>`
    }

    const systemPrompt = `You are MedAI, an empathetic and cautious clinical triage assistant.
Your goal is to provide a structured preliminary health assessment based strictly on user-reported symptoms and health history.

CORE PRINCIPLES:
1. Provide all text, names, advice, and recommendations in ${targetLanguage}.
2. Do NOT diagnose definitively. Frame your assessment as possible clinical conditions that require formal verification by a doctor.
3. Obey all safety contraindications in <safety_contraindications> strictly. Never recommend contraindicated medications.
4. The recommendation field MUST be a bulleted string formatted with "-" at the beginning of each line.
5. Set isEmergency to true only if acute red flags or life-threatening symptoms are evident.

${profileContext}
${otcContraindicationDirectives}

JSON RESPONSE SPECIFICATION:
Output ONLY a valid JSON object matching this schema:
{
  "condition": "Probable condition name in ${targetLanguage}",
  "certaintyLevel": "High" | "Medium" | "Low",
  "explanation": "Detailed explanation (2-3 sentences in ${targetLanguage})",
  "isEmergency": true | false,
  "otcMedicineAdvice": "Safe OTC advice in ${targetLanguage}, or 'Consult a doctor' if contraindicated",
  "recommendation": "- Step 1\\n- Step 2"
}`

    const sanitizedSymptoms = symptoms.replace(/<\/?user_reported_symptoms>/gi, '')
    const sanitizedMeds = medications.replace(/<\/?user_reported_medications>/gi, '')

    const userMessageContent = `<user_reported_symptoms>
${sanitizedSymptoms}
</user_reported_symptoms>
${sanitizedMeds ? `\n<user_reported_medications>\n${sanitizedMeds}\n</user_reported_medications>` : ''}`

    const messages: AIMessage[] = [
      { role: 'user', content: userMessageContent },
    ]

    try {
      const result = await generateHealthAIResponse({
        systemPrompt,
        messages,
        schema: FinalReportResponseSchema,
        imageBase64,
        mimeType,
        temperature: 0.2,
        userId: user.id,
        sessionId: activeSessionId || undefined,
        supabase,
      })
      aiResponse = result.data
      isEmergency = Boolean(aiResponse.isEmergency)

      // Post-process: Append curated OTC warnings if present to guarantee visibility
      if (otcCheck.hasWarning && !isEmergency) {
        const warningLines = otcCheck.warnings.map(w => `⚠️ [${w.drugCategory}]: ${w.recommendation}`).join('\n')
        aiResponse.otcMedicineAdvice = `${aiResponse.otcMedicineAdvice}\n\n${warningLines}\n\n(${otcCheck.disclaimer})`
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error('==================== MEDAI DIAGNOSTIC ERROR ====================')
      console.error('Error Message:', err?.message || String(error))
      console.error('================================================================')
      const errMsg = err?.message || String(error) || 'Unknown error'

      let userExplanation: string
      let userRecommendation: string

      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        userExplanation = 'MedAI is currently navigating heavy traffic. The AI service is healthy but has temporarily paused to reset its connection limits.'
        userRecommendation = '- Please wait 60 seconds and submit your symptoms again.\n- Your session data is safely stored.'
      } else if (errMsg.includes('AIVisionUnavailableError') || errMsg.includes('vision')) {
        userExplanation = 'The active AI model is text-only and cannot inspect the uploaded symptom photo.'
        userRecommendation = '- You can submit your symptoms as a detailed text description without an image.\n- Alternatively, configure GEMINI_API_KEY for multimodal vision support.'
      } else if (errMsg.includes('403') || errMsg.includes('SAFETY')) {
        userExplanation = 'The AI content safety filter flagged your request.'
        userRecommendation = '- Try rephrasing your description or removing the image to proceed.'
      } else {
        userExplanation = 'An unexpected error occurred while processing your health assessment. Our AI service may be temporarily unavailable.'
        userRecommendation = '- Please try again in a few moments.\n- If symptoms worsen, consult a healthcare professional directly.'
      }

      aiResponse = {
        condition: 'Analysis Temporarily Unavailable',
        certaintyLevel: 'Low',
        confidenceLevel: 'Low',
        explanation: userExplanation,
        isEmergency: false,
        otcMedicineAdvice: 'Unable to provide medication advice at this time. Please consult a pharmacist or doctor.',
        recommendation: userRecommendation,
      }
    }
  }

  // 3. Save report to Supabase DB (idempotent insert with session_id)
  const { data: reportData, error: dbError } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      session_id: activeSessionId,
      symptom_description: symptoms,
      image_url: imageUrl,
      ai_response: aiResponse,
      is_emergency: isEmergency,
    })
    .select('id')
    .single()

  if (activeSessionId) {
    await supabase
      .from('triage_sessions')
      .update({
        status: isEmergency ? 'emergency' : 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeSessionId)
  }

  if (dbError || !reportData) {
    console.error("Database Insert Error:", dbError)
    const errText = process.env.NODE_ENV === 'production'
      ? 'Unable to save assessment report. Please try again.'
      : dbError ? dbError.message : "Empty report data returned from Supabase";
    redirect(`/dashboard?error=${encodeURIComponent(errText)}`)
  }

// 4. Redirect to Report page
  redirect(`/report/${reportData.id}`)
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // 1. Fetch image_url BEFORE deleting so we can clean up storage afterward
  const { data: reportRow } = await supabase
    .from('reports')
    .select('image_url')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  const imageUrl: string | null = reportRow?.image_url ?? null

  // 2. Delete the database record (this is the critical operation)
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete DB error:', error)
    throw new Error(error.message)
  }

  // 3. Clean up the uploaded image from Supabase Storage (best-effort, non-fatal)
  if (imageUrl) {
    try {
      let filePath = imageUrl
      if (filePath.includes('/symptoms/')) {
        filePath = filePath.split('/symptoms/')[1]
      }
      // Ensure the user only attempts to delete files belonging to their user directory
      if (filePath.startsWith(`${user.id}/`) || filePath.startsWith(`${user.id}-`)) {
        const { error: storageError } = await supabase.storage
          .from('symptoms')
          .remove([filePath])
        if (storageError) {
          console.error('Storage cleanup failed (non-fatal):', storageError.message)
        }
      }
    } catch (err) {
      console.error('Storage cleanup failed (non-fatal):', err)
    }
  }

  // 4. Revalidate the dashboard cache
  try {
    revalidatePath('/dashboard')
  } catch (err) {
    console.error('Revalidation failed (non-fatal):', err)
  }
}
