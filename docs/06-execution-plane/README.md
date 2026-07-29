# 06 — Execution Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 5 de 8 — Ejecución
**Propósito:** Temporal workflows, jobs, idempotency, fencing, recovery, outbox
**Principio:** Durable execution con garantías — toda operación financiera es recoverable

---

## Filosofía

El Execution Plane es el sistema nervioso de Drenyra. Toda operación que cruza un sistema externo o modifica estado financiero debe ejecutarse dentro de un workflow durable con:

- **Idempotencia** — repetir la misma operación produce el mismo resultado
- **Fencing** — evitar ejecución concurrente no autorizada
- **Retry** — recuperación automática ante fallos transitorios
- **Human-in-the-loop** — pausa para aprobación profesional
- **Compensation** — rollback mediante contraasientos o compensaciones
- **Receipt** — evidencia de ejecución inmutable

### Principios

1. **Nunca perder un evento.** Si no podemos procesarlo ahora, lo encolamos.
2. **Nunca ejecutar sin idempotency key.** Cada operación tiene un key único.
3. **Nunca asumir éxito sin verificar.** Confirmación de sistema externo requerida.
4. **Siempre registrar UNKNOWN.** Si no sabemos qué pasó, no asumir nada.

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs del [programa FEOS](../01-foundation/feos-program.md):

- `temporal-workflows.md` — Workflows durables, actividades, señales
- `idempotency-contract.md` — Canonical idempotency, keys, fencing
- `outbox-pattern.md` — Garantía de publicación de eventos
- `job-lifecycle.md` — Jobs, workers, retries, dead letters
- `recovery-compensation.md` — Rollback, compensating entries, UNKNOWN reconciliation
- `fencing-concurrency.md` — Locks, leader election, tenant isolation

---

## Capacidades existentes

| Capacidad              | Estado         | SDD                            |
| ---------------------- | -------------- | ------------------------------ |
| Idempotencia canónica  | ✅ Implemented | CAP-FOUND-04                   |
| Outbox pattern y jobs  | ✅ Implemented | CAP-FOUND-05                   |
| Daily self-healing     | ✅ Implemented | `drenyra-pcge-management`      |
| UNKNOWN reconciliation | 🟡 Partial     | SIRE capabilities              |
| Fencing multi-tenant   | ✅ Implemented | `drenyra-h02-tenant-isolation` |

---

## Stack

| Componente        | Tecnología      | Propósito                                |
| ----------------- | --------------- | ---------------------------------------- |
| Workflow engine   | Temporal        | Procesos largos, retries, pausas humanas |
| Event bus         | NATS JetStream  | Eventos de dominio, streaming            |
| Job queue         | Temporal + NATS | Workers, retries, dead letters           |
| Idempotency store | PostgreSQL      | Idempotency keys, fencing                |
| Object storage    | S3-compatible   | Artefactos, receipts                     |

---

## Relación con otros planos

| Plano                                                   | Relación                                  |
| ------------------------------------------------------- | ----------------------------------------- |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Workflows ejecutan agentes                |
| [05 — Trust](../05-trust-plane/README.md)               | Cada ejecución genera receipt             |
| [07 — Financial](../07-financial-plane/README.md)       | Workflows contables (close, conciliación) |
| [08 — Integration](../08-integration-plane/README.md)   | Llamadas externas con fencing y retry     |
