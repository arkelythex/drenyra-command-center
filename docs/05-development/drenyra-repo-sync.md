# Drenyra Repository Sync Playbook

**Canonical product repo:** `Drenyra/`  
**Platform repo:** `arkelythex/Arkelythex`  
**Platform ADR:** [ADR-033 Platform-Product Split](https://github.com/arkelythex/Arkelythex/blob/main/docs/02-adr/adr-033-platform-product-split.md) (Arkelythex)  
**Product harness ADR:** [ADR-034 DFAS](../02-adr/adr-034-drenyra-fiscal-app-server.md) (this repo)

## Why sync exists

During Fase 1 transition, Arkelythex retains **read-only mirrors** of Drenyra packages. Historical drift (phase layer, SIRE-bench, Lexori) was ported **one-way Arkelythex → Drenyra**. All **new product work** lands in **Drenyra only**.

## Sync rules (post ADR-033)

1. **Write product code and DFAS docs in `Drenyra/` first.**
2. **Do not add new fiscal files in Arkelythex** — CI boundary script blocks deprecated paths.
3. **Arkelythex → Drenyra** only for one-time port of legacy drift (completed items: sire-bench, orchestrator gates, web fixes).
4. **Version pins** in domain: `DFAS_PROTOCOL_VERSION`, `DATA_ENGINE_CONTRACT_VERSION`.
5. **Contract tests** run in **Drenyra** before ship; Arkelythex mirrors are not extended.

## Ownership

| Artifact | Canonical |
|---|---|
| DFAS ADR-034, protocol spec, SDD tasks | **Drenyra** `docs/` |
| `packages/domain/src/drenyra/` | **Drenyra** |
| `apps/api/src/features/drenyra/` | **Drenyra** |
| `packages/drenyra-orchestrator/` | **Drenyra** |
| Platform shell, IAM, MF host | **Arkelythex** |
| Cross-repo connection doc | **Arkelythex** `docs/cross-repo/drenyra-connection.md` |

## Legacy sync script

`scripts/sync-drenyra-standalone.sh` in Arkelythex was used for initial doc/port from platform mirror → product repo. **Do not use for new features.** Prefer editing Drenyra directly.

For drift check (optional):

```bash
# From Arkelythex — reports files that differ from Drenyra canonical
ARKELYTHEX_ROOT=./ DRENYRA_STANDALONE_ROOT=../Drenyra ./scripts/sync-drenyra-standalone.sh --check
```

## Contract tests (Drenyra)

```bash
cd packages/domain && bun run test -- src/drenyra/__tests__/dfas-*.test.ts
cd apps/api && bun run test:contracts
bun run test:sire-bench
```

## PR checklist (Drenyra product)

- [ ] No dependency on new code in Arkelythex mirror paths
- [ ] Domain + DFAS tests green
- [ ] `product-topology.md` updated if layout changes
- [ ] Cross-link Arkelythex `drenyra-connection.md` if env/MF contract changes

## Fase 2 cleanup (deferred)

- Delete Arkelythex deprecated mirrors (`packages/drenyra-orchestrator`, etc.)
- Publish shared `@arkelythex/domain` to registry
- Implement DFAS WebSocket per ADR-034

## Related

- [ADR-034: Drenyra Fiscal App Server](../02-adr/adr-034-drenyra-fiscal-app-server.md)
- [Product topology](../canon/product-topology.md)
- [Arkelythex drenyra-connection.md](https://github.com/arkelythex/Arkelythex/blob/main/docs/cross-repo/drenyra-connection.md)
