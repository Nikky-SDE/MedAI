# Product Requirements Document (PRD): MedAI

## 1. Product Vision & Scope
MedAI is a full-stack Next.js web application designed to act as an intelligent, multimodal symptom triage assistant. It aims to bridge the gap between vague internet symptom searches and formal medical consultations by utilizing a multi-turn LLM interrogation loop, enriched with the user's personalized health metrics, FDA drug interaction data, and localized clinic mapping.

**Disclaimer:** MedAI is purely informational and demonstrates software engineering patterns for AI-integrated healthcare tooling. It is strictly not a clinical diagnostic tool.

## 2. Target Audience
1. **End-Users:** Individuals seeking preliminary structuring of their health symptoms, OTC guidance, and nearby medical facility routing before contacting a physician.
2. **Technical Reviewers:** Engineering managers and recruiters evaluating portfolio architecture, API orchestration, and full-stack implementation capabilities.

## 3. Core User Workflows

### 3.1 Authentication & Health Profiling
* **Flow:** Users authenticate via Supabase Auth (Email/Password). Upon first login, a Postgres trigger generates a `profiles` row.
* **Health Profile:** Users configure persistent demographics, allergies, medications, and biological/menstrual cycle data. This context is securely fetched via Next.js Server Actions and injected into all subsequent AI sessions.

### 3.2 Multimodal Symptom Intake & Safety Screening
* **Inputs:** Users provide symptoms via standard text input, Web Speech API dictation (supporting English, Hindi, Spanish, French), or image upload (e.g., rashes, swelling).
* **Preprocessing:** Images undergo client-side HTML5 Canvas compression (WebP) to strip sensitive EXIF GPS metadata and minimize payload size.
* **Deterministic Safety Check:** Before invoking the LLM, input is screened against a regex-based Emergency Pattern Matcher (e.g., stroke indicators, chest pain). Matches instantly bypass the triage loop to display an emergency warning.

### 3.3 The Agentic Triage Loop
* **Mechanism:** Instead of a one-shot guess, the application POSTs to `/api/triage`. The AI (Groq Llama 3) responds with a strictly structured JSON object containing a `confidenceScore` and a `next_question`.
* **Termination:** The UI maintains the conversation state. The loop terminates when the LLM reports a confidence score of ≥85% OR a hard cap of 3 follow-up turns is reached.
* **Context Injection:** The system prompt dynamically includes OpenFDA API warnings for the user's logged medications, alongside calculated menstrual phases (using luteal-phase anchoring).

### 3.4 Report Generation & Map Routing
* **Final Synthesis:** A backend Server Action (`analyzeSymptoms`) triggers a final LLM pass to generate a structured report (`condition`, `explanation`, `isEmergency`, `otcMedicineAdvice`). 
* **Persistence:** The JSON report is inserted into Supabase `reports` protected by Row Level Security (RLS).
* **Clinic Locator:** The report view lazy-loads a `MapLibre GL` WebGL map. It fetches real-time healthcare nodes from the OpenStreetMap Overpass API based on the user's HTML5 Geolocation and provides OSRM road routing.

## 4. Technical Architecture

* **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS v4.
* **Backend:** Next.js Server Actions for secure database mutations; API Route Handlers for streaming AI interactions.
* **Database:** Supabase PostgreSQL with strict RLS (reports restricted to `auth.uid() = user_id` unless explicitly toggled `is_public = true`).
* **AI Orchestration:**
  * **Text Modality:** Groq API (`llama-3.3-70b-versatile`) optimized for low-latency NLP.
  * **Vision Modality:** Fallback to Google Gemini API (`gemini-2.0-flash`) for handling Base64 image payloads.

## 5. Security & Privacy Constraints

1. **Row Level Security (RLS):** All Postgres tables and Storage buckets must enforce access policies at the database layer. Symptom images are stored in private buckets and accessed via signed URLs.
2. **Metadata Sanitization:** All client-uploaded media must be stripped of EXIF headers to prevent unintentional leakage of user location data to third-party LLM APIs.
3. **Rate Limiting:** AI endpoints must be protected against abuse to prevent API quota exhaustion.
4. **Data Minimization:** Only context strictly relevant to the current symptom profile is passed to the LLM.

## 6. Success Metrics (System Health)
* **Triage Latency:** Groq API text turnarounds must average < 800ms.
* **Payload Efficiency:** Client-side image compression must reduce raw smartphone photo payloads (typically 4-8MB) to under 500KB before transmission.
* **Map Initialization:** Lazy-loading MapLibre GL must keep the initial application JS bundle below Next.js recommended thresholds.
