# Tasks: Invoice Update Logic Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-update-refactor`
**Fase:** Tasks

---

## Task Overview

| #   | Tarea                                  | Fase              | Archivos | Deps | Est. líneas |
| --- | -------------------------------------- | ----------------- | -------- | ---- | ----------- |
| 1   | Unificar entidad Invoice en domain     | Domain Foundation | 5        | —    | 80          |
| 2   | Actualizar exports de domain package   | Domain Foundation | 2        | 1    | 10          |
| 3   | Migrar tests de entidad invoice        | Domain Foundation | 2        | 1    | 40          |
| 4   | Crear TaxCalculationService            | Tax Service       | 2        | 1    | 60          |
| 5   | Tests de TaxCalculationService         | Tax Service       | 1        | 4    | 50          |
| 6   | Refactorizar UpdateInvoiceUseCase      | Use Case          | 2        | 4    | 50          |
| 7   | Actualizar DTO y validación de update  | Use Case          | 2        | 6    | 20          |
| 8   | Migrar ruta API a use case             | Route Migration   | 2        | 6    | 30          |
| 9   | Eliminar archivos obsoletos            | Cleanup           | 1        | 8    | 5           |
| 10  | Verificación final (typecheck + tests) | Cleanup           | —        | 9    | —           |

**Total estimado:** ~345 líneas
**PRs recomendados:** 1 (refactor mecánico, dominios conocidos, <400 líneas)

---

## Task 1: Unificar entidad Invoice en domain

**Fase:** Domain Foundation
**Dependencias:** —
**Archivos:**

- `packages/domain/src/entities/Invoice.ts` — modificar
- `packages/domain/src/entities/invoice/invoice.entity.ts` — eliminar
- `packages/domain/src/entities/invoice/types.ts` — eliminar
- `packages/domain/src/entities/invoice/validators.ts` — eliminar
- `apps/api/src/features/billing/invoice/domain/invoice.entity.ts` — eliminar

**Qué hacer:**

1. En `packages/domain/src/entities/Invoice.ts`:
   - Agregar `companyId: string` a `InvoiceProps`
   - Agregar `sunatTicket?: string` a `InvoiceProps`
   - Agregar `sunatCdrUrl?: string` a `InvoiceProps`
   - Agregar `taxType?: "GRAVADO" | "EXONERADO" | "INAFECTO"` a `InvoiceItem`
   - Agregar getter `companyId` a la clase
   - Agregar getter `sunatTicket` a la clase
   - Agregar getter `sunatCdrUrl` a la clase
   - Asegurar que `fromPrimitives()` mapee los nuevos campos
   - Asegurar que `toJSON()` serialice los nuevos campos
   - Mantener frozen immutability
2. Eliminar directorio `packages/domain/src/entities/invoice/` completo
3. Eliminar `apps/api/src/features/billing/invoice/domain/invoice.entity.ts`
4. También eliminar `apps/api/src/features/billing/invoice/domain/invoice.repository.interface.ts` (mover interface a domain si es necesario)

**Criterio de aceptación:**

- `Invoice.create()` acepta `companyId`
- `fromPrimitives()` reconstruye con `companyId`
- `invoice.companyId` devuelve el valor
- Todos los métodos legacy (`markAsSent`, `canBeModified`, etc.) funcionan sin cambios
- typecheck pasa en `packages/domain`

---

## Task 2: Actualizar exports de domain package

**Fase:** Domain Foundation
**Dependencias:** Task 1
**Archivos:**

- `packages/domain/src/entities/index.ts` — modificar
- `packages/domain/src/index.ts` — modificar

**Qué hacer:**

1. En `packages/domain/src/entities/index.ts`:
   - Exportar desde `./Invoice` (ya debería existir)
   - Remover export de `./invoice/invoice.entity` (ya no existe)
2. En `packages/domain/src/index.ts`:
   - Verificar que `Invoice`, `InvoiceProps`, `InvoiceItem`, `InvoiceStatus`, `FiscalStatus` se exportan correctamente

**Criterio de aceptación:**

- `import { Invoice } from "@drenyra/domain"` funciona
- `import { InvoiceStatus } from "@drenyra/domain"` funciona
- No hay exports rotos

---

## Task 3: Migrar tests de entidad invoice

**Fase:** Domain Foundation
**Dependencias:** Task 1
**Archivos:**

- `packages/domain/src/entities/__tests__/Invoice.test.ts` — modificar
- `apps/api/src/features/billing/invoice/__tests__/unit/invoice.test.ts` — eliminar

**Qué hacer:**

1. En `packages/domain/src/entities/__tests__/Invoice.test.ts`:
   - Agregar tests para campo `companyId`
   - Agregar tests para `sunatTicket` / `sunatCdrUrl`
   - Agregar test para `InvoiceItem.taxType`
   - Migrar asserts relevantes de `apps/api/.../invoice.test.ts`:
     - `Invoice.create()` en DRAFT status
     - `canBeModified()` (before: `canEdit()`)
     - `isOverdue()`
     - `markAsSent()`
     - `getFullNumber()`
2. Eliminar `apps/api/src/features/billing/invoice/__tests__/unit/invoice.test.ts`

**Criterio de aceptación:**

- Todos los tests de entity pasan en `packages/domain`
- Cobertura de tests migrada (ningún assert perdido)

---

## Task 4: Crear TaxCalculationService

**Fase:** Tax Service
**Dependencias:** Task 1
**Archivos:**

- `packages/application/src/services/tax-calculation.service.ts` — crear

**Qué hacer:**

1. Crear interfaz `TaxCalculationService`:

   ```typescript
   export interface TaxCalculationService {
     calculateItems(
       input: CreateInvoiceItemInput[],
       currency: Currency,
       issueDate: Date
     ): Promise<InvoiceItemResult[]>
     aggregateTotals(
       items: InvoiceItemResult[],
       currency: Currency
     ): InvoiceTotals
   }
   ```

2. Crear implementación `TaxCalculationServiceImpl`:
   - Mover lógica de `calculateUpdateInvoiceItems()` desde `update-invoice.command.ts`
   - Inyectar `TaxRateProviderService` para `getVatRate()`
   - Soportar GRAVADO (subtotal / (1+vatRate)), EXONERADO (sin IGV), INAFECTO (sin IGV)
   - Usar `Money` value object para cálculos
   - Generar UUID para items sin `id`
3. Exportar desde `packages/application/src/services/index.ts`

**Criterio de aceptación:**

- `calculateItems()` con input GRAVADO produce subtotalWithoutTax + igvAmount correctos
- `calculateItems()` con input EXONERADO produce igvRate=0, igvAmount=0
- `aggregateTotals()` suma correctamente baseAmount, igvAmount, totalAmount
- typecheck pasa

---

## Task 5: Tests de TaxCalculationService

**Fase:** Tax Service
**Dependencias:** Task 4
**Archivos:**

- `packages/application/src/services/__tests__/tax-calculation.service.test.ts` — crear

**Qué hacer:**
Agregar tests:

```typescript
describe("TaxCalculationService", () => {
  describe("calculateItems()", () => {
    it("should calculate IGV for GRAVADO items"
    it("should return zero IGV for EXONERADO items"
    it("should return zero IGV for INAFECTO items"
    it("should use vatRate from provider"
    it("should assign unique IDs when none provided"
    it("should preserve existing item IDs"
    it("should handle multiple items with mixed taxTypes"
  });
  describe("aggregateTotals()", () => {
    it("should sum base amounts"
    it("should sum IGV amounts"
    it("should sum total amounts"
    it("should return Money.zero for empty items"
  });
});
```

**Criterio de aceptación:**

- 11+ tests pasan
- Casos de borde cubiertos (mixed taxTypes, zero items)

---

## Task 6: Refactorizar UpdateInvoiceUseCase

**Fase:** Use Case
**Dependencias:** Task 4, Task 5
**Archivos:**

- `packages/application/src/use-cases/invoice/update-invoice.use-case.ts` — modificar
- `apps/api/src/features/billing/invoice/application/commands/update-invoice.command.ts` — eliminar

**Qué hacer:**

1. En `UpdateInvoiceUseCase`:
   - Constructor recibe `InvoiceRepository` + `TaxCalculationService`
   - En `execute()`:
     - Validar input con `UpdateInvoiceSchema`
     - `invoiceRepository.findById()`
     - Verificar `canBeModified()`
     - Si hay items: `taxCalculationService.calculateItems()` + `aggregateTotals()`
     - Construir invoice actualizada con `Invoice.fromPrimitives()` o factory
     - Si `organizationId`: `updateForOrganization()` sino `update()`
2. Eliminar `apps/api/src/features/billing/invoice/application/commands/update-invoice.command.ts`

**Criterio de aceptación:**

- Use case funciona sin la lógica inline de cálculo IGV
- NotFoundError se lanza cuando invoice no existe
- BusinessRuleError se lanza cuando invoice no es modificable
- Recálculo de totals cuando hay items nuevos
- Preserva campos no actualizados
- Tenant-aware update funciona con organizationId

---

## Task 7: Actualizar DTO y validación de update

**Fase:** Use Case
**Dependencias:** Task 6
**Archivos:**

- `packages/application/src/dtos/invoice/update-invoice.dto.ts` — modificar
- `packages/application/src/validators/invoice/invoice.validators.ts` — modificar

**Qué hacer:**

1. En `UpdateInvoiceItemDTO`:
   - Agregar `taxType?: "GRAVADO" | "EXONERADO" | "INAFECTO"`
   - Agregar `id?: string` (para reutilizar IDs de items existentes)
2. En `UpdateInvoiceSchema`:
   - Agregar validación de `taxType` como enum opcional
3. En `UpdateInvoiceItemSchema`:
   - Agregar `taxType: z.enum(["GRAVADO", "EXONERADO", "INAFECTO"]).optional()`

**Criterio de aceptación:**

- Schema acepta taxType opcional
- Schema rechaza taxType inválido
- typecheck pasa

---

## Task 8: Migrar ruta API a use case

**Fase:** Route Migration
**Dependencias:** Task 6, Task 7
**Archivos:**

- `apps/api/src/features/billing/invoice/api/routes/update.route.ts` — modificar
- `apps/api/src/features/billing/invoice/api/routes/update-status.route.ts` — modificar (si aplica)

**Qué hacer:**

1. En `update.route.ts`:
   - Reemplazar `import { updateInvoice } from "...commands/update-invoice.command"` por `import { UpdateInvoiceUseCase } from "@drenyra/application"`
   - En el handler, instanciar `UpdateInvoiceUseCase` con repository + TaxCalculationService
   - Llamar `useCase.execute(body)` en vez de `updateInvoice(body)`
   - Mantener mismo error handling y response shape
2. Si `update-status.route.ts` usa `update-invoice-status.command.ts`, evaluar si migrar o mantener.

**Criterio de aceptación:**

- `PATCH /:id` responde con mismo shape: `{ id, invoiceNumber, totalAmount, status }`
- Mismos códigos de error: 404, 400
- Tenancy intacto (companyScopeGuard + loadScopedInvoice)
- Tests de ruta pasan

---

## Task 9: Eliminar archivos obsoletos

**Fase:** Cleanup
**Dependencias:** Task 8
**Acción:** Verificar y eliminar (si no se eliminaron en tareas anteriores):

- `apps/api/src/types/invoice.types.ts`
- `apps/api/src/validators/invoice.schema.ts`
- `apps/api/src/features/billing/invoice/application/commands/update-invoice-status.command.ts`
- `apps/api/src/features/billing/invoice/domain/invoice.repository.interface.ts` (si no se migró a domain)

**Criterio de aceptación:**

- `rg "from.*update-invoice\.command"` no devuelve resultados
- `rg "from.*invoice\.entity.*api"` no devuelve resultados
- typecheck pasa globalmente

---

## Task 10: Verificación final

**Fase:** Cleanup
**Dependencias:** Task 9

**Qué hacer:**

1. `bun run typecheck` — sin errores
2. `bun run lint` — sin errores
3. `bun run test` — todos los tests pasan
4. Verificar manualmente:
   - Los tests de `packages/application/__tests__/update-invoice.use-case.test.ts` pasan
   - Los tests de `apps/api/.../invoice.test.ts` fueron migrados (si no se eliminaron asserts)
   - Los tests de `TaxCalculationService` pasan
5. Si hay tests de integración para la ruta, verificar que pasan

**Criterio de aceptación:**

- CI verde
- Coverage report sin regresión

---

## Review Workload Forecast

| Métrica          | Valor                                             |
| ---------------- | ------------------------------------------------- |
| Líneas estimadas | ~345                                              |
| Budget de review | 400 líneas (single PR)                            |
| Archivos tocados | ~19                                               |
| Estrategia PR    | Single PR — refactor mecánico, dominios conocidos |
| Riesgo de review | Bajo — el cambio es estructural pero bien acotado |

---

## Próximo paso

Pasar a fase **Apply** para implementar las tareas en orden.
