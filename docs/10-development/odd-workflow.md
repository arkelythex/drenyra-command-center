# Flujo ODD por niveles

**Última actualización**: 2026-10-01
**Tipo de contenido**: Explicación + How-to

**Respuesta corta:** usa ODD (Organic Driven Development, de [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai)) para trabajo no fiscal y mantén SDD estricto para todo lo fiscal, sin importar el tamaño del cambio.

## Por qué niveles

El riesgo fiscal (SUNAT, ledger, tenant/RUC) no depende de cuántas líneas cambias. Un fix de una línea en IGV puede ser más peligroso que un refactor de UI de 400 líneas. Por eso el nivel se decide por **qué tocas**, no por cuánto.

## Elegir el nivel

| Si tocas… | Nivel |
|-----------|-------|
| `packages/domain`, SUNAT/SIRE/UBL/IGV, libros, migraciones DB, AI-control, workflows de CI | **Strict (SDD)** |
| UI, infra no fiscal, refactor acotado, 4+ archivos | **ODD estándar** |
| Docs, typos, config menor, un archivo | **ODD ligero** |

Ante la duda, sube un nivel.

## Qué exige cada nivel

**Strict (SDD):** worktree aislado; spec en `openspec/` (`strict_tdd: true`); tests primero; `bun scripts/sire-ledger-repro-check.ts` si hay facturación o libros; revisión independiente (skills `lens-*`, `fiscal-review`); evidencia en el PR.

**ODD estándar:** branch dedicada y una nota `odd/tasks/<tarea>.md` con *Objetivo*, *Alcance* (checklist), *Fuera de alcance* y *Restricciones*. Ejemplos reales: `odd/tasks/ci-gate-fixes.md`, `odd/tasks/web-tooling-health.md`. Marca los ítems según avanzas y deja anotado lo que decidiste NO tocar.

**ODD ligero:** branch dedicada, commit atómico con el mensaje que explica el *por qué*.

## Piloto de gentle-ai (opcional)

gentle-ai **configura** los agentes que ya usas; no los reemplaza. Este repo ya adoptó parte del ecosistema (Engram, `.gga`, `openspec/`, `odd/`, CodeGraph), así que el piloto solo valida si estandarizar la configuración aporta algo.

Haz el piloto **en tu máquina**, en un worktree aislado (`worktrees/gentle-ai-pilot`, branch `codex/gentle-ai-pilot`):

1. Haz backup de tu config actual de agentes (`~/.claude`, `~/.codex`, `~/.gemini`) y confirma que el árbol git está limpio.
2. Instala el CLI y ejecútalo **solo para Claude Code**. Si ofrece dry-run, úsalo primero y lee exactamente qué archivos escribiría.
3. No aceptes cambios sobre `.gga`, `openspec/config.yaml` ni `AGENTS.md`.
4. Revisa el diff: qué MCP servers registra, qué deny-list instala, dónde guarda la memoria (debe ser local; ver reglas de [engram-guide.md](engram-guide.md)).
5. Verifica que los hooks de `.husky/` y `.hooks/` sigan funcionando y que `bun run typecheck` no cambie de resultado.
6. Úsalo en 2–3 tareas reales (una ODD ligera, una ODD estándar). Registra fricción y ahorro en `odd/tasks/gentle-ai-pilot.md`.

**Criterios para adoptarlo:** no pisa archivos canónicos, no manda datos fuera de tu máquina, los hooks existentes siguen verdes y la tarea ODD estándar se hizo con menos ceremonia sin perder evidencia.

**Criterios para descartarlo:** duplica Engram/`.gga`/`openspec` sin ganancia clara, o exige aceptar escrituras sobre archivos canónicos.

## Referencias

- [`AGENTS.md`](../../AGENTS.md) — reglas canónicas
- [`engram-guide.md`](engram-guide.md) — memoria persistente
- [`openspec/config.yaml`](../../openspec/config.yaml) — configuración SDD
