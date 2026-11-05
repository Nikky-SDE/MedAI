# Product Requirements Document (PRD): MedAI

## 1. Project Overview
**MedAI** is an AI-powered, full-stack medical symptom triage web application. It helps users organize and understand their symptoms before consulting a certified healthcare professional. It features an adaptive multi-turn triage chat loop, profile-aware context integration, nearby clinic mapping, and clean print-ready report generation.

**Goal:** Build a robust, defensible, production-grade application that combines low-latency LLM inference (Groq with Google Gemini fallback) with strict security, structured output, and privacy safeguards.

---

## 2. Target Audience
- Individuals seeking preliminary structured guidance and preparation before visiting a doctor.
- Non-English or multilingual users needing voice dictation and translation (supports English, Hindi, Spanish, and French).
- Software engineers and evaluators assessing full-stack AI system architecture, safety boundaries, and code quality.

---

## 3. Tech Stack & Dependencies
* **Frontend:** Next.js 16.4.3 (App Router, Server Actions, `proxy.ts` network boundary), React 19.2.4, Tailwind CSS v4
* **Backend:** Next.js Server Actions with Supabase SSR client
* **Database & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) policies, Supabase Auth (Email + Password)
* **AI Engine:** Groq API SDK (`groq-sdk`) using `openai/gpt-oss-120b` (default, configurable via `GROQ_MODEL_ID`) with Google Gemini REST API fallback for high availability and multimodal vision
* **Mapping:** `react-map-gl` and `maplibre-gl` with MapTiler / OpenStreetMap tiles (lazy-loaded via `next/dynamic` to reduce initial JavaScript payload)
* **UI Utilities:** `lucide-react` for SVG icons, `next-themes` for dark mode support
* **Image Processing:** Base64 encoding with planned client-side optimization

---

## 4. Legal & Compliance Focus
> **Strict Medical Disclaimer:** Hardcoded disclaimers appear across the UI, the assessment loop, and the print layout:  
> *"MedAI is an informational triage support tool. It is NOT a substitute for professional clinical medical advice, emergency care, diagnosis, or treatment. Always consult a licensed healthcare professional."*

---

## 5. Core Application Flow
1. **Authentication:** Users sign up or log in using Supabase Auth (Email + Password) and manage their health profile (Age, Biological Sex, Cycle length, Allergies, Chronic History, Current Medications).
2. **Symptom Input:**
   - Users describe symptoms via text or the **Web Speech API Dictation** microphone.
   - Users can optionally attach a reference photo of an affected area.
3. **Adaptive Triage Loop:**
   - The primary AI engine evaluates the reported symptoms against patient profile background.
   - The AI conducts an adaptive loop, asking up to 3 clarifying follow-up questions to narrow down diagnostic context before finalizing.
4. **Final Report Generation:**
   - When clarification is sufficient (target certainty ≥ 85% or 3 turns reached), the system transitions to report compilation.
   - The UI generates a structured layout displaying: Probable Condition, Explanation, Safety/OTC guidance, and Recommended Next Steps.
5. **Post-Triage Execution:**
   - The user can view an interactive MapLibre map of nearby medical facilities sourced from OpenStreetMap.
   - The user can export a clean PDF record using browser print-to-PDF or share their report link if toggled public.

---

## 6. Feature Breakdown

### Core Architecture
- [x] Secure authentication with Supabase (Email + Password)
- [x] Multimodal photo upload support with vision fallback
- [x] Structured JSON AI triage responses
- [x] Condition Report UI with emergency notification banner
- [x] Prominent medical disclaimers on every view

### Key Capabilities
- [x] **Dynamic Menstrual Tracker:** Algorithms compute menstrual cycle phases based on user-entered cycle data to contextualize abdominal or fatigue symptoms.
- [x] **Medication Context:** Patient medication history is incorporated into inference prompts to check for potential contraindications.
- [x] **Performance Optimization:** `next/dynamic` code splitting for heavy MapLibre GL bundles.
- [x] **Nearby Clinic Mapping:** MapLibre GL maps real nearby medical facilities from OpenStreetMap with routing estimates.
- [x] **Print-Ready Health Reports:** Print-optimized CSS styling for clean PDF export via native browser print.

### Polish & UX
- [x] Web Speech API voice dictation
- [x] Multilingual interface (English, Hindi, Spanish, French)
- [x] Dashboard report history with owner-only access controls
- [x] Dark / Light mode toggling with `next-themes`