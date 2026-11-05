import { describe, it, expect } from 'vitest';
import { t, getSuggestions, type Language } from '@/lib/i18n';

describe('i18n: Multilingual Translation Engine', () => {
  it('translates strings correctly across all 4 supported locales', () => {
    const locales: Language[] = ['en', 'hi', 'es', 'fr'];
    for (const lang of locales) {
      expect(t('start_assessment', lang)).toBeTruthy();
      expect(t('confidence', lang)).toBeTruthy();
      expect(t('submit_answer', lang)).toBeTruthy();
    }
  });

  it('falls back to English when a translation is missing or language unknown', () => {
    expect(t('start_assessment', 'de' as unknown as Language)).toBe('Start Assessment');
    expect(t('confidence', 'zh' as unknown as Language)).toBe('Model-Reported Certainty');
  });

  it('provides safe localized symptom suggestions without emergency triggers', () => {
    const enSuggestions = getSuggestions('en');
    expect(enSuggestions).toContain('Cough');
    expect(enSuggestions).toContain('Headache');
    // Verify emergency red-flags like Chest Pain are purged from suggestion chips
    expect(enSuggestions).not.toContain('Chest Pain');

    expect(getSuggestions('hi')).toContain('खांसी');
    expect(getSuggestions('es')).toContain('Tos');
    expect(getSuggestions('fr')).toContain('Toux');
  });
});
