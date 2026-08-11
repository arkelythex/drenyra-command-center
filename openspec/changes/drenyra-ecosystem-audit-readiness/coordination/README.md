# Ecosystem Audit Readiness — Umbrella Coordination Program

Status: capability-scoped coordination program (planning artifacts). This README and
`ledger.schema.json` define the coordination contract. Nothing in this change asserts
that any child implementation, review, approval, or release has occurred.

## 1. Program scope

The Drenyra repository coordinates the ecosystem's production/audit-readiness program
through one canonical machine-readable ledger (`coordination/ledger.yaml`, contract in
`coordination/ledger.schema.json`) and this entry point. The program owns the registry
of children C1–C7, dependency decisions, the evidence index, exceptions, research
provenance, and derived readiness status. It does NOT own any child's SDD lifecycle,
review, delivery, or release.

## 2. Authority split

- Umbrella ledger: program registry, dependency decisions, evidence, derived status.
- Repository-local child SDD: every implementation unit's lifecycle, review, delivery,
  and release, owned by exactly one repository.
- Registration in the ledger is not executability. The umbrella references child
  authority (state paths, revisions) but never acts as that authority.

## 3. No-write boundary

- No product source: `apps/`, `packages/`, engines, services, contracts, country-packs.
- No sibling repositories: `drenyra-ai`, `drenyra-engram`, `drenyra-pi` are never
  written from this change; no cross-repository commit, diff, review, receipt, PR, or
  release.
- Apply writes stay under `openspec/changes/drenyra-ecosystem-audit-readiness/`
  (coordination tree only).

## 4. Effective unit threshold

`openspec/config.yaml` persists the repository convention of 400 changed lines per
unit. This program applies a stricter 300-line session/program override without
rewriting config: up to 300 may pass the size gate; 301–400 stays blocked even though
the repository convention would not trigger; above 400 both policies fail. Oversized
forecasts become dependency-ordered chains before apply.

## 5. Bootstrap chain and PR order

U1a README + schema → U1b bootstrap ledger + schema validator → U1c semantic hardening
→ U1d refactor → U2a resolver core → U2b graph safety → U2c reorder rule → U2d
resolver refactor → U3a H02/C1 guard → U3b line policy + exceptions → U3c C7 gate →
U3d evidence/research contracts → U3e child handoff → U3f compatibility import → U3g
guards/contracts refactor. PR order for the full chain: 1a → 1b → 1c → 1d → 2a → 2b
→ 2c → 2d → 3a → 3b → 3c → 3d → 3e → 3f → 3g → 4 (3a–3g = guards/contracts;
PR 4 = rollback, readback/status, verification and archival evidence). Delivery uses
`feature-branch-chain`: PR 1a targets the coordination feature branch and each
following PR targets its immediate predecessor.

## 6. H02 resume-only

C1 is the umbrella alias for the existing `drenyra-h02-tenant-isolation` change, never
a replacement. H02 is observed at `tasks`/`review-pending`, so C1 is derived `blocked`
with blocker `H02_REVIEW_PENDING`. No C1 unit, dependent child (C2, C3, C4, C6), or
executable label exists until H02 advances inside its own lifecycle. Creating any other
tenant-isolation SDD is a program violation.

## 7. C7 closed by default

C7 is conditional and `not-required`. It opens only through the seven-proof decision
rules with core-owner authority evidence; cleanup, migration, freshness, convenience,
and shim aesthetics are rejected triggers. C7 not opening never blocks program closure.

## 8. Handoff protocol (summary)

The umbrella appends a `child-handoff-requested` event (child ID, owner, baseline
defect, scope/non-goals, dependencies, executability, acceptance/evidence contracts,
300-line policy, suggested change ID, collision requirement, expiry) and claims nothing
about the child. The owner verifies identity, resumes existing authority (mandatory
for H02) or creates its own child, and returns repository-relative references at an
immutable revision. The umbrella validates and links; collisions return to the owner,
declined handoffs stay blocked, incomplete children stay planning, and the umbrella
never creates a surrogate sibling child.

## 9. How to read the ledger

Top-level fields are all required and fail-closed: unknown fields and unknown schema
versions are rejected (`additionalProperties: false`, version gating).

|Field|Content|
|---|---|
|`schema_version`|Version-gated contract version (`1.0.0`).|
|`program_id`|Immutable program identifier.|
|`ledger_revision`|Monotonic revision; every accepted mutation advances it.|
|`policy`|Program owner, effective 300-line limit, chain strategy.|
|`repositories`|Registry (`drenyra`, `drenyra-pi`, `drenyra-ai`, `drenyra-engram`).|
|`children`|C1–C7 records; exactly one owner each; typed derived state + blockers.|
|`evidence`|Immutable, repository-local evidence records.|
|`research`|Primary-source research provenance records.|
|`exceptions`|Recorded pre-apply size-gate exceptions (program-owner approved).|
|`events`|Append-only event log (prior/new state, evidence, revision, timestamp).|
|`program_status`|Capability-scoped derived status; never ecosystem-ready while C1–C6 are open.|

The ledger is the only mutable program state; markdown status is derived. References
are repository-relative at immutable revisions. This change does not claim that H02 or
any child can apply now.

## 10. Validator contract

`coordination/validator/` hosts the fail-closed checks applied before every ledger
transition. `schema-validator.ts` (U1b) validates the ledger against
`ledger.schema.json` (Ajv2020 strict: required top-level fields, unknown keys and
versions rejected); `semantic-validator.ts` (U1c) rejects path traversal, duplicate
event ids, owner mismatches, and stale concurrent writes. Both return
`{ valid, errors }` with sorted, deduplicated errors via the shared helper in
`validation-utils.ts`; shared fixture/ledger test helpers live in `test-utils.ts`.
The resolver family derives state: `resolver.ts` (U2a) resolves dependencies
topologically over canonical + recorded hard edges (cycles rejected), classifies
evidence valid/stale/contradictory/unverifiable without deleting history, and
never treats missing dependency evidence as not-applicable (least-advanced safe
state). `graph-safety.ts` (U2b) hard-binds C1 to `drenyra-h02-tenant-isolation`;
`reorder-rule.ts` (U2c) admits a C2/C3 reorder only with no-overlap evidence plus
a ledger decision; C1 precedence can never be bypassed. Shared resolver constants
(`isRecord`, `HARD_EDGES`, `MUTABLE_REVISION`) live in `validation-utils.ts`;
fixture names use `<area>-<scenario>.yaml` with canonical child-ID casing
(`graph-C1-bypass.yaml`).

The guard/contract family runs as deterministic early-reject gates before state
derivation, each fail-closed (U3a–U3f, consolidated in U3g): `h02-c1-guard.ts`
(U3a) keeps C1 blocked/H02_REVIEW_PENDING while H02 is `review-pending` and
rejects every executable-family claim for C1 or its dependents (C2, C3, C4, C6);
`line-policy.ts` (U3b) enforces the 300-line effective unit limit and validates
recorded exceptions (exact child/unit + scope digest, program-owner approval,
unexpired, waiving only the size gate); `c7-gate.ts` (U3c) keeps C7 `not-required`
unless the seven proofs plus core-owner authority open it atomically (at most
`planning` from the umbrella); `evidence-contract.ts` (U3d) rejects bare labels,
mutable revisions, contradictory proof, and cross-repository units, and treats
research without a primary source as unresolved risk; `handoff-protocol.ts` (U3e)
validates the two-party child-handoff payloads (at most planning, declined stays
blocked, collisions return to the owner, no sibling surrogate);
`compatibility-import.ts` (U3f) enforces the read-only legacy-state mapping and
the `legacy-import`/migration markers. Shared guard/contract helpers live in
`validation-utils.ts`: `readToken` (event-reason token extraction),
`passedEvidenceEntries` (passed + immutable-revision evidence filter),
`eventEntries` (events of one kind), `H02_CHANGE_ID`, and the state-family
constants `EXECUTABLE_FAMILY`, `BEYOND_PLANNING`, `BEYOND_BLOCKED`.
Fixtures under `coordination/fixtures/` are failure cases; `ledger.yaml` is the valid
corpus. Run the focused suite from the repo root:

```text
bunx vitest run --config openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/vitest.config.ts openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/
```

## 11. Operational readback and rollback (U4)

`coordination/scripts/readback.ts` derives operational status from the ledger — the
ledger is the ONLY mutable program state; readback output is derived, never written
back. Run it from the repo root:

```bash
bun openspec/changes/drenyra-ecosystem-audit-readiness/coordination/scripts/readback.ts
# optional: bun .../scripts/readback.ts <path-to-ledger.yaml>
```

Output is a deterministic report: ledger revision, validity, `ecosystem_ready`,
capability-scoped `readiness_scope` (never ecosystem-ready while any mandatory child
is unclosed), per-child derived state with blockers, and the next safe action. The
readback fails closed on stale concurrent writes (monotonic `ledger_revision`,
criterion 2), unsupported `ecosystem_ready` claims, `children_derived` mismatches,
and `program_status.revision` mismatches; exit code is 0 only for a valid ledger.

`rollback-recompute.ts` (U4.2, wired into the resolver) enforces criterion 15:
a `rollback` event requires verifiable proof (passed rollback-kind evidence at an
immutable revision referenced by `evidence_refs`); a child recorded `rolled-back`
without a rollback event fails closed; history is append-only (never deleted); and
every descendant relying solely on reverted proof derives
`blocked/ROLLBACK_INVALIDATED_DEPENDENCY`. No sibling is changed as compensation.
