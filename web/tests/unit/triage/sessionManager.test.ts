import { describe, it, expect } from 'vitest';
import {
  extractClinicalSlots,
  evaluateSlotCompleteness,
  type TriageMessage,
} from '@/lib/triage/sessionManager';

describe('Triage: Clinical Slot Extraction & Session Completeness', () => {
  describe('extractClinicalSlots', () => {
    it('extracts onset timing, severity descriptor, and associated symptoms', () => {
      const messages: TriageMessage[] = [
        {
          role: 'user',
          content: 'I started experiencing a severe throbbing headache 2 days ago with high fever and chills',
          timestamp: new Date().toISOString(),
        },
      ];

      const slots = extractClinicalSlots(messages);
      expect(slots.onset).toBeDefined();
      expect(slots.severity).toBe('severe');
      expect(slots.associatedSymptoms).toContain('headache');
      expect(slots.associatedSymptoms).toContain('fever');
      expect(slots.associatedSymptoms).toContain('chills');
    });

    it('extracts numeric 1-10 severity scale and aggravating factors', () => {
      const messages: TriageMessage[] = [
        {
          role: 'user',
          content: 'My stomach pain is about an 8/10 on the pain scale and is much worse with moving after eating',
          timestamp: new Date().toISOString(),
        },
      ];

      const slots = extractClinicalSlots(messages);
      expect(slots.severity).toBe('8/10');
      expect(slots.aggravatingOrRelieving).toBeDefined();
    });

    it('handles empty messages gracefully without error', () => {
      const slots = extractClinicalSlots([]);
      expect(slots.onset).toBeUndefined();
      expect(slots.severity).toBeUndefined();
      expect(slots.associatedSymptoms).toBeUndefined();
      expect(slots.aggravatingOrRelieving).toBeUndefined();
    });
  });

  describe('evaluateSlotCompleteness', () => {
    it('evaluates incomplete when fewer than 2 slots filled on early turns', () => {
      const slots = { onset: 'yesterday' };
      const res = evaluateSlotCompleteness(slots, 1, 3);

      expect(res.isComplete).toBe(false);
      expect(res.filledSlots).toEqual(['onset']);
      expect(res.missingSlots).toContain('severity');
      expect(res.missingSlots).toContain('associatedSymptoms');
      expect(res.completionRatio).toBeCloseTo(1 / 3);
    });

    it('evaluates complete on turn 2 when 2 or more core slots are populated', () => {
      const slots = {
        onset: 'yesterday',
        severity: 'moderate',
      };
      const res = evaluateSlotCompleteness(slots, 2, 3);

      expect(res.isComplete).toBe(true);
      expect(res.filledSlots).toHaveLength(2);
      expect(res.missingSlots).toEqual(['associatedSymptoms']);
    });

    it('forces completion when max turns cap is reached regardless of missing slots', () => {
      const emptySlots = {};
      const res = evaluateSlotCompleteness(emptySlots, 3, 3);

      expect(res.isComplete).toBe(true);
      expect(res.filledSlots).toHaveLength(0);
      expect(res.missingSlots).toHaveLength(3);
    });
  });
});
