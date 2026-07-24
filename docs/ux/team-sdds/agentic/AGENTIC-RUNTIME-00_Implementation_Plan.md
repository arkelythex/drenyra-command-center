# AGENTIC-RUNTIME-00 — Agentic Runtime Safety Foundation

**Plan de implementación TDD**

> Basado en exploración real del repositorio. Todos los paths, comandos y frameworks existen.
> `gentle-ai` v2.1.5 disponible en `/home/dreamcoder08/.local/bin/gentle-ai`.
> **Loop engineering controlado** — sin autonomía B+ hasta que runtime pase sus gates.

---

## Inventario inicial (descubrimiento)

| Aspecto                       | Estado actual                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| **Test runner**               | Vitest (packages/orchestrator, phase-gatekeeper). `bun test` (infrastructure)              |
| **TypeScript**                | Strict mode. TS 7.0.2. ModuleResolution: bundler                                           |
| **Hooks**                     | Husky (`core.hooksPath = .husky/_`). pre-commit = `lint-staged`. Sin hooks agentic         |
| **Orchestrator**              | `packages/drenyra-orchestrator/`. 39 tests. Types: WorkRoute, RouteDecision, HookConfig    |
| **Phase gatekeeper**          | `packages/phase-gatekeeper/`. 18 tests. GatedPhasePipeline                                 |
| **AI cost/latency**           | `packages/infrastructure/src/services/ai-cost/` y `ai-latency/`. Facade via `packages/ai/` |
| **Cache metrics (existente)** | `packages/infrastructure/src/cache/metrics.ts`. `CacheMetrics` class con recordHit/Miss    |
| **Gentle AI**                 | v2.1.5 CLI. `review start`, `finalize`, `validate --gate` disponibles                      |
| **OpenCode**                  | GLM 5.2 via Cloudflare. `limit.output: 4096`. Sin session affinity                         |
| **Provider**                  | Cloudflare Workers AI directo — no AI Gateway                                              |
| **Model registry**            | `packages/infrastructure/src/ai/model-registry.ts`                                         |
| **CI**                        | GitHub Actions: `ci.yml`, `ai-review.yml`, `judgment-day.yml`                              |

---

## Orden corregido: T0 → T1-T9 → T10

```
T0 — Baseline inicial (5 runs, solo medir, no tocar runtime)
  │
T1 — Interfaces compartidas (tipos)
T2 — Clasificador determinista
T3 — Fiscal gate + hook pre-commit  ← GATE HUMANO
T4 — Detector pre-request de secretos
T5 — Session affinity y caching
T6 — Context packs y handoffs
T7 — Telemetría y presupuestos
T8 — Integración Gentle AI            ← GATE HUMANO
T9 — Evals y loop completo
  │
T10 — Baseline comparativa + shadow mode + rollout progresivo ← GATE HUMANO + NATIVE REVIEW
```

---

## T0 — Baseline inicial (antes de modificar el runtime)

### Sin archivos nuevos. Sin cambios en el código

**Propósito:** Medir el estado actual del sistema ANTES de que el runtime agentic exista. Cinco runs de OpenCode registrando métricas de línea de base.

### Procedimiento

Para cada uno de 5 runs:

1. Iniciar una sesión de OpenCode con el provider actual (GLM 5.2, Cloudflare directo).
2. Ejecutar un SDD de prueba R0 (exploración + documentación).
3. Al finalizar, registrar manualmente:
   - Tokens de entrada (prompt)
   - Tokens de salida (completion)
   - Tiempo total de la sesión
   - Número de compacciones automáticas de OpenCode
   - Errores de API (si los hay)
4. No modificar `opencode.json`, no inyectar headers, no cambiar comportamiento.

### Registro

Guardar en `docs/ux/team-sdds/agentic/baseline-runs-001.md` con datos anonimizados (sin prompts ni secrets).

### Criterio de avance a T1

Cinco runs completados con métricas registradas. No se requiere aprobación humana para avanzar.

---

## T1 — Interfaces compartidas

### Archivos (9 create, 1 modify)

| #   | Path                                                             | Acción     | Justificación                                              |
| --- | ---------------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| 1   | `packages/drenyra-orchestrator/src/runtime/budget.ts`            | **CREATE** | `AgentRuntimeBudget` + `ModelPricing` de SDD-009A §2.1     |
| 2   | `packages/drenyra-orchestrator/src/runtime/cache-observation.ts` | **CREATE** | `CacheObservation` de SDD-009A §2.2                        |
| 3   | `packages/drenyra-orchestrator/src/runtime/context-pack.ts`      | **CREATE** | `ContextPackManifest` de SDD-009B §2.3                     |
| 4   | `packages/drenyra-orchestrator/src/runtime/handoff.ts`           | **CREATE** | `HandoffEnvelope` de SDD-009B §2.4                         |
| 5   | `packages/drenyra-orchestrator/src/runtime/risk.ts`              | **CREATE** | `RiskDecision` + `AuthorityLevel` de SDD-009C §2.1         |
| 6   | `packages/drenyra-orchestrator/src/runtime/fiscal-gate.ts`       | **CREATE** | `FiscalGateResult` de SDD-009C §2.2                        |
| 7   | `packages/drenyra-orchestrator/src/runtime/verification.ts`      | **CREATE** | `VerificationEnvelope` + `AgentRunEvidence` de SDD-009D §2 |
| 8   | `packages/drenyra-orchestrator/src/runtime/cost-tracker.ts`      | **CREATE** | `calculateCost()` — función pura para desglose de costos   |
| 9   | `packages/drenyra-orchestrator/src/runtime/index.ts`             | **CREATE** | Barrel export de todo runtime/                             |
| 10  | `packages/drenyra-orchestrator/src/index.ts`                     | **MODIFY** | Re-exportar `./runtime/index.js`                           |

### Tests (5 create)

| #   | Path                                     | Lo que testea                                         |
| --- | ---------------------------------------- | ----------------------------------------------------- |
| 11  | `__tests__/runtime/budget.test.ts`       | validateBudget: rechaza context > 128K, reserve < 16K |
| 12  | `__tests__/runtime/context-pack.test.ts` | buildContextPack respeta presupuesto por fase         |
| 13  | `__tests__/runtime/handoff.test.ts`      | createHandoff produce checksum, campos requeridos     |
| 14  | `__tests__/runtime/risk.test.ts`         | RiskDecision fail-closed, AuthorityLevel parse        |
| 15  | `__tests__/runtime/cost-tracker.test.ts` | calculateCost: GLM 5.2 pricing, UNOBSERVABLE handling |

### Comandos secuencia

```bash
# 1. RED
cd packages/drenyra-orchestrator && vitest run
# → fail: Cannot find module '../src/runtime/budget'

# 2. Crear archivos (implementación mínima: interfaces + validación)

# 3. GREEN
vitest run

# 4. Lint + typecheck
bash ../../scripts/tsc7.sh --noEmit
```

### Commit scoped

```bash
git add packages/drenyra-orchestrator/src/runtime/
git add packages/drenyra-orchestrator/__tests__/runtime/
git add packages/drenyra-orchestrator/src/index.ts
git commit -m "feat(orchestrator): add runtime interfaces from SDD-009 A-D"
```

### Evidencia

`vitest run` output. `tsc --noEmit` sin errores. 5 tests pasando.

### Rollback

```bash
git reset HEAD~1 && git checkout -- packages/drenyra-orchestrator/src/runtime/
```

---

## T2 — Clasificador determinista

### Archivos (6 create, 1 modify)

| #   | Path                                                          | Acción     | Justificación                                                             |
| --- | ------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| 16  | `packages/drenyra-orchestrator/src/classifier/config.ts`      | **CREATE** | `ClassifierConfig`, `loadClassifierConfig()`, `DEFAULT_CLASSIFIER_CONFIG` |
| 17  | `packages/drenyra-orchestrator/src/classifier/classifier.ts`  | **CREATE** | `classifyDiff()` — núcleo del clasificador, sin llamadas API              |
| 18  | `packages/drenyra-orchestrator/src/classifier/types.ts`       | **CREATE** | `ClassifierResult`, `DiffInput`, `DiffStats`                              |
| 19  | `packages/drenyra-orchestrator/src/classifier/index.ts`       | **CREATE** | Barrel export                                                             |
| 20  | `packages/drenyra-orchestrator/src/classifier/fiscal-gate.ts` | **CREATE** | `evaluateFiscalGate()`, `formatGateOutput()`                              |
| 21  | `packages/drenyra-orchestrator/src/index.ts`                  | **MODIFY** | Re-exportar `./classifier/index.js`                                       |

### Tests (2 create)

| #   | Path                                      | Lo que testea                                                                                                                                     |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22  | `__tests__/classifier/classifier.test.ts` | 8 tests: positivos R2 (path fiscal + pattern SUNAT + rename), negativos R1 (UI), boundary (fail-closed), deleted file, generated file, empty diff |
| 23  | `__tests__/classifier/config.test.ts`     | 4 tests: parse válido, parse inválido (version faltante), defaults aplicados, paths bootstrap inicial                                             |

### Tests detallados

```typescript
// classifier.test.ts
it('returns R2 for files in packages/fiscal/ paths')
it('returns R2 for diff containing SUNAT references outside fiscal paths')
it('returns R2 for renamed fiscal file')
it('returns R1 for UI components without fiscal content')
it('returns R2 (fail-closed) for unclassified new file')
it('returns R2 for deleted fiscal file')
it('returns R2 for generated file altering fiscal behavior')
it('handles empty diff returning R1')

// config.test.ts
it('parses valid ClassifierConfig from JSON')
it('throws on missing version field')
it('applies default fallbackLevel R2')
it('bootstrap paths match expected initial set (18 entries)')
```

### Condiciones de implementación

- El clasificador NO hace llamadas HTTP ni a modelos de lenguaje.
- `classifyDiff()` es puramente determinista: recibe `DiffInput`, produce `ClassifierResult`.
- `loadClassifierConfig()` lee desde Record<string, unknown> (testeable sin archivos).
- `DEFAULT_CLASSIFIER_CONFIG` contiene los 18 paths + 15 patterns del bootstrap.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run  # 12 tests nuevos
bash ../../scripts/tsc7.sh --noEmit
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/classifier/
git add packages/drenyra-orchestrator/__tests__/classifier/
git commit -m "feat(orchestrator): add deterministic fiscal classifier from SDD-009C"
```

---

## T3 — Fiscal gate y hook pre-commit

### Archivos (4 create, 3 modify)

| #   | Path                                                       | Acción     | Justificación                                                                                          |
| --- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| 24  | `.githooks/pre-commit`                                     | **CREATE** | Script bash del hook. Consume git diff --staged, ejecuta CLI del clasificador, bloquea según resultado |
| 25  | `.githooks/install.sh`                                     | **CREATE** | `git config core.hooksPath .githooks` + permisos                                                       |
| 26  | `packages/drenyra-orchestrator/src/classifier/cli.ts`      | **CREATE** | Entry point CLI: `--gate` y `--staged`. Bun shebang. Lee staged diff, clasifica, produce exit code     |
| 27  | `packages/drenyra-orchestrator/src/classifier/git-diff.ts` | **CREATE** | `parseStagedDiff()` — transforma `git diff --staged` a `DiffInput`                                     |

### Tests (2 create)

| #   | Path                                       | Lo que testea                                                                                  |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 28  | `__tests__/classifier/fiscal-gate.test.ts` | evaluateFiscalGate: allow R0/R1, block R2 sin auth, block si classifier fail, formatGateOutput |
| 29  | `__tests__/classifier/git-diff.test.ts`    | parseStagedDiff: parsea output real de git, maneja diffs vacíos, archivos binarios             |

### Condiciones de implementación

- El hook consume exclusivamente `git diff --staged` (no el working tree).
- Si el clasificador falla, el hook BLOQUEA (fail-closed) con exit code 1.
- R0/R1 + receipt válido → exit 0.
- R2 sin autorización humana → exit 1.
- El hook NO tiene bypass vía `--no-verify`.
- `core.hooksPath` debe apuntar a `.githooks/`, no a `.git/hooks/`.

### GATE HUMANO después de T3

Revisión humana de:

- `classifier.ts` — paths y patterns del bootstrap.
- `fiscal-gate.ts` — lógica de allow/block.
- `.githooks/pre-commit` — que no haya bypass.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
chmod +x .githooks/pre-commit .githooks/install.sh
bash .githooks/install.sh
```

### Commit

```bash
git add .githooks/
git add packages/drenyra-orchestrator/src/classifier/cli.ts
git add packages/drenyra-orchestrator/src/classifier/git-diff.ts
git add packages/drenyra-orchestrator/__tests__/classifier/
git commit -m "feat(classifier): add fiscal gate and pre-commit hook from SDD-009C"
```

---

## T4 — Detector pre-request de secretos

### Archivos (2 create)

| #   | Path                                                                      | Acción     | Justificación                                                                                              |
| --- | ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| 30  | `packages/drenyra-orchestrator/src/runtime/secret-detector.ts`            | **CREATE** | `detectSecrets()` — 7 regex patterns, fail-closed, no almacena valor                                       |
| 31  | `packages/drenyra-orchestrator/__tests__/runtime/secret-detector.test.ts` | **CREATE** | 6 tests: bloquea tokens Cloudflare, OpenAI, GitHub, RUC, permite texto limpio, no almacena valor detectado |

### Condiciones

- `detectSecrets()` recibe string, retorna `SecretDetectionResult`.
- **Nunca** incluye el valor detectado en `reason`. Solo el nombre del patrón.
- Fail-closed: si el detector no puede ejecutarse, bloquea.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
bash ../../scripts/tsc7.sh --noEmit
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/runtime/secret-detector.ts
git add packages/drenyra-orchestrator/__tests__/runtime/secret-detector.test.ts
git commit -m "feat(orchestrator): add pre-request secret detector from SDD-009 §19.2"
```

---

## T5 — Session affinity y caching (decisión cerrada)

### ProviderCapability — diseño condicionado

El baseline T0 reveló que el provider activo es **DeepSeek via OpenCode Go**, no Cloudflare Workers AI. GLM 5.2 está disponible via OpenCode Go (no Workers Free). El diseño de T5 debe ser condicional:

```text
ProviderCapability
├── deepseek-v4-pro (via OpenCode Go) — provider ACTIVO
│   ├── session affinity: managed/unavailable por OpenCode
│   ├── cached tokens: OBSERVABLE via SQLite session.tokens_cache_read
│   └── custom Cloudflare header: not applicable
└── glm-5.2 (via Cloudflare Workers AI) — provider FUTURO
    ├── session affinity: wrapper scripts/ai/session-affinity.sh
    ├── cached tokens: Workers AI usage (cuando esté activo)
    └── activation: DISABLED hasta Workers Paid o AI Gateway
```

El código de session affinity, wrapper y provider custom `cloudflare-agentic` se implementa pero queda detrás de feature flag `DRENYRA_PROVIDER_CLOUDFLARE`. Mientras el flag esté desactivado, OpenCode sigue usando el proveedor actual sin cambios.

**No migrar el provider activo durante T5.** GLM 5.2 da 403 via Workers Free. OpenCode Go tiene GLM pero con un provider ID distinto (`opencode-go/glm-5.2`). La migración se decide en T10, cuando se evalúe qué provider usar en producción.

### Decisión de estrategia

Tras explorar la API de OpenCode:

- **OpenCode soporta `options.headers` en providers custom** usando `"npm": "@ai-sdk/openai-compatible"`. Usado por Helicone, aplicable a Cloudflare.
- **OpenCode soporta `{env:VARIABLE}`** en valores de configuración para inyectar variables de entorno dinámicamente.
- **OpenCode plugins npm** (ej: `opencode-helicone-session`) inyectan headers dinámicos por sesión real.
- **El built-in `cloudflare` provider key** no expone `options.headers`.
- **gentle-ai sync** modifica built-in providers; NO toca providers custom con `npm` field.

**Alcance documentado:** `Affinity scope: OpenCode process/run`.

- Nuevo ID cada vez que se inicia mediante el wrapper.
- Mismo ID durante todo ese proceso.
- No garantiza IDs distintos entre conversaciones o subagentes alojados en el mismo proceso.
- Mejora routing/cache locality, pero no cumple todavía afinidad por subagente.
- La versión por sesión/agente requiere un plugin con acceso demostrado al session ID de OpenCode (similar a `opencode-helicone-session`) y queda para una iteración posterior.

**Estrategia definitiva:**

| Capa                        | Mecanismo                                                                                                                                                                | Path                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Generación de ID**        | Función pura en orchestrator                                                                                                                                             | `packages/drenyra-orchestrator/src/plugin/session-affinity.ts`                |
| **Inyección dinámica**      | `{env:DRENYRA_SESSION_ID}` en `opencode.json`. OpenCode resuelve la variable en runtime                                                                                  | `opencode.json` — provider custom `cloudflare-agentic`                        |
| **Wrapper**                 | Script que genera el ID, lo exporta al entorno, y lanza OpenCode con `exec` para que herede el entorno                                                                   | `scripts/ai/session-affinity.sh`                                              |
| **Sin fallback automático** | No existe un mecanismo probado para omitir el header. `"x-session-affinity": ""` enviaría un header vacío, no una omisión. Sin wrapper, OpenCode se lanza sin el header. | El que quiere affinity usa el wrapper. Quien no, lanza OpenCode directamente. |

### Archivos (3 create, 2 modify)

| #   | Path                                                           | Acción     | Justificación                                                         |
| --- | -------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| 32  | `packages/drenyra-orchestrator/src/plugin/session-affinity.ts` | **CREATE** | `generateSessionAffinityId()` — ID único por proceso                  |
| 33  | `packages/drenyra-orchestrator/src/plugin/index.ts`            | **CREATE** | Barrel export                                                         |
| 34  | `scripts/ai/session-affinity.sh`                               | **CREATE** | Wrapper con `exec opencode`, hereda entorno                           |
| 35  | `opencode.json`                                                | **MODIFY** | Provider custom con `{env:DRENYRA_SESSION_ID}` + `limit.output: 8192` |
| 36  | `packages/drenyra-orchestrator/src/index.ts`                   | **MODIFY** | Re-exportar `./plugin/index.js`                                       |

### Tests obligatorios (1 create, 7 assertions)

| #   | Path                                        | Lo que testea                                                                                                                               |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 37  | `__tests__/plugin/session-affinity.test.ts` | 7 tests: IDs distintos entre ejecuciones, formato/length, sin PII, un solo ID por proceso, no estático, sin accountID, sin token commiteado |

```typescript
describe('session-affinity', () => {
  it('generates different IDs on consecutive calls')
  it('ID matches expected format session-agentic-{uuid}')
  it('ID does not contain PII, secrets, or env vars')
  it('same process receives the same ID')
  it('never returns a static global value')
  it('does not leak CLOUDFLARE_ACCOUNT_ID in the ID')
  it('does not commit apiKey or token to opencode.json')
})
```

### Wrapper script (`scripts/ai/session-affinity.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# SDD-009 T5 — Session affinity wrapper
# Genera un ID único por proceso y lanza OpenCode con el entorno heredado

export DRENYRA_SESSION_ID="$(
  bun run packages/drenyra-orchestrator/src/plugin/session-affinity.ts
)"

exec opencode "$@"
```

### opencode.json (modificación)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "cloudflare-agentic": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Cloudflare Agentic",
      "options": {
        "apiKey": "{env:CLOUDFLARE_API_KEY}",
        "baseURL": "https://api.cloudflare.com/client/v4/accounts/{env:CLOUDFLARE_ACCOUNT_ID}/ai/v1",
        "headers": {
          "x-session-affinity": "{env:DRENYRA_SESSION_ID}"
        }
      },
      "models": {
        "@cf/zai-org/glm-5.2": {
          "id": "@cf/zai-org/glm-5.2",
          "name": "GLM 5.2",
          "limit": {
            "context": 128000,
            "output": 8192
          }
        }
      }
    }
  }
}
```

**Nota:** `apiKey` y `baseURL` usan `{env:...}` en lugar de valores literales. El account ID y el token no deben estar commiteados. Se configuran vía `/connect` en OpenCode o variables de entorno.

**Garantía gentle-ai sync:** `gentle-ai sync` modifica built-in providers (`cloudflare`, `openai`, `anthropic`), no providers custom con `npm` field. `cloudflare-agentic` custom no es tocado. Los perfiles Gentle AI que referencien el modelo `@cf/zai-org/glm-5.2` lo resuelven contra el nuevo provider ID `cloudflare-agentic`.

**Wrapper obligatorio:** El perfil `cloudflare-agentic` solo puede iniciarse mediante el wrapper `scripts/ai/session-affinity.sh`. OpenCode sustituye una variable de entorno inexistente por `""` — un string vacío no equivale a omitir el header. Si el SDK no ignora headers vacíos, el servidor recibe `x-session-affinity: ""`, que es semánticamente distinto a no enviar el header.

**Arranque directo es unsupported.** El preflight del wrapper debe verificar que `DRENYRA_SESSION_ID` está definida y no vacía. Si se intenta ejecutar OpenCode directamente contra `cloudflare-agentic`, debe fallar en preflight con un mensaje claro. Esto no bloquea el uso de otros perfiles (el built-in `cloudflare` sigue disponible para arranque directo).

Quien quiera affinity usa el wrapper. Quien no, usa el built-in `cloudflare` directamente. No hay un modo "con affinity pero sin wrapper".

**0% cache hits sin wrapper es operación normal** conforme a SDD-009 §4.1.1.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/plugin/
git add packages/drenyra-orchestrator/__tests__/plugin/
git add scripts/ai/session-affinity.sh
git add opencode.json
git commit -m "feat(orchestrator): add session affinity + migrate to custom Cloudflare provider"
```

---

## T6 — Context packs y handoffs

### Archivos (0 nuevos — extender existentes)

Ya creados en T1:

- `src/runtime/context-pack.ts` — extender con `buildContextPack()`
- `src/runtime/handoff.ts` — extender con `createHandoff()`
- `__tests__/runtime/context-pack.test.ts` — añadir tests de validación de presupuesto
- `__tests__/runtime/handoff.test.ts` — añadir tests de integridad

### Tests adicionales (4)

```typescript
it('excludes non-relevant context per phase (SDD-009 §6.2)')
it('validates withinBudget before delegation')
it('includes checksum for integrity')
it('detects corrupted handoff via checksum mismatch')
```

### Condiciones

- `buildContextPack(role, content)` respeta `AgentRuntimeBudget.contextLimitTokens`.
- `createHandoff(fromRole, toRole, phaseResult)` produce `HandoffEnvelope.checksum` vía hashing simple.
- No se envía contexto completo de sesión en el handoff.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/runtime/context-pack.ts
git add packages/drenyra-orchestrator/src/runtime/handoff.ts
git add packages/drenyra-orchestrator/__tests__/runtime/context-pack.test.ts
git add packages/drenyra-orchestrator/__tests__/runtime/handoff.test.ts
git commit -m "feat(orchestrator): add context pack builder and handoff envelope"
```

---

## T7 — Telemetría y presupuestos

### Archivos (0 nuevos — extender existentes)

`src/runtime/cost-tracker.ts` ya creado en T1. Extender con:

- `calculateCost()` con GLM 5.2 pricing
- `calculateBudgetBaseline()` para recalibración p75+20%

Tests ya cubiertos en T1 (`cost-tracker.test.ts`). Añadir:

```typescript
it('recalculates budget after 5 runs (p75 + 20%)')
it('rejects model change that silently evades budget')
it("produces UNOBSERVABLE cached cost when API doesn't expose it")
```

### Condiciones

- Sin prompts, código, secretos, RUC o información fiscal en telemetría.
- Costo separado: input normal, cached input, output.
- Pricing documentado: `$1.40/M input`, `$0.26/M cached input`, `$4.40/M output`.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/runtime/cost-tracker.ts
git commit -m "feat(orchestrator): add cost tracker with GLM 5.2 pricing from SDD-009A"
```

---

## T8 — Integración Gentle AI

### Archivos (2 create)

| #   | Path                                                               | Acción     | Justificación                                                  |
| --- | ------------------------------------------------------------------ | ---------- | -------------------------------------------------------------- |
| 38  | `packages/drenyra-orchestrator/src/gentle-ai-bridge.ts`            | **CREATE** | `stagedReview()` — git add scoped + gentle-ai review + receipt |
| 39  | `packages/drenyra-orchestrator/__tests__/gentle-ai-bridge.test.ts` | **CREATE** | stagedReview, candidate mismatch, receipt verificación         |

### Condiciones

- `git add -A -- <paths-del-cambio>` — nunca sin argumentos.
- `gentle-ai review start --projection staged` — consume receipt nativo.
- `receipt.validForCandidateId` debe coincidir con `candidateId` del loop actual.
- Candidate mismatch: si el staged content cambió entre review y commit, detectar.
- **No reimplementar la autoridad de Gentle AI.** Consumir su CLI.

### GATE HUMANO después de T8

Revisión de:

- `gentle-ai-bridge.ts` — integración con CLI de Gentle AI.
- Receipt lifecycle: generación, mismatch, corrección.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/gentle-ai-bridge.ts
git add packages/drenyra-orchestrator/__tests__/gentle-ai-bridge.test.ts
git commit -m "feat(orchestrator): add Gentle AI bridge for staged review + receipt"
```

---

## T9 — Evals y loop completo

### Archivos (0 nuevos — extender existentes)

`src/runtime/verification.ts` — extender con `buildVerificationEnvelope()` y `buildAgentRunEvidence()`.

Tests en `__tests__/runtime/verification.test.ts`.

### Tests de integración

```typescript
it('executes apply → verify → staged review for R1 (integration)')
it('respects max 3 repairs per frozen candidate')
it('produces ESCALATED when repair budget exhausted')
it('rolls back via git revert, not git reset --hard')
it('stops execution within 5s on interrupt signal')
```

### Condiciones

- El contador de iteraciones es por candidato congelado.
- Cambiar de subagente NO reinicia el contador.
- 2 repeticiones del mismo fallo → escalado anticipado.
- ESCALATED es el único estado terminal.
- Rollback vía `git revert`, nunca `git reset --hard` remoto.
- Escape hatch detiene en <5s.

### GREEN

```bash
cd packages/drenyra-orchestrator && vitest run
bash ../../scripts/tsc7.sh --noEmit
```

### Commit

```bash
git add packages/drenyra-orchestrator/src/runtime/verification.ts
git add packages/drenyra-orchestrator/__tests__/runtime/verification.test.ts
git commit -m "feat(orchestrator): complete verification envelope and run evals from SDD-009D"
```

---

## T10 — Baseline comparativa + shadow mode + rollout

### Paso 1: Second baseline (5 runs post-implementación)

Repetir el mismo procedimiento de T0 pero con el runtime agentic activo:

- Clasificador determinista en cada diff.
- Gate pre-commit activo (modo observe-only — no bloquea, solo registra).
- Session affinity IDs generados (inyección si es posible, sino registrado).
- Telemetría registrando costos, tokens, cached_tokens.

Comparar contra T0:

- Diferencia en tokens por fase.
- Costo adicional del clasificador (cercano a cero por ser determinista).
- Cache hit rate (si el header se inyectó).

### Paso 2: Rollout progresivo

```
Fase        | Comportamiento                          | Gate de avance
────────────|─────────────────────────────────────────|─────────────────────────
observe-only| Gate registra, no bloquea               | 5 runs sin incidentes
shadow      | Gate bloquea, pero permite --no-verify   | 5 runs sin falsos +/-
warn        | Gate bloquea, notifica al humano         | 1 semana sin bypasses
block R3    | R3 siempre bloqueado                     | 2 semanas sin escapes
pause R2    | R2 requiere autorización humana          | 2 semanas sin errores
B+ completo | R0/R1 autónomo, R2 pausa, R3 bloqueado   | Native review + aprobación
```

### Gates humanos

| Después de                     | Gate                                              |
| ------------------------------ | ------------------------------------------------- |
| **T3** — Clasificador + hook   | Revisión humana del clasificador y hook           |
| **T8** — Integración Gentle AI | Revisión de integración y receipt                 |
| **T9/T10** — Evals + rollout   | Native review completa + autorización del rollout |

### Condición de activación de B+

Después de 5 runs comparables:

- Sin bypasses del gate fiscal.
- Sin secretos detectados en prompts.
- Sin receipts inconsistentes.
- Sin falsos negativos críticos (R2 no clasificado como R1).
- Costo dentro del presupuesto estimado ±20%.

→ Habilitar B+: R0/R1 autónomo hasta commit, R2 hasta staged review, pausa antes del commit.

---

## Resumen de archivos

### Total: 39 archivos (34 create, 5 modify)

| Tarea     | Create | Modify | Justificación                                |
| --------- | ------ | ------ | -------------------------------------------- |
| **T0**    | 0      | 0      | Solo medición                                |
| **T1**    | 9      | 1      | 9 interfaces + barrel + re-export            |
| **T2**    | 6      | 1      | Clasificador completo + barrel + re-export   |
| **T3**    | 4      | 0      | Hook bash, installer, CLI, git-diff parser   |
| **T4**    | 2      | 0      | Detector + tests                             |
| **T5**    | 3      | 2      | Plugin + wrapper + opencode.json + barrel    |
| **T6**    | 0      | 0      | Extiende archivos de T1                      |
| **T7**    | 0      | 0      | Extiende cost-tracker de T1                  |
| **T8**    | 2      | 0      | Gentle AI bridge + tests                     |
| **T9**    | 0      | 0      | Extiende verification de T1                  |
| **T10**   | 0      | 0      | Solo medición + rollout                      |
| **Total** | **26** | **4**  | **30 archivos + 9 de T6/T7/T9 (extendidos)** |

### 30 archivos concretos + 9 extensiones = 39 contribuciones de archivo

Cada uno tiene justificación en la tabla de su tarea. No hay archivos "por si acaso".

---

## Matriz de trazabilidad SDD-009 → Tests

| SDD-009 §                   | Contrato | Tarea      | Tests                                             |
| --------------------------- | -------- | ---------- | ------------------------------------------------- |
| §4.1-4.4 (caching)          | A        | T5, T7     | session-affinity.test (4), cost-tracker.test (3)  |
| §5.1-5.3 (presupuesto)      | A        | T1, T6     | budget.test (2), context-pack.test (2)            |
| §6.1-6.3 (context packs)    | B        | T6         | context-pack.test (2)                             |
| §7.1-7.4 (compacción)       | B        | T6         | handoff.test (2)                                  |
| §8.1-8.4 (delegación)       | B        | T6         | handoff.test (2)                                  |
| §9.1-9.4 (loop autónomo)    | C        | T9         | verification.test (5)                             |
| §10.1-10.8 (clasificador)   | C        | T2         | classifier.test (8), config.test (4)              |
| §11.1-11.5 (hook)           | C        | T3         | fiscal-gate.test (4), git-diff.test (3)           |
| §12.1-12.3 (staging)        | C        | T8         | gentle-ai-bridge.test (3)                         |
| §13.1-13.4 (receipt)        | D        | T8         | gentle-ai-bridge.test (3)                         |
| §14.1-14.6 (gates humanos)  | C        | T3         | fiscal-gate.test (4)                              |
| §15.1-15.3 (observabilidad) | D        | T7         | cost-tracker.test (3)                             |
| §16.1-16.2 (evals)          | D        | T9         | verification.test (5)                             |
| §17.1-17.4 (límites)        | D        | T1, T7, T9 | budget.test, cost-tracker.test, verification.test |
| §18.1-18.3 (failure modes)  | D        | T8, T9     | gentle-ai-bridge.test, verification.test          |
| §19.1-19.3 (privacidad)     | D        | T4         | secret-detector.test (6)                          |

**Total: ~60 tests unitarios + 5 de integración.**

---

**Gate humano requerido antes de ejecutar. No implementar hasta aprobación.**
