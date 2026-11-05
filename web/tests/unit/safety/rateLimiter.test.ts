import { describe, it, expect, vi } from 'vitest';
import {
  checkTriageRateLimit,
  checkReportRateLimit,
} from '@/lib/safety/rateLimiter';
import type { SupabaseClient } from '@supabase/supabase-js';

function createMockSupabase(count: number | null, error: Error | null = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            count,
            error: error ? { message: error.message } : null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('Safety: Database-Backed Rate Limiter', () => {
  describe('checkTriageRateLimit', () => {
    it('allows triage requests when under hourly threshold', async () => {
      const mockSupabase = createMockSupabase(12);
      const res = await checkTriageRateLimit(mockSupabase, 'user-123');

      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(18); // 30 - 12
      expect(res.resetSeconds).toBe(0);
      expect(res.reason).toBeUndefined();
    });

    it('blocks triage requests and returns 3600s reset when limit reached', async () => {
      const mockSupabase = createMockSupabase(30);
      const res = await checkTriageRateLimit(mockSupabase, 'user-123');

      expect(res.allowed).toBe(false);
      expect(res.remaining).toBe(0);
      expect(res.resetSeconds).toBe(3600);
      expect(res.reason).toContain('Hourly triage limit reached');
    });

    it('fails open when database encounters an error to preserve clinical availability', async () => {
      const mockSupabase = createMockSupabase(null, new Error('Connection timeout'));
      const res = await checkTriageRateLimit(mockSupabase, 'user-123');

      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(30);
      expect(res.resetSeconds).toBe(0);
    });
  });

  describe('checkReportRateLimit', () => {
    it('allows report creation when under daily threshold', async () => {
      const mockSupabase = createMockSupabase(4);
      const res = await checkReportRateLimit(mockSupabase, 'user-456');

      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(6); // 10 - 4
      expect(res.resetSeconds).toBe(0);
    });

    it('blocks report creation and returns 86400s reset when daily limit reached', async () => {
      const mockSupabase = createMockSupabase(10);
      const res = await checkReportRateLimit(mockSupabase, 'user-456');

      expect(res.allowed).toBe(false);
      expect(res.remaining).toBe(0);
      expect(res.resetSeconds).toBe(86400);
      expect(res.reason).toContain('Daily report limit reached');
    });

    it('fails open on database error to ensure patient access', async () => {
      const mockSupabase = createMockSupabase(null, new Error('Database unreachable'));
      const res = await checkReportRateLimit(mockSupabase, 'user-456');

      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(10);
    });
  });
});
