# MVP-B: Report + Evidence + Verification (Citizen anti-corruption)

## Problem
Reporting is risky and usually ends without a transparent workflow: no auditable process and weak anti-doxxing protection.

## Hypothesis
If we provide a secure channel plus a verifiable workflow, the platform will increase:
- useful reports with evidence
- verification rate
- time-to-resolution efficiency (triage to decision)
and reduce doxxing and abuse through:
- automatic redaction + human review
- reputation controls + rate limits

## Scope v0
- Report submission (web + optional bot)
- Evidence upload (S3-compatible) with hashing
- Verification workflow (triage -> verify -> publish/reject)
- Public feed (no PII, full process transparency)
- Decision audit log

## Domain entities
- Report(id, anon_id?, reporter_contact?, category, location?, description, status)
- Evidence(id, report_id, type, storage_ref, sha256, uploaded_at)
- VerificationCase(id, report_id, assigned_to, status, notes)
- Redaction(id, report_id, rules_applied, reviewer, result)
- Publication(id, report_id, public_text, published_at)
- AuditEvent(...)

## States
DRAFT -> SUBMITTED -> TRIAGED -> VERIFIED | REJECTED -> (optional) PUBLISHED

## APIs (v0)
- POST /reports
- POST /reports/{id}/evidence
- POST /reports/{id}/submit
- POST /moderation/cases/{id}/triage
- POST /moderation/cases/{id}/verify
- POST /moderation/reports/{id}/publish
- GET /public/reports (redacted)
- GET /public/reports/{id}
