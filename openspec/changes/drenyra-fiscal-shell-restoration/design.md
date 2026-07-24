# SDD Design — drenyra-fiscal-shell-restoration

**Last updated:** 2026-07-12  
**Change:** `drenyra-fiscal-shell-restoration`  
**Phase:** design  
**Scope:** `apps/web` authenticated-shell composition only  
**Review budget:** 400 changed lines

## 1. Decision

Restore a single private shell at the root route; do not add a second route-layout abstraction or data dependency.

```text
Public/auth pathname
  __root.tsx
    Outlet

Any non-public pathname
  __root.tsx
    FiscalInspectorProvider (exactly one)
      AgenticLayout (exactly one)
        Outlet
          route content
```

`/cierre-mensual` and `/contabilidad/cierre-mensual` remain direct lazy routes to the same `CierreMensualPage`; neither receives a local provider or layout. `/drenyra` changes from a lazy `AgenticLayout` route to an outlet-only route, so it contributes no chrome under the root shell.

This is presentation and routing work. It must not read, create, infer, cache, or display fiscal scope or operational data.

## 2. Exact composition and de-nesting

### Root route

In `apps/web/src/routes/__root.tsx`:

1. Keep `useLocation` and `isPublicRoute(pathname)` as the sole boundary decision.
2. For a public pathname, return `<Outlet />` directly.
3. For every other pathname, return:

```tsx
<FiscalInspectorProvider>
  <AgenticLayout>
    <Outlet />
  </AgenticLayout>
</FiscalInspectorProvider>
```

The root owns the only `FiscalInspectorProvider`. `AgenticLayout` must not import or mount that provider. Passing the root outlet as `children` makes ownership explicit and prevents an accidental second outlet boundary.

### Drenyra route

In `apps/web/src/routes/drenyra.tsx`, replace the lazy `AgenticLayout` component with an outlet-only route component. The file imports `Outlet` and exposes it as the route component (or a named wrapper that returns it). It must not lazy-load `AgenticLayout`, import the inspector provider, or add a layout landmark.

Do not use `isStandaloneRoute` to exclude `/drenyra` from root composition. It has no consumers today; removing the obsolete standalone declaration/function is optional cleanup only if its router unit coverage is updated in the same bounded diff. The required behavior is that it cannot influence private-shell rendering.

### Layout ownership

In `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx`, preserve `children ?? <Outlet />` for existing consumers, but remove no longer-needed provider ownership (already dirty in the current checkout). The root target above is authoritative. Apply must reconcile the dirty layout change rather than overwrite it.

## 3. Route-backed sidebar navigation

The sidebar remains static presentation data, but the data file becomes the explicit allowlist. `AGENTIC_NAV_ITEMS` may contain only these route-source-verified `to` values:

- `/inbox`, `/cierre-mensual`, `/firm/clients`, `/evidence`, `/review-queue`
- `/banking`, `/tesoreria/reconciliations`, `/invoices`, `/contabilidad/ledger`
- `/taxation`, `/cumplimiento/expedientes`, `/compliance`
- `/financials`, `/reports`, `/audit`, `/tools`, `/configuracion`

The current inspected list already matches this allowlist. The implementation change is a guardrail, not a new navigation surface:

1. Export a `VERIFIED_AGENTIC_NAV_DESTINATIONS` readonly tuple/set from `AgenticSidebar.data.ts` next to the nav configuration.
2. Derive sections from `AGENTIC_NAV_ITEMS` after a defensive filter against that exported set, or use a typed construction that makes an out-of-set `to` value a test failure.
3. Keep the two existing primary buttons limited to navigation to `/drenyra`; they must not call mutation APIs, open a data-backed workflow, or show results.
4. Do not add a route because it is present in a map or navigation label. A future destination requires a route-source verification and spec update first.

This verifies route existence only. It does not claim route-level tenant/RUC authorization, which is absent from the inspected client route sources. Hiding unsupported entries is safer than a disabled link, redirect, or placeholder destination.

## 4. Responsive accessibility repair

The existing `isSidebarMobileOpen` state currently gates only the backdrop; it does not drive sidebar visibility. Repair that ownership in `AgenticLayout` without changing the persisted store contract.

### Semantics and state

- Add a mobile-only menu trigger in the layout outside the drawer. It uses a ref, a stable `useId()` drawer ID, an accessible Spanish name, `aria-expanded={isSidebarMobileOpen}`, and `aria-controls={drawerId}`.
- The left shell `<aside>` is the drawer/navigation landmark. Below `xl`, its visibility, pointer interaction, and accessibility-tree presence are driven by `isSidebarMobileOpen`; a closed drawer is translated/hidden, inert/non-interactive, and `aria-hidden`.
- At `xl` and above, the existing expanded/collapsed desktop states remain independent of mobile-open state. The collapsed toggle remains keyboard-operable and keeps its current accessible name.
- The drawer is not rendered as a second `AgenticSidebar`; the same left-side instance changes responsive presentation. This prevents duplicate nav landmarks and IDs.

### Dismissal and focus lifecycle

- Opening stores the trigger element as the focus-return target.
- A document-level `keydown` effect listens only while the mobile drawer is open; Escape calls `setSidebarMobileOpen(false)`.
- The backdrop remains a dedicated button (or an equivalent keyboard-operable control), has an accessible dismissal name, and closes the drawer on activation.
- A cleanup/close effect restores focus to the trigger after open changes to false, releases `document.body.style.overflow`, and removes the keydown listener. It must also release the lock on unmount.
- While open, set body overflow to hidden. Do not add a focus trap library in this bounded slice; instead ensure the closed drawer cannot receive focus and test focus return. A later modal abstraction may add trapping if required by a broader shell accessibility change.

Use Tailwind responsive/semantic utility classes and `cn` only for conditional classes. Do not add arbitrary color values, fiscal context cards, or data hooks.

## 5. Tests and strict TDD evidence

Apply must record RED → GREEN → TRIANGULATE → REFACTOR evidence in its apply artifact.

1. **RED — root composition:** update `apps/web/src/routes/__tests__/root-fiscal-inspector-provider.test.tsx` to mock `AgenticLayout` with shell landmark/test IDs. Assert public paths render only outlet; private path renders exactly one provider, sidebar/navigation, command bar, and workspace/main landmark.
2. **RED — aliases and de-nesting:** add a focused root/layout route-composition test (or extend the root test with mocked route children) for `/cierre-mensual`, `/contabilidad/cierre-mensual`, and `/drenyra`. Assert each private case has exactly one shell landmark/provider; prove the `/drenyra` route does not import/mount `AgenticLayout` through its outlet-only behavior.
3. **GREEN:** implement root wrapping, outlet-only `/drenyra`, and one responsive sidebar instance. Re-run only the failing tests until green.
4. **TRIANGULATE — navigation:** extend `AgenticSidebarNavItems.test.tsx` to assert every rendered nav target belongs to `VERIFIED_AGENTIC_NAV_DESTINATIONS` and the expected permitted set is rendered. Add a negative assertion for a deliberately unsupported destination only if it exists in source at apply time.
5. **TRIANGULATE — accessibility:** add `AgenticLayout` DOM tests using `user-event` for mobile trigger `aria-expanded`/`aria-controls`, actual drawer visibility, Escape, backdrop activation, focus restoration, and body-scroll release. Add collapsed-toggle keyboard reachability plus an assertion that closed drawer controls are not focusable/reachable.
6. **REFACTOR:** only after all tests pass, remove duplicated test setup or helper code. Inspect the diff for no fiscal-domain/API/schema/query/mutation changes and no representative operational values.

Run from the isolated worktree:

```bash
cd apps/web
bun run test:run -- src/routes/__tests__/root-fiscal-inspector-provider.test.tsx src/components/agentic-shell/AgenticSidebar/__tests__/AgenticSidebarNavItems.test.tsx <new-layout-test>
bun run typecheck
bun run lint
```

No SUNAT/SIRE gate is required because no fiscal behavior changes. Do not run broad mutation or domain tests as substitute evidence for the focused shell tests.

## 6. File and line forecast

| File                                                                                             | Change                                                                  |    Estimate |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------: |
| `apps/web/src/routes/__root.tsx`                                                                 | private root wraps the outlet in the single layout/provider composition |       12–20 |
| `apps/web/src/routes/drenyra.tsx`                                                                | replace route-level layout with outlet-only route                       |        8–14 |
| `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx`                          | mobile trigger, responsive visibility, Escape/focus/scroll lifecycle    |       55–85 |
| `apps/web/src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`                    | explicit verified-destination invariant                                 |       10–22 |
| `apps/web/src/routes/__tests__/root-fiscal-inspector-provider.test.tsx`                          | root/alias/de-nesting landmark regressions                              |       35–55 |
| `apps/web/src/components/agentic-shell/AgenticSidebar/__tests__/AgenticSidebarNavItems.test.tsx` | allowlist and unsupported-link tests                                    |       20–35 |
| `apps/web/src/components/agentic-shell/AgenticLayout/__tests__/AgenticLayout.test.tsx`           | drawer accessibility lifecycle tests                                    |      65–100 |
| **Total**                                                                                        | **7 files**                                                             | **205–331** |

The forecast is within the 400-line budget. No route generation change is expected because no route path changes. If an existing test harness makes route alias integration require a new router fixture exceeding the remaining budget, split that fixture-only work rather than weakening landmark evidence.

## 7. Worktree decision and residual risks

**An isolated worktree is mandatory before apply.** The current checkout is on `security/w3a-0-auth-tenant-context` and has unrelated modified root/layout/route files plus numerous unrelated tracked and untracked changes. Critically, `apps/web/src/routes/__root.tsx` and `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx` are already dirty, and `apps/web/src/routes/cierre-mensual.tsx` contains adjacent provider-removal work. Applying here could overwrite or incorrectly claim another change's work.

Create a dedicated worktree from the approved base, then explicitly transplant/reconcile only approved prerequisite changes after identifying their owner. Do not use the current dirty diff as implicit implementation evidence.

Remaining risks:

- Route-source verification proves only that client route files exist; it does not establish tenant/RUC authorization adequacy.
- The `/drenyra` outlet route may intentionally have no index content; confirm its child-route behavior in the isolated test harness without restoring a nested shell.
- A no-library focus strategy restores focus and removes hidden controls, but does not provide a full modal focus trap. This is acceptable for the bounded repair only if focused DOM tests prove no close-state trap; otherwise defer to a dedicated dialog primitive change.
- Existing `useMemo` in `AgenticLayout` is pre-existing and out of scope under the React Compiler convention.
