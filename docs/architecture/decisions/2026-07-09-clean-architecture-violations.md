# Clean Architecture Violations — Technical Debt Registry

**Date:** 2026-07-09

## Violations

### 1. Domain imports from AI package

**File:** `packages/domain/src/repositories/model-registration.repository.ts`
**Import:** `@drenyra/ai/providers/model-router-types`

The repository interface in domain imports 4 types from the AI package.
Fixing requires either:

- (a) Moving the types to domain (loses AI-specific fields)
- (b) Creating a shared types package (significant refactor)
- (c) Splitting the interface into a simpler domain version

**Status:** Documented, not fixed. Needs architecture decision.

### Options

1. **Keep as-is** (recommended): Minor type-level import. Domain still has 0 runtime dependencies in package.json. No runtime coupling.
2. **Extract types to domain**: Move `ModelRegistration`, `CapabilityRoutingRule`, `RoutingResult` from AI to domain. Loses AI-specific fields like `providerName`, `modelName`, `costPer1KInput`.
3. **Simplify domain interface**: Define minimal versions in domain, AI maintains rich versions. Adapter layer maps between them. Most architecturally pure but significant effort.

**Recommendation**: Option 1. The 0-runtime-deps constraint is satisfied. This import is only type-level (deleted at compile time).

### 2. Domain imports from Pi package

**File:** `packages/domain/src/drenyra/types.ts`
**Import:** `@drenyra/pi`

Domain references Pi subagent types for the Drenyra orchestrator.
Fixing requires extracting shared types to domain or a neutral package.

**Status:** Documented, not fixed.

## Resolved

- ~~Domain model-registration was importing `@drenyra/ai` types~~
  Kept as-is. Inlining loses AI-specific fields. ADR needed.
