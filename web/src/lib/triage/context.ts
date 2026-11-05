/**
 * MedAI Triage Context & Menstrual Cycle Utilities
 * 
 * Provides deterministic, timezone-safe cycle phase calculation
 * and safe, delimited patient profile context formatting for LLM prompts.
 */

export interface CyclePhaseInfo {
  phase: 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal'
  currentDayOfCycle: number
  cycleLength: number
  periodDuration: number
  daysSincePeriodStart: number
}

export interface PatientProfile {
  id?: string
  age?: number | null
  biological_sex?: string | null
  blood_group?: string | null
  height?: string | null
  weight?: string | null
  allergies?: string | null
  medical_history?: string | null
  medications_list?: string[] | null
  diet_preferences?: string[] | null
  food_intolerances?: string[] | null
  is_pregnant?: boolean | null
  last_period_start?: string | null
  cycle_length?: number | null
  period_duration?: number | null
  cycle_symptoms?: string[] | null
  water_intake?: string | null
  meal_frequency?: string | null
}

/**
 * Calculates menstrual cycle phase using timezone-safe local date parsing
 * and clamped parameters (cycle length: 10-100, period duration: 1-30).
 */
export function calculateMenstrualCyclePhase(
  lastPeriodStart?: string | null,
  cycleLengthRaw?: number | null,
  periodDurationRaw?: number | null,
  referenceDate: Date = new Date()
): CyclePhaseInfo | null {
  if (!lastPeriodStart || typeof lastPeriodStart !== 'string') {
    return null
  }

  // Parse YYYY-MM-DD explicitly as local calendar components to avoid UTC timezone day-shifts
  const match = lastPeriodStart.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1 // 0-indexed month
  const day = parseInt(match[3], 10)

  const startDate = new Date(year, month, day)
  if (isNaN(startDate.getTime())) {
    return null
  }

  const todayMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  )

  const diffMs = todayMidnight.getTime() - startDate.getTime()
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // If the reported period start date is in the future, return null to prevent invalid cycle estimates
  if (daysSince < 0) {
    return null
  }

  // Clamp ranges strictly
  const cycleLength = Math.min(Math.max(cycleLengthRaw ?? 28, 10), 100)
  const periodDuration = Math.min(Math.max(periodDurationRaw ?? 5, 1), 30)

  // Current day of cycle (1-indexed)
  const currentDayOfCycle = daysSince >= 0 ? (daysSince % cycleLength) + 1 : 1

  let phase: 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal'
  if (currentDayOfCycle <= periodDuration) {
    phase = 'Menstrual'
  } else if (currentDayOfCycle < 13) {
    phase = 'Follicular'
  } else if (currentDayOfCycle < 17) {
    phase = 'Ovulatory'
  } else {
    phase = 'Luteal'
  }

  return {
    phase,
    currentDayOfCycle,
    cycleLength,
    periodDuration,
    daysSincePeriodStart: daysSince,
  }
}

/**
 * Generates delimited, injection-resistant profile context for AI prompts.
 * User-entered strings are treated strictly as data within explicit boundaries.
 */
export function formatPatientProfileContext(profile: PatientProfile | null | undefined): string {
  if (!profile) {
    return '<patient_profile_data>\nStatus: No prior patient profile on record.\n</patient_profile_data>'
  }

  const cycleInfo =
    profile.biological_sex === 'Female' && profile.last_period_start
      ? calculateMenstrualCyclePhase(
          profile.last_period_start,
          profile.cycle_length,
          profile.period_duration
        )
      : null

  const sanitizeDataField = (val: unknown, fallback = 'None reported'): string => {
    if (val === null || val === undefined || val === '') return fallback
    const str = typeof val === 'string' ? val : JSON.stringify(val)
    // Strip XML-like delimiter closing tags to prevent escaping the data block
    return str.replace(/<\/?patient_profile_data>/gi, '').trim()
  }

  const medications = Array.isArray(profile.medications_list) && profile.medications_list.length > 0
    ? profile.medications_list.map((m) => sanitizeDataField(m)).join(', ')
    : 'None reported'

  const allergies = sanitizeDataField(profile.allergies, 'None reported')
  const foodIntolerances = Array.isArray(profile.food_intolerances) && profile.food_intolerances.length > 0
    ? profile.food_intolerances.map((f) => sanitizeDataField(f)).join(', ')
    : 'None reported'

  const dietPrefs = Array.isArray(profile.diet_preferences) && profile.diet_preferences.length > 0
    ? profile.diet_preferences.map((d) => sanitizeDataField(d)).join(', ')
    : 'Standard'

  const cycleSection = cycleInfo
    ? `- Menstrual Status: Currently in ${cycleInfo.phase} phase (Day ${cycleInfo.currentDayOfCycle} of ${cycleInfo.cycleLength}-day cycle). Relevant to fatigue, pelvic pain, mood, or fluid retention.`
    : null

  return `<patient_profile_data>
Demographics & Vitals:
- Age: ${profile.age ?? 'Not specified'} | Biological Sex: ${profile.biological_sex ?? 'Not specified'} | Blood Group: ${profile.blood_group ?? 'Not specified'}
- Physical Metrics: Height: ${profile.height ?? 'Not specified'} | Weight: ${profile.weight ?? 'Not specified'}

Clinical History & Risk Factors:
- Chronic Medical Conditions: ${sanitizeDataField(profile.medical_history, 'None reported')}
- Known Allergies: ${allergies}
- Active Prescriptions / Daily Medications: ${medications}
- Dietary Preferences: ${dietPrefs}
- Food Intolerances: ${foodIntolerances}
${profile.is_pregnant ? '- [SAFETY WARNING] Patient reports pregnancy or active conception planning.' : ''}
${cycleSection ? cycleSection : ''}
</patient_profile_data>`
}
