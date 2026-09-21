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
| `apps/cli` | KEEP adapter | It remains a Command Center terminal adapter until a stable Pi API proves equivalent product coverage; it is not the owner of Pi harness behavior. | Define the stable `drenyra-pi` API and map every CLI command and consumer. | Premature removal would strand terminal workflows; unchecked growth would duplicate the harness. | Move one command to the stable Pi contract while preserving its input/output and fiscal-scope tests. |
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
| Vendored `drenyra-ai` artifacts | MIGRATE | Vendored tarballs are a bounded transition mechanism; approved released registry artifacts are the target consumption path. | An approved private registry artifact with version, checksum, conformance evidence, and rollback pin. | Supply-chain drift or changing dependency bytes without equivalent behavior. | Replace one pinned vendored version in one consumer slice, verify checksum and conformance, and retain the prior pin for rollback. |
| Guardian and skills external references | KEEP adapter | `drenyra-guardian-angel` and `drenyra-skills` remain external owners; Command Center retains only versioned references and integration adapters. | Confirm repository identity, release/version policy, consumers, and operational owner for each reference. | Treating a reference as a live contract, silently changing policy, or copying external behavior locally. | Validate one reference and consumer against a pinned contract, recording unavailable or conditional status explicitly. |

Only one row is classified `DELETED`, and only after passing every deletion gate with zero consumers — see `services/engram` and its deletion readiness record below. No other row is classified `DELETE`; that classification remains valid only after the same gate is passed with equivalent evidence.

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
- **`packages/pi`**: has an existing but **unused** `"drenyra-ai": "file:../../vendored/drenyra-ai-0.4.1.tgz"` dependency (zero imports in `packages/pi/src`), ~40 fiscal-critical consumers, and 1102 source files. Too large and too high-risk for a first slice; the unused vendored dependency itself is a smaller, separate cleanup candidate.
- **`packages/memory`**: attempted the migration. `drenyra-engram`'s released `v0.2.1` npm exports (`.`, `./core`, `./store`, `./search`, `./lifecycle`, `./authority`) are an **in-process TypeScript library** (in-memory store, scope-first search, lifecycle transitions) — they are **not** the HTTP wire contract that `packages/memory/src/engram-client.ts` actually consumes. The real `/v1/observations`, `/v1/search`, `/v1/context`, `/v1/chain`, `/v1/doctor` routes and their request/response shapes live only in Go (`internal/server/http.go`, `internal/core/types.go`) and are never compiled to JS or exported from the npm package. Concretely, the npm `MemoryScope` is a discriminated union requiring `organizationId`/`companyId`/`ruc` for `company` scope, while the actual wire `Scope` struct (and the hand-mirrored `EngramScope` in this repo) makes those fields optional and derives `companyId` server-side — a real behavioral divergence, not a naming difference. **Contract parity gate fails**: keep the existing hand-mirrored types in `engram-client.ts` as intentional bridge code, not tech debt to remove. Filed as [arkelythex/drenyra-engram#46](https://github.com/arkelythex/drenyra-engram/issues/46) — until a published HTTP wire-types client exists, this row cannot progress past its current adapter shape.
- **`services/engram`**: repo-wide consumer search was empty and runtime consumers were absent (docker-compose.yml runs only the published `ghcr.io/arkelythex/drenyra-engram:0.2.1` image; the directory was never built; last substantive edit 2026-07-07; it did not even compile — missing `go.sum` entries). All five deletion-gate elements were satisfied by existing evidence (recorded below) and the user explicitly confirmed removal. **Deleted 2026-09-20** (`git rm -r services/engram`); repo-wide reference search and `docs:verify` confirmed clean afterward.

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
