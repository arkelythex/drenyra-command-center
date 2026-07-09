# Auth Review Lens Skill

> **Trigger**: auth, security, permissions, session, authentication, authorization
> **Scope**: `project`

## Purpose

Guide AI agents performing security-focused code review on Drenyra changes. This is Drenyra's `review-risk` lens specialized for auth/security.

## Review Checklist

### Authentication

- [ ] Session tokens validated on every protected route
- [ ] Token expiry enforced server-side
- [ ] No hardcoded secrets or API keys
- [ ] Password/credential handling follows OWASP guidelines

### Authorization

- [ ] RUC-level access control on every fiscal operation
- [ ] Role-based permissions enforced at service boundary
- [ ] No bypass of organization/company scoping
- [ ] API routes have explicit permission checks

### Data Protection

- [ ] No sensitive data in logs, URLs, or error messages
- [ ] Personal data has appropriate access controls
- [ ] Fiscal data protected per SUNAT regulations
- [ ] API responses never leak internal IDs or secrets

### Session Management

- [ ] Session context includes RUC and organization scope
- [ ] Session timeout enforced for fiscal operations
- [ ] Concurrent session limits for fiscal admin users

## Severity Levels

| Severity   | Meaning                             | Action                |
| ---------- | ----------------------------------- | --------------------- |
| BLOCKER    | Authentication/authorization bypass | Must fix before merge |
| CRITICAL   | Data exposure or secret leak        | Must fix before merge |
| WARNING    | Weak configuration or missing audit | Should fix            |
| SUGGESTION | Pattern improvement                 | Consider              |
