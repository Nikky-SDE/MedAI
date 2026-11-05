import { describe, it, expect } from 'vitest';
import { checkOTCInteractions } from '@/lib/safety/otcInteractions';

describe('Safety: Curated OTC Interaction & Contraindication Rules', () => {
  it('flags NSAIDs as critical contraindication during pregnancy (FDA 2020)', () => {
    const res = checkOTCInteractions({ isPregnant: true });
    expect(res.hasWarning).toBe(true);
    const nsaidWarn = res.warnings.find((w) => w.drugCategory.toLowerCase().includes('nsaid'));
    expect(nsaidWarn).toBeDefined();
    expect(nsaidWarn?.severity).toBe('critical');
    expect(nsaidWarn?.interactingFactor).toBe('Pregnancy');
  });

  it('flags NSAIDs when patient takes anticoagulants / blood thinners (ACG 2017)', () => {
    const res = checkOTCInteractions({
      medications: ['Warfarin 5mg daily', 'Multivitamin'],
    });
    expect(res.hasWarning).toBe(true);
    const warn = res.warnings.find((w) => w.interactingFactor.includes('Anticoagulant'));
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('critical');
    expect(warn?.clinicalReason).toContain('hemorrhage');
  });

  it('flags oral decongestants for patients with hypertension (AHA 2017)', () => {
    const res = checkOTCInteractions({
      medicalHistory: 'Hypertension, high blood pressure',
      medications: ['Lisinopril 10mg'],
    });
    expect(res.hasWarning).toBe(true);
    const decongestantWarn = res.warnings.find((w) =>
      w.drugCategory.toLowerCase().includes('decongestant')
    );
    expect(decongestantWarn).toBeDefined();
    expect(decongestantWarn?.severity).toBe('warning');
    expect(decongestantWarn?.clinicalReason).toContain('blood pressure');
  });

  it('flags Aspirin in pediatric patients (<19) to prevent Reye syndrome (AAP guidelines)', () => {
    const res = checkOTCInteractions({ age: 14 });
    expect(res.hasWarning).toBe(true);
    const aspirinWarn = res.warnings.find((w) => w.drugCategory.toLowerCase().includes('aspirin'));
    expect(aspirinWarn).toBeDefined();
    expect(aspirinWarn?.severity).toBe('critical');
    expect(aspirinWarn?.clinicalReason).toContain('Reye');
  });

  it('flags Acetaminophen warnings when patient has liver disease or hepatic impairment', () => {
    const res = checkOTCInteractions({
      medicalHistory: 'Hepatitis B, cirrhosis, chronic liver failure',
    });
    expect(res.hasWarning).toBe(true);
    const apapWarn = res.warnings.find((w) =>
      w.drugCategory.toLowerCase().includes('acetaminophen')
    );
    expect(apapWarn).toBeDefined();
    expect(apapWarn?.severity).toBe('warning');
    expect(apapWarn?.clinicalReason).toContain('hepatic');
  });

  it('returns no warnings for a healthy young adult with normal bp and no contraindicated meds', () => {
    const res = checkOTCInteractions({
      age: 26,
      isPregnant: false,
      medications: ['Artificial tears'],
      medicalHistory: 'Normal bp, healthy status',
    });
    expect(res.hasWarning).toBe(false);
    expect(res.warnings).toHaveLength(0);
  });
});
