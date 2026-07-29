# Materiality

**Last updated:** 2026-07-29
**FEOS Planes:** [Trust](../05-trust-plane/README.md) · [Workspace](../03-workspace-plane/README.md)

---

## What It Is

Materiality is Drenyra's mechanism for prioritizing financial attention. It combines **risk**, **amount**, and **deadline** into a single score that determines:

- Which exceptions appear first in the Attention Inbox
- What approval level an action requires (R0–R3)
- Whether an action needs escalation

Materiality is not a fixed threshold — it is computed per operation, per company, per context.

---

## The Formula

```
materiality = risk(magnitude) × amount_significance × deadline_factor
```

### Risk (magnitude)

| Factor | Weight | Example |
|---|---|---|
| Transaction type | 1–10 | Ledger post = 5, SUNAT submission = 9, Evidence delete = 10 |
| Historical variance | 1–3 | Normal = 1, Unusual = 2, Never seen = 3 |
| Policy flags | 0–5 | Exempt = 0, Requires review = 3, Requires escalation = 5 |

### Amount significance

The ratio of the transaction amount to a reference (company revenue, account balance, budget):

```
amount_significance = |transaction_amount| / reference_amount
```

| Ratio | Significance | Example |
|---|---|---|
| < 0.01 | Low | S/ 100 on a S/ 10M company |
| 0.01–0.05 | Normal | S/ 5,000 on a S/ 100K account |
| 0.05–0.20 | High | S/ 20,000 on a S/ 100K account |
| > 0.20 | Critical | S/ 50,000 on a S/ 100K account |

### Deadline factor

| Time to deadline | Factor |
|---|---|
| > 30 days | 1.0 |
| 15–30 days | 1.5 |
| 7–14 days | 2.0 |
| 3–7 days | 3.0 |
| 1–3 days | 5.0 |
| Today | 10.0 |
| Overdue | 20.0 |

---

## Materiality Levels

| Level | Score | Behavior |
|---|---|---|
| **Trivial** | < 5 | Auto-approved (R0) |
| **Low** | 5–20 | Exception review (R1) |
| **Medium** | 20–100 | Single approver (R2) |
| **High** | 100–500 | Single approver + notification to manager (R2+) |
| **Critical** | > 500 | Dual approval + step-up auth (R3) |

These thresholds are configurable per company via policy. A risk-tolerant company may have higher thresholds; a conservative one may lower them.

---

## Materiality in Practice

### Attention Inbox

The Attention Inbox sorts items by materiality:

```
1. 🔴 SUNAT submission overdue — S/ 250,000 (Materiality: 1,800) [R3]
2. 🟡 Bank reconciliation exception — S/ 12,000 (Materiality: 180) [R2]
3. 🔵 Invoice classification confidence low — S/ 500 (Materiality: 8) [R1]
```

### Approval Routing

An action's approval level is determined by materiality:

```typescript
function determineApprovalLevel(materiality: number, company: Company): RLevel {
  const thresholds = company.policy.approvalThresholds

  if (materiality >= thresholds.r3) return 'R3'
  if (materiality >= thresholds.r2) return 'R2'
  if (materiality >= thresholds.r1) return 'R1'
  return 'R0'
}
```

### Escalation

When a Change Set is not reviewed within a time window proportional to its materiality, it escalates:

| Materiality | Escalation timeout |
|---|---|
| < 20 | 7 days |
| 20–100 | 3 days |
| 100–500 | 24 hours |
| > 500 | 4 hours |

---

## Materiality in Drenyra

```typescript
interface MaterialityInput {
  transactionType: string
  amount: number
  referenceAmount: number     // Account balance, revenue, or budget
  deadline?: string            // SUNAT deadline, close date
  policyFlags: string[]        // Flags from policy
  historicalContext: {
    variance: 'normal' | 'unusual' | 'never-seen'
    similarTransactions: number
  }
}

// Compute
const score = computeMateriality(input)
// score: { total: 284, level: 'high', rLevel: 'R2+' }

// Use in portfolio rollup
const attention = portfolioRollup.computeAttention(workspace)
attention.sortBy('materiality', 'descending')
```

---

## Do / Don't

### Do

- Configure materiality thresholds per company — one size does not fit all.
- Include deadline in the materiality calculation — time matters as much as amount.
- Escalate unaddressed items proportional to their materiality.
- Log every materiality computation for audit.

### Don't

- Don't use a fixed amount threshold — S/ 1,000 is material for a micro-company but trivial for a large one.
- Don't ignore deadline — a small amount due today is more urgent than a large amount due next month.
- Don't auto-approve R2+ based on materiality alone — the score informs, but the policy decides.
- Don't skip historical context — an unusual transaction pattern is more material than the same amount in a routine category.

---

## References

- [Trust Plane](../05-trust-plane/README.md) — how materiality integrates with approval
- [R0–R3 Governance](./r0-r3-governance.md) — risk-based approval levels
- [FEOS Program: SDD-FEOS-003](../01-foundation/feos-program.md#sdd-feos-003) — Portfolio Attention Rollups
