# UX & Accessibility — Drenyra Experience Completion

**Change ID:** `drenyra-ux-accessibility`
**Created:** 2026-07-26
**Depends on:** DS1 (design tokens), DS2 (typography), DS4 (component states), DS5 (three-panel layout), FE-RESET (command center) — all applied
**Related canonical spec:** `openspec/specs/design-system/accessibility/spec.md` (REQ-A11Y-001 through REQ-A11Y-003 provide the design-system level accessibility baseline; this spec extends it with WCAG 2.1 AA route-level compliance, evidence rail, accounting diff workspace, print layouts, and Storybook)

## Purpose

Close the 6 post-design-system UX gaps (CAP-UX-04, CAP-UX-05, CAP-UX-06, CAP-UX-08, CAP-UX-09, CAP-UX-10) across three sequential phases: WCAG 2.1 AA compliance for critical routes, evidence rail with approval inspector and RED integration, and an accounting diff workspace with professional print layouts and a Storybook MVP.

## Requirements

---

### Phase 1 — WCAG 2.1 AA Accessibility Audit & Remediation

#### Requirement: P1-REQ-001 — Automated accessibility audit across 10 critical routes

The system MUST run an automated accessibility audit using axe-core integrated with Playwright across the 10 designated critical routes. The audit MUST produce a machine-readable violations report with rule IDs, impacted elements, and severity levels.

> **Reference:** Extends `REQ-A11Y-002` (focus-visible) from the design-system accessibility canonical spec by adding route-level automated enforcement.

##### Scenario: Full route audit produces violations report

- GIVEN the 10 critical routes are accessible in the test environment
- WHEN the automated audit suite runs via `bun test:a11y`
- THEN a JSON violations report is produced listing every WCAG 2.1 AA violation with the axe-core rule ID, DOM selector, and impact level (critical/serious/moderate/minor)

##### Scenario: Audit gates CI on critical and serious violations

- GIVEN the audit report contains one or more violations with impact `critical` or `serious`
- WHEN the CI pipeline executes the accessibility gate
- THEN the pipeline MUST fail with a summary of the failing rules and routes

##### Scenario: Zero violations on clean state

- GIVEN all violations on the 10 critical routes have been remediated
- WHEN the audit suite runs
- THEN the report MUST show zero violations at the WCAG 2.1 AA level

---

#### Requirement: P1-REQ-002 — Manual keyboard navigation audit

The system's 10 critical routes MUST pass a manual keyboard navigation audit covering: (a) all interactive elements reachable via Tab, (b) focus order follows visual reading order, (c) no keyboard traps, (d) skip-to-content link present on every route, (e) Escape closes modals/dropdowns and returns focus to trigger.

##### Scenario: Full keyboard navigation on dashboard

- GIVEN a keyboard-only user on the `/dashboard` route
- WHEN the user presses Tab repeatedly
- THEN every interactive control (links, buttons, inputs, dropdowns) receives visible focus in logical visual order AND no element is unreachable

##### Scenario: Escape closes modal and returns focus

- GIVEN a modal is open on any critical route
- WHEN the user presses Escape
- THEN the modal closes AND focus returns to the element that triggered the modal

##### Scenario: Skip link present on every critical route

- GIVEN any of the 10 critical routes
- WHEN the page loads and the user presses Tab once
- THEN a visible "Skip to content" link appears and, when activated, moves focus to the `<main>` element

---

#### Requirement: P1-REQ-003 — WCAG 2.1 AA remediation

The system MUST remediate every violation discovered by the automated and manual audits to meet WCAG 2.1 AA conformance. Remediation MUST cover: (a) semantic HTML landmark structure (`<header>`, `<nav>`, `<main>`, `<footer>`), (b) ARIA labels and roles where native semantics are insufficient, (c) color contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text/UI components on both dark and light themes, (d) screen-reader accessible live regions for dynamic content, (e) form inputs with programmatically associated labels.

##### Scenario: Color contrast meets AA on dark editorial theme

- GIVEN the dark editorial theme is active
- WHEN the audit measures contrast on body text, link text, and UI component boundaries across the 10 critical routes
- THEN all text/background pairs meet or exceed 4.5:1 (body text) and 3:1 (large text ≥ 18px or ≥ 14px bold)

##### Scenario: Color contrast meets AA on light editorial theme

- GIVEN the light editorial theme is active
- WHEN the audit measures contrast on body text, link text, and UI component boundaries across the 10 critical routes
- THEN all text/background pairs meet or exceed 4.5:1 (body text) and 3:1 (large text ≥ 18px or ≥ 14px bold)

##### Scenario: Landmarks are properly structured

- GIVEN any of the 10 critical routes
- WHEN a screen reader user navigates by landmarks
- THEN exactly one `<main>` exists, navigation regions are contained in `<nav>`, and the page header uses `<header>` / banner role

##### Scenario: Form inputs have accessible labels

- GIVEN any form on a critical route with visible text adjacent to an input
- WHEN inspected
- THEN the input is programmatically associated with its label via `for`/`id` or `aria-labelledby`, and no input relies solely on placeholder text for labelling

##### Scenario: Dynamic content announces to screen readers

- GIVEN dynamic content updates occur (e.g., toast notifications, table row additions, filter results)
- WHEN the content changes
- THEN the container uses `aria-live="polite"` or `aria-live="assertive"` as appropriate AND the announcement is not repeated unnecessarily

---

#### Requirement: P1-REQ-004 — CI accessibility gate

The system MUST integrate the automated accessibility audit as a required CI gate. The gate MUST block merges when critical or serious WCAG 2.1 AA violations are present on any of the 10 critical routes. The gate report MUST be human-readable in CI output.

##### Scenario: PR with new accessibility regression is blocked

- GIVEN a PR introduces a new WCAG 2.1 AA violation on a critical route
- WHEN the CI pipeline runs
- THEN the accessibility gate fails and the PR cannot merge

##### Scenario: PR with no regressions passes the gate

- GIVEN a PR containing only changes unrelated to the 10 critical routes or changes that maintain zero violations
- WHEN the CI pipeline runs
- THEN the accessibility gate passes

---

#### Requirement: P1-REQ-005 — Keyboard shortcuts registry

The system MUST provide a centralized keyboard shortcuts registry that: (a) lists every global and scoped keyboard shortcut, (b) avoids conflicts with browser and screen-reader shortcuts, (c) is discoverable via a `?` key help overlay on any route, (d) supports the 10 critical routes with at minimum: navigation between the three panels, quick search focus, and escape/close patterns.

##### Scenario: Help overlay shows registered shortcuts

- GIVEN a user on any critical route
- WHEN the user presses `?`
- THEN a keyboard shortcuts overlay appears listing all active shortcuts for the current context with their key bindings and descriptions

##### Scenario: Shortcuts do not conflict with screen reader keys

- GIVEN the keyboard shortcuts registry
- WHEN audited against common screen-reader key bindings (NVDA, JAWS, VoiceOver)
- THEN no global shortcut interferes with screen-reader navigation or reading commands

##### Scenario: Panel navigation via keyboard

- GIVEN the three-panel layout is visible
- WHEN the user presses the defined panel-navigation shortcut (e.g., `Ctrl+[` / `Ctrl+]`)
- THEN focus moves between the sidebar, workspace, and evidence rail in order

---

### Phase 2 — Evidence Rail & Approval Inspector

#### Requirement: P2-REQ-001 — Evidence rail with pending approvals

The system MUST render an evidence rail in the right panel that displays pending approvals for the current context. Each approval item MUST show: (a) a human-readable title, (b) the approval level badge (R0–R3), (c) the submitter and timestamp, (d) a summary of what changed, and (e) a visual indicator of urgency or staleness.

##### Scenario: Evidence rail shows pending approvals for current workspace

- GIVEN the user is viewing a workspace with 3 pending approvals (one R1, two R2)
- WHEN the evidence rail is open
- THEN all 3 approvals are listed with their level badges, submitter names, and timestamps sorted by urgency (stalest first)

##### Scenario: Empty state when no approvals are pending

- GIVEN the current workspace has zero pending approvals
- WHEN the evidence rail is open
- THEN an informative empty state is displayed: "No pending approvals" with an optional link to the full approvals history

##### Scenario: Filter approvals by level

- GIVEN the evidence rail shows approvals at R0, R1, R2, and R3 levels
- WHEN the user selects the "R2" filter chip
- THEN only R2-level approvals are displayed

---

#### Requirement: P2-REQ-002 — Approval inspector with visual diff

The system MUST provide an approval inspector view that opens when an approval item is selected from the evidence rail. The inspector MUST display: (a) a side-by-side or unified visual diff of the current ledger state versus the proposed change, (b) the evidence/receipt linked to the approval, (c) action buttons for Approve, Reject, and Edit (which opens the proposed change for modification), and (d) an audit comment thread.

##### Scenario: Open approval inspector with ledger diff

- GIVEN the user clicks an R2 approval for a journal entry change
- WHEN the inspector opens
- THEN a visual diff shows the current ledger debit/credit values versus the proposed values with additions highlighted in green and removals in red

##### Scenario: Approve action with confirmation

- GIVEN the approval inspector is open
- WHEN the user clicks "Approve" and confirms in the confirmation dialog
- THEN the approval state transitions to "Approved," the receipt is recorded via RED, and the item is removed from the pending list

##### Scenario: Reject action with required comment

- GIVEN the approval inspector is open
- WHEN the user clicks "Reject"
- THEN a comment field is required before the rejection is submitted, and upon submission the approval state transitions to "Rejected" with the comment preserved

##### Scenario: Edit action opens the proposed change

- GIVEN the approval inspector is open for an editable proposal
- WHEN the user clicks "Edit"
- THEN the workspace navigates to the entity in edit mode with the proposed values pre-populated, and the approval remains pending until resubmitted

---

#### Requirement: P2-REQ-003 — RED integration for immutable receipts

The system MUST integrate with RED (Receipts Engine Drenyra) to produce an immutable receipt for every approval decision (approve/reject). Each receipt MUST include: the approval ID, the decision, the actor, a timestamp, and a content hash of the diff that was approved or rejected. The receipt ID MUST be displayed in the approval inspector and stored as a reference on the approval record.

##### Scenario: Approval produces an immutable RED receipt

- GIVEN an approval is confirmed
- WHEN the decision is processed
- THEN a RED receipt is generated with a unique receipt ID, and that ID is stored on the approval record and visible in the inspector

##### Scenario: Rejection produces an immutable RED receipt

- GIVEN a rejection with a required comment is submitted
- WHEN the decision is processed
- THEN a RED receipt is generated capturing the rejection, the comment, the actor, and the content hash

##### Scenario: Receipt traceability across the system

- GIVEN an approval has a RED receipt ID
- WHEN the receipt ID is referenced from any part of the system (audit log, export, approval history)
- THEN the full receipt content can be retrieved and verified for integrity

---

### Phase 3 — Accounting Diff Workspace, Print Layouts & Storybook

#### Requirement: P3-REQ-001 — Visual accounting diff (git-diff style for double-entry)

The system MUST provide a visual diff viewer for accounting entries styled as a git diff. The diff MUST display: (a) the debit and credit sides of the current entry vs. the proposed entry side-by-side or unified, (b) line-level additions (green) and removals (red) for each account line, (c) the net balance impact of the proposed change, (d) account code and description for each affected line, and (e) a summary row showing total debits/credits match before and after.

##### Scenario: Single journal entry diff with account-level changes

- GIVEN a journal entry with 3 debit lines and 2 credit lines
- WHEN a proposed edit modifies one debit amount and adds a new credit line
- THEN the diff viewer shows the modified debit in red (old) / green (new), the new credit line in green, unchanged lines in neutral, and both the old and new trial balance totals at the bottom

##### Scenario: Diff confirms double-entry balance

- GIVEN a diff showing changes to a journal entry
- WHEN the diff is rendered
- THEN the summary row MUST confirm that total debits equal total credits in both the current and proposed states, and any imbalance is flagged in red

---

#### Requirement: P3-REQ-002 — Batch view for multiple accounting entries

The system MUST provide a batch diff view that aggregates changes across multiple journal entries. The batch view MUST: (a) list each entry in the batch with its identifier and a one-line change summary, (b) allow expanding individual entries to see their full diff inline, (c) display the aggregate net impact across all entries, and (d) support bulk approval of the entire batch.

##### Scenario: Batch view with multiple entries

- GIVEN a batch containing 5 journal entries with proposed changes
- WHEN the batch diff workspace is opened
- THEN all 5 entries are listed with identifiers and one-line summaries, and expanding any entry reveals its full line-level diff

##### Scenario: Bulk approval of an entire batch

- GIVEN a batch with all entries reviewed and individually expanded
- WHEN the user clicks "Approve Batch" and confirms
- THEN all 5 approvals are processed, RED receipts are generated for each, and the batch transitions to "Approved" status

##### Scenario: Batch with mixed states

- GIVEN a batch where 2 entries have already been individually approved and 3 remain pending
- WHEN the batch view is opened
- THEN the 2 approved entries show their approved state (disabled, with receipt IDs) and the 3 pending entries remain actionable

---

#### Requirement: P3-REQ-003 — CSS print stylesheet and 5 A4 professional templates

The system MUST provide a dedicated print stylesheet that produces professional A4 output. The system MUST include 5 print templates: (1) Journal Entry Detail, (2) Trial Balance Summary, (3) Approval Audit Trail, (4) Batch Summary, (5) Account Statement. Each template MUST: (a) render on A4 with proper margins (≤ 20mm), (b) include a header with Drenyra branding, document title, and date, (c) include a footer with page numbers and confidentiality notice, (d) use the Drenyra design tokens for colors and typography, (e) be accessible via a "Print" action in the relevant workspace.

##### Scenario: Print journal entry as A4 PDF

- GIVEN a journal entry detail view
- WHEN the user triggers "Print" and selects the Journal Entry Detail template
- THEN the browser print dialog opens with the entry formatted for A4, including header, all debit/credit lines with account codes, totals, and footer with page number

##### Scenario: Print stylesheet hides interactive chrome

- GIVEN any print template is invoked
- WHEN the print media is applied
- THEN navigation bars, action buttons, filter controls, and non-essential UI chrome are hidden via `@media print` rules

##### Scenario: Color contrast preserved in grayscale print

- GIVEN a print template with diff highlighting (green/red lines)
- WHEN printed in grayscale or on a monochrome printer
- THEN additions and removals remain distinguishable through pattern or intensity differences, not color alone

---

#### Requirement: P3-REQ-004 — Storybook MVP with 20 components

The system MUST provide a Storybook MVP showcasing at minimum 20 Drenyra UI components. Each story MUST: (a) render the component in isolation with its canonical props, (b) include at minimum one story per meaningful variant (e.g., default, active, disabled, error), (c) use the Drenyra design token theme provider so components appear as they do in the app, and (d) include an accessibility addon check (axe-core) that runs per story.

##### Scenario: Storybook renders 20 components with variants

- GIVEN Storybook is running (`bun storybook`)
- WHEN the component index is opened
- THEN at minimum 20 components are listed, each with at least the default story

##### Scenario: Each component story passes axe-core check

- GIVEN any component story
- WHEN the Storybook accessibility addon panel is inspected
- THEN zero WCAG 2.1 AA violations are reported for that story

##### Scenario: Theme provider wraps all stories

- GIVEN any component story
- WHEN toggling between dark and light themes in Storybook
- THEN the component re-renders with the correct design token colors for the selected theme

---

## Acceptance Criteria by Phase

### Phase 1 Gate

- Automated audit produces a violations report on first run (baseline established)
- All critical and serious violations from the baseline report are remediated
- Subsequent audit runs report zero WCAG 2.1 AA violations on the 10 critical routes
- Manual keyboard audit checklist is complete with zero blockers
- CI accessibility gate is active and blocks PRs with new critical/serious violations
- Keyboard shortcuts help overlay (`?`) is functional and conflict-free with screen readers

### Phase 2 Gate

- Evidence rail renders pending approvals with level badges and filtering
- Approval inspector opens with visual diff for any pending approval
- Approve, Reject (with comment), and Edit actions function correctly
- RED integration produces an immutable receipt for every decision
- Receipt IDs are stored on approval records and retrievable
- Time to review 10 journal entries is under 5 minutes (measured)

### Phase 3 Gate

- Accounting diff viewer renders line-level changes with debit/credit balance verification
- Batch view supports multi-entry listing, inline expansion, and bulk approval
- All 5 print templates render correctly on A4 with header, footer, and proper margins
- Print stylesheet hides interactive chrome via `@media print`
- Diff additions/removals remain distinguishable in grayscale print
- Storybook serves 20 components with dark/light theme toggle
- Every Storybook story passes the axe-core accessibility addon check
- Storybook is runnable via `bun storybook`

## Out of Scope

- Redesign of existing components (this change layers on top of DS1–DS5 and FE-RESET)
- Modification of cognitive-hub structure (152 files; alternative view only)
- Digital signatures (real cryptographic signatures deferred)
- Full onboarding rewrite (CAP-UX-09 addressed partially via keyboard shortcuts help overlay only)
- WCAG compliance beyond the 10 critical routes (future change)
- More than 20 Storybook components (future change)
- Mobile-first responsive design (desktop/tablet focus)

## Risks

| Risk                                        | Severity | Mitigation                                                                             |
| ------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| WCAG remediation breaks existing layouts    | High     | Incremental fix-and-screenshot cycle per route; Playwright visual regression snapshots |
| Cognitive-hub fragility (152 files)         | Medium   | Evidence rail uses alternative view pattern without modifying cognitive-hub internals  |
| RED integration coupling                    | Medium   | RED receipt generation is a well-defined API boundary; mock RED in tests               |
| Print CSS inconsistencies across browsers   | Low      | Target Chromium (Playwright PDF) as golden output; document Firefox/Safari deviations  |
| 3,200 changed lines exceeds 400-line budget | High     | Delivered as 8 chained PRs, each ≤ 600 lines; auto-chain strategy with stacked-to-main |
