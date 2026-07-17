# Threat Model v0 (STRIDE-lite)

## Threats
- Spoofing: fake reports or impersonation
- Tampering: evidence manipulation
- Repudiation: denial of actions
- Information disclosure: doxxing or PII leaks
- DoS: spam/flood abuse
- Elevation of privilege: moderator/admin abuse

## Controls (v0)
- Rate limiting and abuse heuristics
- Evidence stored immutably (hashing) and append-only audit log
- RBAC/ABAC for moderation workflows
- OIDC + RBAC protection for privileged endpoints (admin/moderation)
- PII minimization and segregation
- Anti-doxxing policy and tooling
