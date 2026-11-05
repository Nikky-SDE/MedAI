import { describe, it, expect } from 'vitest';
import {
  TriageTurnResponseSchema,
  FinalReportResponseSchema,
  AISchemaValidationError,
  AIProviderError,
  AIVisionUnavailableError,
} from '@/lib/ai/schemas';

describe('AI: Zod Schemas & Structured Error Handling', () => {
  describe('TriageTurnResponseSchema', () => {
    it('validates and coerces string confidence scores into numeric certaintyScore', () => {
      const parsed = TriageTurnResponseSchema.parse({
        confidenceScore: '85',
        next_question: 'Where exactly is the pain located?',
        isEmergency: false,
      });

      expect(parsed.certaintyScore).toBe(85);
      expect(parsed.confidenceScore).toBe(85);
      expect(parsed.next_question).toBe('Where exactly is the pain located?');
      expect(parsed.isEmergency).toBe(false);
    });

    it('rejects scores outside valid 0-100 boundary', () => {
      expect(
        TriageTurnResponseSchema.safeParse({
          certaintyScore: -10,
          next_question: 'Question?',
        }).success
      ).toBe(false);

      expect(
        TriageTurnResponseSchema.safeParse({
          certaintyScore: 110,
          next_question: 'Question?',
        }).success
      ).toBe(false);
    });

    it('handles null or optional next_question gracefully', () => {
      const res = TriageTurnResponseSchema.parse({
        certaintyScore: 90,
        next_question: null,
      });
      expect(res.next_question).toBeNull();
      expect(res.certaintyScore).toBe(90);
    });
  });

  describe('FinalReportResponseSchema', () => {
    it('validates a complete clinical assessment response', () => {
      const parsed = FinalReportResponseSchema.parse({
        condition: 'Acute Viral Pharyngitis',
        confidenceLevel: 'High',
        explanation: 'Patient presents with sore throat and low-grade fever without severe signs.',
        isEmergency: false,
        otcMedicineAdvice: 'Throat lozenges and warm salt water gargles.',
        recommendation: '- Rest\n- Hydrate\n- Seek care if unable to swallow liquids',
      });

      expect(parsed.condition).toBe('Acute Viral Pharyngitis');
      expect(parsed.certaintyLevel).toBe('High');
      expect(parsed.confidenceLevel).toBe('High');
      expect(parsed.isEmergency).toBe(false);
    });

    it('maps confidenceLevel fallback to certaintyLevel', () => {
      const parsed = FinalReportResponseSchema.parse({
        condition: 'Tension Headache',
        confidenceLevel: 'Medium',
        explanation: 'Bilateral pressing sensation without migraine aura.',
        otcMedicineAdvice: 'Acetaminophen 500mg if not contraindicated.',
        recommendation: 'Rest in a quiet room.',
        isEmergency: false,
      });
      expect(parsed.certaintyLevel).toBe('Medium');
      expect(parsed.confidenceLevel).toBe('Medium');
    });

    it('fails when mandatory fields are omitted or too short', () => {
      const result = FinalReportResponseSchema.safeParse({
        condition: 'Migraine',
        // missing explanation, recommendation, etc.
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Typed Domain Errors', () => {
    it('AISchemaValidationError stores issues and raw LLM payload', () => {
      const rawText = '{"invalid": true}';
      const error = new AISchemaValidationError('Schema mismatch', rawText, [
        { message: 'Required field missing', path: ['condition'], code: 'custom' },
      ]);

      expect(error.name).toBe('AISchemaValidationError');
      expect(error.rawResponse).toBe(rawText);
      expect(error.issues).toHaveLength(1);
      expect(error.issues[0].message).toBe('Required field missing');
    });

    it('AIProviderError stores provider, status, and error details', () => {
      const error = new AIProviderError('groq', 'Rate limit exceeded', 429);
      expect(error.name).toBe('AIProviderError');
      expect(error.provider).toBe('groq');
      expect(error.statusCode).toBe(429);
      expect(error.message).toContain('[GROQ] Rate limit exceeded');
    });

    it('AIVisionUnavailableError conveys vision model requirement', () => {
      const error = new AIVisionUnavailableError('No vision model available');
      expect(error.name).toBe('AIVisionUnavailableError');
      expect(error.message).toContain('No vision model available');
    });
  });
});
