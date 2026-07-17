# Runbook Auth v1

## Symptoms
- `401 Unauthorized` spikes on moderation/admin endpoints.
- `403 Forbidden` for valid users.
- OIDC token validation failures after key rotation.

## Quick checks
1. Confirm `AUTH_MODE` value.
2. Validate bearer token is present in `Authorization: Bearer <token>`.
3. For OIDC mode, confirm:
   - `OIDC_ISSUER_URL`
   - `OIDC_AUDIENCE`
   - `OIDC_CLIENT_ID`
   - `OIDC_JWKS_URL`
4. Check API logs for JWT/JWKS errors.
5. Check auth metrics:
   - `curl -s http://localhost:8080/metrics | grep civictech_auth_decisions_total`

## Common causes
- Wrong audience/issuer in token.
- Missing role claim (`ADMIN`/`MODERATOR`).
- Stale JWKS cache after key rotation.
- Incorrect Keycloak client role assignment.

## Mitigations
- Re-issue token with correct audience/roles.
- Verify Keycloak role mapping and user assignments.
- Reduce `AUTH_JWKS_CACHE_TTL_SECONDS` temporarily during rotation.
- For local only: switch to `AUTH_MODE=dev_static` while debugging.
- For local OIDC validation: follow `docs/OPERATIONS/KEYCLOAK_LOCAL_v1.md`.
- Confirm Keycloak readiness with `bash scripts/keycloak/wait-ready.sh`.

## Escalation
- Sev-1 if admin/moderation access fully blocked in production.
- Open incident and attach representative trace IDs/log entries.
