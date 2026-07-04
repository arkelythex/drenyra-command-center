# Spec: Skills Library + Automations

**Última actualización:** 2026-07-03
**Estado:** Spec
**Plan SDD:** 5 de 6
**Change:** drenyra-skills-automations
**Delivery:** auto-chain — 4 PRs (~1,500 líneas total)

---

## 1. Executive Summary

Crear dos superficies complementarias en el Agentic Shell:

1. **Skills Library** — catálogo de capacidades contables extensibles (SIRE, Tax Risk, Close, Audit, etc.) con instalación por cliente y configuración granular.
2. **Automations** — rutinas automáticas que ejecutan skills en background (schedule/event/manual) y dejan resultados en la Review Queue.

Ambas superficies conectan la experiencia agentic existente (sidebar, CommandPalette, routing de Plan 1) con datos reales desde la API, reemplazando los stores hardcoded actuales.

---

## 2. What

### 2.1 Skills Library

Una página catalog donde el contador ve todas las skills disponibles, filtra por categoría, instala/desinstala por cliente, y configura comportamiento.

**UX Flow:**

1. El contador navega a `/skills` desde la sidebar agentic.
2. Ve un grid de skills instaladas y disponibles.
3. Busca por nombre/descripción, filtra por categoría (Fiscal, Finanzas, Operaciones, Auditoría).
4. Hace clic en una skill para ver detalle en el RightInspector.
5. Instala: POST `/api/skills/:id/install` → skill aparece como instalada para ese cliente.
6. Configura: botón "Configurar" → panel inline en la card o en el inspector.

### 2.2 Automations

Una página donde el contador ve las rutinas automáticas de su compañía, las activa/pausa, crea nuevas con un wizard, y revisa el historial de ejecuciones.

**UX Flow:**

1. El contador navega a `/automations` desde la sidebar.
2. Ve un dashboard de automations activas, en pausa, y su estado.
3. Crea una nueva con un wizard multi-paso: nombre → trigger (schedule/event/manual) → skills a ejecutar → autonomía.
4. Toggle on/off para activar/pausar.
5. Timeline de ejecuciones pasadas con estado (success/failed/running).

---

## 3. Why

**Problema actual:** Las skills existen como datos hardcoded en un Zustand store (`useSkillStore`). No hay forma de:

- Ver skills desde la API
- Instalarlas por cliente (persistencia)
- Configurarlas
- Asociarlas a automations programadas

Las automations tienen una implementación rica en backend (`automation-studio` API con workflows/steps/executions) pero la UI existente es estática, no conecta con el Agentic Shell, y no expresa el concepto de "skills que se ejecutan".

**Qué cambia:**

- Skills pasan de hardcoded state a API-backed con persistencia por cliente
- Automations se conectan con la API real existente
- Ambas páginas se integran en el Agentic Layout (sidebar, CommandPalette)
- Se reutiliza el máximo de infraestructura existente

---

## 4. Acceptance Criteria

### Skills Library

- [ ] GET `/api/skills` devuelve lista de skills disponibles globalmente
- [ ] GET `/api/skills/:id` devuelve detalle de una skill con capacidades
- [ ] POST `/api/skills/:id/install` instala skill para compañía autenticada
- [ ] POST `/api/skills/:id/uninstall` desinstala skill de compañía
- [ ] PATCH `/api/skills/:id/config` actualiza configuración por cliente
- [ ] GET `/api/skills/installed` devuelve skills instaladas para compañía autenticada
- [ ] SkillsPage renderiza desde API, no desde store hardcoded
- [ ] SkillDetail muestra capacidades, versión, configuración
- [ ] Categorías y búsqueda funcionan client-side sobre datos de API

### Automations

- [ ] GET `/api/automations` devuelve automations de la compañía
- [ ] POST `/api/automations` crea automation (wizard data)
- [ ] PATCH `/api/automations/:id` actualiza automation
- [ ] POST `/api/automations/:id/toggle` activa/pausa
- [ ] GET `/api/automations/:id/logs` devuelve historial de ejecuciones
- [ ] POST `/api/automations/run` ejecuta manualmente
- [ ] AutomationsPage renderiza desde API
- [ ] CreateWizard guía creación multi-paso
- [ ] LogTimeline muestra ejecuciones con estado
- [ ] Toggle on/off funciona sin recargar

---

## 5. Scope

### In Scope

**PR1 — Domain + Persistence (~350 lines)**

- `packages/domain/src/entities/skill/` — Skill entity, SkillId, SkillCapability, SkillInstallation
- `packages/domain/src/entities/automation/` — Automation entity (thin wrapper sobre automation-studio), AutomationId
- `packages/persistence/src/schema/skills.schema.ts` — Drizzle schema: skills, skill_capabilities, company_skills
- Migration para tablas nuevas
- Seeds: 6 skills predefinidas (SIRE, Tax Risk, Close, Audit, Bank Recon, Payroll)

**PR2 — API (~350 lines)**

- `apps/api/src/features/skills/` — Skills API vertical slice
  - `skills.routes.ts` — Elysia routes con companyScopeGuard
  - `skills.service.ts` — Business logic
  - `skills.schemas.ts` — Zod/Elysia validation schemas
  - `skills.repository.ts` — Drizzle queries
- `apps/api/src/features/automations/` — Thin Automations API que wrappea automation-studio
  - `automations.routes.ts` — Simplified endpoints for agentic automations
  - `automations.service.ts` — Delegates to automation-studio internals

**PR3 — Skills UI (~400 lines)**

- Refactor `apps/web/src/routes/drenyra/skills.tsx` — Conectar con API en lugar de store
- Update `useSkillStore` — API-backed calls con TanStack Query
- Add `SkillDetailView` — Panel de detalle en RightInspector o modal
- Add `SkillConfigPanel` — Configuración inline por skill

**PR4 — Automations UI (~400 lines)**

- Refactor `apps/web/src/features/automations/` — Conectar con API existente
- Build `AutomationCreateWizard` — Multi-step creation dialog
- Build `AutomationLogTimeline` — Execution history with status indicators
- Update sidebar/CommandPalette entries

### Out of Scope

- Marketplace público de skills
- Skills de terceros
- Sistema de evidencia (Plan 6)
- Engine de scheduling/queues (se reutiliza automation-studio existente)

---

## 6. Architecture

### Skills Domain Entities

```typescript
// packages/domain/src/entities/skill/skill-id.ts
export type SkillId = string & { readonly __brand: "SkillId" };
export function createSkillId(): SkillId { return crypto.randomUUID() as SkillId; }

// packages/domain/src/entities/skill/skill-capability.ts
export interface SkillCapability {
  id: string;
  name: string;          // "Validar RUC"
  description: string;   // "Consulta estado, condición, domicilio"
  actionType: string;    // "sunat:validate-ruc" — machine-readable
}

// packages/domain/src/entities/skill/skill.ts
export type SkillCategory = "fiscal" | "finance" | "operations" | "audit";
export type SkillStatus = "active" | "deprecated" | "experimental";

export interface SkillProps {
  id: SkillId;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  author: string;
  capabilities: SkillCapability[];
  status: SkillStatus;
  metadata?: Record<string, unknown>;
}

export class Skill {
  // Domain entity with factory method, invariant guards
}

// packages/domain/src/entities/skill/skill-installation.ts
export type InstallationStatus = "installed" | "disabled";

export interface SkillInstallationProps {
  id: string;
  companyId: string;
  skillId: SkillId;
  status: InstallationStatus;
  config: Record<string, unknown>;
  installedAt: Date;
  installedBy: string;
}

export class SkillInstallation {
  // Per-company installation entity
}
```

### API Routes

**Skills API** (nuevo feature en apps/api):

```
GET    /api/skills                    → List all available skills
GET    /api/skills/installed          → List company's installed skills
GET    /api/skills/:id                → Skill detail
POST   /api/skills/:id/install        → Install for company
POST   /api/skills/:id/uninstall      → Uninstall from company
PATCH  /api/skills/:id/config         → Update company skill config
```

**Automations API** (thin wrapper sobre automation-studio existente):

```
GET    /api/automations               → List company automations
POST   /api/automations               → Create automation
PATCH  /api/automations/:id           → Update automation
POST   /api/automations/:id/toggle    → Activate/pause
GET    /api/automations/:id/logs      → Execution history
POST   /api/automations/run           → Manual trigger
```

### UI Architecture

```tsx
// Skills — usa TanStack Query + AgenticLayout
<AgenticLayout>
  <AgenticSidebar />
  <main>
    <SkillsLibraryPage>
      <SkillSearchBar />
      <div className="skills-grid">
        <SkillCard />  {/* installed */}
        <SkillCard />  {/* available */}
      </div>
    </SkillsLibraryPage>
  </main>
  {/* SkillDetailView en RightInspector cuando se selecciona */}
</AgenticLayout>

// Automations
<AgenticLayout>
  <AgenticSidebar />
  <main>
    <AutomationsPage>
      <div className="automations-list">
        <AutomationCard />  {/* active */}
        <AutomationCard />  {/* paused */}
      </div>
      <AutomationCreateWizard />  {/* Dialog/modal */}
    </AutomationsPage>
  </main>
</AgenticLayout>
```

### Data Flow

```
Browser ← TanStack Query → Elysia API ← Drizzle → PostgreSQL
                             ↕
                       Automation Engine
                    (automation-studio internals)
```

---

## 7. Existing Code to Reuse

| Recurso | Ubicación | Cómo se reusa |
|---------|-----------|----------------|
| `useSkillStore` | `apps/web/src/features/agent-swarm/hooks/useSkillStore.ts` | Refactor: agregar fetch desde API con TanStack Query, mantener persist |
| Skill types | `apps/web/src/features/agent-swarm/types/skills.types.ts` | Migrar a packages/domain, re-exportar |
| `SkillsPage` | `apps/web/src/routes/drenyra/skills.tsx` | Refactor: conectar a API en lugar de store hardcoded |
| `AutomationsView` | `apps/web/src/features/automations/components/AutomationsView.tsx` | Refactor: cargar datos desde API |
| `automation-studio` API | `apps/api/src/features/automation-studio/` | Crear wrapper thin en lugar de duplicar |
| `companyScopeGuard` | `apps/api/src/shared/plugins` | Reutilizar para scoping |
| Agentic sidebar | `apps/web/src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts` | Ya tiene rutas `/skills` y `/automations` |
| `ok`/`fail` helpers | `apps/api/src/features/shared/api-response` | Reutilizar |

---

## 8. Risks

1. **Dependencia de automation-studio**: el wrapper thin debe sincronizarse con cambios en automation-studio. No romper contratos existentes.
2. **Skills engine**: la ejecución de skills asume que drenyra-orchestrator puede resolver capacidades por nombre. Verificar existencia del contrato.
3. **Migración de store persistido**: `useSkillStore` usa `persist` de Zustand con localStorage key `arkelythex-skills-v1`. Usuarios existentes pueden tener datos stale. Estrategia: mantener localStorage como cache client-side, migrar a API como source of truth, ignorar datos stale en init.
4. **Rendimiento de categorías**: skills fijas (~10-20), no hay riesgo de paginación. Todo client-side después del fetch inicial.
