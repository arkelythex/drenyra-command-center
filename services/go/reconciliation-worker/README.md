---
last-verified: 2026-04-27
source-of-truth: services/go/reconciliation-worker/
auto-generated: false
---

# Go Reconciliation Worker

High-throughput reconciliation worker for reference/amount matching.

## Why Go (not only TypeScript)

Throughput and simple concurrency for batch matching without pulling the full Elysia stack. See [ADR-015](../../../docs/02-adr/adr-015-layered-language-placement-ts-go-rust.md) and the parent [services/go README](../README.md).

## Permanence

Keep while reconciliation load or deployment constraints favor a small Go binary; consolidate into TS only with an ADR if operational cost outweighs benefit.

## Integration contract

- HTTP JSON API documented by routes below; callers in the Bun monorepo should treat payloads as versioned.
- Run `go test ./...` locally or `bun run go:reconcile:test` from the repo root.

## Endpoints

- `GET /health`
- `POST /v1/reconcile`

## Run

```bash
cd services/go/reconciliation-worker
go run ./cmd/server
```

## Test

```bash
cd services/go/reconciliation-worker
go test ./...
```

---

## Directory Structure

```
services/go/reconciliation-worker/
├── cmd/
│   └── server/
│       └── main.go          # HTTP server entrypoint, mux, handlers
├── internal/
│   └── reconcile/
│       ├── service.go       # Reconcile() core logic
│       └── service_test.go  # Unit tests
├── go.mod
├── go.sum
└── README.md
```

---

## Request/Response Schemas

### `POST /v1/reconcile`

**Request:**

```json
{
  "sourceA": [
    { "reference": "INV-001", "amountCents": 118000 },
    { "reference": "INV-002", "amountCents": 59000 }
  ],
  "sourceB": [
    { "reference": "INV-001", "amountCents": 118000 },
    { "reference": "INV-003", "amountCents": 236000 }
  ],
  "toleranceCents": 0
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `sourceA` | `Entry[]` | First set of entries to match |
| `sourceB` | `Entry[]` | Second set of entries to match |
| `toleranceCents` | `int64` | Allowed difference per entry (>= 0) |

**Entry:**

```json
{ "reference": "string", "amountCents": "int64" }
```

**Response:**

```json
{
  "matched": 1,
  "missingInSourceA": [ { "reference": "INV-003", "amountCents": 236000 } ],
  "missingInSourceB": [ { "reference": "INV-002", "amountCents": 59000 } ],
  "amountMismatches": [],
  "totalDiscrepancies": 2
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `matched` | `int` | Number of entries that matched within tolerance |
| `missingInSourceA` | `Entry[]` | Entries in sourceB with no match in sourceA |
| `missingInSourceB` | `Entry[]` | Entries in sourceA with no match in sourceB |
| `amountMismatches` | `Mismatch[]` | Same reference, different amounts |
| `totalDiscrepancies` | `int` | Sum of all three discrepancy counts |

**Mismatch:**

```json
{ "reference": "string", "left": "int64", "right": "int64" }
```

### `GET /health`

**Response:**

```json
{ "status": "ok", "service": "go-reconciliation-worker" }
```

---

## Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `PORT` | `8120` | HTTP server listen port |
| `DATABASE_URL` | — | PostgreSQL connection string (for persistence) |
| `NATS_URL` | — | NATS JetStream server URL (for async reconciliation) |

---

## NATS Integration

This worker can consume reconciliation requests via NATS JetStream. Configure `NATS_URL` to enable async mode:

```bash
# Example: subscribe to reconciliation queue
nats sub "reconciliation.requests"
```

When NATS is active, the worker publishes results back to a response subject.

---

## PostgreSQL Connection

Set `DATABASE_URL` to connect to PostgreSQL for persisted reconciliation records:

```
postgresql://user:password@host:5432/arkelythex
```

The worker uses the DB to:
- Fetch historical entries for comparison
- Persist reconciliation results for audit

---

## Deployment

### Docker

```dockerfile
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:latest
COPY --from=builder /app/server /server
CMD ["/server"]
```

```bash
docker build -t arkelythex/reconciliation-worker:latest ./services/go/reconciliation-worker
docker run -p 8120:8120 arkelythex/reconciliation-worker:latest
```

### docker-compose

```yaml
services:
  reconciliation-worker:
    build: ./services/go/reconciliation-worker
    ports:
      - "8120:8120"
    environment:
      - PORT=8120
      - DATABASE_URL=postgresql://arkelythex:password@postgres:5432/arkelythex
      - NATS_URL=nats://nats:4222
    depends_on:
      - postgres
      - nats
```

### fly.io

```bash
fly launch --image arkelythex/reconciliation-worker:latest
fly secrets set DATABASE_URL="postgresql://..." NATS_URL="nats://..."
fly scale count 2
```

---

## Running from Monorepo

```bash
bun run go:reconcile:test    # run Go tests
bun run go:reconcile:start   # start the worker server (if configured)
```

These scripts are defined in the root `package.json` and delegate to the Go toolchain.

---

## Health Check

```bash
curl http://localhost:8120/health
# { "status": "ok", "service": "go-reconciliation-worker" }
```

Returns `200 OK` when the service is running. No authentication required.

---

**Última actualización**: 2026-06-20

*Alineado con la [Filosofía Gentleman](../../../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación clara, cálida y progresiva.*
