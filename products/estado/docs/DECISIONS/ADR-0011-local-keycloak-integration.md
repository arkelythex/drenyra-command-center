# ADR-0011: Local Keycloak integration for OIDC validation

## Status
Accepted

## Decision
Integrate Keycloak in local docker-compose with imported realm configuration and test users,
plus token helper scripts and RBAC smoke checks.

## Why
Authn/authz changes must be validated against a real OIDC provider before merge,
not only static local token mode.

## Consequences
- Local infra now includes Keycloak and its database.
- Contributors can run `pnpm smoke:rbac` to validate protected routes.
- Realm config becomes a versioned artifact (`configs/keycloak/realm-civictech.json`).
