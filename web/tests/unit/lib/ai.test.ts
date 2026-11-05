import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateHealthAIResponse } from '@/lib/ai';
import { TriageTurnResponseSchema, FinalReportResponseSchema, AIVisionUnavailableError } from '@/lib/ai/schemas';

describe('AI: Inference Orchestrator & Multi-Turn Routing', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('MOCK_LLM Test Harness', () => {
    it('returns validated triage turn response when MOCK_LLM=true', async () => {
      vi.stubEnv('MOCK_LLM', 'true');

      const res = await generateHealthAIResponse({
        systemPrompt: 'You are a clinical intake assistant.',
        messages: [{ role: 'user', content: 'I have a sore throat' }],
        schema: TriageTurnResponseSchema,
      });

      expect(res.provider).toBe('groq');
      expect(res.model).toBe('mock-llm-engine');
      expect(res.data.certaintyScore).toBeGreaterThanOrEqual(0);
      expect(res.data.certaintyScore).toBeLessThanOrEqual(100);
      expect(res.data.next_question).toBeTruthy();
    });

    it('returns validated final triage report when system prompt requests assessment', async () => {
      vi.stubEnv('MOCK_LLM', 'true');

      const res = await generateHealthAIResponse({
        systemPrompt: 'You are generating the final triage report for the patient.',
        messages: [{ role: 'user', content: 'Mild cold symptoms for 2 days' }],
        schema: FinalReportResponseSchema,
      });

      expect(res.provider).toBe('groq');
      expect(res.data.condition).toBeTruthy();
      expect(res.data.certaintyLevel).toMatch(/High|Medium|Low/);
      expect(res.data.explanation).toBeTruthy();
      expect(res.data.recommendation).toBeTruthy();
    });
  });

  describe('Vision Routing & Provider Fallback Guardrails', () => {
    it('throws AIVisionUnavailableError when image is attached but Groq is text-only and Gemini key is missing', async () => {
      vi.stubEnv('MOCK_LLM', 'false');
      vi.stubEnv('GROQ_MODEL_ID', 'openai/gpt-oss-120b'); // text-only model
      vi.stubEnv('GEMINI_API_KEY', '');

      await expect(
        generateHealthAIResponse({
          systemPrompt: 'Clinical evaluation',
          messages: [{ role: 'user', content: 'Here is a photo of my skin rash' }],
          imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          mimeType: 'image/png',
        })
      ).rejects.toThrow(AIVisionUnavailableError);
    });
  });
});
