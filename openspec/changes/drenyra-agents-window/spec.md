# Spec: Agents Window — Centro de Comando Multi-Agente

**Última actualización:** 2026-07-02 | **Plan:** 3 de 6 (nueva) | **Bloqueado por:** Plan 1

---

## 1. Resumen

Centro de comando donde el contador ve **todos los agentes en paralelo**: supervisa progreso, revisa cambios y toma decisiones. Cada agente es una sesión viva con estado, evidencia, riesgo y acciones.

---

## 2. Requerimientos

| ID    | Componente                                                                    | Escenario                                                            |
| ----- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| RF-01 | `GET /sessions` filtra por compañía, período, status, agente. Polling 5s      | GIVEN compañía activa WHEN GET /sessions THEN `AgentSessionStatus[]` |
| RF-02 | `GET /:id` detalle con pasos, progreso, cambios, evidencia, costo             | GIVEN sesión activa WHEN GET /:id THEN objeto con steps[]            |
| RF-03 | `POST /:id/pause                                                              | resume                                                               | cancel` controlan ciclo de vida | GIVEN running WHEN pause THEN status→paused |
| RF-04 | `GET /:id/timeline` historial cronológico                                     | GIVEN sesión con pasos WHEN GET /timeline THEN AgentStep[] ordenado  |
| RF-05 | AgentCard: nombre, cliente, período, estado, progreso, cambios, costo, riesgo | GIVEN sesión activa WHEN render THEN card con barra, badge, métricas |
| RF-06 | Modo grilla ↔ modo pestañas intercambiable                                    | GIVEN grilla WHEN click tab THEN AgentTabPanel                       |
| RF-07 | AgentFilterBar filtra por cliente, período, estado, riesgo, agente            | GIVEN 10 sesiones WHEN filtrar riesgo=alto THEN solo 2               |
| RF-08 | `requiresAction`→badge + Review diff, Approve, Reject                         | GIVEN awaiting_approval WHEN render THEN badge naranja + action menu |

---

## 3. Contratos

```typescript
interface AgentSessionStatus {
  id: string
  agentId: string
  agentName: string
  threadId?: string
  clientName: string
  period: string
  status: 'running' | 'paused' | 'completed' | 'failed' | 'awaiting_approval'
  phase: string
  progress: number
  changesProposed: number
  evidenceCollected: number
  elapsedMs: number
  tokensUsed: number
  risk: 'low' | 'medium' | 'high' | 'critical'
  requiresAction: boolean
  lastActivity: string
  steps: AgentStep[]
}
interface AgentStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
}
```

```typescript
// Zustand store
interface AgentsWindowStore {
  sessions: AgentSessionStatus[]
  selectedSessionId: string | null
  gridMode: 'grid' | 'tabs'
  pollingActive: boolean
  filters: {
    client?: string
    period?: string
    status?: string
    risk?: string
    agentType?: string
  }
  selectSession(id: string | null): void
  updateSession(id: string, patch: Partial<AgentSessionStatus>): void
  setGridMode(m: 'grid' | 'tabs'): void
  setFilters(f: Partial<Filters>): void
  setPollingActive(a: boolean): void
}
```

---

## 4. Estados UI

| Componente     | Loading      | Vacío                  | Datos                    | Error               |
| -------------- | ------------ | ---------------------- | ------------------------ | ------------------- |
| AgentGrid      | Skeleton 2×2 | "No hay agentes" + CTA | Grid 2→1 col             | Banner + retry      |
| AgentCard      | Skeleton     | —                      | Barra + badge + acciones | Badge error + retry |
| AgentFilterBar | Disabled     | "Sin resultados"       | Chips activos            | Reset               |
| AgentTabPanel  | Skeleton     | "Selecciona agente"    | Timeline + pasos         | Panel error         |

---

## 5. Validación y Casos Borde

| Borde                                        | Comportamiento                          |
| -------------------------------------------- | --------------------------------------- |
| progress >100 o <0                           | Truncar a [0,100]                       |
| status transition inválida (completed→pause) | Rechazar 409                            |
| 20+ sesiones                                 | Grid scrollable, virtualizar si >30     |
| Polling timeout                              | Backoff 5s→10s→20s, max 3 retries       |
| Sin WebSocket                                | Fallback automático a polling 5s        |
| riesgo=critical + requiresAction             | Borde rojo + animación alerta           |
| tokenCost > 1M                               | Formato "1.2M"                          |
| Pantalla < 640px                             | Grid 1 col, card compacta sin timeline  |
| Sesión se completa en vivo                   | Transición suave + badge verde          |
| Filtros → 0 resultados                       | "Sin coincidencias" + "Limpiar filtros" |

---

## 6. Archivos

```
apps/web/src/features/agents/ (AgentsWindowPage, AgentCard, AgentTabPanel, AgentTimeline, AgentProgressBar, AgentRiskBadge, AgentCostDisplay, AgentActionMenu, AgentSessionControls, AgentFilterBar, agents.store.ts, agents.api.ts, agents.types.ts) + routes/agents/index.tsx
```

---

## 7. Entrega

**Estrategia:** auto-chain — 3 PRs

| PR  | Scope                                                              | Archivos | Líneas |
| --- | ------------------------------------------------------------------ | -------- | ------ |
| PR1 | API endpoints + tipos backend                                      | ~6       | ~280   |
| PR2 | AgentsWindowPage + AgentCard + AgentFilterBar + store + API client | ~8       | ~350   |
| PR3 | AgentTabPanel + Timeline + RiskBadge + CostDisplay + controles     | ~6       | ~250   |

**Bridge tiempo real:** fallback a polling si no hay WebSocket/SSE.
