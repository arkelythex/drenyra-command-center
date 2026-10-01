# Flujo ODD (único) — Gentle AI v4

**Última actualización**: 2026-10-01
**Tipo de contenido**: Explicación + How-to

**Respuesta corta:** todo cambio en Drenyra sigue **ODD (Organic Driven Development)** de [Gentle AI v4.0.0](https://github.com/Gentleman-Programming/gentle-ai). **SDD y OpenSpec están retirados**; no hay un segundo flujo. ODD escala solo: lo simple se hace directo, lo incierto se investiga, lo grande arma su documento de tareas y lo crítico se verifica.

> Principio de ODD: *los cambios pequeños no necesitan un pipeline de planificación, y el trabajo grande no debe perder su contexto entre sesiones.*

## Cómo escala

| Tipo de trabajo | Qué haces | Ejemplo |
|-----------------|-----------|---------|
| **Simple** | Se hace directo: branch, cambio, commit atómico con el *por qué*. | Typo, un archivo, config menor |
| **Incierto** | Primero se investiga (lectura, spike, medición) y se anota lo aprendido. | «¿Por qué falla el typecheck?» |
| **Grande** | Arma su documento de tareas en `odd/tasks/<tarea>.md` y espera autorización antes de implementar. | UI nueva, refactor de varios archivos, contrato nuevo |
| **Crítico** | Se verifica: test-first, revisión independiente y evidencia. | Fiscal, dominio, DB, AI-control, CI |

El documento lleva **Objetivo**, **Alcance** (checklist), **Fuera de alcance** y **Restricciones**. Ejemplos reales: `odd/tasks/tenant-scope-journal-update.md`, `odd/tasks/typecheck-baseline.md`. Anota también lo que decidiste NO tocar.

### Estados

El agente avanza por estados deterministas leídos del disco: **Working** → **Checking** → **Ready** → **Needs your decision** (autorización explícita antes de seguir).

## Review y test-first son independientes

El review nativo (**RDD**, recibos congelados por versión) y el desarrollo guiado por tests **no dependen de ningún flujo**: se prenden y se apagan por separado. Desde v4 la guía test-first se instala por defecto, así que ya no existe una opción «Strict TDD» aparte.

**Política de Drenyra:** en lo crítico ambos van **encendidos siempre**; no es opcional.

## Lo crítico en Drenyra (siempre se verifica, sin importar el tamaño)

`packages/domain`, SUNAT/SIRE/UBL/IGV, libros y facturación, migraciones DB, AI-control, workflows de CI, y todo lo que toque aislamiento por tenant.

1. **Test-first:** test que falla → pasa → refactor en verde.
2. **Revisión RDD de riesgo alto:** candidato congelado antes de revisar, como máximo una corrección acotada, evidencia ligada a esa versión.
3. `bun scripts/sire-ledger-repro-check.ts` si hay facturación o libros.
4. Worktree propio (`~/Documents/PROYECTOS/Drenyra/worktrees/<task-name>`), una branch por cambio.
5. Lentes de `.agent/skills/` (`lens-sunat-compliance`, `lens-tenant-isolation`, `lens-ledger-integrity`, `fiscal-review`).

Ante la duda, trátalo como crítico. La profundidad del review la fija el riesgo, no el tamaño del diff: **pasiva** (docs, config), **media** (código no fiscal), **alta** (lo crítico).

## Si algo todavía llama a SDD

Gentle AI v4 responde con un **rechazo claro** que lista los caminos para seguir (trabajo directo, investigar, documento ODD, verificar). No queda nada trabado: sigue ese camino, no recrees `openspec/`.

## Actualizar a Gentle AI v4 y Gentle Shell 4.0 (en tu máquina)

Estos comandos actúan sobre **tu instalación local**; no se pueden ejecutar desde el repo ni desde CI.

| Instalación | Comando |
|-------------|---------|
| Homebrew | `brew upgrade gentle-ai && gentle-ai sync` |
| Go (una sola vez; el upgrade automático de la v3 no llega a la v4) | `go install github.com/gentleman-programming/gentle-ai/v4/cmd/gentle-ai@v4.0.0 && gentle-ai sync` |
| Gentle Shell | `npm i -g gentle-pi` (instala `gentle-pi` 4.0.0 y el comando `gentle-shell`) |

Qué cambia al sincronizar (según las notas de la release):

- **ODD único:** se retiran las rutas, comandos y agentes de SDD/OpenSpec. Las claves SDD persistidas y los archivos tuyos se **conservan**; el desinstalador solo quita lo que es provablemente suyo.
- **Pi con MCP nativo:** Pi usa su propio soporte; el sync **retira `pi-mcp-adapter`** y migra tus entradas MCP.
- **OpenCode V2:** plugins gestionados y review nativo.
- **Windows:** la suite completa vuelve a estar en verde.
- **Gentle Shell 4.0:** trae el runtime 4.0 adentro. Desde la 3.7, los subagentes pueden trabajar en **otros repositorios** que elijas (selector `repository_root`), útil para tareas que cruzan `drenyra-ai`, `drenyra-shell` y `drenyra-engram`.

**Verifica después de actualizar:** `gentle-ai --version` muestra 4.x; `gentle-ai sync` termina sin avisos; el doctor de Engram responde (ver [engram-guide.md](engram-guide.md)); `bun run typecheck` no cambia de resultado.

## Qué es legado y qué no

| Elemento | Estado |
|----------|--------|
| Workflows `auto-sdd`, `sdd-auto-implement`, `cursor-gentle-ai-sync`; `openspec/config.yaml` | **Eliminados** |
| `openspec/changes/` y el resto de `openspec/` | **Archivo histórico** de solo lectura (ver `openspec/README.md`) |
| `packages/fiscal-sdd` y la skill `drenyra-sdd` | **No son legado:** son **FSD**, la ejecución fiscal guiada por especificación del *producto* (fases captura → clasificación → conciliación → cierre). Usa la API de compliance. Su nombre «SDD» es heredado y se renombra en una tarea aparte. |

## Memoria, contexto y herramientas

- **Engram** (proyecto `drenyra`): [engram-guide.md](engram-guide.md). Nunca guardes secretos, datos de clientes ni registros fiscales crudos.
- **CodeGraph** (`.codegraph/`), `CODEX-MAP.md` → `apps/<app>/MAP.md`.
- **`.gga`** como revisor previo al commit.
- Delegación a sub-agentes: tabla de triggers en [`AGENTS.md`](../../AGENTS.md).

## Ciclo de trabajo

1. Clasifica: simple, incierto, grande o crítico (¿toca la lista fiscal? → crítico).
2. Branch dedicada (`codex/<task-name>`); worktree aislado si es grande o crítico.
3. Grande/crítico: crea o actualiza `odd/tasks/<tarea>.md` y espera autorización.
4. Implementa test-first y verifica lo más acotado: `bun run typecheck`, `bun run lint`, tests del paquete.
5. Review según riesgo; pasa los gates (`docs:verify`, `architecture:check-boundaries`, repro SIRE).
6. Commit atómico, PR con *qué toco y qué no*; al mergear, borra worktree y rama.

## Referencias

- [`AGENTS.md`](../../AGENTS.md) — reglas canónicas
- [`engram-guide.md`](engram-guide.md) — memoria persistente
- [Gentle AI v4.0.0](https://github.com/Gentleman-Programming/gentle-ai/releases) · [Gentle Shell (gentle-pi) v4.0.0](https://github.com/Gentleman-Programming/gentle-pi/releases)
