<!-- markdownlint-disable MD013 -->

# Design — Drenyra Frontend Command Center Reset

## Architectural decision

Build the reset as a staged replacement of the primary experience, not as a big-bang deletion.

The implementation strategy is:

1. inventory and classify legacy surface;
2. promote the agentic shell as default;
3. replace dashboard-first home with Accounting Inbox;
4. implement mission-centered monthly close as the flagship workflow;
5. attach Evidence Inspector and Fiscal Risk Layer to every high-risk decision;
6. retire/quarantine legacy routes after replacement evidence exists;
7. harden performance, accessibility, tests, and design-system usage.

This protects fiscal workflows while still moving aggressively toward the new product direction.

## Current-state observations

From `apps/web/MAP.md` and CodeGraph:

- `apps/web` is a React 19 + Vite + TanStack Router SPA with 47 flat routes and ~40 feature modules.
- Existing command-center concepts already exist in:
  - `apps/web/src/components/agentic-shell/AgenticLayout/*`;
  - `apps/web/src/components/agentic/*`;
  - `apps/web/src/features/artifacts/*`;
  - `apps/web/src/features/cierre-mensual/*`;
  - `apps/web/src/features/inbox/*`;
  - `apps/web/src/features/approval-hub/*`;
  - `apps/web/src/features/reconciliations/*`.
- Legacy/default shell concepts still exist in:
  - `apps/web/src/components/layout/MainLayout.tsx`;
  - `apps/web/src/components/layout/Sidebar.tsx`;
  - `apps/web/src/components/layout/TopBar.tsx`;
  - `apps/web/src/routes/dashboard.tsx`;
  - many module-first routes such as invoices, banking, cashflow, reports, neural-grid, chat, scanner, plugins, and product surfaces.
- Some current code shows transition debt:
  - `apps/web/src/features/banking/hooks/useBanking.ts` mixes API data with mock accounts for demo richness;
  - `apps/web/src/components/ui/PageShell.tsx` and `packages/ui/src/components/Command.tsx` use CSS-variable arbitrary class patterns that should not be copied into new UI without token discipline;
  - `packages/ui/src/components/Command.tsx` still uses `forwardRef`, which is acceptable for Radix/cmdk interop but should not be the default React 19 pattern for new components.

## Information architecture

### Primary navigation

Primary navigation should express accounting outcomes:

```text
Home / Accounting Inbox
Clients / Companies
Missions
Comprobantes
Banks
Reconciliations
Taxes
SIRE / SUNAT
Reports
Vault / Evidence
Agents
Settings
```

### Compatibility navigation

Legacy modules that are still useful but not command-center-native move to compatibility access:

- command palette search;
- contextual links from missions;
- hidden `/tools` or `/legacy` namespace only if needed;
- no primary sidebar prominence.

### Route strategy

- Keep TanStack Router file-based routing.
- Never manually edit `routeTree.gen.ts`.
- Prefer adding mission routes under a focused namespace instead of expanding flat route sprawl.
- Existing route modules must be classified before removal.

Suggested target namespaces:

```text
/                         -> Accounting Inbox
/missions                 -> mission list
/missions/monthly-close   -> flagship close workflow
/clients                  -> Client 360 list
/clients/$id              -> Client 360 detail
/evidence                 -> Vault
/agents                   -> agent operations
/settings                 -> configuration
/tools/*                  -> compatibility-only legacy tools, if needed
```

## Component architecture

### Shell

Use a compound shell model:

```tsx
<CommandCenterShell>
  <CommandCenterShell.Sidebar />
  <CommandCenterShell.Workspace />
  <CommandCenterShell.Inspector />
  <CommandCenterShell.CommandBar />
</CommandCenterShell>
```

Rules:

- The provider owns shell state, workspace selection, inspector state, command palette state, and responsive behavior.
- Children compose shell slots instead of passing many boolean props.
- Context interface stays narrow and testable.
- The shell should not import every feature module directly.

### Accounting Inbox

Core sections:

- Critical blockers;
- Due soon;
- Suggested by Drenyra;
- Active missions;
- Client priority list;
- Recent approvals and evidence.

Each row/card must include:

- company/RUC/period;
- risk;
- evidence status;
- owner/approval state;
- next action;
- link to mission or inspector.

### Mission Workspace

Mission components:

- `MissionHeader` — scope, status, risk, owner, period;
- `MissionProgress` — structured step progress;
- `AgentTimeline` — explainable agent work log;
- `MissionBlockers` — unresolved fiscal/accounting blockers;
- `MissionArtifacts` — produced/required artifacts;
- `MissionActions` — review/approve/export actions gated by risk.

### Evidence Inspector

Panel modes:

- source document;
- XML/PDF/CDR;
- accounting diff;
- fiscal validation;
- policy/approval gate;
- audit/reversal path;
- agent reasoning.

Inspector state should reference artifact IDs and scope, not duplicate large payloads in client state.

## State and data boundaries

- Server state belongs in TanStack Query.
- Client UI state belongs in a small Zustand store or shell provider.
- Long-running accounting workflows use explicit state machines only where the transition graph matters.
- Fiscal mutations must route through API contracts with approval gates and audit metadata.
- Mock/demo data must be quarantined behind test fixtures, Storybook/Ladle, or explicit demo mode; it must not silently merge into production hooks.

## Design system direction

### Visual foundation

Use a premium warm institutional palette:

```text
cream pearl background
warm white surface
copper/lucuma accents
soft green success
amber/copper warning
clay red error
OLED institutional dark mode
```

### Token discipline

- Theme values live in the design token system, not scattered one-off classes.
- New components use semantic classes/tokens.
- Raw hex colors are not allowed in new UI.
- Arbitrary class values are allowed only for layout geometry, not design colors.

### Interaction design

Use restrained microinteractions:

- agent status changes;
- skeleton loaders;
- confidence/risk chips;
- evidence badges;
- timeline step transitions;
- before/after accounting diffs;
- approval state feedback.

Avoid:

- gamer neon;
- 3D dashboards;
- decorative AI avatars;
- unexplained magic;
- route-heavy workflows that force users to reconstruct context.

## Performance strategy

- Shell loads first; feature surfaces load by route or command activation.
- Heavy tables and charts must be lazy-loaded and virtualized when needed.
- Avoid dashboard importing every KPI/chart on initial command-center load.
- Use TanStack Query keys scoped by organization/company/RUC/period.
- Avoid server/client waterfalls by parallelizing independent data requirements.
- Keep compatibility routes outside first-load chunks.

## Accessibility strategy

- Command palette, inspector, dialogs, and approvals must be keyboard navigable.
- Focus moves predictably between sidebar, workspace, inspector, and command entry.
- Risk and confidence cannot rely only on color.
- Timeline and mission status need semantic labels.
- Destructive/irreversible actions require accessible confirmation flows.

## Migration strategy

### Phase 0 — Inventory

Create the retirement map:

```text
route -> feature -> components -> stores/hooks -> data/api -> tests -> classification -> replacement -> PR
```

### Phase 1 — Safe shell switch

Introduce command-center shell behind a feature flag or route-level adapter. Keep old routes accessible.

### Phase 2 — New home and mission flagship

Make Accounting Inbox and monthly close mission the primary user path.

### Phase 3 — Evidence and risk hardening

Attach inspector, risk semantics, approval state, and audit/reversal path to high-risk workflows.

### Phase 4 — Legacy retirement

Remove or quarantine legacy surfaces only after replacement criteria are met.

### Phase 5 — Hardening

Run performance, accessibility, bundle, class name, type, lint, and test gates.

## Review workload strategy

The user selected an aggressive delivery preference: single PR default with a 600-line budget.

Guardrails:

- If a slice exceeds 600 changed lines, split it despite the default preference.
- If a slice touches fiscal/SUNAT/payment/approval behavior, run risk + reliability review before merge.
- If a slice is mostly UI structure, run readability + reliability review.
- If deleting legacy code, include the retirement-map row as evidence.

## Risks

| Risk                                          | Impact   | Mitigation                                                     |
| --------------------------------------------- | -------- | -------------------------------------------------------------- |
| Big-bang deletion breaks workflows            | High     | Inventory first; compatibility route until replacement passes  |
| UI hides fiscal scope                         | Critical | Scope chip required: company, RUC, period, affected docs/books |
| Agentic UI overpromises                       | High     | Copy and UX require evidence/confidence/approval language      |
| Bundle grows from parallel legacy + new shell | Medium   | Lazy-load compatibility routes; bundle check per slice         |
| Mock data leaks into production UX            | High     | Quarantine mocks in fixtures/demo-only modules                 |
| Review overload                               | High     | 600-line cap; split if touched subsystems or risk grows        |
