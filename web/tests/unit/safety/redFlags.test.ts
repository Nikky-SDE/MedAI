import { describe, it, expect } from 'vitest';
import { checkRedFlags } from '@/lib/safety/redFlags';

describe('Safety: Deterministic Red-Flag Triage Engine', () => {
  describe('English (en) Red Flags', () => {
    it('detects acute cardiac red flags (chest pain, crushing chest, heart attack)', () => {
      const res1 = checkRedFlags('I have sudden crushing chest pain radiating to arm', 'en');
      expect(res1.isEmergency).toBe(true);
      expect(res1.category).toBe('chest_pain');

      const res2 = checkRedFlags('Feeling severe tightness in chest and chest pressure', 'en');
      expect(res2.isEmergency).toBe(true);
      expect(res2.category).toBe('chest_pain');
    });

    it('detects acute neurological / stroke signs (FAST criteria)', () => {
      const res1 = checkRedFlags('Patient has sudden slurred speech and drooping face', 'en');
      expect(res1.isEmergency).toBe(true);
      expect(res1.category).toBe('stroke_fast');

      const res2 = checkRedFlags('Sudden arm weakness and cannot speak', 'en');
      expect(res2.isEmergency).toBe(true);
      expect(res2.category).toBe('stroke_fast');
    });

    it('detects acute respiratory distress', () => {
      const res = checkRedFlags('Cannot breathe and lips blue, severe shortness of breath', 'en');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('respiratory_distress');
    });

    it('detects acute anaphylaxis / severe allergic response', () => {
      const res = checkRedFlags('Patient experiencing anaphylaxis with swollen tongue', 'en');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('anaphylaxis');
    });

    it('detects acute suicidal ideation or self-harm crisis', () => {
      const res = checkRedFlags('I have active thoughts of wanting to end my life', 'en');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('suicidal_ideation');
    });

    it('detects severe hemorrhaging / uncontrolled bleeding', () => {
      const res = checkRedFlags('Patient is vomiting blood and coughing up blood', 'en');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('severe_bleeding');
    });
  });

  describe('Multilingual Red Flags (Best-Effort)', () => {
    it('detects cardiac emergency in Hindi', () => {
      const res = checkRedFlags('मरीज को सीने में दर्द और भारीपन महसूस हो रहा है', 'hi');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('chest_pain');
    });

    it('detects respiratory emergency in Spanish', () => {
      const res = checkRedFlags('Tengo dificultad severa para respirar y me falta el aire', 'es');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('respiratory_distress');
    });

    it('detects anaphylaxis in French', () => {
      const res = checkRedFlags('Ma gorge se serre et j ai un gonflement de la langue', 'fr');
      expect(res.isEmergency).toBe(true);
      expect(res.category).toBe('anaphylaxis');
    });
  });

  describe('Negative Controls (Benign Symptoms)', () => {
    it('does not trigger emergency on common mild symptoms', () => {
      expect(checkRedFlags('I have a mild runny nose and slight scratchy throat', 'en').isEmergency).toBe(false);
      expect(checkRedFlags('Slight headache after staring at a computer screen all day', 'en').isEmergency).toBe(false);
      expect(checkRedFlags('I stubbed my toe on the coffee table and it is bruised', 'en').isEmergency).toBe(false);
      expect(checkRedFlags('Minor dry skin patch on elbow', 'en').isEmergency).toBe(false);
    });

    it('handles edge cases gracefully', () => {
      expect(checkRedFlags('', 'en').isEmergency).toBe(false);
      expect(checkRedFlags('   ', 'en').isEmergency).toBe(false);
      // Fallback to English keywords when unknown locale provided
      expect(checkRedFlags('severe chest pain', 'de' as unknown as 'en').isEmergency).toBe(true);
    });
  });
});
