# SDD-011 — Accounting Period Lifecycle

**Estado:** PROPOSED  
**Depende de:** SDD-010  
**Informa:** SDD-015, 017, 038, 075, 077

## Decisión

El periodo contable tendrá lifecycle explícito y server-enforced. Estados canónicos:

`OPEN → PREPARING_CLOSE → UNDER_REVIEW → CLOSED`

Transiciones excepcionales:

`UNDER_REVIEW → PREPARING_CLOSE`, `CLOSED → REOPENING → OPEN`, y cualquier estado operativo → `LOCKED` por control administrativo o incidente.

## Semántica

- **OPEN:** admite operación ordinaria.
- **PREPARING_CLOSE:** admite correcciones controladas; registra checklist.
- **UNDER_REVIEW:** cambios materiales requieren devolver a preparación o policy explícita.
- **CLOSED:** rechaza mutaciones ordinarias.
- **REOPENING:** transición durable que exige motivo y aprobación.
- **LOCKED:** bloqueo extraordinario; solo acciones de diagnóstico y recuperación autorizadas.

## Invariantes

1. Una transición utiliza version/fencing para impedir doble cierre o stale update.
2. Cerrar exige dependencias obligatorias satisfechas o exceptions aprobadas.
3. Reabrir no borra el cierre anterior; crea versión y eventos.
4. Un objeto de otro periodo no puede incorporarse por selección frontend.
5. Jobs pendientes al cerrar se cancelan, terminan sin aplicar o requieren reconciliación según su tipo.
6. Periodos cerrados permiten lectura, evidence export y correcciones mediante SDD-017.

## UX

El estado aparece junto al periodo. Acciones incompatibles explican la condición y el camino correcto. Cierre, reapertura y lock muestran impacto, jobs activos, propuestas pendientes y usuarios afectados. El cambio de periodo nunca hereda selecciones materiales.

## Pruebas

- doble cierre concurrente;
- aprobación stale después de transición;
- job intenta aplicar tras cierre;
- reapertura aprobada/rechazada;
- transición cross-company;
- rollback de transición con dependencia fallida.

## Criterios de aceptación

- La máquina de estados vive en dominio/backend y UI la refleja.
- Toda transición tiene actor, razón, policy y audit event.
- CLOSED bloquea mutaciones por API y workers.
- Reapertura preserva versiones y evidencia.
- La context bar actualiza estado sin recarga inconsistente.
