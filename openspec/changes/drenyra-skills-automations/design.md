# Design: Skills Library + Automations

**Última actualización:** 2026-07-03
**Estado:** Design
**Change:** drenyra-skills-automations
**Delivery:** auto-chain — 4 PRs

---

## 1. Technical Approach

### 1.1 Skills Library

**Backend:** Vertical slice `apps/api/src/features/skills/` con Elysia + Drizzle. Skills globales en tabla `skills`, capacidades en `skill_capabilities`, instalaciones por cliente en `company_skills`. Seeds cargan 6 skills predefinidas.

**Frontend:** Refactor de la `SkillsPage` existente. TanStack Query reemplaza el store hardcoded como fuente de verdad. El Zustand store se mantiene como cache client-side con persistencia, pero sincroniza con API.

### 1.2 Automations

**Backend:** Thin wrapper `apps/api/src/features/automations/` sobre `automation-studio` existente. No duplica lógica de workflows/steps — traduce el modelo "automation = workflow + skills asociados" al API de automation-studio subyacente.

**Frontend:** Refactor de `AutomationsView`. TanStack Query + página nueva con wizard, timeline, toggles.

---

## 2. Database Schema

### New Tables: Skills

```sql
-- skills (global catalog)
CREATE TABLE skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('fiscal','finance','operations','audit')),
  version     TEXT NOT NULL DEFAULT '1.0.0',
  author      TEXT NOT NULL DEFAULT 'ARKELYTHEX',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','deprecated','experimental')),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- skill_capabilities
CREATE TABLE skill_capabilities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id      UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  action_type   TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_capabilities_skill_id ON skill_capabilities(skill_id);

-- company_skills (per-company installation)
CREATE TABLE company_skills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  skill_id      UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'installed' CHECK (status IN ('installed','disabled')),
  config        JSONB DEFAULT '{}',
  installed_by  TEXT NOT NULL,
  installed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, skill_id)
);

CREATE INDEX idx_company_skills_company_id ON company_skills(company_id);
CREATE INDEX idx_company_skills_skill_id ON company_skills(skill_id);
```

### Existing Tables (automation-studio)

Reutilización directa de:

- `automation_studio_workflows` — como base de automations
- `automation_studio_steps` — pasos de cada automation
- `automation_studio_executions` — historial de ejecuciones
- `automation_studio_logs` — logs detallados

No se crean tablas nuevas para automations. El wrapper mapea conceptos:

- "Automation" → workflow
- "Skills que ejecuta" → steps con action_type = "skill:execute" y config.skillId
- "Ejecución" → execution

---

## 3. API Contracts

### Skills API

```
GET /api/skills
→ 200 { data: SkillDTO[] }

GET /api/skills/:id
→ 200 { data: SkillDetailDTO }
→ 404 { error: "NOT_FOUND" }

GET /api/skills/installed
→ 200 { data: CompanySkillDTO[] }  // scoped por companyContext

POST /api/skills/:id/install
Body: {} (companyId de companyContext)
→ 200 { data: CompanySkillDTO }
→ 409 { error: "ALREADY_INSTALLED" }

POST /api/skills/:id/uninstall
→ 200 { data: { uninstalled: true } }
→ 404 { error: "NOT_INSTALLED" }

PATCH /api/skills/:id/config
Body: { config: { autoExecute?: boolean, notifyOnDiff?: boolean } }
→ 200 { data: CompanySkillDTO }
```

### DTOs

```typescript
SkillDTO {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  author: string;
  status: SkillStatus;
  installed?: boolean; // presente cuando company context existe
}

SkillDetailDTO extends SkillDTO {
  capabilities: SkillCapability[];
  metadata: Record<string, unknown>;
  installation?: CompanySkillDTO; // si está instalado
}

CompanySkillDTO {
  id: string;
  skillId: string;
  companyId: string;
  status: InstallationStatus;
  config: Record<string, unknown>;
  installedAt: string;
  skill: SkillDTO;
}

SkillCapability {
  id: string;
  name: string;
  description: string;
  actionType: string;
}
```

### Automations API

```
GET /api/automations
Query: { status?: string }
→ 200 { data: AutomationDTO[] }

GET /api/automations/:id
→ 200 { data: AutomationDetailDTO }
→ 404

POST /api/automations
Body: {
  name: string;
  description?: string;
  triggerType: "schedule" | "event" | "manual";
  triggerConfig: { cron?: string; eventType?: string };
  skillIds: string[];
  autonomy: "suggest" | "auto-approve" | "execute";
}
→ 201 { data: AutomationDetailDTO }

PATCH /api/automations/:id
Body: Partial<CreateBody>
→ 200 { data: AutomationDetailDTO }
→ 404

POST /api/automations/:id/toggle
Body: { active: boolean }
→ 200 { data: AutomationDTO }

GET /api/automations/:id/logs
Query: { limit?: number; offset?: number }
→ 200 { data: AutomationLogEntry[] }

POST /api/automations/run
Body: { automationId: string }
→ 202 { data: { executionId: string } }
```

### Automations DTOs

```typescript
AutomationDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  triggerType: "schedule" | "event" | "manual";
  triggerConfig: Record<string, unknown>;
  status: "active" | "paused" | "draft";
  skills: { id: string; name: string }[];
  autonomy: "suggest" | "auto-approve" | "execute";
  lastRunAt?: string;
  lastRunStatus?: "success" | "failed" | "running";
  runCount: number;
}

AutomationDetailDTO extends AutomationDTO {
  executionLogs: AutomationLogEntry[];
}

AutomationLogEntry {
  id: string;
  automationId: string;
  status: "running" | "success" | "failed";
  startedAt: string;
  completedAt?: string;
  resultSummary?: string;
  error?: string;
  skillsExecuted: { skillId: string; skillName: string; status: string }[];
}
```

---

## 4. State Management

### Skills Store (updated)

```typescript
// apps/web/src/features/agent-swarm/hooks/useSkillStore.ts
// Refactor: TanStack Query como source of truth, Zustand como cache

interface SkillStore {
  // Cache client-side
  skills: SkillDTO[];
  installedSkills: CompanySkillDTO[];
  
  // Actions (sincronizan con API)
  fetchSkills: () => Promise<void>;
  fetchInstalled: () => Promise<void>;
  installSkill: (id: string) => Promise<void>;
  uninstallSkill: (id: string) => Promise<void>;
  updateConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
}

// TanStack Query hooks
function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/api/skills').then(r => r.data),
  });
}

function useInstalledSkills() {
  return useQuery({
    queryKey: ['skills', 'installed'],
    queryFn: () => api.get('/api/skills/installed').then(r => r.data),
  });
}
```

### Automations Store (new)

```typescript
// apps/web/src/features/automations/hooks/useAutomations.ts
function useAutomations() { /* TanStack Query */ }
function useAutomationLogs(id: string) { /* TanStack Query */ }
function useCreateAutomation() { /* useMutation */ }
function useToggleAutomation() { /* useMutation */ }
function useRunAutomation() { /* useMutation */ }
```

---

## 5. File Structure

### PR1 — Domain + Persistence

```
packages/domain/src/entities/skill/
  skill.ts                  → Skill entity class + factory
  skill-id.ts               → SkillId branded type
  skill-capability.ts       → SkillCapability interface + types
  skill-installation.ts     → SkillInstallation entity
  skill-category.ts         → SkillCategory type + constants
  skill-status.ts           → SkillStatus type
  index.ts                  → barrel export

packages/persistence/src/schema/skills.schema.ts
  → Drizzle schema: skills, skill_capabilities, company_skills
  → Relations definitions

packages/persistence/src/seed/skills.seed.ts
  → 6 predefined skills with capabilities
```

### PR2 — API

```
apps/api/src/features/skills/
  skills.routes.ts          → Elysia routes + validation schemas
  skills.service.ts         → Business logic
  skills.repository.ts      → Drizzle queries
  skills.schemas.ts         → Request/response types
  skills.seed.ts            → Seed runner (import desde persistence)
  index.ts                  → Barrel export

apps/api/src/features/automations/
  automations.routes.ts     → Elysia routes (wrapper sobre automation-studio)
  automations.service.ts    → Delegates to automation-studio + skills
  automations.schemas.ts    → Request/response types
  index.ts                  → Barrel export
```

### PR3 — Skills UI

```
apps/web/src/features/skills/  (new feature folder)
  components/
    SkillsLibraryPage.tsx     → Main page (refactor de route existente)
    SkillCard.tsx             → Card component (extract from SkillsPage)
    SkillDetailView.tsx       → Detail panel for RightInspector
    SkillConfigPanel.tsx      → Config inline panel
    SkillSearchBar.tsx        → Search + category filter
  hooks/
    useSkills.ts              → TanStack Query hooks
  index.ts                    → Barrel export

apps/web/src/routes/drenyra/skills.tsx
  → Updated to use new components + API

apps/web/src/features/agent-swarm/hooks/useSkillStore.ts
  → Refactored: TanStack Query integration
```

### PR4 — Automations UI

```
apps/web/src/features/automations/
  components/
    AutomationsPage.tsx       → Main page (refactor)
    AutomationCard.tsx        → Card component
    AutomationCreateWizard.tsx → Multi-step creation dialog
    AutomationTriggerConfig.tsx → Trigger configuration step
    AutomationActionList.tsx  → Skills selection step
    AutomationLogTimeline.tsx → Execution history timeline
    AutomationToggle.tsx      → On/off toggle
  hooks/
    useAutomations.ts         → TanStack Query hooks
  index.ts                    → Barrel export

apps/web/src/routes/automations.tsx
  → Updated to render AutomationsPage directly

apps/web/src/routes/configuracion/automations.tsx
  → Redirect to /automations or keep as legacy
```

---

## 6. Integration Points

### 6.1 Agentic Shell

- **Sidebar**: ya tiene `/skills` y `/automations` en `AGENTIC_NAV_ITEMS`. No requiere cambios.
- **CommandPalette**: agregar shortcuts si no existen: "/skills", "/automations".
- **RightInspector**: mostrar `SkillDetailView` cuando se selecciona una skill en la Skills Library.

### 6.2 automation-studio

El wrapper de Automations API debe:

1. Crear un workflow en automation-studio con category = "skill-automation"
2. Agregar steps por cada skillId (action_type = "execute_skill", config.skillId)
3. Setear trigger en el workflow según triggerType del automation
4. Para toggle: activateWorkflow / pauseWorkflow
5. Para logs: listExecutions del workflow

### 6.3 Persistence Migration Strategy

1. `bun run db:generate` → genera SQL migration
2. `bun run db:migrate` → aplica tablas nuevas
3. `bun run seed:skills` → carga skills predefinidas

---

## 7. Seed Data

### 6 Skills Predefinidas

| Skill | Categoría | Capacidades |
|-------|-----------|-------------|
| SIRE | fiscal | Validar RUC, Consultar comprobantes, Comparar SIRE, Preparar declaraciones |
| Tax Risk | fiscal | Detracciones, Percepciones, Retenciones, Crédito fiscal, Gastos no deducibles |
| Close | operations | Devengos, Provisiones, Diferencia de cambio, Depreciación, Cierre mensual |
| Audit | audit | Evidencia, Trazabilidad, Cambios, Reporte para auditoría |
| Bank Reconciliation | finance | BCP, BBVA, Interbank, Scotiabank, Yape/Plin empresarial |
| Payroll | operations | Planillas, CTS, Gratificaciones, Essalud, ONP, AFP |

---

## 8. Migration Plan

### Drizzle Migration

```bash
# Crear archivo de schema
packages/persistence/src/schema/skills.schema.ts

# Generar migration
cd packages/persistence && bun run db:generate

# Aplicar
cd packages/persistence && bun run db:migrate

# Seeds
cd apps/api && bun run src/features/skills/skills.seed.ts
# O seed via migration runner
```

### Frontend Migration

```
Fase 1: SkillsPage funciona con data hardcoded (state actual)
Fase 2: PR2 habilita API → PR3 conecta frontend a API
Fase 3: Store persistido migra a API como source of truth
Fase 4: Cleanup de datos stale en localStorage (opcional)
```

---

## 9. Verification

```bash
# Backend
bun run typecheck          # TypeScript check
bun run test -- --filter 'skills'    # Skills domain tests
bun run test -- --filter 'automations'  # Automations tests

# Frontend
cd apps/web && bun run typecheck
bun run lint

# API smoke test
curl -s http://localhost:3000/api/skills | jq '.data | length'
curl -s http://localhost:3000/api/skills/:id
```

---

## 10. Non-goals (reiterados)

- No se construye marketplace público de skills
- No se implementan skills de terceros
- No se modifica el engine de automation-studio
- No se implementa scheduling engine (reutilizar Bull/Bun queues existentes)
- No se toca el sistema de evidencia (Plan 6)
