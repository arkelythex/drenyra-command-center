# 07 — Financial Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 6 de 8 — Financiero
**Propósito:** Ledger, close, tax, treasury, AP/AR, payroll, reporting
**Principio:** Ledger-as-Git + FSD (Fiscal Specification-Driven Execution)

---

## Filosofía

El Financial Plane es el corazón del dominio de Drenyra. Aquí vive la contabilidad: el ledger universal, el cierre mensual, los impuestos, la tesorería y los reportes financieros.

### Ledger-as-Git

La inspiración más poderosa de Drenyra:

| Git          | Drenyra Ledger             |
| ------------ | -------------------------- |
| Repository   | Financial workspace        |
| Branch       | Scenario / candidate       |
| Commit       | Atomic journal entry       |
| Diff         | Explained financial impact |
| Pull request | Accounting review package  |
| Merge        | Posting / approval         |
| Tag          | Period close               |
| Revert       | Compensating entry         |

### FSD — Fiscal Specification-Driven Execution

Todo workflow material empieza con una especificación:

```yaml
spec:
  id: CLOSE-PERU-MONTHLY-01
  jurisdiction: PE
  period: 2026-06
  objective: monthly_fiscal_close
  invariants:
    - ledger_balanced
    - no_duplicate_vouchers
    - all_entries_have_provenance
    - submitted_period_is_locked
    - cross_tenant_access_denied
```

---

## Sub-sistemas

| Sub-sistema     | Capacidades                                    | Estado         |
| --------------- | ---------------------------------------------- | -------------- |
| Universal Ledger| PCGE, journal entries, periods, exchange rates | ✅ Implemented |
| Close & Reconciliation | Monthly close, bank reconciliation, variance   | ✅ Applied     |
| Tax Peru        | IGV, detracciones, retenciones, SIRE           | 🟡 Mixed       |
| Treasury & Banking | Bank accounts, transactions, cashflow          | 🟡 Partial     |
| Invoicing & AP  | CPE, UBL 2.1, electronic invoicing, bills      | 🟡 Partial     |
| Reporting       | P&L, balance sheet, cash flow, trial balance   | 🟡 Partial     |
| Payroll         | Nómina, obligations, contributions             | ◌ Draft        |

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Contenido actual disperso en `packages/domain`, `apps/api/src/features/` y `apps/web/src/features/`. Se consolidarán como parte del [programa FEOS](../01-foundation/feos-program.md):

- `universal-ledger.md` — PCGE, posting, periods, money, exchange
- `close-reconciliation.md` — Monthly close workflow, bank rec, variance
- `tax-peru.md` — IGV, detracciones, retenciones, renta, SIRE, PLE
- `treasury-banking.md` — Bank accounts, transactions, cashflow, payments
- `invoicing-ap.md` — Electronic invoicing, CPE, UBL 2.1, bills, vendors
- `reporting.md` — Financial statements, reports, analytics
- `payroll.md` — Payroll processing, obligations, filings
- `accounting-diff.md` — Financial impact diff, materiality
- `corrections-reversals.md` — Compensating entries, rectifications

---

## Relación con otros planos

| Plano                                                   | Relación                                        |
| ------------------------------------------------------- | ----------------------------------------------- |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Agentes fiscales operan sobre datos financieros |
| [05 — Trust](../05-trust-plane/README.md)               | Asientos generan evidence y receipts            |
| [06 — Execution](../06-execution-plane/README.md)       | Workflows de cierre y conciliación              |
| [08 — Integration](../08-integration-plane/README.md)   | SUNAT, bancos, ERP connectors                   |
