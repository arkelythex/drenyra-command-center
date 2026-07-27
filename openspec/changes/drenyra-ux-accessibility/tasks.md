# Tasks: UX & Accessibility

**Change:** `drenyra-ux-accessibility`
**Phase:** tasks
**Status:** Complete

---

## PR1: Accessibility Audit (WCAG 2.1 AA) — ~400 lines

| #   | Task                                            | Files                                             | AC                                                       |
| --- | ----------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1.1 | axe-core Playwright audit on 10 critical routes | `apps/web/__tests__/a11y/critical-routes.test.ts` | 0 critical/serious violations                            |
| 1.2 | Manual keyboard audit + fix tab order           | `apps/web/src/**/*.tsx`                           | Tab order follows visual order, focus indicators visible |
| 1.3 | Color contrast remediation                      | Design tokens                                     | All text/background combos pass 4.5:1 ratio              |
| 1.4 | ARIA labels + screen reader announcements       | `apps/web/src/**/*.tsx`                           | NVDA + VoiceOver on 5 primary workflows                  |
| 1.5 | CI accessibility gate                           | `.github/workflows/a11y.yml`                      | Blocking PR check                                        |

## PR2: Evidence Rail + Approval Inspector — ~400 lines

| #   | Task                        | Files                                          | AC                                        |
| --- | --------------------------- | ---------------------------------------------- | ----------------------------------------- |
| 2.1 | EvidenceRail component      | `apps/web/src/shared/ui/EvidenceRail.tsx`      | Timeline view, type/source/date/status    |
| 2.2 | ApprovalInspector component | `apps/web/src/shared/ui/ApprovalInspector.tsx` | approve/reject/request changes            |
| 2.3 | RED integration             | Integration with evidence-v2 API               | Creates/lists evidence for approval flow  |
| 2.4 | ApprovalBadge component     | `apps/web/src/shared/ui/ApprovalBadge.tsx`     | Visual status (pending/approved/rejected) |

## PR3: Diff Workspace + Print Layouts — ~400 lines

| #   | Task                          | Files                                           | AC                                       |
| --- | ----------------------------- | ----------------------------------------------- | ---------------------------------------- |
| 3.1 | DiffWorkspace split-pane      | `apps/web/src/features/diffs/DiffWorkspace.tsx` | Before/after comparison, line-level diff |
| 3.2 | 5 print templates             | `apps/web/src/features/prints/`                 | A4, fiscal-compliant, print CSS          |
| 3.3 | Storybook MVP (20 components) | `apps/web/src/stories/`                         | Documented, interactive, themed          |
