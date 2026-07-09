# Exploration: Refactor de Lógica de Actualización de Comprobantes

**Creado:** 2026-07-07
**Contexto:** SDD — Fase de exploración

---

## Resumen Ejecutivo

La lógica de actualización de comprobantes (invoices/CPE) en DRENYRA está fragmentada en **tres capas distintas** con entidades Invoice duplicadas, comandos de update redundantes y lógica de cálculo replicada. Esto genera riesgo de inconsistencias fiscales, dificulta el mantenimiento y duplica el esfuerzo de testing.

---

## Hallazgos

### 1. Tres Entidades Invoice Distintas

| #   | Archivo                                                          | Propósito                         | Status                                                                          | Notas                                                        |
| --- | ---------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | `apps/api/src/features/billing/invoice/domain/invoice.entity.ts` | Entity de la feature billing      | `DRAFT, SENT, PAID, OVERDUE, CANCELLED`                                         | Tiene `companyId`, `customerId`, gestión de pagos, SUNAT CDR |
| 2   | `packages/domain/src/entities/Invoice.ts`                        | Entity del package domain (NUEVA) | `DRAFT, PENDING, SENT, ACCEPTED, REJECTED, CANCELLED` + `FiscalStatus` genérico | Tiene `buyerTaxId`, `taxAmount`, `fiscalStatus` + legacy     |
| 3   | `packages/domain/src/entities/invoice/invoice.entity.ts`         | Entity del package domain (VIEJA) | `DRAFT, PENDING, SENT, ACCEPTED, REJECTED, CANCELLED`                           | Solo legacy, usa validador externo                           |

**Problema:** La entidad #1 (API feature) es la que realmente se usa para persistencia y actualizaciones. La #2 es más moderna pero no está conectada al pipeline de update. La #3 parece ser la versión anterior de la #2.

### 2. Dos Comandos de Update Duplicados

**A) `apps/api/src/features/billing/invoice/application/commands/update-invoice.command.ts`**

- Tiene **clase deprecada** (`UpdateInvoiceCommand`) + **función standalone** (`updateInvoice()`)
- Lógica de validación duplicada: `validateInput()` y `validateUpdateInvoiceInput()` son idénticas
- Lógica de cálculo duplicada: `calculateItems()` y `calculateUpdateInvoiceItems()` son idénticas
- Reconstruye la entidad completa vía `Invoice.create()` + copia manual de campos
- Usa `taxRateProviderService` para obtener la tasa IGV
- Usa `InvoiceRepository` de la API feature

**B) `packages/application/src/use-cases/invoice/update-invoice.use-case.ts`**

- Usa `@drenyra/domain/entities/Invoice` (entity del domain package)
- Usa `UpdateInvoiceSchema` para validación Zod
- Usa `TaxCalculator.calculateIGV()` del domain package
- Soporta tanto `update()` como `updateForOrganization()`
- Tiene tests completos en `__tests__/update-invoice.use-case.test.ts`

**Problema:** Ambos comandos hacen lo mismo pero con entidades y cálculos diferentes. El de API feature tiene el `@deprecated` en la clase pero la función standalone nueva también tiene la misma lógica duplicada.

### 3. Capa de Electronic Invoicing y SUNAT

- `apps/api/src/features/electronic-invoicing/` — Maneja envío a SUNAT, procesamiento de CDR, lifecycle de CPE
- `apps/api/src/features/sunat/` — Generación de XML UBL 2.1, QR, firmas, validación de numeración
- `packages/domain/src/entities/invoice/` + `packages/domain/src/entities/Invoice.ts` — Entidades domain

La actualización de estado post-SUNAT (aceptado/rechazado) se maneja en `electronic-invoicing` y actualiza la entidad vía `InvoiceRepository.updateSunatResponse()`.

### 4. Tests Existentes

**Cobertura de update:**

- `packages/application/src/use-cases/invoice/__tests__/update-invoice.use-case.test.ts` — Tests completos del use case (8 tests: éxito, tenant-aware, not found, SENT rejection, recálculo de totals, preserve de campos, validación RUC, edge cases)
- `apps/api/src/features/billing/invoice/__tests__/unit/invoice.test.ts` — Tests de la entidad Invoice de API feature (17 tests: create, canEdit, isOverdue, applyPayment, markAsSent, isFullyPaid, getRemainingBalance)
- `apps/api/src/features/electronic-invoicing/__tests__/unit/send-route.test.ts` — Tests de envío electrónico
- `apps/api/src/features/electronic-invoicing/__tests__/unit/cdr-processor.service.test.ts` — Tests de CDR

### 5. Patrón de Actualización Actual

```
API Route (PATCH /:id)
  → loadScopedInvoice() → verifica tenant scope
  → updateInvoice()     → command en billing/invoice
    → InvoiceRepository.findById()
    → Invoice.create() + recálculo
    → InvoiceRepository.update()
      → Drizzle ORM con RLS transaction
```

El use case en `packages/application` es independiente y no está conectado a la ruta API.

---

## Análisis de Riesgos

1. **Riesgo fiscal:** Si los cálculos de IGV difieren entre las dos implementaciones de update, pueden generarse comprobantes con montos incorrectos.
2. **Riesgo de regresión:** Los tests existentes deben pasar después del refactor. Hay 17+ tests de entity y 8 de use case que cubren el comportamiento actual.
3. **Riesgo de alcance:** El refactor toca al menos 3 archivos (entity API, command API, use case application) más los tests y posibles dependientes (electronic-invoicing, sunat).
4. **Riesgo de tenancy:** La lógica de tenant/company scoping está en la ruta API y en el repositorio. No debe romperse.

---

## Próximo paso recomendado

Pasar a fase **Proposal** para definir el modelo de datos unificado, la estrategia de migración y el plan de implementación.
