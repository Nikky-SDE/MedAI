/**
 * MedAI AI Inference Engine
 * 
 * Supports Groq with configurable model ID (process.env.GROQ_MODEL_ID or openai/gpt-oss-120b),
 * standard playground parameters (temperature=1, max_completion_tokens=2048, top_p=1),
 * explicit error logging (error.status, error.message, error.error),
 * and automatic fallback to Google Gemini when configured.
 */

interface GenerateAIOptions {
  prompt: string
  imageBase64?: string | null
  mimeType?: string | null
  temperature?: number
}

// Fallback Gemini models
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
]

function extractJsonSafe(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1))
    }
    throw new Error(`Failed to extract valid JSON from AI response: ${clean.slice(0, 100)}...`)
  }
}

export async function generateHealthAIResponse(options: GenerateAIOptions): Promise<{
  data: Record<string, unknown>
  provider: 'groq' | 'gemini'
  model: string
}> {
  const { prompt, imageBase64, mimeType } = options
  const groqKey = process.env.GROQ_API_KEY?.trim()
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  const groqModel = process.env.GROQ_MODEL_ID?.trim() || 'openai/gpt-oss-120b'

  const errors: string[] = []

  // 1. ATTEMPT GROQ FIRST (using user's configured model & playground parameters)
  if (groqKey) {
    try {
      const { default: Groq } = await import('groq-sdk')
      const groq = new Groq({ apiKey: groqKey, timeout: 15000 })

      const textPrompt = imageBase64
        ? `${prompt}\n\n[Note: User attached an image with symptoms (${mimeType || 'image'}). Incorporate this symptom context into the diagnosis.]`
        : prompt

      console.log(`[MedAI AI Engine] Requesting Groq model '${groqModel}' with temperature=1, max_completion_tokens=2048, top_p=1...`)

      let rawText: string | null = null

      try {
        const response = await groq.chat.completions.create({
          model: groqModel,
          messages: [{ role: 'user', content: textPrompt }],
          temperature: 1,
          max_completion_tokens: 2048,
          top_p: 1,
          response_format: { type: 'json_object' }
        })
        rawText = response.choices[0]?.message?.content || null
      } catch (jsonModeError: unknown) {
        const jErr = jsonModeError as { message?: string; error?: { message?: string } } | null
        // If response_format json_object is not supported by the model, retry once without it
        if (jErr?.message?.includes('response_format') || jErr?.error?.message?.includes('response_format')) {
          console.warn(`[MedAI AI Engine] Model '${groqModel}' does not support response_format: json_object. Retrying without it...`)
          const fallbackResp = await groq.chat.completions.create({
            model: groqModel,
            messages: [{ role: 'user', content: textPrompt }],
            temperature: 1,
            max_completion_tokens: 2048,
            top_p: 1
          })
          rawText = fallbackResp.choices[0]?.message?.content || null
        } else {
          throw jsonModeError
        }
      }

      if (rawText) {
        const parsed = extractJsonSafe(rawText)
        console.log(`[MedAI AI Engine] Successfully generated response with Groq (${groqModel})!`)
        return { data: parsed, provider: 'groq', model: groqModel }
      }

    } catch (groqError: unknown) {
      const gErr = groqError as { status?: number; statusCode?: number; message?: string; error?: unknown } | null
      console.error('==================== GROQ API CALL ERROR ====================')
      console.error('Model Attempted:', groqModel)
      console.error('error.status:', gErr?.status || gErr?.statusCode || 'N/A')
      console.error('error.message:', gErr?.message || String(groqError))
      if (gErr?.error) {
        console.error('Exact API Rejection Details (error.error):', JSON.stringify(gErr.error, null, 2))
      }
      console.error('=============================================================')
      errors.push(`Groq [${groqModel}]: ${gErr?.message || String(groqError)}`)
    }
  }

  // 2. ATTEMPT GEMINI FALLBACK (if Groq fails or is not available)
  if (geminiKey) {
    console.log('[MedAI AI Engine] Falling back to Google Gemini...')
    for (const model of GEMINI_MODELS) {
      try {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }]
        if (imageBase64 && mimeType) {
          parts.push({
            inlineData: {
              mimeType,
              data: imageBase64
            }
          })
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const errMsg = errData?.error?.message || `HTTP ${res.status} ${res.statusText}`
          errors.push(`Gemini [${model}]: ${errMsg}`)
          continue
        }

        const jsonRes = await res.json()
        const rawText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!rawText) continue

        const parsed = extractJsonSafe(rawText)
        console.log(`[MedAI AI Engine] Successfully generated response with Google Gemini (${model})`)
        return { data: parsed, provider: 'gemini', model }
      } catch (geminiErr: unknown) {
        const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
        errors.push(`Gemini [${model}]: ${errMsg}`)
      }
    }
  }

  const finalError = new Error(
    `All AI models failed.\nAttempted Groq: ${groqModel}\nErrors:\n${errors.join('\n')}`
  )
  console.error('[MedAI AI Engine] CRITICAL FAILURE:', finalError)
  throw finalError
}
