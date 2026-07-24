# Matriz de acceso multi-tenant — Drenyra

> Documento de referencia para H02 (Tenant Isolation Hardening).
> Define qué scope requiere cada entidad y qué roles pueden operar sobre ella.
> Creado: 2026-07-12. Actualizar cuando se agreguen nuevas entidades tenant-owned.

---

## 1. Tipos de scope

| Scope               | Campos                                                               | Cuándo usarlo                                                                |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `OrganizationScope` | `organizationId`                                                     | Entidades que pertenecen a la organización (settings, members, company list) |
| `TenantScope`       | `organizationId`, `companyId`                                        | Entidades operativas por empresa (documentos, evidencias, transacciones)     |
| `FiscalScope`       | `organizationId`, `companyId`, `companyRuc`, `period`, `countryCode` | Operaciones fiscales (cierres, revisiones, declaraciones)                    |
| `None`              | —                                                                    | Catálogos globales, reglas públicas, config compartida                       |

---

## 2. Matriz entidad → scope

### OrganizationScope

| Entidad              | Tabla DB                 | Repository               | Notas               |
| -------------------- | ------------------------ | ------------------------ | ------------------- |
| Organization         | `organizations`          | `OrganizationRepository` | Root del tenant     |
| OrganizationMember   | `auth_user_companies`    | N/A (vía auth)           | Bridge auth→company |
| OrganizationSettings | `organizations.settings` | `OrganizationRepository` | Config de la org    |
| User                 | `users`                  | —                        | Profile, auth       |

### TenantScope

| Entidad            | Tabla DB               | Repository                     | Scope requerido                                     |
| ------------------ | ---------------------- | ------------------------------ | --------------------------------------------------- |
| Company            | `companies`            | —                              | `OrganizationScope` (la company pertenece a la org) |
| Document           | `documents`            | `DocumentRepository`           | `TenantScope`                                       |
| Account (PCGE)     | `pcge_accounts`        | `AccountRepository`            | `TenantScope`                                       |
| JournalEntry       | `journal_entries`      | `JournalEntryRepository`       | `TenantScope`                                       |
| BankAccount        | `bank_accounts`        | `BankAccountRepository`        | `TenantScope`                                       |
| BankReconciliation | `bank_reconciliations` | `BankReconciliationRepository` | `TenantScope`                                       |
| BankTransaction    | `bank_transactions`    | `BankTransactionRepository`    | `TenantScope`                                       |
| Transaction        | `transactions`         | `TransactionRepository`        | `TenantScope`                                       |
| Invoice            | `invoices`             | `InvoiceRepository`            | `TenantScope`                                       |
| Client             | `clients`              | `ClientRepository`             | `TenantScope`                                       |
| Provider           | `providers`            | `ProviderRepository`           | `TenantScope`                                       |
| Detraction         | `detractions`          | `DetractionRepository`         | `TenantScope`                                       |
| CPELog             | `cpe_log`              | `CpeLogRepository`             | `TenantScope`                                       |
| AccountingPeriod   | `accounting_periods`   | `AccountingPeriodRepository`   | `TenantScope`                                       |
| ExchangeRate       | `exchange_rates`       | `ExchangeRateRepository`       | `TenantScope`                                       |
| Evidence           | `evidence_nodes`       | `EvidenceRepository`           | `TenantScope`                                       |
| AgentRun           | `agent_run_states`     | — (vía control-tower)          | `TenantScope`                                       |
| SireSubmission     | `sire_submissions`     | `SireSubmissionRepository`     | `TenantScope`                                       |

### FiscalScope

| Entidad          | Tabla DB              | Repository                | Scope requerido |
| ---------------- | --------------------- | ------------------------- | --------------- |
| Review           | —                     | `ControlTowerRepository`  | `FiscalScope`   |
| Finding          | —                     | —                         | `FiscalScope`   |
| Approval         | —                     | —                         | `FiscalScope`   |
| FiscalTruthEvent | `fiscal_truth_events` | —                         | `FiscalScope`   |
| FiscalCase       | —                     | `ControlTowerRepository`  | `FiscalScope`   |
| AuditEvent       | —                     | `ControlTowerRepository`  | `FiscalScope`   |
| EvidenceNode     | `evidence_nodes`      | `EvidenceGraphRepository` | `FiscalScope`   |
| EvidenceEdge     | `evidence_edges`      | `EvidenceGraphRepository` | `FiscalScope`   |

### None (global / no tenant scope)

| Entidad              | Razón                                                |
| -------------------- | ---------------------------------------------------- |
| AISettings           | User-scoped (pertenece al usuario, no a org/company) |
| ModelRegistration    | Catálogo global de modelos                           |
| Chat/Session         | User-scoped                                          |
| PCGE Catalog (base)  | Catálogo contable base, compartido                   |
| Tax rule definitions | Reglas fiscales públicas                             |
| Document types       | Catálogo global                                      |

---

## 3. Matriz rol → permiso

### Roles

| Rol          | Nivel        | Acceso por defecto                               |
| ------------ | ------------ | ------------------------------------------------ |
| `OWNER`      | Organización | Todas las companies, todas las operaciones       |
| `ADMIN`      | Organización | Todas las companies, operaciones administrativas |
| `ACCOUNTANT` | Por company  | Companies asignadas, ops contables               |
| `REVIEWER`   | Por company  | Companies asignadas, solo lectura + hallazgos    |
| `APPROVER`   | Por company  | Companies asignadas, solo aprobaciones           |
| `VIEWER`     | Por company  | Companies asignadas, solo lectura                |

### Permisos por operación

| Operación           | OWNER | ADMIN | ACCOUNTANT         | REVIEWER     | APPROVER     | VIEWER       |
| ------------------- | ----- | ----- | ------------------ | ------------ | ------------ | ------------ |
| `company:read`      | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ✅ (propias) | ✅ (propias) |
| `company:update`    | ✅    | ✅    | ❌                 | ❌           | ❌           | ❌           |
| `company:delete`    | ✅    | ❌    | ❌                 | ❌           | ❌           | ❌           |
| `journal:read`      | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ❌           | ❌           |
| `journal:create`    | ✅    | ✅    | ✅ (propias)       | ❌           | ❌           | ❌           |
| `journal:update`    | ✅    | ✅    | ✅ (propias draft) | ❌           | ❌           | ❌           |
| `journal:delete`    | ✅    | ✅    | ✅ (propias draft) | ❌           | ❌           | ❌           |
| `document:read`     | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ✅ (propias) | ✅ (propias) |
| `document:upload`   | ✅    | ✅    | ✅ (propias)       | ❌           | ❌           | ❌           |
| `evidence:read`     | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ✅ (propias) | ✅ (propias) |
| `evidence:download` | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ✅ (propias) | ✅ (propias) |
| `finding:read`      | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ✅ (propias) | ❌           |
| `finding:resolve`   | ✅    | ✅    | ✅ (propias)       | ❌           | ❌           | ❌           |
| `approval:request`  | ✅    | ✅    | ✅ (propias)       | ❌           | ❌           | ❌           |
| `approval:decide`   | ✅    | ✅    | ❌                 | ❌           | ✅ (propias) | ❌           |
| `sire:submit`       | ✅    | ✅    | ✅ (propias)       | ❌           | ❌           | ❌           |
| `report:generate`   | ✅    | ✅    | ✅ (propias)       | ✅ (propias) | ❌           | ❌           |
| `audit:read`        | ✅    | ✅    | ❌                 | ❌           | ❌           | ❌           |
| `user:invite`       | ✅    | ✅    | ❌                 | ❌           | ❌           | ❌           |
| `settings:read`     | ✅    | ✅    | ✅ (propias)       | ❌           | ❌           | ❌           |
| `settings:update`   | ✅    | ✅    | ❌                 | ❌           | ❌           | ❌           |

### Regla de visibilidad cross-company

> Un usuario con rol `ACCOUNTANT` en Company A1 NO tiene acceso automático a Company A2,
> aunque ambas estén bajo la misma organización.

La excepción son `OWNER` y `ADMIN`, que tienen acceso a todas las companies de su organización.

---

## 4. Estrategia legacy por wave

| Wave | Repositorios limpiados                                                              | Métodos legacy eliminados                                                     | Fecha tope   |
| ---- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| W1   | AccountRepository, JournalEntryRepository                                           | `findById(id)`, `delete(id)`                                                  | Al cerrar W1 |
| W2   | DetractionRepository, CpeLogRepository, AccountingPeriodRepository                  | `findById(id)`                                                                | Al cerrar W2 |
| W3   | ExchangeRateRepository, TransactionRepository, ClientRepository, ProviderRepository | `findById(id)`                                                                | Al cerrar W3 |
| W4   | EvidenceRepository, InvoiceRepository, SireSubmissionRepository                     | `findById(id)`, `findByHash(hash)`, `findByIdempotencyKey(key)`, `update(id)` | Al cerrar W4 |
| W6   | Verificación global                                                                 | grep de cualquier método sin scope                                            | Al cerrar W6 |

### Caller allowlist temporal

Durante la migración, SOLO estos callers pueden usar métodos legacy.
Cualquier nuevo caller fuera de esta lista debe fallar en CI.

| Método legacy                                        | Callers permitidos                                                                                                                                        | Wave que lo elimina |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `AccountRepository.findById(id)`                     | `toggle-account-status.use-case.ts`, `create-account.use-case.ts`, `get-accounts.use-case.ts`, `delete-account.use-case.ts`, `update-account.use-case.ts` | W1                  |
| `AccountRepository.findChildren(parentId)`           | `create-account.use-case.ts`                                                                                                                              | W1                  |
| `AccountRepository.hasChildren(id)`                  | `delete-account.use-case.ts`                                                                                                                              | W1                  |
| `AccountRepository.getNextChildCode(parentId)`       | `create-account.use-case.ts`                                                                                                                              | W1                  |
| `JournalEntryRepository.findById(id)`                | `delete-journal-entry.use-case.ts`, `update-journal-entry-status.use-case.ts`, `update-journal-entry.use-case.ts`                                         | W1                  |
| `JournalEntryRepository.delete(id)`                  | `delete-journal-entry.use-case.ts`                                                                                                                        | W1                  |
| `DetractionRepository.findById(id)`                  | `detraction.service.ts`                                                                                                                                   | W2                  |
| `CpeLogRepository.findById(id)`                      | `cpe-tracking.service.ts`                                                                                                                                 | W2                  |
| `AccountingPeriodRepository.findById(id)`            | `accounting-period.service.ts`                                                                                                                            | W2                  |
| `TransactionRepository.findById(id)`                 | `get-transaction.use-case.ts`, `delete-transaction.use-case.ts`                                                                                           | W3                  |
| `EvidenceRepository.findById(id)`                    | — (sin caller confirmado)                                                                                                                                 | W4                  |
| `EvidenceRepository.findByHash(hash)`                | — (sin caller confirmado)                                                                                                                                 | W4                  |
| `SireSubmissionRepository.findByIdempotencyKey(key)` | — (0 callers)                                                                                                                                             | W4                  |
| `SireSubmissionRepository.update(id)`                | — (0 callers)                                                                                                                                             | W4                  |
