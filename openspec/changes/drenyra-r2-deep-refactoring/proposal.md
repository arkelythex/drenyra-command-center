# R2: Deep Refactoring — Domain & Architecture Health

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 4
**Líneas estimadas:** ~1500
**Depende de:** P5, R1, S4 (Domain Boundary Audit)
**Tags:** refactoring, architecture, domain, clean-architecture, fiscal

---

## Problema

Mientras P5 cubre calidad de código superficial (Biome, TS strict) y R1 cubre redundancia, hay problemas arquitectónicos más profundos que requieren refactoring consciente:

- **Domain model erosion**: entidades de dominio que se contaminaron con lógica de infraestructura, serialización, o DTOs anémicos
- **Vertical slices inconsistentes**: features en `apps/api` implementadas con distintos patrones (algunas con CQRS, otras con handlers directos, otras con service objects)
- **Clean Architecture violaciones**: packages que importan de capas incorrectas (domain → infrastructure, application → persistence directo)
- **Domain logic leak**: reglas fiscales (IGV, detracciones, SIRE) que están parcialmente en domain y parcialmente en infrastructure/application
- **Error handling inconsistente**: algunos endpoints devuelven errores tipados, otros devuelven 500 genéricos
- **Money value object inconsistente**: algunas partes usan `Money`, otras usan `number` directamente (riesgo fiscal)

## Cambios Propuestos

### PR 1: Domain Model Remediation (400 líneas)

**Qué:** Sanear el modelo de dominio.

**Acciones:**

1. **Entity audit**: Revisar cada entidad en `packages/domain/src/entities/` y `packages/domain/src/fiscal/`
   - ¿Tiene propiedades de infraestructura? (IDs de DB, timestamps de creación, campos de serialización)
   - ¿Es anémica? (solo getters/setters sin comportamiento de dominio)
   - ¿Usa `any` o tipos incorrectos?
   - ¿Las reglas de negocio están dentro de la entidad o afuera en services?

2. **Value object hardening**:
   - `Money` debe ser el ÚNICO tipo para cantidades monetarias en todo el codebase
   - Identificar lugares que usan `number` para plata mediante `rg "number" packages/domain --type ts`
   - Migrar a Money value object

3. **Fiscal rule consolidation**:
   - Reglas de IGV deben estar en domain, no en application ni infrastructure
   - Validación RUC consolidada en un solo lugar
   - Cálculos de detracción/SPOT consolidados

### PR 2: Vertical Slice Alignment (400 líneas)

**Qué:** Unificar el patrón de implementación de features en api.

**Acciones:**

1. **Pattern audit**: Identificar qué patrón usa cada feature en `apps/api/src/features/`
   - `rg "new Elysia" apps/api/src/features/` → cuántos Elysia routers
   - `rg "class" apps/api/src/features/` → cuántos services/controllers con clases
   - `rg "createCommand|createQuery" apps/api/src/features/` → cuántos CQRS

2. **Vertical slice template**: Definir la estructura canónica de una feature:

   ```
   apps/api/src/features/<feature>/
   ├── <feature>.route.ts        # Elysia router (thin)
   ├── <feature>.handler.ts      # Handler function (single responsibility)
   ├── <feature>.schema.ts       # Zod/Elysia schemas
   ├── <feature>.service.ts      # Business logic (opcional, si la lógica es compleja)
   ├── <feature>.test.ts         # Tests
   └── <feature>.types.ts        # Feature-specific types (opcional)
   ```

3. **Migration**: Migrar features legacy al template

### PR 3: Clean Architecture Enforcement (400 líneas)

**Qué:** Asegurar que las dependencias entre packages respetan Clean Architecture.

**Expected dependency graph:**

```text
apps/web ──→ packages/ui ──→ packages/shared
     │                           │
     └──→ packages/application ──┤
              │                   │
              └──→ packages/domain
                       │
                       └── (framework-free, 0 runtime deps)
```

**Acciones:**

1. `bun run architecture:check-boundaries` — ver qué violaciones existen
2. Para cada violación:
   - Domain importando de infrastructure → mover lógica a domain o eliminar dependencia
   - Application importando persistence → mover a infrastructure port/adapter
   - Infrastructure importando de packages de UI → REFACTOR
3. Agregar `@drenyra/domain` como `0 runtime deps` (solo typescript como devDep)
4. Agregar `@drenyra/shared` como permitido en todas las capas (helpers inocuos)

### PR 4: Error Handling Unification (300 líneas)

**Qué:** Unificar el manejo de errores en toda la app.

**Acciones:**

1. Definir `AppError` jerarquía en `packages/domain`:

   ```typescript
   abstract class AppError extends Error {
     abstract readonly code: string // "FISCAL_IGV_CALCULATION_ERROR"
     abstract readonly statusCode: number // HTTP status code
     abstract readonly fiscalContext?: Record<string, unknown>
   }
   ```

2. Tipos concretos: `FiscalError`, `ValidationError`, `NotFoundError`, `AuthError`, `TenantError`
3. Crear error boundary en API (Elysia `onError` handler)
4. Crear error boundary en Web (React ErrorBoundary)
5. Migrar errores de a uno: cada `throw new Error("msg")` → `throw new FiscalError({...})`

## Criterios de Aceptación

1. `bun run architecture:check-boundaries` → 0 violations
2. `rg "number" packages/domain/src/fiscal/` — 0 `number` para montos monetarios
3. Todas las features en `apps/api/src/features/` siguen el mismo template
4. `AppError` jerarquía implementada con al menos 5 tipos concretos
5. API `onError` handler captura y tipa todos los `AppError`
6. `bun run test` pasa sin regresiones
7. `bun run typecheck` pasa
