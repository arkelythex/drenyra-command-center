# SDD-WB-005 — Financial Diff & Impact Review

**Change ID:** `sdd-wb-005`
**Capability:** CAP-WB-05 (Financial Diff & Impact Review)
**Wave:** C (Review Model)
**Created:** 2026-07-27
**Extends:** `drenyra-accounting-diff` (applied)

## Purpose

Transform the existing accounting diff into a **financial diff** that shows not just before/after values, but full financial impact: EBITDA, assets, deferred tax, policy, evidence, confidence, and review chain.

## Financial diff = accounting diff +

```
ANTES                              PROPUESTA
Gasto por servicios   42,500       Gasto por servicios   38,200
                                   Activo intangible      4,300

Impacto EBITDA                   +S/ 4,300
Impacto activos                  +S/ 4,300
Impuesto diferido                Revisión requerida
Materialidad                     Media
Confianza del clasificador       86%
Política aplicada                POL-INTANGIBLES-03
Vigencia                         Desde 2026-01-01
Evidencia                        4 documentos
Preparado por                    Ledger Agent
Revisado por                     Pendiente
```

## Color rule (from the vision)

- 🟢 Green: validated or accepted (never "high AI confidence")
- 🟡 Amber: requires attention
- 🔴 Red: risk, blocker, or failure
- 🔵 Blue: in progress or informational
- ⚪ Gray: unknown, incomplete, or unevaluated

## Scope

### Included

1. **FinancialDiff types** — Impact (EBITDA, assets, deferred tax), PolicyReference, ReviewStatus, EvidenceLink, Materiality
2. **FinancialDiffCard** — List item with delta, materiality badge, status, policy, preparer
3. **FinancialDiffDetail** (future) — Full detail view with impact breakdown, policy evidence, confidence, review chain
4. **Change Set integration** — Link financial diffs to Change Sets

### Existing code to evolve

| File                                         | Status    | Evolution                                 |
| -------------------------------------------- | --------- | ----------------------------------------- |
| `features/diffs/diffs.types.ts`              | ✅ exists | Add materiality, policy, financial impact |
| `features/diffs/AccountingDiffView.tsx`      | ✅ exists | Add financial impact section              |
| `types/financial-diff.ts`                    | ✅ NEW    | Types + formatters                        |
| `components/workbench/FinancialDiffCard.tsx` | ✅ NEW    | List card component                       |

## PRs

| PR  | Scope                                | Files est. | Lines est. |
| --- | ------------------------------------ | ---------- | ---------- |
| PR1 | Financial diff types + formatters    | 1          | ~120       |
| PR2 | FinancialDiffCard component          | 1          | ~120       |
| PR3 | AccountingDiffView financial section | 2          | ~100       |
| PR4 | Change Set integration               | 2          | ~80        |
