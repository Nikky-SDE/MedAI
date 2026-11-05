/**
 * MedAI Database-Backed Rate Limiting
 * 
 * Enforces per-user rate limiting for AI triage turns and report generations.
 * Uses Supabase DB `ai_calls` and `reports` records.
 * Returns standard HTTP 429 Retry-After metadata.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetSeconds: number
  reason?: string
}

const DEFAULT_MAX_TRIAGE_PER_HOUR = 30
const DEFAULT_MAX_REPORTS_PER_DAY = 10

/**
 * Checks if a user has exceeded triage turn call limits within the past hour.
 */
export async function checkTriageRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const limit = parseInt(
    process.env.MAX_TRIAGE_CALLS_PER_HOUR || String(DEFAULT_MAX_TRIAGE_PER_HOUR),
    10
  )

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  try {
    const { count, error } = await supabase
      .from('ai_calls')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)

    if (error) {
      console.warn('[RateLimiter] Database check failed, failing open for clinical availability:', error.message)
      return { allowed: true, limit, remaining: limit, resetSeconds: 0 }
    }

    const currentCount = count ?? 0
    const remaining = Math.max(0, limit - currentCount)
    const allowed = currentCount < limit

    return {
      allowed,
      limit,
      remaining,
      resetSeconds: allowed ? 0 : 3600,
      reason: allowed
        ? undefined
        : `Hourly triage limit reached (${limit} requests/hour). Please wait before asking further questions.`,
    }
  } catch (err) {
    console.warn('[RateLimiter] Exception during rate limit check, failing open:', err)
    return { allowed: true, limit, remaining: limit, resetSeconds: 0 }
  }
}

/**
 * Checks if a user has exceeded daily final report submissions.
 */
export async function checkReportRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const limit = parseInt(
    process.env.MAX_REPORTS_PER_DAY || String(DEFAULT_MAX_REPORTS_PER_DAY),
    10
  )

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  try {
    const { count, error } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo)

    if (error) {
      console.warn('[RateLimiter] DB report count failed, failing open:', error.message)
      return { allowed: true, limit, remaining: limit, resetSeconds: 0 }
    }

    const currentCount = count ?? 0
    const remaining = Math.max(0, limit - currentCount)
    const allowed = currentCount < limit

    return {
      allowed,
      limit,
      remaining,
      resetSeconds: allowed ? 0 : 86400,
      reason: allowed
        ? undefined
        : `Daily report limit reached (${limit} assessments/day). Please wait before submitting a new assessment.`,
    }
  } catch (err) {
    console.warn('[RateLimiter] Exception during report check, failing open:', err)
    return { allowed: true, limit, remaining: limit, resetSeconds: 0 }
  }
}
