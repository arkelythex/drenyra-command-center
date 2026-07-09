# Design: Invoice Update Logic Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-update-refactor`
**Fase:** Design

---

## 1. Class Diagram: Domain Layer (paquete `@drenyra/domain`)

```
┌─────────────────────────────────────────────────────────┐
│                    Invoice (Entity)                       │
├─────────────────────────────────────────────────────────┤
│ - props: InvoiceProps (frozen)                           │
├─────────────────────────────────────────────────────────┤
│ + create(props): Invoice                                  │
│ + fromPrimitives(data): Invoice                            │
│ + canBeModified(): boolean                                 │
│ + isOverdue(): boolean                                     │
│ + getFullNumber(): string                                  │
│ + markAsSent(ticket): Invoice                              │
│ + markAsAccepted(): Invoice                                │
│ + markAsRejected(reason): Invoice                          │
│ + cancel(): Invoice                                        │
│ + equals(other): boolean                                   │
│ + toJSON(): Record<string, unknown>                        │
│ + getters: id, series, number, issueDate, clientName,      │
│            baseAmount, taxAmount, totalAmount, status,     │
│            fiscalStatus, items, companyId, ...              │
├─────────────────────────────────────────────────────────┤
│ <interface> InvoiceProps                                   │
│ <interface> InvoiceItem                                    │
│ <interface> InvoicePrimitiveData                           │
│ type InvoiceStatus                                         │
│ type FiscalStatus                                          │
└─────────────────────────────────────────────────────────┘
         │
         │ creates/consumes
         ▼
┌──────────────────────────────────────────────────────┐
│ <value object> Money                                  │
│ <value object> DocumentSeries                         │
│ <value object> RUC / DNI                              │
│ <interface> TaxIdentifier                             │
└──────────────────────────────────────────────────────┘
```

### Entity Unification — Field Diff

| Campo                      | API Entity | Domain Entity (nueva) | Domain Entity (invoice/) | Unificada                   |
| -------------------------- | ---------- | --------------------- | ------------------------ | --------------------------- |
| `companyId`                | ✅         | ❌                    | ❌                       | ✅                          |
| `customerId`               | ✅         | ❌                    | ❌                       | ❌ (usar `buyerTaxId`)      |
| `buyerTaxId`               | ❌         | ✅                    | ❌                       | ✅                          |
| `taxAmount`                | ❌         | ✅                    | ❌                       | ✅                          |
| `fiscalStatus`             | ❌         | ✅                    | ❌                       | ✅                          |
| `sunatTicket`              | ✅         | ❌                    | ❌                       | ✅                          |
| `sunatCdr` / `sunatCdrUrl` | ✅         | ❌                    | ❌                       | ✅                          |
| `paidAmount`               | en repo    | ❌                    | ❌                       | en repo                     |
| `balanceDue`               | ✅         | ❌                    | ❌                       | en repo (pago no es update) |

---

## 2. Class Diagram: Application Layer (paquete `@drenyra/application`)

```
┌───────────────────────────────────────────────────────┐
│          UpdateInvoiceUseCase                          │
├───────────────────────────────────────────────────────┤
│ - invoiceRepository: InvoiceRepository                 │
│ - taxCalculationService: TaxCalculationService          │
├───────────────────────────────────────────────────────┤
│ + execute(input): void                                  │
└──────────────────────┬────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌─────────────────┐ ┌──────────────────────┐ ┌──────────────────┐
│ InvoiceRepository │ │ TaxCalculationService │ │ UpdateInvoiceDTO  │
│ (domain interface) │ │ (service)              │ │ (Zod validated)   │
└─────────────────┘ └──────────────────────┘ └──────────────────┘

┌────────────────────────────────────────────────────────────┐
│           TaxCalculationService (Interface)                  │
├────────────────────────────────────────────────────────────┤
│ + calculateItems(input, currency, issueDate): Promise<...>   │
│ + aggregateTotals(items, currency): InvoiceTotals            │
├────────────────────────────────────────────────────────────┤
│           TaxCalculationServiceImpl                          │
├────────────────────────────────────────────────────────────┤
│ - taxRateProvider: TaxRateProviderService                    │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Sequence Diagram: Update Flow

```
Actor          API Route            LoadScoped     UpdateInvoiceUseCase    TaxCalc       Repo          DB
  │                │                    │                 │                  │             │            │
  │  PATCH /:id    │                    │                 │                  │             │            │
  │───────────────▶│                    │                 │                  │             │            │
  │                │ companyScopeGuard  │                 │                  │             │            │
  │                │─────────────────────────────────────▶│                  │             │            │
  │                │                    │                 │                  │             │            │
  │                │ loadScopedInvoice  │                 │                  │             │            │
  │                │───────────────────▶│                 │                  │             │            │
  │                │◀───────────────────│                 │                  │             │            │
  │                │  { ok, invoice }   │                 │                  │             │            │
  │                │                    │                 │                  │             │            │
  │                │ execute(input)     │                 │                  │             │            │
  │                │────────────────────────────────────▶│                  │             │            │
  │                │                    │                 │                  │             │            │
  │                │                    │                 │ findById(id)     │             │            │
  │                │                    │                 │─────────────────────────────────▶│            │
  │                │                    │                 │◀─────────────────────────────────│            │
  │                │                    │                 │  Invoice | null   │             │            │
  │                │                    │                 │                  │             │            │
  │                │                    │                 │ if !canBeModified → throw        │            │
  │                │                    │                 │                  │             │            │
  │                │                    │                 │ if items:        │             │            │
  │                │                    │                 │──────────────────▶│             │            │
  │                │                    │                 │ calculateItems() │             │            │
  │                │                    │                 │◀──────────────────│             │            │
  │                │                    │                 │                  │             │            │
  │                │                    │                 │ aggregateTotals()│             │            │
  │                │                    │                 │◀──────────────────│             │            │
  │                │                    │                 │                  │             │            │
  │                │                    │                 │ Invoice          │             │            │
  │                │                    │                 │ .fromPrimitives()│             │            │
  │                │                    │                 │ (nuevo estado)   │             │            │
  │                │                    │                 │                  │             │            │
  │                │                    │                 │ update(invoice)  │             │            │
  │                │                    │                 │─────────────────────────────────▶│            │
  │                │                    │                 │◀─────────────────────────────────│            │
  │                │                    │                 │  Invoice         │             │            │
  │                │◀────────────────────────────────────│                  │             │            │
  │                │                    │                 │                  │             │            │
  │  { id, number, │                    │                 │                  │             │            │
  │   total, status}│                   │                 │                  │             │            │
  │◀───────────────│                    │                 │                  │             │            │
```

---

## 4. File Change Plan

### 4.1 Modificar (`packages/domain`)

| Archivo                   | Acción         | Detalle                                                                                         |
| ------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `src/entities/Invoice.ts` | **Reescribir** | Agregar `companyId`, `sunatTicket`, `sunatCdrUrl`. Unificar Props. Mantener `fromPrimitives()`. |
| `src/entities/index.ts`   | **Actualizar** | Exportar desde `./Invoice`                                                                      |
| `src/index.ts`            | **Actualizar** | Asegurar exports                                                                                |

### 4.2 Eliminar (`packages/domain`)

| Archivo                                  | Razón                                  |
| ---------------------------------------- | -------------------------------------- |
| `src/entities/invoice/invoice.entity.ts` | Reemplazado por `Invoice.ts` unificado |
| `src/entities/invoice/types.ts`          | Types inline en `Invoice.ts`           |
| `src/entities/invoice/validators.ts`     | Lógica inline en constructor           |
| `src/entities/invoice/` (directorio)     | Vacío después de eliminar archivos     |

### 4.3 Crear (`packages/application`)

| Archivo                                                  | Propósito                 |
| -------------------------------------------------------- | ------------------------- |
| `src/services/tax-calculation.service.ts`                | Interfaz + implementación |
| `src/services/__tests__/tax-calculation.service.test.ts` | Tests unitarios           |

### 4.4 Modificar (`packages/application`)

| Archivo                                                           | Acción         | Detalle                                                                                    |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `src/use-cases/invoice/update-invoice.use-case.ts`                | **Reescribir** | Usar nueva Invoice entity, inyectar TaxCalculationService, eliminar `TaxCalculator` inline |
| `src/dtos/invoice/update-invoice.dto.ts`                          | **Actualizar** | Agregar `taxType` a `UpdateInvoiceItemDTO`                                                 |
| `src/validators/invoice/invoice.validators.ts`                    | **Actualizar** | Agregar validación de `taxType`                                                            |
| `src/use-cases/invoice/__tests__/update-invoice.use-case.test.ts` | **Actualizar** | Inyectar mock de TaxCalculationService                                                     |

### 4.5 Eliminar (`apps/api`)

| Archivo                                                                              | Razón                                     |
| ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `src/features/billing/invoice/domain/invoice.entity.ts`                              | Reemplazado por domain entity             |
| `src/features/billing/invoice/domain/invoice.repository.interface.ts`                | Usar interface de domain                  |
| `src/features/billing/invoice/application/commands/update-invoice.command.ts`        | Reemplazado por use case                  |
| `src/features/billing/invoice/application/commands/update-invoice-status.command.ts` | Reemplazado por use case o método directo |
| `src/types/invoice.types.ts`                                                         | Types migrados a domain                   |
| `src/validators/invoice.schema.ts`                                                   | Validación migrada a application          |

### 4.6 Modificar (`apps/api`)

| Archivo                                                             | Acción                 | Detalle                                             |
| ------------------------------------------------------------------- | ---------------------- | --------------------------------------------------- |
| `src/features/billing/invoice/infrastructure/invoice.repository.ts` | **Actualizar imports** | Usar Invoice entity de domain                       |
| `src/features/billing/invoice/api/routes/update.route.ts`           | **Actualizar**         | Usar UpdateInvoiceUseCase en vez de updateInvoice() |
| `src/features/billing/invoice/api/routes/update-status.route.ts`    | **Actualizar imports** | Si mantiene la ruta                                 |
| `src/features/billing/invoice/__tests__/unit/invoice.test.ts`       | **Eliminar o migrar**  | Tests de entity migrados a domain                   |

### 4.7 Paquetes y Dependencias

- `packages/application/package.json` — ya tiene dependencia a `@drenyra/domain` (verificar)
- `apps/api/package.json` — ya tiene dependencia a `@drenyra/application` (verificar)
- Asegurar que `packages/application` exporte `UpdateInvoiceUseCase` y `TaxCalculationService`

---

## 5. Migration Strategy (por fases)

### Phase 1: Entity Unification

```
1. Editar packages/domain/src/entities/Invoice.ts
   - Agregar campos faltantes (companyId, sunatTicket, sunatCdrUrl)
   - Unificar InvoiceItem type con taxType
2. Eliminar packages/domain/src/entities/invoice/
3. Eliminar apps/api/.../domain/invoice.entity.ts
4. Actualizar packages/domain/src/entities/__tests__/Invoice.test.ts
5. typecheck y test pass
```

### Phase 2: Tax Calculation Service

```
1. Crear packages/application/src/services/tax-calculation.service.ts
   - Extraer lógica de calculateUpdateInvoiceItems() + aggregateTotals()
2. Crear tests unitarios
3. typecheck y test pass
```

### Phase 3: Use Case + Route Migration

```
1. Refactorizar UpdateInvoiceUseCase (packages/application)
   - Nueva entity, nuevo service
   - Eliminar dependencia a TaxCalculator inline
2. Actualizar ruta API update.route.ts
   - Importar UpdateInvoiceUseCase
   - Eliminar update-invoice.command.ts
3. Migrar tests de route
4. typecheck y test pass
```

### Phase 4: Cleanup

```
1. Eliminar archivos obsoletos (entity API, types, validators, command)
2. Verificar que no hay imports rotos (typecheck)
3. lint + test + verify
```

---

## 6. Test Strategy

### 6.1 TaxCalculationService Tests

```typescript
describe("TaxCalculationService", () => {
  describe("calculateItems()", () => {
    it("should calculate IGV for GRAVADO items"
    it("should return zero IGV for EXONERADO items"
    it("should return zero IGV for INAFECTO items"
    it("should use correct vatRate from provider"
    it("should assign unique IDs when no id provided"
    it("should preserve existing item IDs"
  });
  describe("aggregateTotals()", () => {
    it("should sum base amounts correctly"
    it("should sum IGV amounts correctly"
    it("should sum total amounts correctly"
  });
});
```

### 6.2 Existing Tests to Preserve

| Test Suite                        | Assertions Clave                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `update-invoice.use-case.test.ts` | NotFound → throw; SENT → BusinessRuleError; recálculo totals; preserve campos; tenant-aware path; validación RUC |
| `invoice.test.ts` (API entity)    | Migrar a domain entity: create, canEdit/canBeModified, isOverdue, markAsSent, applyPayment                       |

---

## 7. Risk Assessment

| Riesgo                              | Impacto | Mitigación                                                             |
| ----------------------------------- | ------- | ---------------------------------------------------------------------- |
| **Rotura de import circular**       | Medio   | `Invoice.ts` solo importa value objects (Money, RUC, DNI) — sin riesgo |
| **Schema mismatch**                 | Bajo    | `fromPrimitives()` mapea exactamente al schema actual                  |
| **Tests de API entity huérfanos**   | Medio   | Migrar asserts al domain entity, no eliminar sin reemplazo             |
| **Dependency injection**            | Bajo    | `UpdateInvoiceUseCase` ya recibe repositorio por constructor           |
| **Regression en taxType EXONERADO** | Medio   | El nuevo service debe replicar exactamente la lógica actual            |

---

## 8. Next Step

Pasar a fase **Tasks** para desglosar en tickets de implementación con estimación y dependencias.
