# apps/api red tests on clean main

Objective: make the ~66 failing `apps/api` tests on clean `main` green by fixing root causes, never by skipping or weakening assertions.
Branch: one branch per cluster (`fix/api-<cluster>`), first `fix/api-xmldom-signing`. Delivery: `ask-on-risk`, one PR per cluster. Runner: `bunx vitest run <path>` from `apps/api`.

## Specs

- S1 "Lo más caro que queda: esos 66 tests rotos de apps/api." Every file listed under "Archivos fallando en `apps/api` sobre main limpio" in issue #369 passes on its cluster branch.
- S2 Fixes target the root cause per cluster; no `skip`, no `continue-on-error`, no loosened assertions (issue #369, "Excluye": "`continue-on-error` o cualquier forma de ocultar los fallos").
- S3 Fiscal paths (SUNAT signing, SIRE) are critical: test-first, isolated worktree, high-risk review (CLAUDE.md, "Crítico").
- S4 Dependency changes must not reintroduce known advisories (`bun audit` on `@xmldom/xmldom` must not get worse).

## Tasks

| ID | Cluster | Specs | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | C1 SUNAT XML signing: root `overrides` forces `@xmldom/xmldom@0.9.10` onto `xml-crypto` (expects `^0.8`), which calls `parseFromString(xml)` without mimeType -> "mimeType \"undefined\" is not valid" (24 tests) | S1-S4 | inline | verified (RED 24 -> GREEN 95/95) | e4806018 |
| T2 | C2 auth: `401` where 200/403/404/202 expected; `SESSION_REQUIRED` vs `AUTH_REQUIRED` (~21 tests, compliance routes, SIRE submit route, security integration) | S1-S2 | inline | pending | - |
| T3 | C3 real DB: `Failed query` against mock `DATABASE_URL` (`sire_comparisons`, ~11 tests) | S1-S2 | inline | pending | - |
| T4 | C4 SIRE audit/retry: audit mock not called with expected args, promise resolves instead of rejecting (~8 tests) | S1-S3 | inline | pending | - |
| T5 | C5 env schema + storage: `TypeError: () => ({` from `vi.mock` factories (~9 tests); mission-memory recorder (2) | S1-S2 | inline | pending | - |

## Log

- L1 (2026-10-25) User: "continue use ODD" after the cleanup report ending "Lo más caro que queda: esos 66 tests rotos de apps/api. ¿Arranco por ahí?"
- L2 (2026-10-25) Reproduced on main `4beb8ca2`: SUNAT/env/storage run 33 failed; remaining clusters run 60 failed / 122 passed. Grouped into C1-C5 above.
- L3 (2026-10-25) T1 evidence: `xml-crypto@6.1.2` and latest `6.4.0` both depend on `@xmldom/xmldom ^0.8.x`; Bun only supports top-level overrides, so the global `>=0.9.10` override replaces xml-crypto's copy too. Installed `0.9.10` itself has open HIGH advisories (fixed in `0.9.12`); `0.8.15` patches the 0.8 line. Plan: drop the override, direct dep `^0.9.12`, `xml-crypto ^6.4.0` (pins `^0.8.15`).
- L4 (2026-10-25) T1 done. Dropped root override `@xmldom/xmldom >=0.9.10`; direct dep `^0.9.12` (root + apps/api); `xml-crypto ^6.4.0`. Resolved: root xmldom 0.9.12, `xml-crypto/node_modules/@xmldom/xmldom` 0.8.15. Lockfile also drops `better-auth/vitest@4.1.11` (unused optional peer, deduped on re-resolution; main lockfile installs frozen, so not drift). Remaining 3 failures were a Vitest 4+ mock bug (`new` on an arrow `vi.fn`), fixed in the test with a justified biome-ignore. Evidence: `vitest run src/features/sunat` 95/95; `bun audit` 36 -> 34; tsc error set unchanged for signing paths (pre-existing unused `@ts-expect-error` at invoice-signer.service.ts:14 in both). `scripts/sire-ledger-repro-check.ts` not applicable: only consumer of xmldom/xml-crypto is `xml-signer.ts`, and the script needs a real DB + `--company-id` (fails the same on main). Risk: item 5 (dependencies) on a fiscal path -> independent verifier.
- L5 (2026-10-25) Independent verifier: PASS S1/S2/S4, no blockers. Real openssl RSA-2048 probe signs UBL, validates, rejects tampered copy (digest mismatch). Only two xmldom copies installed (0.9.12, 0.8.15), none with open advisories. RDD off by clone_local, so no native review. Advisory: two xmldom lines now need independent future bumps.
