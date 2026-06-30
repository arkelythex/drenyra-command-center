# Platform connection (Drenyra product repo)

Cross-repo integration is documented in the **Arkelythex platform repo**:

[docs/cross-repo/drenyra-connection.md](https://github.com/arkelythex/Arkelythex/blob/main/docs/cross-repo/drenyra-connection.md)

## Quick dev workflow

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
