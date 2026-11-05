# Security & Privacy Policy

> **MedAI Security Specification** · Last Updated: 2026-11-05  
> MedAI is an intelligent medical triage and regional clinical mapping platform designed with defense-in-depth security, strict medical data isolation, and comprehensive privacy safeguards.

---

## 1. Vulnerability Disclosure Policy

If you discover a security vulnerability or potential privacy issue in MedAI, please responsibly disclose it by emailing the project maintainer or submitting a confidential security advisory on GitHub. 

We take all security reports seriously and commit to:
- Acknowledging receipt within 48 hours.
- Investigating and validating the reported vulnerability.
- Providing a timeline for remediation and deploying patches before public disclosure.

---

## 2. External AI Processing & Data Flow Disclosures

MedAI uses external cloud LLM APIs to perform structured symptom analysis and generate triage clarification questions:

| Provider | Model ID | Data Transmitted | Retention & Privacy Terms |
|---|---|---|---|
| **Groq Cloud** | `openai/gpt-oss-120b` (configurable via `GROQ_MODEL_ID`) | Patient symptom description, conversation turns, sanitized demographic & vitals context. | Groq operates stateless inference endpoints. Data is processed in volatile memory and not used to train models. |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-2.0-flash` (fallback & vision) | Patient symptom description, conversation turns, sanitized demographic context, optional Base64 clinical image bytes. | Processed via standard Google AI Studio / Gemini API. Enterprise privacy terms state prompt payloads are not retained for public training. |

### Data That Is NEVER Transmitted to LLMs:
- **User Credentials**: Passwords, email addresses, and auth session tokens never touch the AI inference prompt.
- **Direct Identifiers**: Patient full names, account UUIDs, and email addresses are excluded from LLM prompt contexts.
- **EXIF Metadata**: Device camera serial numbers, GPS latitude/longitude, and photo timestamps are stripped client-side via HTML5 canvas rasterization prior to upload.

---

## 3. Storage Security & Image Privacy

Clinical photos (e.g., skin rashes, superficial cuts) uploaded by patients are subject to strict multi-tier protection:

1. **Private Storage Bucket**:
   - The Supabase Storage bucket `symptoms` is strictly configured with `public: false`.
   - Direct anonymous HTTP access to storage URLs is completely blocked at the storage gateway.
2. **Per-User Path Scoping**:
   - Images are saved exclusively to owner-scoped folder paths: `<user_id>/<timestamp>-<filename>`.
   - Storage RLS policies ensure authenticated users can only insert, read, or delete files within their own folder:
     ```sql
     -- Storage Insert Policy
     ((bucket_id = 'symptoms'::text) AND (auth.uid() = (storage.foldername(name))[1]))
     ```
3. **Short-Lived Signed URLs**:
   - Images are rendered in reports exclusively via time-limited, cryptographically signed URLs generated on-demand with a **1-hour (3,600s) expiration window**.
4. **Client-Side EXIF Stripping**:
   - Before uploading to storage, images are drawn to an in-memory HTML5 Canvas and re-encoded. This rasterization completely purges embedded EXIF metadata (GPS coordinates, phone model, serial number) preventing physical patient location leaks.

---

## 4. Database Security & Row Level Security (RLS)

All application data is stored in PostgreSQL managed by Supabase with Row Level Security enforced on every public table:

### Table Access Boundaries

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|---|---|---|---|---|
| `public.profiles` | `auth.uid() = id` (Owner only) | `auth.uid() = id` | `auth.uid() = id` WITH CHECK | N/A (Cascade on auth delete) |
| `public.reports` | `auth.uid() = user_id OR is_public = true` | `auth.uid() = user_id` | `auth.uid() = user_id` (Trigger-restricted) | `auth.uid() = user_id` |
| `public.triage_sessions` | `auth.uid() = user_id` (Owner only) | `auth.uid() = user_id` | `auth.uid() = user_id` WITH CHECK | `auth.uid() = user_id` |
| `public.ai_calls` | `auth.uid() = user_id` (Owner only) | `auth.uid() = user_id` | Denied | `auth.uid() = user_id` |

### Tamper-Proof Assessment Trigger
To prevent malicious patients or compromised clients from tampering with AI clinical verdicts or fabricating triage outcomes, PostgreSQL trigger `prevent_report_immutable_columns_update` blocks any mutation of critical columns:
```sql
CREATE OR REPLACE FUNCTION public.prevent_report_immutable_columns_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id OR
     NEW.created_at <> OLD.created_at OR
     NEW.ai_response <> OLD.ai_response OR
     NEW.is_emergency <> OLD.is_emergency THEN
    RAISE EXCEPTION 'Security Violation: Modifying immutable report columns is strictly prohibited.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Input Validation & Prompt Injection Defense

1. **Strict Server-Side Boundary Clamps**:
   - Symptom description: Clamped between 3 and 5,000 characters.
   - Patient age: Clamped between 0 and 130 years.
   - Menstrual cycle: Cycle length clamped to [10, 100] days; period duration clamped to [1, 30] days.
   - Triage messages: Max 20 turns, max 2,000 characters per message.
   - Uploaded photos: Allowed MIME types restricted to `image/jpeg`, `image/png`, `image/webp`; max payload size capped at 5 MB.
2. **Context Delimitation & Sanitization**:
   - Patient profile attributes are wrapped within isolated `<patient_profile_data>` XML tags.
   - Embedded closing tags `</patient_profile_data>` inside user-entered text fields are neutralized to prevent prompt injection breakout attacks.
3. **Structured Schema Validation**:
   - All LLM outputs are validated against strict Zod schemas (`TriageTurnResponseSchema`, `FinalReportResponseSchema`). Freeform unvalidated JSON is never rendered.

---

## 6. Rate Limiting & Resource Exhaustion Defense

To prevent denial-of-service, runaway API bills, and LLM quota exhaustion:
- **Triage Intake Calls**: Enforced at **30 requests per hour** per user backed by queries against `public.ai_calls`.
- **Final Report Generations**: Enforced at **10 reports per day** per user backed by `public.reports`.
- Exceeded thresholds return HTTP `429 Too Many Requests` with standard `Retry-After` response headers.
- **Idempotency**: Assessment creation binds a unique index on `session_id`, rejecting duplicate concurrent requests on double-clicks.

---

## 7. HTTP Security Headers

Configured in `web/next.config.ts`:
- **Content-Security-Policy-Report-Only**: Restricts script execution, frame ancestors, and object sources while permitting MapLibre GL tiles and OpenStreetMap caching.
- **X-Frame-Options**: `DENY` (Prevents clickjacking and iframe embedding).
- **X-Content-Type-Options**: `nosniff` (Prevents MIME-type sniffing).
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=(self)`.
