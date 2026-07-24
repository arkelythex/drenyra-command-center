# SDD-009A — Runtime Economics and Prefix Caching

**Estado:** DRAFT  
**Padre:** SDD-009 §4, §5, §17.1  
**Depende de:** SDD-009  
**Informa:** SDD-009B, SDD-009C, SDD-009D, SDD-093  
**Aplica a:** orquestador, subagentes, pipes de telemetría, configuración de OpenCode y Workers AI

---

## 1. Propósito

Especificar la economía de tokens, la estrategia de prefix caching, la configuración de session affinity, la medición de `cached_tokens`, el cálculo de costos y el comportamiento ante cache miss para toda ejecución agentic bajo SDD-009.

Este contrato no define cómo se estructura el prompt (eso es competencia de SDD-009B) ni cuándo se aplican límites de costo (SDD-009D). Define **cuánto cuesta, cómo se mide y cómo se optimiza** cada operación.

---

## 2. Interfaces principales

### 2.1 `AgentRuntimeBudget`

```typescript
interface AgentRuntimeBudget {
  role:
    | 'orchestrator'
    | 'explore'
    | 'propose'
    | 'spec'
    | 'design'
    | 'tasks'
    | 'apply'
    | 'verify'
    | 'review'
    | 'archive'

  // Contexto — SDD-009 §5.2
  contextLimitTokens: number // máximo de contexto para este rol
  outputLimitTokens: number // máximo de output para este rol

  // Umbrales — SDD-009 §5.1
  warningThresholdTokens: number // 70% — iniciar poda
  compactionThresholdTokens: number // 80% — compactar antes de continuar
  reserveTokens: number // 16K mínimo — respuesta + herramientas

  // Costo — SDD-009 §17.1
  costSoftWarningUsd: number // alerta sin interrupción
  costHardPauseUsd: number // pausa obligatoria
  modelPricing: ModelPricing // precios del modelo activo

  // Cache
  sessionAffinityId: string // x-session-affinity dinámico
  responseCacheEnabled: boolean // false para SDD/código/review
}
```

### 2.2 `CacheObservation`

```typescript
interface CacheObservation {
  phaseId: string // correlación con fase SDD
  role: AgentRuntimeBudget['role']
  timestamp: string // ISO 8601

  // Tokens — REQUIRED WHEN OBSERVABLE
  promptTokens: number // total de tokens de entrada
  cachedTokens: number | 'UNOBSERVABLE' // tokens cacheados, si la API lo expone
  completionTokens: number // tokens de salida

  // Timing
  ttftMs: number // time to first token
  tokensPerSecond: number // tasa de generación

  // Costo — calculado internamente
  costNormalInputUsd: number // prompt no cacheados × precio input
  costCachedInputUsd: number // cached_tokens × precio cached
  costOutputUsd: number // completion × precio output
  costTotalUsd: number // suma de los tres

  // Cache hit rate
  cacheHitRatio: number | 'UNOBSERVABLE' // cached / prompt (si observable)

  // Error
  error: string | null // timeout, parse error, API error
}
```

### 2.3 `ModelPricing`

```typescript
interface ModelPricing {
  modelId: string // "@cf/zai-org/glm-5.2"
  provider: 'cloudflare-workers-ai'
  inputUsdPerMToken: number // $1.40 para GLM 5.2
  cachedInputUsdPerMToken: number // $0.26 para GLM 5.2
  outputUsdPerMToken: number // $4.40 para GLM 5.2
  contextWindowTokens: number // 262_144 (capacidad máxima)
  operationalLimitTokens: number // 128_000 (límite operativo SDD-009)
}
```

---

## 3. Normas

### A-REQ-001 — Presupuesto contextual por rol

Cada rol debe tener un `AgentRuntimeBudget` cuyos límites de contexto y output cumplan SDD-009 §5.2. El orquestador debe validar que el subagente no excede su presupuesto antes de delegar.

> **Verificación:** El orquestador rechaza una delegación cuyo context pack exceda `contextLimitTokens` del rol destino.

### A-REQ-002 — Umbrales de advertencia y compacción

Cuando el consumo del orquestador alcanza `warningThresholdTokens` (70%, 89K), debe:

1. Persistir decisiones activas a artifact SDD.
2. Podar outputs obsoletos del historial.
3. Registrar la acción en telemetría.

Al alcanzar `compactionThresholdTokens` (80%, 102K), debe además:

1. Forzar compacción inmediata.
2. No expandir contexto nuevo hasta completar la compacción.
3. Re-leer skill registry post-compacción.

### A-REQ-003 — Reserva mínima garantizada

El orquestador debe mantener `reserveTokens` (16K) disponibles en todo momento para respuesta del modelo, herramientas activas y recuperación ante fallo. Si la reserva no puede garantizarse, el orquestador debe detener la expansión de contexto y compactar inmediatamente.

### A-REQ-004 — Session affinity dinámico

Cada sesión agentic debe usar un `sessionAffinityId` único y no reutilizado. Formato:

- Orquestador: `session-agentic-{session_id}`
- Subagente de fase: `session-agentic-{session_id}-{phase}`
- Reviewer nativo: `session-agentic-{session_id}-review`

**Prohibido** usar un valor global estático. El ID debe generarse por sesión, no por branch, tarea o usuario.

### A-REQ-005 — Response caching desactivado para SDD y código

`responseCacheEnabled` debe ser `false` para toda ejecución SDD (`apply`, `verify`, `review`) y para cualquier operación que modifique o revise código. Solo puede activarse para consultas explícitamente inmutables: documentación, reference lookup, drafts sin retroalimentación de tools.

### A-REQ-006 — cached_tokens: REQUIRED WHEN OBSERVABLE

Todo subcontrato y componente que consuma la API debe:

1. Intentar leer `cached_tokens` desde `usage` de la respuesta.
2. Si está disponible → registrar en `CacheObservation.cachedTokens`.
3. Si no está disponible → marcar `'UNOBSERVABLE'`.
4. **No inventar ni simular** valores de cache hit.

### A-REQ-007 — Costo separado por tipo de token

El costo total debe calcularse separando:

- Input normal: `(promptTokens - cachedTokens) × inputUsdPerMToken / 1_000_000`
- Cached input: `cachedTokens × cachedInputUsdPerMToken / 1_000_000`
- Output: `completionTokens × outputUsdPerMToken / 1_000_000`

La telemetría debe exponer los tres componentes por separado.

### A-REQ-008 — Prohibición de cambio silencioso de modelo

Ninguna capa del sistema puede cambiar de modelo o proveedor sin registro explícito en telemetría y sin actualizar `ModelPricing`. Un cambio silencioso que evada límites de costo constituye una violación de SDD-009 I08.

### A-REQ-009 — Cache miss no es fallo

El sistema debe operar correctamente con 0% cache hits. Un cache miss completo (`cachedTokens = 0` o `'UNOBSERVABLE'`) no debe alterar el comportamiento funcional ni bloquear la ejecución. Solo debe registrarse en telemetría.

### A-REQ-010 — Prefijo estable precede al contenido dinámico

El orden del prompt debe ser: system prompt → herramientas → skill registry → contratos normativos → tarea actual → evidencia reciente. Cualquier token variable (fechas, IDs, branch) debe ir al final del bloque dinámico, no en el prefijo estable. Una inversión de este orden que perjudique el cache hit rate constituye una violación de este contrato.

---

## 4. Failure modes

| Modo                             | Detección                                   | Recuperación                                                      |
| -------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| API timeout (>30s)               | Tiempo de respuesta excede umbral           | Reintentar con backoff exponencial (máx 3); si persiste, escalar  |
| cached_tokens no disponible      | `usage.cached_tokens` ausente en respuesta  | Marcar `'UNOBSERVABLE'`; continuar normalmente                    |
| Costo excede soft warning        | `costTotalUsd > costSoftWarningUsd`         | Registrar alerta; notificar sin interrumpir                       |
| Costo excede hard pause          | `costTotalUsd > costHardPauseUsd`           | Pausar fase; escalar a humano con reporte de costo                |
| Session affinity duplicado       | Dos sesiones activas con mismo ID           | Detectar colisión; generar nuevo ID; registrar incidente          |
| Response caching activo en apply | Configuración incorrecta en AI Gateway      | Bloquear ejecución; escalar; requerir corrección de configuración |
| Precio de modelo desactualizado  | `ModelPricing` no coincide con factura real | Actualizar pricing; recalcular límites de costo                   |

---

## 5. Observabilidad

### 5.1 Señales obligatorias por fase

| Señal                                                  | Destino            | Sensible |
| ------------------------------------------------------ | ------------------ | :------: |
| `AgentRuntimeBudget` activo por rol                    | Telemetría agentic |    No    |
| `CacheObservation` por request                         | Telemetría agentic |    No    |
| Costo por componente (normal/cached/output)            | Telemetría agentic |    No    |
| Cache hit ratio por sesión                             | Dashboard agregado |    No    |
| Alertas de umbral (70%, 80%, soft warning, hard pause) | Log + notificación |    No    |
| Cambios de modelo o proveedor                          | Log de auditoría   |    No    |

### 5.2 Lo que NO se registra

- Contenido del prompt o completión.
- Secretos, tokens de API, RUCs, montos fiscales.
- Identidad del usuario (solo rol y session ID).

---

## 6. Privacidad

Conforme a SDD-009 §19 y SDD-090:

- `sessionAffinityId` no contiene información de identidad personal.
- Los costos se agregan por fase y rol, no por request individual que pueda contener datos sensibles.
- `ModelPricing` no expone claves de API ni credenciales.

---

## 7. Acceptance criteria

1. [ ] Cada rol tiene un `AgentRuntimeBudget` conforme a SDD-009 §5.2.
2. [ ] El orquestador valida el presupuesto antes de delegar; rechaza si excede.
3. [ ] Los umbrales 70%/80% disparan las acciones correctas (poda, compacción, persistencia).
4. [ ] `sessionAffinityId` es único por sesión y sigue el formato especificado.
5. [ ] `responseCacheEnabled` es `false` para todas las fases SDD.
6. [ ] `cached_tokens` se marca `'UNOBSERVABLE'` cuando la API no lo expone; nunca se simula.
7. [ ] El costo se calcula separando input normal, cached input y output.
8. [ ] El sistema funciona correctamente con 0% cache hits.
9. [ ] Un cambio silencioso de modelo queda bloqueado por el orquestador.
10. [ ] El prefijo estable antecede al contenido dinámico en toda delegación.

---

## 8. Self-review

### Cobertura contra SDD-009

| SDD-009 §                   | Cubierto por                                                        |
| --------------------------- | ------------------------------------------------------------------- |
| §4.1 (principios caching)   | A-REQ-004, A-REQ-006, A-REQ-009                                     |
| §4.2 (prefijo estable)      | A-REQ-010                                                           |
| §4.3 (session affinity)     | A-REQ-004; interfaz `AgentRuntimeBudget.sessionAffinityId`          |
| §4.4 (response caching)     | A-REQ-005; interfaz `AgentRuntimeBudget.responseCacheEnabled`       |
| §5.1 (umbrales)             | A-REQ-002, A-REQ-003                                                |
| §5.2 (presupuesto por fase) | A-REQ-001; interfaz `AgentRuntimeBudget`                            |
| §15.1 (cached_tokens)       | A-REQ-006; interfaz `CacheObservation.cachedTokens`                 |
| §17.1 (costos)              | A-REQ-007, A-REQ-008; interfaces `CacheObservation`, `ModelPricing` |
| §19 (privacidad)            | §6 de este contrato                                                 |

### Cross-contract check

- `AgentRuntimeBudget` es consumido por SDD-009B (context packs deben respetar `contextLimitTokens`).
- `CacheObservation` es consumido por SDD-009D (verificación y telemetría).
- `ModelPricing` no depende de ningún subcontrato.

### Riesgos abiertos

1. **OpenCode puede no exponer `usage.cached_tokens`:** si la integración actual de OpenCode con Workers AI no expone este campo, la señal quedará permanentemente como `UNOBSERVABLE`. Habrá que verificar durante implementación.
2. **Los precios de GLM 5.2 pueden cambiar:** `ModelPricing` debe actualizarse si Cloudflare modifica sus tarifas. El mecanismo de actualización se define en SDD-009D (recalibración cada 10 runs).

---

**Última actualización:** 2026-07-14  
**Estado:** DRAFT  
**Próximo paso:** Revisión humana → aprobación → inicio de SDD-009B
