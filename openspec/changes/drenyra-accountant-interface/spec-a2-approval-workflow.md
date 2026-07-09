# Spec: A2 — Recommendation + Approval Workflow

> **Phase**: spec
> **Campaña**: A2 Approval Workflow
> **Depende de**: proposal (aprobado), A1 Query Engine
> **Dependientes**: A3 Web Panel

---

## 1. Comportamiento Esperado

### 1.1 Happy Path — Approve

```
drenyra recomendaciones
```

```text
━━━ Recomendaciones Pendientes ━━━

REC-001 | IGV julio 2026 | S/ 18,234.50 | Confianza: 0.92
  Fuente: factura F001-123 (CDR ok), F001-124 (CDR ok), ...
  Acción sugerida: Contabilizar IGV por S/ 18,234.50
  Pipeline: igv-julio-2026
  Creado: 2026-07-09 14:30

REC-002 | Detracción F001-125 | S/ 450.00 | Confianza: 0.88
  Fuente: factura F001-125, código SPOT 023
  Acción sugerida: Aplicar detracción 12%
  ...

2 pendientes | usar: drenyra aprobar <id> | drenyra rechazar <id> --motivo "..."
```

```
drenyra aprobar REC-001
```

```text
✅ REC-001 aprobada por contador
  Acción: Contabilizar IGV por S/ 18,234.50
  Ejecutando pipeline: igv-julio-2026
  Evidence: approval recorded (aprobó: contador@drenyra, 2026-07-09 14:35)
  Pipeline status: running → completed
  CDR hash: 0xabc123...
```

### 1.2 Happy Path — Reject

```
drenyra rechazar REC-001 --motivo "el periodo deberia incluir agosto tambien"
```

```text
ℹ REC-001 rechazada
  Motivo: el periodo deberia incluir agosto tambien
  Acción NO ejecutada
  Sugerencia: creá una nueva consulta con periodo 2026-07..2026-08:
    drenyra consulta "IGV de julio-agosto 2026"

  Registro: rechazó: contador@drenyra, 2026-07-09 14:36
```

### 1.3 Pipeline pausado por pre-approval gate

```
$ drenyra consulta "contabilizame el IGV de julio" --mode supervised

# Pipeline corre hasta el gate de aprobación → pausa
# El contador ve la recomendación, la aprueba o rechaza
# Si aprueba → pipeline continúa
# Si timeout (24h sin respuesta) → escalación automática
```

## 2. Contrato Técnico

### 2.1 Paquete nuevo: `packages/fiscal-approval/`

```
packages/fiscal-approval/
├── src/
│   ├── index.ts               # Public API
│   ├── types.ts               # Recommendation, Approval, ApprovalGate
│   ├── recommendation-engine.ts  # Genera recomendaciones del pipeline output
│   ├── approval-gate.ts       # Pre-approval gate (pausa pipeline hasta approved)
│   ├── approval-store.ts      # Store en evidence store (no tabla separada)
│   └── audit-trail.ts         # Registro de quién aprobó/rechazó, cuándo, por qué
├── __tests__/
│   ├── recommendation-engine.test.ts
│   ├── approval-gate.test.ts
│   └── approval-store.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 2.2 Tipos principales

```typescript
type ApprovalStatus =
  'pending' | 'approved' | 'rejected' | 'escalated' | 'timeout'

interface Recommendation {
  id: string // REC-001
  pipelineRunId: string
  tipoAccion:
    | 'contabilizar-igv'
    | 'aplicar-detraccion'
    | 'declarar-sire'
    | 'corregir-factura'
  ruc: string
  periodo: string
  descripcion: string // Human-readable
  monto: Money // S/ 18,234.50
  confianza: number // 0.92
  fuentes: EvidenceSource[]
  status: ApprovalStatus
  creado: string // ISO timestamp
  aprobadoPor?: string // user email
  aprobadoEn?: string // ISO timestamp
  motivoRechazo?: string
}

interface ApprovalGateConfig {
  timeoutHoras: number // 24
  escalateAfter: number // hours without response
  minConfidence: number // 0.7 (below this → always require approval)
  maxPendingPerUser: number // 10
}

interface ApprovalAction {
  recommendationId: string
  action: 'approve' | 'reject'
  userId: string
  motivo?: string // required for reject
  timestamp: string
}
```

### 2.3 Approval Gate (pipeline integration)

El gate se integra con `GatedPhasePipeline` del `phase-gatekeeper`:

```typescript
class ApprovalGate implements GatekeeperCheck<PhaseOutput> {
  name = 'ApprovalGate'
  description = 'Requires human approval before fiscal action execution'
  severity = 'BLOCKING' as const

  async check(output: PhaseOutput, ctx: GatekeeperContext) {
    // 1. Generate recommendation from pipeline output
    const rec = await recommendationEngine.generate(output, ctx)

    // 2. Store pending recommendation
    await approvalStore.save(rec)

    // 3. Wait for approval (polling)
    const approved = await this.waitForApproval(rec.id, ctx)

    if (!approved) {
      return {
        passed: false,
        reasons: [`REC-${rec.id}: rejected or timed out`],
        severity: 'BLOCKING',
        details: { rec },
      }
    }

    return {
      passed: true,
      reasons: [`REC-${rec.id}: approved`],
      severity: 'INFO',
      details: { rec },
    }
  }
}
```

### 2.4 CLI Commands

| Comando                          | Descripción                                           |
| -------------------------------- | ----------------------------------------------------- |
| `drenyra recomendaciones`        | Lista recomendaciones pendientes (por RUC/periodo)    |
| `drenyra aprobar <id>`           | Aprueba una recomendación y ejecuta la acción         |
| `drenyra rechazar <id> --motivo` | Rechaza con motivo obligatorio                        |
| `drenyra recomendacion <id>`     | Detalle de una recomendación específica con evidencia |
| `drenyra historial`              | Historial de aprobaciones/rechazos del período        |

### 2.5 No espera síncrona (polling)

El approval gate NO bloquea el proceso de Pi. Usa polling cada 30s:

1. Gate registra la recomendación
2. Gate devuelve `passed: false` con estado `MANUAL_REVIEW` (no STOP)
3. Pipeline runners continúan con otros trabajos
4. Cuando el contador aprueba, el gate se re-evalúa
5. Si pasa → pipeline continúa
6. Si timeout (24h) → escalación

## 3. Criterios de Aceptación

| Criterio | Verificación                                                          |
| -------- | --------------------------------------------------------------------- |
| CA1      | `drenyra recomendaciones` lista pendientes con evidencia y confianza  |
| CA2      | `drenyra aprobar REC-001` ejecuta la acción y registra audit trail    |
| CA3      | `drenyra rechazar REC-001 --motivo "..."` registra rechazo con motivo |
| CA4      | Approval gate pausa pipeline hasta aprobación                         |
| CA5      | Pipeline reanuda automáticamente tras aprobación                      |
| CA6      | Timeout de 24h escala automáticamente                                 |
| CA7      | Audit trail incluye: quién, qué, cuándo, por qué, evidence hash       |
| CA8      | Rechazo con motivo vacío es rechazado (motivo obligatorio)            |

## 4. Pruebas

```bash
cd packages/fiscal-approval && npx vitest run

# CLI integration
drenyra aprobar REC-001
drenyra rechazar REC-001 --motivo "periodo incorrecto"
drenyra recomendaciones --ruc 20123456789

# Approval gate integration test
# Simular pipeline → approval → continue
```

## 5. No-Alcance (para A2)

- Web UI (es A3)
- Aprobación batch
- Notificaciones push/email
- Roles de aprobación (solo contador, no manager)
