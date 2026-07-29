# FSD — Fiscal Specification-Driven Execution

**Last updated:** 2026-07-29
**FEOS Planes:** [Financial](../07-financial-plane/README.md) · [Country](../09-country-plane/README.md)
**Taxonomy:** [Program Taxonomy](../01-foundation/program-taxonomy.md#13-fsd--fiscal-specification-document)

---

## What It Is

FSD (Fiscal Specification-Driven Execution) is the discipline of specifying every fiscal obligation as a **structured, versioned, testable document** before implementing it in Drenyra. The FSD becomes the contract between fiscal domain knowledge, engineering, and the running system.

**No spec, no code.**

---

## Why FSD

Fiscal rules change. SUNAT releases new resolutions, rates change, deadlines shift. Without a spec, changes are:

- **Undocumented** — tacit knowledge in someone's head
- **Untestable** — "we fixed it" without evidence
- **Unversioned** — which rules applied in June 2025 vs June 2026?
- **Unreviewable** — a fiscal expert cannot review code, but can review a spec

FSD solves all four by making the specification the source of truth.

---

## FSD Structure

```markdown
# FSD-PE-SIRE — SIRE Reconciliation

**Last updated:** 2026-07-29
**Country:** Peru
**Authority:** SUNAT
**Obligation:** SIRE (Sistema Integrado de Registros Electrónicos)
**Normative basis:** R.S. 000234-2024/SUNAT, R.S. 112-2021/SUNAT
**Status:** Approved

## Purpose
Reconcile electronic records (RCE) against SUNAT's declared values (RVIE)
and produce a replacement candidate when discrepancies are found.

## Scope

### Includes
- Monthly SIRE reconciliation for Peru
- RCE ingestion and normalization
- RVIE query and parsing
- Comparison with tolerance (S/ 0.50 per line)
- Replacement candidate generation
- Evidence receipts for each submission

### Does not include
- PLE migration to SIRE (separate FSD)
- Historical reconciliation of pre-SIRE periods

## Data requirements

| Field | Source | Required |
|---|---|---|
| RUC | Company profile | ✅ |
| Period | Workspace context | ✅ |
| RCE records | Accounting system | ✅ |
| RVIE response | SUNAT API | ✅ |

## Validation rules

1. RCE totals must match RVIE totals within tolerance (S/ 0.50 per line)
2. Every document in RCE must have a valid SUNAT CDR
3. IGV calculation must match SUNAT's declared rate for each document type
4. RUC must be active for the period

## States

| State | Meaning |
|---|---|
| pending | Reconciliation not started |
| ingesting | Importing RCE and RVIE data |
| comparing | Running comparison logic |
| resolved | Differences within tolerance |
| replacement_needed | Differences exceed tolerance |
| submitted | Replacement sent to SUNAT |
| completed | Reconciliation closed with receipt |
| failed | Non-recoverable error |

## Output

- Replacement candidate (when applicable)
- Reconciliation report
- RED receipt

## Tests

### Property-based tests
- For any valid RCE, comparison with identical RVIE yields zero differences
- Any difference over S/ 0.50 produces a replacement
- Invalid RUC in period fails validation

### Example tests
- IGV rate at 18% (2026 composition: 15.5% + 2.5%)
- Single document difference over tolerance
- Multiple documents with mixed differences
```

---

## FSD Lifecycle

```
Draft → Proposed → Approved → Implemented → Verified → Deprecated/Superseded
```

| Phase | Description |
|---|---|
| **Draft** | Initial document, may be incomplete |
| **Proposed** | Ready for fiscal expert review |
| **Approved** | Reviewed and accepted — implementation can start |
| **Implemented** | Code exists and passes tests against the spec |
| **Verified** | Tests pass in production-like environment |
| **Deprecated** | Superseded by a newer FSD |

---

## FSD Maturity Levels

| Level | Description | Artifacts |
|---|---|---|
| **L0 (Idea)** | Concept identified | FSD draft |
| **L1 (Requirements)** | Data, rules, and scope defined | FSD approved |
| **L2 (Architecture)** | Design mapped to FEOS planes | FSD + ADR |
| **L3 (Executable)** | Tests pass against spec | FSD + code + tests |
| **L4 (Verified)** | Production evidence exists | FSD + tests + receipts |

---

## Fiscal Change Sets

FSD also defines how fiscal rules are versioned and applied:

```
country-packs/peru/rules/
├── igv.yaml                → Current version
├── igv.2025.yaml           → 2025 version (IGV 16% + IPM 2%)
├── igv.2026.yaml           → 2026 version (IGV 15.5% + IPM 2.5%)
└── igv.2027.yaml           → (preview) 2027 version (IGV 15% + IPM 3%)
```

Each version declares:

```yaml
rule: igv
version: 2026
effective: 2026-01-01
valid_until: 2026-12-31
composition:
  igv: 15.5
  ipm: 2.5
  total: 18.0
legal_basis: Ley 32387
```

The runtime selects the correct version based on the operation's period. A June 2026 operation uses the 2026 version; a December 2025 operation uses the 2025 version.

---

## FSD to Code Pipeline

```
FSD (markdown)
  ↓
Spec review (fiscal expert)
  ↓
Property-based test generation
  ↓
Domain implementation (TypeScript)
  ↓
Integration with Country Pack
  ↓
Compliance gate validation
  ↓
Receipt evidence
```

Each step is gated by the previous one. No FSD → no implementation.

---

## In Drenyra

```typescript
// An FSD maps to an obligation implementation
interface FiscalObligation {
  id: string                    // 'pe-sire'
  fsdPath: string               // 'docs/06-fiscal/peru/sire-reconciliation.md'
  country: string               // 'PE'

  // Versions
  currentVersion: string
  effectiveFrom: string
  validUntil?: string

  // Phases (from FSD)
  phases: ObligationPhase[]

  // Validators (from FSD)
  validators: ValidationRule[]

  // Tests (generated from FSD)
  tests: Array<{
    name: string
    input: any
    expected: any
  }>
}

// Register and validate
const obligation = registerObligation(fsdSpec)
runComplianceGate(obligation)
```

---

## Do / Don't

### Hacer

- Write the FSD before any implementation — no spec, no code.
- Version fiscal rules explicitly — the effective date is part of the contract.
- Include property-based test cases in every FSD.
- Review the FSD with a fiscal expert before approving.
- Update the FSD when the norm changes — the old version remains for historical queries.

### No hacer

- Don't implement a fiscal rule without an approved FSD.
- Don't change a rule version without documenting the effective date and legal basis.
- Don't skip test cases — the FSD's test section is what makes it verifiable.
- Don't delete old FSD versions — they are the evidence for historical audits.

---

## References

- [Program Taxonomy](../01-foundation/program-taxonomy.md#13-fsd--fiscal-specification-document) — FSD document format
- [Add a Fiscal Obligation guide](../02-guides/how-to-add-a-fiscal-obligation.md) — practical FSD workflow
- [SIRE doc](../06-fiscal/peru/sire.md) — example FSD in practice
- [FEOS Program](../01-foundation/feos-program.md) — how FSDs map to SDDs
