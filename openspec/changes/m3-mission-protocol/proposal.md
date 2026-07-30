# M3 — Headless Mission Protocol + CLI Reference Client

**Status:** Proposed → Implementation  
**Date:** 2026-07-30  
**Branch:** `feature/m3-mission-protocol`  

## Scope

### M3A — Protocol SDK
- `packages/mission-client` — TypeScript SDK con `MissionClient` interface
- Contratos: CreateMission, GetMission, ListMissions, ExecuteMission, SubmitResolution, CreateApproval, ApplyProposal, ReconcileMission, GetEvidenceBundle, VerifyReceipt, SubscribeToEvents
- Tipos compartidos, errores tipados, idempotency keys, paginación, SSE/event cursors
- Generación de clientes tipados

### M3B — CLI Reference Client (Go)
Comandos en `apps/cli/internal/cmd/`:
```
drenyra close create --company --period
drenyra close status <id>
drenyra close gates <id>
drenyra close exceptions <id>
drenyra close approve <id> --proposal-version
drenyra receipt verify <id>
```
Salida humana y `--json`.

## Architecture
```
packages/mission-client/     → TypeScript SDK
    define MissionClient interface
    implementa HTTP transport contra apps/api
    consume contracts de mission-domain

apps/cli/internal/cmd/       → Go commands
    llama a API REST via HTTP
    sin lógica de dominio duplicada
```

## Non-goals
- No mobile, no desktop, no MCP todavía (M3C-E)
- No @drenyra/pi integration (post-M3)
- No cambios al mission-domain package
- No cambios a apps/api (ya existe)

## DoD
1. MissionClient interface completa (10+ métodos)
2. HTTP transport implementation con idempotency + error mapping
3. 6 CLI commands: create, status, gates, exceptions, approve, verify
4. Salida --json en todos los comandos
5. Tests: SDK unit + CLI integration
