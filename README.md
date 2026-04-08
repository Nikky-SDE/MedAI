<div align="center">
  <h1>🩺 MedAI: Intelligent Medical Triage & Mapping</h1>
  <p><strong>A Next.js 15 Full-Stack Application powered by Groq's Llama 3 models for instant, multimodal health analysis.</strong></p>
  
  <a href="https://med-ai-mauve.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-Test_MedAI_Now-000000?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2.1-000000?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-Database-3EC78E?style=flat-square&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Groq-Llama_3-f3d312?style=flat-square" alt="Groq" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

---

## 🚀 Overview

**MedAI** is an advanced, portfolio-grade medical guidance application. It leverages the cutting-edge **Groq API** (Llama 3.3 70B & Llama 3.2 11B Vision) to analyze user-reported symptoms and photos, outputting structured medical likelihoods and OTC recommendations. 

The application utilizes a proprietary **Agentic Triage Loop**—making up to 3 rapid API calls to interrogate the user on their symptoms to mathematically increase its diagnostic confidence before generating a final PDF report.

*Disclaimer: This is a software demonstration meant for informational purposes. It is not a substitute for clinical medical advice.*

---

## 🛠️ Tech Stack & Architecture

### Core Frontend
- **Framework**: Next.js 16 (App Router, Server Actions)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide React
- **Mapping**: Leaflet + MapTiler (Lazy-loaded via `next/dynamic` to drastically reduce initial JS payload)

### Backend & AI Layer
- **Database**: Supabase PostgreSQL (utilizing strict Row Level Security)
- **Auth**: Supabase Auth (Magic Links / OAuth)
- **AI Brain**: `groq-sdk` 
  - *Text Router*: Uses `llama-3.3-70b-versatile` for lightning-fast NLP processing.
  - *Vision Router*: Automatically falls back to `llama-3.2-11b-vision-preview` if a symptom photo is uploaded via native Base64 encoding.

---

## ✨ Key Features

- **Agentic Multi-Turn Triage**: Instead of a "one-shot" guess, the AI operates in a smart loop, asking follow-up questions to constrain hallucinatory diagnoses.
- **Dynamic Female Health Context**: Explicit algorithms compute menstrual phases based on cycle records to feed specific biological context into the AI engine.
- **Drug Interaction Guardian**: Implicitly cross-references the user's logged `medications_list` before suggesting any OTC treatments.
- **Local Clinic Mapping**: Renders interactive local maps directly in the UI for users to find the nearest physical doctors.
- **Multilingual Web Speech API**: Native microphone dictation and translation for English, Hindi, and Spanish speakers.
- **Client-Side PDF Generation**: Exports cleanly-styled, stamped PDF records of the AI's findings.

---

## 💻 Getting Started Locally

1. **Clone & Install**
   ```bash
   git clone https://github.com/Nikky-SDE/MedAI.git
   cd MedAI/web
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file inside the `web` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key
   GROQ_API_KEY=your_groq_api_key
   ```


## 📐 PRD Reference
For a complete, architectural breakdown of the components designed in this application, please refer to the `PRD.md` file located in the repository root.
