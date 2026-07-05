# AM1 — Eliminate Duplicate Features (8→1 Unification)

**Estado:** Proposal · **Creado:** 2026-07-05

---

## Problema

8 features compiten por ser "el lugar donde pasa la conversación con el agente": `agent-swarm`, `cognitive-hub`, `drenyra-command-center`, `drenyra-workspace`, `intelligence`, `threads`, `review-queue`, `approval-hub`. Son el mismo concepto repetido 8 veces, cada uno con su propia ruta, layout, y store. El usuario no tiene un modelo mental único de "dónde hablo con el agente".

## Propuesta

Fusionar las 8 en una sola superficie: el **thread** (`/drenyra/case/$threadId`). El resto vive como artifacts inline.

### Targets de eliminación

| Feature                  | Acción                                       | Reemplazo                                               |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| `agent-swarm`            | Eliminar ruta y store                        | Estado de agentes → barra de progreso inline en el case |
| `cognitive-hub`          | Eliminar ruta                                | Timeline → scroll del chat (es el historial del thread) |
| `drenyra-command-center` | ELIMINAR (el que no sea canónico)            | `/drenyra/case/$threadId` como única superficie         |
| `drenyra-workspace`      | ELIMINAR (el que no sea canónico)            | `/drenyra/case/$threadId` como única superficie         |
| `intelligence`           | Eliminar ruta o fusionar en Control Tower    | Dashboard de agentes → observabilidad admin             |
| `threads`                | Eliminar como feature de navegación libre    | Queda como modelo de datos + lista en sidebar           |
| `review-queue`           | Eliminar (duplicado de approval-hub)         | Approval hub como board cross-caso                      |
| `approval-hub`           | Mantener como board, mover aprobación inline | Aprobación como artifact en el thread                   |

### PRs

| PR  | Contenido                                                                | Archivos | Líneas est. |
| --- | ------------------------------------------------------------------------ | -------- | ----------- |
| PR1 | Identificar y documentar solapamiento de stores y rutas                  | ~5       | ~150        |
| PR2 | Eliminar rutas + stores duplicados                                       | ~15      | ~300        |
| PR3 | Unificar approval-hub y review-queue + migrar estado de agentes a inline | ~8       | ~150        |

## Riesgos

- **Alto**: Algunas features pueden tener lógica única no identificada durante el análisis
- **Medio**: Las redirecciones de rutas legacy deben ser exhaustivas
