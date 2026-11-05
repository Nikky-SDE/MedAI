# MedAI Resume Facts & Portfolio Talking Points

> **Portfolio Verification Reference** · Last Updated: 2026-11-05  
> **Truth Over Polish**: Every bullet point, performance metric, and safety claim in this document is verified directly against repository source code and empirical benchmark runs.

---

## 1. Project Summaries

### One-Line Elevator Pitch
> *"Engineered an AI-assisted medical symptom triage and regional healthcare mapping platform using Next.js 16 App Router, TypeScript, and Supabase, featuring deterministic multilingual red-flag detection and multi-tier model fallback."*

### Three-Line Portfolio Summary
> *"MedAI is a full-stack clinical triage platform that guides patients through an adaptive, server-owned symptom clarification loop before compiling structured assessments and mapping nearby verified clinics.*  
> *Built with defense-in-depth safety, the system enforces pre-LLM emergency detection (100% recall across 40 clinical vignettes), curated OTC contraindication checks, and database-backed rate limiting.*  
> *Optimized for performance with client-side canvas EXIF stripping (96% upload reduction) and ~1.1km coordinate grid caching (<5ms Overpass lookup)."*

---

## 2. Defensible Resume Bullet Points (Copy & Paste Ready)

Select 3–4 bullets tailored to the target role:

### For Full-Stack / Software Engineering (SDE) Roles:
- **Server-Owned Triage Architecture**: Architected a server-owned multi-turn triage state machine in Next.js 16 App Router and PostgreSQL, replacing vulnerable client-side transcripts with structured clinical slot extraction (onset, severity, symptoms) and eliminating client tampering (`web/src/app/api/triage/route.ts`, `lib/triage/sessionManager.ts`).
- **Asset & Bundle Optimization**: Cut landing page First Load JS by **95.5% (220 KB ➔ 9.8 KB)** by replacing `framer-motion` with native Tailwind CSS, and isolated the 1.09 MB MapLibre GL bundle behind dynamic code-splitting boundaries (`web/src/app/HeroVisual.tsx`, `docs/PERFORMANCE.md`).
- **Client-Side Image Compression & Privacy**: Engineered pre-upload HTML5 Canvas rasterization that downscales mobile photos to max 1280px and strips embedded EXIF GPS/device metadata, reducing typical payload sizes by **96% (10 MB ➔ 200 KB)** and preventing patient geolocation leaks (`web/src/app/dashboard/ImageUpload.tsx`).
- **High-Throughput Geo Caching Proxy**: Relocated client-side Overpass API queries to a server-side route handler with 2-decimal coordinate rounding (~1.1km grid buckets) and 1-hour in-memory TTL caching, slashing repeated facility lookup latency from **~2,500ms to < 5ms** (`web/src/app/api/clinics/route.ts`).
- **Database Security & Immutability**: Hardened PostgreSQL RLS policies with `WITH CHECK` clauses and authored trigger functions blocking client tampering with immutable report verdicts (`is_emergency`, `ai_response`), while securing clinical photos via private storage and 1-hour signed URLs (`web/supabase/migrations/001_security_hardening.sql`).
- **Continuous Integration & Test Coverage**: Established an 87-test Vitest unit and safety suite achieving **>95% line coverage** (100% on `redFlags.ts`), integrated with 14 Playwright E2E tests and a GitHub Actions CI pipeline (`web/vitest.config.mts`, `web/playwright.config.ts`, `.github/workflows/ci.yml`).

### For AI / Machine Learning Engineering Roles:
- **Deterministic Red-Flag Triage Engine**: Built an algorithmic emergency detection engine executing *before* any LLM call across 4 languages (English, Hindi, Spanish, French), achieving **100% Emergency Recall (10/10)** across acute cardiac, stroke (FAST), respiratory, and anaphylaxis presentations with **0ms LLM latency** (`web/src/lib/safety/redFlags.ts`, `docs/EVAL.md`).
- **Multi-Tier AI Fallback Chain**: Implemented an env-driven model routing chain using Groq (`openai/gpt-oss-120b`) with automated fallback to Google Gemini (`gemini-2.5-flash`), featuring automatic vision routing for clinical photos, transient backoff retry, and structured Zod schema validation with single-turn correction retries (`web/src/lib/ai.ts`).
- **Clinical Evaluation & Benchmarking Suite**: Authored a 40-vignette multilingual clinical evaluation dataset and automated evaluation pipeline measuring Emergency Recall, Specificity, 4x4 confusion matrix, and p50/p95 latencies (`eval/run-eval.test.ts`, `docs/EVAL.md`).
- **Curated Drug Interaction Guardian**: Developed deterministic rule-based OTC interaction checks incorporating FDA 2020 pregnancy NSAID contraindications, ACG 2017 anticoagulant GI bleeding warnings, AHA 2017 decongestant hypertension risks, and pediatric aspirin Reye syndrome guidelines (`web/src/lib/safety/otcInteractions.ts`).

---

## 3. Verified Repository Facts & Citations

| Claim / Metric | Verified Fact | Source File Citation |
|---|---|---|
| **Next.js Version** | Next.js 16.4.3 (Webpack mode) | `web/package.json:17`, `web/next.config.ts` |
| **React Version** | React 19.2.4 | `web/package.json:19` |
| **Primary AI Provider** | Groq Cloud API (`openai/gpt-oss-120b`) | `web/src/lib/ai.ts:46,267` |
| **Fallback AI Provider** | Google Gemini (`gemini-2.5-flash`) | `web/src/lib/ai.ts:41-44` |
| **Mapping Library** | MapLibre GL 6.16 + react-map-gl (OpenStreetMap / Overpass) | `web/package.json:16,21`, `web/src/app/report/[id]/NearbyClinicsMap.tsx` |
| **Landing Page Bundle Size** | **9.8 KB** (Down from 220 KB in Phase 0; -95.5%) | `docs/PERFORMANCE.md:28`, `web/.next/static/chunks/app/page-*.js` |
| **Image Compression** | Max dimension 1280px, ~96% size reduction, EXIF stripped | `web/src/app/dashboard/ImageUpload.tsx:48-84` |
| **Overpass Lookup Latency** | < 5 ms on cache hit (1-hour memory grid cache) | `web/src/app/api/clinics/route.ts:25-36`, `docs/PERFORMANCE.md` |
| **Unit & Safety Test Suite** | **87 tests passing**, 10 test suites (+ 14 Playwright E2E tests) | `web/tests/unit/`, `eval/run-eval.test.ts`, `web/tests/e2e/` |
| **Core Safety Line Coverage** | **> 95%** across safety, triage, schemas, and context | `docs/PROGRESS.md:112-124` |
| **Emergency Recall** | **100.0%** (10/10 emergencies detected in 40-vignette eval) | `docs/EVAL.md:19`, `eval/run-eval.test.ts` |
| **Rate Limiter Thresholds** | 30 triage calls/hr, 10 reports/day (PostgreSQL-backed) | `web/src/lib/safety/rateLimiter.ts:19-20` |

---

## 4. CLAIMS YOU MUST NEVER MAKE (The "Do Not Claim" List)

To maintain 100% credibility during technical interviews, **NEVER** use the following fabricated or unsupported claims:

1. ❌ **DO NOT CLAIM "94.8% diagnostic accuracy"**:
   - *Why*: The original template had hardcoded marketing text. MedAI is a preliminary triage demonstration, not an FDA-cleared diagnostic medical device. State instead: *"Evaluated across 40 clinical vignettes achieving 100% emergency recall."*
2. ❌ **DO NOT CLAIM "12,000+ active patients" or "50,000+ reports"**:
   - *Why*: Fabricated demo marketing numbers removed in Phase 1.
3. ❌ **DO NOT CLAIM "HIPAA Compliant" or "Enterprise Certified"**:
   - *Why*: True HIPAA compliance requires signed Business Associate Agreements (BAAs) with Supabase, Groq, and Vercel, SOC-2 audits, and dedicated logging infrastructure. State instead: *"Architected with defense-in-depth healthcare data isolation and encrypted storage."*
4. ❌ **DO NOT CLAIM "Llama 3.3 70B & 3.2 11B Vision"**:
   - *Why*: Groq decommissioned 3.2 11B Vision; the codebase actually uses `openai/gpt-oss-120b` on Groq with modern `gemini-2.5-flash` for multimodal vision.
5. ❌ **DO NOT CLAIM "Leaflet Mapping"**:
   - *Why*: The project uses MapLibre GL with React-Map-GL, not Leaflet.
6. ❌ **DO NOT CLAIM "Magic Link / OAuth Authentication"**:
   - *Why*: Authentication is standard email and password with Supabase Auth.
7. ❌ **DO NOT CLAIM "Client-side PDF generation engine"**:
   - *Why*: The "Download PDF" button invokes browser `window.print()`.

---

## 5. Portfolio Media & Screenshot Checklist

Capture these 4 key screenshots / animations for your portfolio website and GitHub README:

1. **Screenshot 1: Landing Page (Hero & Architecture)**:
   - Capture desktop view of `/` showing the clean, truthful header and feature cards.
2. **Screenshot 2: Interactive Triage Intake**:
   - Capture `/dashboard` with an active 2nd or 3rd clarification turn showing the clinical slot indicators and suggestion chips.
3. **Screenshot 3: Clinical Report Viewer & Regional Map**:
   - Capture `/report/<id>` showing structured triage findings, model-reported certainty, OTC guidance, and the interactive MapLibre clinic map.
4. **Demo GIF: Complete Triage Flow (30 Seconds)**:
   - Record a 30-second walkthrough:
     1. Type symptom in dashboard: *"throbbing headache for 2 days"*.
     2. Answer 1 AI clarifying question.
     3. Receive completed assessment report.
     4. Scroll to view nearby clinics on the interactive map.
