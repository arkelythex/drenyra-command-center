# SDD Proposal: API Contracts & Type Safety — Backend Production Readiness

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** B1 de 4 (Backend)
**Dependencia del frontend:** CRÍTICA — el equipo frontend necesita contratos estables para consumir

---

## Executive Summary

Estandarizar y硬化 todos los contratos de API del backend para que el equipo frontend pueda consumir los ~90 endpoints de Drenyra con tipos TypeScript precisos, errores consistentes, y documentación OpenAPI completa. Esto incluye los 14 features nuevos (Phases 2-4) y los endpoints legacy que el frontend agentic va a consumir.

**Target:** "El frontend importa tipos del backend y todo matchea. Cero adivinanzas sobre formas de respuesta, códigos de error, o schemas."

---

## Problem

1. **Sin tipos exportados** — Los endpoints nuevos devuelven `unknown` o tipos inline. El frontend no puede importar tipos compartidos.
2. **Error handling inconsistente** — Cada feature usa `fail()`/`ok()` pero no hay un schema unificado de error que el frontend pueda tipar.
3. **OpenAPI tags incompletos** — Swagger tiene tags para features legacy pero NO para los 14 nuevos. El frontend no descubre los endpoints nuevos via Swagger UI.
4. **Sin CORS configurado** — Si el frontend agentic corre en otro puerto/dominio, las requests van a fallar.
5. **Schemas duplicados** — Los types en `routes.ts` (Elysia t.Object) no están sincronizados con los types que el frontend necesita.
6. **Sin response envelope unificado** — Algunos endpoints devuelven `{ data, total, limit, offset }`, otros devuelven `{ summary, discrepancies }`, otros devuelven el objeto directo.

---

## Solution

### 1. Unified Response Envelope

Todas las respuestas siguen este contrato:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    cursor?: string;
  }
}

// Error
{
  success: false,
  error: {
    code: string;       // "NOT_FOUND" | "VALIDATION_ERROR" | "UNAUTHORIZED" | etc.
    message: string;
    details?: unknown;  // Field-level validation errors
    requestId?: string; // Para tracing
  }
}
```

### 2. Response Type Exports

Cada feature exporta un barrel de tipos:

```typescript
// packages/application/src/features/accounting-prs/types.ts
export interface AccountingPrDTO { ... }
export interface CreatePrRequest { ... }
export interface PrListResponse extends PaginatedResponse<AccountingPrDTO> {}
```

El frontend importa desde `@arkelythex/application/features/accounting-prs`.

### 3. OpenAPI Tags Completos

Registrar tags en Swagger para los 14 features nuevos:

| Tag               | Features          |
| ----------------- | ----------------- |
| Accounting PRs    | accounting-prs    |
| Monthly Close     | monthly-close     |
| SIRE Comparison   | sire-comparison   |
| CFO Analytics     | cfo-analytics     |
| Client Comms      | client-comms      |
| Judgment Day      | judgment-day      |
| Doctor Mode       | doctor-mode       |
| API Marketplace   | api-marketplace   |
| Automation Studio | automation-studio |
| RAG Enterprise    | rag-enterprise    |
| Evidence Vault    | evidence          |
| Firm Dashboard    | firm              |
| Model Router      | model-router      |

### 4. CORS Middleware

```typescript
// app-core.ts
app.use(
  cors({
    origin: [process.env.FRONTEND_URL!, process.env.LANDING_URL!],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
)
```

### 5. Standardized Error Codes

```typescript
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DEPENDENCY_FAILURE: 'DEPENDENCY_FAILURE',
} as const
```

---

## Architecture

```text
apps/api/src/
├── shared/
│   ├── api-response.ts        ← Unified ok/fail con response envelope
│   ├── error-codes.ts         ← Standardized error codes
│   └── plugins/
│       └── cors.ts            ← CORS middleware
│
packages/application/src/
└── features/                  ← Response types por feature
    ├── accounting-prs/types.ts
    ├── monthly-close/types.ts
    ├── sire-comparison/types.ts
    ├── cfo-analytics/types.ts
    ├── client-comms/types.ts
    ├── judgment-day/types.ts
    ├── doctor-mode/types.ts
    ├── api-marketplace/types.ts
    ├── automation-studio/types.ts
    ├── rag-enterprise/types.ts
    └── evidence/types.ts
```

---

## Dependencies

| Plan                      | Dependencia                                                   |
| ------------------------- | ------------------------------------------------------------- |
| Frontend Plan 1 (Shell)   | **Bloqueado por**: CORS + response envelope estables          |
| Frontend Plan 2 (Threads) | **Bloqueado por**: tipos exportados para endpoints de threads |
| Plan B2 (Data Integrity)  | Independiente                                                 |
| Plan B3 (Observability)   | Independiente (puede compartir el response envelope)          |
| Plan B4 (Security)        | Independiente                                                 |

---

## Delivery

**Estrategia:** auto-chain — 3 PRs encadenados

| PR  | Scope                                                       | Archivos | Líneas |
| --- | ----------------------------------------------------------- | -------- | ------ |
| PR1 | Response envelope unificado + error codes + CORS            | 4-6      | ~200   |
| PR2 | Type exports barrel + syncing schemas Elysia ↔ application  | 14-20    | ~500   |
| PR3 | OpenAPI tags completos + validar cobertura de documentación | 6-8      | ~150   |

**Total estimado:** ~850 líneas · 24-34 archivos · 3 PRs

---

## Risks

- Cambiar el response envelope puede romper clientes existentes (frontend legacy, CLI, webhooks). Requiere migración coordinada.
- Algunos features exportan tipos directamente de Drizzle schemas — necesitan DTOs separados para no exponer detalles de DB.
- El frontend puede estar importando tipos de lugares no-canónicos — auditar antes de mover.

---

## Non-goals

- No se cambia la lógica de negocio
- No se agregan nuevos endpoints (solo se硬化 los existentes)
- No se toca la estructura de DB
- No se implementa GraphQL ni BFF layer
