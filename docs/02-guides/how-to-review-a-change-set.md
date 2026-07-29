# How to Review a Change Set

**Last updated:** 2026-07-29
**Prerequisites:** A workspace with pending changes, professional role with review authority
**FEOS Planes:** [Workspace](../03-workspace-plane/README.md) · [Trust](../05-trust-plane/README.md) · [Financial](../07-financial-plane/README.md)

---

A Change Set is Drenyra's equivalent of a Git branch for financial changes. It isolates proposed modifications — journal entries, document updates, classification changes — until a professional reviews and approves the exact candidate.

This guide covers the review workflow: inspecting the diff, checking evidence, understanding risk, and making a decision.

---

## The review lifecycle

```
Change Set created → work proposed → frozen → diff displayed
→ evidence checked → policy applied → approved/rejected → executed or discarded
```

As a reviewer, your job is to inspect the **frozen candidate** — not the intentions, not the conversation — and decide based on evidence, policy, and professional judgment.

---

## Step 1: Open the Change Set

**Via the Web UI:**

1. In the Workspace, find the Change Set in the **Change Set List** (bottom pane).
2. Click on a Change Set with status `ready-for-review` (highlighted).
3. The **Inspector** (right rail) shows:
   - **Summary:** What changed, by whom, when
   - **Risk level:** R0–R3
   - **Materiality:** Estimated financial impact
   - **Policy version:** What policy governs this review

**Via the API:**

```typescript
import { getChangeSet } from '@drenyra/api/change-sets'

const cs = await getChangeSet('cs_01j4z...')
// cs.status → 'ready-for-review'
// cs.riskLevel → 'R2'
```

---

## Step 2: Inspect the Financial Diff

The diff is not a text comparison — it is a **structured financial difference** showing before/after for every account, document, and tax impact.

| Section                 | What you see                                                  |
| ----------------------- | ------------------------------------------------------------- |
| **Account movements**   | Debit/credit changes per account, with running balance impact |
| **Document changes**    | Documents added, modified, or removed                         |
| **Tax impact**          | IGV, detracciones, or other tax effects                       |
| **Evidence references** | Links to source documents, validations, and policies          |

**What to check:**

- Do the account movements balance? (debits = credits)
- Are the affected accounts correct for the transaction type?
- Is the tax calculation correct for the applicable rate?
- Does every change reference a source document or evidence item?

---

## Step 3: Verify Evidence

Every change in the Change Set carries evidence references. Click any evidence link in the diff to open the **Evidence Inspector**:

```
Source document → Normalized → Validated → Proposed → [YOU ARE HERE] → Approved → Promoted
```

The evidence trail shows each stage with its own hash. You can verify that:

- The source document was ingested correctly
- Normalization preserved the original data
- Validation checks passed (or flagged exceptions, which you must review)
- The proposal is consistent with the evidence

**Red flags:**

- Missing evidence for a material change
- Evidence hash changed since proposal was created
- Validation warnings were suppressed without justification

---

## Step 4: Understand Risk and Policy

The Change Set displays:

- **Risk level:** R0 (read-only, no approval needed) → R3 (irreversible, dual approval + step-up auth)
- **Materiality:** Estimated financial impact (amount and significance)
- **Required approvers:** Who must approve based on policy
- **Escalation path:** What happens if you reject or escalate

For R2 and R3 changes, verify that the required approvers match the policy for this company, period, and amount.

---

## Step 5: Make a Decision

| Action                 | When                                                    | Effect                                                       |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| **Approve**            | Everything checks out, within policy, evidence complete | Change Set moves to `approved` → queued for execution        |
| **Approve with notes** | Approved but you want to document a consideration       | Same as approve, with annotation in audit trail              |
| **Request changes**    | Minor issues — send back with specific feedback         | Change Set moves to `changes-requested`, author can resubmit |
| **Reject**             | Material issues, missing evidence, policy violation     | Change Set moves to `rejected`, discarded                    |

**Via Web UI:** Click the action button in the toolbar. For R3, you may need to complete step-up authentication (e.g., MFA or second approver).

**Via API:**

```typescript
import { approveChangeSet } from '@drenyra/api/change-sets'

const result = await approveChangeSet('cs_01j4z...', {
  note: 'Approved. IGV rate confirmed at 18% for this service category.',
})
```

---

## After approval

The Change Set is queued for execution by the [Execution Plane](../06-execution-plane/README.md). Before execution, the system re-validates:

- The candidate hash still matches (nothing changed since you reviewed)
- The period is still open
- The evidence root is still valid
- The policy version has not changed

If any of these fail, the approval is **invalidated** and the Change Set returns to `ready-for-review`. This is not a bug — it is the Trust Plane preventing execution against stale authority.

---

## Do / Don't

### Do

- Verify the frozen candidate hash matches what you are reviewing.
- Check evidence for every material change — not just the diff.
- Document why you approved or rejected, especially for R2+ changes.
- Escalate if the change crosses your authority threshold.

### Don't

- Don't approve based on trust in the agent or author — verify the candidate.
- Don't approve a change with missing evidence.
- Don't ignore validation warnings — understand why they were raised and whether they are resolved.
- Don't approve for a different period, company, or scope than what the Change Set targets.

---

## Example: Approving a journal entry correction

```
Change Set: "CS-2026-06-042 — Bank reconciliation adjustment"
Risk: R2
Materiality: S/ 1,250

Diff:
  Account 4211 (Bco. Scotiabank CTE):   -1,250.00
  Account 5911 (Gastos bancarios):       +1,250.00

Evidence:
  ✓ Bank statement 2026-06-30 (hash: 4a8f...)
  ✓ Bank reconciliation report (hash: b3c1...)
  ✓ IGV not applicable (service charge exemption)

Policy:
  - R2: single approver with role 'accounting-reviewer'
  - Materiality under S/ 5,000: no escalation

Decision: APPROVED
Note: Bank charge for June statement. Matches reconciled amount.
```

---

## Next steps

- [Interpret an Execution Receipt](./how-to-interpret-a-receipt.md) — see the result after execution
- [Trust Plane](../05-trust-plane/README.md) — understand the full approval authority model
