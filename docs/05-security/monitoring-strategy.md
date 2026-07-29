# Security Monitoring Strategy — Drenyra

**Version:** 1.0.0
**Last Reviewed:** 2026-07-25
**Author:** Drenyra Security Team

---

## Purpose

Document the current security monitoring posture and define security-relevant alert triggers for the Drenyra platform. This document is a living baseline; it will evolve as structured logging and SIEM integration are adopted.

---

## Current Monitoring Inventory

### What Is Logged Today

| Event Category     | What Is Logged                                | Storage              | Retention      |
| ------------------ | --------------------------------------------- | -------------------- | -------------- |
| Access Control     | ALLOW/DENY decisions per route, role, user ID | stdout → Fly.io logs | Fly.io default |
| Authentication     | Login success/failure, lockout events         | stdout → Fly.io logs | Fly.io default |
| Rate Limiting      | Rate limit hits (429 responses)               | stdout → Fly.io logs | Fly.io default |
| MFA (Phase 2)      | Enrollment, verification, recovery, disable   | stdout → Fly.io logs | Fly.io default |
| Secret Validation  | Startup validation results                    | stdout → Fly.io logs | Fly.io default |
| Application Errors | Unhandled exceptions, 500 responses           | stdout → Fly.io logs | Fly.io default |

### What Is NOT Logged Today (Gaps)

- **Structured logging:** Current logs are unstructured JSON — no standardized schema
- **Anomaly detection:** No baseline deviation alerts
- **Geo/IP anomaly detection:** No detection of logins from new locations
- **Data access patterns:** No monitoring of unusual SUNAT query volumes
- **Session anomalies:** No detection of concurrent sessions from different IPs

---

## Alert Trigger Definitions

### A1 — Consecutive Failed Login Attempts

- **Severity:** Medium
- **Threshold:** >10 failed attempts for a single account within 5 minutes
- **Expected response:** Within 15 minutes
- **Action:** Verify if account lockout triggered; review IP origin; notify user if legitimate
- **Current status:** Logged but NOT alerted

### A2 — Failed MFA Verification Spike

- **Severity:** High
- **Threshold:** >5 consecutive failed MFA attempts for a single account
- **Expected response:** Within 15 minutes
- **Action:** Account may be under targeted attack; verify account ownership; force password reset
- **Current status:** Logged but NOT alerted

### A3 — RBAC Denial Spike

- **Severity:** Medium
- **Threshold:** >20 RBAC DENY events per minute across all routes
- **Expected response:** Within 30 minutes
- **Action:** Investigate whether this is a misconfiguration, pentest, or attack; review affected routes
- **Current status:** Logged but NOT alerted

### A4 — Role or Permission Change

- **Severity:** High
- **Threshold:** ANY role or permission change to any user account
- **Expected response:** Within 15 minutes
- **Action:** Verify change was authorized; check audit trail; revert if unauthorized
- **Current status:** Logged but NOT alerted

### A5 — Destructive Endpoint Access

- **Severity:** Critical
- **Threshold:** ANY access to delete/bulk-operation endpoints by non-superadmin roles
- **Expected response:** Within 5 minutes
- **Action:** Immediate investigation; verify authorization; potential incident declaration
- **Current status:** Logged (via access-control events) but NOT alerted

### A6 — Secret Validation Failure

- **Severity:** Critical
- **Threshold:** ANY secret validation failure at application startup
- **Expected response:** Within 5 minutes
- **Action:** Verify secret configuration; check for unauthorized changes; rotate if compromised
- **Current status:** Logged (console.error) but NOT alerted

### A7 — Unusual SUNAT Query Patterns

- **Severity:** Medium
- **Threshold:** >50 SUNAT queries in 1 hour from a single tenant (baseline: ~10/hour)
- **Expected response:** Within 30 minutes
- **Action:** Verify legitimate business need; check for data exfiltration; review query scope
- **Current status:** NOT logged, NOT alerted — requires SUNAT API wrapper instrumentation

### A8 — Session from New Geo/IP

- **Severity:** Low
- **Threshold:** Login from IP/geo not previously associated with user
- **Expected response:** Within 60 minutes
- **Action:** Verify with user; if unauthorized, revoke session and force password reset
- **Current status:** NOT logged, NOT alerted — requires IP geolocation enrichment

---

## Future Roadmap

### Short Term (Next Quarter)

1. **Structured logging:** Adopt standardized JSON log schema (ECS or custom)
2. **Log aggregation:** Vector → ClickHouse for structured querying
3. **Alerting:** Wire A1–A6 triggers to Fly.io alerting or PagerDuty

### Medium Term (6–12 Months)

1. **Anomaly detection:** Baseline SUNAT query patterns, login geo patterns
2. **SIEM integration:** Feed structured logs to external SIEM (if organizational requirement)
3. **Session anomaly detection:** Concurrent sessions from different IPs

### Long Term (12+ Months)

1. **Automated response:** Auto-revoke sessions for A2/A8, auto-block IPs for A3
2. **Threat intelligence:** Integrate threat feeds for IP reputation scoring

---

## References

- `docs/05-security/incident-response-runbook.md` — Playbooks for when alerts fire
- `docs/05-security/threat-model.md` — STRIDE threat model
- `packages/security/src/secrets/validation.ts` — Startup validation
