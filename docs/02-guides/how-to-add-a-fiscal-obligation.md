# How to Add a Fiscal Obligation

**Last updated:** 2026-07-29
**Prerequisites:** A country pack exists for the target jurisdiction, understanding of the obligation's legal requirements
**FEOS Planes:** [Country](../09-country-plane/README.md) · [Financial](../07-financial-plane/README.md) · [Execution](../06-execution-plane/README.md)

---

A Fiscal Obligation is a tax declaration, return, or report that a company must file with an authority. In Drenyra, obligations are modeled as deterministic, versioned specifications (FSD — Fiscal Specification Documents) that the system can validate, execute, and trace.

This guide walks through adding a new obligation to an existing country pack.

---

## The obligation lifecycle

```
Spec (FSD) → Implementation → Tests → Review → Deploy → Active
```

Every obligation starts with a spec. No spec, no code.

---

## Step 1: Write the FSD

Create the Fiscal Specification Document at `docs/06-fiscal/{country}/{obligation}.md`:

```markdown
# FSD-PE-SIRE — SIRE Reconciliation

**Last updated:** 2026-07-29
**Country:** Peru
**Authority:** SUNAT
**Obligation:** SIRE (Sistema Integrado de Registros Electrónicos)
**Normative basis:** Resolución de Superintendencia N° 000234-2024/SUNAT

## Purpose

Reconcile electronic records (RCE) against SUNAT's declared values (RVIE)
and produce a replacement candidate when discrepancies are found.

## Data requirements

| Field         | Source            | Required |
| ------------- | ----------------- | -------- |
| RUC           | Company profile   | ✅       |
| Period        | Workspace context | ✅       |
| RCE records   | Accounting system | ✅       |
| RVIE response | SUNAT query       | ✅       |

## Validation rules

1. RCE totals must match RVIE totals within tolerance (S/ 0.50 per line)
2. Every document in RCE must have a valid SUNAT CDR
3. IGV calculation must match SUNAT's declared rate for each document type

## Output

- Replacement candidate (when discrepancies exceed tolerance)
- Reconciliation report
- Evidence receipt
```

---

## Step 2: Define the Obligation in the Country Pack

Add the obligation to the country pack's declarations:

```yaml
# country-packs/peru/declarations/sire.yaml
declaration: sire
name: SIRE Reconciliation
authority: SUNAT
fsd: docs/06-fiscal/peru/sire-reconciliation.md

frequency: monthly
deadline:
  rule: 'calendar-day'
  day: 15
  month_offset: 1

phases:
  - ingestion: # Import RCE and RVIE data
      inputs: [rce, rvie]
      validation: required
  - comparison: # Compare both sources
      inputs: [rce_normalized, rvie_normalized]
      tolerance: 0.50
  - resolution: # Generate replacement candidate
      inputs: [differences]
  - submission: # Send to SUNAT
      inputs: [replacement_candidate]
      connector: sunat

validation:
  - rule: 'rce_period_matches_workspace'
  - rule: 'all_documents_have_cdr'
  - rule: 'igv_rates_match_declared'

connector:
  authority: SUNAT
  operations:
    query_rvie:
      method: GET
      path: /sire/rvie/{ruc}/{period}
    submit_replacement:
      method: POST
      path: /sire/replacement
```

---

## Step 3: Implement the Obligation Logic

```typescript
// packages/domain/src/fiscal/peru/sire/reconciliation.ts
import { defineObligation } from '@drenyra/domain/fiscal'

export const sireReconciliation = defineObligation({
  id: 'pe-sire',
  name: 'SIRE Reconciliation',
  country: 'PE',
  authority: 'SUNAT',

  phases: {
    async ingestion(input: IngestionInput): Promise<NormalizedData> {
      // Import RCE from accounting system
      // Query RVIE from SUNAT
      // Normalize both to common format
    },

    async comparison(input: ComparisonInput): Promise<Differences> {
      // Compare RCE vs RVIE
      // Apply tolerance
      // Return discrepancies
    },

    async resolution(input: Differences): Promise<ReplacementCandidate> {
      // Generate replacement for discrepancies
    },

    async submission(input: ReplacementCandidate): Promise<Receipt> {
      // Submit via SUNAT connector
    },
  },

  validators: [
    rcePeriodMatchesWorkspace,
    allDocumentsHaveCDR,
    igvRatesMatchDeclared,
  ],
})
```

---

## Step 4: Write Property-Based Tests

Fiscal obligations are ideal candidates for property-based testing:

```typescript
// packages/domain/src/fiscal/peru/sire/__tests__/reconciliation.test.ts
import { describe, it } from 'vitest'
import { sireReconciliation } from '../reconciliation'
import { arbitraryRce, arbitraryRvie } from '@drenyra/test-utils/fiscal'

describe('SIRE Reconciliation', () => {
  it('should match RCE and RVIE when data is identical', () => {
    // Property: for any valid RCE, comparison with identical RVIE
    // yields zero differences
  })

  it('should detect discrepancies within tolerance', () => {
    // Property: differences under S/ 0.50 are resolved automatically
  })

  it('should generate replacement for differences over tolerance', () => {
    // Property: any difference over S/ 0.50 produces a replacement
  })

  it('should reject invalid RUC in period', () => {
    // Property: an RUC that is not active for the period fails validation
  })
})
```

---

## Step 5: Register and Validate

```bash
# Run the obligation's tests
bun run test --filter=@drenyra/domain -- -t "SIRE"

# Validate the obligation against the country pack schema
bun run fiscal:validate-obligation --obligation=pe-sire

# Run the compliance gate
bun run compliance:sire-gate
```

---

## Do / Don't

### Do

- Start with the FSD — no spec, no implementation.
- Use property-based tests for fiscal invariants.
- Reference the normative basis (legal resolution, decree, or law).
- Document known edge cases and how they are handled.

### Don't

- Don't implement an obligation from memory — SUNAT/DIAN rules change.
- Don't skip the tolerance check — rounding differences are normal and must not block reconciliation.
- Don't assume the connector is available — design for degraded operation.
- Don't hardcode country-specific rates in the obligation logic — use the country pack's rules.

---

## Troubleshooting

| Symptom                            | Likely cause                                            | Fix                                                   |
| ---------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| RVIE query fails                   | SUNAT is unavailable or credentials expired             | Implement retry with backoff; check credential expiry |
| Comparison yields many differences | RCE data is incomplete or RVIE has late-filed documents | Check period closing status; re-ingest RCE            |
| Replacement rejected by SUNAT      | Schema mismatch or missing required fields              | Validate against SUNAT's XSD before submission        |

---

## Next steps

- [Configure a Country Pack](./how-to-configure-a-country-pack.md) — set up the jurisdiction before adding obligations
- [FEOS Program: SDD-FEOS-014](../01-foundation/feos-program.md#sdd-feos-014) — Country Pack Runtime specification
- [Program Taxonomy: FSD](../01-foundation/program-taxonomy.md#13-fsd--fiscal-specification-document) — FSD document format
