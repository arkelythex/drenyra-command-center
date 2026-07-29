# Platform connection (Drenyra product repo)

Cross-repo integration is documented in the **Drenyra platform repo**:

[docs/cross-repo/drenyra-connection.md](https://github.com/drenyra/Drenyra/blob/main/docs/cross-repo/drenyra-connection.md)

## Standalone Drenyra (single repo)

```bash
cd Drenyra
bun install --frozen-lockfile
cp .env.example .env
bun run dev:stack      # postgres :5436 + engram :8733
bun run db:push
bun run dev            # api :3000 + web :5174 (host)
# or split terminals:
bun run dev:api
bun run dev:web
bun run dev:check      # infra smoke (add CHECK_API=1 INCLUDE_WEB=1 when app servers are up)
```

| Service                      | URL                            | Purpose                                  |
| ---------------------------- | ------------------------------ | ---------------------------------------- |
| Web (Drenyra Command Center) | `http://localhost:5174`        | Fiscal command center SPA                |
| API (Fiscal API)             | `http://localhost:3000`        | Elysia vertical slices, fiscal workflows |
| Engram (evidence sidecar)    | `http://localhost:8733/health` | Phase-gate evidence, fiscal audit trails |

## Cross-repo dev workflow

```bash
# Terminal 1 — Drenyra product (:5174)
cd Drenyra && bun run dev:web

# Terminal 2 — Drenyra shell (:5173)
cd drenyra && VITE_DRENYRA_DEV_URL=http://127.0.0.1:5174 bun run --filter @drenyra/web dev
```

Open shell at `http://localhost:5173/drenyra` → redirects to Drenyra Command Center.

## Related

- [Product topology](../canon/product-topology.md)
- [ADR-034 DFAS](../02-adr/adr-034-drenyra-fiscal-app-server.md)
- [Drenyra Product Philosophy](../products/drenyra-product-philosophy.md)
