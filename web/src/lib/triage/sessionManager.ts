/**
 * MedAI Server-Owned Triage Session & Slot Completeness Evaluator
 * 
 * Manages clinical intake slots:
 * 1. Onset / Timing (When did it start?)
 * 2. Severity / Intensity (1-10 scale or descriptive severity)
 * 3. Associated Symptoms (Fever, chills, nausea, dizziness, etc.)
 * 4. Aggravating / Relieving Factors
 * 
 * Determines when the server should terminate the interactive loop
 * and compile the final assessment.
 */

export interface TriageMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ClinicalSlots {
  onset?: string
  severity?: string
  associatedSymptoms?: string[]
  aggravatingOrRelieving?: string
}

export interface SlotCompletenessResult {
  isComplete: boolean
  filledSlots: string[]
  missingSlots: string[]
  completionRatio: number
}

/**
 * Heuristically inspects user messages to extract clinical intake slots.
 */
export function extractClinicalSlots(messages: TriageMessage[]): ClinicalSlots {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ')

  const slots: ClinicalSlots = {}

  // 1. Onset / Timing detection
  const onsetPatterns = [
    /\b(today|yesterday|days? ago|hours? ago|weeks? ago|months? ago|since|started|began|sudden|abrupt|gradual)\b/,
    /\b(\d+\s*(days?|hours?|weeks?|mins?|minutes?))\b/,
  ]
  for (const pat of onsetPatterns) {
    const match = userText.match(pat)
    if (match) {
      slots.onset = match[0]
      break
    }
  }

  // 2. Severity detection
  const severityPatterns = [
    /\b([1-9]|10)\s*(\/|\s*out of\s*)\s*10\b/,
    /\b(mild|moderate|severe|unbearable|intense|sharp|dull|throbbing|slight|awful|terrible)\b/,
  ]
  for (const pat of severityPatterns) {
    const match = userText.match(pat)
    if (match) {
      slots.severity = match[0]
      break
    }
  }

  // 3. Associated symptoms detection
  const symptomKeywords = [
    'fever',
    'chills',
    'cough',
    'nausea',
    'vomiting',
    'dizziness',
    'fatigue',
    'headache',
    'rash',
    'diarrhea',
    'sweats',
    'sore throat',
    'cramps',
  ]
  const foundSymptoms = symptomKeywords.filter((kw) => userText.includes(kw))
  if (foundSymptoms.length > 0) {
    slots.associatedSymptoms = foundSymptoms
  }

  // 4. Aggravating / Relieving factors
  const factorPatterns = [
    /\b(better with|worse with|when i walk|when i lie down|after eating|resting|moving|ice|heat)\b/,
  ]
  for (const pat of factorPatterns) {
    const match = userText.match(pat)
    if (match) {
      slots.aggravatingOrRelieving = match[0]
      break
    }
  }

  return slots
}

/**
 * Evaluates whether enough clinical slots have been filled or turn cap reached.
 */
export function evaluateSlotCompleteness(
  slots: ClinicalSlots,
  currentTurn: number,
  maxTurns: number = 3
): SlotCompletenessResult {
  const allCoreSlots = ['onset', 'severity', 'associatedSymptoms']
  const filledSlots: string[] = []

  if (slots.onset) filledSlots.push('onset')
  if (slots.severity) filledSlots.push('severity')
  if (slots.associatedSymptoms && slots.associatedSymptoms.length > 0) {
    filledSlots.push('associatedSymptoms')
  }

  const missingSlots = allCoreSlots.filter((s) => !filledSlots.includes(s))
  const completionRatio = filledSlots.length / allCoreSlots.length

  // Triage is complete if:
  // 1. Current turns reached max turn cap (e.g. 3 turns)
  // 2. OR at least 2 of 3 core slots are populated after turn 1
  const isComplete = currentTurn >= maxTurns || (currentTurn >= 2 && filledSlots.length >= 2)

  return {
    isComplete,
    filledSlots,
    missingSlots,
    completionRatio,
  }
}
