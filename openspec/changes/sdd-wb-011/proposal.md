# SDD-WB-011 — Skills & Automations Interface

**Change ID:** `sdd-wb-011`
**Capability:** CAP-WB-11 (Skills & Automations Interface)
**Wave:** D (Continuous Operations)
**Created:** 2026-07-27
**Extends:** `drenyra-skills-automations` (applied)

## Purpose

Provide a Workbench-native interface for browsing, installing, and running skills and automations. Integrate the existing skills/automations features into the pane system.

## Scope

### Included

1. **Skills browser** — Grid of installable skills with category filters, search, version badges
2. **Automation scheduler** — List of scheduled automations with run history, next run, status
3. **Workbench integration** — Skills/Automations as workspace pane types

### Existing code

| Feature           | Files                                                 | Status    |
| ----------------- | ----------------------------------------------------- | --------- |
| SkillCard         | `features/skills/components/SkillCard.tsx`            | ✅ exists |
| SkillSearchBar    | `features/skills/components/SkillSearchBar.tsx`       | ✅ exists |
| SkillDetailView   | `features/skills/components/SkillDetailView.tsx`      | ✅ exists |
| AutomationCard    | `features/automations/components/AutomationCard.tsx`  | ✅ exists |
| AutomationsPage   | `features/automations/components/AutomationsPage.tsx` | ✅ exists |
| Skills UI         | `features/skills/hooks/useSkills.ts`                  | ✅ exists |
| Automations hooks | `features/automations/hooks/useAutomations.ts`        | ✅ exists |

### PRs

| PR  | Scope                         | Files est. | Lines est. |
| --- | ----------------------------- | ---------- | ---------- |
| PR1 | Skills browser pane component | 2          | ~100       |
| PR2 | Automation scheduler pane     | 2          | ~100       |
| PR3 | Pane type registration        | 1          | ~30        |
