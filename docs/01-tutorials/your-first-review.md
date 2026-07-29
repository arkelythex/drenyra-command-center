# Tutorial: Your First Change Set Review

**Last updated:** 2026-07-29
**Audience:** New users — accountants, reviewers, fiscal operators
**Prerequisites:** [Your First Workspace](./your-first-workspace.md), a workspace with pending changes
**Time:** 20 minutes

---

In this tutorial, you will review a Change Set — Drenyra's equivalent of a code review for financial changes. You will inspect a proposed journal entry, verify evidence, and make a decision.

---

## Step 1: Open a Change Set Ready for Review

In the Workbench, navigate to a workspace that has a Change Set with status `ready-for-review`:

1. In **Portfolio Explorer**, select the workspace
2. In the bottom pane, find the **Change Set List**
3. Click a Change Set with status `ready-for-review` (highlighted in orange)

The Inspector updates to show:

```
┌──────────────────────────────────────────┐
│  Change Set: CS-2026-06-042              │
│  Status:     ready-for-review             │
│  Author:     Agent: Bank Reconciliation   │
│  Risk:       R2                           │
│  Materiality: S/ 1,250.00                │
│  Created:    2026-07-28 14:25:00          │
│  Frozen:     2026-07-28 14:25:01          │
│  Candidate:  4a8f3b2c...                 │
└──────────────────────────────────────────┘
```

Notice the **candidate hash**. This is the frozen identity of this Change Set. Any modification would change this hash.

---

## Step 2: Inspect the Financial Diff

Click the **Diff** tab in the Inspector. You see a structured financial difference:

| Account | Name | Before | After | Delta |
|---|---|---|---|---|
| 4211 | Bco. Scotiabank CTE | S/ 125,000.00 | S/ 123,750.00 | -S/ 1,250.00 |
| 5911 | Gastos bancarios | S/ 8,500.00 | S/ 9,750.00 | +S/ 1,250.00 |

**Check the bottom line:**

- Total debits: S/ 1,250.00
- Total credits: S/ 1,250.00
- ✅ Balanced

This is a bank service charge correction. The reconciliation agent detected a fee that was not recorded in the ledger.

---

## Step 3: Verify the Evidence

Click the **Evidence** tab. You see:

```
📎 Bank Statement June 2026
   Hash: 4a8f...  ✅
   Source: Banco Scotiabank
   Date: 2026-06-30
   Lines: 154

📎 Bank Reconciliation Report
   Hash: b3c1...  ✅
   Generated: 2026-07-28
   Differences found: 1
```

Click the bank statement hash. The Inspector shows the evidence trail:

```
Source document
  → Ingested: 2026-07-28 14:00:00
  → Normalized: 2026-07-28 14:05:00
  → Validated: 2026-07-28 14:10:00
  → Referenced in Change Set: 2026-07-28 14:25:00
```

Everything checks out. The evidence is complete, hashes are valid, and the trail is intact.

---

## Step 4: Check Policy and Risk

Click the **Policy** tab:

| Setting | Value |
|---|---|
| Risk level | R2 |
| Policy version | v2026.1 |
| Materiality | S/ 1,250.00 |
| Required approver | accounting-reviewer |
| Your role | accounting-reviewer ✅ |

You have the required role. The materiality is under S/ 5,000, so no escalation is needed.

---

## Step 5: Approve the Change Set

You are satisfied with the change. To approve:

1. Click **Approve** in the toolbar
2. (Optional) Add a note: "Bank charge for June statement. Matches reconciled amount."
3. Click **Confirm**

The Change Set status changes to `approved`:

```
Status: approved ✅
Approved by: user_01j2y... (J. Pérez)
Approved at: 2026-07-28 14:35:00
Approved hash: 7d9e...  (your signature over the candidate)
```

---

## Step 6: Watch Execution

Within seconds (or minutes, depending on workflow), the Change Set moves to `executing`, then `executed`:

```
Status: executed ✅
Execution receipt: rct_01j5a...
```

The journal entry has been posted. A receipt is available for verification.

---

## What You've Learned

- A Change Set is a frozen, hashed proposal for financial changes
- The diff shows structured before/after — not just text
- Every change references evidence with verifiable hashes
- Approval is a signature over the exact candidate hash
- Execution produces an immutable receipt

---

## Next Steps

- [Tutorial: Interpret a Receipt](./interpret-a-receipt.md) — read the result of an execution
- Read the [How to Review a Change Set (Reference)](../02-guides/how-to-review-a-change-set.md) — more detail
- [Trust Plane](../05-trust-plane/README.md) — understand the full approval model
