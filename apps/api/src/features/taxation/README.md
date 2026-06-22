# Taxation Feature

Peruvian tax workflows for ARKELYTHEX.

**Status:** Partial, with `Retenciones` implemented for the withholding-agent side of SUNAT RS 037-2002  
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

## Scope

This feature currently covers:

- IGV monthly summary
- Income tax projection
- Detractions listing
- Tax calendar
- PDT 621 generation
- Retenciones applied by us as `Agente de Retención`

## Retenciones

The `Retenciones` slice is implemented end-to-end:

- Immutable `Retencion` aggregate
- Domain events for `applied`, `declared`, `paid`, `cancelled`
- `IRetencionRepository` + `RetencionRepository`
- Commands:
  - `ApplyRetentionHandler`
  - `DeclareRetentionHandler`
  - `MarkRetentionPaidHandler`
  - `CancelRetentionHandler`
- Queries:
  - `GetPendingRetentionsQuery`
  - `GetRetentionSummaryQuery`
- API endpoints:
  - `GET /taxation/retenciones`
  - `GET /taxation/retenciones/summary`
  - `POST /taxation/retenciones`
  - `PATCH /taxation/retenciones/:id/declare`
  - `PATCH /taxation/retenciones/:id/pay`
  - `PATCH /taxation/retenciones/:id/cancel`

## Cashflow Integration

`GetCashflowProjectionQuery` consumes `retenciones` on-demand and splits a retained supplier bill into:

- net outflow to supplier on the original bill due date
- deferred SUNAT outflow on day 15 of the following month

This corrects the previous gross-outflow projection bug.

## Event Wiring

`CashflowRetentionHandler` is bootstrapped from `app-core` at startup.

It observes the full retention lifecycle for operational visibility:

- `taxation.retention.applied`
- `taxation.retention.declared`
- `taxation.retention.paid`
- `taxation.retention.cancelled`

- If `NATS_URL` is missing, subscriptions are skipped intentionally
- If NATS bootstrap fails, API startup remains non-blocking
- `/health/doctor` and `/health/startup` expose the bootstrap status

## Validation

```bash
bun run --cwd apps/api test:run src/features/taxation/__tests__/unit
bun run --cwd apps/api test:run src/features/cashflow/__tests__/unit/cashflow-queries.test.ts
bun run --cwd apps/api test:db:taxation
bun run --cwd apps/api validate:taxation:retentions
```

## Remaining Debt

- No open code debt remains inside `Retenciones`
- Operational follow-up remains outside the feature:
  - PostgreSQL backups
  - tenant RLS staging/enablement
  - OpenTelemetry enablement where required

See:

- [Taxation Retentions Summary](../../../../../DOCS/TAXATION_RETENTIONS_SUMMARY.md)
- [Debt Log](../../../../../docs/DEBT_LOG.md)

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
