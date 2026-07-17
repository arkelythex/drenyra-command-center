# ADR-0010: OIDC authentication and RBAC baseline

## Status
Accepted

## Decision
Adopt OIDC/JWKS token validation (Keycloak-compatible) with role-based authorization:
- `ADMIN` for admin endpoints
- `MODERATOR` or `ADMIN` for moderation endpoints

Include `dev_static` mode for local development and smoke tests.

## Why
Civic workflows require attributable moderation/admin actions and explicit least-privilege control.

## Consequences
- Production deployments must provide OIDC configuration and role mapping.
- Access failures become observable via `401/403` metrics and audit logs.
- Local DX remains fast via static dev tokens.
