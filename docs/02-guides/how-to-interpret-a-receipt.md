# How to Interpret an Execution Receipt

**Last updated:** 2026-07-29
**Prerequisites:** A completed operation that generated a receipt
**FEOS Planes:** [Trust](../05-trust-plane/README.md) · [Execution](../06-execution-plane/README.md) · [Financial](../07-financial-plane/README.md)

---

An Execution Receipt (RED receipt) is the immutable record of a material financial operation in Drenyra. It answers one question definitively:

> **What exactly happened, with what evidence, authorized by whom, and what was the result?**

Receipts are machine-verifiable and human-readable. You can verify a receipt independently of Drenyra — the hash chain does not require a running system.

---

## Anatomy of a Receipt

```
RED receipt v1
────────────────────────────────────────────
  Receipt ID:      rct_01j5a...
  Type:            journal-entry-post
  Status:          confirmed

  Candidate:       4a8f3b2c... (SHA-256)
  Evidence Root:   b3c1d7e9... (Merkle root)

  Policy:          pcy_01j3x...@v2.1
  Risk:            R2
  Materiality:     S/ 1,250.00

  Approver:        user_01j2y... (J. Pérez)
  Approved at:     2026-07-28T14:30:00Z
  Approved hash:   7d9e1f2a... (signed)

  Workflow ID:     wf_01j4z...
  Executed at:     2026-07-28T14:30:05Z
  Execution hash:  a4b8c2d1... (signed)

  Output:
    Journal Entry: je_01j6b...
    Period:        2026-06
    Company:       cmp_01j2x... (Facturación Total S.A.C.)
    Lines:         2
    Total Debit:   S/ 1,250.00
    Total Credit:  S/ 1,250.00

  Links:
    ↑ Workspace:   ws_01j3y...
    ↑ Change Set:  cs_01j4z...
    ↑ Evidence:
      · src_01j7c... (Bank statement)
      · src_01j7d... (Reconciliation report)
────────────────────────────────────────────
```

---

## Step 1: Identify the Receipt

Every receipt has a canonical ID with the `rct_` prefix. You can find receipts:

| Location           | How                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Web UI**         | Click any completed operation in the timeline. The receipt is displayed in the Inspector. |
| **API**            | `GET /receipts/:id` returns the full receipt object.                                      |
| **CLI**            | `drenyra receipt get rct_01j5a...`                                                        |
| **Evidence Graph** | Navigate from any operation to its receipt via the evidence trail.                        |

---

## Step 2: Verify Integrity

Every receipt carries its own hash chain. You do not need to trust the system — you can verify:

**1. Candidate hash matches the approved candidate**

The receipt's `Candidate` field is the hash of the frozen candidate. If it matches what you approved, the execution executed exactly what was reviewed.

**2. Evidence root is verifiable**

The `Evidence Root` is a Merkle root of all evidence hashes referenced by this operation. You can recompute it from the evidence items listed in `Links → Evidence`.

**3. Signature chain**

The `Approved hash` is the approver's signature over the candidate. The `Execution hash` is the system's signature over the approved candidate + execution context. Both are verifiable offline.

**CLI verification:**

```bash
# Verify a receipt offline (no Drenyra server needed)
drenyra receipt verify rct_01j5a...

# Output:
# ✅ Candidate hash matches approved candidate
# ✅ Evidence root matches linked evidence
# ✅ Approval signature valid (user_01j2y...)
# ✅ Execution signature valid
# ✅ Receipt chain intact
```

---

## Step 3: Trace the Evidence Trail

The receipt links up to its workspace and change set, and down to individual evidence items:

```
Receipt
  ↑ Change Set (cs_01j4z...)
      ↑ Evidence items
        · src_01j7c... — Bank statement (source)
        · src_01j7d... — Reconciliation report (derived)
  ↑ Workspace (ws_01j3y...)
      ↑ Company (cmp_01j2x...)
      ↑ Period (2026-06)
```

Each evidence item has its own provenance:

```
Bank statement
  → Ingested (src_01j7c...)
  → Normalized (norm_01j7e...)
  → Validated (val_01j7f...)
  → Referenced in Change Set (cs_01j4z...)
```

You can navigate this graph from any node. If you have a receipt, you can trace back to the original source document.

---

## Step 4: Understand What Was Executed

The `Output` section describes the material result:

- **Journal Entry** — the posted entry with account, amount, and period
- **Document** — a submitted declaration, registered document, or sent communication
- **Status** — `confirmed` (success), `failed` (error before execution), `compensated` (reversed later)

For financial operations, the output includes enough detail to reconcile: account codes, amounts, period, and cross-references.

---

## Step 5: Verify Offline (No Drenyra Needed)

Receipts are designed to be independently verifiable. Save a receipt as JSON:

```bash
drenyra receipt export rct_01j5a... --format json > receipt.json
```

Then verify on any machine:

```bash
drenyra receipt verify receipt.json
# Works without network, without Drenyra server
```

The verifier recomputes hashes from the data in the file. No external state is required.

---

## Do / Don't

### Do

- Verify receipts after every material operation.
- Save receipts for regulatory audit — they are your evidence of compliance.
- Trace from receipt to evidence when investigating a discrepancy.
- Use offline verification for regulatory or third-party audits.

### Don't

- Don't accept a receipt at face value — verify the hash chain.
- Don't lose the receipt file — without it, the operation has no verifiable proof.
- Don't modify a receipt file — any byte change invalidates the hash chain (and that is by design).

---

## Common questions

**Q: Can a receipt be forged?**
No. The signature chain requires the approver's private key. Offline verification detects any tampering. The evidence root ties every receipt to the evidence it references — changing either breaks the chain.

**Q: What if I lose a receipt?**
Receipts are stored in the Evidence Graph and backed up. You can re-export any receipt from the system. But for regulatory audit, keep an offline copy.

**Q: What does a failed receipt look like?**
A failed receipt records the error, the inputs, and the execution attempt. It does not record an output. The candidate and evidence root are still preserved for investigation.

---

## Next steps

- [Review a Change Set](./how-to-review-a-change-set.md) — see what happens before a receipt is generated
- [Trust Plane](../05-trust-plane/README.md) — understand the full receipt protocol
- [RED Spec](../14-design/red-spec.md) — the full Receipt-Driven Execution specification
