# Exploration: Invoice Entity Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-entity-unification`

---

## Resumen

Actualmente existen **tres entidades Invoice** en DRENYRA con shapes, campos y ciclos de vida distintos. Esto genera fricción en el mantenimiento, riesgo de inconsistencias fiscales, y bloquea la migración de la ruta API al use case canónico.

## Estado Actual

### Entidad A: API Feature (`apps/api/src/features/billing/invoice/domain/invoice.entity.ts`)

**Propósito:** Persistencia, ruta API, pipeline de billing

```
class Invoice {
  constructor(
    id, companyId, customerId,
    series, correlative, invoiceNumber,
    issueDate, dueDate,
    currency, exchangeRate,
    items,
    subtotal, igvAmount, totalAmount, balanceDue,
    status, notes,
    createdAt, updatedAt,
    sunatCdr?, sunatTicket?, sunatStatus?
  )
  static create(props: {...})
  canEdit(), isOverdue(), getRemainingBalance(), isFullyPaid(),
  applyPayment(), markAsSent()
}
```

- Usada por: `InvoiceRepository`, rutas API, handlers, tests
- Campos únicos: `customerId`, `correlative`, `invoiceNumber`, `exchangeRate`, `balanceDue`, `paidAmount` (en repo)
- Status: `DRAFT | SENT | PAID | OVERDUE | CANCELLED`

### Entidad B: Domain Package Nueva (`packages/domain/src/entities/Invoice.ts`)

**Propósito:** Entidad canónica del dominio, country-agnostic

```
class Invoice {
  private constructor(private props: InvoiceProps)  // frozen
  static create(props: InvoiceProps)
  static fromPrimitives(data: InvoicePrimitiveData)
  canBeModified(), isOverdue(), getFullNumber(), equals()
  markAsSent(), markAsAccepted(), markAsRejected(), cancel()
  toJSON()
  // Getters: id, series, number, issueDate, clientName,
  //   buyerTaxId, clientRUC, clientDNI, clientAddress,
  //   baseAmount, taxAmount, igvAmount, totalAmount,
  //   status, fiscalStatus, companyId,
  //   items, notes, sunatTicket, sunatCdrUrl,
  //   sunatResponseCode, sentToSunatAt,
  //   createdAt, updatedAt
}
```

- Campos únicos: `buyerTaxId`, `taxAmount`, `fiscalStatus`, `sunatResponseCode`, `sentToSunatAt`
- Status dual: `InvoiceStatus` (legacy) + `FiscalStatus` (generic)
- Tipo items: `{ id, description, quantity, unitPrice, subtotal, igv, total, taxType? }`

### Entidad C: Domain Package Vieja (`packages/domain/src/entities/invoice/invoice.entity.ts`)

**Propósito:** Versión anterior, **YA FUE ELIMINADA** durante el SDD anterior.

Actualmente solo existe como barrel residual en las importaciones.

## Comparación de Campos

| Campo                      | API Entity         | Domain Entity (nueva)       | ¿Unificada?         |
| -------------------------- | ------------------ | --------------------------- | ------------------- |
| `id`                       | ✅ `string`        | ✅ `string`                 | ✅                  |
| `companyId`                | ✅                 | ✅ (agregado recientemente) | ✅                  |
| `series`                   | ✅ `string`        | ✅ `DocumentSeries`         | ⚠️ distinto tipo    |
| `correlative`              | ✅ `number`        | ❌                          | ❌                  |
| `invoiceNumber`            | ✅ `string`        | ✅ via `getFullNumber()`    | ⚠️ derivado         |
| `issueDate`                | ✅ `Date`          | ✅ `Date`                   | ✅                  |
| `dueDate`                  | ✅ `Date`          | ✅ `Date`                   | ✅                  |
| `customerId`               | ✅ `string`        | ❌                          | ❌                  |
| `clientName`               | ❌                 | ✅ `string`                 | ❌                  |
| `buyerTaxId`               | ❌                 | ✅ `TaxIdentifier`          | ❌                  |
| `clientRUC`                | ❌                 | ✅ `RUC`                    | ❌                  |
| `clientDNI`                | ❌                 | ✅ `DNI`                    | ❌                  |
| `clientAddress`            | ❌                 | ✅ `string`                 | ❌                  |
| `currency`                 | ✅ inline          | ✅ via `Money`              | ⚠️ indirecto        |
| `exchangeRate`             | ✅ `number`        | ❌                          | ❌                  |
| `items`                    | ✅ `InvoiceItem[]` | ✅ `InvoiceItem[]`          | ⚠️ distintos shapes |
| `subtotal`                 | ✅ `Money`         | ✅ via items sum            | ⚠️ calculado        |
| `igvAmount`                | ✅ `Money`         | ✅ + `taxAmount`            | ⚠️ dual             |
| `totalAmount`              | ✅ `Money`         | ✅ `Money`                  | ✅                  |
| `balanceDue`               | ✅ `Money`         | ❌                          | ❌                  |
| `status`                   | ✅ `InvoiceStatus` | ✅ + `fiscalStatus`         | ⚠️ dual             |
| `notes`                    | ✅ `string`        | ✅ `string`                 | ✅                  |
| `sunatCdr` / `sunatCdrUrl` | ✅                 | ✅                          | ✅                  |
| `sunatTicket`              | ✅                 | ✅                          | ✅                  |
| `sunatStatus`              | ✅ `string`        | ❌                          | ❌                  |
| `sunatResponseCode`        | ❌                 | ✅                          | ❌                  |
| `sentToSunatAt`            | ❌                 | ✅                          | ❌                  |
| `createdAt`                | ✅ `Date`          | ✅ `Date`                   | ✅                  |
| `updatedAt`                | ✅ `Date`          | ✅ `Date`                   | ✅                  |

## Dependencias por Capa

### API Entity — Consumidores Directos

```
domain/invoice.entity.ts
├── domain/invoice.repository.interface.ts
├── infrastructure/invoice.repository.ts  (mapToDomain, create, update)
├── infrastructure/repository.ts
├── application/commands/update-invoice.command.ts
├── application/commands/create-invoice.command.ts
├── application/commands/delete-invoice.command.ts
├── application/commands/apply-payment.command.ts
├── application/commands/update-invoice-status.command.ts
├── application/queries/get-invoice.query.ts
├── application/queries/list-invoices.query.ts
├── api/handlers/invoice-response.ts
├── api/handlers/load-scoped-invoice.ts
├── api/handlers/invoice-electronic-summary.ts
├── __tests__/unit/invoice.test.ts
├── __tests__/unit/invoice-response.test.ts
├── index.ts (barrel)
└── scoped-routes.test.ts
```

**Total: ~18 archivos**

### Domain Entity — Consumidores Directos

```
packages/domain/entities/Invoice.ts
├── packages/domain/repositories/invoice.repository.ts
├── packages/application/use-cases/invoice/update-invoice.use-case.ts
├── packages/application/.../__tests__/update-invoice.use-case.test.ts
└── packages/domain/entities/__tests__/Invoice.test.ts
```

**Total: ~4 archivos**

## Repositorios

| Propiedad   | API Repository                                                                                                                                          | Domain Repository Interface                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Nombre      | `InvoiceRepository`                                                                                                                                     | `InvoiceRepository` (interface)                                                                              |
| Métodos     | `create`, `findById`, `findByNumber`, `list`, `update`, `updateStatus`, `applyPayment`, `updateSunatResponse`, `delete`, `exists`, `getNextCorrelative` | `save`, `saveForOrganization?`, `update`, `updateForOrganization?`, `delete`, `findById`, `findAll`, `count` |
| Return type | `Invoice` (API entity)                                                                                                                                  | `Invoice` (domain entity)                                                                                    |

Son interfaces completamente distintas. No comparten ni un método.

## Riesgos

1. **Schema DB:** La tabla `invoices` tiene columnas como `customer_id`, `correlative`, `invoice_number`, `exchange_rate`, `balance_due`, `paid_amount` que no existen en la domain entity. Si unificamos la entity, el repository necesita mapear estos campos.
2. **Rotura de imports:** ~18 archivos importan de la API entity. Cambiar todos requiere typecheck riguroso.
3. **Pagos:** `balanceDue`, `paidAmount`, `applyPayment()` están en la API entity pero no en la domain. Si se eliminan, la lógica de pagos se rompe.
4. **Customer vs Buyer:** La API usa `customerId` (referencia a tabla customers). La domain usa `buyerTaxId` (RUC/DNI). Son modelos relacionales vs de dominio distintos.

## Conclusión de la Exploración

La unificación completa de entities es un cambio grande (~500-600 líneas, 20+ archivos). Implica:

1. **Enriquecer la domain entity** con campos de API que faltan (`customerId`, `correlative`, `invoiceNumber`, `exchangeRate`, `balanceDue`)
2. **O modernizar la API entity** para delegar a la domain entity
3. **Unificar los repositorios** o crear un adapter
4. **Migrar los 18 consumidores** de la API entity

La estrategia recomendada no es "fusionar las tres entities en una" — la entidad C ya fue eliminada. Es **migrar los consumidores de la API entity a la domain entity**, agregando los campos faltantes a la domain entity y creando un adapter de repositorio.
