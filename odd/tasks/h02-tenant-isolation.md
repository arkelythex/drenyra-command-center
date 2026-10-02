# H02 — Aislamiento por tenant (plan vivo)

**Última actualización**: 2026-10-01
**Nivel ODD**: crítico (test-first + review de riesgo alto en cada unidad).
**Estado ODD**: Working — Waves 0–4 y 6 avanzadas; faltan las violaciones del chequeo y la Wave 5.

Reemplaza al plan SDD `openspec/changes/drenyra-h02-tenant-isolation/` (`spec.md`, `design.md`, `tasks.md`), retirado con OpenSpec. El texto original se recupera con `git show d428534:openspec/changes/drenyra-h02-tenant-isolation/tasks.md`.

## Invariante

Todo acceso a datos tenant-owned lleva `TenantScope` (`organizationId` + `companyId`) como **primer parámetro**; un dato de otro tenant es indistinguible de uno inexistente (misma respuesta y mismo mensaje de error).

## Estado

| Wave | Contenido | Estado |
|------|-----------|--------|
| 0 | Caracterización, matriz de acceso, diseño RLS | Hecho (los stubs de `h02-characterization.test.ts` quedaron desactualizados) |
| 1 | Auth/scopes, `AccountRepository`, `JournalEntryRepository` | **Hecho** (ver `tenant-scope-journal-update.md`) |
| 2–3 | Detraction, CpeLog, AccountingPeriod, ExchangeRate, Transaction, Client, Provider | Limpios según `scripts/ci/h02-legacy-api-check.sh` |
| 4 | Evidence, Invoice, SireSubmission | Evidence y Document con violaciones abiertas (abajo) |
| 5 | Workers, SSE, exports, URLs firmadas | **Pendiente** |
| 6 | RLS shadow → activación gradual | Migraciones `0027`–`0030` aplicadas |

## Pendiente (en orden)

- [ ] **Violaciones del chequeo** (`bash scripts/ci/h02-legacy-api-check.sh` falla con 2): `document.repository.ts` `findById(id)` (ya existe `findByIdForCompany`; migrar llamadores en `application/use-cases/document/*` y `infrastructure/queues/document-processor.worker.ts`) y `evidence.repository.ts` `findByHash(hash)` (adaptadores en `apps/api/.../evidence-repository.adapter.ts` y `persistence/.../postgres-evidence/repository.ts`).
- [ ] **5.1 Workers:** validar que el `FiscalScope` del job sea consistente antes de la primera operación de negocio (`fiscal-agent.worker.ts`, `evidence-ingestion.worker.ts`, `document-processor.worker.ts`). Test: un job de la Org A no accede a datos de la Org B.
- [ ] **5.2 SSE:** `eventBus.publish()` filtra por `organizationId`; dos suscriptores, cada uno recibe solo lo suyo.
- [ ] **5.3 Exports:** la consulta incluye `organization_id` + `company_id`; la exportación del tenant A no contiene datos del B aunque coincidan los ids.
- [ ] **5.4 URLs firmadas:** la firma incluye el hash de `organizationId` + `companyId`; verificación en cada GET (403 cruzado).
- [ ] Métodos indexados por organización que resuelven «la primera empresa del RUC» (`findByCode`, `findAll`, `codeExists`, `getNextEntryNumber`, `countByAccountId`…).
- [ ] `drizzle-kit push` completo falla (FK de `evidence` con tipos incompatibles; pgvector requerido y ausente en `docker-compose.yml`).

## Base de pruebas

`packages/persistence/test/schema/h02-wave1.sql` + `scripts/ci/h02-seed-test-data.sql`, y correr con `DATABASE_URL` igual a `DATABASE_URL_TEST`.
