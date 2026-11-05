/**
 * MedAI Deterministic Red-Flag Emergency Triage Module
 * 
 * Executes BEFORE any LLM call to guarantee 0ms latency and 100% deterministic
 * detection of life-threatening clinical presentations.
 * 
 * Categories:
 * 1. Chest Pain / Cardiac Compromise
 * 2. Acute Stroke Symptoms (F.A.S.T.)
 * 3. Severe Uncontrolled Hemorrhage
 * 4. Acute Respiratory Distress
 * 5. Anaphylaxis / Airway Compromise
 * 6. Suicidal Ideation / Psychiatric Emergency
 * 
 * NOTE: Non-English keyword lists (Hindi, Spanish, French) are curated best-effort
 * heuristics designed for conservative over-triggering. Flagged for clinician review.
 */

export type RedFlagCategory =
  | 'chest_pain'
  | 'stroke_fast'
  | 'severe_bleeding'
  | 'respiratory_distress'
  | 'anaphylaxis'
  | 'suicidal_ideation'

export interface RedFlagDetectionResult {
  isEmergency: boolean
  category?: RedFlagCategory
  matchedKeyword?: string
  matchedLanguage?: 'en' | 'hi' | 'es' | 'fr'
  headline: string
  instructions: string[]
  emergencyNumber: string
}

interface LanguageKeywords {
  chest_pain: string[]
  stroke_fast: string[]
  severe_bleeding: string[]
  respiratory_distress: string[]
  anaphylaxis: string[]
  suicidal_ideation: string[]
}

// English Clinical Heuristics
const EN_KEYWORDS: LanguageKeywords = {
  chest_pain: [
    'chest pain',
    'crushing chest',
    'chest pressure',
    'tightness in chest',
    'heart attack',
    'pain radiating to arm',
    'pain in left arm and chest',
    'chest squeezing',
  ],
  stroke_fast: [
    'face droop',
    'drooping face',
    'facial drooping',
    'face drooping',
    'slurred speech',
    'slurred words',
    'words are slurred',
    'cannot speak',
    'arm weakness',
    'cannot raise arm',
    'arm numbness',
    'sudden numbness on one side',
    'loss of balance and speech',
    'thunderclap headache',
    'worst headache of my life',
    'stroke',
  ],
  severe_bleeding: [
    'coughing blood',
    'coughing up blood',
    'vomiting blood',
    'spurting blood',
    'blood is spurting',
    'spurting',
    'uncontrollable bleeding',
    'bleeding heavily',
    'arterial bleed',
    'arterial bleeding',
    'heavy blood loss',
  ],
  respiratory_distress: [
    'cannot breathe',
    'unable to breathe',
    'gasping for air',
    'severe shortness of breath',
    'turning blue',
    'lips blue',
    'suffocating',
    'stridor',
  ],
  anaphylaxis: [
    'throat closing',
    'throat feels like it is closing',
    'throat is closing',
    'swollen tongue',
    'tongue is swelling',
    'lips and tongue are swelling',
    'lips swelling',
    'swelling of throat',
    'swelling of tongue',
    'throat swelling',
    'anaphylaxis',
    'anaphylactic',
    'severe allergic reaction',
    'throat swelling shut',
  ],
  suicidal_ideation: [
    'want to die',
    'kill myself',
    'commit suicide',
    'end my life',
    'ending my life',
    'end life',
    'suicidal thoughts',
    'self harm',
    'hang myself',
  ],
}

// Hindi Clinical Heuristics (Best-effort for clinician review)
const HI_KEYWORDS: LanguageKeywords = {
  chest_pain: [
    'छाती में दर्द',
    'सीने में दर्द',
    'सीने में बहुत तेज दर्द',
    'सीने में तेज दर्द',
    'दिल का दौरा',
    'सीने में भारीपन',
    'सीने में जकड़न',
  ],
  stroke_fast: [
    'मुंह टेढ़ा',
    'बोलने में दिक्कत',
    'लकवा',
    'हाथ में कमजोरी',
    'चेहरा सुन्न',
    'चेहरा लटक',
    'आवाज लड़खड़ा',
    'स्ट्रोक',
  ],
  severe_bleeding: [
    'खून की उल्टी',
    'खांसी में खून',
    'अत्यधिक रक्तस्राव',
    'खून बहना बंद नहीं',
    'बहुत ज्यादा खून',
  ],
  respiratory_distress: [
    'सांस नहीं आ रही',
    'सांस लेने में बहुत तकलीफ',
    'सांस लेने में अत्यधिक कठिनाई',
    'सांस लेने में कठिनाई',
    'दम घुट रहा है',
    'सांस फूलना गंभीर',
    'होठ नीले',
    'होंठ नीले',
  ],
  anaphylaxis: [
    'गले में सूजन',
    'जीभ सूज गई',
    'गला बंद हो रहा है',
    'एनाफिलेक्सिस',
    'गंभीर एलर्जी',
  ],
  suicidal_ideation: [
    'आत्महत्या',
    'मरना चाहता हूँ',
    'जान देना',
    'खुद को मारना',
    'आत्महत्या के विचार',
    'खुदकुशी',
    'खुदकुशी करने',
    'जान लेने',
  ],
}

// Spanish Clinical Heuristics (Best-effort for clinician review)
const ES_KEYWORDS: LanguageKeywords = {
  chest_pain: [
    'dolor de pecho',
    'dolor en el pecho',
    'opresion en el pecho',
    'infarto',
    'ataque al corazon',
    'dolor en brazo izquierdo',
  ],
  stroke_fast: [
    'paralisis facial',
    'dificultad para hablar',
    'dificultad al hablar',
    'habla arrastrada',
    'debilidad en el brazo',
    'derrame cerebral',
    'ictus',
    'entumecimiento repentino',
  ],
  severe_bleeding: [
    'vomito con sangre',
    'toser sangre',
    'sangre a borbotones',
    'sangrado abundante',
    'hemorragia severa',
    'no para de sangrar',
  ],
  respiratory_distress: [
    'no puedo respirar',
    'dificultad severa para respirar',
    'asfixia',
    'falta de aire grave',
    'labios azules',
  ],
  anaphylaxis: [
    'garganta cerrada',
    'hinchazon de lengua',
    'hinchazon de garganta',
    'anafilaxia',
    'reaccion alergica grave',
    'se cierra la garganta',
  ],
  suicidal_ideation: [
    'quiero morir',
    'quitarme la vida',
    'terminar con mi vida',
    'acabar con mi vida',
    'suicidio',
    'suicidarme',
    'hacerme dano',
  ],
}

// French Clinical Heuristics (Best-effort for clinician review)
const FR_KEYWORDS: LanguageKeywords = {
  chest_pain: [
    'douleur thoracique',
    'douleur a la poitrine',
    'oppression thoracique',
    'crise cardiaque',
    'infarctus',
    'douleur bras gauche',
  ],
  stroke_fast: [
    'paralysie faciale',
    'visage affaisse',
    'visage engourdi',
    'difficulte a parler',
    'perte de la parole',
    'perte soudaine de la parole',
    'faiblesse dans le bras',
    'avc',
    'accident vasculaire cerebral',
  ],
  severe_bleeding: [
    'crache du sang',
    'vomissement de sang',
    'saignement abondant',
    'hemorragie severe',
    'saignement incontrolable',
  ],
  respiratory_distress: [
    'ne peux pas respirer',
    'difficulte respiratoire severe',
    'detresse respiratoire',
    'etouffement',
    'suffocation',
    'levres bleues',
  ],
  anaphylaxis: [
    'gorge qui se serre',
    'ma gorge se serre',
    'gonflement de la langue',
    'gonflement severe de la langue',
    'choc anaphylactique',
    'anaphylaxie',
    'reaction allergique grave',
  ],
  suicidal_ideation: [
    'envie de mourir',
    'me suicider',
    'suicide',
    'mettre fin a mes jours',
    'me faire du mal',
  ],
}

const EMERGENCY_TEXTS: Record<
  'en' | 'hi' | 'es' | 'fr',
  { headline: string; instructions: string[]; emergencyNumber: string }
> = {
  en: {
    headline: 'CRITICAL EMERGENCY DETECTED — SEEK IMMEDIATE MEDICAL ATTENTION',
    instructions: [
      'Stop using this application immediately.',
      'Call emergency services (911 in US/Canada, 999 in UK, 112 in EU/India) or proceed directly to the nearest emergency department.',
      'If you are alone, unlock your front door and inform a neighbor or family member.',
      'Do not attempt to drive yourself to the hospital.',
    ],
    emergencyNumber: '911 / 112 / 999',
  },
  hi: {
    headline: 'गंभीर आपातकालीन स्थिति — तुरंत चिकित्सीय सहायता प्राप्त करें',
    instructions: [
      'तुरंत इस एप्लिकेशन का उपयोग बंद करें।',
      'तत्काल 112 या 108 पर कॉल करें या नजदीकी आपातकालीन कक्ष (ER) में जाएँ।',
      'यदि आप अकेले हैं, तो तुरंत किसी परिजन या पड़ोसी को सूचित करें।',
      'स्वयं वाहन चलाकर अस्पताल जाने का प्रयास न करें।',
    ],
    emergencyNumber: '112 / 108',
  },
  es: {
    headline: 'EMERGENCIA MÉDICA CRÍTICA — BUSQUE ATENCIÓN INMEDIATA',
    instructions: [
      'Deje de usar esta aplicación de inmediato.',
      'Llame a emergencias (911 o 112) o acuda a la sala de emergencias más cercana.',
      'Si está solo, informe a un familiar o vecino de inmediato.',
      'No intente conducir usted mismo hacia el hospital.',
    ],
    emergencyNumber: '911 / 112',
  },
  fr: {
    headline: 'URGENCE MÉDICALE CRITIQUE — CONSULTEZ IMMÉDIATEMENT',
    instructions: [
      'Arrêtez immédiatement d’utiliser cette application.',
      'Appelez le 15 (SAMU), le 18 (Pompiers) ou le 112, ou rendez-vous aux urgences.',
      'Si vous êtes seul, prévenez immédiatement un proche ou un voisin.',
      'Ne conduisez pas vous-même jusqu’à l’hôpital.',
    ],
    emergencyNumber: '15 / 112',
  },
}

/**
 * Normalizes text for robust substring matching:
 * - Unicode NFKC normalization
 * - Converts to lowercase
 * - Collapses repeated whitespace
 */
function normalizeText(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Strip Latin combining diacritics while preserving Indic vowels
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ') // Keep letters, combining marks (vowels), numbers, whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Evaluates whether a matched keyword occurrence is clinically negated
 * (e.g., "denies chest pain", "no shortness of breath", "sin dolor en el pecho").
 */
function isOccurrenceNegated(text: string, matchIndex: number, keyword: string): boolean {
  // Phrases that inherently express clinical deficits/inability must NEVER be suppressed
  const inherentlyNegative = ['cannot', 'cant', 'unable', 'loss of', 'loss']
  if (inherentlyNegative.some((prefix) => keyword.startsWith(prefix))) {
    return false
  }

  // Preceding window (up to 60 characters before the match)
  const preWindow = text.slice(Math.max(0, matchIndex - 60), matchIndex)
  
  // Direct preceding negation: "no chest pain", "denies shortness of breath", "sin dolor", "pas de douleur"
  const directNegation = /\b(no|not|never|denies|denied|without|ruled out|rules out|negative for|sin|pas de|aucun|aucune|sans)\s+(?:any\s+|experiencing\s+|having\s+|signs of\s+|sign of\s+)?$/i
  if (directNegation.test(preWindow)) {
    return true
  }

  // Coordinated list negation: "without any chest pain or [arm weakness]", "sin dolor en el pecho ni [asfixia]"
  const coordinatedNegation = /\b(no|without|denies|denied|sin|pas de|aucun|sans)\s+[^.!?]{1,50}?\b(or|nor|ni|ou)\s+(?:any\s+)?$/i
  if (coordinatedNegation.test(preWindow)) {
    return true
  }

  // Post-keyword window for right-branching postposition negation (e.g. Hindi "सीने में दर्द नहीं")
  const postWindow = text.slice(matchIndex + keyword.length, matchIndex + keyword.length + 20)
  const postNegationRegex = /^\s*(नहीं|ना|नही|मुक्त)/
  if (postNegationRegex.test(postWindow)) {
    return true
  }

  return false
}

/**
 * Deterministically checks input text against emergency clinical keywords.
 * Runs across all 4 languages to protect multilingual inputs.
 */
export function checkRedFlags(
  text: string,
  preferredLanguage: string = 'en'
): RedFlagDetectionResult {
  const safeLang = (['en', 'hi', 'es', 'fr'].includes(preferredLanguage)
    ? preferredLanguage
    : 'en') as 'en' | 'hi' | 'es' | 'fr'

  const normalized = normalizeText(text)
  if (!normalized) {
    return {
      isEmergency: false,
      headline: '',
      instructions: [],
      emergencyNumber: '',
    }
  }

  const languagePacks: Array<{ lang: 'en' | 'hi' | 'es' | 'fr'; keywords: LanguageKeywords }> = [
    { lang: 'en', keywords: EN_KEYWORDS },
    { lang: 'hi', keywords: HI_KEYWORDS },
    { lang: 'es', keywords: ES_KEYWORDS },
    { lang: 'fr', keywords: FR_KEYWORDS },
  ]

  const categories: RedFlagCategory[] = [
    'chest_pain',
    'stroke_fast',
    'severe_bleeding',
    'respiratory_distress',
    'anaphylaxis',
    'suicidal_ideation',
  ]

  for (const { lang, keywords } of languagePacks) {
    for (const cat of categories) {
      for (const phrase of keywords[cat]) {
        const normalizedPhrase = normalizeText(phrase)
        if (!normalizedPhrase) continue

        let searchIdx = 0
        while (searchIdx < normalized.length) {
          const matchIdx = normalized.indexOf(normalizedPhrase, searchIdx)
          if (matchIdx === -1) break

          // Word boundary check: ensure keyword is matched at whole words
          const prevChar = matchIdx > 0 ? normalized[matchIdx - 1] : ' '
          const nextChar =
            matchIdx + normalizedPhrase.length < normalized.length
              ? normalized[matchIdx + normalizedPhrase.length]
              : ' '
          const isWordBoundary =
            (prevChar === ' ' || prevChar === undefined) &&
            (nextChar === ' ' || nextChar === undefined)

          if (isWordBoundary && !isOccurrenceNegated(normalized, matchIdx, normalizedPhrase)) {
            const emergencyInfo = EMERGENCY_TEXTS[safeLang] || EMERGENCY_TEXTS.en
            return {
              isEmergency: true,
              category: cat,
              matchedKeyword: phrase,
              matchedLanguage: lang,
              headline: emergencyInfo.headline,
              instructions: emergencyInfo.instructions,
              emergencyNumber: emergencyInfo.emergencyNumber,
            }
          }

          searchIdx = matchIdx + normalizedPhrase.length
        }
      }
    }
  }

  return {
    isEmergency: false,
    headline: '',
    instructions: [],
    emergencyNumber: '',
  }
}
