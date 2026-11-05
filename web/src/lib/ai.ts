/**
 * MedAI AI Inference Engine
 * 
 * Supports:
 * - Proper system/user role separation (no jailbreak prompts)
 * - True multi-turn conversation messages
 * - Structured JSON output mode with Zod schema validation
 * - Automatic single-turn self-correction retry on schema parse failure
 * - Env-driven verified model routing with vision-capable fallback
 * - Transient retry with backoff on 429 / 5xx
 * - Comprehensive audit logging to `public.ai_calls`
 * - Typed domain errors (AISchemaValidationError, AIProviderError, AIVisionUnavailableError)
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  AISchemaValidationError,
  AIProviderError,
  AIVisionUnavailableError,
} from './ai/schemas'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateAIOptions<T = unknown> {
  systemPrompt: string
  messages: AIMessage[]
  schema?: z.ZodType<T>
  imageBase64?: string | null
  mimeType?: string | null
  temperature?: number
  userId?: string
  sessionId?: string
  supabase?: SupabaseClient
}

// Verified modern Gemini models (Gemini 1.5 is retired; 2.5 is current generation)
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL_ID?.trim() || 'gemini-2.5-flash',
  'gemini-2.0-flash',
]

/**
 * Extracts JSON cleanly from LLM response strings, stripping markdown fences.
 */
function extractJsonSafe(raw: string): unknown {
  const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1))
    }
    throw new Error(`Failed to extract valid JSON from response: ${clean.slice(0, 120)}...`)
  }
}

/**
 * Audit logs AI calls to Supabase public.ai_calls.
 */
async function logAICall(
  supabase?: SupabaseClient,
  entry?: {
    userId?: string
    sessionId?: string
    provider: 'groq' | 'gemini'
    model: string
    latencyMs: number
    status: 'success' | 'error' | 'timeout' | 'fallback'
    errorCode?: string | null
  }
): Promise<void> {
  if (!supabase || !entry) return
  try {
    await supabase.from('ai_calls').insert({
      user_id: entry.userId || null,
      session_id: entry.sessionId || null,
      provider: entry.provider,
      model: entry.model,
      latency_ms: entry.latencyMs,
      status: entry.status,
      error_code: entry.errorCode || null,
    })
  } catch (err) {
    console.warn('[MedAI AI Engine] Audit logging to ai_calls failed (non-fatal):', err)
  }
}

/**
 * Executes chat completion against Groq API with backoff retry on 429/5xx.
 */
async function callGroqChat(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  temperature: number = 0.2
): Promise<string> {
  const { default: Groq } = await import('groq-sdk')
  const groq = new Groq({ apiKey, timeout: 20000 })

  const groqMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  let attempts = 0
  while (attempts < 2) {
    attempts++
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: groqMessages,
        temperature,
        max_completion_tokens: 2048,
        top_p: 1,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error(`Groq returned empty response for model ${model}`)
      }
      return content
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number; message?: string }
      const status = err?.status || err?.statusCode
      const isRetryable = status === 429 || (status && status >= 500 && status < 600)

      if (isRetryable && attempts < 2) {
        console.warn(`[MedAI AI Engine] Groq returned status ${status}. Retrying after backoff (1000ms)...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      throw new AIProviderError('groq', err?.message || String(error), status, error)
    }
  }

  throw new AIProviderError('groq', 'Max retry attempts exhausted for Groq')
}

/**
 * Executes generateContent against Google Gemini REST API with backoff retry on 429/5xx.
 */
async function callGeminiGenerate(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  imageBase64?: string | null,
  mimeType?: string | null,
  temperature: number = 0.2
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const contents: Array<{
    role: 'user' | 'model'
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>
  }> = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const role = msg.role === 'assistant' ? 'model' : 'user'
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: msg.content },
    ]

    if (i === messages.length - 1 && imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      })
    }

    contents.push({ role, parts })
  }

  const payload: Record<string, unknown> = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  }

  let attempts = 0
  while (attempts < 2) {
    attempts++
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const isRetryable = res.status === 429 || res.status >= 500
        if (isRetryable && attempts < 2) {
          console.warn(`[MedAI AI Engine] Gemini returned HTTP ${res.status}. Retrying after backoff (1200ms)...`)
          await new Promise((resolve) => setTimeout(resolve, 1200))
          continue
        }
        const errData = await res.json().catch(() => ({}))
        const msg = errData?.error?.message || `HTTP ${res.status} ${res.statusText}`
        throw new AIProviderError('gemini', msg, res.status, errData)
      }

      const data = await res.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        throw new AIProviderError('gemini', 'Empty response candidate from Gemini', 200, data)
      }

      return rawText
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err
      if (attempts < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }
      throw new AIProviderError('gemini', err instanceof Error ? err.message : String(err))
    }
  }

  throw new AIProviderError('gemini', 'Max retry attempts exhausted for Gemini')
}

/**
 * Main inference function with provider fallback, audit logging, and single schema-retry pass.
 */
export async function generateHealthAIResponse<T = Record<string, unknown>>(
  options: GenerateAIOptions<T>
): Promise<{
  data: T
  provider: 'groq' | 'gemini'
  model: string
}> {
  const {
    systemPrompt,
    messages,
    schema,
    imageBase64,
    mimeType,
    temperature = 0.2,
    userId,
    sessionId,
    supabase,
  } = options

  const groqKey = process.env.GROQ_API_KEY?.trim()
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  const groqModel = process.env.GROQ_MODEL_ID?.trim() || 'openai/gpt-oss-120b'

  const hasImage = Boolean(imageBase64 && mimeType)
  const isGroqVisionCapable = groqModel.toLowerCase().includes('vision')

  // Support MOCK_LLM for deterministic offline testing (strictly disabled in production)
  if (process.env.MOCK_LLM === 'true' && process.env.NODE_ENV !== 'production') {
    let mockResult: unknown
    if (systemPrompt.includes('final triage report') || systemPrompt.includes('symptom assessment report') || systemPrompt.includes('FinalReport')) {
      mockResult = {
        condition: 'Mild Viral Upper Respiratory Tract Infection',
        certaintyLevel: 'Medium',
        confidenceLevel: 'Medium',
        explanation: 'Patient reports mild seasonal symptoms without acute red-flag distress or high fever.',
        isEmergency: false,
        recommendation: '- Maintain adequate fluid intake\n- Rest and monitor for changes\n- Follow up if symptoms worsen or persist beyond 7 days',
        otcMedicineAdvice: 'Saline nasal spray or warm tea with honey may provide symptomatic relief if not contraindicated.',
      }
    } else {
      mockResult = {
        next_question: 'How long have you been experiencing these symptoms?',
        certaintyScore: 70,
        confidenceScore: 70,
        isEmergency: false,
      }
    }
    const validatedData = schema ? schema.parse(mockResult) : (mockResult as T)
    await logAICall(supabase, {
      userId,
      sessionId,
      provider: 'groq',
      model: 'mock-llm-engine',
      latencyMs: 15,
      status: 'success',
    })
    return {
      data: validatedData,
      provider: 'groq',
      model: 'mock-llm-engine',
    }
  }

  const errors: string[] = []

  // Helper to validate and optionally perform 1 self-correction retry
  const validateWithRetry = async (
    rawOutput: string,
    retryInvoker: (retryMessages: AIMessage[]) => Promise<string>
  ): Promise<T> => {
    let parsedJson: unknown
    try {
      parsedJson = extractJsonSafe(rawOutput)
    } catch {
      console.warn('[MedAI AI Engine] Initial JSON extraction failed, attempting 1 retry...')
      const retryMsgs: AIMessage[] = [
        ...messages,
        { role: 'assistant', content: rawOutput },
        {
          role: 'user',
          content: 'Your previous response was not valid JSON. Return ONLY a valid JSON object strictly matching the required schema, without markdown formatting or conversational commentary.',
        },
      ]
      const retryRaw = await retryInvoker(retryMsgs)
      parsedJson = extractJsonSafe(retryRaw)
    }

    if (!schema) {
      return parsedJson as T
    }

    const firstCheck = schema.safeParse(parsedJson)
    if (firstCheck.success) {
      return firstCheck.data
    }

    console.warn('[MedAI AI Engine] Schema validation failed on first attempt, running single correction retry...')
    const issueSummary = firstCheck.error.issues
      .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
      .join('; ')

    const retryMessages: AIMessage[] = [
      ...messages,
      { role: 'assistant', content: rawOutput },
      {
        role: 'user',
        content: `Your JSON response did not match the required schema: ${issueSummary}. Please correct these issues and output a valid JSON object matching the specification.`,
      },
    ]

    const retryRawText = await retryInvoker(retryMessages)
    const retryJson = extractJsonSafe(retryRawText)
    const secondCheck = schema.safeParse(retryJson)

    if (secondCheck.success) {
      return secondCheck.data
    }

    throw new AISchemaValidationError(
      `AI response failed schema validation after retry: ${issueSummary}`,
      retryRawText,
      secondCheck.error.issues
    )
  }

  const callStartTime = Date.now()

  // 1. VISION ROUTING LOGIC: If image is present and Groq is text-only, prioritize Gemini
  if (hasImage && !isGroqVisionCapable) {
    if (!geminiKey) {
      throw new AIVisionUnavailableError(
        `Active model '${groqModel}' is text-only. To process symptom photos, configure GEMINI_API_KEY or set GROQ_MODEL_ID to a vision-capable model.`
      )
    }
    console.log(`[MedAI AI Engine] Image attached: Routing directly to Gemini vision pipeline...`)
  } else if (groqKey) {
    // 2. ATTEMPT GROQ FIRST (For text requests or vision-capable Groq models)
    try {
      console.log(`[MedAI AI Engine] Calling Groq with model '${groqModel}'...`)
      const rawText = await callGroqChat(
        groqKey,
        groqModel,
        systemPrompt,
        messages,
        temperature
      )

      const validated = await validateWithRetry(rawText, (retryMsgs) =>
        callGroqChat(groqKey, groqModel, systemPrompt, retryMsgs, temperature)
      )

      const latencyMs = Date.now() - callStartTime
      await logAICall(supabase, {
        userId,
        sessionId,
        provider: 'groq',
        model: groqModel,
        latencyMs,
        status: 'success',
      })

      return { data: validated, provider: 'groq', model: groqModel }
    } catch (groqErr: unknown) {
      const errMsg = groqErr instanceof Error ? groqErr.message : String(groqErr)
      console.error(`[MedAI AI Engine] Groq attempt failed:`, errMsg)
      errors.push(`Groq (${groqModel}): ${errMsg}`)

      await logAICall(supabase, {
        userId,
        sessionId,
        provider: 'groq',
        model: groqModel,
        latencyMs: Date.now() - callStartTime,
        status: 'fallback',
        errorCode: errMsg.slice(0, 100),
      })
    }
  }

  // 3. ATTEMPT GEMINI FALLBACK
  if (geminiKey) {
    console.log('[MedAI AI Engine] Invoking Gemini model chain...')
    for (const model of GEMINI_MODELS) {
      const geminiStartTime = Date.now()
      try {
        const rawText = await callGeminiGenerate(
          geminiKey,
          model,
          systemPrompt,
          messages,
          imageBase64,
          mimeType,
          temperature
        )

        const validated = await validateWithRetry(rawText, (retryMsgs) =>
          callGeminiGenerate(
            geminiKey,
            model,
            systemPrompt,
            retryMsgs,
            imageBase64,
            mimeType,
            temperature
          )
        )

        const latencyMs = Date.now() - geminiStartTime
        await logAICall(supabase, {
          userId,
          sessionId,
          provider: 'gemini',
          model,
          latencyMs,
          status: 'success',
        })

        return { data: validated, provider: 'gemini', model }
      } catch (geminiErr: unknown) {
        const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
        console.error(`[MedAI AI Engine] Gemini model '${model}' failed:`, errMsg)
        errors.push(`Gemini (${model}): ${errMsg}`)

        await logAICall(supabase, {
          userId,
          sessionId,
          provider: 'gemini',
          model,
          latencyMs: Date.now() - geminiStartTime,
          status: 'error',
          errorCode: errMsg.slice(0, 100),
        })
      }
    }
  }

  throw new Error(
    `All configured AI inference models failed.\nErrors:\n${errors.join('\n')}`
  )
}
