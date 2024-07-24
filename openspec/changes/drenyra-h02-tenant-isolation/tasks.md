# H02 Tasks — Tenant Isolation Hardening

> Basado en el diseño aprobado, el inventario de 19 repositorios tenant-owned y el rollout
> corregido por evidencia. AccountRepository domina con 10 callers; va primero.

---

## Wave 0 — Preparación (fundación, no código de producción)

### T-0.1: Tests de caracterización de repositorios inseguros

**Invocante:** Para cada método inseguro, capturar comportamiento actual antes de modificar.

| Campo             | Valor                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | El comportamiento actual debe quedar documentado antes del cambio                                                                                                                                                                                                                                                                                                                 |
| Archivos          | `packages/domain/src/repositories/account.repository.ts`, `journal-entry.repository.ts`, `detraction.repository.ts`, `cpe-log.repository.ts`, `accounting-period.repository.ts`, `exchange-rate.repository.ts`, `client.repository.ts`, `provider.repository.ts`, `transaction.repository.ts`, `evidence.repository.ts`, `invoice.repository.ts`, `sire-submission.repository.ts` |
| Callers           | N/A — tests nuevos                                                                                                                                                                                                                                                                                                                                                                |
| Entry point       | `packages/persistence/src/__tests__/h02-characterization/` (directorio nuevo)                                                                                                                                                                                                                                                                                                     |
| Scope requerido   | `TenantScope` (todos)                                                                                                                                                                                                                                                                                                                                                             |
| Test positivo     | Caracterizar que `findById(id)` retorna la entidad cuando existe                                                                                                                                                                                                                                                                                                                  |
| Test cross-tenant | Caracterizar que `findById(id)` retorna la entidad aunque sea de otro tenant (esto es el bug actual)                                                                                                                                                                                                                                                                              |
| Rollback          | Eliminar directorio de tests de caracterización                                                                                                                                                                                                                                                                                                                                   |
| Evidencia         | Test suite pasa: muestra que el bug existe ANTES del fix                                                                                                                                                                                                                                                                                                                          |

### T-0.2: Matriz de acceso por entidad

**Invocante:** Documentar qué roles pueden leer/modificar cada entidad tenant-owned.

| Campo             | Valor                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Invariante        | Cada entidad tiene reglas de acceso explícitas                                                        |
| Archivos          | `docs/architecture/tenant-access-matrix.md` (nuevo)                                                   |
| Callers           | N/A — documento                                                                                       |
| Entry point       | N/A                                                                                                   |
| Scope requerido   | N/A                                                                                                   |
| Test positivo     | N/A — documento de referencia                                                                         |
| Test cross-tenant | N/A                                                                                                   |
| Rollback          | Eliminar documento                                                                                    |
| Evidencia         | Matriz completa que mapea cada entidad → OrganizationScope/TenantScope/FiscalScope → roles permitidos |

### T-0.3: Diseño RLS anticipado

**Invocante:** Producir las policies SQL exactas para cada tabla crítica. No implementar todavía.

| Campo             | Valor                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| Invariante        | Cada policy RLS debe tener USING + WITH CHECK + fail closed + shadow query    |
| Archivos          | `packages/infrastructure/drizzle/h02-rls-blueprint.sql` (nuevo)               |
| Callers           | N/A — blueprint                                                               |
| Entry point       | N/A                                                                           |
| Scope requerido   | N/A                                                                           |
| Test positivo     | La policy permite acceso cuando el tenant context coincide                    |
| Test cross-tenant | La policy bloquea acceso cuando el tenant context NO coincide                 |
| Rollback          | No aplica (no se deploya hasta Wave 6)                                        |
| Evidencia         | Blueprint SQL completo con 10+ policies, shadow queries y roles de aplicación |

---

## Wave 1 — Core: Auth + repositorios con más callers

### PR 1.1: Auth context + scopes canónicos

| Campo              | Valor                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante         | **Ninguna operación de negocio puede existir fuera de un scope validado.** `requireAuth()` debe retornar contexto completo, no solo userId.                          |
| Archivos           | `packages/domain/src/scope/types.ts` (nuevo), `packages/infrastructure/src/auth/auth-utils.ts`, `packages/infrastructure/src/auth/permissions.ts`                    |
| Callers directos   | `requireAuth()` se llama desde: `requireUser()`, `requireOrganization()`, `requireAuthContext()`, y múltiples API routes                                             |
| Callers indirectos | Todos los use cases que llaman a `requireAuth()` o `requireAuthContext()`                                                                                            |
| Entry point        | `packages/infrastructure/src/auth/index.ts`                                                                                                                          |
| Scope requerido    | `AuthenticatedContext`                                                                                                                                               |
| Test positivo      | Usuario autenticado recibe `AuthenticatedContext` con memberships completas                                                                                          |
| Test cross-tenant  | Usuario de Org A NO tiene companies de Org B en sus memberships                                                                                                      |
| Rollback           | Revertir `auth-utils.ts` a versión anterior; eliminar `scope/types.ts`                                                                                               |
| Evidencia          | `requireAuthContext()` retorna `{ userId, organizationId, memberships: [{ companyId, role, permissions }] }`. Test: memberships solo incluyen companies autorizadas. |

### PR 1.2: Interface + implementation — AccountRepository

**10 callers — se dividen en 4 sub-PRs por flujo de negocio.**

#### PR 1.2a: AccountRepository.findById() con scope + migración de toggle-account-status (5 callers)

| Campo             | Valor                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`. scope debe incluir organizationId.                                             |
| Archivos          | `packages/domain/src/repositories/account.repository.ts`, `packages/persistence/src/repositories/postgres-account.repository.ts` |
| Callers           | `toggle-account-status.use-case.ts` (líneas 38, 60, 85, 96, 114 — 5 callers)                                                     |
| Entry point       | API route para toggle account status                                                                                             |
| Scope requerido   | `OrganizationScope` (accounts pertenecen a una organización)                                                                     |
| Test positivo     | `findById(scope, knownId)` retorna la cuenta correcta                                                                            |
| Test cross-tenant | `findById(otherOrgScope, sameId)` retorna null                                                                                   |
| Rollback          | Revertir interface + implementation + use case. `_findByIdLegacy()` temporal                                                     |
| Evidencia         | Los 5 callers de toggle-account-status usan `findById(scope, id)`. Test: toggle desde otra org falla con null.                   |

#### PR 1.2b: create-account + get-accounts use cases (2 callers)

| Campo             | Valor                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | Mismo que 1.2a                                                                                                                    |
| Archivos          | Mismos archivos de interfaz + `packages/application/src/use-cases/account/create-account.use-case.ts`, `get-accounts.use-case.ts` |
| Callers           | `create-account.use-case.ts:45`, `get-accounts.use-case.ts:74`                                                                    |
| Entry point       | API routes POST /accounts, GET /accounts/:id                                                                                      |
| Scope requerido   | `OrganizationScope`                                                                                                               |
| Test positivo     | Crear cuenta dentro de la organización funciona                                                                                   |
| Test cross-tenant | Crear cuenta con orgId de otra organización es rechazado                                                                          |
| Rollback          | Revertir use cases a versión sin scope                                                                                            |
| Evidencia         | Ambos use cases pasan scope validado al repository                                                                                |

#### PR 1.2c: delete-account + update-account use cases (3 callers)

| Campo             | Valor                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | Mismo que 1.2a                                                                                                                      |
| Archivos          | Mismos archivos de interfaz + `packages/application/src/use-cases/account/delete-account.use-case.ts`, `update-account.use-case.ts` |
| Callers           | `delete-account.use-case.ts:43`, `update-account.use-case.ts:31, 61`                                                                |
| Entry point       | API routes DELETE /accounts/:id, PATCH /accounts/:id                                                                                |
| Scope requerido   | `OrganizationScope`                                                                                                                 |
| Test positivo     | Eliminar/actualizar cuenta propia funciona                                                                                          |
| Test cross-tenant | Eliminar/actualizar cuenta de otra organización falla (0 rows affected → error)                                                     |
| Rollback          | Revertir use cases                                                                                                                  |
| Evidencia         | Ambos use cases pasan scope validado. Test cross-tenant: 0 rows → error específico.                                                 |

#### PR 1.2d: Eliminar `_findByIdLegacy` de AccountRepository

| Campo             | Valor                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | No deben quedar métodos públicos sin scope                                                                                       |
| Archivos          | `packages/domain/src/repositories/account.repository.ts`, `packages/persistence/src/repositories/postgres-account.repository.ts` |
| Callers           | Ninguno (todos migrados en 1.2a-c)                                                                                               |
| Entry point       | N/A — limpieza                                                                                                                   |
| Scope requerido   | `OrganizationScope`                                                                                                              |
| Test positivo     | Interfaz solo expone `findById(scope, id)`                                                                                       |
| Test cross-tenant | No existe `findById(id)` público                                                                                                 |
| Rollback          | Reinstaurar método legacy si se descubre caller olvidado                                                                         |
| Evidencia         | `_findByIdLegacy` eliminado. grep de `accountRepository.findById(id)` sin scope da 0 resultados.                                 |

### PR 1.3: Interface + implementation — JournalEntryRepository (3 callers)

| Campo             | Valor                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`. `delete(scope, id)` reemplaza a `delete(id)`. Scope debe incluir organizationId.           |
| Archivos          | `packages/domain/src/repositories/journal-entry.repository.ts`, `packages/persistence/src/repositories/postgres-journal-entry.repository.ts` |
| Callers           | `delete-journal-entry.use-case.ts:22`, `update-journal-entry-status.use-case.ts:27`, `update-journal-entry.use-case.ts:42`                   |
| Entry point       | API routes DELETE /journal-entries/:id, PATCH /journal-entries/:id/status, PATCH /journal-entries/:id                                        |
| Scope requerido   | `TenantScope` (asientos contables tienen companyId)                                                                                          |
| Test positivo     | `findById(scope, knownId)` retorna el asiento correcto                                                                                       |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                            |
| Rollback          | Revertir interface + implementation + 3 use cases                                                                                            |
| Evidencia         | Los 3 callers migrados. `findByIdLegacy` marcado y programado para eliminación en PR final de Wave 1.                                        |

### DocumentRepository como referencia — sin cambios

| Campo    | Valor                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nota     | `DocumentRepository.save()` ya THROWS sin tenant context. `update()` también. Es el patrón de referencia. No necesita cambios ahora, pero se usará como ejemplo en cada PR. |
| Archivos | `packages/persistence/src/repositories/document.repository.ts`                                                                                                              |
| Acción   | Agregar comentario en la interfaz: `@see DocumentRepository — gold standard for tenant enforcement`                                                                         |

---

## Wave 2 — Repositorios con 1 caller cada uno

### PR 2.1: DetractionRepository

| Campo             | Valor                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                                       |
| Archivos          | `packages/domain/src/repositories/detraction.repository.ts`, `packages/persistence/src/repositories/postgres-detraction.repository.ts` |
| Callers           | `packages/application/src/services/detraction.service.ts:101`                                                                          |
| Entry point       | API routes que usan detraction service                                                                                                 |
| Scope requerido   | `TenantScope`                                                                                                                          |
| Test positivo     | `findById(scope, id)` retorna la detracción correcta                                                                                   |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                      |
| Rollback          | Revertir interface + implementation + detraction.service.ts                                                                            |
| Evidencia         | Caller migrado. `_findByIdLegacy` eliminado.                                                                                           |

### PR 2.2: CpeLogRepository

| Campo             | Valor                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                                 |
| Archivos          | `packages/domain/src/repositories/cpe-log.repository.ts`, `packages/persistence/src/repositories/postgres-cpe-log.repository.ts` |
| Callers           | `packages/application/src/services/cpe-tracking.service.ts:57`                                                                   |
| Entry point       | API routes que usan cpe-tracking service                                                                                         |
| Scope requerido   | `TenantScope`                                                                                                                    |
| Test positivo     | `findById(scope, id)` retorna el log correcto                                                                                    |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                |
| Rollback          | Revertir interface + implementation + cpe-tracking.service.ts                                                                    |
| Evidencia         | Caller migrado.                                                                                                                  |

### PR 2.3: AccountingPeriodRepository

| Campo             | Valor                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                                                     |
| Archivos          | `packages/domain/src/repositories/accounting-period.repository.ts`, `packages/persistence/src/repositories/postgres-accounting-period.repository.ts` |
| Callers           | `packages/application/src/services/accounting-period.service.ts:80`                                                                                  |
| Entry point       | API routes que usan accounting-period service                                                                                                        |
| Scope requerido   | `TenantScope`                                                                                                                                        |
| Test positivo     | `findById(scope, id)` retorna el período correcto                                                                                                    |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                                    |
| Rollback          | Revertir interface + implementation + accounting-period.service.ts                                                                                   |
| Evidencia         | Caller migrado.                                                                                                                                      |

---

## Wave 3 — Repositorios restantes del Grupo C

### PR 3.1: ExchangeRateRepository

| Campo             | Valor                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                                             |
| Archivos          | `packages/domain/src/repositories/exchange-rate.repository.ts`, `packages/persistence/src/repositories/postgres-exchange-rate.repository.ts` |
| Callers           | `packages/application/src/services/exchange-rate.service.ts` (por confirmar)                                                                 |
| Entry point       | API routes de exchange rate                                                                                                                  |
| Scope requerido   | `TenantScope`                                                                                                                                |
| Test positivo     | `findById(scope, id)` retorna la tasa correcta                                                                                               |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                            |
| Rollback          | Revertir interface + implementation + service                                                                                                |
| Evidencia         | Caller migrado.                                                                                                                              |

### PR 3.2: TransactionRepository

| Campo             | Valor                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                                         |
| Archivos          | `packages/domain/src/repositories/transaction.repository.ts`, `packages/persistence/src/repositories/postgres-transaction.repository.ts` |
| Callers           | `packages/application/src/use-cases/transaction/get-transaction.use-case.ts:71`, `delete-transaction.use-case.ts:80`                     |
| Entry point       | API routes GET /transactions/:id, DELETE /transactions/:id                                                                               |
| Scope requerido   | `TenantScope`                                                                                                                            |
| Test positivo     | `findById(scope, id)` retorna la transacción correcta                                                                                    |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                        |
| Rollback          | Revertir interface + implementation + 2 use cases                                                                                        |
| Evidencia         | Ambos callers migrados.                                                                                                                  |

### PR 3.3: ClientRepository

| Campo             | Valor                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                               |
| Archivos          | `packages/domain/src/repositories/client.repository.ts`, `packages/persistence/src/repositories/postgres-client.repository.ts` |
| Callers           | `packages/application/src/use-cases/client/` (por verificar caller exacto)                                                     |
| Entry point       | API routes de clientes                                                                                                         |
| Scope requerido   | `TenantScope`                                                                                                                  |
| Test positivo     | `findById(scope, id)` retorna el cliente correcto                                                                              |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                              |
| Rollback          | Revertir interface + implementation + use case                                                                                 |
| Evidencia         | Caller migrado.                                                                                                                |

### PR 3.4: ProviderRepository

| Campo             | Valor                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`                                                                                   |
| Archivos          | `packages/domain/src/repositories/provider.repository.ts`, `packages/persistence/src/repositories/postgres-provider.repository.ts` |
| Callers           | `packages/application/src/use-cases/provider/` (por verificar caller exacto)                                                       |
| Entry point       | API routes de proveedores                                                                                                          |
| Scope requerido   | `TenantScope`                                                                                                                      |
| Test positivo     | `findById(scope, id)` retorna el proveedor correcto                                                                                |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                  |
| Rollback          | Revertir interface + implementation + use case                                                                                     |
| Evidencia         | Caller migrado.                                                                                                                    |

---

## Wave 4 — Repositorios mixtos (Grupo B) + SireSubmission

### PR 4.1: EvidenceRepository — limpiar interfaz mixta

| Campo             | Valor                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findById(scope, id)` reemplaza a `findById(id)`. `findByHash(scope, hash)` reemplaza a `findByHash(hash)`.                        |
| Archivos          | `packages/domain/src/repositories/evidence.repository.ts`, `packages/persistence/src/repositories/postgres-evidence/repository.ts` |
| Callers           | `packages/application/src/features/evidence/register-evidence.handler.ts` (ya usa `saveForOrganization`)                           |
| Entry point       | API routes de evidencia                                                                                                            |
| Scope requerido   | `TenantScope`                                                                                                                      |
| Test positivo     | `findById(scope, id)` retorna la evidencia correcta                                                                                |
| Test cross-tenant | `findById(otherTenantScope, sameId)` retorna null                                                                                  |
| Rollback          | Revertir interface + implementation                                                                                                |
| Evidencia         | Interfaz limpia: solo métodos con scope. Workes de evidencia ya usan `ForOrganization`.                                            |

### PR 4.2: InvoiceRepository — hacer scoped methods obligatorios

| Campo             | Valor                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `saveForOrganization?()` pasa de opcional a obligatorio. `findById(scope, id)` reemplaza a `findById(id)`.                       |
| Archivos          | `packages/domain/src/repositories/invoice.repository.ts`, `packages/persistence/src/repositories/postgres-invoice/repository.ts` |
| Callers           | `packages/application/src/use-cases/invoice/` (auditar)                                                                          |
| Entry point       | API routes de facturas                                                                                                           |
| Scope requerido   | `TenantScope`                                                                                                                    |
| Test positivo     | `saveForOrganization(invoice, orgId)` funciona                                                                                   |
| Test cross-tenant | `saveForOrganization` con orgId incorrecto es rechazado                                                                          |
| Rollback          | Revertir interface a optional (`?`) + implementation                                                                             |
| Evidencia         | `saveForOrganization()` y `updateForOrganization()` ya NO son opcionales. Todos los callers migrados.                            |

### PR 4.3: SireSubmissionRepository — scope en idempotency + update

| Campo             | Valor                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | `findByIdempotencyKey(scope, key)` reemplaza a `findByIdempotencyKey(key)`. `update(scope, id, input)` reemplaza a `update(id, input)`. |
| Archivos          | `packages/persistence/src/repositories/sire-submission.repository.ts`                                                                   |
| Callers           | 0 callers encontrados (solo exportado desde `packages/persistence/src/index.ts` y `packages/infrastructure/src/index.ts`)               |
| Entry point       | Revisar si hay API route sin usar                                                                                                       |
| Scope requerido   | `TenantScope` (companyId)                                                                                                               |
| Test positivo     | `findByIdempotencyKey(scope, knownKey)` retorna la submission                                                                           |
| Test cross-tenant | `findByIdempotencyKey(otherTenantScope, sameKey)` retorna null                                                                          |
| Rollback          | Revertir firma + implementation                                                                                                         |
| Evidencia         | Métodos corregidos. Aunque no hay callers hoy, la superficie de ataque está cerrada.                                                    |

---

## Wave 5 — Workers, SSE, Exports, Signed URLs

### PR 5.1: Workers — validación de scope en job payloads

| Campo             | Valor                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | Todo worker DEBE validar que el FiscalScope del job sea consistente antes de procesar                                                                                                                                                                         |
| Archivos          | `packages/infrastructure/src/workers/fiscal-agent.worker.ts`, `packages/infrastructure/src/workers/evidence-ingestion.worker.ts`, `packages/infrastructure/src/queues/document-processor.worker.ts`, `packages/infrastructure/src/queues/csv-batch.worker.ts` |
| Scope requerido   | `TenantScope` mínimo, `FiscalScope` para workers fiscales                                                                                                                                                                                                     |
| Test positivo     | Worker procesa job con scope válido                                                                                                                                                                                                                           |
| Test cross-tenant | Worker con job de Org A no accede datos de Org B                                                                                                                                                                                                              |
| Rollback          | Revertir validación en workers                                                                                                                                                                                                                                |
| Evidencia         | Cada worker verifica scope antes de la primera operación de negocio. Test: job cross-tenant es rechazado.                                                                                                                                                     |

### PR 5.2: SSE — filtro por tenant en suscripciones

| Campo             | Valor                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | Un suscriptor SSE de Org A NO recibe eventos de Org B                                                                         |
| Archivos          | `packages/infrastructure/src/events/in-memory-event-bus.ts`, `packages/shared/src/events/sse-helpers.ts`, API stream endpoint |
| Scope requerido   | `OrganizationScope`                                                                                                           |
| Test positivo     | Suscriptor recibe eventos de su organización                                                                                  |
| Test cross-tenant | Suscriptor NO recibe eventos de otra organización                                                                             |
| Rollback          | Revertir filtro en event bus y SSE endpoint                                                                                   |
| Evidencia         | `eventBus.publish()` filtra por `organizationId`. Test: dos suscriptores, solo cada uno recibe sus eventos.                   |

### PR 5.3: Exports — scope en generación y resultado

| Campo             | Valor                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Invariante        | Exportaciones solo incluyen datos del tenant del usuario que las solicita        |
| Archivos          | `packages/infrastructure/src/queues/queues.ts` (reportQueue), API export routes  |
| Scope requerido   | `TenantScope`                                                                    |
| Test positivo     | Exportación de tenant A solo contiene datos de tenant A                          |
| Test cross-tenant | Exportación de tenant A NO contiene datos de tenant B aunque haya overlap de IDs |
| Rollback          | Revertir scope en generación de export                                           |
| Evidencia         | Export query incluye filtro organization_id + company_id                         |

### PR 5.4: Signed URLs — tenant-aware

| Campo             | Valor                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Invariante        | Signed URL generada para tenant A no puede ser usada para acceder a datos de tenant B |
| Archivos          | `packages/infrastructure/src/storage/`                                                |
| Scope requerido   | `TenantScope` (organizationId + companyId en la firma)                                |
| Test positivo     | Signed URL funciona para el tenant que la generó                                      |
| Test cross-tenant | Signed URL de tenant A es rechazada por tenant B (403)                                |
| Rollback          | Revertir lógica de firma                                                              |
| Evidencia         | Firma incluye hash de organizationId + companyId. Verificación en cada GET.           |

---

## Wave 6 — RLS

### PR 6.1: RLS shadow + logging <!-- sdd-owner: implementation -->

- [x] Migration: `0027_h02_rls_shadow.sql` — shadow policies + violation log + triggers
- [x] Verification: `verify-h02-rls-shadow.sql` — pg_catalog checks (40+ checks)
- [x] Verification: `verify-h02-rls-shadow-behavior.sql` — behavioral tests

| Campo             | Valor                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Invariante        | RLS en modo shadow: policies existen pero no bloquean. Violaciones se loguean. |
| Archivos          | Migración SQL nueva, `packages/infrastructure/src/events/` (trigger function)  |
| Scope requerido   | `OrganizationScope` (vía `app.current_organization_id`)                        |
| Test positivo     | Policy shadow se ejecuta sin bloquear queries existentes                       |
| Test cross-tenant | Violación simulada genera log pero no bloquea                                  |
| Rollback          | `DROP POLICY ... ON ...`                                                       |
| Evidencia         | `tenant_violation_log` registra cruces. Cero violaciones después de 48h.       |

### PR 6.2: RLS activación gradual por tabla <!-- sdd-owner: implementation -->

- [x] Step 1: `0028_h02_rls_activate_step_1.sql` — sire_submissions, evidence_nodes, evidence_edges
- [x] Step 2: `0029_h02_rls_activate_step_2.sql` — documents, fiscal_truth_events
- [x] Step 3: `0030_h02_rls_activate_step_3.sql` — agent_run_states, agent_run_events
- [x] Verification: `verify-h02-rls-activation.sql` — RESTRICTIVE policy checks

| Campo             | Valor                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | RLS RESTRICTIVE activo. Sin contexto de tenant → 0 filas.                                                                                                   |
| Archivos          | Migración SQL por tabla: `sire_submissions`, `evidence_nodes`, `evidence_edges`, `documents`, `agent_run_states`, `agent_run_events`, `fiscal_truth_events` |
| Scope requerido   | `OrganizationScope` (vía `app.current_organization_id` + `app.current_company_id`)                                                                          |
| Test positivo     | Query con tenant context funciona normalmente                                                                                                               |
| Test cross-tenant | Query SIN tenant context retorna 0 filas                                                                                                                    |
| Rollback          | `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`                                                                                                                |
| Evidencia         | Cada tabla activada en orden. Tests E2E pasan después de cada activación. Rollback documentado.                                                             |

### PR 6.3: Eliminar APIs legacy <!-- sdd-owner: implementation -->

- [x] CI script: `scripts/ci/h02-legacy-api-check.sh` — automated grep for unscoped patterns
- [x] Script detects 4 remaining unscoped methods (evidence, account, journal-entry, document)
- [x] 10/14 tenant-owned repos verified clean; 1 file not in domain dir (sire-submission)

| Campo             | Valor                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invariante        | No deben quedar métodos públicos sin scope en NINGÚN repositorio tenant-owned                                                                               |
| Archivos          | Todos los domain repository interfaces + persistence implementations                                                                                        |
| Scope requerido   | Verificar cada repositorio del inventario de 19                                                                                                             |
| Test positivo     | Compilación limpia. Todos los tests pasan.                                                                                                                  |
| Test cross-tenant | grep de `findById(id)`, `save(`, `update(`, `delete(id)` sin scope da 0 resultados                                                                          |
| Rollback          | Reinstaurar desde git si se descubre API rota                                                                                                               |
| Evidencia         | `grep -rn "findById(id" packages/domain/src/repositories/` = 0 resultados. `grep -rn "\.save(" packages/application/src/` solo muestra variantes con scope. |

---

## Resumen de PRs por Wave

| Wave      | PRs                                             | Archivos tocados | Tests nuevos          |
| --------- | ----------------------------------------------- | ---------------- | --------------------- |
| W0        | 3 (caracterización, matriz, RLS blueprint)      | ~5               | ~40 (caracterización) |
| W1        | 6 (auth + 4 Account + 1 JournalEntry)           | ~15              | ~30                   |
| W2        | 3 (Detraction, CpeLog, AccountingPeriod)        | ~9               | ~15                   |
| W3        | 4 (ExchangeRate, Transaction, Client, Provider) | ~12              | ~20                   |
| W4        | 3 (Evidence, Invoice, SireSubmission)           | ~9               | ~15                   |
| W5        | 4 (Workers, SSE, Exports, Signed URLs)          | ~10              | ~20                   |
| W6        | 3 (RLS shadow, activación, limpieza legacy)     | ~15              | ~15                   |
| **Total** | **26 PRs**                                      | **~75 archivos** | **~155 tests**        |

---

## Contrato inseguro vs exposición explotable — diferenciación

**Contrato inseguro:** Un método público que acepta `id` sin scope. Puede ser llamado por cualquiera que tenga acceso al repository.

**Exposición explotable confirmada:** Un contrato inseguro que TIENE callers activos en application layer. Puede ser usado para leer datos de otro tenant.

| Repository                 | Contrato inseguro                           | Exposición explotable |
| -------------------------- | ------------------------------------------- | --------------------- |
| AccountRepository          | `findById(id)` — 10 callers                 | 🔴 CONFIRMADA         |
| JournalEntryRepository     | `findById(id)` — 3 callers                  | 🔴 CONFIRMADA         |
| DetractionRepository       | `findById(id)` — 1 caller                   | 🔴 CONFIRMADA         |
| CpeLogRepository           | `findById(id)` — 1 caller                   | 🔴 CONFIRMADA         |
| AccountingPeriodRepository | `findById(id)` — 1 caller                   | 🔴 CONFIRMADA         |
| TransactionRepository      | `findById(id)` — 2 callers                  | 🔴 CONFIRMADA         |
| SireSubmissionRepository   | `findByIdempotencyKey(key)` — 0 callers     | 🟢 NO CONFIRMADA      |
| EvidenceRepository         | `findById(id)` — sin caller directo visible | 🟡 POSIBLE            |
| InvoiceRepository          | `findById(id)` — sin caller directo visible | 🟡 POSIBLE            |

**Regla:** En cada PR, el contrato inseguro se arregla SIEMPRE. La exposición explotable determina la prioridad del PR.

---

## Regla de eliminación _legacy

> Todo método legacy debe llevar `@deprecated` con fecha de eliminación exacta en el PR donde se introduce el reemplazo seguro. La eliminación debe ocurrir en el PR final de la wave.

```typescript
/** @deprecated Use findById(scope, id) instead. Remove by 2026-08-31. */
async _findByIdLegacy(id: string): Promise<Account | null> {
  return this.findById({ organizationId: "FALLBACK" }, id)
}
```

**Nuevos usos de `_legacy` están prohibidos.** El linter (o code review) debe rechazar cualquier PR que introduzca un nuevo caller de un método legacy.
