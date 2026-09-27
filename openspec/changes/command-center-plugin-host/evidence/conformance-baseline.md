# Slice 0 Conformance Baseline

Passing current tests prove only the named behavior on the dirty worktree. They do not prove target ownership, provider release status, or host ABI suitability.

## Ownership-neutral invariant evidence

| Evidence | Classification | Baseline result |
| --- | --- | --- |
| domain `Money.test.ts`, `RUC.test.ts`, deterministic fiscal validators | Exact Money behavior, RUC checksum/value-object behavior, fixed-input determinism | 91/91 passed |
| workspace-domain workspace unit/property tests | identity, revision, JSON/schema behavior and properties | 35/35 passed |
| workspace-layout migration/property tests | deterministic layout migration and structural properties | 13/13 passed |
| mission-domain receipt provider parity and signature tests | receipt byte/hash/signature parity against the locally installed 0.2.0 contract | 11/11 passed; evidence is contract parity, not release authority |
| mission-protocol canonical/idempotency/SSE conformance | transport/state-vector behavior | 20/20 passed; local package shape remains a migration concern |
| persistence `h02-*-cross-tenant` suites and API tenant-guard suites | Candidate tenant isolation vectors | discovered, not run; DB/environment side effects were avoided |
| domain audit-ledger hash-chain/normalization and receipt conformance suites | Candidate integrity/order vectors | discovered, not run |

## Implementation-shape evidence

- Mission service/runtime/recovery/SSE/idempotency tests exercise the local mission state machine and local Postgres tables.
- Fiscal-approval gate/store/recommendation tests exercise a local approval owner.
- Workspace `AuthorityStore`, projection event-store, command-bus, lock and resume tests encode current local composition.
- Pi harness/plugin/approval characterization and API Drenyra/AI-swarm tests encode local Pi/AI orchestration.
- Web mission reducer/components/hooks encode local completion, approval controls, mock transport and receipt display.
- Ledger, command-center, SIRE, fiscal-memory and queue tests may yield neutral vectors only after assertions are separated from local repositories/routes.

## Exact commands and results

1. `cd packages/domain && bunx vitest run src/value-objects/__tests__/Money.test.ts src/value-objects/__tests__/RUC.test.ts src/fiscal-truth/__tests__/deterministic-validators.test.ts` → PASS, 3 files/91 tests.
2. `cd packages/workspace-domain && bunx vitest run src/types/__tests__/workspace.test.ts src/types/__tests__/workspace.property.test.ts` → PASS, 2 files/35 tests; Vite emitted an `esbuild` deprecation warning.
3. `cd packages/workspace-layout && bunx vitest run src/__tests__/migration.test.ts src/__tests__/property.test.ts` → PASS, 2 files/13 tests; same warning.
4. `cd packages/mission-domain && bunx vitest run src/__tests__/conformance/receipt-provider-parity.test.ts src/__tests__/mission-receipt-signature.test.ts` → PASS, 2 files/11 tests.
5. `cd packages/mission-protocol && bunx vitest run src/__tests__/canonical-conformance.test.ts src/__tests__/idempotency-conformance.test.ts src/__tests__/sse-conformance.test.ts` → PASS, 3 files/20 tests.
6. `cd packages/fiscal-approval && bunx vitest run __tests__/approval-gate.test.ts __tests__/approval-store.test.ts` → NOT RUN: Vitest startup parse error at `vitest.config.ts:8:11` (`Expected ',' or ')' but found ':'`). No pass is claimed.

No full suite, DB integration, Playwright, compliance gate, formatter, build, or typecheck was run because Slice 0 is evidence-only and the worktree contains unrelated changes.
