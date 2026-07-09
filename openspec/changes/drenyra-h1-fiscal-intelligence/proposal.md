# H1: Fiscal Intelligence Engine — Superar Digits analytics

## Propuesta

Digits tiene dashboards financieros inteligentes. Drenyra necesita dashboards FISCALES inteligentes: SIRE real-time, detección de anomalías, predictive cashflow con impacto fiscal, fiscal health score.

## Scope

4 PRs, ~1,800 líneas estimadas.

## Estrategia

Aprovechar el Python Data Engine (Polars) existente en `apps/data-engine`. Agregar capacidad de análisis fiscal en tiempo real, no solo batch.

## PRs

1. **SIRE real-time validation**: Endpoint POST /api/compliance/sire/validate que corre validaciones determinísticas + AI contra el ledger en vivo. Output: reproducibility report en tiempo real.
2. **Fiscal anomaly detection**: Python engine con detección de IGV inconsistente, RUC duplicados en período, series duplicadas, diferencias SIRE vs ledger. Output: lista de anomalías con severidad.
3. **Predictive cashflow + tax exposure**: Proyección de IGV a pagar/cobrar, detracciones por vencer, percepciones acumuladas. Output: cashflow forecast con impacto fiscal.
4. **Fiscal health score**: Score 0-100 por empresa. Componentes: reproducibility (40%), anomalies (30%), timeliness (20%), compliance (10%). Output: score + breakdown.

## Dependencias

- H2 (SUNAT Platform) para datos en vivo
- Python Data Engine existente

## Riesgos

- Datos en vivo requieren integración SUNAT estable (H2)
- Predictive analytics necesita histórico de datos
