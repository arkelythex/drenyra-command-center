# SDD-094 — Legacy UI Migration and Deprecation

**Estado:** PROPOSED  
**Depende de:** SDD-003, SDD-030–041, SDD-091–093

## Decisión

La migración seguirá patrón strangler por workflow. No habrá rewrite big-bang ni mantenimiento indefinido de dos fuentes de verdad.

## Ledger de migración

Cada ruta/componente/tokenset registra: owner, consumidores, clasificación keep/converge/adapt/replace/delete, target, adapter, flag, metrics, rollback y delete gate.

## Fases por slice

1. Congelar nuevas dependencias legacy.
2. Introducir contratos y adapters.
3. Ejecutar shadow/read comparison cuando sea seguro.
4. Pilot por empresa/rol.
5. Expandir cohortes.
6. Redirect/deprecate.
7. Eliminar después de usage scan y rollback window.

## Reglas

- No migrar estilos sin comportamiento/estado equivalente.
- No duplicar business logic en frontend legacy y nuevo.
- URLs críticas tienen redirects.
- Drafts y deep links conservan compatibilidad definida.
- Token compatibility emite warnings para nuevos usos.
- Delete PR incluye evidencia de cero consumidores.

## Criterios de aceptación

- SDD-003 inventory completo.
- Cada batch es reversible.
- Métricas comparan legacy/new outcomes.
- Cero rutas huérfanas o silent 404.
- Glass legacy se elimina por consumidor, no search-and-replace ciego.
