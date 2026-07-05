---
last-verified: 2026-06-20
source-of-truth: apps/data-engine/
auto-generated: false
---

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

# 🦀 Drenyra Data Engine

**High-Performance Financial Data Processing** powered by [Polars](https://www.pola.rs/) (Rust Core).

Mientras el backend principal de Drenyra corre en **Bun (Elysia)**, las operaciones financieras intensivas en datos necesitan procesamiento especializado. Este microservicio FastAPI es esa capa.

## Si solo tenés tres minutos

1. **Arranque**: `cd apps/data-engine && uv sync && uvicorn src.main:app --reload --port 8000`
2. **Endpoints clave**: `POST /api/v1/sire/compras` (procesar SIRE), `POST /api/v1/cashflow/forecast` (forecast ML)
3. **Stack**: FastAPI + Polars (DataFrame 100x Pandas) + scikit-learn
4. **Docs interactivas**: `http://localhost:8000/docs` (Swagger UI)

## 📋 Overview

| Capacidad | Stack | Por qué |
|-----------|-------|---------|
| 📊 SIRE File Processing | Polars | Analizar archivos SUNAT (10M+ filas) a 100x velocidad Pandas |
| 📈 Cashflow Forecasting | scikit-learn | Predicciones ML de flujo de caja |
| 🏦 Bank Reconciliation | Polars cross-join | Fuzzy matching entre estados de cuenta y registros |
| 🧮 Pattern Detection | Polars analytics | Pagos recurrentes, anomalías, tendencias |
| 💰 Cash Position Analysis | Polars cum_sum | Balance en tiempo real |

## 🚀 Tech Stack

| Technology | Purpose | Why? |
|-----------|---------|------|
| **FastAPI** | Web framework | Modern, async, auto-docs |
| **Polars** | DataFrame library | 100x faster than Pandas (Rust core) |
| **scikit-learn** | ML forecasting | Industry standard |
| **Pydantic v2** | Data validation | Type safety + performance |
| **orjson** | JSON parsing | Rust-powered, fastest JSON lib |
| **asyncpg** | PostgreSQL driver | Async database access |

## 📦 Installation

### Option 1: UV (Recommended)

```bash
cd apps/data-engine
uv sync
uv run uvicorn src.main:app --reload --port 8000
```

### Option 2: pip

```bash
pip install -e .
uvicorn src.main:app --reload --port 8000
```

### Option 3: Docker

```bash
docker build -t drenyra-data-engine .
docker run -p 8000:8000 drenyra-data-engine
```

## 🌐 API Endpoints

### SIRE Processing

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/sire/compras` | Process SIRE Compras (Purchases) |
| `POST /api/v1/sire/ventas` | Process SIRE Ventas (Sales) |

### Cashflow Analysis

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/cashflow/analyze` | Analyze historical cashflow |
| `POST /api/v1/cashflow/forecast` | ML-based 90-day forecast |
| `POST /api/v1/cashflow/anomalies` | Detect unusual patterns |

### Banking Analysis

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/banking/parse-statement` | Parse bank CSV/Excel (BCP, Interbank, BBVA) |
| `POST /api/v1/banking/reconcile` | Reconcile transactions |
| `POST /api/v1/banking/patterns` | Analyze recurring payments |
| `POST /api/v1/banking/cash-position` | Calculate running balance |

## ⚡ Performance

| Operation | Dataset Size | Time | vs Pandas |
|-----------|-------------|------|-----------|
| SIRE Processing | 1M rows | ~500ms | 60x faster |
| Cashflow Analysis | 100K transactions | ~200ms | 50x faster |
| Bank Reconciliation | 50K + 50K rows | ~1s | 40x faster |

**Why so fast?** Polars uses **Apache Arrow** (zero-copy, columnar), written in **Rust**, with **lazy evaluation** and **parallel execution**.

## 🔧 Configuration

Create `.env` file (see `.env.example`):

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/drenyra
REDIS_URL=redis://localhost:6379  # Optional
POLARS_MAX_THREADS=8  # Match CPU cores
```

## 📊 Usage from Elysia Backend

```typescript
const response = await fetch("http://localhost:8000/api/v1/sire/compras", {
  method: "POST",
  body: formData,  // SIRE CSV file
});

const result = await response.json();
console.log(result.summary.total_purchases);  // S/ 1,500,000.50
```

## 📚 API Documentation

Interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🐳 Docker

```bash
docker build -t drenyra-data-engine:latest .
docker run -d -p 8000:8000 --name data-engine drenyra-data-engine:latest
```

## Permanence and integration (monorepo)

**Why FastAPI lives outside the Bun API:** data-heavy paths (Polars, large SIRE files, batch analytics) are isolated for CPU/memory and dependency hygiene, aligned with [ADR-015](../../docs/02-adr/adr-015-layered-language-placement-ts-go-rust.md).

**Keep this service** while those workloads need vectorized Python/Rust-core dataframe work or ML-adjacent stacks that are costly to replicate in Elysia.

**Contracts with TypeScript**

- HTTP/OpenAPI under `apps/data-engine`; the Bun API and web clients consume it via typed clients and **contract tests** (`apps/api` contract specs / CI smoke — see `scripts/ci/run-data-engine-contracts.sh`).
- Environment: `DATA_ENGINE_URL` and related flags documented for local and CI.

**Last updated:** 2026-06-20
