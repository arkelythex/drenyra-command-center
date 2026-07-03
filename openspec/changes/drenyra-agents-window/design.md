# Design: Agents Window — Centro de Comando Multi-Agente

**Última actualización:** 2026-07-02
**Plan SDD:** 3 de 6
**Estrategia de entrega:** auto-chain — 3 PRs

---

## 1. Enfoque Técnico

Bridge de polling sobre el `SessionManager` existente en `drenyra-orchestrator` + feature vertical en frontend siguiendo el patrón Threads. Sin WebSocket/SSE inicial — fallback polling con backoff.

---

## 2. Decisiones de Arquitectura

| Opción                                    | Tradeoff                                                                      | Decisión                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Sesiones en DB vs. in-memory bridge       | DB da persistencia; in-memory evita migración + acoplamiento al schema actual | In-memory bridge sobre SessionManager. Persistencia futura cuando el orchestrator la requiera |
| WebSocket vs. polling                     | WS da tiempo real; polling es más simple y consistente con infra actual       | Polling 5s con backoff. WS como upgrade documentado (non-goal)                                |
| Feature folder nuevo vs. inline en routes | Folder permite escalar a 10+ componentes                                      | Feature folder `apps/web/src/features/agents/` idéntico a `features/threads/`                 |
| Grid puro vs. grid+tabs                   | Tabs añaden complejidad; grid solo pierde el modo detalle en paralelo         | Ambos modos intercambiables con store `gridMode`                                              |

---

## 3. Flujo de Datos

```
Browser                          API Server                    drenyra-orchestrator
──────                          ──────────                    ────────────────────

AgentCard (grid)
  │ polling GET /api/agents/sessions ──→ agents.routes.ts ──→ SessionManager.getActiveSessions()
  │                                     │                    └── transform → AgentSessionStatus[]
  │ ←── AgentSessionStatus[] ──────────┘
  │
AgentTabPanel (detail)
  │ GET /api/agents/sessions/:id ──→ agents.routes.ts ──→ SessionManager.get(id)
  │ ←── AgentSessionStatus ────────┘

AgentSessionControls
  │ POST /api/agents/sessions/:id/pause  ──→ agents.routes.ts ──→ SessionManager.update(id, {status})
  │ POST /api/agents/sessions/:id/resume ──→ agents.routes.ts ──→ SessionManager.update(id, {status})
  │ POST /api/agents/sessions/:id/cancel ──→ agents.routes.ts ──→ SessionManager.update(id, {status})
  │ ←── { success: true } ───────────────┘
```

---

## 4. Arquitectura Backend

### 4.1 Árbol de archivos (API)

```
apps/api/src/features/agents/
├── index.ts                  → re-exporta agentsRoutes
├── agents.routes.ts          → Elysia routes con prefix /api/agents
├── agents.service.ts         → Bridge hacia SessionManager + transform
├── agents.types.ts           → AgentSessionStatus, AgentStep, DTOs
└── agents.schemas.ts         → Elysia validation schemas (query, params, body)
```

### 4.2 Registro en app-core.ts

```typescript
// apps/api/src/app-core.ts
import { agentsRoutes } from "./features/agents";
// ...
.use(agentsRoutes)
```

`agentsRoutes` usa `prefix: "/api/agents"`, consistente con threads.

### 4.3 Contracto Eden Treaty

```typescript
// apps/api/src/features/agents/agents.types.ts
export interface AgentSessionStatus {
  id: string
  agentId: string
  agentName: string
  threadId?: string
  clientName: string
  period: string
  status: 'running' | 'paused' | 'completed' | 'failed' | 'awaiting_approval'
  phase: string
  progress: number // 0-100
  changesProposed: number
  evidenceCollected: number
  elapsedMs: number
  tokensUsed: number
  risk: 'low' | 'medium' | 'high' | 'critical'
  requiresAction: boolean
  lastActivity: string // ISO
  steps: AgentStep[]
}

export interface AgentStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
}

export interface PaginatedAgentSessions {
  data: AgentSessionStatus[]
  total: number
}
```

### 4.4 Endpoints

| Endpoint                            | Método | Body/Query                                  | Response                 |
| ----------------------------------- | ------ | ------------------------------------------- | ------------------------ |
| `/api/agents/sessions`              | GET    | `?client=&period=&status=&risk=&agentType=` | `PaginatedAgentSessions` |
| `/api/agents/sessions/:id`          | GET    | —                                           | `AgentSessionStatus`     |
| `/api/agents/sessions/:id/timeline` | GET    | —                                           | `AgentStep[]`            |
| `/api/agents/sessions/:id/pause`    | POST   | —                                           | `{ success: true }`      |
| `/api/agents/sessions/:id/resume`   | POST   | —                                           | `{ success: true }`      |
| `/api/agents/sessions/:id/cancel`   | POST   | —                                           | `{ success: true }`      |

---

## 5. Arquitectura Frontend

### 5.1 Árbol de archivos

```
apps/web/src/features/agents/
├── agents.types.ts           → AgentSessionStatus, AgentStep, AgentFilters (espejo backend)
├── agents.api.ts             → listSessions, getSession, getTimeline, pauseSession, resumeSession, cancelSession
├── query-keys.ts             → agentKeys: all, lists, list(filters), details, detail(id)
├── query-options.ts          → agentsListQueryOptions(filters), agentDetailQueryOptions(id)
├── agents.store.ts           → Zustand store (gridMode, selectedSessionId, filters)
├── AgentsWindowPage.tsx      → Page wrapper: FilterBar + (grid | tabs)
├── AgentCard.tsx             → Card individual con barra, badge, métricas, acciones
├── AgentGrid.tsx             → Grid responsive 2/1 columna
├── AgentTabPanel.tsx         → Vista detalle de agente como tab
├── AgentTabBar.tsx           → Barra de tabs con sesiones activas
├── AgentTimeline.tsx         → Timeline de pasos del agente
├── AgentProgressBar.tsx      → Barra de progreso con label de fase
├── AgentRiskBadge.tsx        → Badge color por nivel de riesgo
├── AgentCostDisplay.tsx      → Tiempo + tokens
├── AgentActionMenu.tsx       → Dropdown: review, approve, reject, evidence
├── AgentSessionControls.tsx  → Pausar/reanudar/cancelar
├── AgentFilterBar.tsx        → Filtros combinados (cliente, periodo, estado, riesgo, tipo)
└── AgentSkeleton.tsx         → Esqueletos loading

apps/web/src/routes/agents/
└── index.tsx                 → createFileRoute con lazyRouteComponent → AgentsWindowPage
```

### 5.2 Store (Zustand)

```typescript
// agents.store.ts
interface AgentsWindowStore {
  selectedSessionId: string | null
  gridMode: 'grid' | 'tabs'
  pollingActive: boolean
  filters: AgentFilters
  // actions
  selectSession(id: string | null): void
  setGridMode(m: 'grid' | 'tabs'): void
  setPollingActive(a: boolean): void
  setFilters(f: Partial<AgentFilters>): void
  resetFilters(): void
}

type AgentFilters = {
  client?: string
  period?: string
  status?: string
  risk?: string
  agentType?: string
}
```

### 5.3 Polling strategy

```typescript
// Dentro de AgentsWindowPage — TanStack Query con refetchInterval
const { data } = useQuery({
  ...agentsListQueryOptions(filters),
  refetchInterval: (query) => {
    // 5s si hay sesiones activas, parar si todas completadas
    const hasActive = query.state.data?.data?.some(
      (s) =>
        s.status === 'running' ||
        s.status === 'paused' ||
        s.status === 'awaiting_approval'
    )
    return hasActive ? 5000 : false
  },
  refetchIntervalInBackground: false,
})
```

Backoff en errores de red (manejado por TanStack Query `retry`):

- default retry: 3 intentos
- delay: `(attempt) => Math.min(1000 * 2 ** attempt, 10000)` (1s → 2s → 4s → 10s)

---

## 6. Componentes — Diseño Detallado

### 6.1 AgentCard

| Prop         | Tipo                   |
| ------------ | ---------------------- |
| `session`    | `AgentSessionStatus`   |
| `onSelect`   | `(id: string) => void` |
| `isSelected` | `boolean`              |

Estados:

- **Loading**: `AgentSkeleton` — placeholder animado con forma de card
- **Running**: barra animada, badge gris-azul, tiempo ticking
- **Awaiting approval**: borde naranja, badge "Requiere acción", menú desplegado
- **Completed**: badge verde, barra llena, métricas finales
- **Failed**: badge rojo, borde danger, mensaje de error
- **Paused**: badge gris, barra congelada
- **Critical risk**: borde rojo + animación de alerta (pulse suave)

### 6.2 AgentsWindowPage

Composición:

```tsx
<AgenticLayout>
  <AgentFilterBar
    filters={filters}
    onChange={setFilters}
    onReset={resetFilters}
  />
  {gridMode === 'grid' ? (
    <AgentGrid
      sessions={filteredSessions}
      onSelectSession={selectSession}
      selectedSessionId={selectedSessionId}
    />
  ) : (
    <>
      <AgentTabBar
        sessions={sessions.data}
        activeId={selectedSessionId}
        onSelect={selectSession}
      />
      {selectedSession && (
        <AgentTabPanel session={selectedSession} onAction={handleAction} />
      )}
    </>
  )}
</AgenticLayout>
```

Estados:

- **Loading**: 4× `AgentSkeleton` en grid 2×2
- **Empty**: ilustración + "No hay agentes ejecutándose ahora" + CTA a "Nuevo thread"
- **Data**: grid 2 columnas (≥1024px), 1 columna (<1024px)
- **Error**: banner con mensaje + botón "Reintentar"
- **Filtered empty**: "Sin coincidencias" + "Limpiar filtros"

### 6.3 AgentFilterBar

Filtros combinados: cliente (text), período (select meses), estado (select), riesgo (select), tipo agente (select).

Estados:

- **Loading**: controles disabled con opacidad
- **Active**: uno o más filtros activos → chips visibles, botón "Limpiar"
- **Disabled**: sin sesiones disponibles (no mostrar filtros no tiene sentido)

### 6.4 AgentTabPanel

Vista detallada del agente seleccionado en modo tabs.

Contenido:

- Timeline de pasos
- Cambios propuestos (resumen + link a diff futuro)
- Evidencia recolectada
- Costos (tiempo + tokens)
- Controles (pausar/reanudar/cancelar)

Estados:

- **No selection**: mensaje "Selecciona un agente para ver detalles"
- **Loading**: skeleton de panel
- **Data**: layout vertical con secciones
- **Error**: panel con mensaje de error + retry

### 6.5 AgentTimeline

Lista cronológica de `AgentStep[]`.

- Cada paso: icono de estado (check/spinner/x/circle) + label + duración
- Auto-scroll al paso running
- Paso completado: línea conectora verde

### 6.6 AgentRiskBadge

| Riesgo     | Color    | Fondo                  |
| ---------- | -------- | ---------------------- |
| `low`      | Verde    | `bg-success/10`        |
| `medium`   | Amarillo | `bg-warning/10`        |
| `high`     | Naranja  | `bg-orange/10`         |
| `critical` | Rojo     | `bg-danger/10` + pulso |

### 6.7 AgentProgressBar

Barra horizontal con:

- Fondo `surface-3`
- Fill: primary (running), warning (awaiting approval), success (completed), danger (failed)
- Label de fase actual dentro o debajo
- Ancho transicionado con `transition-all duration-500`

### 6.8 AgentCostDisplay

Tiempo formateado: `4m 32s` (si < 1h) | `1h 12m` (si ≥ 1h)
Tokens formateados: `12,482` | `1.2M` (si > 1M)

### 6.9 AgentActionMenu

Dropdown contextual visible cuando `requiresAction || status === 'awaiting_approval'`.

Acciones:

- **Review diff** → abre inspector con `type: 'diff'` (placeholder hasta Plan 4)
- **Open evidence** → abre inspector con `type: 'evidence'` (placeholder hasta Plan 6)
- **Approve** → POST a endpoint de aprobación (futuro)
- **Reject** → POST a endpoint con motivo (futuro)
- **Pedir sustento** → abre input de texto (futuro)

### 6.10 AgentSessionControls

Botones contextuales según estado:

| Estado actual       | Botones                        |
| ------------------- | ------------------------------ |
| `running`           | Pause, Cancel                  |
| `paused`            | Resume, Cancel                 |
| `awaiting_approval` | — (no controles, solo actions) |
| `completed`         | Reiniciar (futuro)             |
| `failed`            | Reiniciar (futuro)             |

---

## 7. Puntos de Integración

### 7.1 AgenticLayout

El route `/agents/` ya usa `AgenticLayout` porque `__root.tsx` aplica `AgenticLayout` a las rutas no-públicas (dentro de auth). El contenido de AgentsWindowPage se renderiza dentro del `<main>` del layout.

### 7.2 Sidebar — Nav Item

Ya existe en `AgenticSidebar.data.ts`:

```typescript
{
  id: "agents",
  section: "workspace",
  label: "Agents",
  icon: Cpu,
  to: "/agents",
  badge: 0,           // ← actualizar con count de sesiones que requieren acción
  badgeVariant: "info",
}
```

El badge se actualizará vía un hook que consuma `agentKeys.list()` y cuente `requiresAction`.

### 7.3 RightInspector (Plan 3+)

Ya tiene placeholder para `panel.type === 'agent'`. Cuando el usuario hace clic en "Review diff" o "Open evidence" desde `AgentActionMenu`, se llama a `openInspector({ type: 'diff' | 'evidence', id, title })`.

### 7.4 Threads (Plan 2)

`AgentSessionStatus.threadId` opcional permite navegar al thread asociado: `<Link to="/threads/$threadId" params={{ threadId }}>`.

---

## 8. Estrategia Mobile / Responsive

| Breakpoint  | Grid         | Card                                        | FilterBar                    | TabPanel                                |
| ----------- | ------------ | ------------------------------------------- | ---------------------------- | --------------------------------------- |
| < 640px     | 1 columna    | Compacta (sin timeline, métricas resumidas) | Selects full-width, apilados | Pantalla completa, sin inspector        |
| 640-1023px  | 1 columna    | Normal con timeline colapsable              | 2 columnas                   | Ancho completo, inspector no disponible |
| 1024-1279px | 2 columnas   | Completa                                    | Horizontal compacto          | Con espacio para inspector si aplica    |
| ≥ 1280px    | 2-3 columnas | Completa                                    | Horizontal                   | Inspector lateral disponible            |

---

## 9. Manejo de Errores y Casos Borde

| Borde                                 | Comportamiento                                         |
| ------------------------------------- | ------------------------------------------------------ |
| `progress` ± outlier                  | Truncar a [0, 100]                                     |
| `tokenCost` > 1M                      | Formato "1.2M"                                         |
| Polling timeout 3 intentos            | `retry` exhausto → error banner + "Reintentar"         |
| 20+ sesiones                          | Grid scrollable. Virtualización > 30 (post-MVP)        |
| Sin datos                             | Empty state con CTA                                    |
| Transición inválida (completed→pause) | Mostrar toast error (409 del server)                   |
| Sesión expira (TTL)                   | Remover del listado en próximo poll. Card se desvanece |
| Sesión se completa en vivo            | Transición suave de barra + badge verde                |
| Filtros → 0 resultados                | "Sin coincidencias" + botón "Limpiar filtros"          |
| Network offline                       | Usar TanStack Query `networkMode: 'offlineFirst'`      |
| `risk: critical` + `requiresAction`   | Borde rojo + animación pulse suave en AgentCard        |

---

## 10. Estrategia de Pruebas

| Capa                         | Qué probar                                                                                                   | Cómo                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **Unit** (componentes puros) | AgentCard renders cada estado, AgentRiskBadge colores, AgentProgressBar porcentaje, AgentCostDisplay formato | Vitest + testing-library. Mock de datos estáticos |
| **Unit** (store)             | selectSession, setGridMode, setFilters, resetFilters                                                         | Vitest directo sobre zustand store                |
| **Unit** (api client)        | listSessions construye query correcta, unwrap maneja error                                                   | Mock de treaty client                             |
| **Integration**              | AgentsWindowPage carga, poll, error, empty                                                                   | Vitest + MSW para mock API                        |
| **Integration**              | AgentFilterBar filtra correctamente la lista                                                                 | Vitest con datos prefabricados                    |
| **E2E** (post-MVP)           | Flujo completo: abrir agents → ver grid → cambiar a tabs → pausar agente                                     | Playwright                                        |

---

## 11. Manifiesto de Archivos

### Crear (API — PR1)

| Archivo                                          | Propósito                         |
| ------------------------------------------------ | --------------------------------- |
| `apps/api/src/features/agents/index.ts`          | Barrel export                     |
| `apps/api/src/features/agents/agents.routes.ts`  | Routes Elysia                     |
| `apps/api/src/features/agents/agents.service.ts` | Bridge SessionManager + transform |
| `apps/api/src/features/agents/agents.types.ts`   | DTOs                              |
| `apps/api/src/features/agents/agents.schemas.ts` | Validation schemas                |

### Modificar (API — PR1)

| Archivo                    | Cambio                                               |
| -------------------------- | ---------------------------------------------------- |
| `apps/api/src/app-core.ts` | Añadir `.use(agentsRoutes)`                          |
| `apps/api/src/contract.ts` | No requiere cambios (exporta `App` de `app-core.ts`) |

### Crear (Frontend — PR2 + PR3)

| Archivo                                                 | Propósito                       |
| ------------------------------------------------------- | ------------------------------- |
| `apps/web/src/features/agents/agents.types.ts`          | Tipos frontend (mirror backend) |
| `apps/web/src/features/agents/agents.api.ts`            | Eden treaty client              |
| `apps/web/src/features/agents/query-keys.ts`            | TanStack Query keys             |
| `apps/web/src/features/agents/query-options.ts`         | Query options con polling       |
| `apps/web/src/features/agents/agents.store.ts`          | Zustand store                   |
| `apps/web/src/features/agents/AgentsWindowPage.tsx`     | Page wrapper                    |
| `apps/web/src/features/agents/AgentCard.tsx`            | Card de sesión                  |
| `apps/web/src/features/agents/AgentGrid.tsx`            | Grid layout                     |
| `apps/web/src/features/agents/AgentTabPanel.tsx`        | Tab detail view                 |
| `apps/web/src/features/agents/AgentTabBar.tsx`          | Tab bar                         |
| `apps/web/src/features/agents/AgentTimeline.tsx`        | Timeline de pasos               |
| `apps/web/src/features/agents/AgentProgressBar.tsx`     | Barra de progreso               |
| `apps/web/src/features/agents/AgentRiskBadge.tsx`       | Badge de riesgo                 |
| `apps/web/src/features/agents/AgentCostDisplay.tsx`     | Costo tiempo+tokens             |
| `apps/web/src/features/agents/AgentActionMenu.tsx`      | Menú de acciones                |
| `apps/web/src/features/agents/AgentSessionControls.tsx` | Controles vida                  |
| `apps/web/src/features/agents/AgentFilterBar.tsx`       | Filtros                         |
| `apps/web/src/features/agents/AgentSkeleton.tsx`        | Esqueletos                      |
| `apps/web/src/routes/agents/index.tsx`                  | TanStack Router route           |

### Modificar (Frontend — PR2)

| Archivo                                                                       | Cambio                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/web/src/components/agentic-shell/RightInspector/RightInspector.tsx`     | Implementar `type: 'agent'` panel (lazy load InspectorAgentPanel) |
| `apps/web/src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts` | Badge dinámico para "Agents" nav item                             |

---

## 12. Open Questions

- [ ] SessionManager expone singleton o se inyecta? Asumimos `agentsService` crea su propia instancia compartida para este cambio.
- [ ] El field `clientName` en `AgentSessionStatus` — ¿el SessionManager actual tiene acceso al nombre del cliente? Puede requerir lookup a DB. Si no, usamos `companyId` como fallback.
- [ ] ¿Los agentes reales (SIRE, Reconciliation, etc.) reportan su progreso al SessionManager? Asumimos que sí para este diseño; si no, los valores serán estáticos hasta que el orchestrator los integre.
