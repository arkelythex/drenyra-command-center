# CAP-FEOS-WORKSPACE-00: Diseño

## Arquitectura Objetivo

```
EXPERIENCE PLANE
Web · Desktop · Mobile · CLI
        │
WORKSPACE CONTROL PLANE
Commands · Layouts · Focus · Attach · Wait · Notifications
        │
WORKSPACE PROJECTIONS
Attention · Portfolio · Execution · Presence · Layout
        │
EVENT AUTHORITY LAYER
Sequence · Dedup · Replay · State authority · Freshness
        │
FEOS GOVERNANCE
Scope · R0-R3 · Approval · Evidence · Receipts · Cost
        │
EXECUTION RUNTIMES
Pi · Workers · Durable workflows · Connectors
```

## Decisiones de Arquitectura

### ADR-001: Identidad de workspace como agregado root

Workspace es el agregado root del bounded context. Contiene companies, periods, views y execution references. No depende del identity de UI.

### ADR-002: Estado en tres niveles de autoridad

Nunca mezclar `observed`, `reported` y `authoritative`. La UI solo proyecta el estado autoritativo pero puede mostrar hinted state para early feedback (con marcado visual).

### ADR-003: Layout basado en templates, no docking engine para V1

Usar `react-resizable-panels` para los 5 layouts predefinidos. Solo migrar a Dockview/FlexLayout si hay evidencia de usuarios moviendo paneles libremente.

### ADR-004: Workspace domain es framework-free

El paquete `workspace-domain` NO importa nada del framework, React, Elysia, Drizzle o ningún runtime state. Solo tipos, value objects, errores y funciones puras.

### ADR-005: CLI y Web comparten contratos

Los commands del workspace se definen en `workspace-contracts` como Zod schemas + TypeScript types. CLI (Go/Bubbletea) parsea el mismo schema via generación desde JSON Schema o definición duplicada con test de compatibilidad.

### ADR-006: Ejecución detached no cancela workflows

El comando `detach` solo cierra la conexión cliente → servidor. La ejecución continúa en el runtime. El comando `attach` reabre la conexión y hace event catch-up.

### ADR-007: Checkpoints periódicos para replay

Cada 1000 eventos o 5 minutos (lo que ocurra primero) se escribe un checkpoint del estado proyectado. Replay restaura desde el último checkpoint y reproduce los eventos faltantes.

### ADR-008: Rollups preservan materialidad

Un portfolio rollup incluye: counts × severidad, highest risk tier, nearest deadline, estimated exposure, affected companies, top reasons. No usamos "el peor estado" como resumen único.

## Tenant Isolation Strategy

Workspaces están scoped a `organizationId`. Views scoped a `workspaceId`. Un workspace solo puede contener companies dentro de su organización. La autorización FEOS gatea R2/R3 commands en el application layer.

## Error Recovery Paths

| Falla                    | Recovery                                                                          |
| ------------------------ | --------------------------------------------------------------------------------- |
| DB unavailable en write  | Reintentar con backoff exponencial; si persiste → circuit breaker + UNKNOWN state |
| Replay batch falla       | Rollback al último checkpoint + log de batch fallido                              |
| Duplicate event          | Dedup por sequence id (idempotencia)                                              |
| Desconexión de cliente   | Detach automático; el workspace sigue vivo; event catch-up al reconectar          |
| Proyección inconsistente | Full replay desde checkpoint al notar gap de sequence                             |

## Paquetes y PRs

### PR1: workspace-domain

Nuevo paquete `packages/workspace-domain/`

Files:

- `src/index.ts` — exports
- `src/types/workspace.ts` — FinancialWorkspace, WorkspaceId, WorkspaceObjective
- `src/types/view.ts` — WorkspaceView, ViewKind, LayoutPlacement
- `src/types/execution.ts` — ExecutionReference, ExecutionId
- `src/types/state.ts` — OperationalState, LifecycleState, AttentionState, RiskTier, FreshnessState
- `src/types/errors.ts` — WorkspaceError discriminant union
- `src/types/rollup.ts` — AttentionRollup, RollupReason
- `package.json`, `tsconfig.json`

### PR2: state-authority

Nuevo paquete `packages/workspace-application/`

- Command handlers para workspace CRUD
- State authority model: observed vs reported vs authoritative
- FEOS adapter integration

### PR3: event-projection

Nuevo paquete `packages/workspace-projections/`

- Event store interface + in-memory implementation
- Execution, attention, portfolio, freshness projections
- Checkpoint mecanism
- Dedup y replay

### PR4: attention-rollups

Dentro de `packages/workspace-projections/`

- PortfolioRollupService
- Materiality calculator
- Deadline propagator
- RollupReason generator

### PR5: persistent-layout

Nuevo paquete `packages/workspace-layout/`

- 5 layout templates
- react-resizable-panels integration
- Persistence service
- Focus management

### PR6: attach-detach-resume

Dentro de `packages/workspace-control/`

- AttachService, DetachService, ResumeService
- Event catch-up logic
- Runtime session mapping

### PR7: unified-command-bus

Nuevo paquete `packages/workspace-contracts/` + `packages/workspace-control/`

- Zod schemas for all commands
- CommandBus middleware (auth, validation, feos gate)
- CLI commands (drenyra workspace ...)
- API routes via Elysia

### PR8: waits-notifications

Dentro de `packages/workspace-control/`

- WaitService (wait until blocked, approved, completed)
- NotificationRouter
- Subscription model

### PR9: concurrency + security + performance

Across packages

- Multi-client optimistic concurrency
- Pane/view authorization
- Sensitive evidence redaction
- Startup/restoration budgets
- Grid virtualization
- Event backpressure
