# Tasks: Invoice Entity Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-entity-unification`

---

## Task Overview

| #   | Tarea                                         | PR  | Archivos | Deps | Est. líneas |
| --- | --------------------------------------------- | --- | -------- | ---- | ----------- |
| 1   | Agregar campos a domain Invoice               | PR1 | 1        | —    | 40          |
| 2   | Agregar PAID a InvoiceStatus                  | PR1 | 1        | —    | 5           |
| 3   | Agregar productId/igvRate a InvoiceItem       | PR1 | 1        | —    | 10          |
| 4   | Actualizar fromPrimitives() / toJSON()        | PR1 | 1        | 1    | 20          |
| 5   | Refactorizar mapToDomain() a fromPrimitives() | PR1 | 1        | 4    | 50          |
| 6   | Refactorizar create()/update() en repositorio | PR1 | 1        | 4    | 30          |
| 7   | Actualizar barrel de API feature              | PR1 | 1        | 5    | 10          |
| 8   | Actualizar invoice.repository.interface.ts    | PR1 | 1        | 7    | 5           |
| 9   | Migrar imports de commands                    | PR2 | 5        | 8    | 15          |
| 10  | Migrar imports de queries                     | PR2 | 2        | 9    | 5           |
| 11  | Migrar imports de handlers                    | PR2 | 3        | 9    | 10          |
| 12  | Migrar imports de infrastructure              | PR2 | 1        | 9    | 5           |
| 13  | Migrar tests de API entity a domain           | PR2 | 2        | 9    | 40          |
| 14  | Verificación final                            | PR2 | —        | 13   | —           |

**Total estimado:** ~295 líneas
**PRs:** 2 (entidad+repo + consumidores+tests)

---

## PR1: Entity + Repository

### Task 1: Agregar campos a domain Invoice

**Archivo:** `packages/domain/src/entities/Invoice.ts`

Agregar a `InvoiceProps`:

- `customerId: string`
- `exchangeRate: number`
- `balanceDue: Money`
- `sunatStatus?: string`

Agregar getters a la clase Invoice:

- `get customerId(): string`
- `get exchangeRate(): number`
- `get balanceDue(): Money`
- `get sunatStatus(): string | undefined`
- `get correlative(): number` (alias de `number`)
- `get invoiceNumber(): string` (alias de `getFullNumber()`)

**Criterio:** typecheck pasa, tests de domain entity pasan

---

### Task 2: Agregar PAID a InvoiceStatus

**Archivo:** `packages/domain/src/entities/Invoice.ts`

```diff
 export type InvoiceStatus =
   | "DRAFT"
   | "PENDING"
   | "SENT"
   | "ACCEPTED"
   | "REJECTED"
+  | "PAID"
   | "CANCELLED";
```

**Criterio:** `"PAID"` es un valor válido para `InvoiceStatus`

---

### Task 3: Agregar productId/igvRate a InvoiceItem

**Archivo:** `packages/domain/src/entities/Invoice.ts`

```diff
 export interface InvoiceItem {
   id: string;
+  productId?: string;
   description: string;
   quantity: number;
   unitPrice: Money;
   subtotal: Money;
   igv: Money;
   total: Money;
   taxType?: "GRAVADO" | "EXONERADO" | "INAFECTO";
+  igvRate?: number;
 }
```

**Criterio:** `InvoiceItem` acepta `productId` e `igvRate` como opcionales

---

### Task 4: Actualizar fromPrimitives() / toJSON()

**Archivo:** `packages/domain/src/entities/Invoice.ts`

En `fromPrimitives()`:

- Mapear `customerId`, `exchangeRate`, `balanceDue`, `sunatStatus` desde `InvoicePrimitiveData`
- Mapear `productId` e `igvRate` en items

En `InvoicePrimitiveData`:

- Agregar `customerId: string`
- Agregar `exchangeRate: number`
- Agregar `balanceDue: number`
- Agregar `sunatStatus?: string`

En `toJSON()`:

- Incluir `customerId`, `exchangeRate`, `balanceDue`, `sunatStatus`
- Incluir `productId`, `igvRate` en items

**Criterio:** `fromPrimitives()` reconstruye con los nuevos campos, `toJSON()` los serializa

---

### Task 5: Refactorizar mapToDomain() a fromPrimitives()

**Archivo:** `apps/api/src/features/billing/invoice/infrastructure/invoice.repository.ts`

Cambiar `mapToDomain()` de:

```typescript
// API entity (posicional)
return new Invoice(id, companyId, customerId, series, correlative, ...);
```

a:

```typescript
// Domain entity (fromPrimitives)
return Invoice.fromPrimitives({
  id: record.id,
  companyId: record.companyId,
  customerId: record.customerId || '',
  series: record.series,
  number: record.correlative,
  issueDate: record.issueDate.toISOString(),
  dueDate: record.dueDate.toISOString(),
  clientName: '',
  baseAmount: Number(record.subtotal) * 100, // to cents
  exchangeRate: Number(record.exchangeRate),
  balanceDue: Number(record.balanceDue) * 100,
  igvAmount: Number(record.igvAmount) * 100,
  totalAmount: Number(record.totalAmount) * 100,
  currency: record.currency,
  status: record.status,
  items: record.items?.map((i) => ({
    id: i.id,
    productId: i.productId,
    description: i.description,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice) * 100,
    subtotal: Number(i.subtotal) * 100,
    igv: Number(i.igvAmount) * 100,
    total: Number(i.totalAmount) * 100,
    taxType: i.taxType,
    igvRate: Number(i.igvRate),
  })),
  notes: record.notes,
  sunatTicket: record.sunatTicket,
  sunatCdrUrl: record.cdrUrl,
  sunatStatus: record.sunatStatus,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
})
```

**Criterio:** `mapToDomain()` retorna domain entity, typecheck pasa

---

### Task 6: Refactorizar create()/update() en repositorio

**Archivo:** `apps/api/src/features/billing/invoice/infrastructure/invoice.repository.ts`

En `create()` y `update()`:

- Cambiar accesos de campos de API entity a domain entity
- `invoice.customerId` → se mantiene igual (ambas lo tienen después de la unificación)
- `invoice.series` → API era string, domain es `DocumentSeries`: usar `invoice.series.toString()`
- `invoice.correlative` → API era campo directo, domain es `invoice.number`
- `invoice.invoiceNumber` → API era campo directo, domain es getter `invoice.invoiceNumber`
- `invoice.exchangeRate` → se mantiene igual
- `invoice.subtotal` → API entity tenía `subtotal`, domain es `baseAmount`
- `invoice.igvAmount` → API entity tenía `igvAmount`, domain tiene `taxAmount ?? igvAmount`
- `invoice.balanceDue` → se mantiene igual
- `invoice.sunatCdr` → API entity, domain es `sunatCdrUrl`
- `invoice.sunatStatus` → se agrega

**Criterio:** `create()` y `update()` persisten datos correctamente con domain entity

---

### Task 7: Actualizar barrel de API feature

**Archivo:** `apps/api/src/features/billing/invoice/index.ts`

```diff
- export { Invoice, type InvoiceItem, type InvoiceStatus } from "./domain/invoice.entity";
+ export { Invoice, type InvoiceItem, type InvoiceStatus, type FiscalStatus } from "@drenyra/domain";
```

**Criterio:** `import { Invoice } from "@drenyra/.../invoice"` sigue funcionando

---

### Task 8: Actualizar invoice.repository.interface.ts

**Archivo:** `apps/api/src/features/billing/invoice/domain/invoice.repository.interface.ts`

```diff
- import type { Invoice, type InvoiceStatus } from "./invoice.entity";
+ import type { Invoice, type InvoiceStatus } from "@drenyra/domain";
```

**Criterio:** typecheck pasa

---

## PR2: Consumidores + Tests

### Task 9: Migrar imports de commands

**Archivos:**

- `apps/api/.../commands/create-invoice.command.ts`
- `apps/api/.../commands/create-invoice.handler.ts`
- `apps/api/.../commands/update-invoice.command.ts`
- `apps/api/.../commands/update-invoice-status.command.ts`
- `apps/api/.../commands/apply-payment.command.ts`

Cambiar imports de `../../domain/invoice.entity` a `@drenyra/domain`.

**Criterio:** typecheck pasa en cada archivo

---

### Task 10: Migrar imports de queries

**Archivos:**

- `apps/api/.../queries/get-invoice.query.ts`
- `apps/api/.../queries/list-invoices.query.ts`

Cambiar imports de `../../domain/invoice.entity` a `@drenyra/domain`.

**Criterio:** typecheck pasa

---

### Task 11: Migrar imports de handlers

**Archivos:**

- `apps/api/.../handlers/invoice-response.ts`
- `apps/api/.../handlers/load-scoped-invoice.ts`
- `apps/api/.../handlers/invoice-electronic-summary.ts`

Cambiar imports de `../../domain/invoice.entity` a `@drenyra/domain`.

**Criterio:** typecheck pasa

---

### Task 12: Migrar imports de infrastructure

**Archivo:**

- `apps/api/.../infrastructure/repository.ts`

Cambiar imports de `../domain/invoice.entity` a `@drenyra/domain`.

**Criterio:** typecheck pasa, tests de repository pasan

---

### Task 13: Migrar tests de API entity a domain

**Archivos:**

- `apps/api/.../__tests__/unit/invoice.test.ts` — migrar asserts a `packages/domain/.../__tests__/Invoice.test.ts`
- `apps/api/.../__tests__/unit/invoice-response.test.ts` — actualizar imports

Para `invoice.test.ts`: los asserts existentes cubren `Invoice.create()`, `canEdit()`, `isOverdue()`, `applyPayment()`, `markAsSent()`, `isFullyPaid()`, `getRemainingBalance()`. Todos estos métodos existen en la domain entity (con nombres equivalentes).

| Test API Entity           | Equivalente Domain Entity                                |
| ------------------------- | -------------------------------------------------------- |
| `canEdit()`               | `canBeModified()`                                        |
| `markAsSent(cdr, ticket)` | `markAsSent(ticket)` — CDR es `sunatCdrUrl`              |
| `applyPayment(amount)`    | No existe en domain. Se agrega o se testea en repository |
| `isFullyPaid()`           | No existe en domain. Se agrega.                          |
| `getRemainingBalance()`   | No existe en domain. Se agrega.                          |

**Criterio:** Todos los asserts migrados, sin pérdida de cobertura

---

### Task 14: Verificación final

- `bun run typecheck` — 0 errores
- `bun run test` — todos pasan
- Verificar que `packages/application` tests sigan pasando (460 tests)
- Verificar que `apps/api` tests del invoice feature pasen

**Criterio:** CI verde

---

## Review Workload Forecast

| Métrica            | Valor                                         |
| ------------------ | --------------------------------------------- |
| Líneas estimadas   | ~295                                          |
| PRs                | 2 (chained)                                   |
| PR1 (entity+repo)  | ~170 líneas                                   |
| PR2 (consumidores) | ~125 líneas                                   |
| Riesgo de review   | Medio — cambios mecánicos pero en 22 archivos |

---

## Próximo paso

Pasar a fase **Apply** para implementar PR1 (entity + repository).
