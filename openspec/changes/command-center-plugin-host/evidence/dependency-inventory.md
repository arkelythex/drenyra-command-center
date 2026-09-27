# Slice 0 Dependency Inventory

## Verified workspace graph

- Root workspaces are only `apps/*` and `packages/*`; `packages/plugins/*` and `packages/providers/*` are not workspace globs yet.
- Root `build`/`test` use Bun workspace filtering; Turbo has `build -> ^build`, independent uncached `test`, `typecheck -> ^typecheck`, and `lint`.
- Public exports were read from package manifests and `src/index.ts`; no internal-path import is approved as a future seam.

| Package group | Declared dependency/export evidence | Disposition |
| --- | --- | --- |
| workspace family | domain <- application/contracts/layout; control depends on domain/application/contracts/projections; projections depends on domain/application | Adapt toward host workspace; review `AuthorityStore` semantics before reuse. |
| mission family | `mission-domain -> file:vendored/drenyra-ai-0.2.0.tgz`; mission-client -> protocol + domain; protocol has local source | Keep only bounded adapter/transport seams; local state shapes are sunset authority. |
| Pi | `@drenyra/pi -> file:vendored/drenyra-ai-0.4.1.tgz`; exports runtime/harness/approval/plugin behavior | Provider-adapter candidate; not host kernel. |
| AI | `@drenyra/ai -> application/infrastructure/persistence/shared`; exports gateway/control-plane/orchestrator/memory | Dependency direction conflicts with external-provider target; quarantine new consumers. |
| persistence/infrastructure | persistence -> application/domain/shared; infrastructure -> application/domain/persistence/security/shared and re-exports persistence | Split host/provider namespaces; generic re-exports are not an approved provider boundary. |
| fiscal engines | fiscal-approval -> orchestrator + phase-gatekeeper; each exports local gate/state behavior | Extract invariant vectors only; do not import into new host authority paths. |

## Sunset-authority import evidence

| Import seam | Verified consumers | Status |
| --- | --- | --- |
| `@drenyra/mission-domain` / protocol | API missions service/controller/runtime/recovery/tests; web workspace and cierre-mensual hooks/components/services | Existing compatibility only; no new imports. |
| `@drenyra/pi` | API platform MCP, agents, harness, Drenyra routes/tools/swarm, intelligence; domain type reference | Quarantine; target is a scoped provider adapter. |
| `@drenyra/ai/*` | API accounting jobs, LLM gateway, AI swarm/RAG/judgment-day; infrastructure agents/model router; persistence model router | Quarantine; target is a released AI provider adapter. |
| local mission tables | missions service/middleware/recovery/handlers/SSE write `accounting_missions`, idempotency and events; receipt integration writes `mission_receipts` | Canonical second-writer risk; migration freeze applies. |
| local approvals | FiscalChat imports infrastructure fiscal-approval and mutates `approvalStore`; Pi exports gate/store; Drenyra command-center repositories update approvals | Canonical approval ownership unresolved; quarantine. |

## Plugin and persistence findings

- `packages/pi/src/plugin` is not exported by `@drenyra/pi` package exports. Its registry replaces by name and lacks manifest release evidence, compatibility, trust, tenant/RUC scope, health, provenance, and safe replacement states.
- `FiscalPlugin` accepts money-like values as JavaScript `number`, validates only RUC prefixes, and can auto-approve gates. It is implementation-shape evidence, not reusable host policy.
- Local canonical-looking stores include mission/receipt tables, fiscal-memory tables/revisions, Drenyra cases/agent-runs/approvals/audit, journal/transaction/fiscal-truth/SIRE/close-gate repositories, Redis queues, and generic object storage.
- Approved future seams are host-owned ports, read-only compatibility adapters preserving provenance/scope, released `drenyra-ai` imports behind adapter edges, and role-specific persistence ports. No current source import is approval to grant authority.

## Audit commands

`bun -e` inspected root/package manifests and Turbo tasks; `find` enumerated plugin, schema, repository, migration, queue, UI and route files; targeted `rg` traced package imports and insert/update/delete sites. Commands were read-only; CodeGraph was consulted first (index: 4,988 files/45,427 nodes, with 8 modified and 161 removed pending changes).
