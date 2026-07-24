# SDD-077 — Rectification Workflow

**Estado:** PROPOSED  
**Depende de:** SDD-011, 013–018, 074–076

## Decisión

Rectificar crea una nueva cadena de artefactos vinculada a la presentación anterior. No edita ni oculta la declaración original.

## Workflow

1. Seleccionar presentación confirmada.
2. Registrar motivo y trigger.
3. Reunir nueva evidencia.
4. Preparar corrected determination/package.
5. Calcular diff, impacto, intereses/efectos cuando el dominio los soporte.
6. Review y approval reforzados.
7. Presentar mediante ejecución durable.
8. Reconciliar receipt y actualizar relaciones `supersedes/rectifies`.

## Reglas

- Base original immutable.
- Rectification number/version natural uniqueness.
- Cambios no relacionados se separan cuando sea posible.
- Scope/period/obligation se revalidan.
- External rules y deadlines se expresan como FiscalRules versionadas.
- Una segunda rectificación toma como base efectiva la secuencia vigente.

## UX

Timeline presenta original → rectificaciones. Diff distingue dato corregido, efecto y evidencia nueva. Warnings explican consecuencias sin afirmar asesoría legal automática.

## Criterios de aceptación

- Export reconstruye toda la secuencia.
- Approval referencia original y corrected versions.
- Retry/UNKNOWN seguros.
- No existe “undo submission”.
- Period close/reopen policy se respeta.
