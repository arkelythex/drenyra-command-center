# Design: Invoice Entity Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-entity-unification`

---

## 1. Domain Entity — Campos a Agregar

En `packages/domain/src/entities/Invoice.ts`:

### InvoiceProps

```diff
 export interface InvoiceProps {
   id: string;
   companyId: string;
   series: DocumentSeries;
   number: number;
   issueDate: Date;
   dueDate?: Date;
   clientName: string;
   buyerTaxId?: TaxIdentifier;
   clientRUC?: RUC;
   clientDNI?: DNI;
   clientAddress?: string;
+  customerId: string;
   baseAmount: Money;
   taxAmount?: Money;
   igvAmount: Money;
   totalAmount: Money;
+  exchangeRate: number;
+  balanceDue: Money;
   status: InvoiceStatus;
   fiscalStatus?: FiscalStatus;
   items: InvoiceItem[];
   notes?: string;
   sunatResponseCode?: string;
   sentToSunatAt?: Date;
   sunatTicket?: string;
   sunatCdrUrl?: string;
+  sunatStatus?: string;
   createdAt: Date;
   updatedAt: Date;
 }
```

### InvoicePrimitiveData

```diff
   clientAddress?: string;
+  customerId: string;
   baseAmount: number;
+  exchangeRate: number;
+  balanceDue: number;
   igvAmount: number;
   taxAmount?: number;
   totalAmount: number;
   ...
   sunatTicket?: string;
   sunatCdrUrl?: string;
+  sunatStatus?: string;
```

### InvoiceItem (API entity → domain)

La API entity tiene `InvoiceItem` con `productId?`, `igvRate`, `igvAmount`, `totalAmount`.
La domain entity tiene `InvoiceItem` con `igv`, `total`, `taxType?`.

Los campos `productId`, `igvRate` no existen en domain entity. Se **agregan** como opcionales para no perder datos:

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

### InvoiceStatus (API entity)

La API entity usa `DRAFT | SENT | PAID | OVERDUE | CANCELLED`.
La domain entity usa `DRAFT | PENDING | SENT | ACCEPTED | REJECTED | CANCELLED`.

**Diferencia semántica:**

- `PAID` en API entity no existe en domain (domain no maneja pagos)
- `PENDING` en domain entity no existe en API (API solo tiene DRAFT → SENT)
- `OVERDUE` en API entity es derivado, no persistido
- `ACCEPTED/REJECTED` en domain son estados post-SUNAT

**Decisión:** Se agrega `PAID` al InvoiceStatus del domain entity para compatibilidad. `PENDING` se mantiene como estado válido. `OVERDUE` se mantiene como método derivado.

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

### Getters

Se agregan getters a la clase `Invoice`:

```typescript
get customerId(): string { return this.props.customerId; }
get correlative(): number { return this.props.number; }  // Alias: number == correlative
get invoiceNumber(): string { return this.getFullNumber(); }
get exchangeRate(): number { return this.props.exchangeRate; }
get balanceDue(): Money { return this.props.balanceDue; }
get sunatStatus(): string | undefined { return this.props.sunatStatus; }
```

**Nota:** `correlative` y `invoiceNumber` son derivados de `series` + `number`. La API entity los tenía como campos directos. La domain entity ya tiene `getFullNumber()` que devuelve `"F001-00000001"`.

---

## 2. API Entity — Eliminar

Archivo: `apps/api/src/features/billing/invoice/domain/invoice.entity.ts`

**Antes de eliminar**, verificar que ningún import quede huérfano. El barrel `index.ts` de la feature y los ~18 consumidores deben apuntar a `@drenyra/domain` o al nuevo barrel.

---

## 3. InvoiceRepository — Refactorizar

### 3.1 mapToDomain()

El método actual construye `new Invoice(...)` con 21 argumentos posicionales (API entity).
Debe cambiarse a `Invoice.fromPrimitives()` con los campos mapeados.

```typescript
// Antes (API entity):
return new Invoice(
  record.id, record.companyId, record.customerId,
  record.series, record.correlative, record.invoiceNumber,
  ...
);

// Después (domain entity via fromPrimitives):
return Invoice.fromPrimitives({
  id: record.id,
  companyId: record.companyId,
  customerId: record.customerId || '',
  series: record.series,
  number: record.correlative,
  invoiceNumber: record.invoiceNumber,
  issueDate: record.issueDate.toISOString(),
  dueDate: record.dueDate.toISOString(),
  clientName: '',  // No existe en DB, default
  baseAmount: parseFloat(record.subtotal) * 100,  // to cents
  exchangeRate: Number(record.exchangeRate),
  balanceDue: parseFloat(record.balanceDue) * 100,
  igvAmount: parseFloat(record.igvAmount) * 100,
  totalAmount: parseFloat(record.totalAmount) * 100,
  currency: record.currency,
  status: record.status,
  items: record.items?.map(i => ({...})),
  sunatTicket: record.sunatTicket,
  sunatCdrUrl: record.cdrUrl,
  sunatStatus: record.sunatStatus,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
```

### 3.2 create()

El método `create()` recibe una `Invoice` (API entity) y la persiste. Con domain entity:

```typescript
async create(invoice: Invoice): Promise<Invoice> {
  return withCompanyRlsTransaction(invoice.companyId, async (tx) => {
    const [saved] = await tx.insert(invoices).values({
      id: invoice.id,
      companyId: invoice.companyId,
      customerId: invoice.customerId,
      series: invoice.series.toString(),
      correlative: invoice.number,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate ?? invoice.issueDate,
      currency: invoice.baseAmount.getCurrency(),
      exchangeRate: String(invoice.exchangeRate),
      subtotal: invoice.baseAmount.toString(),
      igvAmount: invoice.taxAmount?.toString() ?? invoice.igvAmount.toString(),
      totalAmount: invoice.totalAmount.toString(),
      balanceDue: invoice.balanceDue.toString(),
      status: invoice.status,
      notes: invoice.notes,
      cdrUrl: invoice.sunatCdrUrl,
      sunatTicket: invoice.sunatTicket,
      sunatStatus: invoice.sunatStatus,
      ...
    }).returning();
    ...
  });
}
```

### 3.3 update(), updateStatus(), etc

Misma lógica: donde antes se accedía a `invoice.customerId`, ahora se accede a `invoice.customerId`. Donde antes era `invoice.invoiceNumber`, ahora es `invoice.invoiceNumber` (getter).

---

## 4. Consumidores — Plan de Migración

### 4.1 Barrel (index.ts)

```diff
- export { Invoice, type InvoiceItem, type InvoiceStatus } from "./domain/invoice.entity";
+ export { Invoice, type InvoiceItem, type InvoiceStatus } from "@drenyra/domain";
```

### 4.2 Repository Interface

```diff
- import type { Invoice, InvoiceStatus } from "./invoice.entity";
+ import type { Invoice, InvoiceStatus } from "@drenyra/domain";
```

### 4.3 Commands

| Command                            | Cambio                                               |
| ---------------------------------- | ---------------------------------------------------- |
| `create-invoice.command.ts`        | Import de `@drenyra/domain`                          |
| `create-invoice.handler.ts`        | Import de `@drenyra/domain`                          |
| `update-invoice.command.ts`        | Import de `@drenyra/domain`                          |
| `update-invoice-status.command.ts` | Import de `@drenyra/domain`                          |
| `delete-invoice.command.ts`        | Solo usa `IInvoiceRepository`, sin cambios de entity |
| `apply-payment.command.ts`         | Solo usa `IInvoiceRepository`, sin cambios de entity |

### 4.4 Queries

| Query                    | Cambio                                   |
| ------------------------ | ---------------------------------------- |
| `get-invoice.query.ts`   | Import de `@drenyra/domain`              |
| `list-invoices.query.ts` | Solo usa `InvoiceStatus`, cambiar import |

### 4.5 Handlers

| Handler                         | Cambio                      |
| ------------------------------- | --------------------------- |
| `invoice-response.ts`           | Import de `@drenyra/domain` |
| `load-scoped-invoice.ts`        | Import de `@drenyra/domain` |
| `invoice-electronic-summary.ts` | Import de `@drenyra/domain` |

### 4.6 Infrastructure (second repository file)

`infrastructure/repository.ts` — revisar si importa la entity. Migrar.

### 4.7 Tests

| Test                       | Acción                                                               |
| -------------------------- | -------------------------------------------------------------------- |
| `invoice.test.ts` (API)    | **Migrar asserts** a `packages/domain/.../__tests__/Invoice.test.ts` |
| `invoice-response.test.ts` | Actualizar imports                                                   |
| `scoped-routes.test.ts`    | Actualizar imports (ya hecho parcialmente)                           |

---

## 5. Dependencia: InvoiceRepository de API → domain

Actualmente la API `InvoiceRepository` implementa `IInvoiceRepository` (API interface).
Después del cambio, retorna `Invoice` (domain entity). La interface `IInvoiceRepository` se queda igual pero su tipo `Invoice` ahora es el del domain.

Esto **no rompe** a los consumidores de `IInvoiceRepository` porque el contrato de métodos no cambia, solo el tipo del objeto retornado.

---

## 6. Plan de PRs

### PR1: Entity + Repository (~350 líneas)

1. Agregar campos a domain Invoice (Props, PrimitiveData, fromPrimitives, toJSON, getters)
2. Agregar `PAID` a InvoiceStatus
3. Agregar `productId`, `igvRate` a InvoiceItem
4. Refactorizar `InvoiceRepository.mapToDomain()` a `fromPrimitives()`
5. Refactorizar `InvoiceRepository.create()`/`update()` para domain entity
6. Actualizar barrel de API feature
7. Actualizar `invoice.repository.interface.ts` imports

### PR2: Consumidores + Tests (~250 líneas)

1. Actualizar imports en commands, queries, handlers
2. Migrar tests de API entity a domain
3. Verificar typecheck + tests

---

## 7. Próximo paso

Pasar a fase **Tasks** para desglose granular.
