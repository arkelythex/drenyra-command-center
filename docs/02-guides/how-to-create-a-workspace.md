# How to Create a Financial Workspace

**Last updated:** 2026-07-29
**Prerequisites:** Running Drenyra instance, authenticated user with workspace:write permission
**FEOS Planes:** [Workspace](../03-workspace-plane/README.md) · [Experience](../02-experience-plane/README.md)

---

A Financial Workspace is Drenyra's unit of work. It scopes every operation to an explicit **company**, **period**, and **objective**. A workspace is not a folder — it is a bounded context where agents propose, validators check, professionals review, and evidence accumulates.

This guide walks you through creating a workspace from the Web UI and from the API.

---

## What you need

- A company registered in Drenyra (with RUC for Peru)
- An open accounting period
- A clear objective (e.g., "Monthly close — June 2026", "SIRE reconciliation — Q2 2026")

---

## Via the Web UI

1. Open the Drenyra Workbench at `http://localhost:5174`.
2. In the **Portfolio Explorer** (left pane), select the target company.
3. Click **New Workspace** in the toolbar or press `Cmd+N` / `Ctrl+N`.
4. Fill in the workspace form:

   | Field            | Description                         | Example                                           |
   | ---------------- | ----------------------------------- | ------------------------------------------------- |
   | **Name**         | Short, descriptive name             | "Cierre Junio 2026 — Facturacion Total S.A.C."    |
   | **Objective**    | What this workspace is for          | Monthly close with SIRE reconciliation            |
   | **Period**       | The accounting period               | 2026-06                                           |
   | **Participants** | Who will work on or review this     | Optional: leave empty to inherit role assignments |
   | **Template**     | Optional: start from a saved layout | "Monthly Close" or "SIRE Review"                  |

5. Click **Create**. Drenyra validates:
   - The period is within an allowed range (not locked, not in the future beyond policy)
   - The company is active and accessible
   - You have `workspace:create` permission for that company and period
6. The workspace opens. You will see:
   - An **Operational Canvas** with default panes for the objective
   - An **Inspector** (right rail) showing workspace metadata and evidence
   - An empty **Change Set** ready for work

**Verification:** The workspace appears in the Portfolio Explorer under the target company, with status `ready`.

---

## Via the API

```typescript
import { createWorkspace } from '@drenyra/api/workspaces'

const workspace = await createWorkspace({
  companyId: 'cmp_01j2x...',
  period: '2026-06',
  name: 'Cierre Junio 2026 — Facturacion Total S.A.C.',
  objective: 'monthly-close',
  template: 'monthly-close',
})

// workspace.id → 'ws_01j3y...'
// workspace.status → 'ready'
```

**Response fields:**

| Field          | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| `id`           | Canonical workspace ID (`ws_` prefix)                                      |
| `status`       | One of: `ready`, `active`, `reviewing`, `blocked`, `completed`, `archived` |
| `scope`        | `{ companyId, period, objective }` — frozen at creation                    |
| `changeSets`   | Empty array — ready for work                                               |
| `evidenceRoot` | Initial evidence root hash for the workspace                               |

---

## What happens next

Once created, the workspace is ready for work. Agents, validators, and professionals operate within its scope. Every action, proposal, and receipt is bound to this workspace — you can always trace back from a receipt to the workspace that produced it.

### Do

- Choose a name that makes the scope obvious at a glance.
- Select a template when one matches your objective — it saves layout time.
- Close workspaces when the objective is complete (`status: completed`).

### Don't

- Don't reuse a workspace for a different period or objective — create a new one.
- Don't create workspaces outside an allowed period range (the API rejects it).
- Don't assign participants who lack the required role for the objective.

---

## Troubleshooting

| Symptom                | Likely cause                                                   | Fix                                               |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| "Company not found"    | Company ID is wrong or company is inactive                     | Verify the company ID and status                  |
| "Period not available" | Period is locked, closed, or out of range                      | Open a new period via the Close workflow          |
| "Permission denied"    | Missing `workspace:create` capability for that scope           | Check the user's role and company assignment      |
| Template not appearing | Template exists but is scoped to a different company or period | Use a more general template or create without one |

---

## Next steps

- [Review a Change Set](./how-to-review-a-change-set.md) — understand what happens inside a workspace
- [Interpret an Execution Receipt](./how-to-interpret-a-receipt.md) — read the evidence trail for any workspace action
