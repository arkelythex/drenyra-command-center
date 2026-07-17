# Data Engine Contracts Changelog

**Última actualización**: 2026-06-20

---

*Alineado con la [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación clara, cálida y progresiva.*

## v1.0.0 - 2026-02-13
- Introduces contract header `X-Contract-Version: v1` for API <-> data-engine calls.
- Publishes JSON schemas under `contracts/data-engine/v1/` for:
  - `GET /health`
  - `POST /api/v1/sire/compras`
  - `POST /api/v1/cashflow/analyze`
  - `POST /api/v1/banking/reconcile`
- `cashflow.analyze` response now includes the stable envelope fields:
  - `status`
  - `summary.totalIncome`
  - `summary.totalExpenses`
  - `summary.netCashflow`
- Backward compatibility: legacy fields (`total_income`, `total_expenses`, `net_cashflow`, etc.) remain present in v1 responses.

## Versioning policy
- Semantic versioning for contracts:
  - Patch: documentation/schema clarifications without breaking response shape.
  - Minor: additive non-breaking fields.
  - Major: breaking changes to required fields, field names, or semantics.
- Backward compatibility target: one previous major version.
