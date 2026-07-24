# SDD-009B — Context Lifecycle and Handoffs

**Estado:** DRAFT  
**Padre:** SDD-009 §6, §7, §8  
**Depende de:** SDD-009, SDD-009A  
**Informa:** SDD-009C, SDD-009D  
**Aplica a:** orquestador, subagentes de fase, mecanismo de delegación, skill registry

---

## 1. Propósito

Especificar la estructura de los context packs por fase, el protocolo de delegación y skill-injection verificable, el protocolo de compacción y recuperación de sesiones, y el formato de handoff entre orquestador y subagentes.

Este contrato es la implementación operativa de SDD-009 §§6-8. Consume los presupuestos definidos en SDD-009A (`AgentRuntimeBudget`) para garantizar que ningún context pack exceda su límite.

---

## 2. Interfaces principales

### 2.1 `ToolDefinition`

```typescript
interface ToolDefinition {
  name: string // nombre único de la herramienta
  description: string // descripción para el modelo
  parameters: Record<string, unknown> // JSON Schema de parámetros
}
```

### 2.2 `EvidenceBlock`

```typescript
interface EvidenceBlock {
  source: string // "test:unit" | "lint:eslint" | "tool:exec" | etc.
  status: 'passed' | 'failed' | 'warning' | 'info'
  summary: string // resumen legible (sin datos sensibles)
  detail: string | null // referencia a artifact, no contenido inline
  timestamp: string // ISO 8601
}
```

### 2.3 `ContextPackManifest`

```typescript
interface ContextPackManifest {
  role: AgentRuntimeBudget['role']
  phaseId: string // correlación con fase SDD
  sessionAffinityId: string // heredado de SDD-009A

  // Composición
  stablePrefix: {
    // SDD-009 §6.1, capas 1-3
    systemPrompt: string
    toolDefinitions: ToolDefinition[]
    skillRegistryPaths: string[] // SKILL.md seleccionados
    normativeContracts: string[] // IDs de secciones aplicables
  }

  dynamicContent: {
    // SDD-009 §6.1, capas 4-6
    taskInstruction: string // fase SDD específica
    affectedPaths: string[] // archivos del cambio
    recentEvidence: EvidenceBlock[] // outputs de herramientas, tests, lints
  }

  // Cumplimiento de presupuesto
  totalEstimatedTokens: number // estimación antes de enviar
  budget: AgentRuntimeBudget // presupuesto asignado
  withinBudget: boolean // validado por orquestador
}
```

````

### 2.4 `HandoffEnvelope`

```typescript
interface HandoffEnvelope {
  phaseId: string;
  fromRole: AgentRuntimeBudget['role'];
  toRole: AgentRuntimeBudget['role'];

  // Contexto transferido — mínimo viable
  contextPack: ContextPackManifest;    // manifest completo del remitente

  // Resultado de la fase anterior
  phaseResult: {
    status: 'completed' | 'failed' | 'escalated' | 'blocked';
    artifacts: string[];               // keys o paths de artifacts producidos
    skillResolution: 'paths-injected' | 'fallback-registry'
                    | 'fallback-path' | 'none';
    nextRecommended: string;           // próxima fase o acción
    risks: string[];                   // riesgos identificados
  };

  // Hito de compacción
  compactionCheckpoint: {
    lastCompactionAt: string | null;   // ISO 8601
    decisionsPersisted: boolean;
    skillRegistryReloaded: boolean;
  };

  // Integridad
  checksum: string;                    // hash del contenido del handoff
  timestamp: string;                   // ISO 8601
}
````

---

## 3. Normas

### B-REQ-001 — Context pack mínimo por fase

Cada fase SDD debe recibir exclusivamente el context pack especificado en SDD-009 §6.2. El orquestador debe construir el `ContextPackManifest` y verificar `withinBudget` antes de delegar.

| Fase    | Incluye en stablePrefix                    | Incluye en dynamicContent | Excluye                        |
| ------- | ------------------------------------------ | ------------------------- | ------------------------------ |
| explore | Skills relevantes + paths de búsqueda      | Task de exploración       | Contratos normativos completos |
| propose | SDD-005 gates + subcontrato C              | Task de propuesta         | Contexto técnico detallado     |
| spec    | Proposal + skills escritura                | Task de spec              | Compacción detallada           |
| design  | Proposal + spec + skills arquitectura      | Task de diseño            | Evidencia de tests             |
| tasks   | Spec + design                              | Task de desglose          | Contexto de ejecución          |
| apply   | Spec + design + tasks + archivos afectados | Task de implementación    | Historia de sesión             |
| verify  | Spec + tasks + diff real (fresco)          | Task de verificación      | Contexto de sesión previa      |
| archive | Todos los artifacts de fase                | Task de archive           | Trazas de ejecución            |

### B-REQ-002 — Orden del prompt

El prompt debe construirse en el orden de SDD-009 §6.1:

1. System prompt (identidad, reglas, formato).
2. Tool definitions (schemas completos).
3. Skill registry (SKILL.md seleccionados).
4. Contratos normativos (secciones aplicables de SDD-009 y subcontratos).
5. Tarea actual (instrucción específica de la fase).
6. Evidencia reciente (outputs de tools, resultados de tests/lints).
7. Instrucción final (próximo paso esperado, formato de respuesta).

Cualquier token variable (fechas, IDs, branch) debe ir al final de la capa 6 o en la capa 7. No debe aparecer en las capas 1-4.

### B-REQ-003 — Protocolo de delegación completo

Toda delegación debe seguir los 10 pasos de SDD-009 §8.1:

**Pre-delegación:**

1. Resolver skills relevantes desde `.atl/skill-registry.md`.
2. Inyectar paths de SKILL.md como bloque `## Skills to load before work`.
3. Incluir contratos normativos aplicables según nivel de autoridad.
4. Ensamblar context pack mínimo según B-REQ-001.
5. Validar `ContextPackManifest.withinBudget`.

**Delegación y verificación:**

1. Delegar ejecución al subagente.
2. Subagente lee skills antes de trabajar (fail si no hay skills inyectados).
3. Subagente ejecuta fase SDD.
4. Subagente guarda hallazgos importantes (`mem_save` u observación equivalente).
5. Subagente retorna resultado con `skillResolution` obligatorio.

### B-REQ-004 — Gate pre-delegación

Antes de delegar, el orquestador debe verificar:

- Skill registry accesible → si no, abortar y reportar error.
- Al menos un skill relevante → si no, continuar con advertencia.
- Contratos normativos inyectados → si no, inyectar antes de delegar.
- `ContextPackManifest.withinBudget === true` → si no, compactar o abortar.
- `sessionAffinityId` no duplicado → si hay colisión, generar nuevo ID.

### B-REQ-005 — Gate post-delegación

Al recibir el resultado, el orquestador debe verificar:

- `skillResolution` === `'paths-injected'` → si es `'fallback-*'` o `'none'`, re-ejecutar delegación con skills refrescados.
- Artifact de fase existe (en artifact store o filesystem).
- Contenido del artifact coherente con la tarea delegada (drift check).

Si cualquiera de estas verificaciones falla tras un reintento, el orquestador debe escalar a humano.

### B-REQ-006 — Compacción: antes y después

**Antes de compacción:**

1. Persistir decisiones activas a artifact SDD (`mem_save` o archivo).
2. Persistir estado del cambio (branch, staged, unstaged, commit actual).
3. Persistir evidencia de verify pendiente.
4. Marcar `compactionCheckpoint.decisionsPersisted = true`.

**Después de compacción:**

1. Re-leer skill registry desde `.atl/skill-registry.md`.
2. Re-inyectar reglas normativas activas.
3. Marcar `compactionCheckpoint.skillRegistryReloaded = true`.
4. Reanudar desde el último handoff completado.

### B-REQ-007 — Handoff mínimo verificable

El `HandoffEnvelope` es el mecanismo de transferencia entre fases. Debe contener solo el contexto necesario para la fase siguiente:

- El `contextPack` del remitente (para trazabilidad).
- El `phaseResult` con artifacts, status y riesgos.
- El `compactionCheckpoint` para saber si hubo compacción.
- Un `checksum` para detectar corrupción del handoff.

No debe transferir:

- Historial completo de la sesión anterior.
- Outputs de tools no relevantes para la fase siguiente.
- Trazas de errores de fases previas (solo riesgos resumidos).

### B-REQ-008 — Protocolo de recuperación

Si el orquestador detecta pérdida de contexto (compacción, error de delegación, timeout):

1. Leer artifacts SDD del cambio activo.
2. Leer estado de Git (branch, staged, unstaged, último commit).
3. Leer skill registry desde `.atl/skill-registry.md`.
4. Reconstruir prompt mínimo.
5. Continuar desde la última fase completada — no repetir fases anteriores.

Si los artifacts no existen o están corruptos, el orquestador debe escalar a humano.

### B-REQ-009 — Prohibiciones

- El subagente **no** decide qué skills cargar ni cuáles omitir.
- El subagente **no** modifica el skill registry.
- El subagente **no** salta el paso de lectura de skills.
- El orquestador **no** envía el contexto completo de la sesión como context pack.
- El orquestador **no** puede delegar sin verificar `withinBudget`.

---

## 4. Failure modes

| Modo                                      | Detección                                | Recuperación                                     |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| Skill registry inaccesible                | Read error en `.atl/skill-registry.md`   | Abortar delegación; escalar a humano             |
| Subagente reporta `skillResolution: none` | Gate post-delegación detecta             | Re-ejecutar paso 1-5; si persiste, escalar       |
| Context pack excede presupuesto           | `withinBudget === false`                 | Compactar o abortar delegación                   |
| Handoff corrupto                          | `checksum` no coincide                   | Reconstruir handoff desde artifacts              |
| Compacción pierde artifacts               | Artifact no encontrado post-compacción   | Reconstruir desde Git y últimos handoffs válidos |
| Subagente no retorna                      | Timeout del orquestador                  | Reiniciar subagente con mismo context pack       |
| Drift detectado en artifact               | Contenido no coincide con tarea delegada | Re-ejecutar fase; si persiste, escalar           |

---

## 5. Observabilidad

### 5.1 Señales obligatorias

| Señal                                                        | Destino            |         Sensible         |
| ------------------------------------------------------------ | ------------------ | :----------------------: |
| `ContextPackManifest` por delegación                         | Telemetría agentic | No (paths, no contenido) |
| `HandoffEnvelope` por transición de fase                     | Telemetría agentic |            No            |
| `skillResolution` por delegación                             | Telemetría agentic |            No            |
| Compacciones (antes/después) con `compactionCheckpoint`      | Telemetría agentic |            No            |
| Errores de delegación (timeout, skill loss, budget exceeded) | Log + alerta       |            No            |
| Drift detectado en artifact                                  | Log de auditoría   |            No            |

### 5.2 Lo que NO se registra

- Contenido de `stablePrefix.systemPrompt` ni `dynamicContent.taskInstruction`.
- Decisiones humanas de negocio.
- Secretos o datos fiscales en paths de archivos.

---

## 6. Privacidad

- Los paths de archivos en `affectedPaths` pueden revelar estructura del proyecto, pero no datos fiscales sensibles.
- `sessionAffinityId` no contiene identidad personal.
- Los artifacts SDD no contienen secretos por definición (SDD-009 §19).

---

## 7. Acceptance criteria

1. [ ] Cada fase tiene un `ContextPackManifest` conforme a SDD-009 §6.2 y B-REQ-001.
2. [ ] El prompt se construye en el orden especificado (capas 1-7).
3. [ ] El protocolo de delegación de 10 pasos es ejecutable y verificable.
4. [ ] `gate pre-delegación` bloquea delegaciones sin skills, sin presupuesto o sin contratos.
5. [ ] `gate post-delegación` detecta `skillResolution !== 'paths-injected'` y reintenta.
6. [ ] La compacción persiste decisiones, estado de Git y evidencia antes de compactar.
7. [ ] Post-compacción, el skill registry se recarga automáticamente.
8. [ ] El `HandoffEnvelope` contiene solo el contexto mínimo necesario para la fase siguiente.
9. [ ] El protocolo de recuperación reconstruye la sesión desde artifacts sin repetir fases.
10. [ ] Ninguna prohibición (B-REQ-009) puede ser violada por el agente.

---

## 8. Self-review

### Cobertura contra SDD-009

| SDD-009 §                    | Cubierto por                                                               |
| ---------------------------- | -------------------------------------------------------------------------- |
| §6.1 (estructura prompt)     | B-REQ-002; interfaz `ContextPackManifest.stablePrefix` y `.dynamicContent` |
| §6.2 (context packs)         | B-REQ-001; `ContextPackManifest.role`                                      |
| §6.3 (separación variable)   | B-REQ-002 (capas 6-7 para tokens variables)                                |
| §7.1 (compacción automática) | B-REQ-006                                                                  |
| §7.2 (riesgos compacción)    | B-REQ-006 (persistencia pre-compacción)                                    |
| §7.3 (mitigaciones)          | B-REQ-006, B-REQ-007                                                       |
| §7.4 (recuperación)          | B-REQ-008                                                                  |
| §8.1 (delegación 10 pasos)   | B-REQ-003                                                                  |
| §8.2 (gate pre-delegación)   | B-REQ-004                                                                  |
| §8.3 (gate post-delegación)  | B-REQ-005                                                                  |
| §8.4 (prohibiciones)         | B-REQ-009                                                                  |

### Cross-contract check

- Consume `AgentRuntimeBudget` (SDD-009A) para `ContextPackManifest.budget`.
- Produce `HandoffEnvelope` que es consumido por SDD-009C (para evaluar riesgo fiscal) y SDD-009D (para verificación).
- `HandoffEnvelope.phaseResult.skillResolution` es crítico para el gate post-delegación.

### Riesgos abiertos

1. **El drift check en B-REQ-005** requiere una definición operativa de "coherencia". Durante implementación inicial puede ser una heurística simple (checklist de keywords).
2. **El protocolo de recuperación (B-REQ-008)** asume que los artifacts SDD existen y son legibles. Si Engram no está disponible, la recuperación requiere intervención humana.

---

**Última actualización:** 2026-07-14  
**Estado:** DRAFT  
**Próximo paso:** Revisión humana → aprobación → inicio de SDD-009C
