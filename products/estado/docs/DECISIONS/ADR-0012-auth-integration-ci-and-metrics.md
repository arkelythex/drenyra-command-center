# ADR-0012: Auth integration CI and auth observability metrics

## Status
Accepted

## Context
Auth/RBAC behavior is a high-risk area for civic workflows:
- False allow can expose sensitive actions.
- False deny can block moderation/admin operations.
- OIDC integration failures (JWKS, issuer/audience mismatch) can fail silently without dedicated telemetry.

## Decision
1. Add a dedicated GitHub Actions integration workflow that validates OIDC + RBAC end-to-end using local Keycloak and smoke checks.
2. Expose Prometheus metrics in API (`/metrics`) with:
   - HTTP request counters and latency histogram.
   - Auth decision counters (`authenticated`, `authorized`, `unauthorized`, `forbidden`, `auth_error`).
3. Add readiness helpers for local/dev/CI reliability:
   - `scripts/keycloak/wait-ready.sh`
   - `scripts/wait-for-http.sh`

## Consequences
+ Detects auth regressions before merge.
+ Provides operational visibility for 401/403 spikes and auth backend failures.
+ Improves reproducibility in local onboarding and CI.
- Adds CI runtime and additional maintenance surface for auth test harness.
