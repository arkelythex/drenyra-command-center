# SDD-009D — Verification, Receipts and Improvement Loop

**Estado:** DRAFT  
**Padre:** SDD-009 §13, §15, §16, §17, §18, §19, §20  
**Depende de:** SDD-009, SDD-009A, SDD-009B, SDD-009C  
**Informa:** SDD-091, SDD-093  
**Aplica a:** receipt lifecycle, telemetría agentic, evals, límites operativos, failure modes, privacidad, rollout

---

## 1. Propósito

Especificar el lifecycle del receipt, la verificación de runs completos, los evals de prompts/skills/handoffs/runs, los límites operativos con baseline y recalibración, los failure modes con recuperación, la privacidad de la telemetría agentic, y el rollout incremental con criterios de aceptación.

Este contrato cierra el ciclo: define cómo se mide la calidad de la ejecución agentic, cómo se vinculan los receipts al contenido, cómo se evalúa y mejora el sistema, y cómo se despliega incrementalmente.

---

## 2. Interfaces principales

### 2.1 `VerificationEnvelope`

```typescript
interface VerificationEnvelope {
  phaseId: string // correlación con fase SDD
  candidateId: string // ID del candidato congelado

  // Receipt — Gentle AI staged projection
  receipt: {
    hash: string // hash del staged projection
    contentSnapshot: string // referencia al snapshot (no el contenido)
    generatedAt: string // ISO 8601
    validForCandidateId: string // debe coincidir con candidateId
    validForGitIndex: boolean // verificado contra el índice actual
    historical: boolean // true si es un receipt previo, no activo
  }

  // Resultados de verificación
  verificationResults: {
    unitTestsPassed: boolean
    lintPassed: boolean
    typecheckPassed: boolean
    fiscalLintPassed: boolean | null // null si no aplica
    classifierCheck: RiskDecision | null // del subcontrato C
    iterationCount: number // intentos de repair
    finalStatus: 'passed' | 'escalated' | 'blocked'
  }

  // Costo
  cost: CacheObservation // del subcontrato A

  // Autorización humana (solo R2)
  humanAuth: {
    required: boolean
    present: boolean
    authorizedAt: string | null
    candidateId: string | null
  } | null

  // Integridad
  checksum: string // hash del envelope completo
}
```

### 2.2 `AgentRunEvidence`

```typescript
interface AgentRunEvidence {
  sddChangeId: string // ID del cambio SDD
  sddPhaseSequence: string[] // fases ejecutadas en orden

  // Fases
  phases: Array<{
    phase: AgentRuntimeBudget['role']
    handoff: HandoffEnvelope // del subcontrato B
    verification: VerificationEnvelope
    cacheObservation: CacheObservation
    startTime: string
    endTime: string
    durationMs: number
    error: string | null
  }>

  // Métricas agregadas
  totalCostUsd: number
  totalPromptTokens: number
  totalCachedTokens: number | 'UNOBSERVABLE'
  totalCompletionTokens: number
  totalDurationMs: number
  totalIterations: number
  escalationCount: number
  humanAuthCount: number

  // Evaluación del run
  eval: {
    passed: boolean // todos los criterios de §16.2
    failedCriteria: string[] // criterios que fallaron
    risks: string[] // riesgos identificados
    recommendedActions: string[] // mejora continua
  }

  // Privacidad — check
  privacyCheck: {
    secretsDetected: boolean
    fiscalDataDetected: boolean
    piiDetected: boolean
    blocked: boolean // true si el detector bloqueó algo
  }

  // Rollout metadata
  runNumber: number // número de run (1-based)
  isBaselineRun: boolean // true si run ≤ 5
}
```

---

## 3. Normas

### D-REQ-001 — Receipt vinculado al staged projection

El receipt debe generarse mediante Gentle AI sobre el **staged projection** — el contenido que Git vería si se commitea en ese momento. El receipt contiene un hash del contenido, no solo del mensaje o metadatos.

- `receipt.hash` = hash del staged projection.
- `receipt.validForCandidateId` debe coincidir con `candidateId` del loop actual.
- `receipt.validForGitIndex` debe verificarse contra el índice de Git en el momento del commit.

### D-REQ-002 — Receipt inmutabilidad y corrección

- Un receipt es válido exclusivamente para el contenido sobre el que se generó.
- Cualquier cambio posterior en los archivos staged invalida el receipt (`validForGitIndex = false`).
- El receipt histórico permanece en `AgentRunEvidence` pero `receipt.historical = true`.
- Corrección: reparar código → re-ejecutar native review → nuevo receipt → nuevo `candidateId`.

### D-REQ-003 — Sin caducidad temporal inventada

El receipt no expira por tiempo. No hay "30 minutos de validez". El receipt es válido mientras el contenido del staged projection no cambie. Si el contenido cambia, el receipt se invalida por contenido diferente, no por tiempo.

La autorización humana en R2 tampoco expira por tiempo. Se invalida si el candidato cambia.

### D-REQ-004 — Receipt + autorización humana = evidencia completa en R2

Para cambios R2, la evidencia completa del commit es:

- `VerificationEnvelope.receipt` (prueba de que el contenido fue revisado por native review).
- `VerificationEnvelope.humanAuth` (prueba de autorización humana para el candidato exacto).
- `RiskDecision` (prueba de que el clasificador identificó correctamente el nivel).

### D-REQ-005 — Eval de runs completos

Cada run completo de SDD debe evaluarse contra los criterios de SDD-009 §16.2:

1. Todos los artifacts de fase existen y son coherentes.
2. El verify pasa en ≤ 3 iteraciones (o ESCALATED documentado).
3. El receipt es válido y está vinculado al contenido commitado.
4. Para R2: hubo autorización humana fresca para el candidato exacto.
5. Costo total dentro del presupuesto estimado ±20%.
6. Sin errores de API ni degradación por compacción que requirieran intervención humana.

Si algún criterio falla, `AgentRunEvidence.eval.passed = false` y `failedCriteria` lista los incumplidos.

### D-REQ-006 — Baseline y recalibración de costos

Primeros 5 runs:

- `isBaselineRun = true`.
- `costSoftWarningUsd` activa alerta sin interrupción.
- `costHardPauseUsd` solo para runaway (>$5 sin señales de completitud).
- Registrar p50/p75/p95 por fase.

A partir del run 6:

- Recalibrar `costSoftWarningUsd` y `costHardPauseUsd` con p75 + 20% de los primeros 5 runs.
- Recalibración cada 10 runs o cuando se añada un proveedor nuevo.
- `isBaselineRun = false`.

### D-REQ-007 — Telemetría: cached_tokens REQUIRED WHEN OBSERVABLE

- `CacheObservation.cachedTokens` debe ser `number` cuando la API expone `usage.cached_tokens`.
- Si no está disponible, debe ser exactamente `'UNOBSERVABLE'` — no se simula, no se infiere.
- `totalCachedTokens` en `AgentRunEvidence` sigue la misma regla.
- Cache hit rate se calcula solo cuando `cachedTokens` es observable.

### D-REQ-008 — Detección de secretos en telemetría

`AgentRunEvidence.privacyCheck` debe ejecutarse al finalizar cada run:

- `secretsDetected`: true si algún detector pre-request (SDD-009C §19.2) se activó.
- `fiscalDataDetected`: true si se identificaron patrones fiscales sensibles en inputs.
- `piiDetected`: true si se detectaron patrones de PII.
- `blocked`: true si el detector bloqueó algún request.

Si `blocked === true`, el run se marca como fallido y requiere revisión humana.

### D-REQ-009 — Privacidad de telemetría

Conforme a SDD-009 §19 y SDD-090:

- `AgentRunEvidence` no contiene contenido fiscal sensible.
- `CacheObservation` no contiene contenido del prompt.
- `VerificationEnvelope.receipt.contentSnapshot` es una referencia (hash), no el contenido.
- Las autorizaciones humanas registran rol/pseudónimo, no identidad personal.
- Los correlation IDs son únicos por sesión pero no vinculan a identidad externa.

### D-REQ-010 — Failure modes documentados y recuperables

Todos los failure modes de SDD-009 §18.1 deben tener implementación documentada:

| Modo                       | Recuperación en D                                                  |
| -------------------------- | ------------------------------------------------------------------ |
| API timeout                | CacheObservation.error = timeout; reintentar; si persiste, escalar |
| Cache miss total           | Continuar; registrar en CacheObservation                           |
| Skill loss post-compaction | Registrar en HandoffEnvelope.compactionCheckpoint; re-ejecutar     |
| Clasificador no disponible | FiscalGateResult.action = block; escalar                           |
| Verify loop > 3            | VerificationEnvelope.finalStatus = escalated                       |
| Subagente no retorna       | HandoffEnvelope.phaseResult.status = failed; reintentar            |
| Diff > 400 líneas          | RiskDecision.diffStats; bloquear; requerir división                |
| Error de Git               | VerificationEnvelope.error = descripción; escalar                  |
| Secreto detectado          | PrivacyCheck.blocked = true; run fallido                           |

### D-REQ-011 — Escape hatch en cualquier punto

El humano puede interrumpir, desactivar autonomía o tomar control manual del branch en cualquier punto del run. El orquestador debe responder a la señal de interrupción dentro de 5 segundos y detener toda actividad agentic hasta nueva instrucción.

### D-REQ-012 — Rollback con revert

Si un commit resulta incorrecto:

1. Identificar por `VerificationEnvelope.receipt.hash` o commit hash.
2. `git revert <hash>` — el revert sigue el mismo flujo (clasificador, review, receipt).
3. El commit de revert tiene su propio `VerificationEnvelope` y `candidateId`.
4. No se usa `git reset --hard` remoto.

### D-REQ-013 — Rollout incremental con gates de avance

Las fases de rollout siguen SDD-009 §20.1. Cada fase tiene un gate de avance verificable:

| Fase                    | Gate                                                  | Evidencia                             |
| ----------------------- | ----------------------------------------------------- | ------------------------------------- |
| F1 — Documentación      | Subcontratos A-D redactados y aprobados               | Approval humano                       |
| F2 — Clasificador       | 20 tests (10 pos, 10 neg) pasan; inventario validado  | Test report + `rg --files` validation |
| F3 — Hook pre-commit    | Hook bloquea R2 sin auth; permite R0/R1 con receipt   | Test de integración                   |
| F4 — Context packs      | 10 delegaciones con skill_resolution = paths-injected | Telemetría                            |
| F5 — Loop R0/R1         | 3 SDDs sin error ni intervención humana               | AgentRunEvidence                      |
| F6 — R2 pausa humana    | 3 SDDs con autorización humana correcta               | AgentRunEvidence + humanAuth          |
| F7 — Telemetría y evals | Señales completas; evals pasan                        | Dashboard + eval report               |
| F8 — Producción         | 2 semanas sin incidentes de autoridad fiscal          | Log de auditoría                      |

---

## 4. Failure modes específicos de D

| Modo                                              | Detección                                      | Recuperación                                       |
| ------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Receipt hash no coincide con staged projection    | `validForGitIndex === false` en hook           | Re-ejecutar staged review                          |
| Evals detectan run fallido pero commit ya ocurrió | `AgentRunEvidence.eval.passed === false`       | Registrar; escalar a humano para revisión post-hoc |
| Telemetría no registra señal obligatoria          | Señal ausente en `AgentRunEvidence`            | Registrar warning; no bloquea el run               |
| Recalibración sin datos suficientes (< 5 runs)    | `totalRuns < 5`                                | Usar límites por defecto; no recalibrar            |
| Detector de secretos falso positivo               | `privacyCheck.blocked = true` sin secreto real | Escalar; revisar patrón del detector               |
| Rollout gate no se cumple                         | Criterio de avance no verificado               | No avanzar a siguiente fase; escalar               |

---

## 5. Observabilidad

### 5.1 Señales obligatorias

| Señal                                                 | Destino                  |        Sensible         |
| ----------------------------------------------------- | ------------------------ | :---------------------: |
| `VerificationEnvelope` por commit                     | Telemetría agentic       | No (hash, no contenido) |
| `AgentRunEvidence` por SDD completado                 | Almacén de evals         |           No            |
| Receipt lifecycle (generado, invalidado, re-generado) | Log de auditoría         |           No            |
| Iteraciones por candidato congelado                   | Telemetría agentic       |           No            |
| Costo por fase (baseline vs. recalibrado)             | Dashboard                |           No            |
| Evals (passed/failed criteria)                        | Dashboard + notificación |           No            |
| Privacy check por run                                 | Log de auditoría         |           No            |
| Rollout fase actual y gate status                     | Dashboard de rollout     |           No            |

### 5.2 Lo que NO se registra

- Contenido del diff o del staged projection.
- Secretos o datos fiscales sensibles.
- Identidad personal del autorizante.
- Prompts completos (solo métricas agregadas).

---

## 6. Privacidad

- `AgentRunEvidence` no exporta datos fuera del almacén de telemetría agentic.
- Los receipts históricos contienen hashes, no contenido reversible.
- `privacyCheck` solo registra detección booleana, no el contenido detectado.
- Revisión humana post-hoc de runs fallidos no expone datos fiscales.

---

## 7. Acceptance criteria

1. [ ] El receipt se genera sobre el staged projection de Gentle AI, no sobre metadata.
2. [ ] Un receipt es inválido si el contenido staged cambia.
3. [ ] No existe caducidad temporal del receipt — solo invalidación por cambio de contenido.
4. [ ] En R2, el commit requiere receipt + autorización humana; ambos son vinculantes.
5. [ ] Los primeros 5 runs operan en modo baseline con alertas, no hard pauses.
6. [ ] A partir del run 6, los límites se recalibran con p75 + 20%.
7. [ ] `cached_tokens` se marca `UNOBSERVABLE` si la API no lo expone.
8. [ ] `privacyCheck` se ejecuta al finalizar cada run y bloquea si detecta secretos.
9. [ ] Todos los failure modes tienen implementación de recuperación documentada.
10. [ ] El escape hatch detiene la ejecución en <5 segundos.
11. [ ] Rollout progresa por fases con gates de avance verificables.
12. [ ] Cada run produce un `AgentRunEvidence` completo y evaluable.

---

## 8. Self-review

### Cobertura contra SDD-009

| SDD-009 §               | Cubierto por                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| §13 (receipt lifecycle) | D-REQ-001 a D-REQ-004                                            |
| §15 (observabilidad)    | D-REQ-007; interfaces `VerificationEnvelope`, `AgentRunEvidence` |
| §16 (evals)             | D-REQ-005                                                        |
| §17 (límites)           | D-REQ-006                                                        |
| §18 (failure modes)     | D-REQ-010, D-REQ-011, D-REQ-012                                  |
| §19 (privacidad)        | D-REQ-008, D-REQ-009                                             |
| §20 (rollout)           | D-REQ-013                                                        |

### Cross-contract check

- `VerificationEnvelope` consume `RiskDecision` (SDD-009C), `CacheObservation` (SDD-009A), `HandoffEnvelope` (SDD-009B).
- `AgentRunEvidence` agrega todas las observaciones en una estructura evaluable.
- Compatibilidad de tipos:
  - `VerificationEnvelope.cost: CacheObservation` → de SDD-009A.
  - `VerificationEnvelope.verificationResults.classifierCheck: RiskDecision | null` → de SDD-009C.
  - `AgentRunEvidence.phases[].handoff: HandoffEnvelope` → de SDD-009B.
- Sin conflictos de nomenclatura ni tipos duplicados.

### Cross-contract consistency (A–D)

| Concepto               | A      | B                           | C                             | D                                 |
| ---------------------- | ------ | --------------------------- | ----------------------------- | --------------------------------- |
| `sessionAffinityId`    | Define | Usa (heredado)              | —                             | —                                 |
| `AgentRuntimeBudget`   | Define | Usa (`ContextPackManifest`) | Usa (`RiskDecision` costos)   | Usa (`VerificationEnvelope.cost`) |
| `AuthorityLevel`       | —      | —                           | Define (`RiskDecision.level`) | Usa                               |
| `HandoffEnvelope`      | —      | Define                      | Produce (risks)               | Consume                           |
| `RiskDecision`         | —      | —                           | Define                        | Consume (`classifierCheck`)       |
| `CacheObservation`     | Define | —                           | —                             | Consume (`cost`)                  |
| `VerificationEnvelope` | —      | —                           | —                             | Define                            |
| `AgentRunEvidence`     | —      | —                           | —                             | Define                            |

### Riesgos abiertos

1. **Integración con Gentle AI staged projection:** el mecanismo exacto de la API de Gentle AI para obtener el hash del staged projection debe verificarse durante implementación. Si la API no expone el hash directamente, puede ser necesario calcularlo localmente.
2. **Recalibración automática:** el proceso de recalibrar límites requiere acceso al histórico de runs. Si Engram no persiste el histórico, la recalibración deberá usar el artifact store de OpenSpec.
3. **Privacy check en run completo:** detectar secretos y datos fiscales requiere un script de análisis que puede no cubrir todos los patrones. Debe iterarse durante las primeras fases de rollout.

---

**Última actualización:** 2026-07-14  
**Estado:** DRAFT  
**Próximo paso:** Revisión humana → approval integrado A-D → plan de implementación TDD
