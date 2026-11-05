export const i18n = {
  start_assessment: { en: 'Start Assessment', hi: 'जांच शुरू करें', es: 'Iniciar evaluación', fr: 'Démarrer l\'évaluation' },
  submit_answer: { en: 'Submit Answer', hi: 'उत्तर दें', es: 'Enviar respuesta', fr: 'Soumettre la réponse' },
  generating_report: { en: 'Generating Report...', hi: 'रिपोर्ट बना रहे हैं...', es: 'Generando reporte...', fr: 'Génération du rapport...' },
  processing: { en: 'Analyzing...', hi: 'विश्लेषण हो रहा है...', es: 'Analizando...', fr: 'Analyse en cours...' },
  placeholder: { en: 'Describe your symptoms in detail...', hi: 'अपने लक्षणों का विस्तार से वर्णन करें...', es: 'Describe tus síntomas en detalle...', fr: 'Décrivez vos symptômes en détail...' },
  greeting: { en: 'How are you feeling today?', hi: 'आज आप कैसा महसूस कर रहे हैं?', es: '¿Cómo te sientes hoy?', fr: 'Comment vous sentez-vous aujourd\'hui?' },
  confidence: { en: 'Model-Reported Certainty', hi: 'मॉडल-रिपोर्टेड निश्चितता', es: 'Certeza del modelo', fr: 'Certitude du modèle' },
  triage_turn: { en: 'Triage Turn', hi: 'जांच चरण', es: 'Turno de triage', fr: 'Tour de triage' },
  target: { en: 'Target', hi: 'लक्ष्य', es: 'Objetivo', fr: 'Cible' },
  medications: { en: 'Current Medications', hi: 'वर्तमान दवाएं', es: 'Medicamentos actuales', fr: 'Médicaments actuels' },
  medications_placeholder: { en: 'e.g., Ibuprofen, Vitamin D3...', hi: 'जैसे: आइबुप्रोफेन, विटामिन D3...', es: 'ej., Ibuprofeno, Vitamina D3...', fr: 'ex., Ibuprofène, Vitamine D3...' },
  upload_photo: { en: 'Upload a Photo', hi: 'फ़ोटो अपलोड करें', es: 'Subir una Foto', fr: 'Télécharger une Photo' },
  upload_hint: { en: 'e.g., skin rash, minor injury', hi: 'जैसे: त्वचा पर दाने, छोटी चोट', es: 'ej., sarpullido, lesión leve', fr: 'ex., éruption cutanée, blessure légère' },
  triage_complete: { en: 'Triage complete. Compiling summary report...', hi: 'जांच पूरी हुई। सारांश रिपोर्ट तैयार की जा रही है...', es: 'Triaje completado. Compilando el informe de resumen...', fr: 'Triage terminé. Compilation du rapport de synthèse...' },
  new_assessment: { en: 'New Assessment', hi: 'नई जांच', es: 'Nueva evaluación', fr: 'Nouvelle évaluation' },
  past_reports: { en: 'Past Reports', hi: 'पिछली रिपोर्ट', es: 'Informes anteriores', fr: 'Rapports passés' },
  no_reports: { en: 'No reports yet', hi: 'अभी तक कोई रिपोर्ट नहीं', es: 'Sin informes aún', fr: 'Pas encore de rapports' },
  suggestions: {
    en: ['Headache', 'Fever', 'Cough', 'Fatigue', 'Stomach Ache'],
    hi: ['सिरदर्द', 'बुखार', 'खांसी', 'थकान', 'पेट दर्द'],
    es: ['Dolor de cabeza', 'Fiebre', 'Tos', 'Fatiga', 'Dolor de estómago'],
    fr: ['Mal de tête', 'Fièvre', 'Toux', 'Fatigue', 'Douleur abdominale'],
  },
}

export type I18nKey = keyof typeof i18n
export type Language = 'en' | 'hi' | 'es' | 'fr'

export function t(key: I18nKey, lang: Language): string {
  const entry = i18n[key]
  if (!entry) return key
  if (key === 'suggestions') return key // handled separately
  return (entry as Record<Language, string>)[lang] || (entry as Record<Language, string>)['en']
}

export function getSuggestions(lang: Language): string[] {
  return i18n.suggestions[lang] || i18n.suggestions.en
}
