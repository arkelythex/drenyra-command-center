# DS3 — Accounting Vocabulary Migration

**Estado:** Proposal
**Creado:** 2026-07-05

---

## Problema

El proyecto usa terminología técnica de Git/desarrollo en la interfaz de usuario: "Worktree", "Swarm", "Pull-Request Ledger", "Commit", "Diff", "Branch", "SNAKE_CASE". El Design System exige vocabulario contable: el usuario final es un contador, no un desarrollador.

## Propuesta

Reemplazar todos los términos visibles al usuario según la tabla:

| Término actual                 | Reemplazo contable                        |
| ------------------------------ | ----------------------------------------- |
| Worktree                       | Caso de trabajo / Espacio de periodo      |
| Swarm                          | Equipo de agentes / Cuadrilla fiscal      |
| Pull-Request Ledger            | Bandeja de asientos por aprobar           |
| Commit / Push                  | Confirmar asiento / Registrar en el libro |
| Diff                           | Comparación de asiento propuesto          |
| Merge                          | Consolidar periodo                        |
| SNAKE_CASE / camelCase visible | Nombres en español natural, sentence case |
| Branch                         | Versión del caso / Escenario              |

**Estrategia de implementación:**

1. **Auditar** todo el copy actual con `rg` para encontrar ocurrencias de los términos técnicos
2. **Reemplazar en componentes de UI** — textos visibles, labels, tooltips, mensajes
3. **Reemplazar en documentación** — README, MAP.md, AGENTS.md
4. **NO cambiar identificadores de código** (nombres de variables, funciones, archivos) — solo superficie de UI y docs

## No-alcance

- No se renombran archivos, carpetas, exports, npm packages ni símbolos de código
- No se cambian APIs ni endpoints
- No se tocan mensajes de commit ni nombres de branch en Git

## PRs

| PR  | Contenido      | Archivos | Líneas est. |
| --- | -------------- | -------- | ----------- |
| PR1 | UI copy + docs | ~10-15   | ~150        |

## Riesgos

- **Bajo**: Algunos términos como "Diff" son difíciles de reemplazar completamente porque son parte del dominio de concepto. Usar "Comparación de asiento" en superficie, mantener "DiffViewer" como nombre interno de componente.
