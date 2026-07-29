# Tutorial: Your First Financial Workspace

**Last updated:** 2026-07-29
**Audience:** New users — developers, accountants, fiscal operators
**Prerequisites:** Drenyra running locally (see [Getting Started](../10-development/getting-started.md)), a registered company with RUC
**Time:** 15 minutes

---

Welcome to Drenyra. In this tutorial, you will create your first Financial Workspace, explore its structure, and understand how it organizes financial work.

By the end, you will have a working workspace for "Monthly Close — June 2026" for a Peruvian company.

---

## Step 1: Open Drenyra

Open your browser to `http://localhost:5174`. You should see the Drenyra Workbench.

```
┌─────────────────────────────────────────────────────────────┐
│  Portfolio Explorer  │  Operational Canvas    │  Inspector   │
│                      │                       │              │
│  📁 Mi Estudio       │   (empty — select     │   (empty)    │
│    └─ 🏢 Fact. Total │    or create a         │              │
│                      │    workspace)          │              │
│                      │                       │              │
└─────────────────────────────────────────────────────────────┘
```

If you don't see the Workbench, verify Drenyra is running:

```bash
bun run dev:check
```

---

## Step 2: Find Your Company

In the **Portfolio Explorer** (left pane), navigate to your company:

1. Expand your organization (e.g., "Mi Estudio Contable")
2. Click on a company (e.g., "Facturación Total S.A.C.")
3. The Inspector (right pane) shows company details: RUC, tax regime, status

Take a moment to read the company status. If the RUC is marked as "no habido," you will need to regularize it with SUNAT before operating.

---

## Step 3: Create a Workspace

With the company selected, create a workspace:

1. Click the **+ New Workspace** button in the toolbar, or press `⌘N` / `Ctrl+N`
2. Fill in the form:

| Field | Value | Why |
|---|---|---|
| **Name** | "Cierre Junio 2026 — Facturación Total S.A.C." | Descriptive: what + when + who |
| **Objective** | `monthly-close` | Drenyra uses this to configure default panes |
| **Period** | `2026-06` | The accounting period |
| **Template** | `Monthly Close` | Pre-configured layout for close workflows |

1. Click **Create**

**Expected result:** A new workspace opens. The Operational Canvas shows three panes:

- **Ledger Summary** — account balances for the period
- **Reconciliation Status** — bank, customer, supplier
- **Open Items** — pending tasks and exceptions

The Inspector shows workspace metadata: scope, status (`ready`), and evidence root.

---

## Step 4: Explore the Workspace

Let's understand what you just created.

**Portfolio Explorer:** The workspace appears under the company with a calendar icon. Click it to see:

- Status: `ready`
- Period: 2026-06
- Objective: monthly-close
- Created: just now

**Operational Canvas:** The main area shows your workspace content. Each pane can be resized, closed, or split.

**Inspector:** The right rail shows context for whatever you select. Click the workspace name — you see its metadata. Click a pane — you see its configuration. Click an evidence item — you see its hash and provenance.

---

## Step 5: Understand the Scope

A workspace scopes every operation. Try this:

1. Open the **Command Palette** with `⌘K` / `Ctrl+K`
2. Type "create change set"
3. The resulting action is automatically scoped to this workspace's company and period

You cannot accidentally create a Change Set for a different company or period from within this workspace. The scope is enforced at every level.

---

## What You've Learned

- A workspace is a bounded context: company + period + objective
- The Workbench has three zones: Portfolio Explorer, Operational Canvas, Inspector
- Every action inside a workspace is automatically scoped
- Templates configure the workspace for specific objectives (close, reconciliation, review)

---

## Next Steps

- [Tutorial: Review a Change Set](./your-first-review.md) — learn how financial changes are reviewed and approved
- Read the [Workspace Plane](../03-workspace-plane/README.md) — deeper understanding of the model
- [How to Create a Workspace (Reference)](../02-guides/how-to-create-a-workspace.md) — API reference
