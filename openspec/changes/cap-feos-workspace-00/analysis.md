# CAP-FEOS-WORKSPACE-00: Análisis

## Dominio

### Workspace Identity Hierarchy

```typescript
interface FinancialWorkspace {
  workspaceId: WorkspaceId
  organizationId: OrganizationId
  companyIds: readonly CompanyId[]
  fiscalPeriodIds: readonly FiscalPeriodId[]
  objective: WorkspaceObjective
  layoutId: WorkspaceLayoutId
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

Tipos de workspace (WorkspaceObjective): `monthly-close`, `sire-review`, `tax-audit`, `bank-reconciliation`, `rce-rectification`, `portfolio-operations`, `evidence-audit`, `custom`.

### View Identity

```typescript
interface WorkspaceView {
  viewId: WorkspaceViewId
  workspaceId: WorkspaceId
  kind: ViewKind
  placement: LayoutPlacement
  query: SavedFinancialQuery
}
```

ViewKind: `ledger`, `evidence`, `sire-comparison`, `agent-activity`, `financial-diff`, `approval`, `document-viewer`, `close-readiness`.

Regla: mover una vista no cambia ViewKind ni query; solo cambia placement.

### Execution Identity

```typescript
interface ExecutionReference {
  executionId: ExecutionId
  runtimeSessionId?: AgentSessionId
  workflowId?: WorkflowId
  lastAuthoritativeSequence: number
}
```

### State Authority Model

Tres niveles de autoridad:

| Nivel           | Descripción                               | Fuente                                            |
| --------------- | ----------------------------------------- | ------------------------------------------------- |
| `observed`      | Inferido por actividad o telemetría       | Pi lifecycle, heartbeats                          |
| `reported`      | Declarado por agente, worker o conector   | Worker status reports                             |
| `authoritative` | Confirmado por workflow durable + receipt | FEOS receipts, DB committed state, SUNAT response |

Dimensiones de estado:

```typescript
interface OperationalState {
  lifecycle: LifecycleState // queued → starting → running → verifying → waiting → completed → failed → cancelled → unknown
  attention: AttentionState // none | informational | input-required | evidence-required | approval-required | blocked | critical
  risk: RiskTier // R0 (read) | R1 (proposal) | R2 (internal material) | R3 (external/irreversible)
  freshness: FreshnessState // live | delayed | stale | reconciling | disconnected
}
```

### Contractos

Capa de paquetes:

```
packages/
├── workspace-domain/     ← framework-free, types + value objects
├── workspace-application/ ← use cases + commands + queries
├── workspace-projections/ ← event projections + rollups
├── workspace-control/     ← command bus + attach/detach + wait
├── workspace-layout/      ← layout templates + persistence
└── workspace-contracts/   ← versioned command contracts (compartido CLI/API/UI)
```

### Event Projections

Los eventos son la única fuente de verdad. Proyecciones: `execution-projection`, `attention-rollup`, `portfolio-rollup`, `freshness-projection`.

Reglas de proyección:

1. Solo eventos autorizados actualizan el estado autoritativo
2. UNKNOWN nunca se rollupa como completed
3. Eventos duplicados se deduplican por sequence id
4. Replay reproduce proyecciones desde checkpoints

### Audit Trail

Cada comando, evento y proyección genera un `event` inmutable con:

- sequence number
- source (actor o sistema)
- timestamp
- payload tipado
- previous hash (opcional para cadenas de integridad)

### Acceptance Criteria Fiscales

No hay datos fiscales directos en el workspace domain — opera a nivel de organización, empresa y periodo. Pero los gates R2/R3 deben travesar FEOS (existente).

### Tests

- Propiedades: un workspace siempre tiene al menos un companyId; IDs son inmutables; ejecución detached nunca cambia su executionId
- Comportamiento: crear workspace → recuperar por ID → mismo contenido; attach a execution viva → estado autoritativo no inferido
- Límites: portfolio rollup con 100+ empresas mantiene performance; UNKNOWN nunca completado
