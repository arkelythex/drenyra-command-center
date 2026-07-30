# CAP-FEOS-EXPERIENCE-00: Plan — SDD-031 Financial Application Shell

## PR1: Financial Application Shell

### Tasks

1. Install react-resizable-panels
2. Create FinancialShell layout (3-panel: Nav | Canvas | Inspector)
3. Create TopBar (Org/Company/Period selectors + ⌘K trigger)
4. Create StatusBar (activity, live, risk, scope indicators)
5. Create NavigationSidebar (Attention, Portfolio, Companies, Periods, Workspaces, Automations, Skills)
6. Create FinancialCanvas (template resolver)
7. Create InspectorPanel (contextual: Impact, Policy, Evidence, Approval, Receipt)
8. Routing integration (TanStack Router)
9. Tests (component rendering, layout persistence, states)

### Files

```
apps/web/src/features/financial-shell/
├── components/
│   ├── FinancialShell.tsx
│   ├── TopBar.tsx
│   ├── StatusBar.tsx
│   ├── NavigationSidebar.tsx
│   ├── FinancialCanvas.tsx
│   └── InspectorPanel.tsx
├── hooks/
│   ├── useWorkspaceLayout.ts
│   ├── useAttentionRollup.ts
│   └── useCommandPalette.ts
├── types.ts
└── __tests__/
    ├── FinancialShell.test.tsx
    ├── TopBar.test.tsx
    ├── NavigationSidebar.test.tsx
    ├── FinancialCanvas.test.tsx
    └── InspectorPanel.test.tsx
```

### Review workload

~600 lines, ~15 min review
