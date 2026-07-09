# Proposal: Invoice Update Logic Unification

**Creado:** 2026-07-07
**Cambio:** `drenyra-invoice-update-refactor`
**Plan:** S7 (nuevo)

---

## 1. Business Problem

La lógica de actualización de comprobantes en DRENYRA tiene tres implementaciones fragmentadas que violan el principio de **Single Source of Truth**:

- Dos entidades Invoice en paquetes distintos con fields y validaciones divergentes
- Dos comandos de update con lógica de cálculo IGV duplicada
- Riesgo de que una factura se actualice con montos diferentes según qué camino tome

Esto no es solo un problema de mantenibilidad — es un **riesgo fiscal**. Si el cálculo de IGV entre dos implementaciones difiere por redondeo, una factura enviada a SUNAT puede tener montos incorrectos, generando observaciones o multas.

## 2. Alcance

### Incluye

- **Dominio:** Invoice entity (billing/invoice + domain package) → entidad unificada y canónica
- **Aplicación:** Commands/Use Cases de update → lógica compartida y sin duplicación
- **API:** Ruta `PATCH /:id` → refactorizada para usar el nuevo pipeline unificado
- **Tests:** Todos los existentes deben pasar; se agregan tests para la lógica compartida

### No incluye

- UI/web frontend (`apps/web/src/features/invoices/`)
- SUNAT XML generation, digital signature, OSE submission, CDR processing
- Tablas o columnas de base de datos (schema inmutable)
- Comprobantes internos (no existen aún como entidad separada)
- Payment application logic
- Invoice creation or deletion (solo update)

## 3. Solución Propuesta

### 3.1 Nueva Entidad Invoice Unificada

Crear `packages/domain/src/entities/Invoice.ts` como entidad canónica **única**, eliminando:

- `packages/domain/src/entities/invoice/` (directorio viejo)
- `apps/api/src/features/billing/invoice/domain/invoice.entity.ts` (entity de API feature)

La nueva entidad debe:

- Conservar los campos genéricos (`buyerTaxId`, `taxAmount`, `fiscalStatus`) + legacy compat
- Tener constructor privado + `fromPrimitives()` + `create()` factory
- Incluir métodos de lifecycle: `canBeModified()`, `isOverdue()`, `markAsSent()`, `markAsAccepted()`, etc.
- Ser frozen/immutable

### 3.2 Servicio de Cálculo Compartido

Extraer la lógica hoy duplicada a un servicio:

- `TaxCalculationService` — cálculo de IGV, subtotales, totales desde items
- Validación de input de update
- Reutilizable desde API feature command y desde application use case

### 3.3 Pipeline de Update Unificado

```
API Route (PATCH /:id)
  → loadScopedInvoice()
  → UpdateInvoiceUseCase (único, desde packages/application)
    → TaxCalculationService
    → Invoice entity (unificada)
    → InvoiceRepository (único, en API feature)
```

- Eliminar `apps/api/.../update-invoice.command.ts` (clase + standalone function)
- Migrar la ruta API a usar `UpdateInvoiceUseCase` de `packages/application`
- `packages/application` gana una dependencia al `InvoiceRepository`

### 3.4 Tests

- Migrar tests de entity de API feature a domain package
- Mantener tests de use case existentes y expandirlos
- Agregar tests unitarios para `TaxCalculationService`
- Agregar tests de integración para el pipeline completo

## 4. Entregables

| Artefacto                                                               | Descripción                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| `packages/domain/src/entities/Invoice.ts`                               | Entidad canónica unificada                     |
| `packages/domain/src/entities/invoice/`                                 | Eliminar (reemplazado)                         |
| Eliminar entity de API feature                                          | Reemplazado por domain entity                  |
| `packages/application/src/services/tax-calculation.service.ts`          | Cálculo IGV compartido                         |
| `packages/application/src/use-cases/invoice/update-invoice.use-case.ts` | Refactorizado para usar nuevo entity + service |
| Eliminar `update-invoice.command.ts`                                    | Reemplazado por use case                       |
| `apps/api/.../update.route.ts`                                          | Actualizado para usar use case                 |
| Tests                                                                   | Entity, service, use case, integración         |

## 5. Riesgos y Mitigaciones

| Riesgo                        | Probabilidad | Mitigación                                                  |
| ----------------------------- | ------------ | ----------------------------------------------------------- |
| Regresión en cálculos de IGV  | Media        | Tests de hermeticidad con valores de borde                  |
| Romper tenancy scoping        | Baja         | El RLS transaction está en el repositorio, no en el comando |
| Dependencias circulares       | Baja         | La entidad domain no depende de infraestructura             |
| Migración incompleta de tests | Media        | CI debe pasar con coverage >= actual                        |

## 6. Estimación

- **Líneas estimadas:** ~350
- **PRs:** 1 (mecánico, dominios conocidos)
- **Review workload:** medio (entidad + service + refactor de comandos)

## 7. Próximo paso recomendado

Pasar a fase **Spec** para definir contratos detallados (interfaces, DTOs, validaciones, signature de métodos).
