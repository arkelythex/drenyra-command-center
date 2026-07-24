# SDD-003 — Current Experience and Redundancy Audit

**Estado:** PROPOSED  
**Depende de:** SDD-000, SDD-001, SDD-002  
**Bloqueo:** requiere checkout verificable del repositorio Drenyra

## Decisión

Antes de migrar el frontend se construirá un inventario reproducible de rutas, componentes, tokens, patrones de estado y workflows. El inventario recibido de 1,089 archivos React es una hipótesis inicial; no se convertirá en evidencia hasta reproducirlo sobre un commit identificado.

## Alcance de auditoría

- rutas y loaders;
- features y ownership;
- shells, sidebars, headers y context selectors;
- tablas, formularios, modales e inspectores;
- chats, agentes, approvals, diffs y artifact feeds;
- tokens, valores hardcodeados, glass legacy y themes;
- server state, global state y form state;
- permisos visibles y guards;
- accesibilidad, responsive y keyboard paths;
- pruebas, stories y visual baselines;
- bundles, lazy loading y rutas de mayor costo.

## Artefactos obligatorios

1. `route-inventory`: URL, feature, rol, contexto, fuente de datos y destino.
2. `component-duplication-map`: componentes equivalentes y consumidores.
3. `token-usage-map`: token, aliases, hardcodes y contraste.
4. `workflow-map`: pasos reales de los doce JTBD.
5. `migration-ledger`: keep, converge, adapt, replace o delete.
6. `risk-register`: seguridad, accesibilidad, rendimiento y regresión.

## Clasificación

- **Keep:** patrón coherente que cumple contratos futuros.
- **Converge:** varias variantes válidas que deben compartir primitive.
- **Adapt:** estructura reusable con semántica incorrecta.
- **Replace:** patrón incompatible con la arquitectura aprobada.
- **Delete:** superficie sin consumidor o duplicada.

No se eliminará un componente solo por contener `glass`, ni se conservará por estar en `components/ui`. La decisión se basa en consumidores, semántica, accesibilidad y costo de migración.

## Reproducibilidad

El reporte registrará commit SHA, comandos, fecha y exclusiones. Los conteos generados no mezclarán archivos vendorizados, builds o fixtures. Cada hallazgo debe enlazar rutas y consumidores concretos.

## Criterios de aceptación

- 100% de las rutas activas tienen owner y destino.
- 100% de los shells/context selectors están identificados.
- No existen duplicaciones afirmadas sin evidencia de API y comportamiento.
- Se identifican los diez flujos de mayor riesgo de migración.
- SDD-094 puede derivar batches de migración sin volver a explorar desde cero.
