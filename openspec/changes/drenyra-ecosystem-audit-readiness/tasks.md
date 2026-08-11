# Tasks — Ecosystem Audit Readiness (umbrella coordination)

## Review Workload Forecast

|Field|Value|
|-------|-------|
|Estimated changed lines|~2,095–3,230 across 16 chained PR units (U1a–U1d = 700–970, U2a–U2d = 405–670, U3a–U3g = 630–990, U4 = 360–600)|
|400-line budget risk|High|
|Chained PRs recommended|Yes|
|Suggested split|PR 1a README+schema → PR 1b bootstrap ledger+schema validator → PR 1c semantic hardening → PR 1d refactor → PR 2a resolver core → PR 2b graph safety → PR 2c reorder rule → PR 2d resolver refactor → PR 3a H02/C1 guard → PR 3b line policy+exceptions → PR 3c C7 gate → PR 3d evidence/research contracts → PR 3e child handoff → PR 3f compatibility import → PR 3g guards/contracts refactor → PR 4 readback+rollback+verification/archival|
|Delivery strategy|ask-on-risk|
|Chain strategy|feature-branch-chain (confirmed by program owner)|

```text
Decision needed before apply: No — U1a–U1d, U2a–U2d, and U3a–U3g rescopes authorized by program owner; only U4 (360–600) oversized rescope still pending before its apply
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

This umbrella change is forecast to exceed 400 changed lines, so it must be delivered as a dependency-ordered chain of bounded repo-local units (U1a–U1d, U2a–U2d, U3a–U3g, U4). The Drenyra program owner confirmed `feature-branch-chain`: PR 1a targets the coordination feature branch and each following PR targets its immediate predecessor (1a → 1b → 1c → 1d → 2a → 2b → 2c → 2d → 3a → 3b → 3c → 3d → 3e → 3f → 3g → 4). The program's own 300-line unit rule applies to this change's units too: each unit records its exact pre-apply forecast, and any unit forecast above 300 lines splits further before apply.

**Rescope record (authorized):** Unit U1 was blocked pre-write because its per-task forecasts summed to 530–850 lines while its header claimed ~250–300 — the same document could not be both the unit estimate and the per-task forecast source. On program-owner authorization the runtime objective was reset (`objective/reset`, request_id `171854b4-1724-4b30-94d6-e6da1a7ee1f7`, actor `drenyra-program-owner`). U1 is replaced below by dependency-ordered U1a–U1d, each ≤300 lines, preserving the RED → GREEN → REFACTOR TDD arc and the `feature-branch-chain`. Unit U2 was rescoped the same way: its true forecast (360–600) exceeds the 300-line unit limit, so on program-owner authorization U2.1–U2.5 are replaced below by dependency-ordered U2a–U2d, each ≤300 lines (U2a 190–280, U2b 100–170, U2c 75–140, U2d 40–80), preserving the resolver requirements, the RED → GREEN → TRIANGULATE → REFACTOR arc (the U2.3/U2.4 TRIANGULATE cases ship as their own RED → GREEN hardening slices because graph-safety and reorder checks need production code; only the cycle case is pure TRIANGULATE via U2a.2's topological ordering), the `feature-branch-chain` (PR 2a → 2b → 2c → 2d → 3 → 4), the scope boundary, and the criterion mapping. The U1a.1 README chain reference (…→ 2) is superseded and refreshed by U2d.1. Full records: `apply-progress.md` → "Reset record" and "U2 rescope record". Unit U3 was rescoped the same way: its true forecast (630–990: U3.1 70–110 + U3.2 100–160 + U3.3 80–120 + U3.4 70–110 + U3.5 90–140 + U3.6 80–120 + U3.7 90–140 + U3.8 50–90) exceeds the 300-line unit limit, so on program-owner authorization U3.1–U3.8 are replaced below by dependency-ordered U3a–U3g, each ≤300 lines (U3a 170–270, U3b 80–120, U3c 70–110, U3d 90–140, U3e 80–120, U3f 90–140, U3g 50–90), preserving the H02/C1 guard, line exceptions, C7 gate, evidence/research contracts, child-handoff protocol, compatibility import, and refactor requirements, the strict TDD arc (each production-code TRIANGULATE area ships as its own RED → GREEN hardening slice; U3g is the REFACTOR stage), the `feature-branch-chain` (PR 3a → 3b → 3c → 3d → 3e → 3f → 3g → 4), the scope boundary, and the criterion mapping. U3g.1 refreshes the README chain-order reference to include 3a–3g. Full record: `apply-progress.md` → "U3 rescope record". U4 (360–600) remains forecast-over-300 and still requires the same program-owner rescope authorization before its apply (flagged in the per-unit header below).

## Scope guard

- This change's apply writes **only** under `openspec/changes/drenyra-ecosystem-audit-readiness/` (canonical coordination files: `coordination/ledger.yaml`, `coordination/ledger.schema.json`, `coordination/README.md`; plus `coordination/fixtures/`, `coordination/validator/`, `coordination/scripts/` for executable coordination tooling).
- **No product source** (`apps/`, `packages/`, engines, services, contracts) and **no sibling-repository writes** (`drenyra-ai`, `drenyra-engram`, `drenyra-pi`). Every task below asserts `Cross-repo writes: none`.
- This change implements coordination artifacts only. Child implementation is separate repo-scoped SDD work (see "Future repo-scoped child SDD work" below) — never applied from here.
- Governing inputs: `proposal.md`, `design.md`, `specs/ecosystem-audit-readiness/spec.md`, `explore.md`. Strict TDD (`strict_tdd: true`, bun/vitest) applies to every executable coordination artifact: RED → GREEN → TRIANGULATE → REFACTOR, with recorded runner, commands, and exit codes.

---

## Unit U1a — README + schema contract (PR 1a, est. 210–290 lines)

- [x] **U1a.1** Create `coordination/README.md` documenting the program. <!-- sdd-owner: implementation -->
  - **Intent:** Single reviewable entry point stating program scope, one-owner-per-child authority, the no-write boundary (no product source, no siblings), the effective 300-line threshold (program override of the 400-line config), the U1a–U1d bootstrap chain and its PR order (1a → 1b → 1c → 1d → 2), H02 resume-only, C7 closed-by-default, and the handoff protocol summary.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/README.md` only.
  - **Acceptance:** README states the authority split (umbrella ledger vs repository-local child SDD), the no-cross-repo-write rule, the 300-line effective threshold, and how to read the ledger; diff touches only the coordination tree.
  - **Dependency:** none.
  - **Pre-apply forecast:** required (60–100 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U1a.2** Define `coordination/ledger.schema.json`. <!-- sdd-owner: implementation -->
  - **Intent:** Canonical fail-closed JSON Schema for the ledger: required top-level fields `schema_version`, `program_id`, `ledger_revision`, `policy`, `repositories`, `children`, `evidence`, `research`, `exceptions`, `events`, `program_status`; typed child/evidence/research/exception/event records; unknown fields and unknown versions rejected (`additionalProperties: false`, version gating).
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/ledger.schema.json` only.
  - **Acceptance:** Schema validates the U1b bootstrap ledger; missing top-level fields, unknown keys, and unknown versions fail; child records require exactly one owner and typed program-state domain.
  - **Dependency:** U1a.1 (documented contract first).
  - **Pre-apply forecast:** required (150–190 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U1b — Bootstrap ledger + schema-level validator (PR 1b, est. 230–300 lines)

- [x] **U1b.1** RED: bootstrap `coordination/ledger.yaml` (valid corpus) + schema-failure fixtures and failing tests. <!-- sdd-owner: implementation -->
  - **Intent:** The bootstrap ledger is the unit's valid corpus: repository registry (`drenyra`, `drenyra-pi`, `drenyra-ai`, `drenyra-engram`); children C1–C7 with one owner each; C1 = existing authority `drenyra-h02-tenant-isolation`, state path `openspec/changes/drenyra-h02-tenant-isolation/state.yaml`, observed `tasks`/`review-pending` → derived `blocked` with blocker `H02_REVIEW_PENDING`; C7 `not-required`; policy with effective threshold 300; empty evidence/research/exceptions; initial append-only events; `ledger_revision` monotonic; `program_status` capability-scoped (never ecosystem-ready). Schema-failure fixtures cover design criterion 1 at schema level only: missing top-level fields, unknown keys, unknown schema versions. Tests target a validator module that does not yet exist.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/ledger.yaml`, `coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** Tests fail for the correct reason (module absent) — recorded RED evidence with runner command (`bun run` + vitest against the coordination validator) and exit code; bootstrap ledger keeps C1 `blocked/H02_REVIEW_PENDING` and C7 `not-required`; every child names exactly one owner.
  - **Dependency:** U1a.2.
  - **Pre-apply forecast:** required (190–240 lines: ledger ~155–195, 3 schema-failure fixtures ~30–45, RED tests ~35–55); generated/mechanical ledger bulk identified separately.
  - **Cross-repo writes:** none.

- [x] **U1b.2** GREEN: minimal schema validator. <!-- sdd-owner: implementation -->
  - **Intent:** Implement YAML→JSON-Schema validation with fail-closed semantics for the schema-level slice: missing top-level fields rejected, unknown keys rejected (`additionalProperties: false`), unknown schema versions rejected (version gating); identical input yields identical verdicts (determinism).
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only; tests from U1b.1).
  - **Acceptance:** All U1b.1 tests green; every schema-failure fixture rejected; bootstrap ledger passes; repeated runs deterministic.
  - **Dependency:** U1b.1.
  - **Pre-apply forecast:** required (40–60 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U1c — Semantic hardening: traversal/ID/owner/stale-write (PR 1c, est. 220–300 lines)

- [x] **U1c.1** RED: traversal, duplicate-ID, owner-mismatch, stale-write, and determinism fixtures and failing tests. <!-- sdd-owner: implementation -->
  - **Intent:** Remaining design criterion 1 plus criteria 2–3 (checks not expressible as pure JSON Schema): path traversal in repository-relative references; duplicate child IDs; owner mismatch (child names a repository other than its single owner); stale concurrent writes (monotonic `ledger_revision` enforcement); determinism (identical input ⇒ identical verdicts). Tests target the existing validator module's missing semantic checks.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-semantic-check reason only; bootstrap ledger unchanged.
  - **Dependency:** U1b.2.
  - **Pre-apply forecast:** required (130–190 lines: ~5 fixture pairs ~90–140, RED tests ~40–50); record before apply.
  - **Cross-repo writes:** none.

- [x] **U1c.2** GREEN: validator hardening. <!-- sdd-owner: implementation -->
  - **Intent:** Implement semantic checks: deny path traversal in repository-relative references; reject duplicate IDs; reject owner mismatch; reject stale concurrent writes; determinism guarantee. No behavior change to U1b schema-level checks.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only; tests from U1c.1).
  - **Acceptance:** All U1c.1 tests green; U1b suite still green; bootstrap ledger unaffected.
  - **Dependency:** U1c.1.
  - **Pre-apply forecast:** required (90–110 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U1d — REFACTOR/consolidation (PR 1d, est. 40–80 lines)

- [x] **U1d.1** REFACTOR: consolidate validator structure and fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** Extract shared validation helpers, deduplicate fixture assertions, document the schema/validator contract in README; no behavior change.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/` (README, validator, fixtures).
  - **Acceptance:** Full U1a–U1d suites green after refactor; diff restricted to coordination tree.
  - **Dependency:** U1c.2.
  - **Pre-apply forecast:** required (40–80 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U2a — Resolver core: RED fixtures + deterministic resolver (PR 2a, est. 190–280 lines)

- [x] **U2a.1** RED: resolver fixtures for dependency graph and determinism. <!-- sdd-owner: implementation -->
  - **Intent:** Fixtures for design criteria 2–3, 6, 9: hard edges C1→C2→C3→C4, C1→C6, C5→C6; identical input ⇒ identical derived state; missing dependency evidence blocks even when a summary says green; C5 resolves independently; C6 requires both C1 and C5. Tests target a resolver module that does not exist.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for module-absent reason only.
  - **Dependency:** U1d.
  - **Pre-apply forecast:** required (~90–130 lines incl. fixtures); record before apply.
  - **Cross-repo writes:** none.

- [x] **U2a.2** GREEN: deterministic resolver. <!-- sdd-owner: implementation -->
  - **Intent:** Implement topological dependency resolution with typed blockers (cycle rejection is inherent to topological ordering), evidence classification (valid/stale/contradictory/unverifiable, history preserved), fail-closed lifecycle compatibility, least-advanced safe state derivation, and determinism; never treats missing evidence as not-applicable. Graph-safety (criterion 7) and reorder-proof (criterion 8) checks ship in U2b.2/U2c.2.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only).
  - **Acceptance:** U2a.1 green; resolvers derive `blocked`/`eligible` correctly for the fixture matrix; identical inputs ⇒ identical outputs.
  - **Dependency:** U2a.1.
  - **Pre-apply forecast:** required (~100–150 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U2b — Graph safety: RED fixtures + hardening (PR 2b, est. 100–170 lines)

- [x] **U2b.1** RED: graph-safety fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** Criterion 7: cycles, C1 bypass, alternate C1 authority, and duplicate tenant-isolation authority all fail; a duplicate H02 blocks the program rather than allowing authority selection. Carried over from U2.3; the cycle case may already pass via U2a.2's topological ordering — record the actual per-case result.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** RED evidence recorded (runner, command, exit); at least the C1-bypass, alternate-authority, and duplicate-tenant cases fail for missing graph-safety check reason.
  - **Dependency:** U2a.2.
  - **Pre-apply forecast:** required (~60–100 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U2b.2** GREEN: graph-safety hardening. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the graph-safety checks: C1 hard-bound to `drenyra-h02-tenant-isolation`; alternate C1 authority and duplicate tenant-isolation authority rejected program-wide with typed blockers; all four U2b.1 negative cases rejected. No behavior change to U2a checks.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only; tests from U2b.1).
  - **Acceptance:** All U2b.1 cases rejected with correct blockers; U2a suite still green; bootstrap ledger unaffected.
  - **Dependency:** U2b.1.
  - **Pre-apply forecast:** required (~40–70 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U2c — Reorder rule: RED fixtures + hardening (PR 2c, est. 75–140 lines)

- [x] **U2c.1** RED: C2/C3 reorder rule fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** Criterion 8: C2/C3 reorder passes only with recorded no-overlap evidence plus a ledger decision; C1 precedence can never be bypassed. Carried over from U2.4.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`, `coordination/ledger.yaml` (decision-record support only).
  - **Acceptance:** RED evidence recorded (runner, command, exit); reorder-without-proof fails for missing reorder-rule check reason.
  - **Dependency:** U2b.2.
  - **Pre-apply forecast:** required (~50–90 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U2c.2** GREEN: reorder-rule hardening. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the reorder rule: a C2/C3 reorder passes only with recorded no-overlap evidence plus a ledger decision event; reorder without proof fails closed; C1 precedence never bypassable.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only; tests from U2c.1).
  - **Acceptance:** All U2c.1 cases derive correct verdicts; U2a–U2b suites still green.
  - **Dependency:** U2c.1.
  - **Pre-apply forecast:** required (~25–50 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U2d — REFACTOR/consolidation (PR 2d, est. 40–80 lines)

- [x] **U2d.1** REFACTOR: resolver/validator consolidation. <!-- sdd-owner: implementation -->
  - **Intent:** Extract resolver helpers, normalize fixture naming, document resolver semantics in README, and refresh the README chain-order reference (1a → 1b → 1c → 1d → 2a → 2b → 2c → 2d → 3 → 4); no behavior change.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/` (README, validator, fixtures).
  - **Acceptance:** Full U1a–U1d + U2a–U2d suites green; diff restricted to coordination tree.
  - **Dependency:** U2c.2.
  - **Pre-apply forecast:** required (~40–80 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3a — H02/C1 guard (PR 3a, est. 170–270 lines)

- [x] **U3a.1** RED: H02/C1 guard fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** Design criteria 4–5: `review-pending` always leaves C1 blocked and prevents every C1-dependent executable claim (C2, C3, C4, C6); H02 approval alone is insufficient without exact-unit forecast and pre-apply gates. Tests target a guard module that does not exist.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-guard reason only.
  - **Dependency:** U2d.1.
  - **Pre-apply forecast:** required (~70–110 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U3a.2** GREEN: H02/C1 guard. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the guard: C1 derived state stays `blocked/H02_REVIEW_PENDING` while H02 is `review-pending`; only an H02-internal state advance plus exact-unit forecast/gates can raise C1 to `eligible`/`executable`; any alternate C1 authority or duplicate tenant change blocks the program.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only; tests from U3a.1).
  - **Acceptance:** U3a.1 green; no artifact path can label C1 or dependents executable while H02 is `review-pending`.
  - **Dependency:** U3a.1.
  - **Pre-apply forecast:** required (~100–160 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3b — Line policy and exceptions (PR 3b, est. 80–120 lines)

- [x] **U3b.1** RED: line-policy and exception fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** TRIANGULATE (criteria 10–11) — boundary cases need production enforcement code, so they ship as their own RED → GREEN hardening slice: 300-line forecast passes, 301 fails without exception, 301–400 stays blocked despite the persistent 400-line config convention; exceptions per exact child/unit + scope digest fail closed on any missing field. Tests target a line-policy module that does not exist.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`, `coordination/ledger.yaml` (exceptions map support only).
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-line-policy reason only.
  - **Dependency:** U3a.2.
  - **Pre-apply forecast:** required (~50–75 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U3b.2** GREEN: line-policy and exception enforcement. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the boundary and exception rules: 301 fails without exception; 301–400 blocked despite the persistent convention; exceptions recorded before apply with rationale/alternatives/reviewer-impact mitigation and program-owner approval; scope changes invalidate the exception; an exception waives only the size gate; blanket and cross-repository exceptions are invalid.
  - **Allowed paths:** `coordination/validator/` (source only; tests from U3b.1).
  - **Acceptance:** U3b.1 green; boundary fixtures pass/fail exactly as specified; exception records enforce the full field set and expiry rules.
  - **Dependency:** U3b.1.
  - **Pre-apply forecast:** required (~30–45 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3c — C7 gate (PR 3c, est. 70–110 lines)

- [x] **U3c.1** RED: C7-gate fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** TRIANGULATE (criterion 13): C7 opens in zero fixtures unless all seven proof elements plus core-owner authority exist; opening is one atomic decision; cleanup/migration/speculative-reuse/freshness/convenience/shim-aesthetics triggers rejected; partial opening impossible; safe consumer-local corrections stay with the consumer. Tests target a C7-gate module that does not exist.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-C7-gate reason only.
  - **Dependency:** U3b.2.
  - **Pre-apply forecast:** required (~45–70 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U3c.2** GREEN: C7 gate. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the atomic C7 opening decision: all seven proofs plus core-owner authority required; rejected trigger classes; C7 at most `planning` with core-owner authority evidence (never executable from the umbrella), otherwise `not-required` or `blocked/C7_TRIGGER_INCOMPLETE`.
  - **Allowed paths:** `coordination/validator/` (source only; tests from U3c.1).
  - **Acceptance:** U3c.1 green; C7 stays `not-required` in all non-qualifying fixtures; full-proof fixture transitions C7 at most to `planning`.
  - **Dependency:** U3c.1.
  - **Pre-apply forecast:** required (~25–40 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3d — Evidence and research contracts (PR 3d, est. 90–140 lines)

- [x] **U3d.1** RED: evidence and research contract fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** TRIANGULATE (criteria 12 and 14): bare `green`/`ready`/`compatible` labels, mutable revisions, contradictory proof, and cross-repository units advance zero gates; research records require primary source URL, publisher, retrieval time, exact uncertainty, and decision effect — no primary source ⇒ unresolved risk, never a factual claim; repository-established facts are cited from repo evidence, not browsed. Tests target a contracts module that does not exist.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`, `coordination/ledger.yaml` (evidence/research maps support only).
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-evidence-contract reason only.
  - **Dependency:** U3c.2.
  - **Pre-apply forecast:** required (~55–85 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U3d.2** GREEN: evidence and research contract validation. <!-- sdd-owner: implementation -->
  - **Intent:** Implement contract validation: evidence requires ownership/path containment, immutable identity, lifecycle compatibility, acceptance mapping, typed result, and useful test counts; research records distinguish confirmed/unchanged/unresolved and never advance a gate on unresolved risk.
  - **Allowed paths:** `coordination/validator/` (source only; tests from U3d.1).
  - **Acceptance:** U3d.1 green; invalid-evidence fixtures reject with typed blockers; research fixtures distinguish confirmed/unchanged/unresolved and never advance a gate on unresolved risk.
  - **Dependency:** U3d.1.
  - **Pre-apply forecast:** required (~35–55 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3e — Child-handoff protocol (PR 3e, est. 80–120 lines)

- [x] **U3e.1** RED: handoff protocol fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** TRIANGULATE: two-party request/acceptance fixtures — umbrella appends `child-handoff-requested` event (child ID, owner, baseline defect, scope/non-goals, dependencies, executability, acceptance/evidence contracts, 300-line policy, suggested change ID, collision requirement, expiry) with no claim the child exists or can apply; accept/resume/collision/decline/incomplete/unverifiable cases. Tests target a handoff module that does not exist.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`, `coordination/ledger.yaml` (handoff event support only).
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-handoff reason only; no fixture writes outside Drenyra or creates a sibling child.
  - **Dependency:** U3d.2.
  - **Pre-apply forecast:** required (~50–75 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U3e.2** GREEN: handoff protocol. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the two-party protocol: owner resumes existing authority (mandatory for H02) or creates its own child; umbrella validates and links repository-relative references at an immutable revision; ID collision returns to owner; declined handoff stays blocked; incomplete child stays planning; unverifiable authority blocks. No local surrogate child is created for sibling owners.
  - **Allowed paths:** `coordination/validator/` (source only; tests from U3e.1).
  - **Acceptance:** U3e.1 green; handoff fixtures cover accept/resume/collision/decline/incomplete/unverifiable with correct derived states.
  - **Dependency:** U3e.1.
  - **Pre-apply forecast:** required (~30–45 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3f — Compatibility import adapter (PR 3f, est. 90–140 lines)

- [x] **U3f.1** RED: compatibility-import fixture matrix. <!-- sdd-owner: implementation -->
  - **Intent:** TRIANGULATE: read-only legacy-state mapping fixtures per the design table — no `state.yaml` → planning/non-executable; `review-pending` → blocked; `implementation-blocked` → blocked; applied states → observed progress requiring closure proof; unknown → blocked until mapped; H02 imported by reference preserving `review-pending`; bootstrap imports marked `legacy-import`. Tests target an import module that does not exist.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`, `coordination/ledger.yaml` (import records only).
  - **Acceptance:** RED evidence recorded (runner, command, exit); failing for missing-import-adapter reason only.
  - **Dependency:** U3e.2.
  - **Pre-apply forecast:** required (~55–85 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U3f.2** GREEN: compatibility import adapter. <!-- sdd-owner: implementation -->
  - **Intent:** Implement the read-only legacy-state mapping; H02 imported by reference preserving `review-pending`; bootstrap imports marked `legacy-import`; existing child artifacts never rewritten; sibling OpenSpec/hybrid differences normalized only at the evidence metadata boundary; unknown schema versions fail closed with a migration event path.
  - **Allowed paths:** `coordination/validator/` (source only; tests from U3f.1).
  - **Acceptance:** U3f.1 green; import fixture matrix maps exactly per design table; importing H02 never mutates `drenyra-h02-tenant-isolation/*`; unknown states block.
  - **Dependency:** U3f.1.
  - **Pre-apply forecast:** required (~35–55 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U3g — REFACTOR/consolidation (PR 3g, est. 50–90 lines)

- [x] **U3g.1** REFACTOR: guards/contracts consolidation. <!-- sdd-owner: implementation -->
  - **Intent:** Extract shared guard/evidence helpers, unify fixture conventions, document guard semantics in README, and refresh the README chain-order reference to include 3a–3g; no behavior change.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/` (README, validator, fixtures, ledger).
  - **Acceptance:** Full U1a–U1d + U2a–U2d + U3a–U3g suites green after refactor; diff restricted to coordination tree.
  - **Dependency:** U3f.2.
  - **Pre-apply forecast:** required (~50–90 lines); record before apply.
  - **Cross-repo writes:** none.

---

## Unit U4 — Rollback, readback/status, verification and archival evidence (PR 4, est. 360–600 lines; forecast-over-300 — rescope pending before apply)

- [x] **U4.1** RED: rollback recomputation fixtures. <!-- sdd-owner: implementation -->
  - **Intent:** Criterion 15: rollback preserves history, appends `rolled-back` without deletion, recomputes all descendants, and marks dependencies relying solely on reverted proof `blocked/ROLLBACK_INVALIDATED_DEPENDENCY`; unverifiable rollback proof records a blocker; no sibling mutation as compensation; published artifacts never silently changed.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/fixtures/`, `coordination/validator/**/*.test.ts`.
  - **Acceptance:** RED evidence recorded; failing for missing-rollback-recompute reason only.
  - **Dependency:** U3g.1.
  - **Pre-apply forecast:** required (~60–100 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U4.2** GREEN: rollback recomputation. <!-- sdd-owner: implementation -->
  - **Intent:** Implement descendant invalidation and typed `ROLLBACK_INVALIDATED_DEPENDENCY` derivation from the resolver, preserving append-only history.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/` (source only).
  - **Acceptance:** U4.1 green; rollback fixture matrix derives correct downstream states; history intact.
  - **Dependency:** U4.1.
  - **Pre-apply forecast:** required (~80–140 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U4.3** TRIANGULATE: readback and status output. <!-- sdd-owner: implementation -->
  - **Intent:** Operational readback: derive capability-scoped program status from the ledger (never ecosystem-ready before C1–C6 close), emit per-child derived state + next safe action, enforce monotonic `ledger_revision`, reject stale concurrent writes (criterion 2), and fail closed on unsupported status claims. Markdown/status is derived; the ledger is the only mutable program state.
  - **Allowed paths:** `coordination/fixtures/`, `coordination/validator/**/*.test.ts`, `coordination/scripts/` (readback CLI), `coordination/README.md` (usage section).
  - **Acceptance:** Readback output matches resolver-derived states; a stale-write attempt fails and revisions stay monotonic; readiness language capability-scoped while any mandatory child is unclosed.
  - **Dependency:** U4.2.
  - **Pre-apply forecast:** required (~100–160 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U4.4** REFACTOR: readback consolidation. <!-- sdd-owner: implementation -->
  - **Intent:** Normalize readback/CLI structure, deduplicate derivation helpers, document operational usage; no behavior change.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/coordination/` (README, validator, fixtures, scripts).
  - **Acceptance:** Full U1a–U1d + U2a–U2d + U3–U4 suites green; diff restricted to coordination tree.
  - **Dependency:** U4.3.
  - **Pre-apply forecast:** required (~40–70 lines); record before apply.
  - **Cross-repo writes:** none.

- [x] **U4.5** Verification and archival evidence pack. <!-- sdd-owner: implementation -->
  - **Intent:** Produce the umbrella's verification evidence: run the full fixture suite and schema/resolver/readback checks against the bootstrap ledger; record runner, commands, exit codes, test counts, and mapping of each design validation criterion (1–16) and spec requirement to its passing fixture; run criterion-16 diff inspection proving only OpenSpec coordination paths changed; note archival path (ledger revision + events) for later `sdd-verify`/`sdd-archive`.
  - **Allowed paths:** `openspec/changes/drenyra-ecosystem-audit-readiness/` (verification evidence markdown, e.g. `coordination/verification-evidence.md`).
  - **Acceptance:** Evidence file lists commands + results + criterion/requirement mapping; `git status`/diff shows no product or sibling paths; no unsupported "ready" claims.
  - **Dependency:** U4.4.
  - **Pre-apply forecast:** required (~80–130 lines, mostly mechanical/evidence); generated content identified separately.
  - **Cross-repo writes:** none.

---

## Fixture-to-criterion coverage (design validation criteria 1–16)

|Criterion|Covered by|
|---|---|
|1 schema bootstrap / fail-closed|U1a.2, U1b.1, U1b.2, U1c.1, U1c.2|
|2 stale writes, monotonic revisions|U1c.1, U1c.2, U4.3|
|3 deterministic identical input|U1b.2, U1c.1, U1c.2, U2a.2|
|4 H02 review-pending blocks C1 + dependents|U3a.1, U3a.2|
|5 H02 approval insufficient without forecast/gates|U3a.1, U3a.2, U3b.1, U3b.2|
|6 missing dependency evidence blocks|U2a.1, U2a.2|
|7 cycles / C1 bypass / duplicate tenant / alternate authority|U2b.1, U2b.2|
|8 C2/C3 reorder proof|U2c.1, U2c.2|
|9 C5 independent, C6 needs C1+C5|U2a.1, U2a.2|
|10 300/301/301–400 line boundary|U3b.1, U3b.2|
|11 exception scope invalidation, size-gate-only waiver|U3b.1, U3b.2|
|12 bare labels / mutable revisions / contradictory / cross-repo|U3d.1, U3d.2|
|13 C7 atomic seven-proof opening|U3c.1, U3c.2|
|14 research provenance|U3d.1, U3d.2|
|15 rollback history + descendant invalidation|U4.1, U4.2|
|16 diff restricted to coordination artifacts|U4.5|

---

## Future repo-scoped child SDD work (NOT tasks of this change)

The following are separate child SDDs owned and executed in their own repositories. This umbrella change never implements them, never writes their repositories, and never treats them as executable without their own repository-local evidence. They are listed here to make program intent and boundaries explicit.

|Child|Owning repo|What it is|Depends on|Executability|Delivery boundary|Acceptance evidence|
|---|---|---|---|---|---|---|
|C1 — Tenant boundary closure|`Drenyra`|**Resumes the existing blocked H02 only** (`drenyra-h02-tenant-isolation`, `tasks`/`review-pending`); no new/duplicate SDD; drives waves W0–W6 in bounded units|Existing H02 authority; none new|**Blocked** until H02's review is approved within H02's own lifecycle|H02's existing change; one repo-local PR per wave/cluster|0 unscoped public repository methods; negative cross-tenant tests green; RLS on critical tables; H02 `state.yaml` archived|
|C2 — Money representation|`Drenyra`|BigInt-cents conversion, kill `parseFloat` in money contexts, drift guard|C1 (repository signatures overlap money reads)|Only after C1 evidence|Characterization first, then bounded domain clusters|Zero money-context `parseFloat`; drift characterization/regression; existing money suites green|
|C3 — Tooling and gate restoration|`Drenyra`|Fix `vitest.workspace.ts`, reconcile Vite, restore/remove declared readiness/release scripts, enforce lockfile policy|C1; coordinate with C2 on overlapping paths|Only after C1 evidence|Workspace-runner unit, then gate-restoration unit|Root Vitest/build green; declared gates runnable with typed output; explicit lockfile policy|
|C4 — Live readiness checks|`Drenyra`|DB + Redis health gates, `/health/ready`, fiscal-memory live check, CI fail-closed semantics|C3; available `drenyra-engram` release/binary|Only after C3 + engram evidence|Health/CI unit; sidecar integration unit|`/health/ready` ready with infra present, fails closed absent; fiscal-memory check green in CI|
|C5 — SoD and close command|`drenyra-pi`|Proposer/approver/executor SoD policy with same-user guard; wire `drenyra:close` to 13-phase monthly-close chain|Pinned `drenyra-ai` v0.2.0 (satisfied)|**Executable today** (repo-local child SDD in drenyra-pi)|Policy/enforcement unit; command-wiring unit|Same-user rejection + distinct-actor tests; command runs chain and emits signed receipt; vendored==released conformance|
|C6 — SoD alignment|`Drenyra`|Mirror C5 policy in Drenyra approval routes + `packages/domain/src/feos/approval.ts`, tenant-scoped|C1 and approved C5 policy|Only after C1 + C5 evidence|One or more repo-local units|Self-approval rejected at domain and route boundaries; tenant-scoped approval tests green|
|C7 — Core upgrades|`drenyra-ai` / `drenyra-engram`|Closes a proven frozen-contract/released-capability gap blocking C2–C5|Qualifying evidence from an executing consumer child|**Conditional; closed by default**; opens only through the seven-proof decision rules|Independent SDD + release in each affected core repo|Versioned release pinned + verified by every affected consumer; producer conformance green|

C1 is not a new implementation unit of this umbrella change: it is the resumption of the existing blocked H02 change only. Creating any other tenant-isolation SDD is a program violation.

---

## Parent actions (post-apply, lifecycle gates)

- [x] Resolve the pre-apply delivery decision: the Drenyra program owner confirmed the U1a–U1d → U2–U4 `feature-branch-chain`; record it in the umbrella ledger policy before U1a apply begins. <!-- sdd-owner: parent -->
- [ ] Run the repository-native bounded review on the exact umbrella diff (coordination tree only) and verify no product or sibling path is present; do not substitute umbrella status for child reviews. <!-- sdd-owner: parent -->
- [ ] After approved review and verification evidence, advance the umbrella change's lifecycle (verify → archive) and record the final ledger revision; keep capability-scoped status until C1–C6 close. <!-- sdd-owner: parent -->
