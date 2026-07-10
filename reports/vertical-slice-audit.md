# Vertical Slice Pattern Audit — API Features

**Date:** 2026-07-09

## Current State

| Pattern                        | Count | Notes                              |
| ------------------------------ | ----- | ---------------------------------- |
| Elysia routers                 | 363   | Group routes by feature            |
| Classes (services/controllers) | 210   | Different patterns, no consistency |
| CQRS commands/queries          | 14    | Partial adoption                   |
| Service files                  | 96    | Main business logic pattern        |
| Handler files                  | 19    | Newer pattern, gradually adopted   |

## Canonical Template

Recommended structure for ALL new features:

```
apps/api/src/features/<feature>/
  <feature>.route.ts      Thin Elysia router (wiring only)
  <feature>.handler.ts    Single-responsibility handler function
  <feature>.schema.ts     Zod/Elysia validation schemas
  <feature>.service.ts    Business logic (optional, if complex)
  <feature>.types.ts      Feature-specific types (optional)
  <feature>.test.ts       Tests
```

## Migration Strategy

Incremental: migrate features when they are modified for other reasons.
Do NOT do a blanket rewrite.

## Priority Candidates

Features with the most inconsistent patterns:

1. Banking (services + repositories + handlers)
2. AI Swarm (orchestrator + agents + tools)
3. Fiscal agent (correction + report routes)
