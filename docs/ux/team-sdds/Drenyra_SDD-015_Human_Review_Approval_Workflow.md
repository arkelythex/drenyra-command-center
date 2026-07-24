# SDD-015 — Human Review and Approval Workflow

**Estado:** PROPOSED  
**Depende de:** SDD-011–014  
**Informa:** SDD-017, 019, 052, 053 y vertical slices

## Decisión

Revisión y aprobación serán recursos versionados, no flags. Lifecycle de propuesta:

`DRAFT → PROPOSED → IN_REVIEW → CHANGES_REQUESTED | REVIEWED → APPROVAL_PENDING → APPROVED → APPLYING → APPLIED`

Estados terminales/alternativos: `REJECTED`, `CANCELLED`, `STALE`, `FAILED` y `SUPERSEDED`.

## Reglas

1. Review evalúa contenido; approval concede autoridad para aplicar.
2. Cambiar artefacto, policy, periodo o impacto invalida decisiones dependientes.
3. Approval referencia versión/hash, actor, scope, policy y expiry.
4. Aplicar consume approval cuando la policy lo exige.
5. Un approver puede rechazar o devolver con reason code y comentario.
6. La autoaprobación se permite solo por policy y queda visible.
7. Acciones masivas requieren summary, límites y resultados parciales explícitos.

## UX

El panel muestra qué se revisa, diferencias, monto, fuentes, validaciones, excepciones, quién preparó y si cambió desde la última revisión. Los botones usan verbos precisos: “Marcar revisado”, “Solicitar cambios”, “Aprobar aplicación”, “Aplicar”; nunca un genérico “Confirmar”.

## Fallos

Si apply falla, approval no se transforma automáticamente en aplicado. Se registra `FAILED` o `UNKNOWN`; la reconciliación decide retry, success externo o intervención. Un segundo click usa idempotencia.

## Criterios de aceptación

- Review y approval tienen identidad e historial.
- Stale approval se detecta antes de apply.
- Segregación y expiry se prueban server-side.
- UI muestra autoaprobación, excepciones y policy.
- Un fallo parcial nunca se presenta como éxito completo.
