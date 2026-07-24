# SDD-009C — Autonomous Authority and Fiscal Risk

**Estado:** DRAFT  
**Padre:** SDD-009 §2, §3, §9, §10, §11, §12, §14  
**Depende de:** SDD-009, SDD-009A, SDD-009B  
**Informa:** SDD-009D, SDD-019, SDD-020, SDD-091  
**Aplica a:** clasificador fiscal, hook pre-commit, loop apply→verify→repair, gates humanos, staging limitado

---

## 1. Propósito

Especificar el clasificador fiscal determinista, los niveles de autoridad R0-R3, la matriz de operaciones, el loop autónomo apply→verify→repair, el flujo fiscal R2 con pausa humana, el contrato del hook pre-commit, el staging limitado y los gates humanos.

Este contrato es la implementación operativa de SDD-009 §§2-3, 9-12, 14. Define **quién puede hacer qué, cómo se determina el nivel de riesgo y cómo se ejecuta el loop autónomo**.

---

## 2. Interfaces principales

### 2.1 `RiskDecision`

```typescript
type AuthorityLevel = 'R0' | 'R1' | 'R2' | 'R3'

interface RiskDecision {
  level: AuthorityLevel
  classifierVersion: string // versión de la config del clasificador
  matchedPaths: string[] // rutas clasificadas como R2
  matchedContentPatterns: string[] // patrones detectados en el diff
  blocked: boolean // true = gate bloquea la operación

  // Evaluación
  evaluatedAt: string // ISO 8601
  diffStats: {
    addedLines: number
    modifiedFiles: number
    renamedFiles: string[]
    deletedFiles: string[]
    generatedFiles: string[]
  }

  // Autoridad — operaciones condicionadas
  requiresHumanAuth: boolean // true para R2 y R3
  humanAuthPresent: boolean // false hasta autorización
  humanAuthExpired: boolean // false si es para el mismo candidato
  humanAuthValidFor: string | null // candidateId si hay autorización activa

  // Modo fail-closed
  classificationAmbiguous: boolean // true si el clasificador no pudo determinar
  failClosed: boolean // true = asumió R2 por ambigüedad

  // Evidencia
  reason: string // explicación legible
  configSource: string // ruta al archivo de configuración
}
```

### 2.2 `FiscalGateResult`

```typescript
interface FiscalGateResult {
  gate: 'pre-commit' | 'pre-delegation' | 'staged-review'
  decision: RiskDecision

  // Receipt
  receiptPresent: boolean
  receiptHash: string | null // hash del staged projection
  receiptValidForCandidate: boolean // el receipt coincide con el contenido actual

  // Autorización humana (solo R2)
  humanAuth: {
    required: boolean
    present: boolean
    authorizedBy: string | null // rol o pseudónimo
    authorizedAt: string | null // ISO 8601
    candidateId: string | null // ID del candidato autorizado
  }

  // Resultado
  action: 'allow' | 'block' | 'escalate'
  outputMessage: string // mensaje para el humano (hook output)
}
```

---

## 3. Normas

### C-REQ-001 — Clasificador determinista, no delegado al modelo

La clasificación de riesgo fiscal debe ser realizada exclusivamente por un script determinista sobre el diff real. Ningún prompt, skill o instrucción textual puede declarar "esto no es fiscal" como autoridad para omitir el gate. El clasificador nunca consulta al modelo de lenguaje para determinar el nivel.

> **Verificación:** El clasificador puede ejecutarse sin conexión a API. No requiere modelo de lenguaje para funcionar.

### C-REQ-002 — Configuración versionada y extensible

El clasificador debe leer paths y patterns desde un archivo de configuración versionado (YAML o JSON) dentro del repositorio. Modificar la configuración requiere revisión humana (es un cambio R2 por afectar el comportamiento del gate). El archivo debe incluir:

- `version`: semver del esquema de clasificación.
- `paths`: lista de glob patterns para clasificación por ruta.
- `contentPatterns`: lista de regex patterns para clasificación por contenido del diff.
- `fallbackLevel`: nivel por defecto cuando la clasificación es ambigua (R2).
- `excludedPaths`: paths que nunca deben clasificarse como R2 (documentación, assets).

### C-REQ-003 — Clasificación por paths + contenido + rename/delete/generated

El clasificador debe examinar tres dimensiones:

1. **Paths:** archivos en rutas configuradas en la configuración (bootstrap inicial validado contra `rg --files`, imports y grafo de dependencias).
2. **Contenido del diff:** líneas añadidas/modificadas que contengan patrones configurados (tasas, RUC, IGV, SUNAT, tenant scope, idempotencia, etc.).
3. **Metadatos del diff:** archivos renombrados, eliminados y generados que puedan indicar cambio fiscal material aunque el path final no esté en la lista.

### C-REQ-004 — Fail-closed

Si el clasificador no puede determinar el nivel (error de parseo, archivo nuevo en ruta no clasificada, patrón ambiguo, configuración faltante), debe **asumir R2** y marcar `classificationAmbiguous: true`, `failClosed: true`. Es preferible una pausa humana innecesaria a un commit fiscal sin revisión.

### C-REQ-005 — Tests positivos, negativos y de límite

El clasificador debe tener:

- **Tests positivos:** cambios que DEBEN clasificar como R2 con razones documentadas.
- **Tests negativos:** cambios que NO DEBEN clasificar como R2 (UI, refactors seguros, documentación).
- **Tests de límite:** archivos nuevos en rutas no clasificadas, renombres fuera de la lista, ambigüedad controlada.
- **Tests de regresión:** cada vez que se modifique la configuración, todos los tests anteriores deben pasar.

### C-REQ-006 — Loop apply→verify→repair por candidato congelado

El loop autónomo sigue SDD-009 §9.1-9.4 con estas reglas operativas:

1. **Candidato congelado:** el conjunto de archivos, diff y alcance aprobado en la última planificación. Cambiar de subagente no reinicia el contador.
2. **Máximo 3 iteraciones** de apply→verify→repair por candidato congelado. La cuarta iteración produce `ESCALATED`.
3. **Escalado anticipado:** si el mismo fallo se repite 2 veces, escalar inmediatamente sin esperar a la tercera iteración.
4. **Cambio de alcance:** si la reparación requiere modificar archivos fuera del candidato original, el candidato queda invalidado y se requiere nueva planificación y review. El contador no se traslada.
5. **ESCALATED** es el único estado terminal del loop agotado. Nunca se permite "best effort approved" ni commit sin verify.

### C-REQ-007 — Flujo R2: pausa humana antes del commit

Para contenido R2:

1. apply → verify (tests deterministas + lints fiscales).
2. staged review con native review de Gentle AI → receipt.
3. `FiscalGateResult.humanAuth.required = true`.
4. **Pausa humana:** el agente no puede hacer commit sin autorización.
5. El humano revisa: diff, receipt, `RiskDecision`.
6. Si autoriza → `humanAuthPresent = true`, `candidateId` vinculado al candidato exacto.
7. Commit con referencia al receipt y a la autorización.
8. Si el contenido cambia después de la autorización, la autorización se invalida (`humanAuthExpired = true`).

### C-REQ-008 — Hook pre-commit fail-closed

El hook pre-commit sigue SDD-009 §11 con estas reglas operativas:

1. Se ejecuta después de `git add` y antes de crear el commit.
2. Evalúa el staged content, no el working tree.
3. Verifica `receiptPresent && receiptValidForCandidate`.
4. Ejecuta el clasificador fiscal sobre el staged diff.
5. Si R2 → verifica `humanAuth.required && humanAuth.present && !humanAuthExpired`.
6. Si falta receipt, el clasificador falla, o la autorización R2 no es válida → **block**.
7. No tiene bypass. `core.hooksPath` debe apuntar a `.githooks/`, no a `.git/hooks/`.

### C-REQ-009 — Staging siempre scoped

El staging debe ejecutarse exclusivamente como:

```bash
git add -A -- <paths-del-cambio>
```

Nunca se usa `git add -A` sin argumentos. El orquestador determina los paths del cambio basándose en el context pack y los archivos modificados. Archivos generados, dependencias y artifacts de build se excluyen via `.gitignore`.

### C-REQ-010 — Autorización humana fresca por candidato

La autorización humana en R2 es válida **exclusivamente** para el candidato exacto aprobado. No hay caducidad temporal — el receipt está vinculado al contenido por Gentle AI. Si el contenido cambia (incluso un solo carácter), la autorización se invalida.

Para R3, la autorización es por operación específica. No existe autorización general "para todas las R3".

### C-REQ-011 — Operaciones prohibidas

De la matriz de SDD-009 §3:

- Push, PR, merge, deploy → siempre requieren autorización humana (no hay excepción).
- Modificar configuración de agentes o autoridad → prohibido para todo agente.
- Operaciones R3 (migraciones reales, SUNAT real, producción, secretos reales) → prohibidas sin autorización explícita específica por operación.
- Ejecutar lints fiscales en R2 sin supervisión → requiere autorización humana.

---

## 4. Failure modes

| Modo                                    | Detección                                         | Recuperación                                      |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Clasificador no disponible              | Error al ejecutar script                          | Hook bloquea commit; escalar a humano             |
| Configuración del clasificador inválida | Parse error en YAML/JSON                          | Fallback a R2 (fail-closed); escalar              |
| Receipt no encontrado                   | `receiptPresent === false`                        | Hook bloquea; re-ejecutar staged review           |
| Autorización R2 expirada/inválida       | `humanAuthValidFor !== candidateId`               | Re-solicitar autorización humana                  |
| Diff excede 400 líneas                  | `diffStats.addedLines > 400`                      | Bloquear commit; requerir división atómica        |
| Loop excede 3 iteraciones               | Contador de candidato congelado > 3               | ESCALATED a humano con reporte                    |
| Mismo fallo se repite 2 veces           | Fallo idéntico en dos iteraciones consecutivas    | Escalar anticipadamente                           |
| Cambio de alcance durante repair        | Archivos fuera del candidato original modificados | Invalidar candidato; requerir nueva planificación |
| `git add -A` sin paths                  | Comando sin argumentos                            | Hook detecta y bloquea; escalar                   |

---

## 5. Observabilidad

### 5.1 Señales obligatorias

| Señal                                                       | Destino            |                 Sensible                  |
| ----------------------------------------------------------- | ------------------ | :---------------------------------------: |
| `RiskDecision` por operación (apply, staged review, commit) | Telemetría agentic | No (paths, patterns, no contenido fiscal) |
| `FiscalGateResult` por gate (pre-commit, staged review)     | Telemetría agentic |                    No                     |
| Clasificaciones por path vs. contenido vs. metadatos        | Dashboard agregado |                    No                     |
| Iteraciones del loop por candidato congelado                | Telemetría agentic |                    No                     |
| ESCALATED events con reporte                                | Log de auditoría   |                    No                     |
| Autorizaciones humanas (rol, candidato, timestamp)          | Log de auditoría   |       Rol y timestamp, no identidad       |
| Cambios en configuración del clasificador                   | Log de auditoría   |                    No                     |
| `git add -A` sin paths detectado                            | Incident log       |                    No                     |

### 5.2 Lo que NO se registra

- Contenido de los archivos modificados (paths sí, líneas del diff no).
- RUCs reales, montos fiscales, documentos.
- Identidad personal del autorizante (solo rol).

---

## 6. Privacidad

- `RiskDecision.reason` no debe contener datos fiscales sensibles. Usar referencias a paths y patrones, no valores extraídos del diff.
- Las autorizaciones humanas se registran por rol, no por nombre completo o email.
- Los logs de incidentes no contienen secretos ni contenido fiscal.

---

## 7. Acceptance criteria

1. [ ] El clasificador fiscal funciona sin conexión a API de lenguaje.
2. [ ] La configuración del clasificador es versionada y extensible (archivo YAML/JSON).
3. [ ] Tests positivos: 10 cambios R2 correctamente identificados.
4. [ ] Tests negativos: 10 cambios R0/R1 no clasificados como R2.
5. [ ] Tests de límite: ambigüedad → R2 fail-closed.
6. [ ] El loop apply→verify→repair respeta el límite de 3 iteraciones por candidato congelado.
7. [ ] ESCALATED se produce al agotar el presupuesto de reparación; nunca "best effort approved".
8. [ ] El flujo R2 se detiene en pausa humana antes del commit.
9. [ ] El hook pre-commit bloquea commits R2 sin autorización humana.
10. [ ] `git add -A` sin argumentos es bloqueado.
11. [ ] Una autorización R2 no reutilizable para un candidato diferente.
12. [ ] Push, PR, merge y deploy requieren autorización humana y no pueden ser ejecutados por el agente.

---

## 8. Self-review

### Cobertura contra SDD-009

| SDD-009 §               | Cubierto por                                               |
| ----------------------- | ---------------------------------------------------------- |
| §2 (modelo B+, niveles) | C-REQ-001, C-REQ-007, C-REQ-010; interfaz `AuthorityLevel` |
| §3 (matriz operaciones) | C-REQ-011                                                  |
| §9.1 (flujo R0/R1)      | C-REQ-006                                                  |
| §9.2 (flujo R2)         | C-REQ-007                                                  |
| §9.3 (límites loop)     | C-REQ-006                                                  |
| §9.4 (repair policy)    | C-REQ-006 (candidato congelado, ESCALATED)                 |
| §10 (clasificador)      | C-REQ-001 a C-REQ-005                                      |
| §11 (hook pre-commit)   | C-REQ-008                                                  |
| §12 (staging limitado)  | C-REQ-009                                                  |
| §14 (gates humanos)     | C-REQ-007, C-REQ-010, C-REQ-011                            |

### Cross-contract check

- `RiskDecision` es consumido por SDD-009D (verificación del receipt y evidencia de run).
- `FiscalGateResult` se produce en el hook y se consume en la telemetría de SDD-009D.
- Las interfaces son compatibles con `HandoffEnvelope` (SDD-009B): `phaseResult.risks` puede incluir `RiskDecision`.
- `AuthorityLevel` es compatible con `AgentRuntimeBudget.role` (SDD-009A) — no hay conflicto de tipos.

### Riesgos abiertos

1. **Cobertura del clasificador:** el bootstrap inicial puede omitir paths o patrones críticos. La validación contra `rg --files` e imports mitigará este riesgo durante implementación.
2. **Rendimiento del clasificador:** si el diff es muy grande (>1000 archivos), el clasificador debe procesarlo en tiempo aceptable para no bloquear el hook. Se recomienda un timeout de 5s para el clasificador.
3. **Falsos positivos R2:** un cambio que toca un path fiscal pero no altera comportamiento fiscal (p. ej., renombrar una variable) puede clasificarse como R2. Es preferible un falso positivo a un falso negativo, pero debe monitorearse la tasa.

---

**Última actualización:** 2026-07-14  
**Estado:** DRAFT  
**Próximo paso:** Revisión humana → aprobación → inicio de SDD-009D
