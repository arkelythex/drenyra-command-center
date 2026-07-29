# W2-05A — Consumer Deduplication: Inventario y Contrato

**Estado:** Borrador
**Fecha:** 2026-07-12
**Depende de:** W2-03 (Idempotencia end-to-end), W2-04 (Natural Uniqueness)

## Objetivo

Definir un inbox pattern transaccional que garantice procesamiento exactamente una vez por mensaje, independientemente del broker subyacente.

## Infraestructura de mensajería actual

| Componente           | Propósito                                                 | Garantía actual de dedup                                   |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| **NATS + JetStream** | Event bus principal (domain events)                       | Durable consumers, pero sin inbox transaccional            |
| **BullMQ**           | Colas de trabajo (OCR, document processing, fiscal agent) | `jobId` dedup nativo, pero no persistente contra reinicios |
| **CDR Webhooks**     | Callbacks HTTP de SUNAT (OSE)                             | `isCdrAlreadyProcessed()` vía transaction trail            |

## Consumers identificados

| Consumer             | Origen                    | message_id actual              | Riesgo                                        |
| -------------------- | ------------------------- | ------------------------------ | --------------------------------------------- |
| `cdr-webhook`        | HTTP (OSE/SUNAT callback) | `providerReference` (opcional) | Débil sin inbox — confía en transaction trail |
| `document-processor` | BullMQ                    | `documentId` como `jobId`      | Pérdida de estado si Redis se resetea         |
| `fiscal-agent`       | BullMQ                    | `runId` como `jobId`           | Mismo riesgo que document-processor           |
| `csv-batch`          | BullMQ                    | `batchId`                      | Mismo riesgo                                  |
| `evidence-ingestion` | NATS event                | Ninguno explícito              | Sin dedup en absoluto                         |
| `sire-submit`        | Application call          | `idempotencyKey` (W2-03)       | Ya cubierto por idempotencia HTTP             |
| `bank-sync`          | NATS event / cron         | Ninguno                        | Sin dedup                                     |
| `automation-trigger` | NATS event                | Ninguno                        | Sin dedup                                     |

## Contrato del Inbox Pattern

### Clave de deduplicación

```sql
UNIQUE (consumer_name, producer, message_id)
```

- `consumer_name`: identificador fijo del consumidor (e.g. `"cdr-webhook"`, `"document-processor"`)
- `producer`: namespace del origen del mensaje (e.g. `"SUNAT_CDR"`, `"BANK_PROVIDER_X"`, `"NATS_DOMAIN_EVENT"`, `"BULLMQ_JOB"`)
- `message_id`: identificador único del mensaje dentro del namespace del productor

**Por qué `producer` es necesario:** Si dos productores distintos generan el mismo UUID externo, la unicidad se rompe. `producer` actúa como namespace explícito, eliminando la suposición de que todos los `message_id` son globalmente únicos entre productores.

No incluye `company_id`: el tenant es contexto de autorización y trazabilidad, no identidad del mensaje.

### Scope multi-tenant

`organization_id` y `company_id` se almacenan para trazabilidad y autorización, pero NO forman parte de la clave de deduplicación. Dos compañías diferentes no deberían recibir el mismo `message_id` del mismo productor.

### Estados

```text
PROCESSING → COMPLETED
           → FAILED (RETRYABLE | TERMINAL)
```

- **PROCESSING**: mensaje en curso. Protege contra redelivery concurrente.
- **COMPLETED**: mensaje procesado. Redelivery se ignora (no-op exitoso).
- **FAILED**: mensaje fallido. `RETRYABLE` permite reprocesar; `TERMINAL` no.

### Payload hash

Se almacena un `payload_hash` (SHA-256) para detectar redelivery con payload distinto. Misma lógica que W2-03A.

### Frontera transaccional

El registro inbox y el efecto de dominio comparten la misma transacción PostgreSQL:

```text
BEGIN
  INSERT inbox (PROCESSING)
  execute domain effect
  UPDATE inbox (COMPLETED)
COMMIT
```

Si COMMIT falla, la transacción entera revierte, mensaje puede reintentarse.

### Ownership fencing

Reutiliza el mismo patrón de W2-03B.1: `processing_token` con UUID único por adquisición, CAS en `markCompleted/markFailed`.

## Esquema propuesto

```sql
CREATE TABLE inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_name VARCHAR(100) NOT NULL,
  producer VARCHAR(100) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(100) NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  organization_id UUID,
  company_id UUID,
  status inbox_status NOT NULL DEFAULT 'PROCESSING',
  failure_class failure_class,
  failure_code VARCHAR(100),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_failed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  processing_token UUID,
  processing_started_at TIMESTAMPTZ,
  processing_expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (consumer_name, producer, message_id)
);
```

Con CHECK constraints equivalentes a W2-03:

- `PROCESSING` → `processing_started_at` NOT NULL, `processing_token` NOT NULL
- `COMPLETED` → `completed_at` NOT NULL, `processing_token` NULL
- `FAILED` → `failed_at` NOT NULL, `failure_code` NOT NULL, `failure_class` NOT NULL
- `NOT PROCESSING` → `processing_token` NULL
- `attempt_count >= 1`

## Política de conflictos

| Escenario                                               | Comportamiento                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Mismo `(consumer_name, message_id)` + PROCESSING        | No-op o espera (retry-after)                                                |
| Mismo `(consumer_name, message_id)` + COMPLETED         | No-op exitoso                                                               |
| Mismo `(consumer_name, message_id)` + FAILED(RETRYABLE) | Reintenta                                                                   |
| Mismo `(consumer_name, message_id)` + FAILED(TERMINAL)  | Rechazar                                                                    |
| Mismo `(consumer_name, message_id)` + payload distinto  | Rechazar con conflicto                                                      |
| Distinto `consumer_name`, mismo `message_id`            | Ambos procesan (independientes)                                             |
| Mismo mensaje cross-tenant                              | Depende del productor — almacenar para trazabilidad pero no forzar unicidad |

## Relación con W2-03 (idempotencia HTTP)

| Aspecto          | `idempotency_records` (W2-03)    | `inbox_messages` (W2-05)             |
| ---------------- | -------------------------------- | ------------------------------------ |
| Propósito        | Idempotencia HTTP                | Dedup de mensajes                    |
| Clave            | `(org, company, operation, key)` | `(consumer_name, message_id)`        |
| Origen de la key | Header HTTP                      | Broker/Producer                      |
| Frontera         | Opcional (puede ser post-commit) | Siempre transaccional                |
| TTL              | 24h / 7d                         | Sin TTL (histórico de procesamiento) |
| Ownership        | processing_token                 | processing_token                     |
| Payload hash     | request_hash                     | payload_hash                         |

## Próximos pasos

```text
W2-05B  inbox_messages schema + migración
W2-05C  Wrapper transaccional de consumo
W2-05D  Concurrencia, redelivery y PostgreSQL verification
```
