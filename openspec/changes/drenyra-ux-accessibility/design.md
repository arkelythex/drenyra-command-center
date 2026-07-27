# UX & Accessibility — Architecture & Design

**Change:** `drenyra-ux-accessibility`
**Phase:** design
**Status:** Complete
**Based on:** Spec + Proposal

---

## Phase 1: WCAG 2.1 AA Accessibility

### Audit methodology

1. **Automated audit**: axe-core via Playwright on 10 critical routes (login, dashboard, banking, invoices, reports, compliance, settings, fiscal workspace, cognitive-hub, ledger)
2. **Manual keyboard audit**: Tab order, focus indicators, skip links, ARIA landmarks
3. **Screen reader audit**: NVDA + VoiceOver on 5 primary workflows
4. **Color contrast**: Automated check against tokens

### Remediation priorities

- P0: Keyboard navigation + focus management (blocking for blind users)
- P1: ARIA labels + screen reader announcements
- P2: Color contrast on all text/background combinations
- P3: Skip links + semantic HTML structure

### CI gate

- Playwright + axe-core in CI pipeline (blocking)
- Minimum: 0 critical, 0 serious violations

---

## Phase 2: Evidence Rail & Approval Inspector

### Architecture

```
┌────────────────────────────────────────────────┐
│                Evidence Rail                    │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Timeline │ │ Evidence │ │   Approval     │  │
│  │ View     │ │  Cards   │ │   Inspector    │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
│        │            │               │          │
│        ▼            ▼               ▼          │
│  ┌────────────────────────────────────────┐   │
│  │         RED Integration Layer           │   │
│  │  (Receipt-Driven Execution events)      │   │
│  └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### Component tree

- `EvidenceRail` — container with timeline
- `EvidenceCard` — single evidence item (type, source, date, status)
- `ApprovalInspector` — approval flow (request, review, approve/reject)
- `ApprovalBadge` — visual status indicator

---

## Phase 3: Accounting Diff Workspace & Print Layouts

### Diff workspace

- Split-pane: before/after comparison
- Line-level diff highlighting (green/red per cell)
- Approval action bar (approve, reject, request changes)
- Evidence linking (drag evidence item to diff line)

### Print templates (5)

1. Balance Sheet (A4 portrait)
2. Profit & Loss (A4 portrait)
3. Trial Balance (A4 landscape, wide)
4. General Ledger (A4 landscape, account detail)
5. Invoice (A4 portrait, SUNAT-compliant)

### Storybook MVP (20 components)

- Core: Button, Input, Select, Modal, Table, Badge, Card
- Fiscal: EvidenceCard, ApprovalBadge, DiffLine, PrintPreview
- Navigation: Sidebar, Tabs, Breadcrumbs, Pagination
- Feedback: Toast, Spinner, EmptyState, ErrorBoundary, ConfirmDialog
