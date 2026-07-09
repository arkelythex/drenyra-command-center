# Proposal: Invoice Entity Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-entity-unification`

---

## 1. Business Problem

DRENYRA tiene **dos entidades Invoice activas** con shapes fundamentalmente distintos:

- **API Entity** — 21 campos, usada por 18 archivos, incluye `customerId`, `correlative`, `invoiceNumber`, `exchangeRate`, `balanceDue`
- **Domain Entity** — 25 campos, frozen/immutable, con genéricos `buyerTaxId`/`fiscalStatus`/`taxAmount`

Esto significa que un invoice recorrido por la ruta API se modela con una entidad, y uno procesado por un use case del domain package se modela con otra. Cualquier flujo que cruce ambos mundos necesita mapeo manual o duplica lógica.

El costo no es solo mantenimiento — es **riesgo de inconsistencias fiscales** si una transformación entre entidades pierde precisión en montos.

## 2. Solución Propuesta

La **domain entity** (`packages/domain/src/entities/Invoice.ts`) se convierte en la entidad canónica. La **API entity** se elimina. Todos los consumidores existentes se migran a usar la domain entity.

### 2.1 Domain Entity — Campos a Agregar

| Campo           | Tipo      | Origen     | Usado por                      |
| --------------- | --------- | ---------- | ------------------------------ |
| `customerId`    | `string`  | API entity | Repository, queries, handlers  |
| `correlative`   | `number`  | API entity | Repository, getNextCorrelative |
| `invoiceNumber` | `string`  | API entity | Repository (unique constraint) |
| `exchangeRate`  | `number`  | API entity | Repository (multi-currency)    |
| `balanceDue`    | `Money`   | API entity | applyPayment, isFullyPaid      |
| `sunatStatus`   | `string?` | API entity | Repository, handlers           |

### 2.2 API Entity — Eliminar

Se elimina `apps/api/src/features/billing/invoice/domain/invoice.entity.ts`.
Los consumidores se actualizan para importar `Invoice` desde `@drenyra/domain`.

### 2.3 InvoiceRepository — Refactorizar

El `InvoiceRepository` de API feature se refactoriza para:

1. Usar la domain entity (`Invoice` de `@drenyra/domain`) en vez de la API entity
2. Mantener los mismos métodos (`create`, `findById`, `update`, etc.)
3. `mapToDomain()` se actualiza para mapear DB → domain entity
4. Se evalúa si es posible que implemente la interface `InvoiceRepository` de domain

### 2.4 Repositorios

La interface `InvoiceRepository` del domain package (con `save`, `update`, `findById`, `findAll`, `count`) es más simple que la API `IInvoiceRepository`. Se mantienen ambas por ahora, pero la API `InvoiceRepository` concreta pasa a retornar domain entities.

## 3. Alcance

### Incluye

- Domain entity: agregar `customerId`, `correlative`, `invoiceNumber`, `exchangeRate`, `balanceDue`, `sunatStatus`
- API entity: eliminar archivo
- Repository API: refactorizar para usar domain entity
- 18 consumidores de API entity: actualizar imports
- Tests de API entity: migrar a domain entity tests

### No incluye

- Unificar las interfaces de repositorio (API `IInvoiceRepository` vs domain `InvoiceRepository`)
- `packages/application` (ya usa domain entity)
- SUNAT/electronic-invoicing features (usan sus propios tipos CPE)
- Schema de base de datos (no se modifican tablas)

## 4. Estimación

- **Líneas estimadas:** ~600
- **Archivos tocados:** ~22
- **PRs recomendados:** 2 (entidad + repository en PR1, consumidores + tests en PR2)

## 5. Próximo paso

Pasar a fase **Design** para diagrama de clases detallado y plan de migración archivo por archivo.
