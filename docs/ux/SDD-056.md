# SDD-056 — Execution Timeline and Activity

**Estado:** PROPOSED  
**Depende de:** SDD-014, 018, 020, 051, 055

## Decisión

Timeline presentará una proyección legible de audit, jobs, agent runs, reviews, approvals y comentarios. No reemplaza el audit ledger; deriva de él y otras fuentes mediante referencias.

## Eventos visibles

- importado/validado;
- propuesta creada/cambiada;
- revisión solicitada/devuelta;
- aprobación concedida/invalidada;
- job iniciado/reintentado/reconciliado;
- acción aplicada/fallida/unknown;
- comentario/asignación;
- periodo cambiado.

## UX

Agrupación por correlation, timestamps absolutos y relativos, actor badges Human/Agent/System, filtros y expansión de evidencia. Background activity aparece sin interrumpir; errores que requieren acción crean attention item.

## Reglas

1. Timeline no inventa orden causal por timestamps iguales; usa correlation/sequence.
2. Retry events se agrupan sin ocultar intentos.
3. Redacción sigue permisos actuales y política histórica.
4. Refresh/realtime deduplica por event ID.
5. “Completed” proviene del source of truth, no de animación frontend.

## Criterios de aceptación

- Puede reconstruirse un SIRE job desde request hasta receipt.
- UNKNOWN y reconciliation se entienden sin logs técnicos.
- Realtime no duplica eventos.
- Keyboard y screen reader navegan items.
- Export técnico enlaza audit IDs.
