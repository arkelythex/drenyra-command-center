# R1: Eliminate Redundancy — Cross-Package Unification

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 4
**Líneas estimadas:** ~1200
**Depende de:** P5 (Code Quality), P6 (Package Health)
**Tags:** redundancy, cleanup, consolidation, packages

---

## Problema

Drenyra creció rápido y la redundancia se acumuló. Con 15+ packages y 4 apps:

- **Tipos duplicados**: interfaces/mismas entidades definidas en múltiples packages (ej: `FiscalPeriod`, `DocumentSummary`, `DetraccionData` aparecen en domain, application, infrastructure, y api)
- **Utility functions duplicadas**: helpers de fecha, número, moneda, RUC esparcidos en `shared`, `application`, `infrastructure`, `api`
- **Feature overlaps**: funcionalidad parecida implementada distinto en cada capa (ej: validación de RUC existe en domain, infrastructure, y api con distintas implementaciones)
- **Schema overlaps**: tablas/columnas definidas en persistence y re-definidas en infrastructure
- **DTOs vs Entities**: entidades de dominio convertidas a DTOs que son idénticas pero con distinto nombre
- **Test builders duplicados**: factories para entidades fiscales en test-utils, application, api tests

## Diagnóstico

### Categorías de redundancia

| Categoría          | Dónde buscar                                                  | Impacto                 |
| ------------------ | ------------------------------------------------------------- | ----------------------- |
| Tipos duplicados   | domain, application, infrastructure, api                      | Alto — confusión, drift |
| Utility helpers    | shared, application, infrastructure, api                      | Medio — mantenimiento   |
| Validaciones       | domain, infrastructure, api (3 implementaciones de RUC check) | Alto — bugs fiscales    |
| Feature overlap    | packages con responsabilidades que se pisan                   | Alto — deuda técnica    |
| Builders/ Fixtures | test-utils, application, api, domain                          | Medio — tests frágiles  |

## Cambios Propuestos

### PR 1: Type Unification Audit (250 líneas)

**Qué:** Mapear y unificar tipos duplicados.

**Acciones:**

1. `rg "interface|type" packages/ --type ts | sort` → listar todos los tipos
2. Identificar duplicados por nombre/signature
3. Para cada duplicado:
   - Si es del dominio → queda en `packages/domain`, todos importan de ahí
   - Si es de aplicación → queda en `packages/application`
   - Si es infraestructura → local a infrastructure (o shared si lo usan 2+)
4. Eliminar duplicados, reemplazar imports

**Herramientas:**

- `ts-morph` o script custom para migración de imports
- AST-based refactoring con ast-grep patterns

**Ejemplo de duplicados probables:**

```typescript
// packages/domain/src/fiscal/types.ts
interface FiscalPeriod {
  year: number
  month: number
  startDate: Date
  endDate: Date
}

// packages/application/src/dto/fiscal.ts (IDEM!)
interface FiscalPeriodDto {
  year: number
  month: number
  startDate: string
  endDate: string
}
```

### PR 2: Utility Consolidation (300 líneas)

**Qué:** Unificar helpers duplicados en `packages/shared`.

**Acciones:**

1. `rg "export function" packages/ apps/ --type ts` → listar todas las funciones exportadas
2. Clusterizar por función (formato fecha, formato moneda, validación RUC, etc.)
3. Mover a `packages/shared/src/<category>/` con barrel exports
4. Reemplazar imports en todos los consumidores
5. Verificar que ningún import legacy queda (`rg "from '../../util"`)

**Prioridad:**

- Validación RUC (crítico fiscal)
- Formato de moneda (usado en UI, API, CLI)
- Parseo de fechas (usado en 4+ packages)
- Cálculos de IGV (usado en domain, application, infrastructure)

### PR 3: Test Builders Unification (250 líneas)

**Qué:** Centralizar builders/factories de entidades fiscales en test-utils.

**Acciones:**

1. Identificar builders en cada package (`rg "build|create|make" --type ts -g '*.test.ts'`)
2. Mover builders compartidos a `packages/test-utils/src/builders/`
3. Los builders específicos de un package quedan locales (con `// @internal` marker)
4. Documentar en `packages/test-utils/README.md`

**Builders prioritarios:**

- `buildInvoice()`, `buildBill()`, `buildDetraccion()`, `buildRetencion()`
- `buildCompany()`, `buildRuc()`, `buildFiscalPeriod()`
- `buildApprovalRequest()`, `buildApprovalDecision()`

### PR 4: Feature Overlap Resolution (400 líneas)

**Qué:** Identificar y resolver overlaps entre packages con responsabilidades que se pisan.

**Áreas sospechosas:**

| Package A                    | Package B                       | Overlap probable                      |
| ---------------------------- | ------------------------------- | ------------------------------------- |
| `fiscal-query-engine`        | `packages/ai`                   | Ambos hacen queries fiscales          |
| `fiscal-compliance-pipeline` | `packages/infrastructure`       | Pipeline de compliance en infra       |
| `fiscal-approval`            | `packages/application`          | Approval como use case en application |
| `fiscal-sdd`                 | `packages/drenyra-orchestrator` | Ambos manejan SDD/planning            |
| `skill-sire-filing`          | `packages/ai`                   | AI skills overlap con agentes         |

**Estrategia:**

Para cada overlap: auditar responsabilidades, fusionar o eliminar, documentar la decisión.

## Criterios de Aceptación

1. `rg "interface|type" packages/ --type ts` sin duplicados por nombre
2. `packages/shared` es la única fuente de helpers compartidos
3. `packages/test-utils/src/builders/` centralizado con barrel exports
4. Feature overlaps documentados con decisión (fusionar/eliminar) en `docs/architecture/decisions/`
5. `bun run typecheck` pasa sin errores después de cada PR
6. `bun run test` pasa sin regresiones
