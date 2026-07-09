# FiscalComplianceOrchestrator — Diseño

> **Contexto:** El `FiscalSDDRunner` actual es un ejecutor secuencial genérico con gates.
> Hace bien lo básico, pero carece de las capacidades de gobierno que tiene el orquestador
> de gentle-pi: routing de modelos, sub-agentes por fase, artefactos persistentes,
> gates post-fase con decisión auto/interactivo, y protección de carga de revisión.
>
> Este documento diseña la evolución al **FiscalComplianceOrchestrator**.

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    FiscalComplianceOrchestrator                  │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ Preflight    │→│ Phase Router    │→│ Gatekeeper       │  │
│  │ (validate)   │  │ (model + agent) │  │ (auto/interactive)│  │
│  └──────────────┘  └─────────────────┘  └───────────────────┘  │
│         │                   │                    │              │
│         ▼                   ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Artifact Store                          │   │
│  │  openspec (files) | engram (memoria) | hybrid (ambos)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Sub-agent Delegation Pool                   │   │
│  │  solicitud│análisis│diseño│plan│migración│auditoría     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Capas

| Capa                  | Responsabilidad                                    | Package                               |
| --------------------- | -------------------------------------------------- | ------------------------------------- |
| **Orchestrator**      | Coordinación, routing, decisiones auto/interactive | `fiscal-sdd` (nuevo)                  |
| **Phase Runner**      | Ejecución secuencial con gates (existente)         | `fiscal-sdd` (existe)                 |
| **Compliance Chains** | DAG de subsistemas para cambios normativos         | `fiscal-compliance-pipeline` (existe) |
| **Artifact Store**    | Persistencia de artefactos por fase                | Nuevo adapter                         |
| **Sub-agent Pool**    | Ejecución delegada por fase                        | Nuevo (vía intercom o sub-agent)      |

---

## 2. Mapeo de capacidades gentle-pi → Drenyra

| Capacidad          | gentle-pi                                         | Drenyra (hoy)                     | Drenyra (target)                            |
| ------------------ | ------------------------------------------------- | --------------------------------- | ------------------------------------------- |
| **Model routing**  | Model Assignments por fase                        | `LLMCaller` único unificado       | `ModelRouter` por fase con fallback         |
| **Sub-agentes**    | Cada fase es un agente separado                   | Mismo proceso                     | Sub-agentes vía `intercom` o `subagent_run` |
| **Artifact store** | openspec / engram / hybrid                        | `evidenceStore` callback opcional | 3 backends: openspec, engram, hybrid        |
| **Gate post-fase** | Gatekeeper validación + decisión auto/interactive | `FiscalPhaseGate` solo valida     | Gate + DecisionGate (auto/manual/escalate)  |
| **Review guard**   | Límite 400 líneas, chained PRs                    | No existe                         | `ReviewGuard` antes de migración            |
| **Pre-flight**     | SDD Init, DAG de dependencias                     | No existe                         | `PreflightValidator`                        |
| **Skill registry** | Resolución de skills desde registry               | No existe                         | `FiscalSkillRegistry`                       |
| **Strict TDD**     | Tests primero                                     | No existe                         | `TestGate` opcional                         |

---

## 3. Tipos y Contratos

### 3.1 Model Router

```typescript
// packages/fiscal-sdd/src/orchestrator/model-router.ts

export type ModelProvider =
  'deepseek' | 'gemini' | 'claude' | 'openai' | 'custom'

export interface ModelAssignment {
  fase: FaseName
  provider: ModelProvider
  model: string
  priority: number // 0 = primary, 1+ = fallback
  reason: string // por qué este modelo para esta fase
}

export const MODEL_ASSIGNMENTS: ModelAssignment[] = [
  {
    fase: 'solicitud',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    priority: 0,
    reason: 'Análisis normativo extenso',
  },
  {
    fase: 'analisis',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    priority: 0,
    reason: 'Citas legales, estructura',
  },
  {
    fase: 'diseno',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    priority: 0,
    reason: 'Decisiones arquitectónicas',
  },
  {
    fase: 'plan',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    priority: 0,
    reason: 'Desglose mecánico',
  },
  {
    fase: 'migracion',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    priority: 0,
    reason: 'Implementación',
  },
  {
    fase: 'auditoria',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    priority: 0,
    reason: 'Validación contra spec',
  },
]

export class ModelRouter {
  constructor(private assignments: ModelAssignment[]) {}

  /** Resuelve el mejor LLMCaller disponible para una fase. */
  async resolve(fase: FaseName): Promise<LLMCaller> {
    const candidates = this.assignments
      .filter((a) => a.fase === fase)
      .sort((a, b) => a.priority - b.priority)

    for (const candidate of candidates) {
      const caller = await this.tryProvider(candidate)
      if (caller) return caller
    }

    // Fallback global
    return this.defaultCaller()
  }

  private async tryProvider(
    assignment: ModelAssignment
  ): Promise<LLMCaller | null> {
    // Intentar conexión, devolver null si no disponible
  }
}
```

### 3.2 Artifact Store

```typescript
// packages/fiscal-sdd/src/orchestrator/artifact-store.ts

export type ArtifactStoreMode = 'openspec' | 'engram' | 'hybrid' | 'none'

export interface FaseArtifact {
  fase: FaseName
  status: 'SUCCESS' | 'BLOCKED' | 'MANUAL_REVIEW' | 'FAILED'
  input: unknown
  output: unknown
  gateResults: GatekeeperVerdict[]
  evidence: NewEvidenceArtifact[]
  errors: string[]
  confidence: number
  ejecutadoEn: string // ISO timestamp
  duracionMs: number
}

export interface ArtifactStore {
  save(changeId: string, artifact: FaseArtifact): Promise<void>
  load(changeId: string, fase: FaseName): Promise<FaseArtifact | null>
  loadAll(changeId: string): Promise<Map<FaseName, FaseArtifact>>
}

export class OpenSpecArtifactStore implements ArtifactStore {
  constructor(private basePath: string) {}

  async save(changeId: string, artifact: FaseArtifact): Promise<void> {
    const dir = path.join(this.basePath, 'cambios', changeId)
    await mkdir(dir, { recursive: true })
    await writeFile(
      path.join(dir, `${artifact.fase}.json`),
      JSON.stringify(artifact, null, 2)
    )
  }

  async load(changeId: string, fase: FaseName): Promise<FaseArtifact | null> {
    try {
      const content = await readFile(
        path.join(this.basePath, 'cambios', changeId, `${fase}.json`),
        'utf-8'
      )
      return JSON.parse(content) as FaseArtifact
    } catch {
      return null
    }
  }
}
```

### 3.3 Preflight Validator

```typescript
// packages/fiscal-sdd/src/orchestrator/preflight.ts

export interface PreflightCheck {
  name: string
  description: string
  severity: 'BLOCKING' | 'WARNING'
  validate: (
    changeId: string,
    scope: FiscalScope
  ) => Promise<{ passed: boolean; reason?: string }>
}

export const PREFLIGHT_CHECKS: PreflightCheck[] = [
  {
    name: 'scope-valid',
    description: 'RUC y período son válidos',
    severity: 'BLOCKING',
    validate: async (_changeId, scope) => ({
      passed:
        RUC.isValid(scope.companyRuc) &&
        /^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period),
      reason: 'RUC inválido o período mal formado',
    }),
  },
  {
    name: 'no-active-change',
    description: 'No hay otro cambio activo para el mismo RUC/período',
    severity: 'BLOCKING',
    validate: async (changeId, scope) => {
      // Verificar artifact store
    },
  },
  {
    name: 'evidence-store-ready',
    description: 'El evidence store está disponible',
    severity: 'WARNING',
    validate: async () => ({
      passed: true, // health check
    }),
  },
]
```

### 3.4 Review Guard

```typescript
// packages/fiscal-sdd/src/orchestrator/review-guard.ts

export interface ReviewForecast {
  /** Líneas estimadas que modificará migración */
  estimatedLines: number
  /** Riesgo de exceder el presupuesto */
  budgetRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  /** Recomendación de PRs encadenados */
  chainedPrsRecommended: boolean
  /** Archivos estimados a tocar */
  estimatedFiles: number
  /** Sub-sistemas fiscales afectados */
  affectedSubsystems: string[]
}

export class ReviewGuard {
  constructor(private budget: number = 400) {}

  async forecast(planOutput: unknown): Promise<ReviewForecast> {
    // Analizar el output de la fase "plan" para estimar el tamaño
    // Si > budget: recomendar PRs encadenados
    // Si subsystemas críticos (SIRE, PLE, CDR): requerir revisión
  }

  async decide(
    forecast: ReviewForecast,
    strategy: 'ask-on-risk' | 'auto-chain' | 'single-pr' | 'exception-ok'
  ): Promise<{
    action: 'proceed' | 'split' | 'ask'
    splitInto?: string[] // si action = split
  }> {
    // Implementar lógica de estrategia
  }
}
```

### 3.5 Decision Gate

```typescript
// packages/fiscal-sdd/src/orchestrator/decision-gate.ts

export type DecisionMode = 'auto' | 'interactive'

export interface DecisionGateResult {
  mode: DecisionMode
  /** En auto: pasa automáticamente si el confidence es suficiente */
  autoThreshold: number // 0-1, mínimo confidence para auto
  /** En interactivo: requiere confirmación humana */
  requiresApproval: boolean
  reason: string
}

export class DecisionGate {
  constructor(private mode: DecisionMode) {}

  async evaluate(
    fase: FaseName,
    result: PhaseResult
  ): Promise<DecisionGateResult> {
    if (this.mode === 'auto') {
      const passed = result.confidence >= 0.7 && result.errors.length === 0
      return {
        mode: 'auto',
        autoThreshold: 0.7,
        requiresApproval: !passed,
        reason: passed
          ? `Auto-aprobado (confidence ${result.confidence})`
          : `Confidence insuficiente (${result.confidence}) o errores presentes`,
      }
    }

    // Interactivo: siempre requiere aprobación
    return {
      mode: 'interactive',
      autoThreshold: 0,
      requiresApproval: true,
      reason: 'Modo interactivo: esperando revisión humana',
    }
  }
}
```

### 3.6 Sub-agent Delegation

```typescript
// packages/fiscal-sdd/src/orchestrator/subagent-runner.ts

export interface SubAgentConfig {
  enabled: boolean
  runtime: 'intercom' | 'subagent_run' | 'inline'
  timeoutMs: number
}

export class SubAgentRunner {
  constructor(private config: SubAgentConfig) {}

  async executePhase(
    fase: FaseName,
    input: unknown,
    caller: LLMCaller
  ): Promise<PhaseResult> {
    if (!this.config.enabled || this.config.runtime === 'inline') {
      // Ejecución inline (actual)
      return this.runInline(fase, input, caller)
    }

    // Delegar a sub-agente
    if (this.config.runtime === 'intercom') {
      return this.runViaIntercom(fase, input, caller)
    }

    // subagent_run
    return this.runViaSubAgent(fase, input, caller)
  }
}
```

---

## 4. Pipeline Completo

```
FiscalComplianceOrchestrator.run(changeId, scope, mode)
│
├─ 1. PREFLIGHT
│   ├─ Validar scope (RUC, período)
│   ├─ Verificar artifact store disponible
│   └─ Verificar que no haya cambios activos en paralelo
│
├─ 2. SOLICITUD (model: deepseek-v4-flash)
│   ├─ Resolver modelo vía ModelRouter
│   ├─ Ejecutar fase (inline o sub-agente)
│   ├─ Gatekeeper: validar estructura de solicitud
│   └─ DecisionGate: ¿auto o interactivo?
│       └─ Guardar artefacto
│
├─ 3. ANÁLISIS (model: deepseek-v4-flash)
│   ├─ Cargar artefacto de solicitud
│   ├─ Resolver modelo
│   ├─ Ejecutar fase
│   ├─ Gatekeeper: validar citas normativas, criterios de aceptación
│   └─ DecisionGate
│       └─ Guardar artefacto
│
├─ 4. DISEÑO (model: deepseek-v4-flash)
│   ├─ Cargar artefacto de análisis
│   ├─ Resolver modelo
│   ├─ Ejecutar fase
│   ├─ Gatekeeper: validar decisiones arquitectónicas
│   └─ DecisionGate
│       └─ Guardar artefacto
│
├─ 5. PLAN (model: deepseek-v4-flash)
│   ├─ Cargar artefacto de diseño
│   ├─ Resolver modelo
│   ├─ Ejecutar fase
│   ├─ Gatekeeper: validar desglose de tareas
│   ├─ ReviewGuard: pronosticar carga de revisión
│   │   └─ Si > 400 líneas → recomendar PRs encadenados
│   └─ DecisionGate
│       └─ Guardar artefacto
│
├─ 6. MIGRACIÓN (model: sonnet / deepseek-v4-flash)
│   ├─ Cargar artefacto de plan
│   ├─ Resolver modelo (preferir sonnet para implementación)
│   ├─ Si hay cadena de compliance: delegar a CompliancePipelineRunner
│   │   └─ ComplianceChain: Detracciones → PLE → SIRE
│   ├─ Ejecutar fase (como sub-agente para multi-file)
│   ├─ Gatekeeper: verificar límite de líneas, tenant scope
│   ├─ ReviewGuard: verificar carga real vs pronosticada
│   └─ DecisionGate
│       └─ Guardar artefacto
│
└─ 7. AUDITORÍA (model: deepseek-v4-flash)
    ├─ Cargar artefactos de análisis + migración
    ├─ Resolver modelo
    ├─ Ejecutar fase
    ├─ Gatekeeper: verificar cada criterio de aceptación
    ├─ Verificar hash chain de evidencia
    └─ DecisionGate
        └─ Guardar artefacto
        └─ Generar reporte final de compliance
```

---

## 5. Implementación

### 5.1 Package Structure

```
packages/fiscal-sdd/src/
  orchestrator/
    fiscal-compliance-orchestrator.ts   ← Clase principal
    model-router.ts                     ← Routing de modelos por fase
    artifact-store.ts                   ← Openspec | Engram | Hybrid
    preflight.ts                        ← Validaciones pre-ejecución
    decision-gate.ts                    ← Auto vs interactivo
    review-guard.ts                     ← Protección de carga de revisión
    subagent-runner.ts                  ← Delegación a sub-agentes
    types.ts                            ← Tipos específicos del orchestrator
  phases/
    sdd-phases.ts                       ← Phase factories (existentes)
  pipelines/
    sdd-fiscal-pipeline.ts              ← Pipeline definition (existente)
  runner.ts                             ← FiscalSDDRunner (existente)
  types.ts                              ← Core types (existentes)
  index.ts                              ← Barrel exports
```

### 5.2 Clase Principal

```typescript
// packages/fiscal-sdd/src/orchestrator/fiscal-compliance-orchestrator.ts

export interface OrchestratorConfig {
  mode: 'auto' | 'interactive'
  artifactStore: ArtifactStoreMode
  reviewBudget: number // líneas máximas por PR
  modelAssignments?: ModelAssignment[]
  subAgents?: boolean
  strictTdd?: boolean
}

export class FiscalComplianceOrchestrator {
  private preflight: PreflightValidator
  private runner: FiscalSDDRunner
  private modelRouter: ModelRouter
  private artifactStore: ArtifactStore
  private decisionGate: DecisionGate
  private reviewGuard: ReviewGuard
  private subAgentRunner: SubAgentRunner
  private complianceChainRunner: CompliancePipelineRunner

  constructor(private config: OrchestratorConfig) {
    this.preflight = new PreflightValidator()
    this.runner = new FiscalSDDRunner()
    this.modelRouter = new ModelRouter(
      config.modelAssignments ?? DEFAULT_ASSIGNMENTS
    )
    this.artifactStore = createArtifactStore(config.artifactStore)
    this.decisionGate = new DecisionGate(config.mode)
    this.reviewGuard = new ReviewGuard(config.reviewBudget)
    this.subAgentRunner = new SubAgentRunner({
      enabled: config.subAgents ?? false,
    })
    this.complianceChainRunner = new CompliancePipelineRunner()
  }

  async run(
    changeId: string,
    scope: FiscalScope,
    metadata: FiscalChangeMetadata
  ): Promise<OrchestratorResult> {
    // 1. Preflight
    const preflightResult = await this.preflight.validate(changeId, scope)
    if (preflightResult.blocked) {
      return { status: 'PREFLIGHT_BLOCKED', reasons: preflightResult.reasons }
    }

    // 2-7. Phases secuenciales
    const fases: FaseName[] = [
      'solicitud',
      'analisis',
      'diseno',
      'plan',
      'migracion',
      'auditoria',
    ]

    let currentInput: unknown = { changeId, scope, metadata }

    for (const fase of fases) {
      // Cargar artefacto previo si existe
      const prevArtifact = await this.artifactStore.load(changeId, fase)
      if (prevArtifact) {
        currentInput = prevArtifact.output
        continue // Fase ya completada (reanudación)
      }

      // Resolver modelo
      const caller = await this.modelRouter.resolve(fase)

      // Ejecutar
      const phaseResult = await this.subAgentRunner.executePhase(
        fase,
        currentInput,
        caller
      )

      // Gatekeeper + DecisionGate
      const decision = await this.decisionGate.evaluate(fase, phaseResult)
      if (decision.requiresApproval && this.config.mode === 'interactive') {
        return {
          status: 'AWAITING_APPROVAL',
          blockedAtFase: fase,
          phaseResult,
          message: `Fase "${fase}" completada, esperando aprobación`,
        }
      }

      // Guardar artefacto
      await this.artifactStore.save(changeId, {
        fase,
        status: phaseResult.status,
        input: currentInput,
        output: phaseResult.output,
        gateResults: phaseResult.gatesPassed,
        evidence: phaseResult.evidenceArtifacts,
        errors: phaseResult.errors,
        confidence: phaseResult.confidence,
        ejecutadoEn: new Date().toISOString(),
        duracionMs: 0,
      })

      currentInput = phaseResult.output
    }

    return {
      status: 'COMPLETED',
      changeId,
      scope,
    }
  }
}
```

### 5.3 Integración con Compliance Chains

Cuando la fase de `migración` necesita cascading compliance (e.g., cambio de tasa IGV):

```typescript
// Durante la fase de migración, si el cambio afecta subsistemas:
if (change.affectedSubsystems?.includes('detracciones')) {
  const chainResult = await this.complianceChainRunner.runChain(
    IGV_CHANGE_CHAIN,
    change,
    { evidenceStore: this.artifactStore }
  )

  if (chainResult.status === 'BLOCKED') {
    return { status: 'BLOCKED', reason: 'Compliance chain blocked' }
  }
}
```

---

## 6. Modos de Ejecución

| Modo          | Comportamiento                                                       | Uso                                              |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| `auto`        | Todas las fases se ejecutan sin pausa, gatekeeper decide si blocking | Rapid prototyping, cambios simples               |
| `interactive` | Después de cada fase, pregunta si continuar                          | Cambios normativos complejos, revisión requerida |
| `supervised`  | Solo `migración` y `auditoría` requieren aprobación                  | Balance entre velocidad y seguridad              |

---

## 7. Plan de Migración

### Fase 1: Core Orchestrator (este PR)

- [ ] `ModelRouter` con assignments configurables
- [ ] `ArtifactStore` (openspec file-based primero)
- [ ] `PreflightValidator` con checks básicos
- [ ] `DecisionGate` (auto/interactive)

### Fase 2: Review Guard + Sub-agentes

- [ ] `ReviewGuard` con forecast de líneas
- [ ] `SubAgentRunner` con inline primero, luego intercom
- [ ] Integración con `CompliancePipelineRunner`

### Fase 3: Engram + Modos avanzados

- [ ] Engram artifact store backend
- [ ] Modo supervised
- [ ] Strict TDD gate
- [ ] Fiscal skill registry

---

## 8. Próximos Pasos

1. Implementar `ModelRouter` y `ArtifactStore` (openspec)
2. Refactorizar `FiscalComplianceOrchestrator.run()` con el loop de fases
3. Migrar los tests existentes al nuevo orchestrator
4. Agregar `ReviewGuard` antes de migración
5. Integrar con `CompliancePipelineRunner`

---

**Última actualización:** 2026-07-09
