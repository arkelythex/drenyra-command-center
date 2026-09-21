# CI gate fixes: Fiscal Boundary Check + Security Audit + dead scripts

## Objective
Fix what's mechanically safe in the two remaining flagged-broken CI gates
(Fiscal Boundary Check, Security Audit) and remove confirmed-dead
`compliance:sire-*` package.json script references. Continuation of
odd/tasks/web-tooling-health.md's flagged follow-ups.

## Scope
- [x] Remove 4 confirmed-never-implemented `compliance:sire-*` script refs
  from package.json (verified via `git log --all` across every ref —
  zero backing commits anywhere).
- [x] Fix stale `@arkelythex/*` → `@drenyra/*` package-scope references in
  `.github/actions/quality-gate-fiscal/action.yml` (Rules 3/4 exclusion
  filters) — package was renamed, action never updated. Resolves Rule 3's
  false positive on `signup-form.validation.ts` (legitimately delegates to
  `@drenyra/shared`, was being flagged only because of the stale scope
  string).
- [ ] **Rule 2 real violation**: `apps/api/src/features/sire/services/sire-diff-ledger.service.ts:33`
  hardcodes `total.divide(1.18).multiply(0.18)` instead of sourcing the
  IGV rate from domain.
- [ ] **Rule 4 real violation**: `packages/ai/src/ai/tools/index.ts`'s
  `calculateIGV(baseAmount: number, includesIGV): {base,igv,total}` (raw
  numbers) duplicates IGV math instead of delegating to
  `packages/domain/src/services/TaxCalculator.ts`'s
  `TaxCalculator.calculateIGV(baseAmount: Money): TaxCalculationResult` —
  a facade over a swappable `TaxRegime` (already the "plugin" pattern the
  original DeepSeek-philosophy request asked for, just unused here).
- [ ] **Rule 1**: raw `number` typed money fields in
  `packages/domain/src/fiscal/{fiscal-general-ledger,sire.types,compliance.types}.ts`
  — explicitly NOT touching this without a domain-owner decision on which
  DTO/report fields are legitimately non-Money vs. should be Money.
- [ ] **Security Audit**: `bun run security:audit` → `scripts/security/audit-dependencies.ts`,
  confirmed never implemented anywhere in history (same class of gap as
  the 4 removed sire scripts). Investigate whether `bun`'s built-in audit
  command can be wired in as a substitute, or whether this needs a real
  script written — decide only after checking what's actually available.

## Constraints
- Do not touch Rule 1 (needs domain-owner decision, not mine to make).
- Do not touch the other ~90 dead package.json script refs found on the
  unmerged `chore/repo-cleanup-landing-engram-ci` branch — only the 4
  specifically verified here. That branch's broader cleanup is a separate,
  larger, not-yet-reconciled effort.
- Rule 2/4 fixes must not change existing callers' behavior/output shape —
  `calculateIGV` in packages/ai is called by an AI tool
  (`igvCalculationTool`) with real production usage; wrap/delegate to
  domain internally, keep the public number-in/number-out contract stable
  unless there's a clear reason to change it.

## Progress log
- 2026-09-21: Task doc created. Mechanical fixes (dead scripts, stale
  package refs) applied and committed (`286adb39`).
