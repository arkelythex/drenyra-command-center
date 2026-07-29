# Tutorial: Interpret an Execution Receipt

**Last updated:** 2026-07-29
**Audience:** New users — accountants, auditors, fiscal operators
**Prerequisites:** [Your First Review](./your-first-review.md), an executed Change Set with a receipt
**Time:** 10 minutes

---

An Execution Receipt is Drenyya's immutable proof that a financial operation was properly authorized and executed. In this tutorial, you will read a receipt, verify its integrity, and trace it back to the original evidence.

---

## Step 1: Find a Receipt

After a Change Set is executed, you can find its receipt in several ways:

**From the Change Set:**

1. Open the Change Set (status: `executed`)
2. Click the receipt link in the Inspector: `rct_01j5a...`

**From the Workspace timeline:**

1. Open the workspace
2. Click the **Activity** tab
3. Find the executed operation and click its receipt link

**From the Evidence Graph:**

1. Open the Evidence Inspector
2. Navigate to any execution node
3. Click the linked receipt

---

## Step 2: Read the Receipt

The receipt opens in the Inspector:

```
┌──────────────────────────────────────────────────────────────┐
│  📜 RECEIPT rct_01j5a...                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Status:        ✅ confirmed                                  │
│  Type:          journal-entry-post                            │
│  Candidate:     4a8f3b2c...                                   │
│  Evidence Root: b3c1d7e9...                                   │
│  Policy:        pcy_01j3x... @ v2026.1                        │
│  Risk:          R2                                             │
│  Materiality:   S/ 1,250.00                                   │
│  Approver:      user_01j2y... (J. Pérez)                      │
│  Approved at:   2026-07-28 14:35:00 UTC                        │
│  Executed at:   2026-07-28 14:35:05 UTC                        │
│                                                              │
│  🔗 Change Set: cs_01j4z...                                   │
│  🔗 Workspace: ws_01j3y...                                    │
│  🔗 Company:    cmp_01j2x... (Facturación Total S.A.C.)       │
│  🔗 Period:     2026-06                                       │
│                                                              │
│  Output:                                                      │
│    Journal Entry: je_202606_042                                │
│    Lines: 2                                                    │
│    Total: S/ 1,250.00                                          │
│                                                              │
│  Evidence:                                                    │
│    ✅ src_01j7c... — Bank statement (hash matches)             │
│    ✅ src_01j7d... — Reconciliation report (hash matches)      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 3: Verify Integrity

Click **Verify** in the receipt toolbar. Drenyra checks:

| Check | Result |
|---|---|
| Candidate hash matches approved candidate | ✅ |
| Evidence root matches linked evidence | ✅ |
| Approval signature is valid (user_01j2y...) | ✅ |
| Execution signature is valid | ✅ |
| Policy version was current at approval time | ✅ |
| Period was open at execution time | ✅ |

All checks pass. The receipt is **valid**.

---

## Step 4: Trace to Source

Click **Trace to Source** in the receipt. The Evidence Graph opens, showing:

```
📜 rct_01j5a... (Receipt)
  ↑ ⚙️ Execution (je_202606_042 posted)
    ↑ ✍️ Approval (J. Pérez signed 4a8f...)
      ↑ 📋 Candidate (CS-2026-06-042)
        ↑ ✅ Validated Report (hash: b3c1...)
          ↑ 📊 Normalized Data (bank_statement_202606.csv)
            ↑ 📄 Source Document (Bank Statement June 2026 PDF)
```

Click any node to inspect its data. From the receipt, you have traced back to the original bank statement.

---

## Step 5: Export and Verify Offline

Receipts can be verified without a Drenyra server:

1. Click **Export** in the receipt toolbar, or use the CLI:

```bash
drenyra receipt export rct_01j5a... --format json > receipt.json
```

1. Verify on any machine (no server needed):

```bash
drenyra receipt verify receipt.json
```

Output:

```
✅ Candidate hash matches approved candidate
✅ Evidence root matches linked evidence
✅ Approval signature valid (user_01j2y...)
✅ Execution signature valid
✅ Receipt chain intact
Receipt is VALID
```

---

## Step 6: Share for Audit

Export the receipt and provide it to your auditor. They can verify it independently:

```bash
# Auditor's machine (any OS, any location)
drenyra receipt verify receipt.json
# ✅ All checks pass
```

The auditor does not need access to Drenyra. They do not need a database connection. They need the receipt file and the verifier binary.

---

## What You've Learned

- Receipts are immutable records of material operations
- Every receipt can be verified — hash chain, signatures, policy, period
- Receipts are self-contained and verifiable offline
- From a receipt, you can trace back to the original source document
- Auditors can verify receipts without system access

---

## Next Steps

- Read [RED — Receipt-Driven Execution](../04-explanation/receipt-driven-execution.md) — the full protocol
- [Evidence Graph](../04-explanation/evidence-graph.md) — how receipts connect to evidence
- [Canonical Hashing](../04-explanation/canonical-hashing.md) — how hashes work
