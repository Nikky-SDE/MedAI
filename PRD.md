# Product Requirements Document (PRD): MedAI

## 1. Project Overview
**MedAI** is my AI-powered, full-stack medical web application. I built it to help users understand their symptoms securely before they visit a doctor. It features a complete AI triage chat loop, and generates comprehensive health reports.

**Goal:** Create a strong, portfolio-ready tool that leverages ultra-fast Language Models (Llama 3) to democratize healthcare access, while proving I can build secure, multi-turn AI architectures.

---

## 2. Target Audience
- People looking for preliminary information about their symptoms.
- Non-English speakers needing medical assistance via Voice Dictation (supports Hindi & Spanish).
- Tech recruiters reviewing my ability to build modular, optimized Next.js applications.

---

## 3. Tech Stack (Actual Dependencies Used)
* **Frontend:** Next.js (installed v16.2.1 Turbopack), React v19.2.4, Tailwind CSS v4
* **Backend:** Next.js Server Actions (No external Node server needed)
* **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`). *Note: I initially installed Prisma ORM (`@prisma/client`) but bypassed it intentionally to use native Supabase RLS policies for better performance.*
* **AI Engine:** Groq API SDK (`groq-sdk`) using **Llama-3.3-70b-versatile** and **Llama-3.2-11b-vision-preview**.
* **Mapping:** `react-map-gl` and `maplibre-gl` (Lazy-loaded via `next/dynamic` to shrink the JavaScript bundle size).
* **UI Utilities:** `lucide-react` for scalable SVG icons, `next-themes` for strict dark mode toggling.
* **Image Processing:** Native Base64 encoding.

---

## 4. Legal & Compliance Focus
> **Strict Medical Disclaimer:** I hardcoded disclaimers across the UI and the PDF export: *"MedAI is an informational tool. It is NOT a substitute for professional medical diagnosis. Always consult a certified healthcare professional."*

---

## 5. Core Application Flow
1. **Secure Auth:** Users sign up using Supabase Auth and complete their specific Medical Profile (Age, BMI, Cycle length, Allergies).
2. **Symptom Input:** 
   - They either type their symptoms or use the **Web Speech API Dictation** mic icon.
   - They can upload a photo of a rash/injury.
3. **Agentic AI Triage (The "Brain"):** 
   - The Groq API intercepts the prompt. Instead of guessing blindly, my logic forces the AI into a "Smart Loop". It makes up to 3 fast API calls to ask the user follow-up questions to increase its internal "Confidence Score."
4. **Final Report Generation:** 
   - Once confidence hits 85%, the system transitions to the Report Phase.
   - The UI generates a clean layout showing: Probable Condition, Explanation, and Safe OTC treatments (cross-referenced against their profile).
5. **Post-Triage Execution:**
   - The user can view a live Map of nearby clinics directly on the screen.
   - They can download a dynamically generated PDF or share the report via WhatsApp.

---

## 6. Feature Breakdown

### Minimum Viable Product (MVP) - *Completed*
- [x] Secure authentication with Supabase
- [x] Native photo uploads and NLP text processing
- [x] Accurate AI responses returning strict JSON objects
- [x] Condition Report UI
- [x] Legal disclaimers implemented

### Standout Architecture (Differentiators) - *Completed*
- [x] **Dynamic Menstrual Tracker:** Algorithm conditionally renders and calculates a female user's biological cycle to give the AI better context for abdominal pain or fatigue.
- [x] **Drug Interaction Framework:** The AI is implicitly fed the user's `medications_list` during generation to ensure OTC suggestions don't conflict.
- [x] **Performance Optimization:** Leveraged `next/dynamic` to massively drop load times for the Maps. 
- [x] **Local Clinic Mapping:** Leaflet calculates nearby hospitals instead of relying on generic text.
- [x] **Custom PDF Engine:** The user can save a physical record of the AI's findings.

### Polish & UX - *Completed*
- [x] Real-time voice to text integration
- [x] i18n implementation (Spanish, Hindi, English).
- [x] Dashboard history syncing (re-fetches past DB reports)
- [x] **Dark Mode:** Deeply integrated custom CSS overriding Tailwind v4 generic triggers.
