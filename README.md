# 🩺 MedAI: Multimodal AI Symptom Triage & Clinical Locator

**A Full-Stack Next.js 16 Application powered by Groq (Llama) & Google Gemini for multi-turn symptom triage, FDA medication checks, and WebGL clinic routing.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%26_RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_Inference-F55036)](https://groq.com/)

> **Medical Disclaimer:** MedAI is an educational software engineering demonstration designed for informational symptom organization. It is **not** a certified medical device and does not provide clinical diagnoses.

<div align="center">
  
  ### [🔴 Live Demo: Test MedAI Here](https://med-ai-mauve.vercel.app/)

  *MedAI Triage Dashboard: AI Agent interface, symptom processing, and clinical map.*
</div>

---

## 🚀 Overview

One-shot symptom prompts often produce vague or hallucinated health advice because users omit critical context. **MedAI** solves this by implementing a **Stateful Multi-Turn Triage Loop**: instead of guessing immediately, the assistant conducts up to **3 targeted follow-up turns**—incorporating the user's saved health profile, FDA drug interactions, biological sex, and menstrual cycle phase—until it reaches an internal confidence threshold before generating a structured triage report.

---

## 🛠️ Tech Stack & Architecture

### Frontend Layer
* **Framework:** Next.js 16.4 (App Router, Server Actions, Next.js 16 `proxy.ts` session interception)
* **UI & Styling:** React 19, Tailwind CSS v4, `next-themes`, `lucide-react`
* **Geospatial Mapping:** `react-map-gl` + `maplibre-gl` (Lazy-loaded via `next/dynamic` with `ssr: false` to eliminate SSR window crashes and reduce the initial JS bundle)
* **Voice & Localization:** Web Speech API (`SpeechRecognition`) + custom i18n context supporting English, Hindi (`hi`), Spanish (`es`), and French (`fr`)
* **Media Optimization:** Client-side HTML5 `<canvas>` WebP compression pipeline to strip EXIF GPS data and cap multimodal payload sizes.

### Backend, Data & AI Layer
* **Database & Auth:** Supabase PostgreSQL, Supabase SSR Auth (Email/Password + PKCE callback), and Supabase Storage with strict Row Level Security (RLS) policies
* **AI Inference Engine:**
  * **Primary Low-Latency Triage:** Groq SDK (`llama-3.3-70b-versatile`) with structured JSON extraction (`response_format: { type: 'json_object' }`)
  * **Multimodal Vision & Fallback Router:** Automatic failover to Google Gemini (`gemini-2.0-flash`) with inline Base64 image encoding for dermatological/visual symptom attachments
* **External APIs:** Overpass API (OpenStreetMap) for live healthcare nodes, OpenFDA API for pharmacological contraindications.

---

## ✨ Key Engineering Features

* **Multi-Turn Conversational Triage:** Iteratively narrows down differential possibilities across up to 3 clarifying questions before persisting the final structured JSON report (`condition`, `confidenceLevel`, `explanation`, `isEmergency`, `otcMedicineAdvice`, `recommendation`).
* **Deterministic Red-Flag Pre-Screening:** Evaluates free-text input against critical emergency patterns (acute chest pain, stroke FAST indicators, severe respiratory distress) to bypass the LLM and trigger immediate emergency protocols.
* **Pharmacological Context Injection (OpenFDA):** Fetches official boxed warnings from the U.S. National Library of Medicine (OpenFDA API) for the user's logged medications, injecting verified clinical contraindications into the LLM system prompt.
* **Luteal-Anchored Menstrual Phase Calculator:** Computes current cycle day and biological phase (`Menstrual`, `Follicular`, `Ovulatory`, `Luteal`) based on luteal anchoring to provide dynamic hormone-aware context to the triage engine.
* **Resilient Multi-Tier Clinic Locator:** Queries live OSM healthcare nodes via the **Overpass API**, falls back to **Nominatim** geocoding if rate-limited, and renders interactive **MapLibre GL** markers with **OSRM** road routing.
* **Privacy Controls & Print-Ready Reports:** Reports default to private owner-only RLS access with an opt-in public sharing toggle and a print-optimized CSS stylesheet (`@media print`) for clean PDF export.

---

## ⚡ Performance

MedAI is built with a focus on web vitals and minimal client-side bloat.
* **Lighthouse Score:** 94 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO.
* **Bundle Optimization:** The heavy MapLibre GL WebGL engine and OSRM routing logic are strictly lazy-loaded via Next.js Dynamic Imports (`ssr: false`) to keep the initial dashboard JS payload heavily reduced.

---

## 💻 Getting Started Locally

### 1. Clone & Install
```bash
git clone [https://github.com/Nikky-SDE/MedAI.git](https://github.com/Nikky-SDE/MedAI.git)
cd MedAI/web
npm install
