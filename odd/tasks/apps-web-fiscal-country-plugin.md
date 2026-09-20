# apps/web — Fiscal Country Plugin (DeepSeek-style: everything swappable)

## Objective
Adopt DeepSeek Harness's "minimal core, everything is a config-driven swappable
plugin" philosophy inside `apps/web`, for Peru-first fiscal rules with a real
LatAm extension seam. Fix the concrete duplication bugs this created, clean up
dead weight, without touching `packages/domain`/`fiscal-*` internals or other
products (andino/estado/kuse/senzar).

## Why (user request + reconciliation)
User asked for DeepSeek "everything is a plugin" philosophy applied to the
Drenyra web app, adapted to Peru accounting with LatAm scale, plus cleanup and
good practices (2026-09-20).

Reconciliation before starting (see Engram `sdd/command-center-plugin-host/*`
and `openspec/changes/drenyra-h3-multi-country`, `drenyra-r1-eliminate-redundancy`,
`drenyra-r2-deep-refactoring`, `drenyra-p5-code-quality`):
- `drenyra-h3-multi-country` already designed the target shape — a
  `FiscalCountry` interface (`taxIdRegex`, `currency`, `taxTypes`,
  `complianceChains`, `validators`) — but it's proposal-only, depends on
  unfinished H0/H2 backend orchestrator work, and is scoped to
  `packages/domain`/compliance-chain level, not apps/web. We follow its
  **shape** for the apps/web-local config so a future backend FiscalCountry
  plugin can slot in later without a UI rewrite, but we do not implement H0/H2.
- `drenyra-r1-eliminate-redundancy` / `drenyra-r2-deep-refactoring` are marked
  `archived` in `state.yaml` but have no `tasks.md`/apply evidence, and already
  flagged "3 implementaciones de RUC check" and duplicated IGV calculations as
  a problem in 2026-07. Confirmed still present in current code — the
  "archived" label there is not reliable evidence of completion.
- `command-center-plugin-host` (separate worktree, mid-apply) assumes canonical
  fiscal logic moves to an external accounting runtime. User explicitly
  decided (2026-09-20): fiscal logic **stays in this repo**. Treat
  `command-center-plugin-host` as a separate, not-followed-here initiative;
  do not extract invoice/compliance code out of apps/web as part of this task.

## Scope
In scope: `apps/web` only (features: invoices, compliance, auth/signup;
`src/lib/latam-country-packs.ts`, `src/lib/money.ts`; `knip.json`'s apps/web
entry; `i18next`/`react-i18next` dependency).
Out of scope: `packages/domain`, `packages/fiscal-*`, `apps/api`, other
products, H0/H2/H3 backend orchestrator work.

## Constraints
- CLAUDE.md priority #1: cero errores en dominio / SUNAT compliance.
- Any change touching facturación/libros MUST pass
  `bun scripts/sire-ledger-repro-check.ts` before this task is considered done.
- No dinero.js. Use existing `Money`/`Currency` from `@drenyra/domain` as-is.
- Biome `noExplicitAny`/`noNonNullAssertion` stay `error` for apps/web feature
  code — no suppressions.

## TDD mode resolution
No repo-wide TDD gate/marker found for apps/web (only Vitest coverage
thresholds: lines 70 / functions 65 / branches 60 / statements 70, lower than
CLAUDE.md's 100%/80% domain/infra bar — apps/web is explicitly not held to
fiscal-domain rigor). Resolved mode: **write/extend tests alongside each
behavior change** (not full RED-GREEN ceremony), keep coverage thresholds
green. Runner: `bun run --cwd apps/web test:run` / `test:coverage`.

## Tasks

- [x] **T1. Fix stale `knip.json` entry point** — `apps/web/src/main.tsx` (does
  not exist) → `apps/web/src/client.tsx` (actual entry). 1 file, mechanical.
  Route: direct inline.
- [ ] **T2. Extend `latam-country-packs.ts` into a real fiscal plugin config**
  — add `taxIdRegex`, `taxIdLength`, `taxRates: {type, rate, effectiveFrom}[]`
  (supports the IGV 18%→19% scenario already anticipated in
  `ActivePipelinePanel.tsx:16`), `taxTypes` with labels (GRAVADO/EXONERADO/
  INAFECTO for PE). Peru fully populated and correct; CO/MX/CL keep existing
  UI-copy fields plus the same shape populated with best-known-accurate
  placeholder values, explicitly commented as "pending backend FiscalCountry
  integration, see openspec/changes/drenyra-h3-multi-country". Route: delegated
  writer (touches new/expanded config + tests).
- [ ] **T3. Refactor `money.ts`** — remove hardcoded `LOCALE = "es-PE"` and
  default `"PEN"`; resolve locale/currency from the active country pack via
  `getCountryPack()`/`resolveCountryCode()`. Remove `@deprecated formatPEN`
  alias once call sites are migrated to the resolved-locale formatter. Route:
  delegated writer.
- [ ] **T4. Kill the duplicated IGV 0.18 literal** — source from T2's
  `taxRates` in: `features/invoices/components/create-invoice/InvoiceLineItems.tsx:72`,
  `.../hooks/useInvoiceCalculations.ts:19`, `EditInvoiceModal.tsx:65,125`,
  `features/compliance/components/tabs/cpe-validator/cpe-validation-request.ts:76`,
  `InvoiceTotals.tsx` (create + edit, hardcoded `"18%"` text), `InvoicePDF.tsx:243`.
  Route: delegated writer (7+ files).
- [ ] **T5. Centralize `taxType === "GRAVADO"` conditionals** — replace inline
  Peru-specific enum checks in `InvoiceLineItems.tsx`, `EditInvoiceModal.tsx`,
  `useInvoiceCalculations.ts` with the T2 tax-type config. Route: delegated
  writer (can combine with T4 in same PR/writer pass — same files).
- [ ] **T6. De-hardcode RUC length/label in signup** —
  `features/auth/components/signup/signup-ruc-validation.ts` and
  `signup-form.validation.ts:42` should read `taxIdLength`/`taxIdLabel` from
  the country pack instead of a literal `11`/"RUC". Keep using canonical
  `isValidRUC` from `@drenyra/shared` unchanged. Route: delegated writer.
- [ ] **T7. Investigate `MOCK_COMPANY_NAMES` stub** in
  `signup-ruc-validation.ts` — confirm whether a real lookup endpoint exists
  in `apps/api`. If yes, wire it. If no real endpoint exists, do not fabricate
  one (out of scope to build a new API) — leave the stub but make it
  unmistakably a demo fallback (explicit naming/comment/guard), never
  presented as real data. Route: delegated writer, report finding before
  deciding.
- [ ] **T8. Remove unused `i18next`/`react-i18next`** — 0 usages found in
  `apps/web/src`. Confirm zero usages again at implementation time, then
  remove the dependency and any dead config. Route: direct inline once
  confirmed (dependency removal + 1-2 file touch).
- [ ] **T9. Tests** — unit tests for T2's tax-rate resolution (must cover a
  rate-change-over-time scenario), updated tests for T3's locale/currency
  resolution, T6's RUC length/label resolution. Route: bundled with each
  writer task above, not a separate pass.
- [ ] **T10. Quality gates** — for apps/web: `bun run --cwd apps/web typecheck`,
  `lint`, `test:run` (coverage thresholds must stay green), plus root
  `bun scripts/sire-ledger-repro-check.ts` (mandatory — this touches
  facturación). Record actual results here, not assumed.

## Delivery
Work-unit commits on `codex/apps-web-fiscal-country-plugin`
(worktree: `/home/dreamcoder08/Documents/PROYECTOS/Drenyra/worktrees/apps-web-fiscal-country-plugin`,
branched from `origin/main` at `7c87151d2`). Delivery strategy: ask-on-risk
(default) — will ask before chaining PRs if the running authored-line count
crosses ~400.

## Progress log
- 2026-09-20: Task doc created after reconciliation. T1 applied.
