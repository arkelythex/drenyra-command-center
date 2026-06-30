# Platform connection (Drenyra product repo)

Cross-repo integration is documented in the **Arkelythex platform repo**:

[docs/cross-repo/drenyra-connection.md](https://github.com/arkelythex/Arkelythex/blob/main/docs/cross-repo/drenyra-connection.md)

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

| Service | URL |
|---------|-----|
| Web (Digits / Command Center) | `http://localhost:5174` |
| API (Codex engine) | `http://localhost:3000` |
| Engram (evidence sidecar) | `http://localhost:8733/health` |

## Cross-repo dev workflow

```bash
# Terminal 1 — Drenyra product (:5174)
cd Drenyra && bun run dev:web

# Terminal 2 — Arkelythex shell (:5173)
cd arkelythex && VITE_DRENYRA_DEV_URL=http://127.0.0.1:5174 bun run --filter @arkelythex/web dev
```

Open shell at `http://localhost:5173/drenyra` → redirects to Drenyra Command Center.

## Related

- [Product topology](../canon/product-topology.md)
- [ADR-034 DFAS](../02-adr/adr-034-drenyra-fiscal-app-server.md)
