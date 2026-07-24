# SDD-020 — Durable Fiscal Execution

**Estado:** PROPOSED  
**Depende de:** ADR-009/Wave 2, SDD-010–019  
**Informa:** jobs, agents, automations y adapters externos

## Decisión

Toda operación larga, externa o material utilizará ejecución durable con idempotencia end-to-end, natural uniqueness, inbox dedup, job uniqueness, leases/fencing y reconciliación de UNKNOWN. Este SDD consume Wave 2 cerrada; no reemplaza sus contratos.

## Lifecycle

`PENDING → PROCESSING → COMPLETED`

Alternativos: `FAILED_RETRYABLE`, `FAILED_TERMINAL`, `CANCEL_REQUESTED`, `CANCELLED`, `UNKNOWN`, `RECONCILING`.

## Reglas

1. Idempotency key se scopea según contrato canónico y detecta payload conflict.
2. Natural uniqueness protege entidades fiscales aunque cambie la key.
3. Consumer dedup usa identidad de mensaje/namespace; company es contexto, no sustituto de identidad.
4. Lease holder necesita fencing token para persistir resultado.
5. Retry no repite side effects confirmados.
6. Timeout externo produce UNKNOWN cuando no puede determinarse outcome.
7. Reconciler consulta fuente externa o evidence antes de reintentar.
8. Cancelar es best-effort y no declara rollback de efectos ya ocurridos.

## UX

Estados se traducen a “En cola”, “Procesando”, “Completado”, “Necesita reintento”, “No se pudo completar” y “Verificando resultado”. UNKNOWN nunca aparece como error genérico ni invita a repetir manualmente. La timeline muestra último heartbeat, intento y siguiente acción.

## Operación

Métricas: queue age, runtime, retries, lease conflicts, unknown duration, reconciliation outcome y dedup hits. Alertas distinguen degradación externa de defectos internos.

## Criterios de aceptación

- Suites Wave 2 siguen verdes.
- Failure injection cubre crash, duplicate delivery, lease expiry y timeout-after-success.
- UI no habilita doble submit para “resolver” incertidumbre.
- Audit/evidence correlacionan request, job, external receipt y resultado.
- Recovery no viola scope, periodo, approval o policy freshness.
