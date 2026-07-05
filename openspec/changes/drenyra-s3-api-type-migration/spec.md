# S3: API Type Inline → Package Migration — Spec

## Scope

### In Scope

1. **Auditar** `apps/api/src/types/*.ts` vs packages para detectar divergencias
2. **Arreglar divergencias encontradas** (ReconciliationStatus, otros)
3. **Remover re-exports `@deprecated`** y actualizar consumers a importar directo de packages
4. **Dejar DTOs de API** (CreateAccountDTO, BankingSummary, etc.) donde están — son request/response shapes, no dominio

### Out of Scope

- NO mover SIRE types a domain ahora (son 442 líneas, requieren análisis separado)
- NO crear `packages/application` types para DTOs
- NO tocar `features/shared/` governance/api-response
- NO tocar Chat types ni Dashboard types

## Acceptance Criteria

1. **Divergencias detectadas**: reporte de cada archivo vs su contraparte en packages
2. **Divergencias corregidas**: tipos alineados entre API types y domain
3. **Re-exports eliminados**: consumers de banking.types y transaction.types importan directo de `@drenyra/domain`
4. **Tests pasan**: `bun run typecheck` y `bun test` en apps/api pasan
5. **Sin breaking changes**: Eden Treaty contracts intactos

## Files to Touch

- `apps/api/src/types/banking.types.ts`
- `apps/api/src/types/transaction.types.ts`
- ~30-40 consumer files que importan de estos types
