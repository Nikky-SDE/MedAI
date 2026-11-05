/**
 * MedAI AI Response Schemas and Typed Error Definitions
 * 
 * Strict Zod schemas validating structured JSON outputs from LLM providers
 * with explicit type inference and domain-specific error classes.
 */

import { z } from 'zod'

/**
 * Custom Error: Thrown when an AI response fails schema validation even after retry.
 */
export class AISchemaValidationError extends Error {
  public readonly rawResponse: string
  public readonly issues: z.ZodIssue[]

  constructor(message: string, rawResponse: string, issues: z.ZodIssue[]) {
    super(message)
    this.name = 'AISchemaValidationError'
    this.rawResponse = rawResponse
    this.issues = issues
  }
}

/**
 * Custom Error: Thrown when upstream AI provider returns a fatal error or exhausts retry backoff.
 */
export class AIProviderError extends Error {
  public readonly provider: 'groq' | 'gemini'
  public readonly statusCode?: number
  public readonly originalError?: unknown

  constructor(provider: 'groq' | 'gemini', message: string, statusCode?: number, originalError?: unknown) {
    super(`[${provider.toUpperCase()}] ${message}`)
    this.name = 'AIProviderError'
    this.provider = provider
    this.statusCode = statusCode
    this.originalError = originalError
  }
}

/**
 * Custom Error: Thrown when a clinical photo is provided but the active model cannot process vision.
 */
export class AIVisionUnavailableError extends Error {
  constructor(message: string = 'The active AI model does not support image analysis, and no vision-capable fallback model is configured.') {
    super(message)
    this.name = 'AIVisionUnavailableError'
  }
}

/**
 * Triage Turn Response Schema (/api/triage follow-up question generation).
 * Accepts certaintyScore (0-100) or legacy confidenceScore, normalizing to certaintyScore.
 */
export const TriageTurnResponseSchema = z.object({
  certaintyScore: z.coerce.number().min(0).max(100).optional(),
  confidenceScore: z.coerce.number().min(0).max(100).optional(),
  next_question: z.string().nullable().optional(),
  isEmergency: z.boolean().default(false),
  emergencyReason: z.string().nullable().optional(),
}).transform((data) => {
  const score = data.certaintyScore ?? data.confidenceScore ?? 50
  return {
    certaintyScore: score,
    confidenceScore: score, // Keep backward compatibility for frontend meter
    next_question: data.next_question ?? null,
    isEmergency: data.isEmergency,
    emergencyReason: data.emergencyReason ?? null,
  }
})

export type TriageTurnResponse = z.infer<typeof TriageTurnResponseSchema>

/**
 * Final Medical Triage Assessment Schema (dashboard/actions.ts).
 * Validates condition, certainty level, explanation, emergency status, OTC guidance, and next steps.
 */
export const FinalReportResponseSchema = z.object({
  condition: z.string().min(1, 'Condition name is required'),
  certaintyLevel: z.enum(['High', 'Medium', 'Low']).optional(),
  confidenceLevel: z.enum(['High', 'Medium', 'Low']).optional(),
  explanation: z.string().min(10, 'A detailed explanation is required'),
  isEmergency: z.boolean(),
  otcMedicineAdvice: z.string().min(1, 'OTC guidance is required'),
  recommendation: z.string().min(5, 'Recommended next steps are required'),
}).transform((data) => {
  const certainty = data.certaintyLevel ?? data.confidenceLevel ?? 'Medium'
  return {
    condition: data.condition,
    certaintyLevel: certainty,
    confidenceLevel: certainty, // Kept for legacy database compatibility and UI views
    explanation: data.explanation,
    isEmergency: data.isEmergency,
    otcMedicineAdvice: data.otcMedicineAdvice,
    recommendation: data.recommendation,
  }
})

export type FinalReportResponse = z.infer<typeof FinalReportResponseSchema>
