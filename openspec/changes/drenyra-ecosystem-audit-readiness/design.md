# Design — Evidence-Driven Ecosystem Audit Readiness Coordination

## Decision

Drenyra coordinates the program through one canonical machine-readable ledger at `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/ledger.yaml`. Its contract is `coordination/ledger.schema.json` under the same change.

The ledger owns the program registry, dependency decisions, evidence index, exceptions, research provenance, and derived readiness status. It does not own any child's SDD lifecycle, review, delivery, or release. Those authorities remain repository-local, and no umbrella operation writes a sibling repository.

Coordination fails closed. Registration is not executability; unsupported status claims advance no gate; H02 remains the only C1 authority and is blocked while `review-pending`; C7 is closed by default; and the effective unit threshold is 300 changed lines rather than the repository convention of 400.

## Boundaries and files

|Concern|Authority|
|---|---|
|Program registry and readiness decision|Drenyra umbrella ledger|
|Child lifecycle|Child SDD in its owning repository|
|Review and delivery|Owning repository's native authority|
|Core release|Owning core repository after valid C7 opening|
|Unit-limit exception|Drenyra program owner for one exact unit|

Future coordination files are `coordination/ledger.yaml`, `coordination/ledger.schema.json`, and `coordination/README.md`. Product paths and sibling repositories are excluded.

## Canonical ledger contract

The ledger uses YAML and is checked against JSON Schema before every transition. It is the only mutable program-state source. Markdown status is derived. Every accepted mutation advances `ledger_revision` and appends an immutable event. The program owner is the single logical writer, with stale-revision protection.

References use repository IDs, repository-relative paths, and immutable revisions. Absolute paths, worktree paths, ambient branches, secrets, source snapshots, environment contents, and unbounded logs are invalid. Required top-level fields are `schema_version`, `program_id`, `ledger_revision`, `policy`, `repositories`, `children`, `evidence`, `research`, `exceptions`, `events`, and `program_status`. Unknown fields and schema versions fail closed.

The repository registry contains `drenyra`, `drenyra-pi`, `drenyra-ai`, and `drenyra-engram` with canonical identity, authority kind, and allowed child-artifact prefix. Registration establishes ownership boundaries, not write permission.

### Child registry and state

Each C1–C7 record contains one owner repository; authority mode (`existing`, `new-local`, or `external-reference`); change ID, repository-relative state path, and immutable revision; planning state; provenance-bearing observed lifecycle; derived program state and typed blockers; dependency conditions; mandatory/conditional flags; bounded units; acceptance references; and last event ID.

C1 is initialized with owner `drenyra`, authority mode `existing`, change ID `drenyra-h02-tenant-isolation`, state path `openspec/changes/drenyra-h02-tenant-isolation/state.yaml`, observed phase `tasks`, observed status `review-pending`, program state `blocked`, and blocker `H02_REVIEW_PENDING`.

|Program state|Meaning|
|---|---|
|`declared`|Registry entry only; no child authority linked.|
|`planning`|Owner accepted a handoff or is planning. Not executable.|
|`blocked`|Lifecycle, dependency, evidence, review, policy, or gate prevents execution.|
|`eligible`|Lifecycle and dependencies allow preparation of an exact unit.|
|`executable`|One exact unit has valid forecast and every pre-apply gate.|
|`executing`|Owning repository reports apply in progress.|
|`verified`|Child acceptance and regression evidence is valid.|
|`delivered`|Exact-unit review and delivery evidence is valid.|
|`closed`|Child closure/archive requirements are satisfied.|
|`rolled-back`|A delivered unit or consumer pin was reverted.|
|`superseded`|Explicit replacement retained in history; unavailable to duplicate H02.|
|`not-required`|Conditional C7 is closed by default.|

Observed child lifecycle and program state are separate. `eligible` never authorizes apply; `executable` applies only to the exact validated unit.

Each evidence record includes stable ID, kind, child/unit, owner repository, repository-relative authority path, immutable revision, subject digest or receipt/release identity, timestamp, collector role, typed result, bounded check result, useful test counts, and acceptance references. Evidence kinds are lifecycle, dependency, forecast, verification, review, delivery, release, rollback, and blocker. Owner mismatch, mutable identity, contradictory proof, or a bare `green`, `ready`, or `compatible` label cannot advance state.

## Dependency resolution

Initial hard edges are C1 to C2, C2 to C3, C3 to C4, C1 to C6, and C5 to C6. C5 may plan independently against its baseline pin, but its delivery must prove the exact pin and conformance. C7 has trigger conditions rather than an ordinary hard edge.

For every ledger revision, the resolver:

1. validates schema, IDs, repositories, paths, states, and policy consistency;
2. builds hard edges and rejects cycles, self-dependencies, missing mandatory children, or a conditional child other than C7;
3. classifies evidence as valid, stale, contradictory, or unverifiable without deleting history;
4. applies H02/C1 and C7 guards before general resolution;
5. resolves dependencies topologically, never treating missing evidence as not applicable;
6. maps observed child lifecycle through a compatibility adapter; missing, unknown, `review-pending`, and `implementation-blocked` fail closed;
7. validates exact-unit scope, line forecast, chain position, pre-apply gates, rollback boundary, and any exception;
8. derives the least-advanced safe state, with blockers overriding optimistic reports;
9. permits ecosystem readiness only when C1–C6 are closed and C7 is either closed after valid opening or remains `not-required`;
10. appends a decision event with inputs, reason codes, prior/new state, and revision.

Typed blockers include `AUTHORITY_MISSING`, `LIFECYCLE_NOT_EXECUTABLE`, `H02_REVIEW_PENDING`, `DEPENDENCY_UNSATISFIED`, `EVIDENCE_MISSING`, `EVIDENCE_STALE`, `EVIDENCE_CONTRADICTORY`, `FORECAST_MISSING`, `LINE_LIMIT_EXCEEDED`, `EXCEPTION_MISSING`, `QUALITY_GATE_FAILED`, `REVIEW_NOT_APPROVED`, `DELIVERY_NOT_PROVEN`, `C7_TRIGGER_INCOMPLETE`, and `ROLLBACK_INVALIDATED_DEPENDENCY`.

C2/C3 ordering can change only with evidence that affected areas and behavior do not overlap plus a ledger decision. C1 precedence cannot be removed. Identical validated input must produce identical derived states.

## Lifecycle transitions

The normal progression is `declared -> planning -> eligible -> executable -> executing -> verified -> delivered -> closed`. Any nonterminal stage may become `blocked`. Verified, delivered, or closed work may become `rolled-back`, after which dependency resolution determines `blocked` or `eligible`. C7 alone starts `not-required` and can enter planning only through its opening protocol.

Advancement requires a ledger event and valid evidence. Repository-local apply authority is required for `executing`; acceptance and regression proof for `verified`; exact-unit repository-local review/delivery proof for `delivered`; and archive/closure proof for `closed`. An unavailable verifier or ambiguous authority never implies pass.

## Exact H02/C1 handling

C1 is the umbrella alias for the existing `drenyra-h02-tenant-isolation` change, not a new change.

1. C1 authority mode is permanently `existing`.
2. C1 `change_id` must remain `drenyra-h02-tenant-isolation`; any alternative fails validation.
3. The baseline `tasks/review-pending` observation derives `blocked/H02_REVIEW_PENDING`.
4. The only safe next action is resuming H02's own review through H02's lifecycle.
5. The umbrella may record immutable review evidence but cannot approve, answer, or bypass the review.
6. No C1 unit becomes executable until H02 advances to an apply-permitting state and the exact W0–W6 unit passes all program gates.
7. Unit splitting may refine delivery boundaries but cannot remove H02 acceptance criteria.
8. C1 closes only when H02 is archived with valid tenant-isolation proof.
9. A duplicate tenant-isolation authority blocks the program rather than allowing authority selection.

This design does not claim H02 or C1 can apply now.

## Conditional C7

C7 begins conditional, non-mandatory, and `not-required`. Opening is one atomic decision requiring all seven specified proofs:

1. reproducible consumer failure from an executing C2–C5 child;
2. exact missing or contradictory behavior, producer, consumers, and immutable producer version;
3. reason a consumer adapter would violate ownership, duplicate canonical logic, weaken conformance, or create unacceptable risk;
4. smallest contract correction and named conformance scenarios;
5. proposed independent child SDD for each affected core repository;
6. compatible versioning, including a major release for a breaking frozen surface;
7. producer conformance, versioned release, exact consumer pin, and consumer verification gates.

The umbrella validates the request but creates no core child files. A core repository owner creates its own child and returns immutable authority evidence. Before that, C7 is at most `planning`. Missing any proof leaves C7 `not-required` or `blocked/C7_TRIGGER_INCOMPLETE`; partial opening is forbidden. Cleanup, speculative migration, freshness, convenience, and shim aesthetics are rejected triggers. A safe consumer-local correction stays with the consumer.

## Safe umbrella-to-child handoff

The umbrella appends a `child-handoff-requested` event containing child ID, owner, baseline defect, scope and non-goals, dependencies, current executability, acceptance/evidence contracts, effective 300-line policy, suggested change ID, collision requirement, and expiry. It makes no claim that the child exists or can apply.

The owning repository independently verifies identity and conventions, checks for equivalent authority, resumes existing authority when present, otherwise creates the child through its own SDD flow, and returns repository-relative references at an immutable revision. H02 must always take the resume path.

The umbrella then validates and links the reference. Drenyra-owned children still use separate child lifecycles. Sibling children remain handoff requests until their owners act; the umbrella never writes those repositories. Existing equivalent work is linked, an ID collision returns to the owner, a declined handoff remains blocked, an incomplete child remains planning, and unverifiable authority becomes blocked.

## Evidence protocol

After every lifecycle transition, gate, approved review, release, rollback, or blocker discovery, the child owner submits bounded immutable metadata: repository, child/unit, revision, authority path, digest/receipt/release identity, check result, useful test counts, acceptance mapping, timestamp, actor role, and typed outcome.

Validation checks ownership and path containment; immutable identity; lifecycle compatibility; non-invalidated predecessor proof; mapping to baseline defect and acceptance criteria; forecast and actual changed-line count with generated/mechanical work separate; applicable regression, security, correctness, live, and contract gates; exact-unit review/delivery binding; freshness after rollback or supersession; and privacy/bounded output. Cross-repository contract proof additionally records producer version/tag, artifact checksum or equivalent identity, consumer pin, and producer/consumer conformance. Invalid evidence remains in history with a rejection event and advances no state.

## Line policy and exceptions

`openspec/config.yaml` persistently defines the 400-line repository convention. This approved program applies a 300-line session/program override without rewriting config. The coordinator uses the stricter threshold.

- Up to 300 changed lines: the size gate may pass.
- From 301 through 400: the program blocks apply even if the repository convention does not trigger.
- Above 400: both policies apply; one cannot waive the other.
- A future stricter repository threshold automatically wins.
- Oversized forecasts must become dependency-ordered, rollback-safe units before apply.

An exception is valid only when recorded before apply for one exact child/unit and scope digest. It includes the proposed ceiling, forecast evidence, rationale, alternatives considered, reviewer-impact mitigation, rollback boundary, requester, Drenyra program-owner approval, timestamp, and ledger revision. It expires when scope, forecast, authority, dependencies, or rollback boundary changes. It waives only the program size gate, never child review, regression, security, correctness, delivery, or ownership gates. Blanket and cross-repository exceptions are invalid.

## Research provenance

Research records live in the ledger's `research` map and link to affected evidence and decisions. Each stores child ID, exact time-sensitive uncertainty, relevance confirmation, primary-source URL, publisher, title, retrieval time, source version/date when available, content digest when lawful, affected requirement, and whether the source confirmed, changed, or left the decision unresolved.

Research occurs in the owning child. Without an adequate primary source, the record states unresolved risk and cannot support a factual claim. Repository-established facts use repository evidence instead. SUNAT/OSE callback authentication in C1, SUNAT/UBL decimal serialization in C2, and Vite/plugin compatibility in C3 remain prompts until each child confirms relevance.

## Failure, pause, and rollback

Schema, graph, ownership, or evidence failure rejects the transition and preserves the prior ledger revision. Revision conflicts require re-resolution. Failed gates block the child and applicable descendants. Partial sibling handoffs remain requested/planning; no local surrogate is created. If H02 review is declined or escalated, C1 stays blocked and C2, C3, C4, and C6 cannot claim C1-dependent executability.

The program may pause without reverting completed child work. A pause records cause, affected children, and last valid revision.

Rollback is repository-local. The owner reverts the smallest delivered unit or restores the prior immutable consumer pin through its own process and supplies rollback revision, checks, and delivery proof. The ledger appends `rolled-back` without deleting history and recomputes all descendants. Dependencies relying only on reverted proof become `blocked/ROLLBACK_INVALIDATED_DEPENDENCY`. No sibling is changed as compensation. Published artifacts are not silently changed; recovery uses a new compatible release or explicit pin rollback. C7 must satisfy every opening rule again if reopening is needed. Unverifiable rollback proof records a blocker and cannot produce a false rolled-back state.

## Migration and compatibility

The ledger is a coordination overlay. Existing proposal, spec, design, tasks, state, apply-progress, verify, review, and archive artifacts remain authoritative for their own changes and are not rewritten.

|Existing observation|Program interpretation|
|---|---|
|no `state.yaml`|planning evidence only; non-executable|
|`review-pending`|blocked|
|`implementation-blocked`|blocked|
|planning artifacts without executable state|planning|
|apply-permitting state with dependencies|eligible; exact-unit gates still required|
|implemented/verified/completed|observed progress; closure proof still required|
|archived with acceptance proof|eligible for program closure evaluation|
|unknown legacy state|blocked until mapped|

Bootstrap imports references and bounded snapshots marked `legacy-import`; immutable proof is required for later advancement. H02 is imported by reference as C1 and preserves `review-pending`. Sibling OpenSpec/hybrid differences are normalized only at the evidence metadata boundary.

Backward-compatible schema additions use a minor version and non-advancing defaults. Semantic changes use a major version and explicit migration report. Unknown versions fail closed. Migration events record source/target versions, tool version, before/after digests, and validation result. Migration rollback restores the prior ledger revision and never rewrites child artifacts.

## Data flow

Child repository-local authority supplies bounded immutable evidence through its owner. The validator checks ownership, identity, lifecycle, dependencies, and gates. The revisioned ledger records accepted or rejected evidence. The deterministic resolver applies dependency, H02, C7, and line-policy guards, then emits child program states, capability-scoped readiness, and the next safe action. There is no write path from the ledger into a sibling repository.

## Validation criteria

Schema fixtures and deterministic resolver tests must prove:

1. valid C1–C7 bootstrap passes; missing fields, unknown keys, path traversal, duplicate IDs, owner mismatch, and unknown versions fail;
2. stale concurrent writes fail and event revisions remain monotonic;
3. identical input produces identical derived state;
4. H02 `review-pending` always leaves C1 blocked and prevents every C1-dependent executable claim;
5. H02 approval alone is insufficient without exact-unit forecast and pre-apply gates;
6. missing dependency evidence blocks even when a summary says green;
7. graph cycles, C1 bypass, alternate C1 authority, and duplicate tenant children fail;
8. C2/C3 reorder passes only with no-overlap proof and intact C1 precedence;
9. C5 resolves independently while C6 requires both C1 and C5;
10. a 300-line forecast passes the size boundary, 301 fails without exception, and 301–400 remains blocked despite the persistent convention;
11. scope changes invalidate exception authorization and an exception waives only the size gate;
12. bare labels, mutable revisions, contradictory proof, and cross-repository units advance zero gates;
13. C7 opens in zero fixtures unless all seven proofs and core-owner authority exist;
14. research without a primary source is unresolved risk, not fact;
15. rollback preserves history and invalidates each descendant relying solely on reverted proof;
16. repository diff inspection finds only OpenSpec coordination artifacts and no product or sibling writes.

Every advancing event must contain prior/new state, evidence reference, timestamp, and revision. Every child must name exactly one owner. Every current policy evaluation must produce 300 as the effective threshold. Ecosystem-wide readiness requires C1–C6 closure while unopened C7 remains `not-required`.

## Rollout

1. Create and validate schema and bootstrap ledger with C1–C7, H02 blocked, and C7 not required.
2. Run schema, dependency, H02, C7, line-policy, evidence, and rollback fixtures without creating children.
3. Link H02 by reference and import other existing authorities only after owner/scope validation.
4. Issue future child handoffs; sibling owners act only in their repositories.
5. Update the ledger after validated events and publish capability-scoped status until mandatory closure.
6. Permit ecosystem-wide audit-readiness language only after C1–C6 close and C7 is either validly closed or validly not required.

## Risks

|Risk|Mitigation|
|---|---|
|Ledger mistaken for child authority|Separate observed lifecycle from derived state and require repository-local immutable proof.|
|Ledger history corruption|Schema checks, monotonic revision, append-only events, stale-write protection, and Git history.|
|H02 duplication|Hard-bind C1 to H02 and reject duplicate tenant authority.|
|Mid-range units bypass program policy|Apply the stricter threshold and test the boundary explicitly.|
|Sibling handoff becomes an unauthorized write|Two-party request/acceptance with references only.|
|C7 becomes cleanup work|Atomic seven-proof opening rule and rejected trigger classes.|
|Stale evidence leaves false executability|Immutable binding and descendant recomputation after rollback/supersession.|
|Legacy state is ambiguous|Read-only adapter; unknown states fail closed.|
|Research becomes timeless truth|Store source, retrieval time, uncertainty, decision effect, and unresolved risk.|

## Next step

Create coordination-only tasks for schema and ledger bootstrap, deterministic validator/resolver fixtures, H02/C1 and C7 guards, 300-line override enforcement, evidence/research/exception contracts, compatibility import, and operational readback. Tasks must exclude product-source edits, sibling-repository writes, C1 apply work, and speculative C7 creation.
