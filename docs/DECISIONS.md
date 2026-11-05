# MedAI Architectural Decision Records (ADRs)

> **Architectural Decisions Log** · Last Updated: 2026-11-05  
> Defensible engineering rationales and architectural trade-offs across MedAI development phases.

---

## Index of Architectural Decision Records

1. [ADR 001: Next.js 16 App Router & `proxy.ts` Network Boundary](#adr-001-nextjs-16-app-router--proxyts-network-boundary)
2. [ADR 002: Deterministic Red-Flag Emergency Triage Executed Pre-LLM](#adr-002-deterministic-red-flag-emergency-triage-executed-pre-llm)
3. [ADR 003: Server-Owned Triage State Machine vs. Client-Side Loop](#adr-003-server-owned-triage-state-machine-vs-client-side-loop)
4. [ADR 004: Private Storage Bucket, Scoped Paths & 1-Hour Signed URLs](#adr-004-private-storage-bucket-scoped-paths--1-hour-signed-urls)
5. [ADR 005: Client-Side Canvas Image Downscale & Automated EXIF Stripping](#adr-005-client-side-canvas-image-downscale--automated-exif-stripping)
6. [ADR 006: Server-Side Coordinate Grid Rounding & In-Memory Overpass Cache](#adr-006-server-side-coordinate-grid-rounding--in-memory-overpass-cache)
7. [ADR 007: Database-Backed Rate Limiting Without Paid Third-Party Infrastructure](#adr-007-database-backed-rate-limiting-without-paid-third-party-infrastructure)
8. [ADR 008: Deterministic Offline `MOCK_LLM` Test Harness for CI & Benchmarks](#adr-008-deterministic-offline-mock_llm-test-harness-for-ci--benchmarks)
9. [ADR 009: Pruning `framer-motion` in Favor of Native Tailwind CSS](#adr-009-pruning-framer-motion-in-favor-of-native-tailwind-css)
10. [ADR 010: Idempotent Assessment Generation via Partial Unique Index](#adr-010-idempotent-assessment-generation-via-partial-unique-index)

---

### ADR 001: Next.js 16 App Router & `proxy.ts` Network Boundary
- **Status**: Accepted (Phase 0)
- **Context**: In Next.js 16, `middleware.ts` was formally deprecated in favor of `proxy.ts` at the network boundary. Unauthenticated users visiting `/dashboard` or `/profile` required immediate server redirection.
- **Decision**: Retain `src/proxy.ts` implementing `updateSession` via `@supabase/ssr`. Maintain route-level defense-in-depth inside `page.tsx` handlers for whitelisted paths.
- **Trade-off**: Requires developers to keep path matcher lists synchronized between `proxy.ts` and route handlers.

---

### ADR 002: Deterministic Red-Flag Emergency Triage Executed Pre-LLM
- **Status**: Accepted (Phase 3)
- **Context**: Relying exclusively on generative LLMs to recognize acute cardiac arrest, stroke, severe hemorrhage, or anaphylaxis introduces non-zero latency (1,000–3,000ms), hallucinations, and potential model failure modes.
- **Decision**: Implement `lib/safety/redFlags.ts` executing *before* any remote LLM network call across 4 languages (`en`, `hi`, `es`, `fr`). Life-threatening symptoms immediately trigger emergency protocols with 0ms LLM latency.
- **Trade-off**: Keyword matching requires ongoing curation and may over-trigger on edge cases, prioritizing patient safety over specificity. Non-English keyword lists are marked as best-effort for clinical review.

---

### ADR 003: Server-Owned Triage State Machine vs. Client-Side Loop
- **Status**: Accepted (Phase 4)
- **Context**: The legacy triage flow allowed the client browser to control turn count, evaluate when enough information was gathered, and pass the entire transcript in a hidden form field. This allowed transcript tampering, uncapped LLM costs, and prompt injection attacks.
- **Decision**: Introduce `public.triage_sessions` in PostgreSQL. The client sends only `{ sessionId, message }`. The server extracts clinical slots (onset, severity, symptoms, factors), decides when to terminate the loop (max 3 turns), and compiles the final report directly from stored records.
- **Trade-off**: Requires database writes on each turn, slightly increasing database operations in exchange for complete data integrity and cost control.

---

### ADR 004: Private Storage Bucket, Scoped Paths & 1-Hour Signed URLs
- **Status**: Accepted (Phase 2)
- **Context**: The legacy storage bucket was public, and policies only checked `auth.role() = 'authenticated'`, allowing any logged-in user to view, upload, or delete any other patient's clinical photos.
- **Decision**: Make bucket private. Scope storage path prefixes strictly to `<user_id>/...`. Enforce owner-only RLS policies. Render clinical images exclusively via cryptographically signed URLs with a 1-hour expiration window.
- **Trade-off**: Requires generating signed URLs on server render, but completely eliminates unauthorized medical image access.

---

### ADR 005: Client-Side Canvas Image Downscale & Automated EXIF Stripping
- **Status**: Accepted (Phase 5)
- **Context**: Modern smartphone cameras upload 8 MB to 15 MB uncompressed photos containing embedded EXIF metadata (exact home GPS coordinates, device serial numbers, timestamps). Uploading these wastes patient mobile data and leaks private geolocation.
- **Decision**: Re-encode images client-side via an HTML5 `<canvas>` before upload, clamping the maximum dimension to 1,280px with 85% JPEG quality.
- **Trade-off**: Requires client CPU execution (~50ms), but cuts payload sizes by ~96% (down to 150–250 KB) and completely discards EXIF GPS metadata.

---

### ADR 006: Server-Side Coordinate Grid Rounding & In-Memory Overpass Cache
- **Status**: Accepted (Phase 5)
- **Context**: Direct client calls to OpenStreetMap's Overpass API failed due to browser CORS, strict Overpass rate limits (HTTP 429), and 2–4 second response times.
- **Decision**: Route clinic queries through server route `/api/clinics`. Round coordinates to 2 decimal places (`Math.round(coord * 100) / 100`) to form ~1.1km grid buckets. Cache results in memory for 1 hour with an 8-second timeout.
- **Trade-off**: Memory consumption capped at 500 entries (~2 MB RAM); repeated nearby searches resolve in < 5 ms with zero CORS errors.

---

### ADR 007: Database-Backed Rate Limiting Without Paid Third-Party Infrastructure
- **Status**: Accepted (Phase 4)
- **Context**: Protecting against LLM quota exhaustion and denial-of-service typically requires paid third-party Redis (e.g. Upstash). MedAI adheres to strict free-tier-only constraints.
- **Decision**: Implement per-user rate limits directly in PostgreSQL using `public.ai_calls` (30 triage calls/hr) and `public.reports` (10 reports/day). Returns HTTP 429 with `Retry-After` header.
- **Trade-off**: Slightly higher query load on PostgreSQL compared to an in-memory Redis store, but incurs zero hosting costs and requires no external dependencies.

---

### ADR 008: Deterministic Offline `MOCK_LLM` Test Harness for CI & Benchmarks
- **Status**: Accepted (Phase 6 & 7)
- **Context**: Continuous Integration (GitHub Actions) and automated evaluation runners cannot depend on live Groq or Gemini API keys due to rate limits, quota costs, and network nondeterminism.
- **Decision**: Add `MOCK_LLM=true` flag in `lib/ai.ts` (strictly disabled when `NODE_ENV === 'production'`) that returns schema-validated responses and logs telemetry.
- **Trade-off**: Mock tests verify schema handling, UI flow, and error states rather than live LLM intelligence, but guarantee 100% reproducible, zero-cost CI pipelines.

---

### ADR 009: Pruning `framer-motion` in Favor of Native Tailwind CSS
- **Status**: Accepted (Phase 1)
- **Context**: `framer-motion` contributed a 211.8 KB uncompressed bundle chunk to the landing page, despite being imported in only one component (`HeroVisual.tsx`) for simple fade and scale transitions.
- **Decision**: Remove `framer-motion` entirely. Replaced animations with native Tailwind CSS transition classes (`transition-all duration-300`, `animate-pulse`).
- **Trade-off**: Reduced landing page First Load JS by -95.5% (from 220 KB down to 9.8 KB).

---

### ADR 010: Idempotent Assessment Generation via Partial Unique Index
- **Status**: Accepted (Phase 4)
- **Context**: Double-clicking "Generate Assessment" or rapid form resubmissions generated duplicate database reports and triggered redundant LLM billing.
- **Decision**: Link `reports` to `session_id` with a partial unique index (`CREATE UNIQUE INDEX idx_reports_idempotent_session ON public.reports(session_id) WHERE session_id IS NOT NULL`). Server checks for an existing session report and redirects to it immediately.
- **Trade-off**: Sessions cannot generate multiple distinct reports, which matches the single-assessment clinical intake model.
