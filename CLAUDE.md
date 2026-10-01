# Instrucciones para Claude Code / Gemini CLI en DRENYRA (@drenyra/main)

**Última actualización**: 2026-10-01

> **Fuente canónica:** [`AGENTS.md`](AGENTS.md). Este archivo solo agrega lo específico de Claude Code / Gemini CLI y define el flujo de trabajo por niveles. Si algo aquí contradice `AGENTS.md`, gana `AGENTS.md`.

## Prioridades

1. **Estabilidad fiscal:** cero errores en dominio. SUNAT (SIRE, facturación) es la prioridad #1.
2. **Aislamiento y auditoría:** scoping por organización/empresa/RUC y trazabilidad en todo.
3. **Cambios pequeños, verificables y reversibles.**

## Stack real (resumen)

- **TypeScript (Bun):** `packages/domain` (VO, Entities, Events; sin frameworks), `packages/application`, `apps/api` (Elysia = adaptador de entrada), `apps/web` (React 19). Vertical Slice + CQRS.
- **Rust:** `engines/rust-core` (núcleo verificable). **Go:** `services/` (conectores, `services/engram`), `apps/cli`. Ver [stack canónico](docs/01-foundation/canonical-stack.md).
- **Money:** `Money` VO de `@drenyra/domain` (cents). Nunca floats ni `number` crudo. `dinero.js` NO está instalado.
- **Navegación rápida:** `CODEX-MAP.md` → `apps/<app>/MAP.md` → `.codebase/index.yml`.

## Flujo de trabajo por niveles (ODD)

Ceremonia proporcional al riesgo. Detalle en [`docs/10-development/odd-workflow.md`](docs/10-development/odd-workflow.md).

| Nivel | Cuándo | Flujo |
|-------|--------|-------|
| **Strict (SDD)** | Toca `packages/domain`, SUNAT/SIRE, facturación, libros, DB/migraciones, AI-control o CI | Worktree aislado, spec en `openspec/`, strict TDD, `scripts/sire-ledger-repro-check.ts` si aplica, revisión independiente. **Sin importar el tamaño.** |
| **ODD estándar** | UI, infraestructura no fiscal, refactors acotados, 4+ archivos | Branch dedicada + nota de tarea en `odd/tasks/<tarea>.md` (objetivo, alcance, fuera de alcance). |
| **ODD ligero** | Docs, typos, fix de un archivo, config menor | Branch dedicada, commit atómico, sin nota previa. |

Ante la duda, sube de nivel.

## Reglas de Git

- Una branch por cambio; `main` limpio. Worktree aislado en el nivel Strict o en trabajo paralelo: `~/Documents/PROYECTOS/Drenyra/worktrees/<task-name>`.
- No mezclar fases no relacionadas en la misma branch/worktree. Cambios >400 líneas: ver estrategias de entrega en `AGENTS.md`.
- Tras mergear, borrar worktree y ramas fusionadas.

## Calidad (Regla 80/100/0)

- **100%:** domain TypeScript (Vitest), invariantes fiscales auditados. **80%:** integración y adaptadores.
- Mutation testing en el core fiscal. Linters: Biome (prioritario) + ESLint para design tokens.

## Verificación

Ejecuta primero lo más acotado y amplía según el riesgo. Solo usa comandos que existan en `package.json`.

```bash
bun run typecheck          # post-cambio (nunca npm)
bun run lint               # o `biome check <rutas>` antes de editar
bun scripts/sire-ledger-repro-check.ts   # OBLIGATORIO si tocas facturación o libros
bun run architecture:check-boundaries
bun run docs:verify
```

Los scripts `compliance:sire-*` del `package.json` fueron eliminados (nunca existieron); invoca los scripts de `scripts/` directamente.

## Memoria y agentes

- **Memoria persistente:** Engram, proyecto `drenyra` ([guía](docs/10-development/engram-guide.md)). No guardar secretos, datos de clientes ni registros fiscales crudos. Si Engram no está disponible, continúa con los archivos del repo y repórtalo.
- **Estado del trabajo:** `odd/tasks/` (ODD), `openspec/` (SDD). El directorio `.claude/` no existe en el repo; no dependas de `.claude/agents/_protocol.md` ni `.claude/memory/active_plan.md`.
- **Skills:** `.agent/skills/` (revisión, SUNAT, tenant isolation, ledger, SDD, etc.). Delegación a sub-agentes: ver tabla de triggers en `AGENTS.md`.
- **Seguridad:** OWASP Top 10, prohibido hardcodear credenciales, usar `SecureLogger`. Funciones cortas, JSDoc en API pública.

## Modelos

- **Lógica fiscal y arquitectura:** modelos Claude.
- **Multimodal / logs masivos / OCR de facturas:** Gemini.
- Sin datos fiscales reales ni de clientes en servicios externos de memoria o de terceros.
