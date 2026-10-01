# Flujo ODD (único)

**Última actualización**: 2026-10-01
**Tipo de contenido**: Explicación + How-to

**Respuesta corta:** todo cambio en Drenyra sigue **ODD (Organic Driven Development)** de [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai). No hay un segundo flujo. Lo que cambia es el tamaño del trabajo y su riesgo, no el método.

> Principio de ODD: *los cambios pequeños no necesitan un pipeline de planificación, y el trabajo grande no debe perder su contexto entre sesiones.*

## Los cuatro estados

El agente avanza por estados deterministas, leídos del disco (no adivinados por el modelo):

| Estado | Qué ocurre |
|--------|-----------|
| **Working** | Explora e implementa. |
| **Checking** | Verifica con tests y comprobaciones funcionales. |
| **Ready** | El trabajo espera tu decisión. |
| **Needs your decision** | Requiere autorización explícita antes de seguir. |

## Pequeño vs. sustancial

| | Pequeño | Sustancial |
|---|---------|-----------|
| **Ejemplos** | Docs, typo, fix de un archivo, config menor | UI nueva, refactor de varios archivos, infraestructura, cualquier cambio de contrato |
| **Autorización** | Inmediata | Explícita, antes de implementar |
| **Documento** | Ninguno | Uno solo: `odd/tasks/<tarea>.md` |
| **Cierre** | Commit atómico con el *por qué* | Documento actualizado + evidencia en el PR |

El *feature document* lleva: **Objetivo**, **Alcance** (checklist), **Fuera de alcance** y **Restricciones**. Ejemplos reales: `odd/tasks/ci-gate-fixes.md`, `odd/tasks/web-tooling-health.md`. Anota lo que decidiste NO tocar y por qué.

## Regla de riesgo fiscal (parte de ODD, no un flujo aparte)

Tocar cualquiera de estos **siempre se trata como sustancial**, sin importar las líneas cambiadas:

`packages/domain`, SUNAT/SIRE/UBL/IGV, libros y facturación, migraciones DB, AI-control, workflows de CI.

Para esos cambios, además:

1. **Strict TDD activado:** test que falla → pasa → refactor en verde. Tener tests no activa Strict TDD por sí solo; se activa explícitamente.
2. **Revisión RDD de riesgo alto:** el candidato se congela antes de revisar, se permite como máximo una corrección acotada y la evidencia queda ligada a esa versión exacta.
3. `bun scripts/sire-ledger-repro-check.ts` si hay facturación o libros.
4. Aislamiento: worktree propio (`~/Documents/PROYECTOS/Drenyra/worktrees/<task-name>`) y una branch por cambio.
5. Lentes de revisión de `.agent/skills/` (`lens-sunat-compliance`, `lens-tenant-isolation`, `lens-ledger-integrity`, `fiscal-review`).

Ante la duda sobre el tamaño, trátalo como sustancial.

## RDD en todo PR

Revisión proporcional al riesgo: **pasiva** (docs, config), **media** (código no fiscal), **alta** (lista anterior). La profundidad la fija el riesgo, no el tamaño del diff.

## Memoria, contexto y herramientas

- **Engram** (proyecto `drenyra`): memoria persistente; guía en [engram-guide.md](engram-guide.md). Nunca guardes secretos, datos de clientes ni registros fiscales crudos.
- **CodeGraph** (`.codegraph/`) y `CODEX-MAP.md` → `apps/<app>/MAP.md` para navegar sin releer todo.
- **`.gga`** como revisor previo al commit.
- Delegación a sub-agentes: tabla de triggers en [`AGENTS.md`](../../AGENTS.md).

## Ciclo de trabajo

1. Clasifica: pequeño o sustancial (¿toca la lista fiscal? → sustancial).
2. Branch dedicada (`codex/<task-name>`); worktree aislado si es sustancial o fiscal.
3. Sustancial: crea/actualiza `odd/tasks/<tarea>.md` y espera autorización.
4. Implementa (Strict TDD si aplica) y verifica con lo más acotado: `bun run typecheck`, `bun run lint`, tests del paquete.
5. Revisión RDD según riesgo; pasa los gates (`docs:verify`, `architecture:check-boundaries`, repro SIRE).
6. Commit atómico, PR con *qué toco y qué no*; al mergear, borra worktree y rama.

## Estado heredado de SDD

Los artefactos previos (`openspec/`, `packages/fiscal-sdd`, skill `drenyra-sdd`, workflows `auto-sdd` y `sdd-auto-implement`) **ya no definen el flujo de trabajo**. Siguen en el repo como material histórico y código hasta que se decida retirarlos en una tarea ODD propia. No crees specs nuevas en `openspec/`: usa `odd/tasks/`.

## Adopción de gentle-ai (piloto local, opcional)

gentle-ai **configura** los agentes que ya usas; no los reemplaza. Ejecútalo en tu máquina, en un worktree aislado:

1. Respalda `~/.claude`, `~/.codex`, `~/.gemini` y verifica árbol git limpio.
2. Instálalo solo para Claude Code; usa dry-run si existe y lee qué escribiría.
3. No aceptes cambios sobre `.gga` ni `AGENTS.md`.
4. Revisa el diff: MCP servers registrados, deny-list y dónde guarda la memoria (debe ser local).
5. Confirma que `.husky/` y `.hooks/` siguen verdes y `bun run typecheck` no cambia.
6. Úsalo en 2–3 tareas reales y registra la fricción en `odd/tasks/gentle-ai-pilot.md`.

Adóptalo si no pisa archivos canónicos, no envía datos fuera de tu máquina y los hooks siguen verdes. Descártalo si duplica Engram/`.gga` sin ganancia.

## Referencias

- [`AGENTS.md`](../../AGENTS.md) — reglas canónicas
- [`engram-guide.md`](engram-guide.md) — memoria persistente
- [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) — ODD, RDD y Strict TDD
