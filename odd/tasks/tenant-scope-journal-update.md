# UpdateJournalEntry sin aislamiento por tenant

**Última actualización**: 2026-10-01
**Nivel**: sustancial, riesgo fiscal/tenant (Strict TDD + RDD de riesgo alto). Sin implementar; falta decisión de contrato.

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

## Alcance propuesto
- [ ] `JournalEntryRepository.findById(scope, id)` y `update` con scope; adaptador de `persistence` filtrando por organización y empresa.
- [ ] `AccountService.getById(scope, id)`.
- [ ] `UpdateJournalEntryUseCase.execute(scope, id, input)` y su llamador en `apps/api`.
- [ ] `GetTransactionUseCase`: exigir `companyId` (sin `?? ""`) y actualizar su test.
- [ ] Tests h02 en verde; test de integración contra Postgres (no hay DB en esta sesión).

## Fuera de alcance
- Otros casos de uso de journal sin revisar (`create`, `delete`, `post`): revisar en la misma tarea tras la decisión.

## Restricciones
- Cambia contratos públicos (dominio + persistencia + API): requiere docs y tests. Necesita Postgres para verificar el adaptador.
