# Exploration — Command Center Plugin Host

## Executive finding

The proposal is a deliberate product-boundary reset, not an incremental feature. The repository already contains strong financial/workspace primitives and a partially implemented plugin runtime, but its canonical architecture and documentation explicitly make Command Center a projection of `drenyra-ai`, not the host of that runtime. The change is therefore viable only as a contract-and-ownership migration with explicit deletion criteria; preserving the current layout or local authority would contradict the stated reset.

## Repository baseline

- The product surface is a Bun/TypeScript workspace with `apps/web`, `apps/api`, and many `packages/*`; the root workspace and task graph are defined in `package.json` and `turbo.json`.
- The documented product is a fiscal web/API/terminal surface. `README.md` describes eight FEOS planes and says Command Center consumes Drenyra-AI; `docs/architecture.md` repeats the consumer-only boundary.
- The repository has substantial local financial semantics: `packages/domain`, `packages/fiscal-agent-domain`, `packages/fiscal-sdd`, `packages/fiscal-query-engine`, persistence/infrastructure, and API vertical slices.
- Workspace is already a first-class local concept. `packages/workspace-domain/src/types/workspace.ts` defines `FinancialWorkspace`, branded IDs, objectives, immutable updates, revisioning, JSON serialization, and schema-version rejection. `packages/workspace-layout` has migration and property tests. `packages/workspace-contracts` exposes a Zod-backed package contract.
- The test suite proves selected contracts, not the proposed host boundary: workspace identity/serialization/migration/property tests and extensive mission/receipt conformance tests exist. No evidence was found here proving a stable external plugin-host ABI, provider capability negotiation, profile/bundle resolution, or safe runtime unloading.
- `packages/ai/MAP.md` describes a local gateway/control-plane/orchestrator architecture with provider failover, agent/tool registries, policy, approvals, evidence, and workflow recovery. This is a major ownership conflict if AI is to remain an external provider.
- A plugin implementation exists under `packages/pi/src/plugin/` (the repository's canonical path; references to a root `pi/` path are not valid in this worktree). Search results identify `registry.ts`, `types.ts`, `interface.ts`, and `fiscal-plugin.ts`, plus server integration in `packages/pi/src/serve.ts`. This is reusable evidence for plugin lifecycle concepts, but it is Pi-oriented and must not automatically become the Command Center host contract.

## Reusable contracts (retain only with proof)

| Contract/asset | Evidence | Reuse condition |
| --- | --- | --- |
| Financial workspace identity and scope | `packages/workspace-domain/src/types/workspace.ts` and its tests | Preserve as host-owned workspace contract after proving plugin/provider isolation does not weaken organization/company/period scope. |
| Workspace layout schema migration | `packages/workspace-layout/src/__tests__/migration.test.ts` and related layout/property tests | Reuse migration machinery, but treat current layout shape as disposable unless new host UX tests prove it is still the right composition model. |
| Workspace package boundary | `packages/workspace-domain`, `workspace-application`, `workspace-contracts`, `workspace-control`, `workspace-projections` | Candidate host core; define which packages are canonical and remove duplicate representations before expanding. |
| Fiscal invariants and conformance vectors | `packages/domain`, `packages/mission-domain` tests, `AI_POLICY.md` | Keep BigInt money, RUC/period isolation, receipts, evidence ordering, and approval boundaries. Their authority owner must be explicitly reassigned or consumed through a provider contract. |
| Existing plugin registry concepts | `packages/pi/src/plugin/*` | Extract only generic lifecycle/manifest/capability ideas; do not couple host to Pi or import agent authority into the UI host. |
| Turborepo workspace graph | root `package.json`, `turbo.json` | Preserve package-level tasks and dependency boundaries; new host/provider packages must declare workspace dependencies rather than reach into internals. |

## Architectural conflicts

1. **Authority conflict:** `docs/architecture.md`, `intended-usage.md`, and `AI_POLICY.md` state that missions, candidates, gates, receipts, ledger, and state transitions belong to `drenyra-ai`. The proposal makes Command Center a financial application host, which requires deciding whether “financial application” means owning ledger authority or hosting a provider that owns it.
2. **Local implementation conflict:** `packages/ai` and `packages/pi` contain runtime/orchestration/plugin behavior despite the documented external-provider boundary. The reset must classify these as extraction candidates, compatibility adapters, or deletion candidates; retaining both local and external versions creates duplicate authority.
3. **Scope conflict:** existing workspace types are accounting-specific and include fiscal objectives. A general plugin host needs a stable host context and capability boundary without allowing plugins to bypass tenant, company, period, policy, or approval controls.
4. **Plugin model conflict:** the Pi plugin contract appears vertical/plugin-oriented, while the requested host must support external providers including AI, Engram, Pi, Guardian, and infrastructure. Provider plugins need versioned manifests, lifecycle, capabilities, health, failure semantics, and trust policy—not merely registration.
5. **Documentation conflict:** current README and architecture docs describe a projection-only product. They are useful architectural evidence but cannot be treated as target truth after the reset.

## Migration seams

- **Host kernel seam:** introduce a narrow host-owned kernel around workspace, accounting UI state, profiles, bundles, plugin registry, capability policy, and provider adapters.
- **Provider port seam:** define typed ports for AI missions/agent execution, Engram memory, Pi operator execution, Guardian verification, and infrastructure services. Ports must return provider-owned status/evidence and must not recreate state machines.
- **UI seam:** route the web application through host application services and provider ports; preserve only UI components whose behavior is contract-tested against host-owned models.
- **Persistence seam:** separate host persistence (profiles, bundle selections, workspace/layout metadata) from provider persistence (missions, memory, receipts, ledger) and document ownership of each table/schema/object.
- **Profile/bundle seam:** resolve a profile into a deterministic bundle of plugin/provider versions and capabilities. This requires compatibility checks, provenance, upgrade/rollback behavior, and tenant-safe activation.
- **Compatibility seam:** temporarily support current consumers through adapters, but prohibit new imports of local AI/Pi authority while migration is active.

## Deletion candidates / sunset candidates

These are candidates, not authorized deletions:

- Local `packages/ai` gateway/control-plane/orchestrator implementations if equivalent released Drenyra-AI provider contracts are proven.
- Local `packages/pi` runtime/orchestration behavior if Drenyra Pi becomes an external provider and no host-specific adapter remains.
- Any local mission state machine, gate, materiality, receipt signing, ledger authority, or memory implementation that duplicates provider ownership.
- Current product/layout assumptions that encode projection-only navigation or hard-wire a single fiscal runtime, unless migration tests prove they remain useful host surfaces.
- Duplicate contract copies in local packages when the provider package publishes compatible versioned contracts.

## Missing proof / required investigation

- No inspected contract proves the external runtime versions available to this worktree, their package/API/ABI shape, or their compatibility with current tests.
- No host plugin manifest, capability schema, trust model, sandbox boundary, lifecycle state machine, or error/fallback contract is proven.
- No evidence covers provider absence, version skew, provider replacement, partial initialization, crash/restart, unload, or malicious/over-privileged plugin behavior.
- No migration inventory maps current database tables, routes, UI features, jobs, scripts, and package dependencies to host versus provider ownership.
- No proof establishes whether ledger/receipts remain external authority or move into the host; this is the central product decision and must precede implementation.
- Current dirty worktree was intentionally not normalized or modified; changed-file ownership and baseline test results remain unverified.

## Recommended next SDD decisions

1. Establish the authority decision: host-owned accounting authority versus host-owned application model backed by external accounting authority. Do not design plugin APIs before this is explicit.
2. Define the minimum host/provider contract: manifest, capabilities, lifecycle, context scope, version compatibility, evidence/receipt handoff, failure semantics, and security policy.
3. Build a repository inventory and contract matrix before proposing deletions; use tests and published provider contracts as the preservation gate.
4. Specify one migration slice (likely workspace/profile/bundle host kernel plus one provider adapter) and make all other runtime extraction/deletion work explicitly out of scope for that slice.

## Risk assessment

- **Critical:** accidental duplication of financial authority during migration.
- **High:** deleting local behavior before external providers have equivalent, versioned, tested contracts.
- **High:** plugin capability escalation across tenant/company/period or approval boundaries.
- **Medium:** workspace/layout migration and persistence incompatibility.
- **Medium:** Turborepo dependency graph and package-boundary drift during extraction.
- **Low:** documentation and naming churn, provided it follows a settled ownership model.
