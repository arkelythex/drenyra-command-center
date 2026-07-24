# SDD Proposal: Global Agentic Shell — Persistent Three-Panel Layout

**Última actualización:** 2026-07-12
**Depende de:** drenyra-agentic-shell (applied), drenyra-three-panel-layout (applied)

## Problema

El `AgenticLayout` de tres paneles (sidebar | workspace | inspector) existe como componente pero **no es el layout global**. Cada ruta decide si lo usa (solo `/drenyra/*`), y rutas como `/cierre-mensual` e `/` usan layouts propios sin sidebar persistente. Esto produce la sensación de "página flotando sobre un lienzo enorme".

## Propuesta

1. **Wrap `__root.tsx` en `AgenticLayout`** para que todas las rutas hereden el sidebar persistente, el panel derecho contextual, la command palette y la command bar.
2. **Modificar `/drenyra.tsx`** para que no anide AgenticLayout duplicado — hereda el del root.
3. **Eliminar `FiscalInspectorProvider` de rutas individuales** (`cierre-mensual.tsx`, `index.tsx`) porque AgenticLayout ya lo provee.
4. **Activar el right rail por defecto** en rutas que tengan inspector activo.

## No-alcance

- No se cambia la estructura del sidebar (nav items, secciones)
- No se modifican los componentes internos del cierre mensual
- No se toca el routing de `/drenyra/*` child routes

## PRs

| PR  | Scope                                             | Archivos | Líneas est. |
| --- | ------------------------------------------------- | -------- | ----------- |
| PR1 | __root.tsx wrap + drenyra.tsx fix + route cleanup | 4-5      | ~80         |

## Riesgos

- `/drenyra/*` child routes no deben tener AgenticLayout duplicado
- Verificar que el `FiscalInspectorProvider` anidado de AgenticLayout no rompa rutas que ya tenían su propio provider
