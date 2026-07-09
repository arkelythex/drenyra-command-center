# Design: Accountant Interface — Arquitectura

> **Phase**: design
> **Depende de**: spec A1, A2, A3
> **Base**: Drenyra Orchestrator + Fiscal SDD + Phase Gatekeeper

---

## 1. Arquitectura General

```
                    ┌─────────────────────┐
                    │    Accountant CLI   │  A1 + A2
                    │  (drenyra consulta) │
                    └──────┬──────────────┘
                           │
                    ┌──────▼──────────────┐
                    │   Accountant Web    │  A3
                    │  (React + TanStack) │
                    └──────┬──────────────┘
                           │
              ┌────────────▼────────────┐
              │  API (ElysiaJS)         │
              │  POST /api/consulta     │
              │  POST /api/approval/*   │
              │  GET  /api/accountant/* │
              └────────────┬────────────┘
                           │
              ┌────────────▼──────────────────────┐
              │   fiscal-query-engine              │  A1
              │   (classifier → pipeline-router)   │
              └────────────┬──────────────────────┘
                           │
              ┌────────────▼──────────────────────┐
              │   fiscal-approval                  │  A2
              │   (recommendation → approval-gate) │
              └────────────┬──────────────────────┘
                           │
              ┌────────────▼──────────────────────┐
              │    Drenyra Orchestrator            │  EXISTENTE
              │    (delegation-router,             │
              │     skills-resolver,               │
              │     review-lenses)                 │
              └────────────┬──────────────────────┘
                           │
              ┌────────────▼──────────────────────┐
              │    Fiscal SDD Pipeline             │  EXISTENTE
              │    (solicitud → análisis → ...)    │
              │    + Phase Gatekeeper              │
              │    + Evidence Store                │
              └────────────────────────────────────┘
```

## 2. Flujo de Datos

### 2.1 Consulta simple (A1)

```
Usuario: "IGV de julio 2026"
  → CLI/API: POST /api/consulta { texto: "..." }
  → fiscal-query-engine:
      1. classifier: intent='igv-consulta', confidence=0.95
         extract: ruc=20123456789, periodo=2026-07
      2. pipeline-router: fiscal pipeline → ejecuta análisis
      3. evidence-formatter: pipeline output → markdown + JSON
  → Response: { tipo, resultado, confianza, fuentes, evidence }
  → CLI: muestra texto formateado
  → Web: muestra cards con evidencia expandible
```

### 2.2 Consulta con recomendación + aprobación (A1 + A2)

```
Usuario: "contabilizame el IGV de julio" --mode supervised
  → fiscal-query-engine: intent='pipeline-run'
  → Pipeline fiscal: solicitud → análisis → diseño → plan
  → ApprovalGate (pre-approval):
      1. recommendation-engine: genera REC-001
      2. Guarda en approval-store (evidence store)
      3. Gate devuelve MANUAL_REVIEW (no STOP)
      4. Pipeline pausa, espera aprobación
  → Contador ve recomendación (CLI o Web)
  → Contador: drenyra aprobar REC-001
  → approval-gate re-evalúa:
      1. Aprueba
      2. Pipeline continúa: migración → auditoría
      3. Audit trail: registra aprobación
  → Contador ve resultado con evidencia
```

### 2.3 Approval polling

```
ApprovalGate.waitForApproval():
  LOOP cada 30s:
    check approval-store for REC-001
    if approved → CONTINUE
    if rejected → BLOCKED (with reason)
    if timeout (24h) → ESCALATE
    else → continue polling (no bloquea otros pipelines)
```

## 3. Decisiones de Arquitectura

### 3.1 Classifier: Pattern First, AI Fallback

**Por qué**: Las consultas fiscales tienen vocabulario predecible ("IGV", "detracción", "SIRE", "período", "RUC"). Pattern matching es determinístico, rápido, sin costo de API. AI fallback para consultas complejas o ambiguas.

```typescript
classify(query: string): IntentClassification {
  // 1. Extract entities (regex)
  const ruc = extractRuc(query);       // 11 dígitos
  const periodo = extractPeriodo(query); // "julio 2026", "2026-07"

  // 2. Pattern match intent
  const patterns = intentRegistry.match(query);
  if (patterns.confidence > 0.7) return patterns;

  // 3. AI fallback
  if (patterns.confidence < 0.4) {
    return aiClassifier.classify(query);
  }

  // 4. Request clarification
  return { kind: 'unknown', confidence: 0, extracted: { ruc, periodo } };
}
```

### 3.2 Approval State: Evidence Store, No Tabla Separada

**Por qué**: Consistencia con el resto del sistema. El evidence store ya tiene el mecanismo para persistir artifacts con hash, fase, pipeline. Crear una tabla separada duplica la lógica y puede desincronizarse.

```typescript
// La recomendación se guarda como evidence artifact
const approvalArtifact = {
  artifactId: `approval-${rec.id}`,
  phase: 'approval-gate',
  pipelineRunId: rec.pipelineRunId,
  evidenceKind: 'GATE_RESULT' as const,
  content: {
    rec,
    status: 'pending',
    createdBy: 'pipeline',
    createdAt: new Date().toISOString(),
  },
  hash: crypto.createHash('sha256').update(JSON.stringify(rec)).digest('hex'),
  parentHash: previousArtifactHash,
  createdAt: new Date().toISOString(),
}
```

### 3.3 Approval Gate: MANUAL_REVIEW (no BLOCKING STOP)

**Por qué**: STOP bloquearía todo el pipeline runner. MANUAL_REVIEW permite que el pipeline runner continúe con otros trabajos mientras espera aprobación. El gate check se re-evalúa periódicamente.

### 3.4 CLI First, Web Second

**Por qué**: El CLI es más rápido de implementar y testear. La Web reusa las mismas APIs. Los contadores pueden empezar con CLI mientras construimos el panel web.

## 4. Paquetes Nuevos

| Paquete                        | Depende de                                           | Usado por     |
| ------------------------------ | ---------------------------------------------------- | ------------- |
| `packages/fiscal-query-engine` | `@drenyra/orchestrator`, `@drenyra/fiscal-sdd`       | CLI, API, Web |
| `packages/fiscal-approval`     | `@drenyra/orchestrator`, `@drenyra/phase-gatekeeper` | CLI, API, Web |

## 5. Integración con Sistema Existente

```
├── packages/
│   ├── drenyra-orchestrator/    ← YA EXISTE (nuevo)
│   ├── fiscal-sdd/              ← YA EXISTE
│   ├── phase-gatekeeper/        ← YA EXISTE
│   ├── fiscal-query-engine/     ← NUEVO
│   └── fiscal-approval/         ← NUEVO
├── apps/
│   ├── cli/                     ← EXISTENTE + nuevos comandos
│   ├── api/                     ← EXISTENTE + nuevas rutas
│   └── web/                     ← EXISTENTE + nuevas features
```

## 6. Timeline de Implementación

```
Fase 1: A1 Query Engine (CLI + API)
  Días 1-2: packages/fiscal-query-engine (classifier, intent-registry, pipeline-router)
  Días 2-3: CLI command + API endpoint
  Día 3: Tests

Fase 2: A2 Approval Workflow (CLI)
  Días 4-5: packages/fiscal-approval (recommendation-engine, approval-gate, store)
  Días 5-6: CLI commands (aprobar, rechazar, recomendaciones)
  Día 6: Tests + integration

Fase 3: A3 Web Panel (React)
  Días 7-8: Dashboard + query input
  Días 8-9: Approval panel (list + detail)
  Día 9: Evidence viewer
  Día 10: E2E tests
```

## 7. Riesgos y Mitigaciones

| Riesgo                           | Probabilidad | Mitigación                                                    |
| -------------------------------- | ------------ | ------------------------------------------------------------- |
| NLP classifier muy impreciso     | Media        | Pattern matching first, AI fallback, clarificación automática |
| Approval gate lento por polling  | Baja         | Polling cada 30s, no bloquea otros pipelines                  |
| Web panel duplica lógica del CLI | Baja         | Ambos consumen misma API, shared types en packages/shared     |
| Contador no entiende la CLI      | Media        | Web panel first para estos usuarios, CLI para power users     |
