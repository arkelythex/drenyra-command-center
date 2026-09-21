# Ecosystem Reduction Plan

**Last updated:** 2026-09-01

## Current answer

The final two-app reduction is **not complete** and must not be performed as a bulk deletion. Command Center still owns product, transport, fiscal workflow, and transactional responsibilities that do not yet have contract-equivalent replacements. Reduction therefore proceeds capability by capability: prove ownership and parity, migrate consumers through adapters, preserve rollback, and delete only after the consumer count is zero.

This plan is executable migration guidance, not evidence that any future wave has been implemented.

## Target ownership rule

Restates the boundary approved in [ADR-010 — Ecosystem boundary authority](../11-adr/ADR-010-ecosystem-boundary-authority.md) as executable migration guidance; ADR-010 is the decision of record — if the two ever disagree, ADR-010 governs and this section must be corrected to match it, not the other way around.

**Repositories own behavior; consumers own adapters.** The target boundary is:

- `drenyra-ai` remains the Core authority for missions, candidates, materiality, gates, receipts, ledger, and recovery contracts.
- `drenyra-engram` owns memory storage, search, lifecycle, and memory contracts. Memory informs but never authorizes.
- `drenyra-pi` owns Pi harness behavior, operator commands, model routing, and Pi-specific safety controls.
- Command Center owns product UI, API and transport adapters, fiscal workflow composition, tenant/RUC-scoped transactional persistence, and operational product surfaces.
- A consumer may retain a compatibility or transport adapter, but it must not retain a second implementation of behavior owned by another repository.
- External capabilities are consumed as pinned, released artifacts or versioned contracts, never as source checkouts or copied authority.

## Decision table

The classification is the current migration decision, not permission to delete an entire directory. Each smallest work unit must pass the gates in this document before the next unit starts.

| Surface or capability | Classification | Rationale | Prerequisite | Primary risk | Smallest verifiable work unit |
| --- | --- | --- | --- | --- | --- |
| `apps/api` | KEEP product surface | It is the tenant-scoped product API, transport boundary, and transactional workflow host. SQL-coupled mission runtime and recovery hooks are consumer adapters until portable Core contracts are integrated. | Keep Core calls behind published contracts and inventory every local transition, gate, and receipt dependency. | A transport adapter could become a second authority or bypass RUC scope. | Replace one API capability with one released Core contract, then prove API contract, tenant isolation, persistence, and rollback behavior. |
| `apps/cli` | **DELETED** (2026-09-21) | Removed by explicit user decision: the in-repo Go CLI/TUI is retired in favor of the external `drenyra-pi` CLI/harness product already recognized as the separate CLI/harness owner (see fact anchor in `docs/01-foundation/drenyra-ecosystem-constitution.md` §2.1). | N/A — removed. | N/A — no replacement CLI ships from this repo; developers/operators use `drenyra-pi` going forward. | Completed: `apps/cli` (169 Go files) removed from the working tree; repo-wide `apps/cli` reference sweep updated CI workflows, `package.json` scripts, CODEOWNERS, dependabot, and docs/link-check/product-surface scripts to remove or repoint dead references. Rollback via `git revert` of the removal commit if ever needed. |
| `apps/data-engine` | KEEP product surface | Data ingestion and processing remain part of the product surface and have no proven external replacement. | Inventory contracts, jobs, persistence effects, and RUC/period boundaries before considering extraction. | Data drift, cross-tenant processing, or loss of deterministic fiscal evidence. | Isolate and contract-test one engine operation with tenant/RUC fixtures and rollback evidence. |
| `apps/web` | KEEP product surface | The professional accounting UI is canonical Command Center product responsibility. | Continue rendering authoritative Core `status` and `nextTransition` without reconstructing state. | UI-derived authority or divergence from API/Core contracts. | Convert one view to a versioned API/Core projection and verify loading, rejection, and recovery states. |
| `packages/ai` | MIGRATE | Core or agent-runtime behavior belongs in `drenyra-ai`; Command Center should retain only product-facing adapters and model-provider integration that is consumer-specific. | Capability-by-capability equivalence, released replacement, consumer inventory, and conformance evidence. | A bulk move could erase product-specific integration or leave duplicate authority. | Migrate one exported capability to a pinned `drenyra-ai` API, keep a compatibility adapter, and run all direct consumer tests. |
| `packages/memory` | MIGRATE | Memory engine behavior and contracts belong in `drenyra-engram`; Command Center owns only scoped consumption adapters. | Published Engram contract, provenance/scope parity, complete consumer inventory, and data rollback plan. | Memory loss, provenance drift, tenant leakage, or accidental treatment of memory as authority. | Redirect one read-only memory capability through an adapter and prove scope, provenance, failure, and rollback behavior. |
| `packages/drenyra-orchestrator` | KEEP adapter | It is a mixed consumer boundary: review lenses and work routing already adapt external behavior, while classifier, fiscal gate, risk, and verification compose local delivery policy. | Preserve the audited module boundary and add contract comparisons before moving any further module. | Mechanical replacement would lose Git-diff policy, provenance, fail-closed behavior, or tree-hash binding. | Verify one module boundary at a time; migrate only a proven external equivalent and retain local composition otherwise. |
| `packages/fiscal-agent-domain` | KEEP product surface | It remains a fiscal product-domain surface absent a contract-equivalent external capability. | Separate product semantics from any Core-authority behavior and inventory all consumers. | Hidden duplication of Core decisions or fiscal behavior drift. | Characterize one exported rule with fiscal fixtures and compare it against candidate external contracts before any move. |
| `packages/fiscal-approval` | KEEP product surface | Command Center still owns product approval workflows and transactional approval records; authoritative Core gate decisions remain in `drenyra-ai`. | Document the boundary between human workflow/persistence and Core gate authority. | Local code could convert a Core rejection into approval or lose audit evidence. | Trace and test one approval path from Core decision through RUC-scoped persistence without changing the decision. |
| `packages/fiscal-compliance-pipeline` | KEEP product surface | The compliance pipeline is product workflow composition without a proven external equivalent. | Inventory fiscal stages, evidence, external effects, consumers, and rollback behavior. | Filing or compliance regressions and incomplete evidence chains. | Contract-test one pipeline stage, including rejection and rollback, against fixed fiscal fixtures. |
| `packages/fiscal-sdd` | KEEP product surface | Fiscal Spec-Driven Execution is local fiscal workflow composition; it is not software SDD or automatically replaceable by Core mission contracts. | Compare each phase and R0-R3 gate meaning with external contracts without assuming equivalence. | Conflating similarly named lifecycle concepts could change fiscal approvals. | Evaluate one FSD phase and gate, preserving its focused tests before any adapter proposal. |
| `packages/mission-client` | KEEP adapter | It is a product/transport client for canonical mission contracts and has no external transport-equivalent replacement. | Keep mission types canonical and inventory API, UI, and service consumers. | Transport behavior could fork protocol semantics or hide Core errors. | Move one operation to the canonical mission contract and verify request, response, error, and version handling. |
| `packages/mission-domain` | KEEP adapter | Its six source modules are already compatibility shims over `drenyra-ai/missions` and `drenyra-ai/receipts`. | Keep the pinned released artifact and all consumer imports green. | Reintroducing local mission logic or deleting the shim before consumers migrate. | For each future consumer move, replace one shim import with the canonical import and prove no remaining consumer before removing that export. |
| `packages/mission-protocol` | KEEP adapter | Its package root and compatibility modules already re-export the canonical `drenyra-ai/missions` contract with no local protocol logic. | Maintain version and conformance evidence while existing package imports remain. | Contract drift or premature package deletion causing import churn. | Move one consumer to the canonical package, verify type and runtime compatibility, and update the consumer inventory. |
| `packages/phase-gatekeeper` | KEEP product surface | It remains local product/delivery workflow behavior absent proven external contract equivalence. | Define its gate semantics and compare them with Core gates and Pi harness controls. | Similar terminology could conceal materially different authorization behavior. | Characterize one gate with pass, reject, and unavailable cases before deciding whether it remains local or gains an adapter. |
| `packages/pi` | MIGRATE | Pi harness behavior belongs in `drenyra-pi`; local scaffolding and Mastra integration may remain only until stable external contracts replace each capability. | Stable published Pi API, consumer inventory, parity evidence, and a retirement plan for stub routes. | Moving scaffolding as if it were a product contract or breaking local consumers. | Migrate one non-stub harness capability to a pinned Pi contract and prove behavior and fallback before retiring its local implementation. |
| `services/engram` | **DELETED** (2026-09-20) | Was already fully superseded by the published `ghcr.io/arkelythex/drenyra-engram:0.2.1` image; the directory was stale source left behind after that move, not a live capability. See the deletion readiness record below for the evidence that satisfied the gate before removal. | N/A — removed. | N/A — the removed directory never built (missing `go.sum` entries) and had zero consumers. | Completed: `git rm -r services/engram`, repo-wide reference search confirmed clean, `docs:verify` passed. Rollback via `git revert` of the removal commit if ever needed. |
| Vendored `drenyra-ai` artifacts | MIGRATE (unified on one version 2026-09-21) | Vendored tarballs are a bounded transition mechanism; approved released registry artifacts are the target consumption path. Dual-version vendoring (0.2.0 + 0.4.1) was itself a redundancy, now eliminated — see the unification record above. | An approved private registry artifact with version, checksum, conformance evidence, and rollback pin. | Supply-chain drift or changing dependency bytes without equivalent behavior. | Replace one pinned vendored version in one consumer slice, verify checksum and conformance, and retain the prior pin for rollback. |
| Guardian and skills external references | KEEP adapter | `drenyra-guardian-angel` and `drenyra-skills` remain external owners; Command Center retains only versioned references and integration adapters. | Confirm repository identity, release/version policy, consumers, and operational owner for each reference. | Treating a reference as a live contract, silently changing policy, or copying external behavior locally. | Validate one reference and consumer against a pinned contract, recording unavailable or conditional status explicitly. |

Two rows are classified `DELETED`. `services/engram` passed the full deletion gate with zero consumers — see its deletion readiness record below. `apps/cli` was removed by explicit user decision rather than the zero-consumer gate (it had live CI, docs, and config consumers, all updated in the same change); it is recorded here as a decision, not a gate-passed migration. No other row is classified `DELETE`; that classification remains valid only after the same gate is passed with equivalent evidence, or an equivalent explicit user decision is recorded.

## Completed slices and evidence

Two authority-reduction slices are complete:

1. **`packages/mission-protocol` status adapter:** the package root exposes the canonical mission contract, and compatibility modules re-export their existing surfaces from `drenyra-ai/missions` without local protocol logic.
2. **`packages/mission-domain` status adapter:** status, transitions, contracts, events, errors, and receipt modules are adapter shims over `drenyra-ai/missions` and `drenyra-ai/receipts`.

The combined evidence recorded for these slices is **222 focused tests passing plus the relevant typechecks passing**. This evidence supports those adapter migrations only; it does not prove later waves or physical repository reduction.

## Orchestrator comparison result

The `packages/drenyra-orchestrator` comparison produced a mixed boundary, not a package-wide migration:

- `classifier/classifier.ts`, `classifier/fiscal-gate.ts`, `runtime/risk.ts`, and `runtime/verification.ts` remain **local delivery-policy composition**. They bind Git-diff classification, fiscal patterns, provenance, staged verification, authorization, and tree identity in ways not replaced by current external contracts.
- `review-lenses.ts` and `work-routing.ts` are **adapters** over `drenyra-ai/review`.

Future work must compare module contracts, not infer ownership from the package name.

## Wave 2 candidate assessment (2026-09-20)

Evaluated `packages/ai`, `packages/memory`, `packages/pi`, and `services/engram` for the next Wave 2 unit. Result: no candidate is ready for a code migration yet; two produced actionable gap evidence instead.

- **`packages/ai`**: no external contract exists. `drenyra-ai@0.5.0`'s published exports (`./missions`, `./receipts`, `./gates`, `./ledger`, `./candidates`, `./cdr`, `./review`, `./evidence`, `./policy`, `./routing`, `./security`, `./skills`, `./tenant`) do not cover agent-orchestration, model-routing, or swarm-consensus. Not ready.
- **`packages/pi`**: an earlier pass claimed its `"drenyra-ai": "file:../../vendored/drenyra-ai-0.4.1.tgz"` dependency was unused (zero imports); this was verified **false** — `packages/pi/src/mastra/drenyra-gate-validator.ts` imports `drenyra-ai/candidates` (`deriveMateriality`) and `drenyra-ai/gates` (`ApprovalGate`) to make Mastra tool-orchestration approval decisions deterministic and contract-frozen; it is consumed by `mastra/index.ts` and has its own test. This dependency is genuinely load-bearing and is not a cleanup candidate. Separately, ~40 fiscal-critical consumers and 1102 source files still make `packages/pi` too large and high-risk for a first Wave 2 migration slice.
- **`packages/memory`**: attempted the migration. `drenyra-engram`'s released `v0.2.1` npm exports (`.`, `./core`, `./store`, `./search`, `./lifecycle`, `./authority`) are an **in-process TypeScript library** (in-memory store, scope-first search, lifecycle transitions) — they are **not** the HTTP wire contract that `packages/memory/src/engram-client.ts` actually consumes. The real `/v1/observations`, `/v1/search`, `/v1/context`, `/v1/chain`, `/v1/doctor` routes and their request/response shapes live only in Go (`internal/server/http.go`, `internal/core/types.go`) and are never compiled to JS or exported from the npm package. Concretely, the npm `MemoryScope` is a discriminated union requiring `organizationId`/`companyId`/`ruc` for `company` scope, while the actual wire `Scope` struct (and the hand-mirrored `EngramScope` in this repo) makes those fields optional and derives `companyId` server-side — a real behavioral divergence, not a naming difference. **Contract parity gate fails**: keep the existing hand-mirrored types in `engram-client.ts` as intentional bridge code, not tech debt to remove. Filed as [arkelythex/drenyra-engram#46](https://github.com/arkelythex/drenyra-engram/issues/46) — until a published HTTP wire-types client exists, this row cannot progress past its current adapter shape.
- **`services/engram`**: repo-wide consumer search was empty and runtime consumers were absent (docker-compose.yml runs only the published `ghcr.io/arkelythex/drenyra-engram:0.2.1` image; the directory was never built; last substantive edit 2026-07-07; it did not even compile — missing `go.sum` entries). All five deletion-gate elements were satisfied by existing evidence (recorded below) and the user explicitly confirmed removal. **Deleted 2026-09-20** (`git rm -r services/engram`); repo-wide reference search and `docs:verify` confirmed clean afterward.

### Vendored `drenyra-ai` version unification (2026-09-21)

The repo vendored two different `drenyra-ai` snapshots side by side: `0.2.0` (`packages/mission-protocol`, `packages/mission-domain`, `packages/drenyra-orchestrator`) and `0.4.1` (`packages/pi` only). Verified every subpath the three `0.2.0` consumers actually import (`missions`, `receipts`, `review` — confirmed by grep, not assumed) and diffed the real `.d.ts` files between versions: the diff is additive-only or comment-only for all three subpaths, with zero removed or reshaped symbols. Bumped all three consumers to `drenyra-ai@0.4.1`, removed the `0.2.0` tarball, and reinstalled. Verified against the actual (pre-existing, unrelated) baseline: `packages/drenyra-orchestrator`'s 30 typecheck errors and 15 failing tests are identical before and after this change (Node-types and DeepSeek-pricing issues, unrelated to `drenyra-ai`); its 22 tests that actually exercise `drenyra-ai/review` (`work-routing.test.ts`, `review-lenses.test.ts`) pass. `mission-protocol` (60 tests) and `mission-domain` (162 tests) pass unchanged. The repo now consumes a single vendored `drenyra-ai` version everywhere.

### `services/engram` deletion readiness record

`services/engram` was already fully superseded operationally before this audit — it is not a live capability being moved, it is stale source left behind after that move already happened. The prerequisite gate is satisfied by existing evidence rather than new design work:

| Gate element | Evidence |
| --- | --- |
| Released service/client contract | `ghcr.io/arkelythex/drenyra-engram:0.2.1`, the published image from the sibling `drenyra-engram` repository, is already the sole runtime dependency (`docker-compose.yml:203-213`, its own `engram_data` volume). |
| Consumer inventory | Repo-wide search for `services/engram` (excluding `.git`) returns only three doc/inventory mentions (`CODEX-MAP.md`, this plan, `ADR-010`) and zero build/import/CI/Makefile references. `services/engram` is a self-contained Go module (own `go.mod`, `github.com/drenyra/engram`), absent from any `go.work`, `package.json` script, or Dockerfile invocation. |
| Migration and rollback procedure | Removal is `git rm -r services/engram` on the isolated feature branch, verified pre- and post-removal with `git status`, `docs:verify`, and (if a Go toolchain is available) `go build ./...` run from `services/engram` beforehand to confirm no other module path depends on it. Rollback is `git revert` of the removal commit — the directory is fully recoverable from history; no data migration is involved because it never held live data. |
| Provenance parity | The sibling `drenyra-engram` repository (`github.com/arkelythex/drenyra-engram`) is a materially more complete implementation (auth, authz, receipts, search, sync, extensive tests) that already produces the running image; `services/engram`'s own SQLite schema (`internal/db/store.go`) is dead weight, not a divergent source of truth. |
| Operational owner | The `drenyra-engram` repository and its published image are owned and released outside Command Center; Command Center's only remaining responsibility is the `docker-compose.yml` image pin, which is unaffected by removing `services/engram`. |

All five elements were satisfied by evidence already gathered. The user explicitly confirmed removal; `services/engram` was deleted on 2026-09-20 via `git rm -r services/engram` on this feature branch. Post-removal repo-wide reference search found only documentation mentions (this plan, `CODEX-MAP.md`, `ADR-010`, all updated or historical), and `docs:verify` passed. Rollback path: `git revert` of the removal commit.

### `apps/cli` removal (2026-09-21)

Unlike `services/engram`, this was **not** a zero-consumer-gate deletion — the user explicitly decided to remove `apps/cli` (169 files, the in-repo Go/TS fiscal terminal) in favor of the external `drenyra-pi` CLI/harness product, before the consumer-inventory or contract-parity gates were checked. A prior read-only audit of the *committed* code (before removal) found `apps/cli` was mostly a genuine, non-duplicated adapter: `internal/harness/{client.go,missions.go}` were thin HTTP clients, and its apparent "second receipt verifier" (`internal/harness/receipt.go`, `receipt_signature.go`) was intentional, conformance-tested against the same fixtures as the TS and Python implementations (`contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json`) — read-only verification only, never signing. The one open lead that was never resolved before removal: `internal/router/router.go` (agent→model/provider/fallback resolution) and `internal/rpc/server.go` (a "Pi/Droid style" JSON-RPC dispatcher) looked like they could have overlapped `drenyra-pi`'s and `drenyra-ai`'s `./routing` export — that comparison was never made, since the code was removed first. Recorded here so a future session doesn't assume `drenyra-pi` already covers that routing/dispatch behavior without checking.

Because this was a decision, not a gate-passed migration, the follow-through was reference cleanup rather than gate evidence: removed the CLI-only CI job/steps (`ci.yml`, `post-merge-verification.yml`, `contracts-nightly.yml` — the latter's Go-side receipt-conformance coverage is gone with no replacement, since the code under test no longer exists), the `go:drenyra:*` package.json scripts, the `CODEOWNERS` and `dependabot.yml` entries, the `apps/cli/MAP.md` references in `docs:check-links`/`architecture:check-product-surfaces`, the stale `.gitignore` build-artifact entries, and the `@drenyra/cli` `bun.lock` workspace entry (via reinstall). Docs (`README.md`, `AGENTS.md`, `CODEX-MAP.md`, `CODEBASE-GUIDE.md`, `intended-usage.md`, `apps/api/AGENTS.md`, `apps/api/MAP.md`, the two `docs/10-development/*` guides) were updated to drop or repoint the mentions; `ADR-013` and this plan's decision-table row got dated addenda rather than rewritten history. `docs:check-links` (14 files) and `architecture:check-product-surfaces` pass; `package.json` and all four touched YAML files parse; `git diff --check` is clean.

One pre-existing, unrelated stale reference was found and deliberately left alone: `CODEOWNERS` and `ci.yml` both still reference `/packages/engram/`, which doesn't exist (renamed to `packages/memory` before this session) — flagged for a separate future cleanup, not touched here.

## Audit findings — remaining KEEP capabilities (2026-09-21)

A capability-by-capability audit of every `KEEP`-classified row not already covered above (`apps/api`, `apps/data-engine`, `apps/web`, Guardian/skills references, `packages/fiscal-agent-domain`, `packages/fiscal-approval`, `packages/fiscal-compliance-pipeline`, `packages/fiscal-sdd`, `packages/phase-gatekeeper`, `packages/mission-client`), using the same rigor as the `services/engram` and vendored-dependency findings above. 9 of 11 are confirmed genuine KEEPs with concrete evidence (no local reimplementation of `drenyra-ai`/`drenyra-pi`/`drenyra-engram` behavior found). Two produced real leads that need a future session, not immediate action:

- **`packages/fiscal-agent-domain` vs. `packages/pi` naming collision — investigated 2026-09-21, turned out to be a red herring, but it led to finding and fixing a real, live fiscal gap.** A follow-up investigation traced actual runtime call chains rather than trusting the earlier static-grep finding: `packages/pi/src/index.ts:52-60`'s root re-export is exclusively `fiscal-agent-domain`'s R0-R3 pair (confirmed from the import statement, not assumed); `packages/pi/src/types/approval-gate.ts`'s own auto/notify/gate/fiscal_gate pair is never re-exported at all. Neither named consumer (`apps/api/src/features/drenyra/agents.ts`, `packages/pi/src/adapter/port.ts`) actually calls any of the three functions — both were dead ends. **The real live gap**: `submit_sire` (`apps/api/src/features/drenyra/tools/compliance.tools.ts`, real SUNAT filing, `approvalLevel: "fiscal_gate"`) was gated by `ApprovalGateEngine.executeTool`'s inline `=== "fiscal_gate"` string check (`packages/pi/src/mastra/approval-gate.ts`), whose `approve()` accepted a single `reviewerId` and finalized immediately — no distinct-approver count, for any level. The real Core bridge, `createDrenyraGateValidator` (calls `drenyra-ai/gates`' `ApprovalGate`, which requires 2 distinct approvers at R3), existed and was fully correct but was never wired into production (`apps/api/src/features/drenyra/drenyra.routes.ts` constructed `ApprovalGateEngine` with no `governanceValidator` argument). A real SUNAT filing needed only one human click to approve. **Fixed 2026-09-21**, additively (no breaking changes to the ~40 files that read `ApprovalRequest.reviewerId`):
  1. `packages/pi/src/types/approval-gate.ts`: added `ApprovalRequest.approvals?: ApprovalRecord[]` to accumulate distinct approvals; `reviewerId`/`reviewerRole` kept as-is (now mean "the approval that finalized the decision").
  2. `packages/pi/src/mastra/approval-gate.ts`: `approve()` now, for `fiscal_gate` requests with a `governanceValidator` configured, accumulates the approval, merges it into the tool input's `approvals` array, and re-invokes the validator — only transitioning to `"approved"` when the gate's verdict is valid; otherwise it stays `"validated"` (an existing-but-previously-unused state), allowing further `approve()` calls from additional reviewers. Non-fiscal and validator-less paths are byte-for-byte unchanged (verified: existing 14 tests still pass unmodified).
  3. `packages/pi/src/mastra/drenyra-gate-validator.ts`: fixed a second, independent bug — it defaulted an undeclared `reversibility` to `"reversible"` (the file's own doc claims "fail-closed", but this default was fail-open). `submit_sire`'s input schema has no `reversibility`/`jurisdiction`/`amountCents` fields at all, so this default silently derived R0 (no approval needed) for every SIRE filing regardless of the wiring fix above. Changed the default to `"irreversible"`.
  4. `packages/pi/src/index.ts`: exported `createDrenyraGateValidator` from the package root (it was previously unreachable outside its own test file).
  5. `apps/api/src/features/drenyra/drenyra.routes.ts`: wired `createDrenyraGateValidator()` as the `ApprovalGateEngine` constructor's `governanceValidator` argument.
  Verified: 8 new/updated tests (dual-approval accumulation, single-approver-unchanged-when-no-validator, fail-closed reversibility default) plus all 566 existing `packages/pi` tests and the 10 relevant `apps/api` drenyra-approval route tests pass. `bun run typecheck` in both packages shows only the same 56 pre-existing, unrelated `exactOptionalPropertyTypes` errors documented earlier this session.
- **Guardian CI integration contradicts its own KEEP rationale — confirmed, not just a lead.** The plan's stated rationale for "Guardian and skills external references" is "Command Center retains only versioned references and integration adapters," but `.github/workflows/ai-review.yml:26` does `git clone https://github.com/Gentleman-Programming/gentleman-guardian-angel.git /tmp/gga` at CI runtime on every run — no tag or SHA pin — then `scripts/gga-install-deepseek-provider.py` patches the installed tool's internal `providers.sh` in place. That's a live, unpinned source checkout plus local modification of an external tool's internals: exactly the "treating a reference as a live contract... or copying external behavior locally" risk this plan's own rationale warns against. `drenyra-skills` itself checks out clean — no vendored source, and `packages/skill-sire-filing` is Command Center's own product skill, not a copy. **Fixed 2026-09-21**: pinned the clone to release tag `v2.10.1` with `--depth 1`. Recommend a future session still re-scope this row: split "Guardian CI integration" (now pinned) from "skills adapter" (already clean), and consider whether `scripts/gga-install-deepseek-provider.py`'s in-place patch of the installed tool's internals should itself become an upstream contribution instead of a local patch.

Also noted, not currently actionable: `apps/data-engine` independently reimplements receipt-hash/signature verification in Python (`src/conformance/receipt_canonical.py`), alongside the existing TS canonical implementation — each is individually justified and conformance-tested today (cross-checked against the same fixtures), but it's a standing three-language blast-radius risk if the canonical algorithm ever changes, worth tracking even though it isn't a hidden duplicate right now.

## Migration waves

### Wave 0 — Freeze the inventory

1. Record every exported capability, direct and transitive consumer, persisted datum, external effect, and operational owner.
2. Mark authority-sensitive paths: mission transitions, gates, approvals, receipts, ledger writes, memory writes, tenant/RUC scope, and fiscal submissions.
3. Establish focused test and typecheck commands for each candidate work unit.

**Exit gate:** the consumer inventory is complete for the selected capability, ownership is named, and no deletion is proposed.

### Wave 1 — Stabilize existing adapters

1. Keep the completed mission adapters pinned to released `drenyra-ai` artifacts.
2. Preserve the orchestrator's mixed boundary.
3. Add or retain contract tests at adapter seams; do not duplicate canonical types to make tests pass.

**Exit gate:** contract parity is demonstrated for the selected adapter and all known consumers pass focused tests and typechecks.

### Wave 2 — Migrate Core, memory, and Pi capabilities

1. Select one capability from `packages/ai`, `packages/memory`, `packages/pi`, or `services/engram`.
2. Verify a released replacement in its owning repository.
3. Introduce or narrow a Command Center adapter.
4. Move consumers in bounded units while retaining rollback.

**Exit gate:** contract parity, tenant/RUC safety, fiscal evidence where applicable, rollback proof, and operational ownership are all recorded for that capability.

### Wave 3 — Reduce transitional artifacts

1. Move eligible consumers from vendored `drenyra-ai` tarballs to approved pinned registry artifacts.
2. Remove compatibility exports only as their individual consumer counts reach zero.
3. Keep external Guardian and skills integrations as versioned references/adapters.

**Exit gate:** artifact integrity and conformance pass, rollback to the prior pin is exercised or documented as executable, and each removed export has zero consumers.

### Wave 4 — Reassess physical topology

1. Re-run the inventory for applications and packages after capability migrations settle.
2. Confirm which product, transport, persistence, and fiscal responsibilities still live in each surface.
3. Consider `DEPRECATE` or `DELETE` only for an empty responsibility boundary.

**Exit gate:** deletion is permitted only after zero consumers, zero owned behavior, no persisted-data obligation, an assigned operational owner for the replacement, and a tested rollback/recovery path. Until this gate passes, the final two-app topology remains a target hypothesis rather than repository state.

## Mandatory gates

Every migration work unit must produce evidence for all applicable gates:

| Gate | Required evidence | Failure action |
| --- | --- | --- |
| Contract parity | Export/type mapping, behavioral fixtures, version compatibility, and error semantics match the owning repository's released contract. | Keep the local implementation or adapter; file the gap with the owning repository. |
| Consumer inventory | Direct and transitive imports, runtime calls, jobs, scripts, UI/API consumers, and operational users are enumerated. | Stop migration; do not deprecate or delete. |
| Tenant/RUC safety | Organization, company/RUC, and period scope remain mandatory across reads, writes, jobs, caches, and recovery. | Roll back the work unit and treat it as a safety defect. |
| Fiscal test evidence | Applicable Money/BigInt, tax, approval, receipt, evidence, filing, and rejection cases pass focused tests. | Do not advance the wave. |
| Rollback | Prior version or adapter route is pinned, data compatibility is understood, and recovery steps are executable. | Keep both paths non-authoritatively or stop before cutover; never delete the prior path. |
| Operational ownership | Owning repository, maintainer, release source, incident route, observability, and support boundary are named. | Keep responsibility local until ownership is accepted. |
| Deletion after zero consumers | Repository-wide consumer search is empty, runtime/operational consumers are confirmed absent, persisted-data duties are discharged, and focused validation passes after removal. | Classification remains KEEP, MIGRATE, EXTRACT, or DEPRECATE; deletion is forbidden. |

A gate passes on observed evidence, not on folder similarity, naming, or the existence of an external repository.

## Work-unit execution template

For each row selected for implementation:

1. Name exactly one capability and its current and target owner.
2. Capture the consumer inventory and baseline focused evidence.
3. Compare released contracts, including errors, versions, scope, persistence, and external effects.
4. Add or narrow the consumer adapter without moving unrelated behavior.
5. Migrate the smallest consumer set and run focused tests and typechecks.
6. Exercise rollback and assign operational ownership.
7. Recount consumers. Deprecate or delete only when the applicable gate permits it.
8. Update the matrix, ADR status, and this plan with observed results; do not mark later waves complete.

## Non-goals

- No deletion based on folder aesthetics or a desired package count.
- No replacement of product domain with `drenyra-ai` without contract equivalence.
- No broad rewrite or bulk move across applications, packages, services, or repositories.
- No weakening of tenant/RUC scope, fiscal correctness, approvals, receipts, evidence, or fail-closed behavior.
- No claim that this plan implements future waves or completes the final two-app reduction.
- No commit or push in this work unit.

## Related decisions

- [Ecosystem Capability Matrix](./ecosystem-capability-matrix.md)
- [ADR-013 — Consume Drenyra-AI and remove duplicate authority](../11-adr/ADR-013-consume-drenyra-ai-remove-duplicate-authority.md)
- [Command Center Architecture](../architecture.md)
- [Drenyra Ecosystem Constitution](../01-foundation/drenyra-ecosystem-constitution.md)
