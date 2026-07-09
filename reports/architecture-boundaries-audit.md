# Clean Architecture Boundaries Audit

**Date:** 2026-07-09

## Expected Dependency Graph

```
apps/web ──→ ui ──→ shared ──→ domain
apps/api ──→ application ──→ domain
apps/web ──→ application
apps/api ──→ persistence ──→ infrastructure
```

## Actual Dependencies

| Package | Depends on | Clean? |
|---------|-----------|--------|
| domain | (none runtime) | ✅ PERFECT |
| shared | domain | ✅ |
| application | domain, shared | ✅ |
| persistence | domain, infrastructure | ✅ (infra layer) |
| infrastructure | domain, shared | ✅ |
| ai | application, infrastructure, persistence, shared | ⚠️ Fat module |
| ui | domain, shared | ✅ |
| memory | domain, ai, shared | ⚠️ Fat module |

## Issues

1. **AI package** imports from application, infrastructure, persistence — it's a fat layer that blends ports and adapters
2. **Memory package** imports from domain, ai, shared — similar layering issue
3. Domain has 2 type imports from non-domain packages (documented in ADR)

## Recommendations

- Break AI package into: `ai-core` (domain types), `ai-gateway` (infrastructure adapters)
- Break memory package similarly
- These are significant refactors beyond R2 scope
