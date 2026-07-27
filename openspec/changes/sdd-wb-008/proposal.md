# SDD-WB-008 — Attention Inbox & Prioritization

**Change ID:** `sdd-wb-008`
**Capability:** CAP-WB-08 (Attention Inbox)
**Wave:** D (Continuous Operations)
**Created:** 2026-07-27
**Supersedes:** `drenyra-control-tower` (archived)

## Purpose

The Attention Inbox is the most important screen in the Workbench. It replaces passive dashboards with an active, prioritized queue of what needs attention.

Not sorted by date. Priority = Risk × materiality × deadline proximity × downstream impact × number of affected companies.

## Priority formula

```
score = riskScore * 100
      + min(materiality / 10000 * 10, 30)    // S/ 10k+ adds up to 30
      + deadline_bonus                        // past=50, <24h=40, <week=20
      + affectedCompanies * 5
      + priority_bonus                        // critical=30, high=15
```

## Categories

| Category           | Color    | Description                                            |
| ------------------ | -------- | ------------------------------------------------------ |
| R3 Approvals       | 🔴 Red   | External executions needing professional authorization |
| Material Risks     | 🟡 Amber | Findings with significant financial impact             |
| Blocked Closes     | 🔴 Red   | Companies that can't close the period                  |
| Missing Evidence   | 🟡 Amber | Required support documents not attached                |
| Agent Questions    | 🔵 Blue  | Agents waiting for user information                    |
| Failed Automations | 🔴 Red   | Automated tasks that couldn't complete                 |
| Completed & Ready  | 🟢 Green | Finished work ready for final review                   |

## Scope

### Included

1. **Attention types** — 7 categories with priority scoring formula
2. **AttentionInbox component** — Grouped by category, sorted by priority score, empty state "Todo al día"
3. **AttentionItemRow** — Priority indicator bar, title, description, company, deadline, material impact
4. **CategorySection** — Header with icon, label, count badge, items

## PRs

| PR  | Scope                           | Files | Lines |
| --- | ------------------------------- | ----- | ----- |
| PR1 | Types + scoring formula         | 1     | ~120  |
| PR2 | AttentionInbox + sub-components | 1     | ~250  |
| PR3 | Inbox page integration          | 2     | ~80   |
