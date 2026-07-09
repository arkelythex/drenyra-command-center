<!-- Manual navigation map for Data Engine (Python). See CODEX-MAP.md for monorepo root. -->
# DATA-ENGINE-MAP — Drenyra Data Engine Navigation

**Última actualización**: 2026-07-09 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

## Si solo tenés tres minutos

1. **Ubicación**: `apps/data-engine/` — FastAPI + Polars para procesamiento fiscal intensivo.
2. **Comando para arrancar**: `uv sync && uvicorn src.main:app --reload --port 8000`.
3. **Arquitectura**: 3 routers (SIRE, cashflow, banking) → 3 services Polars-heavy.
4. **Para empezar**: leé `src/main.py` y seguí el flujo de un endpoint en `src/api/routes.py`.

## Start here
- **Location:** `apps/data-engine/`
- **Package:** `drenyra-data-engine`
- **Language:** Python 3.11+
- **Framework:** FastAPI + Uvicorn
- **Data engine:** Polars (Rust-powered DataFrame) + scikit-learn (ML forecasting)
- **Build:** `uv sync` — virtualenv-free, uv-managed
- **Tests:** None yet (pytest configured in optional-dependencies)
- **Lines of Python:** ~660 (6 source files)

## Tech stack
| Technology | Version | Purpose |
|---|---|---|
| Python | >=3.11 | Runtime |
| FastAPI | >=0.110.0 | Async web framework |
| Uvicorn | >=0.29.0 | ASGI server (uvloop) |
| Polars | >=0.20.0 | Rust-core DataFrame (100x Pandas) |
| Pydantic v2 | >=2.6.0 | Schema validation + Settings |
| Pydantic-Settings | >=2.2.0 | .env config loading |
| orjson | >=3.9.15 | Rust JSON parser |
| scikit-learn | >=1.4.0 | Cashflow forecasting (LinearRegression) |
| NumPy | >=1.26.0 | Numerical ops for ML |
| Ruff | >=0.3.0 | Linter + formatter (Rust) |
| pytest | >=8.0.0 | Test framework (dev) |

## Architecture

```
src/main.py                           ← FastAPI app entry (CORS, router, /health)
  |
  ++- src/api/routes.py               ← REST endpoints (3 service routers)
  |     ++- POST /api/v1/sire/compras
  |     ++- POST /api/v1/cashflow/analyze
  |     ++- POST /api/v1/banking/reconcile
  |
  ++- src/services/                   ← Business logic (Polars-heavy)
  |     ++- sire_processor.py        SIRE SUNAT file processing
  |     ++- cashflow_analyzer.py      Cashflow analysis + ML forecast
  |     +-- banking_analyzer.py       Bank reconciliation + pattern detection
  |
  ++- src/core/config.py              ← Settings (pydantic-settings, .env)
```

## API endpoints

| Method | Path | Handler in routes.py | Service |
|--------|------|----------------------|---------|
| POST | /api/v1/sire/compras | process_sire_compras | SireProcessor.process_sire_compras() |
| POST | /api/v1/sire/ventas | process_sire_ventas | SireProcessor.process_sire_ventas() |
| POST | /api/v1/cashflow/analyze | analyze_cashflow | CashflowAnalyzer.analyze_historical_cashflow() |
| POST | /api/v1/cashflow/forecast | forecast_cashflow | CashflowAnalyzer.forecast_cashflow() |
| POST | /api/v1/cashflow/anomalies | detect_cashflow_anomalies | CashflowAnalyzer.detect_cashflow_anomalies() |
| POST | /api/v1/banking/reconcile | reconcile_transactions | BankingAnalyzer.reconcile_transactions() |
| POST | /api/v1/banking/parse-statement | parse_bank_statement | BankingAnalyzer.parse_bank_statement() |
| POST | /api/v1/banking/patterns | analyze_bank_patterns | BankingAnalyzer.analyze_bank_patterns() |
| POST | /api/v1/banking/cash-position | calculate_cash_position | BankingAnalyzer.calculate_cash_position() |
| GET | /api/v1/health | health_check | — |
| GET | /health | health_check (in main.py) | — |

## Services

### src/services/sire_processor.py — SIRE Processor
| Method | Input | Output |
|--------|-------|--------|
| process_sire_compras(file_content: bytes) | SIRE Compras CSV (pipe-delimited) | Summary stats, top 20 providers, monthly breakdown, validation issues |
| process_sire_ventas(file_content: bytes) | SIRE Ventas CSV (pipe-delimited) | Summary stats, top 20 customers, by-document-type breakdown |

Key logic: Polars `read_csv(separator="|")` → date/float casting → `group_by` aggregations → validation (missing IGV, invalid RUC).

### src/services/cashflow_analyzer.py — Cashflow Analyzer
| Method | Input | Output |
|--------|-------|--------|
| analyze_historical_cashflow(transactions, start_date, end_date) | Transaction list | Totals, daily cashflow, category breakdown |
| forecast_cashflow(historical_data, forecast_days=90) | Transaction list | ML predictions with 95% CI via LinearRegression |
| detect_cashflow_anomalies(transactions, threshold_std=2.0) | Transaction list | Z-score anomalies beyond N stddev |

Key logic: Polars `group_by` + `cum_sum` → sklearn `LinearRegression` → daily net anomaly detection.

### src/services/banking_analyzer.py — Banking Analyzer
| Method | Input | Output |
|--------|-------|--------|
| parse_bank_statement(file_content, file_format, bank_name) | CSV/Excel bytes + bank (BCP/Interbank/BBVA/generic) | Standardized transaction dicts |
| reconcile_transactions(bank_tx, system_tx, tolerance_days, tolerance_amount) | Two transaction lists | Matched pairs, unmatched, reconciliation rate |
| analyze_bank_patterns(transactions) | Transaction list | Recurring payments, monthly stats |
| calculate_cash_position(transactions, start_balance) | Transaction list + start balance | Running balance, min/max/avg |

Key logic: Bank-specific column mappings → Polars cross-join fuzzy matching → cash position `cum_sum`.

## Key entrypoints
| File | Role |
|------|------|
| src/main.py | FastAPI app creation, CORS, middleware, /health |
| src/api/routes.py | All REST route definitions + Pydantic request/response models |
| src/core/config.py | Settings singleton loaded from .env |
| src/services/sire_processor.py | SIRE (SUNAT) file processing |
| src/services/cashflow_analyzer.py | Cashflow analysis + ML forecast |
| src/services/banking_analyzer.py | Bank reconciliation + pattern analysis |
| pyproject.toml | Project metadata, deps, Ruff config |

## Fast search recipes

```bash
# Find all Python source files
find src/ -name "*.py"

# Find Polars DataFrame operations
rg "pl\.(read_csv|DataFrame|from_dict|with_columns|group_by|filter|select)" src/

# Find FastAPI route definitions
rg "@router\.(post|get|put|delete)" src/

# Find Pydantic models
rg "class \w+\(BaseModel\)" src/

# Find scikit-learn usage
rg "sklearn|LinearRegression" src/

# Find all service method definitions
rg "def \w+" src/services/ --only-matching

# Find SIRE-specific code
rg "SIRE|sire|SUNAT" src/

# Find bank-specific mappings
rg -i "bcp|interbank|bbva" src/

# Find env config references
rg "settings\.\w+" src/

# Find error handling
rg "HTTPException|raise" src/
```

## Common tasks → exact paths
| Task | Start path |
|------|------------|
| Add new API endpoint | src/api/routes.py |
| Add new service/processor | src/services/<name>.py |
| Change config/env vars | src/core/config.py + .env.example |
| Add Polars analysis logic | src/services/<analyzer>.py |
| Change ML model/forecast | src/services/cashflow_analyzer.py |
| Change bank statement parsing | src/services/banking_analyzer.py |
| Change SIRE validation rules | src/services/sire_processor.py |
| Change CORS or middleware | src/main.py |
| Change contract version header | src/core/config.py (CONTRACT_VERSION) |
| Add new dependency | pyproject.toml |
| Change Ruff rules | pyproject.toml ([tool.ruff]) |
| Add tests | Create tests/ dir, add pytest |
| Build Docker image | Dockerfile |

## Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| fastapi | >=0.110.0 | Web framework (auto-docs, async) |
| uvicorn[standard] | >=0.29.0 | ASGI server (uvloop) |
| polars | >=0.20.0 | DataFrame (Rust core, zero-copy Arrow) |
| pydantic | >=2.6.0 | Validation + serialization |
| pydantic-settings | >=2.2.0 | .env config loading |
| python-multipart | >=0.0.9 | File upload support |
| orjson | >=3.9.15 | Fast JSON (Rust) |
| scikit-learn | >=1.4.0 | ML forecasting (LinearRegression) |
| numpy | >=1.26.0 | Numerical operations |
| ruff | >=0.3.0 | Linter + formatter (dev) |
| pytest | >=8.0.0 | Tests (dev) |
| black | >=24.0.0 | Formatter alternative (dev, optional) |
| hatchling | — | Build backend |

## CI gates

```bash
uv sync                                # Sync dependencies
ruff check src/                            # Lint (pycodestyle, pyflakes, isort, bugbear, etc.)
ruff format src/ --check                   # Format check (diff)
pytest                                     # Run tests (when added)
uvicorn src.main:app --port 8000 &         # Smoke test: server starts
  curl -f http://localhost:8000/health &&  # Health endpoint responds
  kill %1
```
