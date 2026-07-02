# SDD Proposal: Drenyra Thread System — New Accounting Thread

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** 2 de 6
**Bloqueado por:** Plan 1 (Agentic Shell) — necesita AgenticLayout, AgenticCommandBar, routing tree

---

## Executive Summary

Crear el sistema de **threads contables** — la unidad fundamental de trabajo en Drenyra. Inspirado en los threads/proyectos de Codex App, cada thread representa una sesión de trabajo delegada a agentes: "Cerrar mes Jun 2026 para Andrés SAC", "Validar SIRE compras", "Conciliar BCP". Los threads son el entry point principal de la app y el centro de la experiencia agentic-first.

---

## Problem

Actualmente Drenyra no tiene un concepto de "sesión de trabajo". El usuario abre módulos sueltos (Invoices, Banking, Reports) sin continuidad. No hay forma de decirle a Drenyra "quiero cerrar el mes de Andrés SAC" y tener un hilo único donde el agente trabaja, el contador revisa, aprueba, y se archiva todo como una unidad coherente.

---

## Solution

### Concepto: Thread contable

Un thread es una **unidad de trabajo aislada** que contiene:

```txt
Thread: Cierre Jun 2026
Cliente: Andrés Capital SAC
Periodo: Junio 2026
Estado: En progreso (3/5 tareas)
Agentes asignados: SIRE Agent, Reconciliation Agent, Close Agent
Tareas:
  ✅ Validar SIRE compras (SIRE Agent)
  ✅ Conciliar BCP (Reconciliation Agent)
  🔄 Preparar declaración IGV (Close Agent)
  ⏳ Revisar detracciones (Tax Risk Agent)
  ⏳ Cerrar mes (Close Agent)
Evidencia: 12 documentos, 4 CDR, 2 XML
Última actividad: hace 3 min — Close Agent propuso asientos
```

### Pantalla: New Thread ("Let's Close")

Landing page de Drenyra. Similar a Codex App:

```txt
Drenyra

Let's close
Andes Capital SAC · Jun 2026

[ Preparar declaración IGV ]
[ Conciliar bancos ]
[ Revisar compras SIRE ]
[ Cerrar mes ]
[ Buscar riesgos fiscales ]
[ Pedir documentos faltantes ]

──────────────────────────────────
Ask Drenyra…  @facturas  @banco  /sire  /close  /audit  /sunat

[Local books] [Sandbox fiscal] [Cloud agent] [Read-only mode]
```

Las sugerencias no son texto estático — son **quick actions** basadas en el cliente y periodo seleccionados. Cada una inicia un thread preconfigurado.

### Pantalla: Thread List

Lista de threads activos del cliente/periodo actual:

```txt
Threads activos
──────────────────────────────────
● Cierre Jun 2026 · Andes SAC           [En progreso]
● Validar SIRE Compras · Nova SAC       [En revisión]
● Conciliación BCP · Luna EIRL          [Pendiente]
● Detracciones pendientes · Agroexport  [Requiere atención]
```

### Componentes nuevos

1. **ThreadCreatePage** — Landing "Let's Close" con quick actions y command input.
2. **ThreadDetailPage** — Vista de un thread activo: timeline, agentes, tareas, evidencia.
3. **ThreadList** — Sidebar widget + página dedicada de threads activos por cliente/periodo.
4. **ThreadCard** — Card de thread en lista: estado, progreso, última actividad.
5. **ThreadTimeline** — Timeline de eventos del thread (agente propuso, contador aprobó, evidencia agregada).
6. **QuickActionButton** — Botón de acción rápida contextual (prepara thread preconfigurado).
7. **EnvironmentSelector** — Selector de entorno: Local books / Sandbox fiscal / Cloud agent / Read-only mode.

### API endpoints nuevos

| Endpoint                    | Método | Propósito                                            |
| --------------------------- | ------ | ---------------------------------------------------- |
| `/api/threads`              | GET    | Listar threads (filtro por cliente, periodo, estado) |
| `/api/threads`              | POST   | Crear thread                                         |
| `/api/threads/:id`          | GET    | Detalle del thread                                   |
| `/api/threads/:id`          | PATCH  | Actualizar estado, tareas                            |
| `/api/threads/:id/agents`   | POST   | Asignar agente al thread                             |
| `/api/threads/:id/evidence` | POST   | Vincular evidencia al thread                         |
| `/api/threads/:id/close`    | POST   | Cerrar thread (archivar)                             |

### Dominio nuevo

```
packages/domain/src/
  thread/
    thread.ts          → Thread entity
    thread-id.ts       → ThreadId (branded)
    thread-status.ts   → ThreadStatus enum
    thread-task.ts     → ThreadTask value object
    thread-agent.ts    → ThreadAgentAssignment value object

packages/persistence/src/schema/
  threads.ts           → Drizzle schema
  thread_tasks.ts
  thread_agents.ts
  thread_evidence.ts
```

---

## Architecture

```tsx
<AgenticLayout>            ← Plan 1
  <AgenticSidebar />
  <main>
    <Outlet />
      ├─ <ThreadCreatePage>     ← Landing "Let's Close"
      │   <QuickActionGrid />
      │   <EnvironmentSelector />
      │   <AgenticCommandBar />
      │
      └─ <ThreadDetailPage>    ← Thread workspace
          <ThreadHeader />
          <ThreadTimeline />
          <AgentTaskList />
          <RightInspector />   ← Contextual al thread
  </main>
  <RightInspector />
  <AgenticCommandBar />
</AgenticLayout>
```

---

## Dependencies

- **Bloqueado por**: Plan 1 (necesita AgenticLayout + routing + CommandBar)
- **Bloquea a**: Plan 3 (Agents Window puede mostrar threads), Plan 4 (diffs se asocian a threads)
- **Paralelo con**: Plans 5, 6 (pueden diseñarse en paralelo si no tocan routing)

---

## Delivery

**Estrategia:** auto-chain — 3 PRs

| PR  | Scope                                                            | Archivos | Líneas |
| --- | ---------------------------------------------------------------- | -------- | ------ |
| PR1 | Thread domain entities + persistence schema                      | 8-10     | ~350   |
| PR2 | Thread API (CRUD + assign agents + evidence)                     | 6-8      | ~350   |
| PR3 | Thread UI (CreatePage, DetailPage, List, Timeline, QuickActions) | 12-15    | ~400   |

**Riesgos:**

- El concepto de thread debe reemplazar al "fiscal case" existente — verificar compatibilidad.
- Ambiente de ejecución (sandbox/local/cloud) requiere integración con drenyra-orchestrator.
- Quick actions deben ser configurables por cliente (no hardcodeadas).

---

## Non-goals

- No se implementa la vista multi-agente paralela (Plan 3)
- No se implementa el diff contable (Plan 4)
- No se implementan skills ni automations (Plan 5)
- No se migra el Evidence Vault existente a thread-aware (Plan 6)
