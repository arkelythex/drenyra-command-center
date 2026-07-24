# SDD-075 — Monthly Close Command Workspace

**Estado:** PROPOSED  
**Prioridad:** segundo vertical slice  
**Depende de:** SDD-011–020, 050–058, 071–074

## Decisión

El cierre mensual será un workflow orquestador con checklist derivado de dependencias reales. No será una lista manual desconectada ni un botón “Cerrar” en dashboard.

## Fases

`OPEN → PREPARING_CLOSE → UNDER_REVIEW → CLOSED`

Checklist inicial:

- fuentes sincronizadas;
- documentos procesados;
- conciliaciones completadas o exceptions aprobadas;
- IGV/obligaciones preparadas;
- propuestas revisadas;
- jobs/UNKNOWN resueltos;
- evidence completeness;
- approval de cierre.

## Reglas

1. Cada item tiene source of truth y estado derivado.
2. Override exige permiso, razón, impacto y approval.
3. Closing snapshot fija artifact versions.
4. Jobs incompatibles se cancelan o bloquean.
5. Cierre concurrente usa fencing.
6. Reopening sigue SDD-011/017.

## UX

Outcome nav por fases, canvas de checklist/exceptions e inspector de evidencia. Progress representa requisitos cumplidos, no porcentaje arbitrario. “Listo para cerrar” exige cero blockers; warnings se enumeran.

## Criterios de aceptación

- Estado del checklist coincide con fuentes.
- Double close produce un único resultado.
- Snapshot reconstruye exactamente el cierre.
- Reapertura conserva cierre anterior.
- Workflow reduce 30% tiempo activo frente a baseline.
