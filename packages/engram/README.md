# Drenyra Engram — Fiscal Evidence Store

**Última actualización**: 2026-07-09 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Go + SQLite sidecar** para persistencia de memoria fiscal del Drenyra Orchestrator.

Inspirado en el sistema Engram de [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai):
cada decisión fiscal se registra como evidencia trazable formando un
"evidence graph" para auditoría SUNAT.

## ¿Por qué un sidecar en Go?

La memoria fiscal necesita ser rápida, barata y estar siempre disponible. Go con SQLite nos da:

- **Latencia ∼1ms** por operación (vs ∼10-50ms yendo a Postgres)
- **Zero dependencies externas** — corre como sidecar al lado del app principal
- **FTS5** para búsqueda de texto completo sobre evidencia
- **WAL mode** para lecturas concurrentes sin bloqueo

## Arquitectura

```
┌─────────────────────┐     HTTP/REST      ┌──────────────────────┐
│  Drenyra Orchestrator│ ───────────────── → │  drenyra-engram      │
│  (TypeScript/Mastra) │ ← ───────────────── │  (Go/SQLite sidecar) │
│                     │     JSON            │                      │
│  EvidenceGraph.ts   │                     │  cmd/server/         │
│  (HTTP adapter)     │                     │  internal/db/        │
└─────────────────────┘                     │  internal/api/       │
                                            │  pkg/client/         │
                                            └──────────────────────┘
```

## Quick Start

```bash
# Iniciar servidor
cd packages/engram
go run cmd/server/main.go

# Puerto por defecto: 8732
# DB por defecto: data/engram.db
```

## API

### Evidence CRUD

```bash
# POST — guardar evidencia
curl -X POST localhost:8732/api/v1/evidence \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "ev-001",
    "operationId": "op-123",
    "phase": "submit",
    "tier": "T3_CRITICAL",
    "actor": "ai",
    "action": "emitir_factura",
    "input": {"monto": 10000},
    "output": {"cdr": "XYZ"},
    "tenantId": "tenant-1",
    "ruc": "20123456789",
    "companyId": "company-1",
    "traceId": "trace-abc"
  }'

# GET — obtener por ID
curl localhost:8732/api/v1/evidence/ev-001

# GET — listar con filtros
curl "localhost:8732/api/v1/evidence?tenantId=tenant-1&limit=10"

# GET — full-text search
curl "localhost:8732/api/v1/evidence/search?q=factura"
```

### Sessions

```bash
# POST — crear sesión fiscal
curl -X POST localhost:8732/api/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{"id": "session-1", "tenantId": "tenant-1", "ruc": "20123456789"}'

# POST — vincular evidencia a sesión
curl -X POST localhost:8732/api/v1/sessions/session-1/evidence/ev-001
```

### Health & Stats

```bash
curl localhost:8732/health
curl localhost:8732/api/v1/stats
```

## Tecnologías

| Componente        | Elección                    | Por qué                                           |
| ----------------- | --------------------------- | ------------------------------------------------- |
| **Lenguaje**      | Go 1.26+                    | Runtime moderno, `slog`, `net/http` 1.22+ routing |
| **Base de datos** | SQLite (modernc.org/sqlite) | Pure Go, sin CGO, WAL mode, FTS5                  |
| **Dependencias**  | Solo stdlib + sqlite driver | Mínimo mantenimiento                              |
| **Deploy**        | Sidecar process             | Corre junto al app principal en producción        |
