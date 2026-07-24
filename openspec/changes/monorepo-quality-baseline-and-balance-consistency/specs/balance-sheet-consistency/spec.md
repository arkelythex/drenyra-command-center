# Balance-Sheet Consistency Specification

## Purpose

Characterize two overlapping balance-sheet generators and provide a safe internal consolidation seam while preserving caller-visible fiscal behavior until an explicit accounting authority approves canonicalization.

## Requirements

### Requirement: Caller outputs are characterized and preserved

The system MUST have executable characterization coverage for both balance-sheet generators through their affected caller contracts. Coverage MUST preserve each caller's observable fiscal output, including supported company, RUC, accounting-period, account, empty-state, and confirmed divergent-semantic cases. A divergent result MUST be recorded as an intentional difference until its canonical contract is authorized.

#### Scenario: Existing caller output remains unchanged

- GIVEN a representative fixture supported by a balance-sheet caller
- WHEN the pre-consolidation and post-consolidation implementations are exercised through that caller
- THEN the observable fiscal output is equivalent
- AND the caller's existing scope boundaries and output shape remain unchanged

#### Scenario: Divergent semantics remain explicit

- GIVEN a fixture that produces different outputs or mechanics between the two generators
- WHEN characterization tests execute both caller paths
- THEN both observed results are captured as evidence
- AND neither result is changed or declared canonical solely because it is easier to share

### Requirement: Fiscal scope and primitives remain intact

The balance-sheet paths MUST preserve existing RUC, company, and accounting-period boundaries. They MUST continue using the existing money representation, rounding behavior, domain registries, and audit expectations. The change MUST NOT weaken, bypass, or infer these boundaries differently.

#### Scenario: Scoped calculation remains scoped

- GIVEN inputs containing a company, RUC, accounting period, and account data
- WHEN either balance-sheet caller generates its result
- THEN only the caller's supported fiscal scope contributes to the result
- AND money and rounding behavior match the pre-change behavior

### Requirement: Authority gates fiscal semantic canonicalization

The system MUST require both characterization evidence and explicit accounting authority before unifying divergent fiscal semantics or changing an expected fiscal result. Implementation preference, code duplication, or test convenience alone MUST NOT authorize canonicalization. Until authority exists, caller-specific policies or adapters MUST preserve intentional differences.

#### Scenario: Unapproved canonicalization is blocked

- GIVEN characterization identifies a semantic difference
- AND no explicit accounting authority establishes the canonical contract
- WHEN consolidation is proposed
- THEN the difference remains behind an explicit caller-specific policy or adapter
- AND no expected fiscal output is updated to force equivalence

#### Scenario: Authorized canonicalization is evidenced

- GIVEN characterization covers all affected caller contracts
- AND explicit accounting authority identifies the canonical fiscal contract
- WHEN a consolidation changes the divergent behavior
- THEN the authority and evidence are recorded with the change
- AND the affected tests assert the authorized canonical result

### Requirement: Consolidation uses a safe internal seam

The implementation MAY remove duplicated internal mechanics only through the smallest seam justified by characterization evidence. The seam MUST preserve caller-specific semantics where equivalence is not proven, MUST NOT require a public API or persistence-schema change, and MUST leave each affected caller with an explicit mapping to its required behavior.

#### Scenario: Equivalent mechanics are shared safely

- GIVEN characterization proves a mechanic has equivalent inputs, rules, and outputs for every affected caller
- WHEN the mechanic is consolidated
- THEN both callers use the shared internal seam
- AND all caller characterization tests continue to pass

#### Scenario: Non-equivalent mechanics remain separated

- GIVEN characterization shows a mechanic has caller-specific accounting behavior
- WHEN consolidation is implemented
- THEN the shared seam exposes or accepts the distinction without hiding it
- AND each caller retains its prior observable behavior

### Requirement: External contracts remain unchanged

The change MUST NOT alter public API shapes, database or persistence schemas, UI-visible behavior, SUNAT behavior, SIRE behavior, fiscal report meaning, or compliance policy. No migration or persistent-data transformation is permitted.

#### Scenario: Boundary contract comparison is unchanged

- GIVEN the pre-change public, persistence, UI, SUNAT, and SIRE contract observations
- WHEN the characterization and consolidation slices are verified
- THEN no protected contract or integration behavior differs
- AND no database migration or data repair is required

### Requirement: Fiscal verification is completed for execution-path changes

When implementation touches fiscal execution paths, verification MUST run the relevant unit and integration suites and the repository-required fiscal compliance checks, including the applicable SIRE reproduction or gate command. Failures MUST be reported as evidence and MUST NOT be bypassed.

#### Scenario: Fiscal checks guard delivery

- GIVEN a consolidation slice changes balance-sheet execution
- WHEN the slice is verified
- THEN relevant tests and required fiscal compliance checks are run
- AND delivery stops if caller output, scope, audit expectations, SUNAT/SIRE behavior, or compliance evidence is not preserved
