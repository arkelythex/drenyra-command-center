# Secret Management — Drenyra Security Foundation

**Version:** 1.0.0
**Last Reviewed:** 2026-07-25
**Author:** Drenyra Security Team

---

## Purpose

Document the complete inventory of secrets in the Drenyra stack, their rotation procedures, and the migration strategy toward a vault-based secret management solution (Infisical).

---

## Secrets Inventory

| #   | Secret Name                  | Scope | Rotation Frequency                   | Blast Radius if Compromised                              | Required |
| --- | ---------------------------- | ----- | ------------------------------------ | -------------------------------------------------------- | -------- |
| 1   | `BETTER_AUTH_SECRET`         | all   | Quarterly or on suspected compromise | All user sessions invalidated; password reset tokens     | Yes      |
| 2   | `DATABASE_URL`               | all   | Quarterly                            | Full database access; all data exposed                   | Yes      |
| 3   | `SUNAT_CLIENT_ID`            | prod  | Per SUNAT policy (manual)            | SUNAT API access; tax declaration capability             | Yes      |
| 4   | `SUNAT_CLIENT_SECRET`        | prod  | Per SUNAT policy (manual)            | SUNAT API access; tax declaration capability             | Yes      |
| 5   | `DRENYRA_MASTER_KEY`         | all   | Annually or on compromise            | All AES-256-GCM encrypted data; fiscal records, AI state | Yes      |
| 6   | `LLM_GATEWAY_KEY_PASSPHRASE` | all   | Quarterly                            | AI provider API keys; LLM access for all tenants         | Yes      |
| 7   | `ARKELYTHEX_AES256_KEY`      | all   | Annually or on compromise            | Legacy encrypted data; journal entries, fiscal records   | Yes      |
| 8   | `R2_ACCESS_KEY_ID`           | all   | Quarterly                            | Object storage access; document uploads and exports      | Yes      |
| 9   | `R2_SECRET_ACCESS_KEY`       | all   | Quarterly                            | Object storage access; document uploads and exports      | Yes      |

---

## Rotation Procedures

### `BETTER_AUTH_SECRET`

**When:** Quarterly, or immediately after suspected compromise.

1. Generate new secret: `openssl rand -base64 48`
2. Deploy to all application instances (Fly.io secrets or `.env`)
3. Restart all instances simultaneously
4. **Blast radius:** ALL existing user sessions are invalidated. Users must re-authenticate.
5. Password reset tokens issued before rotation are invalidated.
6. **Recommendation:** Schedule during low-traffic maintenance window. Notify users 24h in advance.

### `DRENYRA_MASTER_KEY`

**When:** Annually, or immediately after suspected compromise.

1. Generate new key: `openssl rand -base64 32`
2. Deploy new key as `DRENYRA_MASTER_KEY_NEW` to all instances
3. Run data re-encryption job: decrypt with old key → encrypt with new key
4. Verify re-encrypted data integrity
5. Deploy new key as `DRENYRA_MASTER_KEY`, remove old
6. Restart all instances
7. **Blast radius:** All AES-256-GCM encrypted data must be re-encrypted. This is a data migration window.
8. **Current limitation:** Online rotation is not supported. Requires maintenance window with application downtime.
9. **Roadmap:** Envelope encryption with key versioning (see Infisical migration below).

### Other Secrets

- `DATABASE_URL`: Generate new credentials in PostgreSQL, update connection string, rolling restart.
- `SUNAT_CLIENT_*`: Follow SUNAT's credential rotation process. Manual procedure — coordinate with SUNAT support.
- `LLM_GATEWAY_KEY_PASSPHRASE`: Generate new passphrase, re-encrypt key store, rolling restart.
- `R2_*`: Generate new API tokens in Cloudflare dashboard, update env vars, rolling restart.

---

## Infisical Migration Strategy

### Phase A — Assessment (Current)

- Audit current secret usage across all environments
- Document blast radius and rotation frequency per secret
- Identify which secrets are compatible with Infisical's secret reference syntax
- **Effort:** 1-2 days engineering time

### Phase B — Deployment (Next SDD)

1. Deploy Infisical agent to all environments (dev → staging → prod)
2. Import all secrets from `.env` files and Fly.io secrets into Infisical
3. Implement `InfisicalProvider` implementing `SecretProvider` interface
4. Switch `SECRET_PROVIDER=infisical` feature flag in dev
5. Validate all consumers resolve secrets correctly via Infisical
6. Promote to staging → production
7. **Downtime:** None (rolling feature flag switch)
8. **Effort:** 3-5 days engineering time

### Phase C — Cleanup (Next SDD + 1)

1. Remove `EnvProvider` as default fallback
2. Remove plaintext secrets from `.env` files (replace with Infisical references)
3. Enable Infisical's automatic rotation for compatible secrets
4. Remove manual rotation procedures from this document
5. **Effort:** 1-2 days engineering time

---

## Environment Variable Conventions

- `.env.example`: Template with placeholder values — committed to repository
- `.env`: Local development secrets — NEVER committed (in `.gitignore`)
- Fly.io: Secrets set via `fly secrets set` — not stored in repository
- CI: Secrets injected via GitHub Actions secrets — never in workflow files

### Pre-Commit Hook

A pre-commit hook scans staged files for secret-like patterns and rejects commits containing:

- API key formats (32+ alphanumeric characters)
- Private key headers (`BEGIN RSA/EC/OPENSSH/PGP PRIVATE KEY`)
- Connection strings with embedded credentials
- High-entropy base64 strings (40+ characters)

Bypass with `// nosec` comment on the flagged line (logged for audit).

---

## References

- `packages/security/src/secrets/` — `SecretProvider` interface and `EnvProvider` implementation
- `packages/security/src/secrets/inventory.ts` — Canonical secrets inventory in code
- `packages/security/src/secrets/validation.ts` — Startup validation logic
