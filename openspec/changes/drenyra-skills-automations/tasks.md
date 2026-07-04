# Tasks: Skills Library + Automations

**Última actualización:** 2026-07-03
**Change:** drenyra-skills-automations
**Delivery:** auto-chain — 4 PRs
**Estrategia:** PR1 (domain+persistence) → PR2 (API) → PR3 (skills UI) → PR4 (automations UI)

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,400–1,600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (~350) → PR2 (~350) → PR3 (~400) → PR4 (~400) |
| Decision needed before apply | Chained PR strategy confirmed (auto-chain) |

---

## PR1 — Domain + Persistence (~350 lines)

**Scope:** Domain entities, Drizzle schema, seeds, indexes

### Tasks

- [ ] 1.1 Create `packages/domain/src/entities/skill/skill-id.ts` — SkillId branded type + factory
- [ ] 1.2 Create `packages/domain/src/entities/skill/skill-capability.ts` — SkillCapability interface
- [ ] 1.3 Create `packages/domain/src/entities/skill/skill-category.ts` — SkillCategory type + constants
- [ ] 1.4 Create `packages/domain/src/entities/skill/skill-status.ts` — SkillStatus type
- [ ] 1.5 Create `packages/domain/src/entities/skill/skill.ts` — Skill entity class with factory, invariants
- [ ] 1.6 Create `packages/domain/src/entities/skill/skill-installation.ts` — SkillInstallation entity (per-company)
- [ ] 1.7 Create `packages/domain/src/entities/skill/index.ts` — barrel export
- [ ] 1.8 Create `packages/persistence/src/schema/skills.schema.ts` — Drizzle schema for skills, skill_capabilities, company_skills
- [ ] 1.9 Create `packages/persistence/src/seed/skills.seed.ts` — seed 6 predefined skills with capabilities
- [ ] 1.10 Add domain entities to domain barrel export (`packages/domain/src/index.ts` if needed)
- [ ] 1.11 Generate + run migration

### Dependencies

- Drenyra persistence conventions (Drizzle patterns)
- Existing entity patterns (AccountingDiff as reference)

---

## PR2 — API (~350 lines)

**Scope:** Skills API vertical slice + Automations wrapper API

### Tasks

- [ ] 2.1 Create `apps/api/src/features/skills/skills.schemas.ts` — Zod/Elysia validation schemas
- [ ] 2.2 Create `apps/api/src/features/skills/skills.repository.ts` — Drizzle queries for skills/capabilities/company_skills
- [ ] 2.3 Create `apps/api/src/features/skills/skills.service.ts` — Business logic: list, detail, install, uninstall, config
- [ ] 2.4 Create `apps/api/src/features/skills/skills.routes.ts` — Elysia routes for 6 endpoints
- [ ] 2.5 Create `apps/api/src/features/skills/index.ts` — barrel export + plugin registration
- [ ] 2.6 Create `apps/api/src/features/automations/automations.schemas.ts` — Validation schemas
- [ ] 2.7 Create `apps/api/src/features/automations/automations.service.ts` — Wrapper sobre automation-studio
- [ ] 2.8 Create `apps/api/src/features/automations/automations.routes.ts` — Elysia routes for automations
- [ ] 2.9 Create `apps/api/src/features/automations/index.ts` — barrel export + plugin registration
- [ ] 2.10 Register both features in API main app

### Dependencies

- PR1 (domain entities + schema)
- `companyScopeGuard` pattern
- `ok`/`fail` helpers
- Existing `automation-studio` internals

---

## PR3 — Skills UI (~400 lines)

**Scope:** Refactor SkillsPage, TanStack Query hooks, detail/config panels

### Tasks

- [ ] 3.1 Create `apps/web/src/features/skills/hooks/useSkills.ts` — TanStack Query hooks (useSkills, useInstalledSkills, useInstallSkill, etc.)
- [ ] 3.2 Extract `apps/web/src/features/skills/components/SkillCard.tsx` from existing SkillsPage
- [ ] 3.3 Create `apps/web/src/features/skills/components/SkillSearchBar.tsx` — search + category filter
- [ ] 3.4 Create `apps/web/src/features/skills/components/SkillDetailView.tsx` — detail for RightInspector/modal
- [ ] 3.5 Create `apps/web/src/features/skills/components/SkillConfigPanel.tsx` — config inline panel
- [ ] 3.6 Refactor `apps/web/src/features/skills/components/SkillsLibraryPage.tsx` — main page with API data
- [ ] 3.7 Create `apps/web/src/features/skills/index.ts` — barrel export
- [ ] 3.8 Update `apps/web/src/routes/drenyra/skills.tsx` — use new components + API
- [ ] 3.9 Refactor `apps/web/src/features/agent-swarm/hooks/useSkillStore.ts` — integrate TanStack Query
- [ ] 3.10 Add "skills" to RightInspector context (optional, depends on Plan 1 integration)

### Dependencies

- PR2 (Skills API)
- Existing `useSkillStore` + `SkillPage`
- TanStack Query patterns (used in other features)

---

## PR4 — Automations UI (~400 lines)

**Scope:** Refactor AutomationsView, wizard, timeline, toggles

### Tasks

- [ ] 4.1 Create `apps/web/src/features/automations/hooks/useAutomations.ts` — TanStack Query hooks
- [ ] 4.2 Extract `apps/web/src/features/automations/components/AutomationCard.tsx` from existing view
- [ ] 4.3 Create `apps/web/src/features/automations/components/AutomationToggle.tsx` — on/off toggle
- [ ] 4.4 Create `apps/web/src/features/automations/components/AutomationTriggerConfig.tsx` — trigger configuration step
- [ ] 4.5 Create `apps/web/src/features/automations/components/AutomationActionList.tsx` — skills selection step
- [ ] 4.6 Create `apps/web/src/features/automations/components/AutomationCreateWizard.tsx` — multi-step dialog
- [ ] 4.7 Create `apps/web/src/features/automations/components/AutomationLogTimeline.tsx` — execution history timeline
- [ ] 4.8 Refactor `apps/web/src/features/automations/components/AutomationsPage.tsx` — main page with API data
- [ ] 4.9 Update `apps/web/src/routes/automations.tsx` — render new AutomationsPage directly
- [ ] 4.10 Clean up or redirect `/configuracion/automations` to new route
- [ ] 4.11 Update sidebar CommandPalette entries if needed

### Dependencies

- PR2 (Automations API)
- Existing `AutomationsView` + `automation-studio` schema/types
- PR3 (SkillCard/useSkills for skill selection in wizard)

---

## Summary

| PR | Scope | Files | Estimated Lines |
|----|-------|-------|----------------|
| PR1 | Domain + Persistence | 10-12 | ~350 |
| PR2 | API (Skills + Automations) | 8-10 | ~350 |
| PR3 | Skills UI | 10-12 | ~400 |
| PR4 | Automations UI | 12-14 | ~400 |
| **Total** | | **40-48** | **~1,500** |
