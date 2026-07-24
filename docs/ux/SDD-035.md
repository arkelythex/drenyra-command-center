# SDD-035 — Fiscal Forms and Validation

**Estado:** PROPOSED  
**Depende de:** SDD-010–013, SDD-030–033, SDD-036  
**Informa:** todos los workflows editables

## Decisión

Los formularios usarán schema compartido para validación estructural y reglas de dominio server-side. Autosave crea draft versionado; nunca implica aprobación o aplicación.

## Estados

`pristine`, `dirty`, `saving`, `saved`, `invalid`, `stale`, `submit_pending`, `submit_failed`.

## Reglas

1. Errores aparecen junto al campo y en resumen navegable.
2. Cross-field y fiscal rules se ejecutan en backend; frontend puede anticipar sin ser autoridad.
3. Un conflicto stale conserva input local y ofrece comparar/recargar.
4. Cambiar empresa/periodo con dirty state exige resolver el draft.
5. Disabled significa no interactivo; read-only conserva legibilidad y copy.
6. File upload muestra progreso, validación, hash y fallos parciales.
7. Submit usa idempotencia y no depende de doble bloqueo visual.

## UX

Mensajes describen qué ocurrió, impacto y acción. No se limpian campos después de error. Focus va al primer error solo tras intento explícito; validación durante escritura evita ruido prematuro.

## Criterios de aceptación

- Form state y server state no se duplican sin ownership.
- Autosave/restoration se prueban ante refresh y disconnect.
- Screen reader anuncia errores y success sin robar focus.
- Double submit no duplica side effects.
- Period closed y permission revoked se manejan como cambios de estado, no errores genéricos.
