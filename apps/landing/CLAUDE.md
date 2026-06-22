# CLAUDE.md - Arkelythex Landing

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

Bridge local para loaders compatibles con Claude dentro de `apps/landing`.

## En dos palabras

Este archivo **no contiene reglas locales**. Todo vive en la raíz del monorepo. Usalo como punto de entrada para que los loaders de Claude sepan dónde buscar las fuentes reales.

Si estás buscando reglas de comportamiento, saltá directo a `../../AGENTS.md` y `../../.claude/CLAUDE.md`.

## Load Order (progressive disclosure)

### 1. Archivos locales (este directorio)
- `./AGENTS.md`

### 2. Reglas del monorepo
- `../../AGENTS.md`
- `../../.claude/CLAUDE.md`
- `../../.opencode/AGENTS.md`
- `../../.opencode/rules/project-context.md`
- `../../.opencode/rules/ai-workflow.md`
- `../../.opencode/rules/coding-style.md`
- `../../.opencode/rules/security.md`

### 3. Claude-Specific Files (monorepo root)
- `../../.claude/CLAUDE.md`
- `../../.claude/settings.json`
- `../../.claude/commands/`
- `../../.agents/skills/`

## Estado actual

No existe `.claude/` dentro de `apps/landing` en esta branch.
