# CAP-FEOS-EXPERIENCE-00: Design

## Architecture

```
packages/workspace-layout         ← layout canónico (existente)
apps/web/src/features/
└── financial-shell/              ← NUEVO
    ├── components/
    │   ├── FinancialShell.tsx         ← Shell 3 paneles
    │   ├── TopBar.tsx                 ← Org/Company/Period + Search
    │   ├── StatusBar.tsx              ← Estado en vivo
    │   ├── NavigationSidebar.tsx      ← Attention, Portfolio, Companies, etc.
    │   ├── FinancialCanvas.tsx        ← Panel central con template resolver
    │   └── InspectorPanel.tsx         ← Panel derecho contextual
    ├── hooks/
    │   ├── useWorkspaceLayout.ts
    │   ├── useAttentionRollup.ts
    │   └── useCommandPalette.ts
    └── __tests__/
```

## Component Tree

```
FinancialShell
├── TopBar
│   ├── OrganizationSelector
│   ├── CompanySelector
│   ├── PeriodSelector
│   └── CommandPaletteTrigger (⌘K)
├── PanelGroup (horizontal)
│   ├── NavigationSidebar (collapsible, 260px)
│   │   ├── AttentionSection
│   │   ├── PortfolioSection
│   │   ├── CompaniesSection
│   │   ├── PeriodsSection
│   │   ├── WorkspacesSection
│   │   ├── AutomationsSection
│   │   └── SkillsSection
│   ├── FinancialCanvas (flex-1)
│   │   └── TemplateResolver → 5 templates
│   └── InspectorPanel (contextual, 380px)
│       ├── ImpactSection
│       ├── PolicySection
│       ├── EvidenceSection
│       ├── ApprovalSection
│       └── ReceiptSection
└── StatusBar
    ├── ActivitySummary
    ├── LiveIndicator
    ├── RiskIndicator
    └── ScopeIndicator
```

## States

```
Loading  → Skeleton shell
Ready    → Live with data
Replaying → Restoring from checkpoint (status bar)
Stale    → Data aged, reconnect needed
Error    → Scope or connection error
```

## ADRs

- ADR-001: Shell usa react-resizable-panels, no FlexLayout/Dockview (V1)
- ADR-002: El layout canónico (workspace-layout) se serializa y restaura; nunca el estado interno de react-resizable-panels
- ADR-003: Navigation sidebar es colapsable pero nunca removible (contexto siempre visible)
- ADR-004: Status bar es fija, muestra estado de vida del workspace
- ADR-005: TemplateResolver mapea WorkspaceLayoutTemplate → componente layout predefinido
- ADR-006: Todas las acciones R2/R3 requieren confirmación explícita fuera del canvas
