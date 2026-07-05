# SIRE-bench — Deterministic Fiscal Regression Suite

SIRE-bench validates the **code/LLM boundary** in Drenyra: fiscal arithmetic and SIRE processing are deterministic, versioned, and auditable. LLM agents invoke Korveth (`packages/domain`) and `SireProcessor` — they never compute IGV or detracciones inline.

## Why it matters (moat)

Competitors ship observability; few ship **evaluable fiscal correctness** against SUNAT/NIIF norms. SIRE-bench is the internal benchmark we can cite to firms: every golden case has a known-correct output and `norma_aplicada` reference.

## Architecture

| Layer | Location | Cases |
|-------|----------|-------|
| Korveth (TS) | `packages/domain/testdata/golden/` | IGV, detracción |
| SIRE (Python) | `apps/data-engine/testdata/sire-bench/` | Compras, ventas, edge cases |
| Gates (TS) | `packages/drenyra-orchestrator/testdata/sire-bench/gates/` | Variance, clasificación, filing |

## Tier A — Deterministic (CI required)

| ID | Validates |
|----|-----------|
| `igv-01` | IGV 18% on S/1000 base |
| `igv-02` | Reverse IGV from S/1180 total |
| `det-01` | Detracción código 007 (10%) |
| `sire-compras-01` | Normal compras CSV aggregations |
| `sire-compras-02` | Missing IGV detection |
| `sire-compras-03` | Invalid RUC detection |
| `sire-ventas-01` | Ventas by document type |

## Tier B — Cross-layer

| ID | Validates |
|----|-----------|
| `gate-variance-01` | Conciliación variance gate blocks >5% |
| `gate-clasificacion-01` | Clasificación warning at 94% coverage |
| `gate-clasificacion-block-01` | Clasificación blocks at 50% coverage |
| `sire-filing-deadline-01` | CPE overdue past 7-day SUNAT window |
| `opa-sire-gate-01` | `sire:*` actions require human gate |

## Run locally

```bash
# Full suite (domain + data-engine)
bun run test:sire-bench

# Domain golden only
bun run --filter @drenyra/domain test:sire-bench

# Python SIRE golden only
cd apps/data-engine && uv run pytest tests/sire_bench/ --confcutdir=tests/sire_bench -m sire_bench

# Gate/strategy fixtures
bun run --filter @drenyra/drenyra-orchestrator test:sire-bench
```

## Golden expected format

Every expected file includes:

- `result` or processor output fields
- `norma_aplicada` — SUNAT/NIIF reference
- `version_tabla` — rate table version id
- `deterministic: true`
- `source` — implementing file path

## Updating goldens

Changing `calculator.ts` or `sire_processor.py` without updating matching golden files **must fail CI**. Update expected JSON deliberately after verifying correctness against normative sources.

Golden Python cases also validate compatibility with [`contracts/data-engine/v1/sire-analyze.json`](../../contracts/data-engine/v1/sire-analyze.json) via `contract_validation.py`.

## CI integration

- `bun run test:sire-bench` — root script (domain + data-engine + gates)
- `.github/actions/quality-gate-fiscal` — runs SIRE-bench on fiscal boundary checks
- `.github/workflows/ci.yml` — Python CI runs `@pytest.mark.sire_bench` explicitly

## Gate evidence (Engram)

Phase gate evaluations emit condensed T2/T3 summaries via [`gate-evidence-recorder.ts`](../../packages/drenyra-orchestrator/src/phase/gate-evidence-recorder.ts). Wire `PhaseGateEngine({ evidenceRecorder })` to persist to `drenyra-engram` sidecar in production.

Thresholds live in [`packages/drenyra-orchestrator/config/fiscal-confidence-gates.yaml`](../../packages/drenyra-orchestrator/config/fiscal-confidence-gates.yaml). Calibrate only with bench evidence — not ad hoc.
