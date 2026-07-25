# Security Baseline y Threat Model — Drenyra F0

**Última actualización:** 2026-07-24
**Content type:** Security — F0 Foundation
**Audiencia:** Arquitectura, seguridad, ingeniería
**Taxonomía:** [Program Taxonomy](../architecture/program-taxonomy.md)

---

## 1. Principios de seguridad

```text
Defense in depth
→ Fail closed
→ Least privilege
→ Deny by default
→ Evidence every action
→ Audit everything
```

1. **Fail closed** — si no se puede determinar autorización, denegar.
2. **Least privilege** — cada rol tiene mínimo necesario para operar.
3. **Deny by default** — capabilities, rutas y datos requieren permiso explícito.
4. **Evidence every action** — toda acción material genera receipt inmutable (RED).
5. **Audit everything** — logs append-only, inmutables, trazables.

---

## 2. Capas de seguridad

```
Identity (Better Auth)
→ Session (JWT/httpOnly cookie)
→ Organization membership
→ Company authorization (TenantScope)
→ Capability matrix
→ Resource scope (RUC, period)
→ Action risk (R0–R3)
→ Approval policy
```

### Implementación actual

| Capa                        | Estado                      | Responsable                         |
| --------------------------- | --------------------------- | ----------------------------------- |
| Identity                    | ✅ better-auth en API + web | `apps/api/src/features/auth/`       |
| Session                     | ✅ JWT + httpOnly cookies   | `apps/api/src/features/auth/`       |
| Organization membership     | ✅ scope-resolver           | `packages/infrastructure/src/auth/` |
| Company authorization       | ✅ companyScopeGuard        | `apps/api/src/shared/plugins/`      |
| Capability matrix           | ✅ Agent Capability Matrix  | `docs/01-architecture/`             |
| Resource scope (RUC/period) | ⚡ parcial                  | H02 tenant isolation                |
| Action risk (R0–R3)         | ◌ pendiente                 | SDD futuro                          |
| Approval policy             | ◌ pendiente                 | SDD futuro                          |

---

## 3. Modelo de autorización

### RBAC actual

| Rol      | Nivel        | Acceso                |
| -------- | ------------ | --------------------- |
| `owner`  | Organización | Todo                  |
| `senior` | Organización | Operaciones avanzadas |
| `junior` | Por company  | Operaciones básicas   |
| `client` | Por company  | Solo lectura básica   |

22 permisos definidos en `packages/infrastructure/src/auth/permissions.ts`.

### Route permission guard

Registro centralizado en `apps/api/src/shared/auth/route-permissions.ts`.

**Todas las rutas `/api/*` requieren autenticación.** Excepciones explícitas:

| Ruta                          | Método | Motivo             |
| ----------------------------- | ------ | ------------------ |
| `/api/health`                 | *      | Health checks      |
| `/api/swagger`                | *      | Documentación      |
| `/api/auth/signup`            | POST   | Registro           |
| `/api/auth/login`             | POST   | Login              |
| `/api/auth/logout`            | POST   | Logout             |
| `/api/auth/session`           | GET    | Sesión             |
| `/api/auth/forgot-password`   | POST   | Recuperación       |
| `/api/auth/reset-password`    | POST   | Reset              |
| `/api/auth/verify-email`      | POST   | Verificación       |
| `/api/auth/send-verification` | POST   | Envío verificación |

---

## 4. Data protection

| Tipo              | Protección                | Estado         |
| ----------------- | ------------------------- | -------------- |
| Passwords         | hash + salt (better-auth) | ✅             |
| Session tokens    | httpOnly cookies, secure  | ✅             |
| API tokens        | Bearer auth               | ✅             |
| Tenant isolation  | RLS + scope-resolver      | ⚡ en progreso |
| RUC data          | scoped por company        | ✅             |
| PII (email, name) | scoped por org            | ✅             |
| Secrets           | env vars, vault           | ✅             |
| Evidence          | S3 + hash chain           | ✅             |

### RLS (Row-Level Security)

Objetivo: defensa en profundidad. Incluso si la capa de aplicación falla, RLS en PostgreSQL impide acceso cross-tenant.

**Estado:** ⚡ en progreso (H02 tenant isolation)

---

## 5. Threat model F0

### 5.1 Autenticación

| Threat            | Impacto | Probabilidad | Mitigación                                  | Estado |
| ----------------- | ------- | ------------ | ------------------------------------------- | ------ |
| Session hijacking | ALTO    | Media        | httpOnly cookies, secure flag, short expiry | ✅     |
| Brute force login | MEDIO   | Alta         | Rate limiting (60 req/min)                  | ✅     |
| CSRF              | ALTO    | Baja         | CORS configuration + SameSite cookies       | ✅     |
| Token leakage     | ALTO    | Baja         | Bearer tokens only in Authorization header  | ✅     |

### 5.2 Multi-tenancy

| Threat                            | Impacto | Probabilidad | Mitigación                           | Estado     |
| --------------------------------- | ------- | ------------ | ------------------------------------ | ---------- |
| Cross-company data access         | CRÍTICO | Media        | scope-resolver, RLS                  | ⚡ parcial |
| IDOR (Insecure Direct Object Ref) | CRÍTICO | Alta         | TenantScope validation en cada query | ⚡ parcial |
| Company ID enumeration            | MEDIO   | Media        | UUIDs no secuenciales                | ✅         |

### 5.3 API

| Threat                 | Impacto | Probabilidad | Mitigación                             | Estado   |
| ---------------------- | ------- | ------------ | -------------------------------------- | -------- |
| Unauthenticated access | ALTO    | Baja         | Route permission guard + session check | ✅       |
| Permission escalation  | CRÍTICO | Baja         | RBAC + requirePermission por endpoint  | ✅ nuevo |
| Rate limiting bypass   | MEDIO   | Media        | rateLimiter (100 req/min default)      | ✅       |
| Injection (SQL, NoSQL) | CRÍTICO | Baja         | Drizzle ORM + parameterized queries    | ✅       |
| Mass assignment        | MEDIO   | Media        | Zod schemas en cada endpoint           | ✅       |

### 5.4 Datos fiscales

| Threat                             | Impacto | Probabilidad | Mitigación                             | Estado     |
| ---------------------------------- | ------- | ------------ | -------------------------------------- | ---------- |
| Data leak (RUC, IGV, transactions) | CRÍTICO | Baja         | Tenant scope + RLS + encrypted storage | ⚡ parcial |
| Tampering con evidence             | CRÍTICO | Baja         | Hash chain + S3 immutability           | ✅         |
| SUNAT credential exposure          | CRÍTICO | Media        | Vault + per-tenant encryption          | ◌          |

### 5.5 Agentes e IA

| Threat                       | Impacto | Probabilidad | Mitigación                          | Estado |
| ---------------------------- | ------- | ------------ | ----------------------------------- | ------ |
| Unsanctioned agent action    | CRÍTICO | Media        | Capability matrix + deny-by-default | ✅     |
| Tool misuse                  | ALTO    | Media        | Per-tool permissions                | ✅     |
| Data leakage via prompts     | ALTO    | Media        | Context filtering, PII redaction    | ◌      |
| Model hallucination (fiscal) | CRÍTICO | Media        | Deterministic validation gates      | ◌      |

---

## 6. Security testing requirements

| Tipo                          | Cobertura              | Herramienta       | Estado     |
| ----------------------------- | ---------------------- | ----------------- | ---------- |
| Unit: permission guards       | Todas las rutas        | Vitest            | ✅         |
| Integration: auth flow        | Login, signup, session | Vitest            | ✅         |
| Integration: tenant isolation | Cross-company access   | Vitest            | ⚡ parcial |
| SAST                          | Código TS              | Biome             | ✅         |
| Dependency audit              | Supply chain           | `bun audit`       | ◌          |
| Secret scanning               | Repo                   | gitleaks          | ◌          |
| RLS validation                | DB-level               | Tests específicos | ◌          |

---

## 7. Próximos pasos

1. **Cerrar H02 tenant isolation** — RLS + scope hardening (en progreso)
2. **Threat model por dominio** — ledger, payments, SUNAT (futuro)
3. **Secret scanning CI** — gitleaks en pipeline
4. **Penetration testing** — antes de F1
5. **R0–R3 risk levels** — integrar en permission guard
6. **Sunset allowHeaderFallback** — migrar todas las rutas a session-only

---

## 8. Referencias

- [Route Permission Registry](../../apps/api/src/shared/auth/route-permissions.ts) — implementación
- [Permission Guard](../../apps/api/src/shared/plugins/permission-guard.ts) — middleware
- [Capability Map](./capability-map.md) — capacidades F0
- [Canonical Stack](./canonical-stack.md) — arquitectura
