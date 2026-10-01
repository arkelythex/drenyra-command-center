# UpdateJournalEntry sin aislamiento por tenant

**Última actualización**: 2026-10-01
**Nivel**: sustancial, riesgo fiscal/tenant (Strict TDD + RDD de riesgo alto). Estado: implementado en dominio, aplicación, API y adaptador Postgres; **adaptador verificado contra Postgres 16 local**.

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
- [ ] Cómo reproducir la base local: `bunx drizzle-kit push` completo falla (`type "check_status" does not exist`, enum de `doctor-mode.schema.ts` no exportado) y `scripts/dev/run-infra-db.sh`, referenciado por `db:push`, no existe. Se generó DDL solo de `enums.ts`, `core.schema.ts` y `accounting.schema.ts` con `drizzle-kit generate` y se aplicó con `psql`.
- [ ] `apps/api/vitest.config.ts` excluye `journal-routes.test.ts`; las rutas no tienen test automático activo.
- [ ] Las rutas devuelven 500 para "Asiento no encontrado"; conviene mapearlo a 404.
- [x] `GetTransactionUseCase`: `companyId` ahora es obligatorio en el input y se rechaza vacío sin consultar el repositorio (sin llamadores en producción). `application`: 749/749.
- [ ] Revisar otros repositorios con `findById(id)` sin scope (cuentas, detracciones; ver `packages/test-utils/src/tenant/__tests__/h02-characterization.test.ts`).

## Fuera de alcance
- Repositorios de otras entidades (cuentas, detracciones).

## Restricciones
- Cambia contratos públicos (dominio + persistencia + API): requiere docs y tests. Necesita Postgres para verificar el adaptador.
