# SDD Spec: H02 — Tenant Isolation Hardening

## Resumen

Convertir `FiscalScope` de convención de código en invariante técnico verificable. La auditoría confirmó que `organizationId`/`companyId` existen en todos los schemas pero no están forzados como precondición en todos los repositories, auth context, workers ni flujos asíncronos.

**Riesgo:** Crítico — una omisión de filtro puede exponer datos de otro tenant.

---

## 1. Motivación

### Evidencia de auditoría

| Hallazgo                                                                          | Archivo                                                               | Severidad |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- |
| `requireAuth()` retorna solo `userId` sin organización validada                   | `packages/infrastructure/src/auth/auth-utils.ts`                      | CRÍTICO   |
| `SireSubmissionRepository.findByIdempotencyKey()` sin filtro `companyId`          | `packages/persistence/src/repositories/sire-submission.repository.ts` | CRÍTICO   |
| `SireSubmissionRepository.update()` solo filtra por `id`, no por `id + companyId` | mismo archivo                                                         | ALTO      |
| Sin RLS activo en tablas críticas                                                 | DB schema actual                                                      | ALTO      |
| Sin tests negativos cross-tenant                                                  | ningún test suite                                                     | CRÍTICO   |
| Sin validación de scope en workers                                                | `fiscal-agent.worker.ts`                                              | ALTO      |
| `AuthContext` incompleto (sin memberships ni company list)                        | `auth-utils.ts`                                                       | ALTO      |

### Regla fundamental

> Ninguna operación de negocio puede existir fuera de un `FiscalScope` validado.

El scope no debe venir del body del request. Debe derivarse del session token + membership verificada.

---

## 2. Arquitectura objetivo

### 2.1 Tipos canónicos

```typescript
// packages/domain/src/drenyra/scope.ts

export interface FiscalScope {
  organizationId: string
  companyId: string
  fiscalPeriodId?: string // opcional — solo cuando aplica
}

export interface AuthenticatedContext {
  userId: string
  organizationId: string
  memberships: OrganizationMembership[]
}

export interface OrganizationMembership {
  organizationId: string
  companyIds: string[]
  role: Role // "owner" | "senior" | "junior" | "client"
  permissions: Permission[]
}
```

### 2.2 Flujo de autorización

```
HTTP Request
  → session validation (Clerk / Auth.js)
  → extract userId
  → load memberships from DB
  → validate selected company belongs to user's memberships
  → build AuthenticatedContext
  → derive FiscalScope
  → pass to application service
  → pass to repository
```

`organizationId` y `companyId` **nunca se confían desde el body del request**. Se derivan del contexto autenticado.

### 2.3 Repository contract

Todo repository que opere sobre entidades tenant-scoped debe:

```typescript
// ANTES (peligroso):
findById(id: string): Promise<Entity | null>

// DESPUÉS (seguro):
findById(scope: FiscalScope, id: string): Promise<Entity | null>
```

El scope debe incluir al menos `organizationId` y `companyId`.

### 2.4 RLS selectivo

Tablas candidatas a RLS:

| Tabla                 | RLS   | Justificación                      |
| --------------------- | ----- | ---------------------------------- |
| `documents`           | ✅ Sí | Evidencia fiscal sensible          |
| `evidence_nodes`      | ✅ Sí | Trazabilidad cross-tenant          |
| `evidence_edges`      | ✅ Sí | Grafos de evidencia                |
| `findings`            | ✅ Sí | Hallazgos por empresa              |
| `approvals`           | ✅ Sí | Aprobaciones financieras           |
| `fiscal_periods`      | ✅ Sí | Períodos fiscales por empresa      |
| `sire_submissions`    | ✅ Sí | Declaraciones SUNAT                |
| `agent_run_states`    | ✅ Sí | Ejecuciones de agentes por empresa |
| `agent_run_events`    | ✅ Sí | Eventos de ejecución               |
| `fiscal_truth_events` | ✅ Sí | Eventos de verdad fiscal           |
| Catálogos globales    | ❌ No | Datos compartidos                  |
| Rule definitions      | ❌ No | Reglas públicas                    |

---

## 3. Cambios por entregable

### H02.1 — FiscalScope canónico + auth context

**Archivos a crear:**

- `packages/domain/src/drenyra/scope.ts` — tipos `FiscalScope`, `AuthenticatedContext`, `OrganizationMembership`

**Archivos a modificar:**

- `packages/infrastructure/src/auth/auth-utils.ts` — `requireAuth()` debe retornar `AuthenticatedContext` completo en vez de solo `userId`
- `packages/infrastructure/src/auth/permissions.ts` — validar que `role` esté alineado con `memberships`
- `packages/persistence/src/schema/core.schema.ts` — verificar que tabla `organizations` y `memberships` existan o crear migración

### H02.2 — Repositories scope-first

**Repositories a auditar y corregir:**

1. `SireSubmissionRepository.findByIdempotencyKey(key)` → `findByIdempotencyKey(scope, key)` — agregar filtro `companyId`
2. `SireSubmissionRepository.update(id, input)` → `update(scope, id, input)` — agregar filtro `companyId`
3. `PostgresInvoiceRepository` — revisar métodos públicos que acepten solo `id`
4. `PostgresEvidenceGraphRepository` — ya tiene scope filter, verificar consistencia
5. Otros repositories con `findById(id)` sin scope

**Criterio:** Si la entidad tiene `organizationId` o `companyId` en su schema, ningún método público debe aceptar solo `id`.

### H02.3 — Negative tenant tests

Tests obligatorios por repository corregido:

```typescript
it('returns null when querying another tenant entity by id')
it('returns null when querying another tenant entity by external key')
it('rejects cross-company signed URL access')
it('does not publish SSE events across organizations')
it('requires worker payload to include validated fiscal scope')
it('does not resolve idempotency key outside company scope')
it('returns 404 instead of 403 for cross-tenant queries')
```

### H02.4 — RLS selectivo

Migraciones SQL para habilitar RLS en tablas críticas:

```sql
-- Habilitar RLS en schema
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_nodes ENABLE ROW LEVEL SECURITY;
-- ... por cada tabla crítica

-- Política base: el usuario puede ver solo su organización
CREATE POLICY tenant_isolation ON documents
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::text);
```

---

## 4. No incluido en este cambio

- ❌ Idempotencia sistemática (H01 separado)
- ❌ Transactional outbox (H03 separado)
- ❌ OpenTelemetry (H04 separado)
- ❌ DecisionBasis type (H05 separado)
- ❌ Refactors generales de arquitectura
- ❌ Cambios en UI/frontend más allá de lo necesario para props de scope
- ❌ Kafka / microservicios / event sourcing

---

## 5. Criterios de aceptación

- [ ] `FiscalScope` canónico creado y usado en todos los services de application layer
- [ ] `requireAuth()` retorna `AuthenticatedContext` con `organizationId` + `memberships`
- [ ] Ningún repository crítico acepta solo `id` sin scope
- [ ] `SireSubmissionRepository.findByIdempotencyKey()` corregido con filtro companyId
- [ ] Tests negativos cross-tenant para todos los repositorios corregidos
- [ ] Signed URLs validan tenant scope
- [ ] Workers reciben y validan FiscalScope
- [ ] SSE filtra eventos por scope
- [ ] RLS habilitado en tablas críticas O ADR explícito justificando exclusiones
- [ ] Logs no exponen datos de otro tenant
- [ ] `organizationId` nunca se acepta del body como autoridad
