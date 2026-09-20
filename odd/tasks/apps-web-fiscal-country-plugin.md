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
  `packages/domain`/compliance-chain level, not apps/web.
- **Superseding discovery**: `packages/domain/src/feos/country-runtime.ts`
  (FEOS-014, already implemented + tested, exported via
  `packages/domain/src/index.ts` → `export * from "./feos"`) already provides
  almost exactly this shape today: `CountryRuntime` class,
  `DRENYRA_COUNTRY_PACKS` (PE/CO/CL/EC/MX/BR — code, name, taxAuthority,
  defaultCurrency, locale, timezone, taxIdentifierFormat), and
  `PERU_TAX_RULES`/`COLOMBIA_TAX_RULES` (`TaxRule` with `rate`, `validFrom`,
  `validUntil`, `active` — directly supports the IGV 18%→19% rate-change
  scenario). **`apps/web` has zero usages of any of this today** (grep
  confirmed) — it re-hardcodes IGV/locale/RUC-length instead of consuming the
  domain source of truth. Plan below is revised to make apps/web a consumer
  of `@drenyra/domain`'s `CountryRuntime`, not a second, parallel config.
  `drenyra-h3-multi-country`'s proposal stays the reference for extending
  `CountryRuntime` itself (compliance chains, validators) later — out of
  scope here since that's `packages/domain`, not `apps/web`.
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
- [x] **T2. Make `latam-country-packs.ts` a thin adapter over
  `@drenyra/domain`'s `CountryRuntime`** instead of a second parallel config.
  Import `CountryRuntime`/`DRENYRA_COUNTRY_PACKS`/`PERU_TAX_RULES`/
  `COLOMBIA_TAX_RULES` from `@drenyra/domain`. Keep in `latam-country-packs.ts`
  only what's genuinely apps/web-specific (assistant copy, quick-action
  labels); derive `taxIdLabel`, tax-ID regex/length, currency, locale, and
  active tax rate from `CountryRuntime.getPack()`/`getTaxRules()` instead of
  hand-maintained fields. Add a small `getActiveTaxRate(countryCode, name)`
  helper (e.g. `getTaxRules("PE").find(r => r.name === "IGV").rate`) so call
  sites never touch raw literals. Note: `CountryRuntime.getTaxRules` currently
  only special-cases `"PE"`/`"CO"` (CL/EC/MX/BR return `[]`) — that gap is in
  `packages/domain` (out of scope here); apps/web code must handle an empty
  result gracefully rather than assuming PE. Route: delegated writer.
- [x] **T3. Refactor `money.ts`** — remove hardcoded `LOCALE = "es-PE"` and
  default `"PEN"`; resolve locale/currency from the active country pack
  (`CountryRuntime.getPack(code).locale/defaultCurrency` via T2's adapter).
  Remove `@deprecated formatPEN` alias once call sites are migrated to the
  resolved-locale formatter. Route: delegated writer.
- [ ] **T3b. NEW — Fix `lib/utils.ts`'s separate hardcoded currency
  formatters** (discovered during T3): `apps/web/src/lib/utils.ts` has its
  own independent `formatPEN`/`formatPENCompact`/`formatCurrency`, hardcoded
  to `es-PE`, **completely separate from `money.ts`**. These, not `money.ts`,
  are what real invoice/compliance UI actually calls (`DetraccionesTab.tsx`,
  `CpeValidatorTab.tsx`, `InvoiceCard.tsx`, `InvoiceLineItems.tsx`,
  `InvoiceTotals.tsx`, `InvoicesAgingTab.tsx`, `SireDashboard.tsx`,
  `demo-card.tsx`, `fiscal-health-map/widgets.tsx`) — so T3 alone does not
  fix the user-visible "amounts always render as PEN/es-PE" bug. Redirect
  `utils.ts`'s formatters to delegate to `money.ts`'s now country-aware `n()`
  (keep `utils.ts`'s function names/signatures for its many existing callers;
  change only the implementation). Combine with T4/T5 below — same files.
  Route: delegated writer.
- [ ] **T4. Kill the duplicated IGV 0.18 literal** — source from T2's
  `getActiveTaxRate()` (backed by `PERU_TAX_RULES`, rate is `18` meaning
  18%, so divide by 100 at the call site consistently) in:
  `features/invoices/components/create-invoice/InvoiceLineItems.tsx:72`,
  `.../hooks/useInvoiceCalculations.ts:19`, `EditInvoiceModal.tsx:65,125`,
  `features/compliance/components/tabs/cpe-validator/cpe-validation-request.ts:76`,
  `InvoiceTotals.tsx` (create + edit, hardcoded `"18%"` text), `InvoicePDF.tsx:243`.
  Route: delegated writer (7+ files).
- [ ] **T5. Centralize `taxType === "GRAVADO"` conditionals** — `CountryRuntime`
  has no tax-type enum today (only named `TaxRule`s like IGV/Renta/Detraccion);
  keep the GRAVADO/EXONERADO/INAFECTO enum apps/web-local (it's a SUNAT
  document-line concept, not in `feos/country-runtime.ts`), but move it out of
  inline JSX into one shared `apps/web` module so `InvoiceLineItems.tsx`,
  `EditInvoiceModal.tsx`, `useInvoiceCalculations.ts` import one definition
  instead of repeating string literals. Route: delegated writer (combine with
  T4 — same files).
- [ ] **T6. De-hardcode RUC length/label in signup** —
  `features/auth/components/signup/signup-ruc-validation.ts` and
  `signup-form.validation.ts:42` should derive tax-ID length from
  `CountryRuntime.getPack("PE").taxIdentifierFormat` (regex `\d{11}`) instead
  of a literal `11`, and label from T2's adapter. Keep using canonical
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
- 2026-09-20: Task doc created after reconciliation. T1 applied (commit e687c75).
- 2026-09-20: Discovered `packages/domain/src/feos/country-runtime.ts` already
  implements the country-pack/tax-rule source of truth apps/web needs (0
  existing apps/web usages). Revised T2-T6 to consume it instead of building
  a parallel config.
- 2026-09-20: T2 applied (commit `868dd54`). `latam-country-packs.ts` now
  sources name/currency/locale/taxIdRegex from `CountryRuntime`, adds
  `getActiveTaxRate(countryCode, taxName)`. 13 new tests, all passing.
  Findings: (a) only 1 real prior usage of this module existed
  (`compliance-client.types.ts`, type-only) — `getCountryPack`/
  `resolveCountryCode`/`LATAM_COUNTRY_PACKS` had **zero runtime callers**
  before this task, confirming the value of T3/T4 wiring real call sites next.
  (b) **Repo-wide tooling is broken independent of this change**:
  `apps/web typecheck` fails on TS5102 (`baseUrl` removed in pinned
  TypeScript 7.0.2, but `apps/web/tsconfig.check.json:14` still sets it), and
  `apps/web lint` fails on a `typescript-eslint`/TS 7.0.2 incompatibility
  (`Cannot read properties of undefined (reading 'Cjs')`). Verified
  pre-existing by reverting the change and rerunning — identical failures.
  This blocks a fully green typecheck/lint for *any* apps/web change right
  now. Out of scope to fix here (repo-wide TS pin, not apps/web-local); used
  `bunx biome check` on changed files as the substitute gate per task and
  will flag this to the user as a separate decision. T10 will record this
  limitation rather than claim false-green.
- 2026-09-20: T3 applied (commit `af5e690`). `money.ts` now resolves locale
  per-call from the country pack (default Peru, backward compatible for all
  9 existing untouched call sites); removed unused `formatPEN` (0 real
  callers). Discovered `Currency` type in `@drenyra/domain` is
  `"PEN"|"USD"|"EUR"` only — MX/CO/CL/BR currencies aren't representable yet;
  decoupled locale resolution (country-driven) from currency typing (stays
  `Currency`-typed) rather than casting around this domain gap. Flagged, not
  fixed (packages/domain, out of scope).
  **New T3b task added above** — `lib/utils.ts` has its own separate
  hardcoded `formatPEN`/`formatCurrency`, and it (not `money.ts`) is what real
  invoice/compliance UI actually calls.
  **Separate flagged finding**: `bun scripts/sire-ledger-repro-check.ts` (the
  script CLAUDE.md mandates for any change touching facturación/libros)
  **does not exist on `main` or this branch** — confirmed via git log across
  branches; it only exists on unrelated, unmerged feature branches. This is a
  pre-existing repo gap predating this task, not something to silently import
  from an unrelated branch. Flagging to the user; T10 cannot run this gate
  until it exists on main.
