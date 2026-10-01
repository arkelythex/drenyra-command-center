# UpdateJournalEntry sin aislamiento por tenant

**Última actualización**: 2026-10-01
**Nivel**: sustancial, riesgo fiscal/tenant (test-first + RDD de riesgo alto). Estado: implementado en dominio, aplicación, API y adaptador Postgres; **adaptador verificado contra Postgres 16 local**.

## Hallazgo
`packages/application/src/use-cases/journal/update-journal-entry.use-case.ts` no recibe `TenantScope`:
- `execute(id, input)` llama `journalRepository.findById(id)` y `accountService.getById(accountId)` **sin organización ni empresa/RUC**.
- `JournalEntryRepository.findById(id: string)` (`packages/domain/src/repositories/journal-entry.repository.ts:92`) y `AccountService.getById(id: string)` tampoco reciben scope.
- Único llamador: `apps/api/src/features/journal-entries/application/commands/update-journal-entry.ts:40`, que pasa solo `id`.

Consecuencia: quien conozca (o adivine) el id de un asiento o de una cuenta de otro tenant puede editarlo o referenciarlo si la capa de API/adaptador no filtra por su cuenta. Está por verificar en `persistence` y en las rutas.

## Evidencia
`packages/application/src/use-cases/journal/__tests__/h02-cross-tenant-accounts.test.ts` ya exige el comportamiento correcto (`execute(scope, id, input)` y rechazo de cuentas de otro tenant) y **falla** en `main`: la firma real es `execute(id, input)`, así que el test recibe un error de Zod en vez de `Cuenta no encontrada`.

## Hallazgo relacionado
`get-transaction.use-case.ts:72` arma el scope con `companyId: input.companyId ?? ""`: si el llamador omite `companyId`, se consulta con empresa vacía. Su test (`transaction-use-cases.test.ts:191`) está desactualizado y falla.

## Hecho
- [x] `JournalEntryRepository.findById(scope, id)` y `delete(scope, id)`; Postgres filtra por `companyId` del scope (`delete` lanza `not found` si el asiento no es del tenant, antes de borrar líneas).
- [x] `AccountService.getById(scope, id)`; la implementación de la API filtra `pcgeAccounts` por `companyId`.
- [x] `Create/Update/Delete/UpdateStatus` de asientos reciben `TenantScope` como primer parámetro.
- [x] API: comandos y la consulta `getJournalEntry` reciben el scope; las 8 rutas por id lo construyen con `resolveTenantScope(companyContext?.companyId)` (falla si no hay empresa).
- [x] Tests: application journal 37/37 (incluye `h02-cross-tenant-accounts`, `update-journal-entry-status` nuevo y casos de scope en create/delete); API `tenant-scope-commands.test.ts` 7/7. Mutantes que quitan el scope de `findById`, `getById` y `delete` son detectados.

## Pendiente
- [x] **Verificado contra Postgres 16**: `postgres-journal-entry.tenant-scope.test.ts` (5/5). Se omite salvo que `DATABASE_URL_TEST` exista y sea igual a `DATABASE_URL`, para no escribir fixtures en una base que no sea de test. Mutantes sin filtro en `findById` (2 fallan) y sin comprobación de pertenencia en `delete` (1 falla) se detectan.
- [x] Esquema/scripts de BD: `db:push|check|generate|migrate|studio` raíz apuntaban a `scripts/dev/run-infra-db.sh` (no existe); ahora delegan en `@drenyra/infrastructure`. Se re-exportaron 10 `pgEnum` que `schema/index.ts` omitía (`check_status`, `check_category`, `fiscal_status`, `idempotency_*`, `inbox_*`, `job_*`), sin los cuales `drizzle-kit push` fallaba en una base nueva.
- [ ] `drizzle-kit push` completo sigue fallando: `evidence_organization_id_organizations_id_fk cannot be implemented` (tipos incompatibles entre `evidence.organization_id` y `organizations.id`). Requiere pgvector (`CREATE EXTENSION vector`), pero `docker-compose.yml` usa `postgres:16-alpine` sin él; también faltan `scripts/dev/db-migrate-smoke.sh` y `seed-dev-bootstrap.sh`.
- [x] Base de pruebas H02: usar `packages/persistence/test/schema/h02-wave1.sql` + `scripts/ci/h02-seed-test-data.sql` (ya existían) y correr con `DATABASE_URL` = `DATABASE_URL_TEST`.
- [x] `JournalEntryRepository.save` (upsert por id sin comprobar empresa; empresa derivada de "primera empresa del RUC") se reemplazó por `create(scope, entry)` (INSERT con `companyId` del scope, sin upsert) y `update(scope, entry)` (UPDATE ... WHERE id AND company_id, `not found` si 0 filas). Postgres: 9/9 propios + todos los de journal de `h02-pr1.4-cross-tenant`; mutantes sin filtro o con empresa fija se detectan.
- [x] `AccountRepository` con scope: `create/update/findById/findChildren/hasChildren/delete/getNextChildCode` reciben `TenantScope`; `save()` (upsert por id sin comprobar empresa) eliminado. Casos de uso `Create/Update/Delete/ToggleStatus/Get` de cuentas reciben el scope. Sin usos externos de esos casos de uso. Errores `Account not found` / `Journal entry not found` constantes (sin id) para no revelar si un id existe en otra empresa. Postgres: `h02-pr1.4-cross-tenant` 18/18 + propios 9/9; application 753/753; domain 1726/1726. Mutantes en `findById` (3 fallan) y `delete` (2 fallan) se detectan.
- [ ] Siguen sin scope: métodos de cuentas indexados por organización (`findByCode`, `findAll`, `findWithFilters`, `findMovementAccounts`, `getHierarchy`, `codeExists`, `count`) resuelven "la primera empresa del RUC" (`resolveCompanyIdFromOrganization`), y `JournalEntryRepository.countByAccountId(accountId)` / `findAll(organizationId)` / `count` / `getNextEntryNumber(organizationId, year)` igual; con organizaciones de varias empresas pueden mezclar o elegir la empresa equivocada.
- [x] Detracciones, CpeLog, AccountingPeriod, ExchangeRate, Client, Provider, Transaction, Invoice: `scripts/ci/h02-legacy-api-check.sh` ya los marca limpios (los stubs de `h02-characterization.test.ts` están desactualizados). Con este cambio, cuentas y asientos también quedan limpios.
- [ ] **Violaciones que aún reporta `bash scripts/ci/h02-legacy-api-check.sh` (falla CI con 2):** `document.repository.ts:64` `findById(id)` (ya existe `findByIdForCompany(id, companyId)`; falta migrar llamadores en `application/use-cases/document/*` y `infrastructure/queues/document-processor.worker.ts`) y `evidence.repository.ts:37` `findByHash(hash)` (adaptadores en `apps/api/.../evidence-repository.adapter.ts` y `persistence/.../postgres-evidence/repository.ts`).
- [x] Rutas con test activo: `journal-routes-tenant.test.ts` (9/9) sustituye el guard por un stub; `journal-routes.test.ts` sigue excluido (espera 500 en todo porque su mock de sesión no se propaga).
- [x] "Asiento no encontrado" → 404 y "Contexto de empresa requerido" → 403 en las 8 rutas. **Cambio de contrato:** `approve` y `reject` devolvían 400 para "no encontrado"; ahora 404.
- [x] `GetTransactionUseCase`: `companyId` ahora es obligatorio en el input y se rechaza vacío sin consultar el repositorio (sin llamadores en producción). `application`: 749/749.
- [ ] Revisar otros repositorios con `findById(id)` sin scope (cuentas, detracciones; ver `packages/test-utils/src/tenant/__tests__/h02-characterization.test.ts`).

## Fuera de alcance
- Repositorios de otras entidades (cuentas, detracciones).

## Restricciones
- Cambia contratos públicos (dominio + persistencia + API): requiere docs y tests. Necesita Postgres para verificar el adaptador.
