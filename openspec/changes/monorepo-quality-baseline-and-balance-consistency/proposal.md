# Establish a trustworthy monorepo quality baseline and consistent balance-sheet generation

**Last updated:** Proposal creation

This change will make Drenyra's monorepo quality signals reproducible and remove one fiscal-critical duplicate without changing observable fiscal behavior. The first fiscal target is the pair of balance-sheet generators whose outputs have confirmed semantic drift.

## Intent

The repository currently lacks a trustworthy, actionable quality baseline:

- The architecture command references a script that is not present.
- Madge terminates during analysis with a TypeScript API compatibility failure; the underlying cause still requires confirmation.
- The current typecheck reports 1,190 diagnostics.
- The current lint run reports 208 errors.
- Knip output is too noisy to serve as a reliable gate without further classification.

At the same time, two balance-sheet generators implement overlapping responsibilities with divergent semantics. This duplication raises fiscal maintenance risk because a future change could preserve one path while silently altering another.

The proposal addresses both concerns through bounded, evidence-first work: establish repeatable quality signals, characterize both balance-sheet paths, and only then converge duplicated implementation where the evidence permits it.

## Goals

1. Provide a reproducible monorepo quality baseline whose commands complete predictably and whose findings can be classified and tracked.
2. Distinguish baseline debt from regressions so future changes receive useful quality feedback without requiring an immediate repository-wide cleanup.
3. Characterize the observable behavior of both balance-sheet generators, including their divergent cases.
4. Remove one fiscal-critical duplicate only after characterization evidence defines which mechanics can be shared safely.
5. Preserve each caller's observable fiscal output until characterization evidence and explicit accounting authority establish a canonical contract.
6. Keep every delivery slice independently reviewable and at or below 400 changed lines.

## Non-goals

- Eliminating all 1,190 typecheck diagnostics or all 208 lint errors.
- Treating all current Knip findings as defects or enabling a noisy result as a blocking gate.
- Changing public APIs, database schemas, UI behavior, or product scope.
- Changing fiscal calculations, report meaning, SUNAT behavior, SIRE behavior, or compliance policy.
- Selecting a canonical balance-sheet interpretation based only on implementation preference.
- Broad refactoring of accounting, reporting, or unrelated monorepo packages.
- Modifying existing unrelated or untracked files.
- Proving a root cause for any failing tool before targeted investigation produces evidence.

## Safety invariants

1. **Caller behavior remains stable.** Each balance-sheet caller must retain its observable fiscal output while the implementations are characterized and consolidated.
2. **Canonicalization requires authority.** Divergent semantics may be unified only when characterization evidence and explicit accounting authority establish the canonical contract. Until then, intentional differences must remain explicit.
3. **Fiscal scope remains intact.** Existing RUC, company, and accounting-period boundaries must not be weakened, inferred differently, or bypassed.
4. **Fiscal primitives remain intact.** Existing money representation, rounding behavior, domain registries, and audit expectations must not be replaced or bypassed.
5. **External contracts remain unchanged.** Public API shapes, persistence schemas, SUNAT/SIRE integrations, and UI-visible behavior are protected from this change.
6. **Internal contracts change only with evidence.** An internal interface may change only when characterization tests demonstrate equivalence for every affected caller or preserve caller-specific behavior explicitly.
7. **Baseline work must not normalize regressions.** A recorded baseline identifies existing debt; it must not hide newly introduced diagnostics or silently weaken existing checks.
8. **Workspace boundaries are respected.** Existing unrelated and untracked files must not be edited, deleted, staged, or adopted into this change.
9. **Strict TDD governs implementation.** Later apply phases must add failing characterization or regression tests before changing balance-sheet production behavior.

## Initial bounded scope

### Included

- Root-level quality commands and the minimum configuration or documentation required to make architecture, typecheck, lint, and dead-code signals reproducible and understandable.
- Evidence-based classification of current diagnostics into baseline debt, tool/configuration failure, and actionable regression signals.
- Characterization tests around the two known balance-sheet generators and their current callers.
- A narrowly scoped consolidation seam that removes duplicated mechanics while retaining caller-specific semantics where they are not yet authorized for unification.
- Documentation of remaining semantic differences and the authority needed for future canonicalization.

### Excluded from the first slice

- Repository-wide diagnostic remediation.
- Unrelated dependency, formatting, naming, or architecture cleanup.
- Changes to fiscal policy or accounting interpretation.
- Expansion to other duplicate report generators unless separately proposed.

## Affected areas

| Area                     | Expected effect                                                                 |
| ------------------------ | ------------------------------------------------------------------------------- |
| Monorepo quality tooling | Commands become repeatable and produce classifiable results.                    |
| Quality documentation    | Maintainers receive a clear baseline, limitations, and regression policy.       |
| Balance-sheet tests      | Existing outputs and known divergence become executable evidence.               |
| Balance-sheet internals  | Shared mechanics may be extracted without changing caller-observable results.   |
| Review workflow          | Work is divided into bounded slices with explicit evidence and rollback points. |

Exact package paths and ownership boundaries will be confirmed during specification and design; this proposal does not infer them from incomplete evidence.

## Success metrics

The change is successful when:

1. Each selected quality command can be run from a documented repository context and produces a deterministic success, actionable failure, or explicitly classified baseline result instead of an unexplained crash or missing entry point.
2. The known typecheck and lint debt is captured without claiming that the observed counts are permanent or exhaustive, and a new regression can be distinguished from that captured debt.
3. Knip findings are either narrowed to a useful signal or documented as non-blocking with evidenced exclusions; noise is not presented as correctness.
4. Characterization tests cover both balance-sheet generators through their affected caller contracts, including fixtures that expose confirmed semantic divergence.
5. Consolidation removes the targeted duplicated mechanics while all characterization tests preserve each caller's prior observable output.
6. No public API, database schema, UI behavior, SUNAT/SIRE behavior, or authorized fiscal result changes.
7. Every PR remains at or below 400 changed lines and has a focused review path.
8. Existing unrelated and untracked files remain untouched.

## Expected delivery slices

The current evidence suggests the work should be delivered as a reviewable chain rather than one large PR. Final boundaries will be validated during task planning.

### Slice 1: Reproducible quality baseline

- Repair or replace only the broken quality entry points needed for trustworthy execution.
- Record observed typecheck, lint, architecture, and dead-code behavior.
- Define how baseline debt is separated from newly introduced regressions.
- Avoid broad diagnostic cleanup.

### Slice 2: Balance-sheet characterization

- Add strict-TDD characterization coverage for both generators and their caller-visible outputs.
- Capture divergent cases without declaring either implementation canonical.
- Document unresolved accounting decisions and required authority.

### Slice 3: Evidence-preserving consolidation

- Introduce the smallest shared implementation seam justified by the characterization suite.
- Preserve caller-specific adapters or policies wherever semantics remain divergent.
- Remove the targeted duplicate only when tests demonstrate behavior preservation.

If any slice forecasts more than 400 changed lines, task planning must divide it again before apply. Each child PR must remain independently understandable, identify its predecessor and successor, and avoid mixing baseline tooling with fiscal refactoring.

## Verification strategy

### Quality baseline verification

- Execute each documented quality command more than once from a clean, documented context to check reproducibility.
- Verify that missing-script and tool-crash outcomes are either resolved or converted into explicit, actionable failures.
- Compare diagnostics against the captured baseline and prove that a deliberately introduced representative regression would be reported rather than absorbed.
- Treat the observed counts as evidence snapshots, not acceptance targets or causal explanations.

### Balance-sheet verification

- Follow strict TDD: first establish failing characterization or regression tests, then make the smallest production change.
- Exercise both generators through affected caller contracts with representative company, RUC, period, account, empty-state, and divergent-semantic fixtures where those dimensions are supported by current behavior.
- Compare pre-change and post-change observable outputs for each caller.
- Require explicit accounting authority before changing any expected fiscal result.
- Run relevant unit and integration suites plus the repository's required fiscal compliance checks when the implementation touches fiscal execution paths.

### Boundary verification

- Confirm no public contract or database migration changed.
- Confirm SUNAT/SIRE flows and UI/product behavior are untouched.
- Confirm unrelated untracked files remain byte-for-byte outside the change scope.
- Confirm each PR stays within the 400-line review budget.

## Risks and mitigations

| Risk                                                          | Mitigation                                                                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A baseline suppresses new defects along with old debt.        | Use explicit baseline comparison and prove representative regressions remain visible.                                             |
| Tool failures are misdiagnosed from symptoms alone.           | Record observed failures separately from hypotheses; require minimal reproductions before changing dependencies or configuration. |
| Characterization codifies an accidental fiscal defect.        | Preserve behavior initially, label disagreements, and require explicit accounting authority before canonicalization.              |
| Shared code hides caller-specific accounting rules.           | Keep differences explicit through policies or adapters until equivalence is proven.                                               |
| Scope expands into repository-wide cleanup.                   | Enforce bounded acceptance criteria, separate follow-up work, and cap every PR at 400 changed lines.                              |
| Strict TDD or fiscal verification pushes a slice over budget. | Split characterization from consolidation and subdivide by caller or behavior boundary if needed.                                 |
| Existing untracked work is accidentally modified.             | Freeze the intended path set before implementation and verify workspace boundaries at every slice.                                |

## Rollback

Each slice must be independently reversible:

- Reverting the quality-baseline slice restores the previous commands/configuration without affecting application or fiscal behavior.
- Reverting characterization tests removes evidence only and does not require data rollback.
- Reverting consolidation restores the two prior implementations while retaining the characterization evidence when possible.

No database migration or persistent-data transformation is permitted, so rollback must not require data repair. If post-change output differs for any caller without prior accounting authorization, stop delivery and revert the consolidation slice rather than updating expected results to match the new output.

## Proposal decision record

The interactive proposal round established this binding decision:

> Preserve each caller's observable fiscal output until characterization evidence and explicit accounting authority establish the canonical contract.

This decision constrains subsequent specification, design, tasks, implementation, and verification.
