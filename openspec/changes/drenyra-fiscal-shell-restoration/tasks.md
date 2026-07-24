# SDD Tasks — drenyra-fiscal-shell-restoration

**Last updated:** 2026-07-12  
**Change:** `drenyra-fiscal-shell-restoration`  
**Phase:** tasks  
**Mode:** automatic / OpenSpec / auto-forecast  
**Scope:** `apps/web` authenticated-shell composition only  
**Review budget:** 400 changed lines

## Scope lock

Implement exactly one private `AgenticLayout` at the non-public root boundary, de-nest `/drenyra`, enforce the route-source-verified sidebar navigation allowlist, and repair only the required mobile accessibility lifecycle.

Do **not** add fiscal data, queries, caches, contracts, mutations, placeholder cards, representative company/RUC/period values, active-close/approval/agent state, route generation changes, or changes to fiscal calculations, SUNAT/SIRE/UBL/CDR behavior, approvals, period locks, or audit records.

## Prerequisite gate — isolate the approved shell work

- [ ] **0.1 Establish a dedicated isolated worktree before any application edit.** Create the worktree under `~/Documents/PROYECTOS/Drenyra/worktrees/drenyra-fiscal-shell-restoration` from the approved base/branch after recording its SHA, branch, `git status --short`, and `git diff --cached --name-only`. Do not begin from `security/w3a-0-auth-tenant-context` or treat its dirty state as this change's evidence.
- [ ] **0.2 Reconcile the already-dirty provider fix without taking unrelated work.** Identify and obtain explicit ownership/approval for only these known prerequisite hunks: removal of `FiscalInspectorProvider` ownership from `AgenticLayout.tsx`, root-level public-route provider composition in `__root.tsx`, and the adjacent `/cierre-mensual` provider removal. Compare each transplanted hunk against the approved design; retain only changes necessary for the single-root-provider outcome. Do not copy unrelated modifications, untracked files, or route work from the source checkout.
- [ ] **0.3 Prove the isolated baseline.** In the new worktree, confirm the index is empty and that the diff contains only explicitly approved prerequisite hunks before adding RED tests. Record the base SHA, approved hunk paths, owner/approval reference, and baseline status in the apply artifact.

### Exact stop condition

**STOP THE APPLY PHASE BEFORE EDITING ANY APPLICATION OR TEST FILE** if the provider-fix hunks cannot be attributed to an owner and explicitly approved, cannot be transplanted independently of unrelated changes, conflict with the approved base/design, or leave staged/unrelated files in the dedicated worktree. Record `blocked: unable to isolate approved provider fix` with the conflicting paths and SHA in the apply artifact; do not use the dirty checkout, stash, force checkout, broad reset, or a mixed diff as a workaround. Return the change to human reconciliation/new branch preparation.

## Strict TDD execution

- [ ] **1. RED — characterize root-shell composition.** In `apps/web/src/routes/__tests__/root-fiscal-inspector-provider.test.tsx`, first write/adjust failing landmark-based tests proving public/auth paths render only `Outlet`, while a private path renders exactly one `FiscalInspectorProvider`, one `AgenticLayout` shell, one navigation landmark, one command bar, and one main workspace landmark. Run the single test file and record the expected failure.
- [ ] **2. RED — prove aliases and de-nesting.** Add or extend focused route-composition coverage for `/cierre-mensual`, `/contabilidad/cierre-mensual`, and `/drenyra`. Require exactly one shell/provider/navigation/command-bar set for each private case and prove the `/drenyra` route contributes outlet/content only, never a route-level `AgenticLayout`. Run the focused tests and record the expected failure.
- [ ] **3. GREEN — restore the single private root shell.** Change `apps/web/src/routes/__root.tsx` so `isPublicRoute(pathname)` is the only private-boundary decision: public/auth routes return `Outlet`; all other routes render `FiscalInspectorProvider > AgenticLayout > Outlet`. Keep provider ownership exclusively at root.
- [ ] **4. GREEN — de-nest the Drenyra route.** Change `apps/web/src/routes/drenyra.tsx` to an outlet/content-only route. It must not lazy-load, import, or mount `AgenticLayout` or `FiscalInspectorProvider`. Re-run Tasks 1–2 tests until green.
- [ ] **5. TRIANGULATE — enforce the navigation allowlist.** In `AgenticSidebar.data.ts`, encode/export the exact verified-destination invariant from the spec and make visible navigation derive from it or fail type/test validation when an out-of-set destination is added. Extend `AgenticSidebarNavItems.test.tsx` to prove every rendered target is permitted and an unsupported destination is absent. Do not add destinations, redirects, disabled links, or placeholder pages.
- [ ] **6. TRIANGULATE — repair mobile accessibility only.** Add focused `AgenticLayout` DOM tests before/alongside the smallest repair for: one mobile trigger with accessible name, synchronized `aria-expanded` and `aria-controls`, actual closed-drawer invisibility/non-interactivity, Escape dismissal, backdrop dismissal, focus return to the invoking trigger, body-scroll release, and keyboard-operable collapsed toggle with no hidden focusable drawer controls. Use one responsive sidebar instance; do not add fiscal context or a modal/focus-trap dependency.
- [ ] **7. GREEN — implement only the tested responsive lifecycle.** In `AgenticLayout.tsx`, make mobile-open state control the existing sidebar's below-`xl` visibility and accessibility state; add the trigger, unique drawer ID, Escape/backdrop close handling, focus restoration, and scroll-lock cleanup. Preserve desktop/collapsed behavior. Use named React imports, no manual memoization additions, and Tailwind semantic utilities/`cn` only for conditional classes.
- [ ] **8. REFACTOR — keep the bounded slice reviewable.** After every focused test is green, remove only duplicated test setup/helpers. Inspect changed paths and assertions to confirm no fiscal-domain/API/schema/query/mutation/placeholder operational-data code entered the diff. Do not refactor pre-existing `useMemo`, unrelated shells, or command-center code.

## Verification and evidence gate

- [ ] **9. Run focused web evidence from the isolated worktree.** Run the changed root/layout/sidebar Vitest files using the repository-supported web test command, then `bun run typecheck` and `bun run lint` from `apps/web`. Record exact commands and results. No SUNAT/SIRE gate is required because fiscal behavior is explicitly unchanged.
- [ ] **10. Perform final scope and index checks.** Review `git diff --check`, `git diff --name-only`, `git diff --cached --name-only`, and the final diff. Confirm only the planned shell, route, sidebar allowlist, and focused test files changed; no staged files remain; all visible sidebar routes are in the allowlist; public paths have no private chrome; each private proof route has one shell; and no placeholder or fiscal mutation/data work exists.
- [ ] **11. Produce apply handoff evidence.** Record RED/GREEN/TRIANGULATE/REFACTOR command output, worktree base SHA, provider-fix reconciliation receipt, changed-file list, test results, scope-diff result, residual accessibility limitation (no full focus trap), and whether the 400-line budget remains satisfied. Do not commit or publish.

## Review Workload Forecast

| Measure | Forecast |
| --- | --- |
| Delivery strategy | `single-pr` only if the isolated diff stays within budget; otherwise stop and split before widening scope |
| Estimated changed lines | 205–331 |
| Review budget | 400 lines |
| Estimated files | 7 (4 implementation, 3 focused test files) |
| Hot paths | Authenticated root composition and mobile navigation accessibility |
| Fiscal/domain impact | None by design; presentation/navigation only |
| Estimated review time | 30–45 minutes |
| Review path | `__root.tsx` → `drenyra.tsx` → `AgenticLayout.tsx` → sidebar allowlist → focused tests |
| Required review focus | Single provider/shell ownership, de-nesting, allowlist completeness, mobile dismissal/focus/scroll lifecycle, and absence of fiscal data or mutations |

If the isolated, approved implementation forecast exceeds 400 changed lines, needs more than the listed bounded files, or requires any scoped fiscal-data work, stop before expanding the diff and propose a separate chained slice. Do not weaken test evidence to remain under budget.

## Completion criteria

- Root shell behavior is exactly `public: Outlet` and `private: FiscalInspectorProvider > AgenticLayout > Outlet`.
- `/cierre-mensual`, `/contabilidad/cierre-mensual`, and `/drenyra` each prove a single private shell with no nested provider/chrome.
- Visible sidebar targets are exactly the spec allowlist; unsupported targets are absent.
- Mobile trigger/drawer lifecycle meets the specified accessible behavior; desktop/collapsed navigation remains operable.
- Strict TDD evidence is recorded in order: RED, GREEN, TRIANGULATE, REFACTOR.
- The worktree/provider prerequisite is evidenced, no unrelated changes are claimed, no files are staged, and final diff remains within the 400-line review budget.
