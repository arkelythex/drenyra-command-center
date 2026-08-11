# Exploration — Ecosystem Audit Readiness (umbrella + repo-scoped child SDD)

> **Change:** `drenyra-ecosystem-audit-readiness` · **Phase:** explore (corrective re-run) · **Store:** openspec (file authoritative, per `Drenyra/openspec/config.yaml`)
> **Scope:** read-only investigation; no product source modified. This is the canonical exploration artifact: duplicate `exploration.md`, `notes.md`, `probe*.md`, and `probe.txt` files were removed. Facts below were re-verified against the working tree on 2026-08-08; nothing external was assumed.

## Decision

**Umbrella + repo-scoped child SDD.** Drenyra is the umbrella/coordinating program for the ecosystem-wide production/audit-readiness program. The program is planned and coordinated from this repo, but each sibling repo (`drenyra-ai`, `drenyra-engram`, `drenyra-pi`) owns its own SDD change pipeline in its own repository. Drenyra phases never write into sibling repos; the umbrella change is satisfied when the coordinated child changes are planned, executed, and verified repo-locally.

## Corrections applied in this re-run

|#|Prior claim (gatekeeper-flagged)|Corrected, evidence-backed claim|Evidence|
|-|-|-|-|
|C1|No `openspec/` directory existed / SDD store absent|The OpenSpec store exists and is active: `Drenyra/openspec/config.yaml` (project `@drenyra/main`, `artifact_store: openspec`, `strict_tdd: true`, `execution_mode: interactive`, `review_budget: 400`, 32 declared SDD plans) plus 115 change directories under `openspec/changes/`|`openspec/config.yaml`; `openspec/changes/*/state.yaml` inventory below|
|C2|Stale/inconsistent drenyra-ai test-count claims|drenyra-ai executed baseline is **28 files, 488 tests passed** (463 baseline + 25 tenant) — exit 0|`drenyra-ai/openspec/changes/fiscal-authority-kernel/apply-progress.md` ("28 files, 488 tests passed (463 baseline + 25 tenant) — exit 0") and `tasks.md`|
|C3|`apps/` contains only `api`/`web`/`cli` (no `data-engine`)|`apps/data-engine` exists; the phantom entries are `apps/drenyra-cli` and `apps/landing`|`apps/` listing (api, cli, data-engine, web); `openspec/config.yaml` `workspace.apps`; `vitest.workspace.ts`|

## Evidence — OpenSpec store exists (Drenyra)

- `Drenyra/openspec/config.yaml` — present. Declares 32 SDD plans (5 DS + 4 backend + 6 structural + 7 P + 8 new); blocker note says 33+ plans tracked; actual `changes/` inventory is 115 directories.
- `Drenyra/openspec/changes/` — state.yaml inventory (verified):
  - `archived`: 60
  - `implemented`: 3
  - `verified`: 2
  - `completed`: 2
  - `review-pending`: 1 (`drenyra-h02-tenant-isolation`)
  - `implementation-blocked`: 1 (`drenyra-accountant-operating-system`, phase `feasibility-gate`)
  - no `state.yaml` (~46 dirs): proposals / working drafts, SDD lifecycle not started (e.g. `drenyra-risk-audit` — proposal/spec/design/tasks present, no `state.yaml`)
- **Not executable (must not be treated as runnable dependencies):** `drenyra-h02-tenant-isolation` (`status: review-pending`), `drenyra-accountant-operating-system` (`status: implementation-blocked`), `drenyra-risk-audit` (no `state.yaml`).

## Evidence — ecosystem repos and test baselines

|Repo|Location|SDD store|Verified state|Test baseline|
|-|-|-|-|-|
|`drenyra-ai`|`PROYECTOS/drenyra-ai` (remote `arkelythex/drenyra-ai`); feature worktrees: `drenyra-ai-evidence`, `drenyra-ai-evidence-identity`, `drenyra-ai-tenant-core`, `drenyra-ai-tenant-isolation`|OpenSpec files under `openspec/changes/fiscal-authority-kernel/` (explore, proposal, specs, design, tasks, apply-progress)|fiscal-authority-kernel applied; full regression green|**28 files, 488 tests passed** (463 baseline + 25 tenant), exit 0 (`bun run test`, vitest — apply-progress.md)|
|`drenyra-engram`|`PROYECTOS/drenyra-engram`|No `openspec/` directory found|—|—|
|`drenyra-pi`|`PROYECTOS/drenyra-pi`|OpenSpec hybrid store: `openspec/config.yaml` (`store_mode: hybrid`, file authoritative) + `openspec/changes/monthly-close-integrity-hardening/`|Baseline green; slice 1 landed (531 tests / 32 files per apply-progress)|**493 tests / 29 files** (`openspec/config.yaml` testing block; baseline per apply-progress)|

Consumption facts:

- Drenyra consumes `drenyra-ai` via GitHub Release tarball. `docs/14-design/ecosystem-capability-matrix.md` documents `v0.1.0` as the first FROZEN-contract release (mission-protocol, candidate, receipt, gate pinned by conformance suites); current package pins are `v0.2.0` (`packages/mission-protocol` and `packages/drenyra-orchestrator` → `https://github.com/arkelythex/drenyra-ai/releases/download/v0.2.0/drenyra-ai-0.2.0.tgz`).
- Extracted adapter shims: `packages/mission-protocol`, `packages/mission-domain` (all six modules), `packages/mission-domain/src/mission-receipt.ts`, `packages/drenyra-orchestrator` review-lenses + work-routing (22/22 tests through shims).
- Migrating (canonical exists in drenyra-ai, local copy not yet retired): receipt schemas/conformance vectors, recovery contracts, MissionRuntime.
- `drenyra-pi` pins `drenyra-ai` `file:./vendored/drenyra-ai-0.2.0.tgz` (postinstall install script).

## Verified blockers

Severity from the exploration findings; every item below has working-tree evidence.

|#|Blocker|Severity|Evidence (repo:path)|Fix vehicle|
|-|-|-|-|-|
|1|Broad production/audit readiness still unplanned — 33+ SDD plans tracked, most proposal/working-draft; only a minority reached `implemented`/`completed`/`verified`|High|`Drenyra/openspec/config.yaml` blockers; state inventory above|Umbrella proposal + child SDD map (this change)|
|2|Risk, Audit & Internal Controls — ~150 files of ad-hoc audit/compliance code across 6 modules, mostly untested; 7 capabilities unimplemented (risk matrix, internal controls, policy engine, audit reports, compliance runbooks, incident response)|High|`Drenyra/openspec/config.yaml` blockers; `openspec/changes/drenyra-risk-audit/proposal.md`|Child SDD (Drenyra) — not executable yet (no `state.yaml`)|
|3|Fiscal production/audit readiness gaps — audit trail lacks chain-verification endpoint, tamper-detection alerting, SUNAT bulk export; compliance surface has no policy engine; SoD planned under CAP-RISK|High|`Drenyra/openspec/config.yaml` blockers|Child SDD (Drenyra)|
|4|Ecosystem extraction in flight — mission-protocol, mission-domain, orchestrator review/work-routing are adapter shims over drenyra-ai release tarballs; Migrating items still carry SQL-coupled local copies to retire|Medium|`Drenyra/openspec/config.yaml` blockers; `docs/14-design/ecosystem-capability-matrix.md`|Tracked in umbrella evidence ledger|
|5|H02 tenant isolation is critical and incomplete — `drenyra-h02-tenant-isolation` at `phase: tasks, status: review-pending`; 7 rollout waves (W0–W6) defined; must be resumed, not re-created|Critical|`Drenyra/openspec/changes/drenyra-h02-tenant-isolation/state.yaml`, `spec.md`, `design-revised.md`, `tasks.md`; `docs/12-security/tenant-access-matrix.md`|Resume H02 as child C1 (unblock review gate, drive waves)|
|6|Fiscal number / `parseFloat` representation drift — `parseFloat` in money paths; 30+ feature files under `apps/api/src/features` contain `parseFloat`, incl. `Money.fromAmount(parseFloat(...))`|High|`Drenyra/apps/api/src/features/billing/invoice/infrastructure/repository.ts:404-409`; `packages/domain/src/fiscal/invoice-igv.ts:36-43`; float-free convention in drenyra-ai/drenyra-engram|Child SDD C2 (BigInt-cents, characterization tests first)|
|7|No formal proposer/approver/executor SoD — role matrix documents `approval:request` vs `approval:decide` and `requiredApprovals`, but no same-user guard enforced at domain/application level|High|`Drenyra/docs/12-security/tenant-access-matrix.md`; `apps/api/src/features/drenyra/command-center-*.routes.ts`, `drenyra.routes.ts:947-987`; `packages/application/src/use-cases/monthly-close/steps/produce-proposal.step.ts:310`; `packages/domain/src/feos/approval.ts`|Child SDDs C5 (drenyra-pi) + C6 (Drenyra)|
|8|`drenyra:close` is a registered stub — validates scope only, does not run the monthly-close chain, though `chains/monthly-close.ts` (13-phase, R2 approval, signed receipt) exists|High|`drenyra-pi/extensions/register.ts` (lines 182, 436-453); `drenyra-pi/chains/monthly-close.ts`|Child SDD C5: wire command → chain → ROADMAP v1.0 candidate|
|9|Root Vitest/Vite workspace-runner defect — `vitest.workspace.ts` lists `apps/landing` (does not exist); `vite` override `8.0.16` vs devDependency `^7.6.0` conflict|Medium|`Drenyra/vitest.workspace.ts`; `Drenyra/package.json` (overrides:193 vs devDependencies:230); CI sidesteps via per-package `--filter`|Child SDD C3 (fix workspace list, reconcile Vite, root runner green)|
|10|Path discrepancy — AGENTS.md canonical app is `apps/cli`; config `workspace.apps` and root Makefile reference `apps/drenyra-cli` (does not exist); config also lists `apps/landing` (does not exist)|Medium|`Drenyra/openspec/config.yaml` `workspace.apps`; `apps/` listing (api, cli, data-engine, web); `Drenyra/openspec/config.yaml` blockers|Child SDD C3|
|11|Declared readiness/release gate scripts are missing — script targets ENOENT|Medium|`Drenyra/package.json` vs files: `scripts/ci/pr-readiness.ts`, `scripts/p3-staging-preflight.ts`, `scripts/p3-staging-go-no-go.ts`, `scripts/p3-decision-recommendation.ts`, `scripts/release/p6-go-live-verify.ts`, `scripts/release/launch-handoff-verify.ts`, `scripts/architecture/check-baseline-policy.ts`, `scripts/sire-ledger-gate-evaluate.ts`|Child SDD C3: restore/implement declared gates or remove declarations|
|12|`bunfig.toml` `frozenLockfile` commented out — CI reproducibility lock not enforced|Medium|`Drenyra/bunfig.toml`; `openspec/config.yaml` blockers|Child SDD C3|
|13|Recorded incident — native review-authority lock; candidate preserved at worktree `accounting-protocol`, HEAD `94c9cefb1f5169aa5b89539eb3969c873f504503`; resolution state tracked|Info|`.incident/review-lock-20260718-032605/` (`authority-investigation.md`, `head.txt`, `branch.txt` = `feat/accounting-protocol`)|Tracked under `.incident/`; follow existing resolution process|

## Child SDD map (proposed) — boundaries, dependencies, executability

The umbrella coordinates; every child is repo-scoped, lands its own per-repo PRs, and carries its own acceptance evidence.

|#|Child SDD (proposed)|Repo|Depends on|Executability|PR boundary|Acceptance evidence|
|-|-|-|-|-|-|-|
|C1|Tenant boundary closure — resume H02 (waves 0–6: characterization tests, scope-first repositories, negative cross-tenant tests, RLS enablement, route scoping, zero-unscoped-method grep)|`Drenyra`|None (H02 at `tasks`/`review-pending`; resume, do not restart)|Blocked on H02 review gate|H02's existing waves W0–W6, one PR per wave/cluster|0 unscoped public repository methods; negative cross-tenant tests green; RLS on critical tables; H02 `state.yaml` reaches `archived`|
|C2|Money representation — BigInt-cents conversion of all money paths; kill `parseFloat` in money contexts; drift guard|`Drenyra`|C1 (repository signatures touch money reads)|Executable once C1 unblocks|2–3 PRs: characterization first, then billing/invoice, then taxation/reconciliation/FX|0 `parseFloat` on money values; `Money` from strings/ints only; drift regression test; existing money tests green|
|C3|Tooling & gate restoration — fix `vitest.workspace.ts`, reconcile `vite` override, implement or remove declared readiness/release scripts|`Drenyra`|C1 (gates run against scoped code)|Executable|2 PRs: workspace runner fix; gates implementation/removal|`bun vitest run` green at root; `vite build` green; declared gates runnable with typed output|
|C4|Live readiness checks — DB + Redis health gates, `/health/ready` green against real infra, fiscal-memory live check with engram sidecar, CI assertion|`Drenyra`|C3; `drenyra-engram` release|Executable after C3|1–2 PRs: health gates + CI; sidecar wiring|`/health/ready` = ready (not degraded) in CI; fiscal-memory live check green; red on missing infra|
|C5|SoD + close command — formal proposer/approver/executor SoD policy with same-user guard; wire `drenyra:close` to `MonthlyCloseChain`|`drenyra-pi`|`drenyra-ai` v0.2.0 (already pinned: missions, receipts, gates)|Executable today (independent)|2 PRs: SoD policy+enforcement; close command wiring|SoD tests (proposer≠approver≠executor, same-user rejection); `/drenyra:close` runs 13-phase chain and emits signed receipt = ROADMAP v1.0 candidate|
|C6|SoD alignment — mirror SoD policy in Drenyra approval control plane (routes + domain `feos/approval.ts`)|`Drenyra`|C1; C5 policy definition|Executable after C5|1 PR|Same-user guard tests; approval decision routes reject self-approval; tenant-scoped approvals|
|C7|Core upgrades (on-demand only) — `drenyra-ai` and/or `drenyra-engram` changes only if C2–C5 prove a frozen-contract gap|`drenyra-ai` / `drenyra-engram`|Child SDDs that surface the gap|Conditional; only on demonstrated gap|Per-repo release PR + tag (frozen contracts ⇒ major bump if surface changes)|Released version consumed by both `Drenyra` and `drenyra-pi`; conformance suite green|

H02 must be unblocked, not re-created: its `state.yaml` is `phase: tasks, status: review-pending`. The umbrella's first action is to resume H02's review gate, then drive waves to completion as child C1. Creating a duplicate tenant SDD would split authority and drift acceptance evidence.

## Dependency order (execution sequence)

```text
drenyra-ai v0.2.0 (pinned)   --> C5 (drenyra-pi: SoD + close)
drenyra-engram (binary)      --> C4 (Drenyra: live checks)
C1 (tenant closure, resume H02) --> C2 (money) --> C3 (tooling/gates) --> C4
C5 --> C6 (Drenyra SoD mirror)
C7 (core upgrades) — only on demand, after C2/C5 prove a frozen-contract gap
Umbrella evidence ledger updated after every child gate
```

C1 → C2 → C3 → C4 is a hard chain inside `Drenyra`. C5 is independent except for `drenyra-ai` availability (satisfied by the v0.2.0 pin). C6 follows C5. C7 is conditional.

## Executability guard

- `drenyra-h02-tenant-isolation` — NOT executable (`review-pending`). No dependency of this program may be described as runnable until its review is approved and state advances.
- `drenyra-accountant-operating-system` — NOT executable (`implementation-blocked`, phase `feasibility-gate`).
- `drenyra-risk-audit` — NOT executable (no `state.yaml`; SDD lifecycle not started; the umbrella's child-planning target, not a runtime dependency).
- Executable/verifiable today: drenyra-ai (488 tests), drenyra-pi (493 tests), and Drenyra changes in `implemented`/`completed`/`verified` state.

## Risks

|Risk|Likelihood|Impact|Mitigation|
|-|-|-|-|
|H02 review gate blocks C1 (design-revised pending review)|High|Critical|First umbrella action: resume H02 review; resolve blockers before any other child starts|
|Cross-repo version skew (`drenyra-pi` vendored `drenyra-ai` diverges from released)|Medium|High|C5 consumes pinned v0.2.0; add conformance check that vendored == released|
|Filesystem alias `@drenyra/pi` → `../../drenyra-pi/src` breaks test config on other machines|Medium|Medium|C3 removes/pins the alias as part of workspace-runner fix|
|Money conversion (C2) silently changes fiscal outputs|Medium|Critical|Characterization tests first, BigInt-cents only, diff-based evidence on computed amounts|
|SoD enforcement breaks existing demo/seed workflows (same-user approval today)|Medium|High|C5/C6 land with explicit policy + migration of demo flows; R2 approval paths tested|
|Live checks (C4) can't pass without infra that doesn't exist|Medium|Medium|Define "ready" vs "degraded" semantics; CI uses real compose services; red = fail closed|
|Declared gates restored (C3) expose more missing machinery|Medium|Medium|Treat as follow-up findings in the umbrella ledger, never silent removal|
|Scope creep into product features via "audit readiness" label|Medium|Medium|Umbrella gate: child proposals must state which baseline defect they close|

## Non-goals

- No new product features (no new fiscal domains, no UI redesign, no multi-country expansion).
- No market/business validation (drenyra-pi due-diligence sheet already scopes these out; not an engineering program concern).
- No single cross-repo implementation change; every child lands per-repo PRs.
- No changing `drenyra-ai` frozen contracts without a major-version release and explicit child-SDD justification.
- No production deployment to SUNAT/banks/payments; readiness gates verify, they do not ship live integrations.
- No duplicate of H02; the umbrella resumes and completes it.
- No float tolerance: representation drift is eliminated, not documented as acceptable.

## Deferred current-web research

The following facts are externally dependent and genuinely uncertain; they must be verified against current authoritative sources during the named child SDD, not assumed. No web research was performed during this phase (no web/search tooling in this run); no umbrella requirement depends on an unverified external fact.

|Requirement|Child SDD|Why it needs web verification|Verification protocol|
|-|-|-|-|
|OSE/SUNAT webhook callback authentication (signature/HS256 requirements) for status-sync endpoints|C1|H02 design-revised notes the webhook handler does not verify signatures; whether SUNAT OSE mandates signature verification is an external protocol fact|Check current SUNAT OSE technical docs (CDR/status callback) at C1 spec time; cite source + retrieval date in the spec|
|Peru fiscal representation expectations (SUNAT decimal handling for IGV/totals)|C2|BigInt-cents is the internal convention; external UBL/CDR amount serialization rules are authoritative|Verify UBL 2.1 decimal rules against SUNAT factsheets at C2 design time|
|Vite 8 / `@vitejs/plugin-react` compatibility matrix (current supported versions)|C3|Root override (`vite 8.0.16`) vs devDep (`^7.6.0`) conflict resolution depends on current upstream compatibility|Check Vite/plugin release notes at C3 design time|

## Next recommended

`sdd-propose` — draft the umbrella proposal: program goals, the repo-scoped child-SDD breakdown (one child change per sibling repo), dependency/executability matrix, and phasing. Do not describe any `review-pending`/`implementation-blocked`/no-`state.yaml` change as runnable.

## Checklist

- [x] Ecosystem repos enumerated (3 sibling repos + 4 `drenyra-ai` worktrees identified as non-targets)
- [x] Cross-repo dependency edges mapped (tarball pins v0.2.0, vendored copy, engram sidecar)
- [x] OpenSpec store and change inventory verified (115 dirs; 60 archived; H02 review-pending; accountant implementation-blocked)
- [x] Test baselines verified (drenyra-ai 488/28; drenyra-pi 493/29)
- [x] Decision made: umbrella + repo-scoped child SDDs, with explicit why-not-single-change rationale
- [x] Child map, dependency order, executability guard, acceptance evidence, PR boundaries, non-goals, risk register defined
- [x] Web-verification requirements identified and deferred with a protocol (no web tooling in this run)
- [x] H02 flagged as resume-not-duplicate (state `tasks`/`review-pending`)
