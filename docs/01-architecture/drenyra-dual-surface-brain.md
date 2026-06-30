# Drenyra dual-surface Brain architecture

**Última actualización**: 2026-06-30

Drenyra is API/domain-first. React Web and Go CLI are UX adapters over the same fiscal command center and Brain timeline.

## DFAS transport (v1)

As of ADR-034, Brain threads and runtime runs converge under the **Drenyra Fiscal App Server (DFAS)**:

- Canonical protocol: [drenyra-fiscal-app-server-2026.md](./drenyra-fiscal-app-server-2026.md)
- WebSocket: `WS /api/drenyra/v1/ws` (JSON-RPC 2.0)
- SSE fallback: `GET /api/drenyra/v1/threads/:threadId/events`
- Domain contracts: `packages/domain/src/drenyra/dfas-protocol-types.ts`

REST Brain endpoints (`/api/drenyra/brain/*`) and runtime runs (`/api/drenyra/runs/*`) remain as **compat layer v0** until all surfaces migrate to DFAS. Both v0 and v1 delegate to the same [Unified Runtime Kernel](../../apps/api/src/features/drenyra/kernel/README.md).

## Invariants

- `apps/api` is the runtime source of truth.
- `packages/domain/src/drenyra` owns shared contracts.
- CLI local SQLite is an operational cache/outbox only; it is not fiscal source of truth.
- All writes and streams require organization, company, RUC, fiscal period and user scope.
- RUC is validated with SUNAT Módulo 11 at API boundary.
- Brain thread/turn/item actions append scoped audit events.
- SSE/WS opens only after the thread exists in the same fiscal scope.
- DFAS item stream entries MUST use monotonic sequence per thread (`assertMonotonicSequence`).
- Surfaces MUST NOT drop envelope fields (evidence, checks, risk, approval, diff, trace).

## Flow

1. CLI/Web resolves explicit fiscal scope.
2. Client creates or resumes a Brain thread (`thread/create` or REST compat).
3. Client starts a Brain turn before harness/tool execution (`turn/start`).
4. Harness/API output links back to Brain metadata (`brainThreadId`, `brainTurnId`).
5. Item stream delivers evidence, gates, envelopes, approvals to all subscribed clients.
6. Web and CLI render the same timeline from `item/appended` notifications.

## Parity checklist

- API route and contract updated.
- DFAS protocol version pinned (`DFAS_PROTOCOL_VERSION`).
- Web adapter updated (WebSocket or SSE).
- CLI contract/types updated (NDJSON or HTTP).
- Tenant/RUC/period tests added.
- Audit event assertion added.
- Capability matrix + guardian evaluated before tool execution.
- Docs updated when behavior changes.

## Fiscal sovereignty positioning

Drenyra is not a CRUD accounting dashboard. It is the Fiscal Agent Command Center over ARKELYTHEX Fiscal Ontology and Fiscal Truth Mesh. See `docs/01-architecture/arkelythex-fiscal-sovereignty-platform.md`.

## Related docs

- [ADR-034: Drenyra Fiscal App Server](../02-adr/adr-034-drenyra-fiscal-app-server.md)
- [Drenyra Repo Sync Playbook](../05-development/drenyra-repo-sync.md)
