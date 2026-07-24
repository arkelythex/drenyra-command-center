# SDD Proposal: Restore the Authenticated Fiscal Shell

**Last updated:** 2026-07-12  
**Change:** `drenyra-fiscal-shell-restoration`  
**Mode:** automatic / OpenSpec / auto-forecast  
**Review budget:** 400 changed lines

## Problem

The authenticated root currently renders `FiscalInspectorProvider` and `Outlet` without `AgenticLayout`. Both monthly-close aliases (`/cierre-mensual` and `/contabilidad/cierre-mensual`) therefore render without persistent navigation. `AgenticLayout` is mounted only by `/drenyra`; mounting it globally without changing that route would duplicate shell chrome.

The existing sidebar also contains destinations that are not backed by the route map. Restoring it globally must not expose broken navigation or manufacture fiscal scope, close, or agent data.

## Bounded Functional Outcome

Restore exactly one authenticated `AgenticLayout` shell so both monthly-close aliases receive the same accessible sidebar and workspace frame. Make `/drenyra` an outlet/content route so it cannot mount a nested shell. Limit sidebar navigation to supported, fiscal-safe destinations; hide unsupported destinations rather than routing users to broken screens.

This slice is structural and navigational. It must use no placeholder company, RUC, period, active-close, approval, or agent-run data.

## Scope

- Mount one `AgenticLayout` at the authenticated route boundary, while preserving public and authentication routes without private chrome.
- Ensure `/cierre-mensual` and `/contabilidad/cierre-mensual` render inside that single shell.
- Simplify `/drenyra` to content/outlet composition, preventing a second `AgenticLayout`.
- Retain only sidebar links whose routes and access model are verified; hide stale or unsupported destinations.
- Preserve existing command, inspector, and monthly-close content behavior without adding data dependencies.
- Add focused route/layout regression coverage for one shell, both aliases, and safe navigation visibility.

## Acceptance Outcomes

1. An authenticated visit to either monthly-close alias renders one visible `AgenticLayout` sidebar and one workspace, with no duplicate shell landmarks or duplicate navigation controls.
2. An authenticated visit to `/drenyra` renders one shell only; the route does not mount an additional sidebar, command bar, or inspector provider boundary.
3. Public and authentication routes remain outside the authenticated shell.
4. Every visible sidebar destination resolves to an implemented route permitted by the existing client-side access model. Unsupported or stale destinations are absent, not disabled links and not redirects to placeholder pages.
5. The restored sidebar presents no invented company, RUC, fiscal period, active-close status, approval state, agent state, evidence count, or search result.
6. Desktop, collapsed, tablet, and mobile sidebar operation preserves keyboard access: visible controls have accessible names; the mobile drawer exposes `aria-expanded` and `aria-controls`; Escape and backdrop dismissal close it; focus returns to its trigger; and body scroll/focus cannot remain trapped after close.
7. No fiscal calculations, period locks, approvals, SUNAT/SIRE/UBL/CDR flows, accounting mutations, or audit records change.

## Fiscal Safety Boundaries

- This slice is presentation and route composition only: it introduces no query, mutation, cache, or contract for fiscal data.
- It must not infer scope from URL fragments, defaults, fixtures, browser storage, or an unscoped cached record.
- It must not display representative scope or operational status when authoritative scoped data is absent.
- Navigation and command entry points remain non-mutating. Any future workflow that prepares or executes fiscal work must retain server-derived organization/company/RUC/period scope, explicit human approval, evidence, audit metadata, and a reversal path.
- Hiding a destination is preferred to exposing a route whose tenant/RUC authorization or implementation is unverified.

## Accessibility and Responsive Constraints

- Maintain the current responsive model: visible desktop sidebar, collapsed intermediate layout, and mobile drawer/overlay.
- Do not make fiscal orientation unreachable at narrow widths; the shell trigger and its accessible name must remain available.
- Drawer dismissal must work by Escape and backdrop, restore focus to the invoking control, and release scroll lock.
- Do not duplicate navigation landmarks, IDs, or focus targets when `/drenyra` renders under the root shell.

## Non-Goals

- No sidebar enrichment with company/RUC/period, active-close, agent-status, recent-work, recommendation, or evidence-summary cards.
- No new global fiscal data contract, schema, API endpoint, data hook, or cross-company/RUC query.
- No visual Codex clone or replacement of `MainLayout`, `CodexShell`, or the separate command-center feature.
- No route cleanup outside destinations necessary to prevent the restored sidebar from exposing verified-broken links.
- No modification to monthly-close business logic, fiscal calculations, approvals, or audit behavior.

## Delivery Forecast and Slice Boundary

The shell restoration, `/drenyra` de-nesting, safe-link filtering, and focused regression tests are forecast at **120–220 lines across 4–6 files**, within the 400-line budget.

Sidebar enrichment is explicitly deferred to a later change. It may proceed only after an existing authoritative, tenant-scoped source can provide company, RUC, period, active-close, and agent-run state without placeholders. If establishing that source or its tests would exceed the remaining 400-line budget, it must be separately proposed and sliced rather than combined with this restoration.

## Evidence Required in Later Phases

- Route tests proving both monthly-close aliases render a single shell.
- A route/layout test proving `/drenyra` does not nest shell landmarks.
- Navigation tests proving visible links are implemented and stale links are hidden.
- Responsive/manual accessibility evidence for trigger labeling, drawer dismissal, focus restoration, and scroll release.
- A diff review confirming no fiscal-domain, API, schema, or mutation code was changed.

## Residual Risks

- Root/layout files already have unrelated worktree modifications; apply must isolate or reconcile those changes before editing.
- Source is authoritative over prior applied-state claims; the previous global-shell record is inconsistent with the current root implementation.
- A route may exist but still lack adequate authorization guarantees. Visibility must remain conservative until route and access behavior are verified.
- Sidebar enrichment remains blocked until real scoped data is proven available.
