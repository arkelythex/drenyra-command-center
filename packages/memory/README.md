# @drenyra/memory — Unified Memory Subsystem

Domain-agnostic agent memory and session storage. This package is the TypeScript
adapter for the **Drenyra Engram** sidecar
([`arkelythex/drenyra-engram`](https://github.com/arkelythex/drenyra-engram),
a scope-first institutional accounting memory engine in Go).

No monetary fields exist in this package; Drenyra money values are BigInt
cents (repo-wide rule) and nothing here touches them.

## Engram adapter

The package exposes a typed HTTP client over the engine's v1 REST surface
(`GET/POST /v1/observations`, `GET /v1/search`, `GET /v1/context`,
`GET /v1/doctor`), plus an `EngramSessionStore` that implements the existing
[`SessionStore`](./src/session-store.ts) interface.

### Configuration (fail closed)

| Variable                    | Default               | Meaning                                    |
|-----------------------------|-----------------------|--------------------------------------------|
| `DRENYRA_ENGRAM_URL`        | `http://localhost:8733` | Sidecar base URL (trailing `/` trimmed)  |
| `DRENYRA_ENGRAM_ENABLED`    | `false`               | `"true"`/`"1"` activates the adapter       |
| `DRENYRA_ENGRAM_TOKEN`      | *(none)*              | Optional bearer token (`Authorization: Bearer`) |
| `DRENYRA_ENGRAM_TIMEOUT_MS` | `5000`                | Per-request timeout in milliseconds        |

The adapter is **disabled by default** — it never touches the sidecar unless
`DRENYRA_ENGRAM_ENABLED` is explicitly `true` or `1`. Consumers gate on
`isEngramEnabled()` and keep a fallback path.

### Field mapping (SessionStore → engram)

| Memory field              | Engram field                       |
|---------------------------|------------------------------------|
| `metadata.tenantId`       | `scope.organizationId`             |
| `metadata.ruc`            | `scope.ruc` (+ `scope.companyId`)  |
| `metadata.period`         | `scope.period` (`""` when absent)  |
| `content` (string)        | `content.what`                     |
| `type`                    | observation `type` and `title`     |
| `sessionId` / `agent:type`| `topicKey` (upsert chain identity) |
| `agentId`                 | `provenance.actor`                 |
| `sessionId`               | `provenance.session`               |

Company-scoped operations require an 11-digit `ruc` (the engine validates it).
On reads the scope is reconstructed from `MemoryScope` (`scope.tenantId` →
`organizationId`, `scope.metadata.ruc` → `ruc`, `scope.metadata.period` →
`period`), so records returned by the store round-trip into new queries.

### Usage

```ts
import { EngramClient, EngramSessionStore, engramConfig } from "@drenyra/memory";

const store = new EngramSessionStore(new EngramClient(engramConfig()));

await store.save({
  agentId: "analysis",
  sessionId: "sess-1",
  scope: { tenantId: "org-1" },
  type: "fact",
  content: "Analysis complete",
  metadata: { tenantId: "org-1", ruc: "20123456789" },
});

const results = await store.search({
  text: "analysis",
  scope: { tenantId: "org-1", metadata: { ruc: "20123456789" } },
});
```

### Errors

Every failure is a typed [`EngramError`](./src/engram-client.ts) with a `kind`
(`http` | `network` | `timeout` | `invalid-input` | `invalid-response`) and a
stable machine-readable `code` (engine codes such as `INVALID`, `NOT_FOUND`,
`CONFLICT`; client codes such as `ENGINE_UNREACHABLE`, `ENGINE_TIMEOUT`).
