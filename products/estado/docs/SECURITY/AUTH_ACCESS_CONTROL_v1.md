# Auth and Access Control v1

## Objective
Protect admin and moderation actions with explicit authentication and RBAC.

## Protected endpoint classes
- Admin endpoints: require `ADMIN` role.
- Moderation endpoints: require `MODERATOR` or `ADMIN` role.
- Public endpoints remain unauthenticated.

## Auth modes
1. `dev_static` (default local)
- Uses static bearer tokens from env:
  - `DEV_ADMIN_TOKEN`
  - `DEV_MODERATOR_TOKEN`
- Useful for local development and smoke tests.

2. `oidc` (production target)
- Validates JWT bearer tokens against OIDC JWKS endpoint.
- Expected issuer/audience are validated.
- Roles are extracted from common Keycloak claim structures:
  - `realm_access.roles`
  - `resource_access[OIDC_CLIENT_ID].roles`
  - top-level `roles`

3. `disabled` (local debugging only)
- Authentication bypassed.
- Not allowed for shared or production environments.

## Role mapping
- `ADMIN` -> full access to admin + moderation endpoints.
- `MODERATOR` -> moderation endpoints.

## Required environment variables
- `AUTH_MODE`
- `OIDC_ISSUER_URL`, `OIDC_AUDIENCE`, `OIDC_CLIENT_ID`, `OIDC_JWKS_URL`
- `AUTH_JWKS_CACHE_TTL_SECONDS`

## Security controls
- Missing/invalid bearer token => `401`.
- Authenticated without required role => `403`.
- Actor identity is appended to audit log for protected transitions/actions.
- Auth decisions are exposed as metrics (`civictech_auth_decisions_total`) for incident detection.
- OIDC + RBAC flow is validated in CI (`.github/workflows/integration-auth.yml`).

## Keycloak baseline (recommended)
- Realm: `civictech`
- Client: `civictech-api` (confidential/public depending deployment)
- Realm/client roles: `ADMIN`, `MODERATOR`
- Token includes role claims and expected audience.
