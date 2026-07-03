# SDD Proposal: Drenyra Agents Window — Multi-Agent Parallel Execution

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** 3 de 6
**Bloqueado por:** Plan 1 (Agentic Shell) — necesita layout + sidebar + inspector
**Paralelo:** Plan 2 (Threads) — los agents window pueden mostrar threads como contexto

---

## Executive Summary

Crear la **Accounting Agents Window**, inspirada en la Agents Window de Cursor 3. Esta es la pantalla central de Drenyra donde el contador ve **todos los agentes trabajando en paralelo**, supervisa su progreso, revisa cambios propuestos, y toma decisiones. Cada agente es una sesión viva con estado, evidencia, cambios propuestos, riesgo, y acciones requeridas.

No es un dashboard de KPIs. Es un **command center de agentes**.

---

## Problem

Actualmente los agentes en Drenyra operan de forma invisible. El usuario inicia un proceso y espera un resultado, pero no hay visibilidad de:

- Qué está haciendo cada agente AHORA
- Qué cambios propone
- Qué evidencia encontró
- Qué necesita aprobación humana
- Cuánto progreso lleva
- Cuánto costó (tokens/tiempo)

---

## Solution

### Pantalla: Agents Window

Layout de grilla/pestañas con sesiones de agente en paralelo:

```txt
Agents Window ── Andrés Capital SAC · Jun 2026

┌─────────────────────────┬─────────────────────────┐
│ SIRE Agent              │ Reconciliation Agent     │
│ Andes SAC · Jun 2026    │ Nova SAC · BCP           │
│ ◉ Validando 842 CPE     │ ◎ 152 matches encontrados│
│ ████████░░ 80%          │ ██████░░░░ 60%           │
│ [Review diff]           │ [Open evidence]          │
│ ├ Tiempo: 4m 32s        │ ├ Tiempo: 2m 10s        │
│ ├ Tokens: 12,482        │ ├ Tokens: 8,231         │
│ └ Riesgo: Bajo          │ └ Riesgo: Medio         │
├─────────────────────────┼─────────────────────────┤
│ Tax Risk Agent           │ Close Agent             │
│ Luna EIRL · Jun 2026    │ Pacifico Retail SAC      │
│ ⚠ 5 riesgos detectados  │ ◉ 81% cierre mensual    │
│ ██████░░░░ 55%           │ ██████████░ 95%         │
│ [Inspect]               │ [Continue]              │
│ ├ Tiempo: 6m 12s        │ ├ Tiempo: 1m 05s        │
│ ├ Auditoría: completa   │ ├ Propuesta: 18 asientos │
│ └ Riesgo: Alto          │ └ Riesgo: Bajo          │
└─────────────────────────┴─────────────────────────┘
```

Cada **AgentCard** muestra:

| Campo              | Descripción                                                  |
| ------------------ | ------------------------------------------------------------ |
| Nombre             | SIRE Agent, Reconciliation Agent, etc.                       |
| Contexto           | Cliente + Periodo                                            |
| Estado             | Icono + texto: validando, analizando, revisando, completado  |
| Progreso           | Barra de progreso + porcentaje                               |
| Cambios propuestos | Resumen: "+18 CPE, -3 observados"                            |
| Tiempo             | Tiempo de ejecución                                          |
| Costo              | Tokens usados                                                |
| Riesgo             | Badge de riesgo fiscal                                       |
| Acciones           | [Review diff] [Open evidence] [Inspect] [Continue] [Approve] |

### Agentes como Tabs (Cursor 3 style)

Además de la grilla, los agentes se pueden abrir como pestañas individuales:

```txt
┌────[ SIRE: Andes SAC ]────────────────[ Recon: Nova SAC ]───[ Close: Pacifico ]─┐
│                                                                                   │
│   [vista detallada del agente seleccionado]                                       │
│                                                                                   │
│   Timeline de acciones del agente                                                 │
│   Cambios propuestos con diff                                                     │
│   Evidencia recolectada                                                           │
│   Próxima decisión humana                                                         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Componentes nuevos

1. **AgentsWindowPage** — Página principal con grilla de agent cards.
2. **AgentCard** — Card de sesión de agente vivo.
3. **AgentTabPanel** — Vista detallada por agente en formato tab.
4. **AgentTimeline** — Timeline de acciones del agente (qué hizo, cuándo, con qué evidencia).
5. **AgentProgressBar** — Barra de progreso con indicador de fase actual.
6. **AgentRiskBadge** — Badge de nivel de riesgo fiscal.
7. **AgentCostDisplay** — Costo en tokens y tiempo de ejecución.
8. **AgentActionMenu** — Menú de acciones: Review diff, Open evidence, Approve, Reject, Pedir sustento.
9. **AgentSessionControls** — Controles: pausar, reanudar, cancelar, reiniciar agente.
10. **AgentFilterBar** — Filtros: por cliente, periodo, estado, riesgo, agente.

### API endpoints nuevos

| Endpoint                            | Método | Propósito                          |
| ----------------------------------- | ------ | ---------------------------------- |
| `/api/agents/sessions`              | GET    | Listar sesiones activas de agentes |
| `/api/agents/sessions/:id`          | GET    | Detalle de sesión de agente        |
| `/api/agents/sessions/:id/pause`    | POST   | Pausar agente                      |
| `/api/agents/sessions/:id/resume`   | POST   | Reanudar agente                    |
| `/api/agents/sessions/:id/cancel`   | POST   | Cancelar agente                    |
| `/api/agents/sessions/:id/timeline` | GET    | Timeline de acciones               |
| `/api/agents/register`              | POST   | Registrar nuevo agente disponible  |

### Datos requeridos

Cada agente necesita reportar en tiempo real (WebSocket / SSE):

```typescript
interface AgentSessionStatus {
  agentId: string
  agentName: string
  clientName: string
  period: string
  status: 'running' | 'paused' | 'completed' | 'failed' | 'awaiting-approval'
  phase: string // "validando CPE", "conciliando movimientos"
  progress: number // 0-100
  changesProposed: number
  evidenceCollected: number
  elapsedMs: number
  tokensUsed: number
  risk: 'low' | 'medium' | 'high' | 'critical'
  requiresAction: boolean
  lastActivity: Date
}
```

---

## Architecture

```tsx
<AgenticLayout>
  <AgenticSidebar />
  <main>
    <AgentsWindowPage>
      <AgentFilterBar />
      <div className="agent-grid">
        <AgentCard /> <AgentCard /> <AgentCard />
      </div>
      {/* or tab mode */}
      <AgentTabBar>
        <AgentTabPanel agent={selected} />
      </AgentTabBar>
    </AgentsWindowPage>
  </main>
  <RightInspector /> {/* Muestra detalle del agente seleccionado */}
  <AgenticCommandBar />
</AgenticLayout>
```

**Estado:** Los agent sessions se manejan via Zustand store con WebSocket suscripción.

```typescript
interface AgentsWindowStore {
  sessions: AgentSessionStatus[]
  selectedSessionId: string | null
  gridMode: 'grid' | 'tabs'
  filters: AgentFilters
  // actions
  selectSession: (id: string) => void
  updateSession: (id: string, status: Partial<AgentSessionStatus>) => void
  setGridMode: (mode: 'grid' | 'tabs') => void
}
```

---

## Dependencies

- **Bloqueado por**: Plan 1 (layout + routing + sidebar + inspector)
- **Paralelo**: Plan 2 (puede compartir la ruta `/agents` con referencia a threads)
- **Dependencia técnica necesaria**: El agent orchestration backend integrado con WebSocket/SSE (packages/drenyra-orchestrator). Si no existe, crear bridge temporal con polling.

---

## Delivery

**Estrategia:** auto-chain — 3 PRs

| PR  | Scope                                                         | Archivos | Líneas |
| --- | ------------------------------------------------------------- | -------- | ------ |
| PR1 | Agent session types + store + WebSocket bridge                | 8-10     | ~350   |
| PR2 | AgentsWindowPage + AgentCard + AgentFilterBar + AgentTabPanel | 12-15    | ~400   |
| PR3 | AgentTimeline + AgentRiskBadge + AgentCostDisplay + controles | 6-8      | ~250   |

**Riesgos:**

- WebSocket/SSE para tiempo real puede no estar disponible — tener fallback a polling (5s).
- drenyra-orchestrator necesita exponer sesiones de agente — verificar integración existente.
- La grilla debe funcionar con N agentes; considerar virtualización si > 20 sesiones simultáneas.

---

## Non-goals

- No se implementa la lógica de agentes en sí (ya existe en drenyra-orchestrator)
- No se implementa el diff contable detallado (Plan 4)
- No se implementan skills/automations (Plan 5)
- No se implementa la creación de threads (Plan 2) — aunque los agents window pueden referenciar threads
