# Tasks — S1: AI/Agent Ecosystem Consolidation

## Review Workload Forecast

- **Total estimado**: ~700 líneas en 3 PRs (reducido de 1800 por paquetes ya removidos)
- **Chained PRs**: Sí — 3 PRs secuenciales
- **400-line budget risk**: Bajo

## PR1 — Audit: find ai/ overlaps with drenyra-pi

- [ ] List all exports from @drenyra/ai/src/agents/, memory/, governance/, control-plane/
- [ ] Search consumers: rg for each export in apps/api, apps/web, packages/*
- [ ] Create migration map
- [ ] Verify no consumers use the overlapping exports

## PR2 — Slim @drenyra/ai (~300 lines)

- [ ] Remove agents/ dir from @drenyra/ai/src/
- [ ] Remove memory/ dir from @drenyra/ai/src/
- [ ] Remove governance/ dir from @drenyra/ai/src/
- [ ] Remove control-plane/ dir from @drenyra/ai/src/
- [ ] Update @drenyra/ai/src/index.ts barrel (remove deleted exports)
- [ ] Add re-exports pointing to @drenyra/pi for migration window
- [ ] `bun run typecheck` in @drenyra/ai passes

## PR3 — Consumer migration (~200 lines)

- [ ] For each consumer that used removed exports, update to @drenyra/pi
- [ ] Remove deprecated re-exports after 0 remaining consumers
- [ ] Verify: `bun run typecheck` in apps/api passes
- [ ] Verify: `bun run test` in affected packages passes
