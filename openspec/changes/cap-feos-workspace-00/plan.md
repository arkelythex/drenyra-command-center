# CAP-FEOS-WORKSPACE-00: Plan

## Review Workload Forecast

| PR  | Scope                  | Est. Lines | Risk Tier | Review Time | Chained |
| --- | ---------------------- | ---------- | --------- | ----------- | ------- |
| 1   | workspace-domain types | 350        | R1        | 8 min       | Base    |
| 2   | state authority model  | 400        | R2        | 12 min      | ← PR1   |
| 3   | event projections      | 600        | R2        | 18 min      | ← PR2   |
| 4   | attention rollups      | 500        | R1        | 10 min      | ← PR3   |
| 5   | layout shell           | 700        | R1        | 12 min      | ← PR4   |
| 6   | attach/detach/resume   | 550        | R2        | 16 min      | ← PR5   |
| 7   | unified command bus    | 800        | R2        | 22 min      | ← PR6   |
| 8   | waits & notifications  | 400        | R1        | 10 min      | ← PR7   |
| 9   | concurrency + security | 600        | R2/R3     | 20 min      | ← PR8   |

**Total estimado**: ~5,000 líneas, ~9 PRs encadenados, ~128 min review total.

**Estrategia**: stacked-to-main. Cada PR mergea a main secuencialmente.

## PR1 — workspace-domain

### T-001: Scaffold workspace-domain package

- Crear `packages/workspace-domain/package.json` con `@drenyra/workspace-domain`
- `tsconfig.json` con `strict: true`, `exactOptionalPropertyTypes: true`
- `src/index.ts` con barrel exports
- `src/types/errors.ts` con `WorkspaceError` discriminated union, `WorkspaceNotFoundError`, `WorkspaceValidationError`

### T-002: WorkspaceId and WorkspaceObjective value objects

- `WorkspaceId` — branded string type
- `WorkspaceObjective` — union literal de tipos conocidos + `custom`
- Tests: creación, validación, display name

### T-003: FinancialWorkspace aggregate

- `FinancialWorkspace` interface con `workspaceId`, `organizationId`, `companyIds`, `fiscalPeriodIds`, `objective`, `layoutId`, `createdAt`, `updatedAt`
- Factory function `createWorkspace()` con validación (mínimo 1 company)
- Tests: creación, update companies, change objective

### T-004: View types

- `WorkspaceViewId` — branded string
- `ViewKind` — union literal
- `LayoutPlacement` — grid position
- `WorkspaceView` interface
- Tests: creación, move view (preserva identity)

### T-005: ExecutionReference and OperationalState types

- `ExecutionReference` interface
- `ExecutionId` — branded string
- `OperationalState` con `lifecycle`, `attention`, `risk`, `freshness`
- Value objects para cada dimensión
- Tests: cada dimensión, UNKNOWN no se rollupa como completed

### T-006: AttentionRollup type

- `AttentionRollup` interface con `lifecycle`, `counts`, `highestRisk`, `nearestDeadline`, `estimatedExposure`, `affectedCompanies`, `topReasons`
- `RollupReason` interface
- Tests: rollup creation, aggregation

### T-007: Property-based tests

- `@fast-check/vitest` tests para invariantes de workspace creation
- Propiedades de inmutabilidad de IDs

## PR2-PR9

Definidos en artifacts posteriores del SDD — cada PR expandirá su propio plan de tuning cuando se active.

## Compliance Gates

| Gate                            | Cuándo     | Qué verifica                   |
| ------------------------------- | ---------- | ------------------------------ |
| `typecheck`                     | Post-apply | Todos los paquetes compilan    |
| `test --workspace-domain`       | Post-apply | Todos los tests pasan          |
| `test:property`                 | T-007      | Property-based tests           |
| `review-readability`            | Pre-commit | Nombres, estructura, claridad  |
| `review-reliability`            | Pre-PR     | Estados, comportamiento, tests |
| `architecture:check-boundaries` | Pre-merge  | No violaciones de dependencia  |
