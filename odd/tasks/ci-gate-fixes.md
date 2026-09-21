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
- [x] **Rule 2 real violation**: `apps/api/src/features/sire/services/sire-diff-ledger.service.ts:33`
  hardcodes `total.divide(1.18).multiply(0.18)` instead of sourcing the
  IGV rate from domain.
- [x] **Rule 4 real violation**: `packages/ai/src/ai/tools/index.ts`'s
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
- [x] **Security Audit**: `bun run security:audit` → `scripts/security/audit-dependencies.ts`,
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
- 2026-09-21: Security Audit fixed (commit `d8f02335`) — `security:audit`
  now runs `bun audit` (bun's native vulnerability scanner, confirmed
  fail-closed: exit 1 when vulnerabilities found) instead of the
  never-implemented `scripts/security/audit-dependencies.ts`.
  `security:sbom` removed (same missing script backed it; `bun audit` has
  no SBOM-generation equivalent — genuinely gone, not faked).
  **Real finding, not introduced by this fix**: 68 vulnerabilities (38
  high, 26 moderate, 4 low, 0 critical) in current dependencies —
  `@xmldom/xmldom` (11 advisories — relevant here since it's used for SIRE
  XML parsing), `fast-uri` (8), `js-yaml`/`postcss`/`browserslist`/
  `nanoid`/`brace-expansion`/`adm-zip`/`ip-address`/`nodemailer`/`undici`/
  `smol-toml` (mostly transitive build/test tooling deps). **Not
  attempted**: running `bun audit fix` — could bump major versions and
  break things; needs deliberate review per package, not a blind
  autonomous fix. Flagging for the user.
- 2026-09-21: Rule 2 + Rule 4 real violations fixed by delegated writer:
  - `f8fbdcfa3` — `packages/ai/src/ai/tools/index.ts`'s `calculateIGV` now
    delegates to `@drenyra/domain`'s `TaxCalculator` (both directions had
    direct domain equivalents: `calculateIGV` for exclusive-of-tax,
    `calculateBaseFromTotal` for inclusive-of-tax — no new domain methods
    needed). Added `@drenyra/domain` as an explicit `packages/ai`
    dependency (was previously phantom/undeclared, only resolved via
    bun's hoisted root node_modules). 4 new tests (2 regression, 2
    delegation-proof via spies). 14→18 tests passing, 0 fail.
  - `6fe7f2af4` — `apps/api/.../sire-diff-ledger.service.ts`'s
    `splitTaxAmounts` now uses `TaxCalculator.calculateBaseFromTotal`
    instead of hardcoded `divide(1.18).multiply(0.18)`.
    **Important, flagging clearly**: this changes from 2 rounding
    operations to 1, which can shift the computed base/IGV split by up to
    ±0.01 on some totals — a precision *improvement* (matches the same
    canonical domain math used everywhere else now), not a regression,
    but it IS a real change in computed SIRE ledger numbers. The existing
    test for this file only asserts mutation counts, not exact tax
    amounts (verified passes identically before/after), so this precision
    change has real, if narrow, unverified surface. **Could not run
    `bun scripts/sire-ledger-repro-check.ts` against this change** — needs
    a live `DATABASE_URL` and real company/period data unavailable in this
    sandbox. Recommend running it for real before this ships, given
    CLAUDE.md's SIRE compliance priority.
  - Both Rule 2 and Rule 4 regexes verified no longer match locally.
    Biome clean. Full monorepo typecheck not run (known pre-existing
    broken); targeted `bun test` runs are the verification signal per
    this session's established pattern.
