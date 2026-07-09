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

### 2. Domain imports from Pi package

**File:** `packages/domain/src/drenyra/types.ts`
**Import:** `@drenyra/pi`

Domain references Pi subagent types for the Drenyra orchestrator.
Fixing requires extracting shared types to domain or a neutral package.

**Status:** Documented, not fixed.

## Resolved

- ~~Domain model-registration was importing `@drenyra/ai` types~~
  Kept as-is. Inlining loses AI-specific fields. ADR needed.
