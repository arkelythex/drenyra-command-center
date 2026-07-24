# Exploration: Fiscal Shell Restoration

**Change:** `drenyra-fiscal-shell-restoration`
**Artifact store:** OpenSpec
**Phase:** explore
**Scope:** authenticated web routes, with monthly close as the first proof route

## Executive Summary

The authenticated monthly-close routes have no persistent shell because the actual root route at `apps/web/src/routes/__root.tsx` renders only `FiscalInspectorProvider` and `Outlet`. `AgenticLayout` and its sidebar exist, but are mounted only by `/drenyra`; `CierreMensualPage` is mounted directly by both `/cierre-mensual` and `/contabilidad/cierre-mensual`.

This contradicts the recorded applied state of `drenyra-global-shell`, which says `__root.tsx` wraps all private routes in `AgenticLayout`. The plan was not integrated into the current route root (or has regressed). Consequently, the previously applied `drenyra-sidebar-codex` work is unreachable on monthly close because its implementation belongs to `AgenticSidebar`, which is only rendered by `AgenticLayout`.

The recommended first slice is a bounded global private-route shell restoration: mount one fiscal-safe `AgenticLayout` around authenticated content, remove the nested `/drenyra` layout, and make the existing sidebar carry a compact, functional monthly-close context. It must preserve company, RUC, period, evidence/review access, approval state, and mobile overlay safety. It must not alter close calculations, SUNAT/SIRE flows, mutation permissions, or audit records.

## Concrete Findings

| Severity | Finding                                                                                                                                                                                                                                                                           | Evidence                                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Monthly close bypasses every persistent sidebar because the authenticated root renders only provider plus outlet.                                                                                                                                                                 | `apps/web/src/routes/__root.tsx`                                                                                                                                                                                           |
| High     | The applied `drenyra-global-shell` plan is inconsistent with the current source: its state says root wraps `AgenticLayout`; source does not.                                                                                                                                      | `openspec/changes/drenyra-global-shell/state.yaml`; `apps/web/src/routes/__root.tsx`                                                                                                                                       |
| High     | Both monthly-close route aliases directly render `CierreMensualPage`, so either URL exhibits the missing shell.                                                                                                                                                                   | `apps/web/src/routes/cierre-mensual.tsx`; `apps/web/src/routes/contabilidad/cierre-mensual.tsx`                                                                                                                            |
| Medium   | `/drenyra` mounts `AgenticLayout` as a route component; restoring it globally without removing this route-level mount would create nested shell chrome.                                                                                                                           | `apps/web/src/routes/drenyra.tsx`; `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx`                                                                                                                 |
| Medium   | The existing agentic sidebar has generic outcome navigation and a primary action/search entry, but no visible company/RUC/period or active-close/agent summary. The command bar has that context, but it is below the workspace rather than at navigation entry.                  | `apps/web/src/components/agentic-shell/AgenticSidebar/components/AgenticSidebarNavItems.tsx`; `apps/web/src/components/agentic-shell/AgenticCommandBar/AgenticCommandBar.tsx`                                              |
| Medium   | The `drenyra-sidebar-codex` state claims active closes, recent items, agent footer, recommendations, and close-page integration, but the checked-in `AgenticSidebar` composes only header, nav, and generic user footer. Its state is not backed by the inspected implementation. | `openspec/changes/drenyra-sidebar-codex/state.yaml`; `apps/web/src/components/agentic-shell/AgenticSidebar/AgenticSidebar.tsx`; `apps/web/src/components/agentic-shell/AgenticSidebar/components/AgenticSidebarFooter.tsx` |
| Medium   | Existing sidebar nav targets include routes not present in the route map (for example `/firm/clients`, `/evidence`, `/tools`, `/configuracion`), so restoring it globally can expose dead navigation.                                                                             | `apps/web/src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`; `apps/web/MAP.md`                                                                                                                           |
| Medium   | The command-center feature has a separate, deliberately null sidebar (`const sidebarContent = null`), confirming a second local shell path that should not be used as the global restoration mechanism.                                                                           | `apps/web/src/features/drenyra-command-center/components/DrenyraCommandCenter.tsx`                                                                                                                                         |
| Low      | `AgenticLayout` uses `useMemo` despite the React Compiler convention; this is pre-existing and out of scope for the shell restoration.                                                                                                                                            | `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx`                                                                                                                                                    |

## Current Composition

```text
Authenticated route
  __root.tsx
    FiscalInspectorProvider
      Outlet
        /cierre-mensual or /contabilidad/cierre-mensual
          CierreMensualPage

/drenyra only
  drenyra.tsx
    AgenticLayout
      Outlet
        AgenticSidebar + main content + optional right inspector + command bar
```

`CierreMensualPage` itself correctly exposes close-specific company name, RUC, period, blockers, phase status, tax review gate, evidence-opening inspector action, and agent timeline. That information remains inside the workspace; it cannot replace persistent cross-workspace orientation.

## Applied-Plan Reconciliation

### `drenyra-global-shell`

The proposal and state prescribe the exact structural direction required by this change: a private root-level `AgenticLayout`, a simple `/drenyra` route outlet, and removal of redundant per-route providers. Current source has not reached that state. The restoration must first reconcile source with the recorded applied plan; it should not introduce a second shell.

### `drenyra-sidebar-codex`

The applied state describes a useful Codex-inspired sidebar, but no proposal/spec/tasks artifacts are present and the inspected `AgenticSidebar` does not realize those promised elements. Treat the state as intent, not verified implementation. Reuse only the utility model: quick task entry, search, active work, recent work, and agent visibility. Do not copy Codex visuals or terminology.

## Bounded Functional First Slice

### In scope

1. Restore one `AgenticLayout` at the authenticated root boundary, excluding public/auth routes.
2. Make `/drenyra` an outlet/content route so it cannot nest the global shell.
3. Keep one sidebar implementation and enrich it with compact fiscal command-center utilities:
   - **Workspace context:** company name, RUC, and selected fiscal period, sourced from the existing active-company context.
   - **Primary task action:** a clearly labeled, non-mutating “New fiscal review” entry that opens the existing command/thread initiation path; it must not execute fiscal work.
   - **Search:** open the existing command palette or a safe search entry; search must not imply cross-tenant results.
   - **Active monthly close:** one status item linking to the current close, showing period and blocker/approval state from an existing scoped source. If no scoped close exists, render an explicit empty state rather than representative data.
   - **Agent status:** compact read-only status sourced from actual active runs; unavailable/loading/error states must be explicit.
   - **Audit path:** direct navigation to review queue/evidence/inspector, retaining human approval and reversal visibility.
4. Preserve the existing responsive model: desktop visible sidebar, tablet collapse, mobile modal drawer with backdrop, Escape dismissal, body scroll lock, accessible controls, and no hidden content that traps focus.
5. Test root-shell rendering, no nested `/drenyra` sidebar, both monthly-close aliases, sidebar fiscal context, active-close state, agent status states, and mobile dismissal behavior.

### Explicit non-goals

- No fiscal calculation, period-lock, approval, SIRE/SUNAT, CDR, UBL, or accounting mutation change.
- No new global data contract, schema, or cross-company query.
- No visual clone of Codex.
- No wholesale replacement of `MainLayout`, `CodexShell`, or the separate command-center feature in this slice.
- No route cleanup beyond links proven broken and needed for the restored sidebar; otherwise hide/defer unsupported destinations.

## Fiscal and Audit Guardrails

- Context data must be derived from the authenticated active company/RUC and selected period; never use a generic default or unscoped cached record.
- The active-close card must expose its scope and approval/blocker state before any action.
- Agent status is observational. Any action that prepares a journal, tax, submission, or close must retain explicit human approval, evidence, audit metadata, and reversal path.
- Search/navigation must not leak other organization or RUC results.
- The first slice reads existing scoped state; it does not create or mutate fiscal records.

## Responsive and Accessibility Safety

Use the existing `AgenticLayout` overlay boundary below `xl` only after validating that the open state drives actual visibility. The first slice should add a visible mobile entry point, Escape close behavior, backdrop dismissal, focus restoration, and `aria-expanded`/`aria-controls` semantics. Collapsed desktop mode must still expose navigable labels via accessible names and retain visible fiscal scope through a compact trigger or command bar; fiscal context must not disappear merely because width is constrained.

## Recommended Delivery Shape

Estimated implementation: 250–350 changed lines across 5–8 focused files plus tests. This fits the 400-line review budget if route cleanup and sidebar context are kept separate from navigation repair. Use a single PR only when tested route aliases and shell states remain within that estimate; otherwise chain:

1. **PR1: shell route restoration and regression tests** (~120–170 lines).
2. **PR2: scoped sidebar context and active-close/agent status states** (~180–230 lines).

The minimum viable first PR restores shell reachability; PR2 must not ship placeholder fiscal context.

## Verification Plan for a Later Apply Phase

1. RED: route-level tests establish that authenticated monthly-close aliases render the global shell, and `/drenyra` is not nested.
2. GREEN: implement the smallest root/layout changes and test desktop, collapsed, tablet, and mobile drawer states.
3. TRIANGULATE: add scoped active-close and agent-status fixtures for loading, empty, blocked, and approval-required cases.
4. REFACTOR: remove duplication only after tests prove no public route receives private chrome.
5. Run the narrow web tests, `bun run typecheck` from `apps/web`, then applicable lint/build checks. No SIRE reproduction gate is required unless fiscal domain behavior changes; tenant/RUC scope tests are required for any data hook introduced.

## Residual Risks

- The worktree already contains uncommitted changes in root/layout files and many unrelated artifacts. Any apply phase must isolate or explicitly reconcile them before editing.
- Applied-plan state does not reliably prove source integration; source and route tests are the authority.
- Several sidebar destinations may be stale, so restoring the sidebar can make navigation defects user-visible.
- Active monthly-close and agent status must not be represented with fixture-like values in production; lack of an existing scoped query is a blocker for those cards, not an excuse to show unsourced status.
