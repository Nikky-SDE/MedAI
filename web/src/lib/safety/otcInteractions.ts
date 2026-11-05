/**
 * MedAI Curated OTC Interaction Checks (Limited Coverage)
 * 
 * Provides deterministic safety checks against high-risk OTC drug interactions,
 * contraindications during pregnancy, and allergy cross-reactivity.
 * 
 * Sources cited in comments:
 * - FDA Drug Safety Communication (2020): Avoid NSAIDs in pregnancy at 20 weeks and later.
 * - American Heart Association (AHA, 2017): Decongestants (pseudoephedrine/phenylephrine) & hypertension.
 * - FDA Safety Alert (2014): Acetaminophen hepatotoxicity limits and combination risks.
 * - American College of Gastroenterology (ACG, 2017): NSAID + anticoagulant/antiplatelet GI bleeding risks.
 * - American Academy of Pediatrics (AAP): Aspirin & pediatric viral illness (Reye's syndrome).
 * 
 * NOTE: This module covers high-risk curated scenarios and is NOT an exhaustive clinical
 * dispensary database. UI disclaimers must state this limited coverage clearly.
 */

export interface OTCInteractionWarning {
  severity: 'critical' | 'warning'
  drugCategory: string
  interactingFactor: string
  clinicalReason: string
  recommendation: string
  source: string
}

export interface OTCInteractionCheckResult {
  hasWarning: boolean
  warnings: OTCInteractionWarning[]
  disclaimer: string
}

export interface PatientSafetyContext {
  medications?: string[] | null
  allergies?: string | null
  isPregnant?: boolean | null
  medicalHistory?: string | null
  age?: number | null
}

const OTC_DISCLAIMER =
  'Curated OTC Interaction Checks provide algorithmic warnings for high-risk, common contraindications (pregnancy, anticoagulants, severe allergy triggers, liver risks, and hypertension). This list is non-exhaustive and does not replace professional consultation with a licensed doctor or pharmacist.'

/**
 * Normalizes strings for robust matching.
 */
function clean(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function containsAny(haystack: string, needles: string[]): boolean {
  const norm = clean(haystack)
  return needles.some((n) => norm.includes(clean(n)))
}

/**
 * Evaluates patient clinical context against curated OTC safety rules.
 */
export function checkOTCInteractions(context: PatientSafetyContext): OTCInteractionCheckResult {
  const warnings: OTCInteractionWarning[] = []

  const medList = (context.medications || []).join(' ')
  const allergies = context.allergies || ''
  const history = context.medicalHistory || ''
  const isPregnant = Boolean(context.isPregnant)
  const age = context.age ?? 30

  // 1. NSAIDs & Pregnancy (FDA 2020)
  // NSAIDs: Ibuprofen, Naproxen, Aspirin, Ketoprofen, Diclofenac, Celecoxib
  if (isPregnant) {
    warnings.push({
      severity: 'critical',
      drugCategory: 'NSAIDs (Ibuprofen, Naproxen, Aspirin)',
      interactingFactor: 'Pregnancy',
      clinicalReason:
        'NSAID exposure during pregnancy (especially 20 weeks and beyond) can cause oligohydramnios (low amniotic fluid) and premature closure of the fetal ductus arteriosus.',
      recommendation:
        'Avoid all oral NSAIDs (Advil, Motrin, Aleve, Aspirin). Acetaminophen (Tylenol) is generally the preferred first-line analgesic during pregnancy under medical supervision.',
      source: 'FDA Drug Safety Communication (2020); ACOG Practice Bulletin No. 132.',
    })
  }

  // 2. NSAIDs + Anticoagulants / Blood Thinners (ACG 2017)
  // Anticoagulants: Warfarin, Eliquis (Apixaban), Xarelto (Rivaroxaban), Pradaxa (Dabigatran), Heparin, Plavix (Clopidogrel)
  const bloodThinners = [
    'warfarin',
    'coumadin',
    'apixaban',
    'eliquis',
    'rivaroxaban',
    'xarelto',
    'dabigatran',
    'pradaxa',
    'clopidogrel',
    'plavix',
    'heparin',
    'enoxaparin',
    'lovenox',
  ]
  if (containsAny(medList, bloodThinners) || containsAny(history, ['blood thinner', 'anticoagulant'])) {
    warnings.push({
      severity: 'critical',
      drugCategory: 'NSAIDs (Ibuprofen, Naproxen, Aspirin)',
      interactingFactor: 'Anticoagulant / Antiplatelet Therapy',
      clinicalReason:
        'Combining NSAIDs with blood thinners significantly impairs platelet aggregation and causes mucosal gastric ulceration, drastically increasing severe gastrointestinal hemorrhage risks.',
      recommendation:
        'Do not take over-the-counter NSAIDs (Ibuprofen, Naproxen, Aspirin) without explicit hematologist/physician authorization.',
      source: 'American College of Gastroenterology (ACG) Clinical Guideline (2017).',
    })
  }

  // 3. Oral Decongestants + Hypertension / High Blood Pressure (AHA 2017)
  // Decongestants: Pseudoephedrine, Phenylephrine (Sudafed, Dayquil, Sinus meds)
  const isHypertensive =
    containsAny(history, ['hypertension', 'high blood pressure', 'high bp', 'hbp', 'elevated bp']) ||
    containsAny(medList, [
      'lisinopril',
      'amlodipine',
      'losartan',
      'metoprolol',
      'atenolol',
      'hydrochlorothiazide',
    ])
  if (isHypertensive) {
    warnings.push({
      severity: 'warning',
      drugCategory: 'Oral Decongestants (Pseudoephedrine, Phenylephrine)',
      interactingFactor: 'Hypertension / Cardiovascular Disease',
      clinicalReason:
        'Alpha-1 adrenergic receptor stimulation by oral decongestants produces systemic vasoconstriction, which can induce dangerous acute blood pressure spikes and arrhythmias.',
      recommendation:
        'Prefer non-medicated saline nasal sprays or intranasal corticosteroids rather than oral decongestant tablets (e.g., Sudafed). Consult a pharmacist for safe decongestant alternatives.',
      source: 'American Heart Association (AHA) High Blood Pressure Guidelines (2017).',
    })
  }

  // 4. Acetaminophen / Paracetamol + Chronic Liver Disease (FDA 2014)
  const hasLiverDisease = containsAny(history, [
    'cirrhosis',
    'hepatitis',
    'liver failure',
    'fatty liver',
    'liver disease',
  ])
  if (hasLiverDisease) {
    warnings.push({
      severity: 'warning',
      drugCategory: 'Acetaminophen / Paracetamol (Tylenol, Panadol)',
      interactingFactor: 'Pre-existing Liver Impairment',
      clinicalReason:
        'Compromised hepatic glutathione reserves impair detoxification of the toxic metabolite NAPQI, escalating the danger of severe hepatotoxicity even at sub-maximum dosages.',
      recommendation:
        'Total daily acetaminophen intake must be strictly capped (frequently below 2,000 mg/day under physician oversight) or avoided entirely.',
      source: 'FDA Acetaminophen Prescription Dosage Limit and Liver Injury Warning (2014).',
    })
  }

  // 5. Aspirin & Pediatric Patients (AAP)
  if (age < 19) {
    warnings.push({
      severity: 'critical',
      drugCategory: 'Aspirin (Acetylsalicylic Acid)',
      interactingFactor: 'Pediatric / Adolescent Age (< 19 years)',
      clinicalReason:
        'Administering aspirin to children or teenagers recovering from viral infections (such as flu or chickenpox) is clinically linked to Reye’s syndrome, a rare but life-threatening condition involving acute encephalopathy and fatty liver failure.',
      recommendation:
        'Never administer aspirin or bismuth subsalicylate (Pepto-Bismol) to individuals under 19 without direct pediatric prescription. Use age-appropriate acetaminophen or ibuprofen liquid.',
      source: 'American Academy of Pediatrics (AAP) Committee on Infectious Diseases.',
    })
  }

  // 6. Explicit Allergy Cross-Matching
  const nsaidAllergyTerms = ['nsaid', 'ibuprofen', 'aspirin', 'advil', 'motrin', 'naproxen']
  if (containsAny(allergies, nsaidAllergyTerms)) {
    warnings.push({
      severity: 'critical',
      drugCategory: 'NSAIDs (Ibuprofen, Naproxen, Aspirin, Ketoprofen)',
      interactingFactor: `Documented Patient Allergy ("${allergies}")`,
      clinicalReason:
        'Patient profile notes an allergy or hypersensitivity to NSAIDs/aspirin. Cross-reactivity could trigger severe bronchospasm, urticaria, or anaphylaxis.',
      recommendation:
        'Strictly avoid all NSAID formulations. Verify all multi-symptom cold/flu OTC remedies before consumption to ensure no NSAID active ingredients.',
      source: 'World Allergy Organization (WAO) Drug Allergy Guidelines.',
    })
  }

  return {
    hasWarning: warnings.length > 0,
    warnings,
    disclaimer: OTC_DISCLAIMER,
  }
}
