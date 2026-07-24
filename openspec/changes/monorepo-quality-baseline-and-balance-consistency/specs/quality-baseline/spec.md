# Quality Baseline Specification

## Purpose

Provide reproducible, reviewable monorepo quality signals without converting existing repository debt into a hidden regression or requiring repository-wide remediation.

## Requirements

### Requirement: Reproducible quality commands

The repository MUST document and expose the selected architecture, typecheck, lint, and dead-code quality checks from a documented repository context. Each check MUST terminate predictably as a success, an actionable failure, or an explicitly classified baseline/tooling result; missing entry points and unexplained tool crashes MUST NOT be presented as successful quality results.

#### Scenario: Repeated execution produces a comparable result

- GIVEN the documented repository context and the selected quality commands
- WHEN a maintainer executes the commands at least twice without changing the relevant inputs
- THEN each command terminates predictably and its result can be compared using the documented output or classification

#### Scenario: Broken tooling is explicit

- GIVEN a quality command has a missing script or incompatible tool failure
- WHEN the command is run
- THEN the result identifies the failing command and observed failure separately from any unverified root-cause hypothesis
- AND the result is not classified as a passing quality signal

### Requirement: Baseline-versus-regression classification

The quality baseline MUST record observed diagnostic or finding evidence with its command context and timestamp or equivalent run identity. A future result MUST distinguish findings matching the accepted baseline from newly introduced, changed, or otherwise actionable findings. Baseline capture MUST NOT suppress a representative new regression.

#### Scenario: Existing debt remains non-blocking but visible

- GIVEN a captured baseline containing existing typecheck, lint, architecture, or dead-code findings
- WHEN the same findings are observed in a later run
- THEN they remain visible as baseline debt and are not reported as newly introduced regressions

#### Scenario: A representative regression is detected

- GIVEN a captured baseline
- WHEN a representative new finding is introduced and the quality check is rerun
- THEN the comparison reports that finding as a regression or actionable change
- AND it is not absorbed into the baseline without an explicit baseline update

### Requirement: Dead-code findings have an honest gate status

Knip or equivalent dead-code findings MUST be classified using evidenced exclusions or explicitly documented as non-blocking when their signal remains too noisy. Noise MUST NOT be represented as correctness failure, and a non-blocking result MUST NOT be represented as a clean pass.

#### Scenario: Noisy findings are not silently promoted

- GIVEN dead-code analysis produces findings that cannot yet be reliably classified
- WHEN the quality baseline is recorded
- THEN the findings and limitations are documented as non-blocking or otherwise classified
- AND the command does not claim repository correctness solely from that result

### Requirement: Untracked-worktree isolation

The change MUST define an intended path set before implementation and MUST NOT edit, delete, stage, or adopt unrelated untracked files. Verification MUST establish that unrelated untracked files remain byte-for-byte unchanged and outside the change scope.

#### Scenario: Pre-existing untracked work is preserved

- GIVEN unrelated untracked files exist before a delivery slice
- WHEN the slice's commands, tests, and implementation are executed
- THEN those files remain unmodified, unstaged, and outside the slice's intended path set

### Requirement: Bounded delivery slices

Each delivery slice MUST remain at or below 400 changed lines and MUST have a focused review boundary. If a planned slice forecasts more than 400 changed lines, it MUST be subdivided before implementation by an explicit behavior or evidence boundary; baseline tooling work MUST remain separate from fiscal consolidation work.

#### Scenario: Oversized work is split before implementation

- GIVEN a slice forecast exceeds 400 changed lines
- WHEN task planning is completed
- THEN the slice is divided into independently reviewable child slices with explicit predecessor/successor boundaries
- AND no oversized slice is approved for implementation

### Requirement: Strict TDD for fiscal implementation

Any later production change to balance-sheet behavior MUST follow strict TDD: a failing characterization or regression test MUST be added first, then the smallest production change MUST be made, followed by the relevant test and fiscal verification commands. This specification phase MUST NOT modify production code, tests, tooling, or unrelated files.

#### Scenario: Production behavior cannot change without executable evidence

- GIVEN a proposed consolidation affecting balance-sheet execution
- WHEN implementation begins
- THEN a failing characterization or regression test exists before the production change
- AND the resulting change is verified against the affected caller contracts
