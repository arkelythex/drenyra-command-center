# Drenyra UX — Reference Documents

**Status**: reference | **Normative**: false

These documents contain **detailed implementation specifications** (TypeScript interfaces, WCAG checklists, performance budgets, UI patterns) that complement the canonical SDDs in `docs/ux/`.

## How agents should use these

1. Check the `consumed_by` frontmatter field to identify which canonical SDD this reference supports.
2. Read the reference document **only when implementing** the corresponding SDD.
3. The reference contains **practical details** — exact interfaces, budget numbers, pattern examples — that are not normative decisions but are needed for correct implementation.
4. If a reference contradicts a canonical SDD, **the canonical SDD wins**. Flag the contradiction for resolution.

## Document index

| File | Consumed by | Content |
|---|---|---|
| SDD-000-detailed-program.md | SDD-000 | Risk matrix, SDD Lite strategy |
| SDD-001-detailed-roles.md | SDD-001 | Full persona details, interview protocol |
| SDD-002-detailed-trust-contracts.md | SDD-006 | Trust contracts UI patterns, L0-L3 per contract |
| SDD-003-detailed-ia.md | SDD-002 | Navigation modes, homes per role, multi-RUC IA |
| SDD-004-detailed-telemetry.md | SDD-093 | Trust metrics (ETS, AGE, Trust Velocity), friction signals |
| SDD-005-detailed-accessibility.md | SDD-036 | WCAG fiscal table patterns, multi-sensory states |
| SDD-006-detailed-evidence-system.md | SDD-014 | Source types, confidence score, evidence depth levels |
| SDD-007-detailed-l0-l3.md | SDD-019 | L0-L3 UI patterns, transition matrix, tenant config |
| SDD-008-detailed-reversibility.md | SDD-017 | Reversibility windows, 7 states, compound reversal UI |
| SDD-009-detailed-ruc-scope.md | SDD-010 | Color hash, 4 visual modes, RUC switch protocol |
| SDD-010-detailed-approval-gates.md | SDD-015 | Gate levels G1-G5, 28 action types, SoD matrix |
| SDD-011-detailed-audit-trail.md | SDD-018 | EventEntry model, timeline components, 15+ action types |
| SDD-012-detailed-notifications.md | SDD-057 | 5 severities, 9 categories, 4 delivery priorities, offline queue |
| SDD-013-detailed-error-recovery.md | SDD-007 | 20 error codes (E01-E20), 16 recovery paths, error pipeline |
| SDD-014-detailed-content-strategy.md | SDD-008 | 5 principles, H1-H5 hierarchy, trust indicators per entity |
| SDD-015-detailed-onboarding.md | SDD-070 | 5-stage onboarding, feature registry, RUC wizard |
