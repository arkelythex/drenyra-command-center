# RUC Scope Skill

> **Trigger**: ruc, tenant, scope, organization, company, isolation, multi-tenant
> **Scope**: `project`

## Purpose

Guide AI agents to maintain proper RUC/tenant isolation across all Drenyra operations. This is a non-negotiable fiscal safety requirement.

## Core Rules

1. **Every query must scope by RUC.** No global-list operations without explicit fiscal scope.
2. **Every mutation must validate RUC ownership.** Verify the requesting user's session context includes the target RUC.
3. **Every API route must check fiscal scope.** Before processing, assert the user has access to the requested RUC/company.
4. **Every background job must scope by RUC.** Cron jobs, queues, and batch processors must include fiscal filter.
5. **Every export/report must include the RUC.** Fiscal documents require RUC by SUNAT regulation.

## Implementation Patterns

### API Route Scoping

```typescript
// GOOD — checks fiscal scope
app.get('/api/fiscal/invoices', async (ctx) => {
  const ruc = ctx.get('X-RUC')
  assertRucAccess(ctx.session, ruc)
  return queryInvoicesByRuc(ruc, ctx.query)
})

// BAD — no fiscal scope
app.get('/api/fiscal/invoices', async (ctx) => {
  return queryAllInvoices(ctx.query) // ❌ No RUC scope
})
```

### Repository Scoping

```typescript
// GOOD
const invoices = await db.invoices.findMany({
  where: { organizationId, companyId, ruc },
})

// BAD
const invoices = await db.invoices.findMany() // ❌ No tenant filter
```

## Testing Requirements

- Every fiscal test must include RUC scope assertions
- Integration tests must use unique RUCs per test
- No test should share fiscal data across RUCs
