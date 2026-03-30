# Product Requirements Document (PRD): medAI

## 1. Product Overview
**medAI** is an AI-powered, full-stack medical guidance web application designed to help users understand their symptoms, receive AI-driven insights, and find actionable next steps (such as locating nearby specialists or receiving emergency alerts). 

**Mission:** To democratize access to preliminary health information through multimodal AI (vision and NLP), empowering users while strictly maintaining that the application is for informational purposes only.

---

## 2. Target Audience
- Individuals seeking preliminary information about their symptoms before visiting a doctor.
- Users looking to track their health conditions over time.
- People requiring medical information in regional languages (e.g., Hindi, Bengali, Tamil).
- Individuals with accessibility needs benefiting from voice-assisted inputs.

---

## 3. Tech Stack
* **Frontend:** Next.js (React Framework), Tailwind CSS (Styling)
* **Backend:** Node.js (Next.js API Routes) / FastAPI (Python - optional, for advanced AI service delegation)
* **Database:** PostgreSQL managed via Prisma ORM
* **Authentication:** Clerk or NextAuth.js
* **AI Provider:** Claude API (Vision + Text NLP capabilities)
* **Storage:** Cloudinary (for secure, temporary symptom image uploads)
* **Maps/Location:** Google Maps API
* **Document Generation:** jsPDF or Puppeteer

---

## 4. Legal & Compliance Requirements
> [!CAUTION]
> **Strict Medical Disclaimer:** Every page, report, and chatbot interaction MUST display a prominent disclaimer: *"medAI is an informational tool powered by AI. It is NOT a substitute for professional medical diagnosis, advice, or treatment. Always consult a certified healthcare professional. In case of an emergency, immediately contact local emergency services."*
- **Data Privacy:** User uploaded images must be securely stored and optionally auto-deleted after analysis to respect user privacy (pseudo-HIPAA compliance habits).

---

## 5. Core User Journey (Step-by-Step Flow)
1. **Onboarding & Auth:** User signs up/logs in via Clerk and completes a basic Health Profile (Age, Blood Group, Allergies, Medical History).
2. **Input Symptoms:** 
   - User uploads a photo of their symptom (e.g., skin rash, minor injury).
   - User provides a text description OR uses the **Voice Input** feature to describe how they feel.
   - User enters their current medications (for Drug Interaction Checks).
3. **AI Processing:** 
   - The backend sends the image (via Cloudinary URL) and text to the Claude API.
   - **Emergency Check:** AI immediately flags if symptoms match critical emergencies (e.g., stroke, heart attack) and triggers the **Emergency Severity Classifier** UI.
4. **Results Generation:** 
   - AI generates a **Full Health Condition Report** detailing potential causes.
   - AI outputs **Medicine recommendations** (OTC only, informational with photos/links).
5. **Post-Result Actions:**
   - User can ask follow-up questions to the **Medical Chatbot**.
   - User views the **Nearby Doctor/Hospital Finder** to book an appointment.
   - User exports the session as a **PDF Report**.
6. **Dashboard Update:** The session is logged into the **Health Dashboard & History** for future tracking.

---

## 6. Features Breakdown

### Tier 1: Core Functionality (MVP)
* **📸 Symptom Photo Upload:** Cloudinary integration for image hosting.
* **📝 Symptom NLP Input:** Text area for detailed descriptions.
* **🧠 AI Diagnosis Suggestions:** Claude API integration returning structured JSON (Condition, Confidence Level, Explanation).
* **📋 Condition Report Generation:** Clean UI presenting the AI's findings.
* **💊 Medicine Information:** Displaying generic OTC medicine classes relevant to the symptoms with reference images.
* **⚠️ Disclaimer Implementation:** Hardcoded, un-dismissible legal disclaimers.

### Tier 2: Standout Differentiators
* **🔐 Auth + Personal Health Profile:** Persistent user sessions and profile management.
* **🔴 Emergency Severity Classifier:** Conditional UI red-alerts indicating severe conditions and displaying local emergency numbers (e.g., 108 in India).
* **💊 Drug Interaction Checker:** Pre-analysis check analyzing profile medications against recommended OTCs.
* **📍 Nearby Doctor/Hospital Finder:** Google Maps integration fetching clinics based on the user's geolocation and the AI's suggested medical specialty.
* **📄 PDF Report Export:** Client-side PDF generation using jsPDF for easy sharing.

### Tier 3: Advanced UX & Accessibility
* **🗣️ Voice Symptom Input:** Web Speech API integration for dictation.
* **🌍 Multi-language Support:** i18n implementation utilizing Claude to translate medical jargon into Hindi, Bengali, Tamil, etc.
* **📊 Health Dashboard & History:** Visual charts (using Chart.js/Recharts) tracking symptom recurrence and profile history over time.
* **🤖 Medical Chatbot:** A persistent chat window maintaining the context of the generated report for user Q&A.
* **📅 Mock Appointment Booking:** UI component simulating a Calendly-style booking system for the suggested specialists.

---

## 7. Step-by-Step Implementation Plan

### Phase 1: Foundation & MVP (Weeks 1-2)
1. Initialize Next.js project with Tailwind CSS.
2. Setup PostgreSQL database and Prisma schema (Users, Profiles, Reports).
3. Implement Authentication (Clerk).
4. Build the core input UI (Text area + File upload for Images).
5. Setup Cloudinary for image uploads and setup Claude API backend route.
6. Display the AI response in a simple report UI with strict disclaimers.

### Phase 2: Standout Features (Weeks 3-4)
7. Build the Personal Health Profile page and link it to the Claude API prompt context.
8. Implement the Emergency Severity detection logic in the prompt.
9. Integrate Google Maps API to show related nearby hospitals/doctors.
10. Add the PDF Export functionality (jsPDF) to the report page.

### Phase 3: Polish & Advanced Features (Weeks 5-6)
11. Build the User Dashboard with historical charts fetching Prisma data.
12. Integrate the Web Speech API for the Voice Input feature.
13. Implement Multi-language selection and prompt contextualization.
14. Add the contextual Medical Chatbot interface on the report page.
15. Final UI/UX styling, empty states, loading skeletons, and responsive testing.
