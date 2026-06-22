# AGENTS.md - Arkelythex Landing

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

Índice de compatibilidad para agentes dentro de `apps/landing`.

## Alcance

Este paquete **no** tiene `.context/`, `.claude/`, `.opencode/`, `.gemini/` ni `.codex` locales.
Las guías de agentes viven en la raíz del monorepo.

## Fuentes reales (monorepo root)

- Reglas base: `../../AGENTS.md`
- OpenCode: `../../.opencode/AGENTS.md`
- Claude: `../../.claude/CLAUDE.md`
- Gemini: `../../.gemini/GEMINI.md`
- Codex: `../../.codex/AGENTS.md`

## Nota

Si se agregan wrappers locales en `apps/landing`, este archivo debe actualizarse para evitar rutas rotas.

## Delegation Triggers

| Trigger | Cuando | A quién |
|---------|--------|---------|
| **Brand copy** | Nuevo o actualizado copy de marketing en 3+ archivos | `scribe` |
| **Component refactor** | Toqués 3+ archivos de componentes | `explore` para mapear, luego `frontend-builder` |
| **Design system change** | Modificando tokens en globals.css, contract, o DESIGN.md | `explore` + `frontend-designer` |
| **Nueva ruta/página** | Agregar ruta + page component + metadata | `frontend-builder` |
| **SEO o metadata** | Cambiar SEO global, schema, o analytics | `general` |
| **Docs update** | Escribir o actualizar docs en `apps/landing/docs/` | `scribe` |
