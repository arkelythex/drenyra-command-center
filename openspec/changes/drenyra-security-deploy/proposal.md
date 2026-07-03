# SDD Proposal: Security & Deployment — Backend Production Readiness

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** B4 de 4 (Backend)
**Dependencia del frontend:** MEDIA — tenant isolation y rate limiting protegen al frontend de abusos

---

## Executive Summary

Auditar y硬化 la seguridad del backend: tenant isolation en todos los features, rate limiting, validación de entrada, configuración de entorno, y pipeline de deployment. Drenyra maneja datos fiscales de múltiples empresas — una fuga de datos entre tenants es catastrófica.

**Target:** "Cada endpoint verifica companyId. Cada input está validado. Cada deployment es reproducible. No hay secrets en el código."

---

## Problem

1. **Tenant isolation no auditado** — No sabemos si los 61 features verifican `companyId` consistentemente. Algunos usan `companyScopeGuard`, otros validan manualmente, otros pueden no validar.
2. **Sin rate limiting para features nuevos** — No hay protección contra abuso en los 14 features nuevos de Phases 2-4.
3. **Sin configuración de entorno** — No hay `.env.example`, no hay validación de variables de entorno requeridas al startup.
4. **Sin Docker/deployment pipeline** — No hay Dockerfile, docker-compose, o scripts de CI/CD.
5. **Input validation superficial** — Algunos features usan Elysia `t.Object` básico sin validaciones de negocio más profundas.
6. **Sin audit trail de operaciones sensibles** — No hay logging de quién creó/aprobó/rechazó PRs, quién resolvió discrepancias, quién ejecutó workflows.

---

## Solution

### 1. Tenant Isolation Audit

Auditar todos los 61 features:

```typescript
// apps/api/scripts/audit-tenant-scoping.ts
// Recorre todas las rutas registradas y verifica que usen companyScopeGuard
// o tengan validación explícita de companyId
```

| Categoría                 | Features     | Acción               |
| ------------------------- | ------------ | -------------------- |
| ✅ Usan companyScopeGuard | ~30 features | Verificar            |
| ⚠️ Validación manual      | ~15 features | Estandarizar a guard |
| ❌ Sin scoping            | ~16 features | Agregar guard        |

Features de Phases 2-4 a verificar específicamente:

- `accounting-prs` → ✅ ya usa companyScopeGuard (fixeado en Risk 2)
- `monthly-close` → ✅ ya usa
- `sire-comparison` → ✅ ya usa
- `cfo-analytics` → Verificar
- `client-comms` → Verificar
- `judgment-day` → Verificar
- `doctor-mode` → Verificar
- `api-marketplace` → Verificar
- `automation-studio` → ✅ ya usa
- `rag-enterprise` → Verificar

### 2. Rate Limiting

Agregar rate limiting global y por feature:

```typescript
// apps/api/src/shared/plugins/rate-limiter.ts
app.use(
  rateLimit({
    window: 60_000, // 1 minuto
    max: 100, // 100 requests por minuto global
    keyGenerator: (req) => {
      return (
        (req.headers['x-company-id'] as string) ??
        (req.headers['authorization'] as string)
      )
    },
    errorResponse: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas requests. Intente en 60 segundos.',
      },
    },
  })
)
```

Endpoints sensibles con rate limits más estrictos:

| Endpoint                                    | Rate limit | Razón                  |
| ------------------------------------------- | ---------- | ---------------------- |
| POST `/auth/*`                              | 10/min     | Login                  |
| POST `/api/v1/evidence/upload`              | 30/min     | Upload                 |
| POST `/api/v1/automation/workflows/:id/run` | 10/min     | Ejecución de workflows |
| GET `/api/sire/comparison/*`                | 20/min     | SIRE queries           |

### 3. Environment Configuration

```bash
# apps/api/.env.example — todas las variables requeridas con defaults
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/drenyra

# Auth
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1h

# Frontend
FRONTEND_URL=http://localhost:5173

# External
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SUNAT_API_BASE=https://api.sunat.gob.pe
SUNAT_API_KEY=

# AI
AI_GATEWAY_URL=http://localhost:4000
MODEL_ROUTER_DEFAULT=openai/gpt-4o

# Logging
LOG_LEVEL=info

# Features (toggle)
FEATURE_RAG_ENABLED=true
FEATURE_AUTOMATION_ENABLED=true
FEATURE_MARKETPLACE_ENABLED=false
```

Validar al startup:

```typescript
// apps/api/src/config/env.ts
import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  FRONTEND_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

### 4. Docker + Deployment

```dockerfile
# Dockerfile (apps/api)
FROM oven/bun:1.3.11 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.3.11 AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.9'
services:
  api:
    build: ./apps/api
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgres://drenyra:drenyra@db:5432/drenyra
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: drenyra
      POSTGRES_PASSWORD: drenyra
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U drenyra']
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 5. Input Validation Hardening

Auditar schemas de validación en features nuevos. Agregar:

- Validación de UUID format en todos los IDs
- Validación de rangos en montos (totalDebitCents > 0)
- Sanitización de strings (no HTML, no SQL injection)
- Rate limiting por IP para endpoints públicos

### 6. Audit Trail

Agregar logging estructurado de operaciones sensibles:

```typescript
// audit log entry structure
{
  action: 'accounting-pr.approve',
  actor: userId,
  target: prId,
  companyId,
  timestamp: ISOString,
  metadata: { previousStatus: 'PENDING_REVIEW', newStatus: 'APPROVED' }
}
```

Para features:

- `accounting-prs`: create, submit, approve, reject, post
- `judgment-day`: run review, acknowledge finding, resolve finding
- `monthly-close`: gate override, checklist complete
- `evidence`: upload, delete, classify
- `sire-comparison`: resolve discrepancy, generate report

---

## Architecture

```text
apps/api/
├── .env.example                    ← Template de entorno
├── Dockerfile                      ← Multi-stage build
├── docker-compose.yml              ← API + DB
├── src/
│   ├── config/
│   │   └── env.ts                  ← Zod schema de entorno
│   └── shared/
│       └── plugins/
│           ├── rate-limiter.ts      ← Rate limiting middleware
│           └── audit-logger.ts      ← Audit trail middleware
│
└── scripts/
    └── audit-tenant-scoping.ts     ← Script de auditoría
```

---

## Dependencies

| Plan                     | Dependencia                                     |
| ------------------------ | ----------------------------------------------- |
| Plan B1 (API Contracts)  | El error handler debe parsear rate limit errors |
| Plan B2 (Data Integrity) | Independiente                                   |
| Plan B3 (Observability)  | Audit trail usa Pino logger del B3              |

---

## Delivery

**Estrategia:** auto-chain — 3 PRs encadenados

| PR  | Scope                                                | Archivos | Líneas |
| --- | ---------------------------------------------------- | -------- | ------ |
| PR1 | Tenant isolation audit + fixes + env config + Docker | 10-15    | ~300   |
| PR2 | Rate limiting por feature + input validation audit   | 8-12     | ~250   |
| PR3 | Audit trail + deployment scripts                     | 6-8      | ~200   |

**Total estimado:** ~750 líneas · 24-35 archivos · 3 PRs

---

## Risks

- Rate limiting puede romper integraciones existentes (Marketplace webhooks, AI agent calls). Necesita allowlist para ciertos consumers.
- Tenant isolation audit puede descubrir features que operan sin scoping — hay que priorizar fixes por criticidad fiscal.
- Docker compose expone DB en la red interna — asegurar que no sea accesible desde afuera.
- El audit trail agrega writes adicionales a DB — monitorear impacto en performance.

---

## Non-goals

- No se implementa RBAC/ABAC completo (solo tenant isolation)
- No se implementa OAuth 2.0 ni SSO
- No se agrega encriptación de datos en reposo
- No se implementa Vault ni secret management (solo env vars)
- No se configura CI/CD con GitHub Actions (solo Docker compose local)
