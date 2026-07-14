# WAVE 3A — TENANT BOUNDARY CLOSURE Design

**Status:** Design Complete — Pending Review
**Based on:** H02 Validation Gate (attack tests executed against PostgreSQL)
**Blocking:** `drenyra-api-real-data` (cannot introduce real data until gate is closed)

---

## 1. Executive Summary

Wave 3A closes the tenant boundary gap between Wave 1 (repository-level protection) and the HTTP/auth layer. Wave 1 protected 17 of 130 routes via `companyScopeGuard()` and hardened account/journal repositories with `TenantScope`. What remained unprotected: **86 routes with no tenant scoping** and **26 with unverified scoping**, including the critical attack paths demonstrated in this gate.

**Total evidence:** 12 attack vectors tested — 12 succeeded (100% exploit rate for Cases, SIRE, AI Swarm).

### SIRE Containment Status

| Item                                      | Estado                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| Fly.io deployment (`drenyra-api.fly.dev`) | 🔴 No reachable (connection refused)                                      |
| SIRE_JWT_SECRET in `.env`                 | ⚠️ Placeholder (`change_me_min_32_chars`) — debe rotarse antes del deploy |
| SIRE route auth middleware                | ✅ Existe (JWT HS256 con companyId en claims)                             |
| Resolución de companyId                   | ⚠️ Del body/query/headers del cliente — vulnerable incluso con JWT        |
| Contención inmediata requerida            | ❌ No — no está desplegado. Documentado para deploy futuro.               |

> **SIRE no necesita deshabilitación inmediata** porque la app Fly.io no responde y no hay otro deployment identificado. Sin embargo, el placeholder `SIRE_JWT_SECRET` debe cambiarse a un valor seguro ANTES de cualquier deploy. Los logs de auditoría de submissions deben revisarse al momento del deploy. No se rotan credenciales porque no hay credenciales SUNAT reales en uso.

---

## 2. H02 Validation Gate — Attack Results

### 2.1 Drenyra Fiscal Cases — Ruta 1

| #   | Ataque                                             | Resultado | Impacto                                                                      |
| --- | -------------------------------------------------- | :-------: | ---------------------------------------------------------------------------- |
| 1   | Tenant B READ case de Tenant A por ID + scope de A | ✅ Éxito  | Atacante necesita conocer scope de víctima (company_id, org_id, ruc, period) |
| 2   | Tenant B LIST cases con scope de Tenant A          | ✅ Éxito  | Atacante lista todos los casos fiscales de la víctima                        |
| 3   | Tenant B UPDATE status de case de Tenant A         | ✅ Éxito  | Atacante cambia estado (OPEN → CANCELLED)                                    |
| 4   | Tenant B DELETE case de Tenant A                   | ✅ Éxito  | Atacante elimina registros fiscales                                          |
| 5   | Tenant B READ sin scope filter (solo ID)           | ✅ Éxito  | Solo necesita conocer el ID                                                  |

**Stack completo:**

```
HTTP headers (x-company-id, x-user-id, x-company-ruc, x-fiscal-period)  ← CLIENTE
  │
  ▼
resolveDrenyraActorContext(headers)  ← drenyra-context.ts:36
  │   organizationId = x-organization-id ?? companyId  ← CLIENTE
  │   Sin JWT, sin membership check
  ▼
DrenyraActorContext  ← confiado sin verificar
  │
  ▼
service.makeScope(context)  ← traslada valores NO verificados a FiscalScope
  │
  ▼
repository.{listFiscalCases, getFiscalCaseById, updateFiscalCase}(scope)
  │   SQL WHERE company_id=$1 AND company_ruc=$2 AND period=$3 AND org_id=$4
  │   Filtra por valores del CLIENTE — no hay validación de pertenencia
  ▼
Datos del tenant A devueltos al tenant B
```

**Veredicto refinado: CONFIRMED.** No existe autenticación/membership superior. `resolveDrenyraActorContext` confía en headers sin verificar contra sesión. El único obstáculo para el atacante es conocer el scope (company_id, ruc, period), pero company_id y ruc son semi-públicos (RUC peruano).

### 2.2 SIRE Submission — Ruta 2

| #   | Ataque                                                                                     |     Resultado      | Impacto                                         |
| --- | ------------------------------------------------------------------------------------------ | :----------------: | ----------------------------------------------- |
| 1   | Tenant B READ submission status por idempotency_key (sin company filter)                   |      ✅ Éxito      | fuga de estado de envío SUNAT                   |
| 2   | Tenant B UPDATE submission (solo filter por id, sin company)                               |      ✅ Éxito      | modifica registro de envío de otro tenant       |
| 3   | Tenant B CREATE submission con company_id de Tenant A en body                              |      ✅ Éxito      | crea registro como si fuera Tenant A            |
| 4   | [TRACE] company_id del body → resolveTenantSunatContext → credenciales SUNAT de la víctima | ✅ Ruta demostrada | **Envío SUNAT en nombre de otro contribuyente** |

**Stack completo:**

```
HTTP body: { companyId: "victim-company-id", period: "2026-07", ruc: "20546296564", ... }  ← CLIENTE
  │
  ▼
enforceGovernancePolicy(...)  ← solo governance, SIN scope check
  │
  ▼
submitWithAudit(input, ...)  ← sire-submission-with-audit.service.ts:192
  │
  ├─► findByIdempotencyKey(key)  ← SQL sin company filter (CRÍTICO)
  │     SELECT ... FROM sire_submissions WHERE idempotency_key = $1
  │
  ├─► create({ companyId: input.companyId, ... })  ← SQL INSERT confiando en body
  │     INSERT INTO sire_submissions (company_id, ...) VALUES (victim-company-id, ...)
  │
  └─► resolveSubmissionTenantContext(input)  ← tenant-sunat-context.service.ts:120
        │  input.companyId = victim-company-id (del body)
        │
        ├─► lookupCompany(victim-company-id)  ← obtiene RUC real de la víctima
        │
        ├─► credentialProvider.resolve({ ruc: victim-ruc })  ← obtiene credenciales SUNAT de la víctima
        │
        └─► SireSubmissionService.submit(input, { tenantSunatContext })
              │  Envía a SUNAT usando credenciales de la VÍCTIMA
              │  Con datos del ATACANTE (ledgerType, period, payload)
              ▼
        DECLARACIÓN SUNAT EN NOMBRE DE OTRO CONTRIBUYENTE
```

**Veredicto refinado: CONFIRMED — CRÍTICO FISCAL.** No es solo data leak. Es **action forgery**: un atacante puede enviar declaraciones SIRE a SUNAT usando las credenciales de otro contribuyente. El `assertIdempotencyCompanyScope` solo detecta REUSE de idempotency key, no protege contra primer uso.

### 2.3 Electronic Invoicing — CDR Webhook — Ruta 3

| #   | Ataque                                                              |   Resultado   | Impacto                                                            |
| --- | ------------------------------------------------------------------- | :-----------: | ------------------------------------------------------------------ |
| 1   | invoiceNumber único global, sin x-company-id, webhook procesa igual | ⚠️ Potencial  | Depende de unicidad real del invoiceNumber                         |
| 2   | findTransactionWithTags(id) sin company filter                      | ✅ Confirmado | `CpeRepository.findTransactionWithTags` no filtra por company      |
| 3   | findTransactionForStatusSync(id) sin company filter                 | ✅ Confirmado | `CpeRepository.findTransactionForStatusSync` no filtra por company |

**Stack parcial:**

```
Webhook POST /api/electronic-invoicing/webhooks/cdr  ← OSE externo
  body: { invoiceNumber, cdrStatus, providerReference }
  headers: { x-company-id? }  ← opcional

  │
  ├─► processCdrWebhook(input)
  │     │
  │     ├─► Si hay x-company-id: findTransactionByIdAndCompany(id, companyId)
  │     │     SQL: WHERE id=$1 AND company_id=$2  ← SEGURO
  │     │
  │     ├─► Si NO hay x-company-id: busca por invoiceNumber
  │     │     invoiceNumber único + sin header → procesa
  │     │     invoiceNumber ambigüo + sin header → 404 (test existente)
  │     │
  │     ├─► findTransactionWithTags(id)  ← SIN company filter (LO-002)
  │     └─► findTransactionForStatusSync(id)  ← SIN company filter (LO-003)
```

**Veredicto refinado: NEEDS REVIEW.** No se pudo ejecutar ataque PostgreSQL porque la tabla `transactions` no existe en la BD actual (migración no aplicada). Los métodos `findTransactionWithTags` y `findTransactionForStatusSync` NO tienen company filter en su SQL. El riesgo real depende de si el webhook está autenticado/firmado por OSE — el handler no verifica firma. Requiere revisión de autenticación del webhook OSE externo.

### 2.4 Compliance Accounting Jobs — Ruta 4

**Stack completo:**

```
GET /api/compliance/accounting-jobs?countryCode=PE
  │
  ▼
getAccountingJobs(countryCode)  ← catálogo estático en memoria
  │  No toca BD transaccional
  ▼
Referencia pública por país
```

**Veredicto refinado: SAFE.** Datos estáticos de referencia. Sin impacto de tenant. Excluido de H02.

### 2.5 AI Swarm — Ruta 5

| #   | Ataque                                                            |   Resultado   | Impacto                        |
| --- | ----------------------------------------------------------------- | :-----------: | ------------------------------ |
| 1   | Tenant B QUERY batch_runs con company_id de Tenant A              |   ✅ Éxito    | Ve batches de otro tenant      |
| 2   | Tenant B UPDATE batch_runs (sin company filter, solo por id)      |   ✅ Éxito    | Modifica batch de otro tenant  |
| 3   | [TRACE] organizationId resuelto de headers/body/query del cliente | ✅ Confirmado | Sin verificación contra sesión |

**Stack parcial:**

```
HTTP headers (x-organization-id, x-company-id, x-tenant-id) / query / body
  │
  ▼
resolveWorkflowOrganizationId(request)  ← organization-context.ts
  │  Busca orgId en: query → body → headers → env fallback
  │  Solo detecta CONFLICTOS entre fuentes, no verifica pertenencia
  │  Fallback: AI_SWARM_DEFAULT_ORG_ID (misma para todos)
  ▼
organizationId (no validado) → audit log, no usado en queries SQL directas
  │
  ▼
workflow.execute(body)  ← invoca agentes internos
  │  batch_runs tiene company_id pero SQL UPDATE solo filtra por id
  ▼
Batch de Tenant A modificable por Tenant B
```

**Veredicto refinado: CONFIRMED.** `batch_runs` es modificable por ID sin company filter. `resolveOrganizationContextForRequest` no autentica, solo colecta. Sin embargo, el impacto es menor que SIRE: AI Swarm process-invoices no escribe datos fiscales directamente — pero puede leer documentos de otro tenant si el agente interno usa el orgId no verificado.

---

## 3. Matriz de rutas

| Ruta       | Path                                      |     Tipo     |        H02 Scope        |                        Veredicto                         |
| ---------- | ----------------------------------------- | :----------: | :---------------------: | :------------------------------------------------------: |
| Cases      | `/api/drenyra/cases`                      | tenant-owned |      🔴 CONFIRMED       |   `companyScopeGuard` ausente, headers no verificados    |
| Cases      | `/api/drenyra/cases/:id`                  | tenant-owned |      🔴 CONFIRMED       |                           Idem                           |
| Cases      | `/api/drenyra/cases/:id/status`           | tenant-owned |      🔴 CONFIRMED       |                           Idem                           |
| SIRE       | `/api/sire/submit`                        | tenant-owned | 🔴 CONFIRMED (CRÍTICO)  |  companyId del body, credenciales SUNAT de otro tenant   |
| E-Invoice  | `/api/electronic-invoicing/webhooks/cdr`  |   webhook    |     🟡 NEEDS REVIEW     | Webhook externo OSE, repositorio tiene métodos sin scope |
| E-Invoice  | `/api/electronic-invoicing/ose/readiness` |    public    |         🟢 SAFE         |            Health check, sin datos de tenant             |
| Compliance | `/api/compliance/accounting-jobs`         |   catalog    |         🟢 SAFE         |            Referencia estática, fuera de H02             |
| Compliance | `/api/compliance/country-pack`            |   catalog    |         🟢 SAFE         |            Referencia estática, fuera de H02             |
| AI Swarm   | `/api/ai-swarm/workflow`                  | tenant-owned |      🔴 CONFIRMED       |        orgId no verificado, batch_runs sin scope         |
| AI Swarm   | `/api/ai-swarm/process-invoices`          | tenant-owned |      🔴 CONFIRMED       |                   orgId no verificado                    |
| AI Swarm   | `/api/ai-swarm/multi-ruc-process`         | tenant-owned |      🔴 CONFIRMED       |  Procesa multi-empresa sin verificación de pertenencia   |
| AI Swarm   | `/api/ai-swarm/*` (6 rutas más)           | tenant-owned |      🔴 CONFIRMED       |                       Mismo patrón                       |
| Fiscal     | `/api/fiscal/command-center/*`            | tenant-owned | 🔴 CONFIRMED (86 total) |                  Sin companyScopeGuard                   |
| Documents  | `/api/documents/*`                        | tenant-owned |      🔴 CONFIRMED       |                  Sin companyScopeGuard                   |
| Banking    | `/api/banking/*`                          | tenant-owned |    🟡 Unit tests OK     |          Solo unit mocked, sin test PostgreSQL           |

---

## 4. Diseño de defensa en profundidad

### Principios

1. **Identidad tenant derivada EXCLUSIVAMENTE de sesión/JWT verificado.** Nunca de headers/body/query.
2. **Membership obligatoria** para toda operación organization/company. El token da userId → se resuelven memberships → se valida que el usuario pertenezca a la company solicitada.
3. **Headers/body tenant como selección solicitada, nunca como autoridad.** El cliente puede pedir "trabajar en company X", pero el sistema verifica que el usuario pertenezca a X antes de ejecutar.
4. **Deny-by-default** para rutas tenant-owned. Ruta sin auth configurada → 401/403.
5. **Allowlist explícita** para rutas públicas, webhooks y catálogos.
6. **Repositorios scope-first** reads/writes/deletes con company_id + organization_id en WHERE clause.
7. **Respuestas cross-tenant indistinguibles de "no existe".** Mismo 404, mismo timing, mismo response body.
8. **Tests negativos PostgreSQL obligatorios en CI.**

### Arquitectura objetivo

```typescript
// 1. Auth middleware — resuelve identidad y memberships UNA VEZ por request
//
// apps/api/src/shared/plugins/tenant-auth.ts
function tenantAuth(options?: { allowPublic?: boolean }) {
  return async (context: ElysiaContext) => {
    // Extraer session token de Cookie/Authorization header
    const session = await verifySession(context.headers)
    if (!session && !options?.allowPublic) {
      throw new AuthError('SESSION_REQUIRED')
    }

    // Resolver memberships del usuario
    const memberships = await loadOrganizationMemberships(session.userId)

    // Extraer company solicitada de header (opcional — si no se envía, usar default)
    const requestedCompanyId = context.headers['x-company-id']
    if (requestedCompanyId) {
      // VERIFICAR: el usuario pertenece a esta company?
      const membership = memberships.find((m) =>
        m.companyIds.includes(requestedCompanyId)
      )
      if (!membership) {
        // NO revelar si la company existe o no — responder como "no tienes acceso"
        throw new AuthError('FORBIDDEN')
      }
      context.store.tenantScope = {
        organizationId: membership.organizationId,
        companyId: requestedCompanyId,
      }
    }

    // Poner memberships disponibles para handlers que necesiten multi-company
    context.store.memberships = memberships
    context.store.userId = session.userId
  }
}
```

```typescript
// 2. Repositorio scope-first — toda query incluye scope verificado
//
// packages/persistence/src/repositories/postgres-drenyra/repository.ts
async listFiscalCases(scope: TenantScope): Promise<FiscalCase[]> {
  // scope.companyId y scope.organizationId vienen del AUTH MIDDLEWARE,
  // NO del cliente
  return db.select().from(drenyraFiscalCases)
    .where(and(
      eq(drenyraFiscalCases.companyId, scope.companyId),
      eq(drenyraFiscalCases.organizationId, scope.organizationId),
    ));
}
```

```typescript
// 3. SIRE — companyId ahora del contexto autenticado, NO del body
//
// submit.route.ts (después del fix)
function createSireRoutes() {
  return new Elysia()
    .use(tenantAuth())
    .post('/submit', async ({ body, store, set }) => {
      // companyId del auth context, NO del body
      const result = await submitSire({
        ...body,
        companyId: store.tenantScope.companyId, // del middleware verificado
        organizationId: store.tenantScope.organizationId,
      })
      // ...
    })
}
```

### Plan de transición

```
Fase 0: Auth middleware + tenant resolver (compartido)
Fase 1: Drenyra fiscal cases (scope hardening + tests)
Fase 2: SIRE submission (scope hardening + tests + SUNAT path protection)
Fase 3: AI Swarm (orgId verificado + batch scope hardening)
Fase 4: Electronic invoicing CDR (scope hardening + webhook auth review)
Fase 5: Rutas restantes (bulk apply de tenantAuth() a ~70 rutas)
```

---

## 5. Secuencia exacta de PRs

**Orden revisado (aprobado):**

```text
1. PR-3A-0: Auth middleware + tenant resolver canónico
2. PR-3A-2: SIRE scope, credenciales SUNAT e idempotencia scoped
3. PR-3A-1: Drenyra Cases hardening
4. PR-3A-3: AI Swarm — Organization Context Verificado
5. PR-3A-4: Electronic Invoicing CDR — Scope Hardening
6. PR-3A-5a-c: Bulk Apply — Rutas restantes
7. PR-3A-6: Gate agregado y matriz final en CI
```

**Cada PR incluye sus propios tests RED→GREEN contra PostgreSQL real.** 3A-6 no será el primer PR con tests; consolidará la matriz y hará obligatorio el gate en CI.

### PR-3A-0: Auth Middleware + Tenant Context Canonical

```
Files:
  apps/api/src/shared/plugins/tenant-auth.ts          (NEW — auth middleware)
  apps/api/src/shared/plugins/company-scope-guard.ts   (REFACTOR — integrar con tenant-auth)
  packages/domain/src/drenyra/scope.ts                 (UPDATE — TenantScope canónico)
  packages/infrastructure/src/auth/auth-utils.ts       (UPDATE — membership resolution)
  packages/infrastructure/src/auth/utils/types.ts      (UPDATE — tipos de membership)

Líneas: ~350
Dependencias: ninguna
Riesgo: BAJO — nuevo middleware, no cambia rutas existentes
```

### PR-3A-1: Drenyra Fiscal Cases — Scope Hardening

```
Files:
  apps/api/src/features/drenyra/cases.routes.ts       (UPDATE — usar tenantAuth)
  apps/api/src/features/drenyra/drenyra-context.ts     (UPDATE — eliminar resolve de headers)
  packages/persistence/src/repositories/postgres-drenyra/repository.ts (UPDATE — scope hardening)
  apps/api/src/__tests__/h02-attack-cases.integration.test.ts  (UPDATE — RED→GREEN)

Líneas: ~200
Dependencias: PR-3A-0
Riesgo: MEDIO — cambiar source de truth de headers a auth
Rollback: revertir PR → headers vuelven a ser source
```

### PR-3A-2: SIRE Submission — Scope Hardening + SUNAT Protection

```
Files:
  apps/api/src/features/sire/routes/submit.route.ts   (UPDATE — companyId del auth, no del body)
  apps/api/src/features/sire/services/sire-submission-with-audit.service.ts (UPDATE — scope)
  apps/api/src/features/sire/services/tenant-sunat-context.service.ts (UPDATE — scope verificado)
  packages/persistence/src/repositories/sire-submission.repository.ts (UPDATE — add company filter a findByIdempotencyKey y update)
  apps/api/src/__tests__/h02-attack-sire.integration.test.ts (NEW — tests GREEN)

Líneas: ~300
Dependencias: PR-3A-0
Riesgo: ALTO — cambia flujo de SIRE, puede romper integración SUNAT
Rollback: revertir PR → companyId vuelve del body
Migration: data — añadir company_id a idempotency_key UNIQUE constraint
```

### PR-3A-3: AI Swarm — Organization Context Verificado

```
Files:
  apps/api/src/features/ai-swarm/api/organization-context.ts (UPDATE — verificar contra auth)
  apps/api/src/features/ai-swarm/api/workflow.route.ts  (UPDATE — usar tenantAuth)
  packages/persistence/src/repositories/...              (UPDATE — batch_runs scope hardening)

Líneas: ~250
Dependencias: PR-3A-0
Riesgo: MEDIO — AI Swarm usa orgId para auditoría, no para queries directas
Rollback: revertir PR → orgId vuelve de headers
```

### PR-3A-4: Electronic Invoicing CDR — Scope Hardening

```
Files:
  apps/api/src/features/electronic-invoicing/infrastructure/cpe.repository.ts (UPDATE — scope en findTransactionWithTags y findTransactionForStatusSync)
  apps/api/src/features/electronic-invoicing/handlers/process-cdr-webhook.handler.ts (UPDATE — webhook auth review)
  apps/api/src/__tests__/integration/cdr-webhook-scope.integration.test.ts (NEW)

Líneas: ~200
Dependencias: PR-3A-0
Riesgo: BAJO — webhook OSE externo, necesita revisión de autenticación/firma
Rollback: revertir PR
```

### PR-3A-5: Bulk Apply — Rutas restantes

```
Files:
  ~70 route files across 15 features  (UPDATE — añadir tenantAuth)
  apps/api/scripts/audit-tenant-scoping.ts  (UPDATE — actualizar para verificar tenantAuth)

Líneas: ~400 (70 archivos × ~5 líneas c/u)
Dependencias: PR-3A-0
Riesgo: BAJO/MEDIO — mecánico pero masivo. Chained PRs recomendados:
  PR-3A-5a: fiscal/*, drenyra/* (20 rutas)
  PR-3A-5b: documents/*, compliance/*, banking/* (25 rutas)
  PR-3A-5c: ai-swarm/*, llm-gateway/* (restantes)
Rollback: revertir PR → cada ruta pierde auth pero no rompe
```

### PR-3A-6: Negative PostgreSQL Tests in CI

```
Files:
  .github/workflows/ci.yml                 (UPDATE — add RUN_DB_TESTS=1 step)
  packages/test-utils/src/tenant/           (UPDATE — fixtures extendidos)
  apps/api/src/__tests__/h02-gate.ci.test.ts (NEW — gate de CI)

Líneas: ~200
Dependencias: PR-3A-0 hasta PR-3A-5
Riesgo: BAJO — solo tests, no cambia código de producción
```

**Total:** 7 chained PRs (~1,900 líneas estimadas), reemplazando la estimación genérica de 26 PRs.

---

## 6. Criterios de cierre de Wave 3A

### Gate 1: Auth Middleware

- [ ] `tenantAuth` middleware existe en `apps/api/src/shared/plugins/`
- [ ] Middleware resuelve session JWT → userId → memberships → TenantScope
- [ ] Middleware rechaza requests sin session válida (públicas exceptuadas)
- [ ] Middleware rechaza requests con x-company-id no perteneciente al usuario
- [ ] Membership resolution cubre: organizationId, companyIds, role, permissions
- [ ] Audit script reporta >= 1 ruta como SAFE via tenantAuth

### Gate 2: Drenyra Cases Protected

- [ ] Los 3 tests de ataque (READ, LIST, UPDATE) pasan como RED→GREEN
- [ ] Tenant B con scope de A → 404 en GET /cases/:id
- [ ] Tenant B con scope de A → results vacío en GET /cases
- [ ] Tenant B → PATCH /cases/:id/status con id de A → 404
- [ ] Tenant A puede operar normalmente

### Gate 3: SIRE Protected

- [ ] `findByIdempotencyKey` filtra por companyId además de idempotencyKey
- [ ] `update(id)` filtra por id + companyId (0 rows → error)
- [ ] `create` usa companyId del auth context, no del body
- [ ] Los 3 tests de ataque SIRE pasan como RED→GREEN
- [ ] `resolveTenantSunatContext` recibe companyId verificado del middleware
- [ ] body.companyId es ignorado explícitamente (o validado contra auth context)

### Gate 4: AI Swarm Protected

- [ ] `resolveOrganizationContextForRequest` verifica contra session/memberships
- [ ] `batch_runs` UPDATE/READ filtran por companyId
- [ ] Fallback AI_SWARM_DEFAULT_ORG_ID removido o protegido

### Gate 5: CDR Webhook Reviewed

- [ ] `findTransactionWithTags(id)` incluye companyId filter
- [ ] `findTransactionForStatusSync(id)` incluye companyId filter
- [ ] Autenticación/firma del webhook OSE revisada y documentada

### Gate 6: Bulk Coverage

- [ ] Audit script reporta < 10 rutas MISSING (vs 86 actuales)
- [ ] allowlist explícita de rutas públicas documentada
- [ ] Rutas webhook con autenticación/firma documentada
- [ ] Catálogos (compliance/*) marcados como PUBLIC explícitamente

### Gate 7: CI Tests

- [ ] `RUN_DB_TESTS=1` activo en CI
- [ ] H02 gate test suite ejecutado en CI
- [ ] 0 tests cross-tenant fallando

---

## 7. Plan de rollback

Cada PR es atómicamente reversible:

| PR   | Rollback     | Tiempo estimado  |                                                   Pérdida de datos                                                    |
| ---- | ------------ | :--------------: | :-------------------------------------------------------------------------------------------------------------------: |
| 3A-0 | `git revert` |      2 min       |                                                        Ninguna                                                        |
| 3A-1 | `git revert` |      2 min       |                                        Ninguna — headers vuelven a ser source                                         |
| 3A-2 | `git revert` |      2 min       | **Migration irreversible:** UNIQUE(idempotency_key) → UNIQUE(company_id, idempotency_key) requiere migration rollback |
| 3A-3 | `git revert` |      2 min       |                                                        Ninguna                                                        |
| 3A-4 | `git revert` |      2 min       |                                                        Ninguna                                                        |
| 3A-5 | `git revert` | 2 min por sub-PR |                                                        Ninguna                                                        |
| 3A-6 | `git revert` |      2 min       |                                                        Ninguna                                                        |

**Único PR con migration irreversible:** 3A-2 (SIRE). El cambio de UNIQUE(idempotency_key) a UNIQUE(company_id, idempotency_key) requiere:

1. Crear nuevo constraint
2. Migrar datos existentes
3. Eliminar constraint anterior
4. Rollback: recrear constraint anterior (pérdida de la nueva constraint)

Para mitigar: hacer el migration de SIRE como PR separado (3A-2a: migration + constraint, 3A-2b: scope hardening). Si 3A-2b necesita rollback, 3A-2a se queda.

---

## 8. Resumen final

```
WAVE 3A — TENANT BOUNDARY CLOSURE
Diseño: Completo
Rutas CONFIRMED: 3 (Cases, SIRE, AI Swarm)
Rutas NEEDS REVIEW: 1 (CDR Webhook)
Rutas SAFE: 2 (Compliance jobs, OSE readiness)
Rutas totales a proteger: ~86 (reducir a < 10)

PRs: 7 chained (vs 26 genéricos originales)
Líneas: ~1,900 estimadas
Dependencia: PR-3A-0 (auth middleware) es requisito de todos los demás
Rollback: Todos reversibles excepto migration de SIRE constraint

Bloquea: drenyra-api-real-data (no se puede abrir hasta gate cerrado)
```
