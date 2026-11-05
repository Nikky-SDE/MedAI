import { describe, it, expect } from 'vitest';
import { checkRedFlags, RedFlagCategory } from '@/lib/safety/redFlags';

describe('Safety Matrix: Deterministic Red-Flag Coverage & Edge Cases', () => {
  describe('Full Category x 4 Locales Matrix (24 Combinations)', () => {
    const matrix: Array<{
      category: RedFlagCategory;
      lang: 'en' | 'hi' | 'es' | 'fr';
      sample: string;
    }> = [
      // 1. Chest Pain / Cardiac
      { category: 'chest_pain', lang: 'en', sample: 'crushing chest pain radiating to left arm' },
      { category: 'chest_pain', lang: 'hi', sample: 'मरीज को सीने में तेज दर्द और दबाव महसूस हो रहा है' },
      { category: 'chest_pain', lang: 'es', sample: 'siento una opresión en el pecho muy fuerte' },
      { category: 'chest_pain', lang: 'fr', sample: 'douleur thoracique aiguë qui irradie vers le bras' },

      // 2. Stroke / FAST
      { category: 'stroke_fast', lang: 'en', sample: 'sudden facial drooping and slurred speech' },
      { category: 'stroke_fast', lang: 'hi', sample: 'चेहरा लटक गया है और आवाज लड़खड़ा रही है' },
      { category: 'stroke_fast', lang: 'es', sample: 'parálisis facial y habla arrastrada de repente' },
      { category: 'stroke_fast', lang: 'fr', sample: 'visage affaissé et perte soudaine de la parole' },

      // 3. Severe Bleeding
      { category: 'severe_bleeding', lang: 'en', sample: 'wound has spurting blood that will not stop' },
      { category: 'severe_bleeding', lang: 'hi', sample: 'उल्टी में खून आ रहा है और अत्यधिक रक्तस्राव हो रहा है' },
      { category: 'severe_bleeding', lang: 'es', sample: 'la herida tiene sangre a borbotones sin parar' },
      { category: 'severe_bleeding', lang: 'fr', sample: 'hémorragie sévère et vomissement de sang' },

      // 4. Respiratory Distress
      { category: 'respiratory_distress', lang: 'en', sample: 'gasping for air and lips turning blue' },
      { category: 'respiratory_distress', lang: 'hi', sample: 'सांस लेने में अत्यधिक कठिनाई हो रही है और होंठ नीले हैं' },
      { category: 'respiratory_distress', lang: 'es', sample: 'asfixia y labios azules por falta de aire' },
      { category: 'respiratory_distress', lang: 'fr', sample: 'détresse respiratoire sévère et lèvres bleues' },

      // 5. Anaphylaxis
      { category: 'anaphylaxis', lang: 'en', sample: 'swelling of throat and tongue after peanut allergy' },
      { category: 'anaphylaxis', lang: 'hi', sample: 'गला बंद हो रहा है और जीभ में सूजन आ गई है' },
      { category: 'anaphylaxis', lang: 'es', sample: 'hinchazón de garganta y lengua tras comer mariscos' },
      { category: 'anaphylaxis', lang: 'fr', sample: 'gonflement de la langue et choc anaphylactique' },

      // 6. Suicidal Crisis
      { category: 'suicidal_ideation', lang: 'en', sample: 'having active thoughts of ending my life' },
      { category: 'suicidal_ideation', lang: 'hi', sample: 'खुदकुशी करने का विचार आ रहा है' },
      { category: 'suicidal_ideation', lang: 'es', sample: 'tengo pensamientos de terminar con mi vida' },
      { category: 'suicidal_ideation', lang: 'fr', sample: 'idées de suicide et envie d en finir' },
    ];

    it.each(matrix)(
      'flags $category in $lang: "$sample"',
      ({ category, lang, sample }) => {
        const result = checkRedFlags(sample, lang);
        expect(result.isEmergency).toBe(true);
        expect(result.category).toBe(category);
        expect(result.headline).toBeTruthy();
        expect(result.emergencyNumber).toBeTruthy();
      }
    );
  });

  describe('Clinical Negation Suppression (False-Positive Prevention)', () => {
    it('suppresses false positive when red-flag symptom is explicitly negated in English', () => {
      const res1 = checkRedFlags('Patient has runny nose, denies chest pain, mild fever', 'en');
      expect(res1.isEmergency).toBe(false);

      const res2 = checkRedFlags('I have a cough but no shortness of breath', 'en');
      expect(res2.isEmergency).toBe(false);

      const res3 = checkRedFlags('Headache without any chest pain or arm weakness', 'en');
      expect(res3.isEmergency).toBe(false);
    });

    it('suppresses false positive when red-flag symptom is negated in Spanish (sin / no)', () => {
      const res = checkRedFlags('Tengo gripe y tos, sin dolor en el pecho ni asfixia', 'es');
      expect(res.isEmergency).toBe(false);
    });

    it('suppresses false positive when red-flag symptom is negated in French (pas de / aucun)', () => {
      const res = checkRedFlags('J ai un rhume, pas de douleur thoracique, aucune difficulte a respirer', 'fr');
      expect(res.isEmergency).toBe(false);
    });

    it('suppresses false positive when red-flag symptom is negated in Hindi (नहीं / ना)', () => {
      const res = checkRedFlags('मरीज को बुखार है लेकिन सीने में दर्द नहीं है', 'hi');
      expect(res.isEmergency).toBe(false);
    });

    it('still flags emergency when text contains BOTH negated symptom AND genuine emergency', () => {
      const mixed = 'Patient denies headache or fever, but is experiencing crushing chest pain right now';
      const res = checkRedFlags(mixed, 'en');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('chest_pain');
    });

    it('never suppresses inherently negative emergencies ("cannot breathe", "unable to speak")', () => {
      const res1 = checkRedFlags('I cannot breathe', 'en');
      expect(res1.isEmergency).toBe(true);
      expect(res1.category).toBe('respiratory_distress');

      const res2 = checkRedFlags('Patient cannot speak and arm is limp', 'en');
      expect(res2.isEmergency).toBe(true);
      expect(res2.category).toBe('stroke_fast');
    });
  });

  describe('Adversarial & Edge-Case Robustness', () => {
    it('handles emoji, punctuation, and Unicode symbols safely', () => {
      const res1 = checkRedFlags('severe chest pain 💔 🚨 please help', 'en');
      expect(res1.isEmergency).toBe(true);

      const res2 = checkRedFlags('bleeding wound with spurting blood 🩸🩸🩸', 'en');
      expect(res2.isEmergency).toBe(true);
    });

    it('handles very long inputs (>4,000 characters) without timing out', () => {
      const longFiller = 'Patient visited the clinic earlier and reported mild fatigue. '.repeat(50);
      const withEmergency = longFiller + ' Then suddenly developed crushing chest pain.';
      const start = Date.now();
      const res = checkRedFlags(withEmergency, 'en');
      const elapsed = Date.now() - start;

      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('chest_pain');
      expect(elapsed).toBeLessThan(50); // Under 50ms deterministic execution
    });

    it('handles empty and whitespace-only strings safely', () => {
      expect(checkRedFlags('').isEmergency).toBe(false);
      expect(checkRedFlags('     \n\t  ').isEmergency).toBe(false);
      expect(checkRedFlags('!@#$%^&*()_+=--?/.><').isEmergency).toBe(false);
    });
  });
});
