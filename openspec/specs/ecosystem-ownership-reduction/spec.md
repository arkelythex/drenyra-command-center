# Ecosystem Ownership Reduction Specification

## Purpose

This change establishes truthful dependency ownership for WU-1 while preserving the existing `drenyra-ai@0.2.0` runtime and all observable product and fiscal behavior. It also defines evidence gates for later ecosystem reduction without authorizing those later changes.

## Requirements

### Requirement: WU-1 declares the exact current dependency

For WU-1, `packages/mission-domain/package.json` MUST directly declare exactly `"drenyra-ai": "file:../../vendored/drenyra-ai-0.2.0.tgz"` in its runtime dependencies. The declarations in `packages/mission-domain`, `packages/mission-protocol`, and `packages/drenyra-orchestrator` MUST name that same exact artifact.

#### Scenario: Mission-domain has a truthful direct edge

- GIVEN the checked-in `vendored/drenyra-ai-0.2.0.tgz` artifact
- WHEN the WU-1 manifest is inspected
- THEN `packages/mission-domain/package.json` contains the exact required dependency declaration
- AND the three direct consumers contain identical artifact declarations

### Requirement: The lockfile has one resolution and no second pin

WU-1 MUST record one truthful Bun lock resolution for the exact `drenyra-ai@0.2.0` file artifact. The manifests and `bun.lock` MUST NOT introduce a second `drenyra-ai` pin, registry version, alternate path, or unresolved undeclared edge.

The only permitted additional lockfile normalization is the deterministic Bun 1.3.11 canonicalization of the root workspace's `undici` specifier from `"^8.10.0"` to `"8.10.0"`. This canonicalization is part of WU-1 only when the root manifest remains byte-identical and declares exact `undici: "8.10.0"`; the resolved `undici` package, version, and integrity remain unchanged; the lock change is exactly that root workspace-row replacement; no other unrelated normalization is present; and the candidate remains two files and behavior-neutral.

#### Scenario: Lock resolution is unique

- GIVEN all three direct-consumer manifests
- WHEN `bun.lock` and package dependency rows are inspected
- THEN exactly one `drenyra-ai@../../vendored/drenyra-ai-0.2.0.tgz` resolution is present
- AND each direct consumer resolves to that one entry
- AND no second pin or alternate resolution is present

#### Scenario: Bun canonicalizes only the root undici workspace row

- GIVEN Bun 1.3.11 generates the WU-1 lockfile from a root manifest that is byte-identical to its pre-change state and declares exact `undici: "8.10.0"`
- WHEN the complete two-file candidate diff is inspected
- THEN the manifest contains only the required mission-domain dependency edit
- AND the lockfile contains the expected mission-domain dependency row, the expected mission-domain workspace row, and exactly one root workspace-row change from `undici: "^8.10.0"` to `undici: "8.10.0"`
- AND the resolved `undici` package, version, and integrity are unchanged
- AND no other unrelated lock normalization, drenyra-ai resolution/integrity drift, alternate pin, or unknown hunk is accepted

### Requirement: WU-1 preserves artifact and runtime identity

WU-1 MUST leave the vendored tarball byte-identical, including its checksum, internal package identity, exports, and packed contents. Runtime module resolution MUST remain equivalent before and after the manifest correction.

#### Scenario: Existing artifact remains the runtime artifact

- GIVEN the pre-change checked-in tarball and its recorded checksum
- WHEN the dependency declaration and lockfile are corrected
- THEN the tarball checksum and internal version remain unchanged at `0.2.0`
- AND the export inventory remains unchanged
- AND `drenyra-ai/missions` and `drenyra-ai/receipts` resolve to the same artifact and entrypoints as before

### Requirement: WU-1 is behavior-neutral for direct consumers

The typecheck and conformance behavior of `packages/mission-domain`, `packages/mission-protocol`, and `packages/drenyra-orchestrator` MUST remain unchanged. Strict TDD evidence MUST cover mission status, transitions, errors, events, receipts, signatures, protocol behavior, review lenses, work routing, and relevant package conformance. A manifest correction MUST NOT be accepted if it changes observable behavior. Every required command that is green on the immutable pre-change baseline MUST remain green after the candidate. A required command that is already red on that baseline MAY be reported as a verified pre-existing failure/follow-up only through differential no-worsening evidence: its baseline command and output MUST be captured before mutation; normalized diagnostics MUST include exact path, line and column, TypeScript diagnostic code, and message; every diagnostic path MUST be outside the two-file candidate; the post-candidate command MUST return the exact same normalized diagnostic multiset and exit classification; and no new, removed, shifted, or changed diagnostic MAY be accepted silently. Any diagnostic difference MUST reject the candidate. A red pre-existing command MUST remain explicitly reported as a pre-existing failure/follow-up and MUST never be reported as PASS.

#### Scenario: Focused strict-TDD verification passes without drift

- GIVEN the corrected manifests and single lock resolution
- WHEN strict-TDD typecheck and focused conformance suites run for the three consumers
- THEN all applicable suites that were green on the immutable pre-change baseline pass
- AND mission, receipt, protocol, review, and routing behavior matches the pre-change baseline
- AND no runtime or contract discrepancy is accepted as a dependency fix
- AND the two-file, nine-authored-line WU-1 candidate remains within the declared scope

#### Scenario: A pre-existing red required command is accepted only with exact differential evidence

- GIVEN a required command was already red before mutation and its command and complete output were captured on the immutable pre-change baseline
- AND normalized diagnostics record exact path, line and column, TypeScript diagnostic code, and message for every diagnostic
- AND every diagnostic path is outside `packages/mission-domain/package.json` and `bun.lock`
- WHEN the same required command runs against the WU-1 candidate
- THEN its exit classification and normalized diagnostic multiset are exactly identical to the baseline
- AND the result is reported explicitly as a pre-existing failure/follow-up, never PASS
- AND no new, removed, shifted, or changed diagnostic is accepted silently

#### Scenario: Any diagnostic change rejects the candidate

- GIVEN a required command was red on the immutable pre-change baseline
- WHEN any normalized diagnostic is added, removed, shifted, changed, or points into either candidate file after mutation
- THEN the WU-1 candidate is rejected
- AND no unrelated source or product fix is made
- AND the manifest and lockfile remain eligible for exact atomic rollback

### Requirement: WU-1 changes no product or source behavior

WU-1 MUST NOT change source adapters, imports, runtime exports, contracts, fiscal calculations, persisted data, product behavior, mission lifecycle, approval authority, evidence, receipts, audit behavior, or SUNAT/UBL/IGV/detracción/SIRE/CDR behavior. It MUST NOT add a compatibility flag, second runtime, parallel contract, shadow state, copied sibling source, package deletion, or app deletion.

#### Scenario: Scope inspection finds only dependency truth

- GIVEN the WU-1 candidate
- WHEN changed paths, manifests, lock metadata, and source/runtime inventories are inspected
- THEN only the mission-domain manifest and required lock metadata are changed
- AND no source adapter, import, export, contract, fiscal, persisted-data, or product behavior changes
- AND `products/estado` files, manifests, locks, commands, configuration, and ownership boundaries are unchanged and excluded from counts

### Requirement: WU-1 is bounded and unrelated changes are rejected

WU-1 MUST contain exactly two changed files and exactly three total hunks across them:
one `packages/mission-domain/package.json` manifest hunk adding the exact dependency; one `bun.lock` root workspace metadata hunk canonicalizing root `undici` from `^8.10.0` to `8.10.0`; and one `bun.lock` mission-domain dependency/workspace-row hunk containing both mission-domain rows together. Unrelated changes MUST NOT be included, and the candidate MUST remain independently reviewable under the configured `auto-chain` delivery strategy and strict TDD policy.

#### Scenario: Candidate satisfies the work-unit budget

- GIVEN the frozen WU-1 candidate
- WHEN authored changed lines and changed paths are measured
- THEN exactly `packages/mission-domain/package.json` and `bun.lock` are changed
- AND the lockfile contains one mission-domain dependency/workspace-row hunk containing both mission-domain rows together, plus one root workspace metadata hunk canonicalizing `undici` from `^8.10.0` to `8.10.0`
- AND these two lockfile hunks plus the one manifest hunk are the complete three-hunk candidate
- AND no other unrelated lock normalization, drenyra-ai resolution/integrity drift, alternate pin, or unknown hunk is accepted
- AND authored changes are at most 400 lines
- AND no unrelated path or work unit is included
- AND strict-TDD evidence is attached to the same candidate

### Requirement: WU-1 rollback is exact and atomic

If explicit dependency declaration changes resolution or behavior, or if the permitted `undici` lock canonicalization cannot be verified as deterministic and behavior-neutral, rollback MUST restore `packages/mission-domain/package.json` and `bun.lock` together to their prior exact state. Rollback MUST NOT modify the vendored artifact, leave partial lock metadata, create a second pin, or use a compatibility workaround.

#### Scenario: Dependency discrepancy triggers exact rollback

- GIVEN a failed resolution, typecheck, conformance, or behavior-neutrality check
- WHEN WU-1 is rolled back
- THEN the mission-domain manifest and lockfile return to their exact pre-WU-1 state together
- AND the tarball remains unchanged
- AND no dual pin, shadow runtime, copied source, or parallel contract remains

### Requirement: Program reduction is evidence-gated

No Command Center package or app MAY be deleted, moved, extracted, or declared replaced by this change solely because of naming similarity, source visibility, SemVer, or an asserted extraction. A later deletion work unit MUST prove, as applicable: one named owner with a released consumable artifact or executable; observed behavioral and failure-precedence parity; recursive consumer and user-facing command/contract inventory; complete consumer migration through required adapters; persisted-data compatibility; executable operations, support, observability, and rollback; zero orphan commands/contracts; applicable fiscal and security review; native authorization for the exact candidate; and a net-negative reduction after temporary adapters are removed.

#### Scenario: Missing deletion evidence retains the surface

- GIVEN a prospective package or app deletion candidate
- WHEN any owner, parity, consumer, migration, compatibility, operations, orphan, review, reduction, or rollback evidence is missing
- THEN the surface remains KEEP, ADAPTER, REPLACE, or UNCLEAR
- AND no deletion task or deletion claim is authorized

### Requirement: Future 0.5.0 convergence is not authorized by WU-1

WU-1 MUST NOT migrate any consumer to `drenyra-ai@0.5.0` and MUST NOT make 0.5.0 convergence an active implementation task. A separate accepted CRITICAL/R3 scope with explicit human authority MUST be created before that work begins.

That future scope MUST require an approved released `0.5.0` artifact, package identity, checksum, and export inventory; one atomic pin state for all three direct consumers, the vendor artifact, lockfile, and stale version documentation; strict mission, receipt, fiscal, security, API/web, and orchestrator conformance; independent fiscal and security review; and native exact-candidate delivery authorization. It MUST NOT leave dual pins or an undeclared consumer. If the atomic scope exceeds 400 authored lines, it MUST obtain an explicit size exception rather than split an invalid intermediate state.

#### Scenario: 0.5.0 request is correctly deferred

- GIVEN a request to update one or more consumers to `drenyra-ai@0.5.0` during WU-1
- WHEN the candidate is evaluated against this specification
- THEN the request is rejected as outside WU-1 authority
- AND no 0.5.0 manifest, lock, artifact, documentation, source, or runtime change is made
- AND implementation waits for a separately accepted scope with all required authority and evidence

### Requirement: Foreign product boundary remains excluded

`products/estado` MUST remain outside Command Center ownership reduction. Its source, manifests, locks, commands, build configuration, tests, and ownership boundaries MUST NOT be modified, migrated, deleted, or counted as Command Center reduction work. It MAY be checked only for accidental foreign references when a separately authorized retirement work unit retires a shared name or command.

#### Scenario: Estado is excluded from WU-1 and program counts

- GIVEN WU-1 or a later Command Center reduction assessment
- WHEN affected paths and topology counts are computed
- THEN `products/estado` is excluded
- AND no Estado file or workspace behavior changes
- AND any foreign-reference check does not expand the authorized scope
