# Keycloak Local Setup v1

## Purpose
Provide a reproducible local OIDC provider for testing admin/moderation RBAC.

## Services
- Keycloak: `http://localhost:8081`
- Realm imported on startup: `civictech`
- Realm file: `configs/keycloak/realm-civictech.json`

## Default local users
- `admin_user` / `admin_user_pass` -> roles: `ADMIN`, `MODERATOR`
- `moderator_user` / `moderator_user_pass` -> roles: `MODERATOR`

## Enable OIDC mode in API
1. Set in `.env`:
   - `AUTH_MODE=oidc`
2. Ensure OIDC vars point to local Keycloak endpoints.
3. Restart API process.

## Fetch test tokens
- Wait for realm (if just started):
  ```bash
  bash ./scripts/keycloak/wait-ready.sh 180
  ```
- Admin token:
  ```bash
  pnpm keycloak:token:admin
  ```
- Moderator token:
  ```bash
  pnpm keycloak:token:moderator
  ```

## Run RBAC smoke checks
```bash
pnpm smoke:rbac
```

## Notes
- `AUTH_MODE=dev_static` remains default for fast local development.
- OIDC mode should be used before merging auth-sensitive changes.
- CI runs this flow in `.github/workflows/integration-auth.yml`.
