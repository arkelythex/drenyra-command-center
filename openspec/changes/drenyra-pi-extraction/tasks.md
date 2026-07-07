# Tasks: Drenyra Pi — plan de implementación

**Estado:** Working Draft · **Fecha:** 2026-07-07  
**Change:** `drenyra-pi-extraction`  
**Basado en:** [Design](./design.md)

---

## Review Workload Forecast

- **Total estimado**: ~2300 líneas en 9 PRs
- **Chained PRs recomendados**: Sí — 9 PRs secuenciales
- **400-line budget risk**: PR2 (~500) y PR4 (~400) superan el límite
- **Decisión necesaria antes de apply**: confirmar el PR slicing

---

## PR1 — Scaffold repo drenyra-pi

**Dependencias:** Ninguna  
**Archivos:** ~60 | **Líneas:** ~300

### Tasks

- [ ] Crear directorio `repos/drenyra-pi/` fuera del monorepo
- [ ] Inicializar `package.json` con name `@drenyra/pi`
- [ ] Crear `tsconfig.json` (strict, ESNext target)
- [ ] Crear `vitest.config.ts` con patrón `src/**/*.test.ts`
- [ ] Copiar estructura de directorios de `packages/agents/src/` (vacíos):
  - `src/mastra/`, `src/types/`, `src/harness-core/`, `src/swarm-core/`
  - `src/plugin/`, `src/legacy/`, `src/mnevori/`, `src/phase/`
  - `src/strategies/`, `src/agents/`
- [ ] Crear `src/index.ts` barrel con exports públicos (ver spec §1.2)
- [ ] Instalar dependencias base: `@mastra/core`, `ai`, `zod`, `cuid2`, `typescript`, `vitest`
- [ ] Crear `.github/workflows/ci.yml` con `test`, `typecheck`
- [ ] `bun run typecheck` pasa en el repo standalone

---

## PR2 — Migrar código de agents

**Dependencias:** PR1  
**Archivos:** ~80 | **Líneas:** ~500

### Tasks

- [ ] Copiar `.ts` files de `packages/agents/src/` → `drenyra-pi/src/`
- [ ] Remover imports a packages del monorepo (`@drenyra/domain`, etc.):
  - `domain/fiscal-ontology` → inlinear o extraer a dependencia
  - `domain/fiscal-truth` → idem
  - `domain/value-objects/Money` → idem
- [ ] Ajustar imports internos entre módulos de agents
- [ ] Migrar tipos compartidos: `AgentContext`, `AgentSession`, etc.
- [ ] Verificar que `drenyra-pi` no tenga imports al monorepo
- [ ] `bun run typecheck` pasa en standalone
- [ ] `bun run test` pasa en standalone

---

## PR3 — Separar repo + apuntar consumers

**Dependencias:** PR2  
**Archivos:** ~15 | **Líneas:** ~100

### Tasks

- [ ] Hacer `git init` en `repos/drenyra-pi/` y pushear a `github.com/drenyra/drenyra-pi`
- [ ] En el monorepo, agregar `"@drenyra/pi": "github:drenyra/drenyra-pi"` en `package.json`
- [ ] Opcional: `packages/agents/package.json` name → `@drenyra/pi` con `workspace:*`
- [ ] Actualizar consumers:
  - `apps/api`: `@drenyra/agents` → `@drenyra/pi`
  - `apps/web`: `@drenyra/agents` → `@drenyra/pi`
  - `packages/domain`: `@drenyra/agents` (DrenyraSubagentName) → `@drenyra/pi`
- [ ] Remover `packages/agents` del monorepo (borrar directorio)
- [ ] Limpiar `tsconfig.json` del monorepo (remover reference a agents)
- [ ] `bun install` exitoso
- [ ] `bun run typecheck` en el monorepo da 0 errores de módulo

---

## PR4 — CLI thin en TS (comandos base)

**Dependencias:** PR3  
**Archivos:** ~20 | **Líneas:** ~400

### Tasks

- [ ] Reemplazar contenido de `apps/cli/` (Go → TS)
- [ ] `package.json` con `"type": "module"` y `"bin": { "drenyra": "./dist/index.js" }`
- [ ] Dependencias: `commander`, `node-fetch` (o `undici`), `zod`
- [ ] `src/index.ts` — entry point con `program.parse()`
- [ ] `src/commands/agents.ts` — `agents list`, `agents inspect`, `agents pause`, `agents resume`
- [ ] `src/commands/workflow.ts` — `workflow run`, `workflow status`
- [ ] `src/commands/config.ts` — `config get`, `config set`
- [ ] `src/client.ts` — HTTP client wrapper contra drenyra-pi API
- [ ] `src/types.ts` — tipos compartidos del CLI
- [ ] `build` script: `tsc` → output en `dist/`
- [ ] `bun run typecheck` pasa

---

## PR5 — TUI con Ink

**Dependencias:** PR4  
**Archivos:** ~15 | **Líneas:** ~300

### Tasks

- [ ] Dependencias: `ink`, `react`
- [ ] `src/tui/app.tsx` — componente raíz Ink
- [ ] `src/tui/sessions.tsx` — lista de sesiones con status
- [ ] `src/tui/session-detail.tsx` — detalle de sesión con timeline
- [ ] `src/tui/workflow-progress.tsx` — progreso de workflow fiscal
- [ ] `src/tui/status-bar.tsx` — status bar con estado de drenyra-pi
- [ ] Modo headless (`--json` flag en comandos)
- [ ] Tests de componentes TUI (ink-testing-library)

---

## PR6 — Pipeline CLI → drenyra-pi completo

**Dependencias:** PR4, PR5  
**Archivos:** ~10 | **Líneas:** ~200

### Tasks

- [ ] drenyra-pi: implementar server HTTP embebido (Elysia o Hono)
- [ ] Endpoints implementados (ver design §3):
  - `POST /api/v1/sessions`
  - `GET /api/v1/sessions`, `GET /api/v1/sessions/:id`
  - `POST /api/v1/sessions/:id/pause|resume|cancel`
  - `GET /api/v1/sessions/:id/timeline`
  - `POST /api/v1/agents/:id/run`
  - `POST /api/v1/workflows/run`
  - `GET /api/v1/health`
- [ ] CLI: `src/commands/serve.ts` — `drenyra serve` inicia el server
- [ ] Tests de integración: CLI → HTTP → drenyra-pi → response
- [ ] Manejo de errores: timeout, connection refused, parse errors

---

## PR7 — Plugin system (interfaz de skill)

**Dependencias:** PR3  
**Archivos:** ~8 | **Líneas:** ~150

### Tasks

- [ ] Extender `plugin/interface.ts` con `DrenyraSkill` interface
- [ ] `PluginRegistry.load(skill: DrenyraSkill)` — registra en runtime
- [ ] `PluginRegistry.findByName(name)` — lookup por nombre
- [ ] `PluginRegistry.list()` — skills instalados
- [ ] `SkillContext` con acceso a SessionManager, ApprovalGate, Logger
- [ ] Tests de plugin registry (load, find, list, duplicate detection)

---

## PR8 — Skill SIRE Filing

**Dependencias:** PR3, PR7  
**Archivos:** ~12 | **Líneas:** ~250

### Tasks

- [ ] Crear `packages/skill-sire-filing/` (en monorepo o repo separado)
- [ ] `package.json` con `@drenyra/skill-sire-filing`
- [ ] Dependencia: `@drenyra/pi`
- [ ] `src/index.ts` — exporta `DrenyraSkill` con strategy de SIRE filing
- [ ] Strategy portada desde `strategies/sire-filing.strategy.ts`
- [ ] Tests unitarios del skill
- [ ] Skill se puede cargar via `drenyra pi install`

---

## PR9 — CLI skill management

**Dependencias:** PR3, PR7, PR8  
**Archivos:** ~5 | **Líneas:** ~100

### Tasks

- [ ] `src/commands/pi.ts` — `drenyra pi install <package>`
- [ ] `src/commands/pi.ts` — `drenyra pi uninstall <name>`
- [ ] `src/commands/pi.ts` — `drenyra pi list`
- [ ] Integración con PluginRegistry vía HTTP
- [ ] Tests de comandos pi

---

## Dependencias entre PRs

```
PR1 ──→ PR2 ──→ PR3 ──→ PR4 ──→ PR5 ──→ PR6
                         │
                  PR3 ───┴─── PR7 ──→ PR8 ──→ PR9
```

- PR4 (CLI thin) depende de PR3 (consumers migrados)
- PR7 (plugin system) depende de PR3 (API pública estable)
- PR6 (pipeline completo) depende de PR4 + PR5
- PR8 (skill SIRE) depende de PR3 + PR7

---

## Comandos de verificación

```bash
# En repo standalone drenyra-pi
bun run typecheck
bun run test

# En monorepo (después de PR3)
bun install
bun run typecheck
bun run --filter @drenyra/api test
bun run --filter @drenyra/web test
```
