# CAP-WORKBENCH-00 — Drenyra Operational Workbench

**Última actualización:** 2026-07-27
**Content type:** Canonical — Capability Program
**North star:** [Drenyra Product Philosophy](../products/drenyra-product-philosophy.md)
**Taxonomy:** [Program Taxonomy](./program-taxonomy.md)
**Status:** ⚡ active — Wave A (Shell) in progress

---

## 1. Purpose

Transform Drenyra from a SaaS dashboard into an **operational workbench** — a persistent, agentic, financial engineering environment where professionals control companies, periods, agents, and fiscal decisions without losing context.

This is **not** a dashboard. A dashboard is passive. The Workbench is:

- **Persistent**: layout, panes, and state survive sessions
- **Agent-aware**: agent states, activity, and decisions are first-class UI elements
- **Change-oriented**: organized around Change Sets, not chats
- **Review-centric**: financial diffs, evidence, policies, and approvals dominate
- **Multi-surface**: web primary, Tauri desktop shell, mobile supervision

## 2. Design Principles

| Principle | Source | Translation |
|-----------|--------|-------------|
| **Instantaneity** | Ghostty | Feedback < 100ms, no blank loading screens, streaming panes |
| **Spatial composition** | Ghostty/Herdr | Panes, splits, persistent layouts — not page navigation |
| **Semantic agent state** | Herdr | Working, blocked, waiting-for-approval — visible per pane |
| **Persistent workspaces** | Herdr | Detach/reattach, resume exactly where work stopped |
| **Parallel isolation** | Codex | Change Sets as isolated candidates, reviewable diffs |
| **Skills & automations** | Codex | Composable routines, attention queue |
| **Materiality** | Drenyra | Financial impact, evidence, policy, risk — not just code diffs |
| **Professional approval** | Drenyra | R0–R3 gates, step-up auth, receipt-driven execution |
| **AI does not dominate** | Drenyra | Work, changes, evidence, and decisions own the screen — not chat |

## 3. Hierarchy Model

```
Organization
└── Portfolio
    └── Company
        └── Fiscal period
            └── Workspace
                ├── Workstreams
                ├── Change Sets
                ├── Agent runs
                ├── Evidence
                ├── Reviews
                └── Executions
```

A chat is secondary. Results materialize as: findings, tasks, classifications, reconciliations, proposed changes, workflows, approval requests, reports, receipts. Never bury a decision in a chat bubble.

## 4. SDD Program Plan — 14 SDDs, 5 ADRs, 4 Waves

### Reconciliation with existing SDDs

| Proposed SDD | Existing SDD(s) | Relationship |
|-------------|-----------------|--------------|
| SDD-WB-001 Application Shell | `drenyra-agentic-shell` ✅, `drenyra-global-shell` ✅ | **Evolves** existing shells into full Workbench shell — workspace hierarchy, sidebar evolution, company/period switcher |
| SDD-WB-002 Persistent Panes | `drenyra-three-panel-layout` ✅ | **Evolves** fixed three-panel into dynamic, resizable, persistable pane system |
| SDD-WB-003 Universal Command | `drenyra-frontend-command-center-reset` ✅ | **Evolves** existing command center into ⌘K palette with navigation/query/execution commands |
| SDD-WB-004 Financial Change Set | `drenyra-accountant-operating-system` ⛔ blocked | **Replaces.** Narrow blocked SDD → full Change Set model with isolation, diff, lifecycle |
| SDD-WB-005 Financial Diff & Impact | `drenyra-accounting-diff` ✅ | **Extends** existing accounting diff with financial impact, materiality, policy, professional review |
| SDD-WB-006 Agent Activity & State | `drenyra-accountant-interface` ○ draft, `drenyra-h4-agent-ux` ◌ empty | **Replaces.** Draft/empty SDDs → semantic agent state, activity feed per pane |
| SDD-WB-007 Agent Event Streaming | `drenyra-studio-platform` 🟡 partial | **Extends** with real-time streaming, pause/cancel/resume, reconnect |
| SDD-WB-008 Attention Inbox | `drenyra-control-tower` 📦 archived | **Replaces.** Archived control tower → prioritized attention inbox (risk × materiality × deadline) |
| SDD-WB-009 R0–R3 Approvals | `drenyra-fiscal-agent-discipline` ○ draft | **Extends** draft approval model with step-up auth, preview, receipt |
| SDD-WB-010 Evidence Inspector | `drenyra-evidence-vault-2` ✅ | **Extends** existing evidence vault with provenance navigation, policy display, diff context |
| SDD-WB-011 Skills & Automations | `drenyra-skills-automations` ✅, `drenyra-studio-platform` 🟡 partial | **Extends** with UI for skills browser, automation scheduler, run history |
| SDD-WB-012 Desktop Shell | — | **New.** Tauri 2 shell with system tray, multi-window, local certs, bridge |
| SDD-WB-013 Keyboard & Accessibility | — | **New.** Full keyboard model, three density modes, screen reader support |
| SDD-WB-014 Performance Budgets | — | **New.** Hard performance targets, UX telemetry, instrumentation |

### ADRs

| ADR | Title |
|-----|-------|
| ADR-WB-001 | Web-first with optional Tauri shell |
| ADR-WB-002 | AG Grid as canonical operational grid |
| ADR-WB-003 | Panes as presentation, not domain ownership |
| ADR-WB-004 | Change Sets instead of mutable drafts |
| ADR-WB-005 | Agent results materialize as domain artifacts |

### Implementation Waves

```
Wave A — Shell (SDD-WB-001, -002, -003, -014)
  ├── Workspace hierarchy & sidebar evolution
  ├── Company/period switcher
  ├── Dynamic pane system with persistence
  ├── ⌘K command palette (navigation, query, execution)
  ├── Keyboard model (three density modes)
  └── Performance budgets & UX telemetry

Wave B — Agent Awareness (SDD-WB-006, -007)
  ├── Pi event streaming to frontend
  ├── Semantic agent state per pane
  ├── Activity feed (tools executed, sources consulted)
  ├── Pause/cancel/resume actions
  └── Context inspection per run

Wave C — Review Model (SDD-WB-004, -005, -009, -010)
  ├── Financial Change Set model (isolated candidates)
  ├── Financial diff with impact, materiality, policy
  ├── Evidence inspector with provenance graph
  ├── Comments and discussion per Change Set
  └── R0–R3 approval gates with step-up auth

Wave D — Continuous Operations (SDD-WB-008, -011, -012, -013)
  ├── Attention inbox (risk × materiality × deadline)
  ├── Skills browser and automation scheduler
  ├── Tauri 2 desktop shell (system tray, multi-window)
  ├── Mobile supervision (approve, review, alert)
  └── Full accessibility (screen reader, keyboard-only)
```

## 5. R0–R3 UX Model

| Level | Action | UX |
|-------|--------|----|
| **R0** — Read | Explain, compare, summarize, search | No friction. Instant results. |
| **R1** — Reversible | Propose classification, create note, prepare reconciliation | Fast action with undo/discard. |
| **R2** — Internal material | Change internal state | **Mandatory preview**: what changes, financial impact, affected entities, evidence, policy, rollback method. |
| **R3** — External execution | Submit to SUNAT, post irreversible journal | **Step-up auth**: authority, company, period, action, documents, materiality, policy version, prepared by, approved by. Separate prepare vs execute. Receipt required. |

## 6. Performance Targets

| Metric | Target |
|--------|--------|
| Visual feedback on interaction | < 100ms |
| Command palette visible | < 100ms |
| Pane switch (loaded panes) | Instant |
| Layout restoration | < 300ms |
| First agentic event perceptible | < 500ms |
| Grid scrolling | 60fps target |
| Company switch | No blank screen |
| Stream reconnection | Automatic |

## 7. Existing Surface to Reconcile

The following features already exist and must be reconciled rather than rebuilt:

| Feature | Files | Status |
|---------|-------|--------|
| Agentic Shell | Applied | Already agentic-first sidebar, needs evolution |
| Global Three-Panel Layout | Applied | Fixed panels → dynamic panes |
| Command Center | Applied | Needs ⌘K palette evolution |
| Accounting Diff | Applied | Needs financial impact layer |
| Evidence Vault 2.0 | Applied | Needs provenance navigation |
| Skills & Automations | Applied | Needs UI layer |
| Studio Platform | Partial | Needs event streaming |
| Accountant Interface | Draft specs | Absorbed into SDD-WB-006 |
| Accountant OS | Blocked | Replaced by SDD-WB-004 |
| Agent UX (h4) | Empty | Absorbed into SDD-WB-006/-007 |

## 8. Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| UI framework | React 19 + TanStack Router | Already the stack |
| Operational grid | AG Grid Enterprise | Grouping, aggregation, pivot, server-side, Excel export |
| Primitives | Radix UI | Unstyled, accessible, typed |
| Data fetching | TanStack Query | Cache, sync, mutations |
| State machines | XState (selective) | R3 approval, onboarding, document import |
| Graphs | React Flow | Evidence Graph, provenance, lineage |
| Desktop | Tauri 2 | Reuse web UI, native tray, multi-window, certs |
| Mobile | Responsive React + PWA | Supervision only, no 30-column grids |
| Real-time | Server-Sent Events + WebSocket | Agent event streaming |

## 9. Color/Risk Convention

| Color | Meaning |
|-------|---------|
| 🟢 Green | Validated or accepted (never "high AI confidence") |
| 🟡 Amber | Requires attention |
| 🔴 Red | Risk, blocker, or failure |
| 🔵 Blue | In progress or informational |
| ⚪ Gray | Unknown, incomplete, or unevaluated |

A 98% AI prediction does NOT earn green until validators (and professional review, when applicable) confirm it.

## 10. Entry Points

| Surface | Mode | Description |
|---------|------|-------------|
| Web (primary) | TanStack Start | Full workbench |
| Desktop | Tauri 2 | Notifications, multi-window, local certs, bridge |
| Mobile | PWA | Supervision, approve/reject, alerts |

---

*Next: [SDD-WB-001](./sdd-wb-001-proposal.md)*
