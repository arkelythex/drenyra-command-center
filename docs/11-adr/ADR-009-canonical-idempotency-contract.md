# ADR-009: Contrato Canónico de Idempotencia

**Estado:** Aprobado
**Fecha:** 2026-07-12
**Decisores:** Equipo Drenyra

## Contexto

Drenyra maneja múltiples mecanismos de idempotencia que evolucionaron orgánicamente y
ahora conviven sin un contrato unificado:

1. **In-memory Map** en `apps/api/src/features/drenyra/drenyra.routes.ts:516` —
   caché `Map<string, { id: string; status: number }>` para `POST /api/drenyra/cases`.
   Sin persistencia, sin scope multi-tenant, sin protección de concurrencia, volatil
   ante reinicios. Es la implementación más frágil.

2. **SIRE submission** en `apps/api/src/features/sire/services/submission/service.ts` —
   la más completa: consulta existing submission por `idempotencyKey`, replica
   resultados ACCEPTED/SIMULATED, permite re-intentos en FAILED. Pero:
   - `buildIdempotencyKey()` genera random fallback cuando no se provee key explícita →
     destruye la garantía de idempotencia.
   - No hay reserva atómica: hay ventana entre `findByIdempotencyKey` y `create`.
   - Scope cross-company verificado manualmente, no por constraint único compuesto.
   - Sin hash de request: no detecta payloads diferentes con misma key.
   - Sin TTL: los registros son permanentes.

3. **BullMQ jobId** en `packages/infrastructure/src/queues/document-processor.queue.ts:151` —
   usa `data.documentId` como `jobId` para dedup. Mecanismo correcto del message broker,
   pero sin visibilidad desde el dominio Drenyra y sin integración con tenant scope.

4. **CDR Webhook** en `apps/api/src/features/electronic-invoicing/` —
   verifica existencia previa vía `isCdrAlreadyProcessed()`. Idempotencia débil:
   solo funciona cuando el evento ya se registró en la transaction trail.

Cada mecanismo resuelve el problema inmediato, pero ninguno sigue un contrato común.
No hay:

- Definición explícita de estados del registro idempotente
- Política de payloads incompatibles
- Frontera transaccional garantizada entre registro y efecto de dominio
- Limpieza de registros expirados
- Matriz de escenarios documentada

Wave 1 (H02 — Tenant Isolation) endureció el scoping multi-tenant en todos los
repositories. Wave 2 necesita un contrato de idempotencia que sea igual de riguroso.

## Opciones Consideradas

### 1. Contrato canónico único (este ADR)

Definir un contrato de idempotencia explícito y reusable que cubra los tres canales
(HTTP commands, consumers, jobs) antes de escribir cualquier implementación.

**Ventajas:**

- Decisiones arquitectónicas validadas antes de codificar
- Matriz de escenarios completa antes de la migración
- Un solo artifact para revisar y aprobar

**Desventajas:**

- Sin código ejecutable hasta W2-03
- Riesgo de sobre-diseño si el contrato es demasiado genérico

### 2. Implementar W2-02 primero (tabla) y derivar el contrato

Comenzar con la migración de `idempotency_records` y ajustar el contrato a la
estructura resultante.

**Ventajas:**

- Feedback inmediato de PostgreSQL sobre constraints
- Iteración rápida

**Desventajas:**

- La estructura de la tabla condiciona el contrato en lugar de servirlo
- Difícil revertir si el modelo de estados está incompleto
- Mayor riesgo de inconsistencias entre canales

### 3. Middleware Elysia genérico, sin tabla propia

Usar el hook de Elysia para interceptar requests y cachear respuestas en Redis
sin tabla dedicada.

**Ventajas:**

- Rápido de implementar
- Sin migración de base de datos

**Desventajas:**

- No funciona para jobs y consumers que no pasan por HTTP
- No hay registro de auditoría (quiebre fiscal)
- Sin integración con rollback transaccional de base de datos

### 4. Solo mejorar el existente (SIRE + Map + BullMQ)

Mantener los mecanismos actuales, mejorando cada uno por separado.

**Ventajas:**

- Mínimo cambio
- Cada equipo mantiene su mecanismo

**Desventajas:**

- Sigue sin haber un contrato compartido
- Nuevas features no saben qué mecanismo usar
- Dificultad para auditar el comportamiento global

## Decisión

**Opción 1: Contrato canónico único.**

### Invariantes del contrato

1. **Una misma key, dentro del mismo scope y operación, representa una única intención.**
   La clave es única por `(organizationId, companyId, operation, idempotencyKey)`.

2. **Misma key + mismo payload → mismo resultado observable.**
   El resultado completo se almacena y reproduce exactamente.

3. **Misma key + payload diferente → rechazo.**
   `IdempotencyConflictError` con detalle del conflicto. Nunca silencioso.

4. **Dos ejecuciones concurrentes con la misma key no pueden producir dos efectos.**
   Reserva atómica vía INSERT con ON CONFLICT o advisory lock.
   Solo una gana; la otra espera o replica.

5. **Un fallo no debe dejar permanentemente bloqueada la key.**
   Estado FAILED permite reintento controlado.
   Estado PROCESSING expira tras timeout configurable.

6. **El registro idempotente y el efecto de dominio comparten frontera transaccional
   cuando sea posible.** En operaciones multi-recurso, al menos el registro y el
   primer efecto deben estar en la misma transacción.

7. **El aislamiento multi-tenant forma parte de toda restricción única.**
   `UNIQUE(organization_id, company_id, operation, idempotency_key)` como constraint
   base, no como check en aplicación.

8. **La idempotencia no reemplaza restricciones naturales del dominio.**
   Un asiento contable duplicado se detecta por su invariante de dominio
   (e.g. `UNIQUE(document_type, document_series, document_number, period)`),
   no por idempotencyKey.

9. **Consumers y jobs se deduplican mediante inbox pattern y unicidad lógica,
   no simulando requests HTTP.** Cada canal tiene su mecanismo de deduplicación
   específico, aunque comparten la tabla `idempotency_records` como respaldo.

### Modelo de estados

```
                  ┌──────────┐
                  │ PENDING  │
                  └────┬─────┘
                       │
              ┌────────┴────────┐
              │                 │
      ┌───────▼───────┐  ┌─────▼──────┐
      │  PROCESSING   │  │  COMPLETED  │ (replay)
      └───────┬───────┘  └────────────┘
              │
      ┌───────┴───────┐
      │    FAILED     │ (reintentable si TTL vigente)
      └───────────────┘
```

- **PENDING** → registro creado, operación no iniciada.
- **PROCESSING** → operación en curso. Se marca atómicamente.
  - **COMPLETED** → resultado terminal definitivo. Incluye tanto respuestas
    exitosas (2xx) como errores de negocio cacheables (409 Conflict,
    422 Unprocessable Entity) que ocurrieron DESPUÉS de aceptar la intención
    idempotente. FAILED (técnico) NO es COMPLETED.
  - **FAILED** → operación falló. Se subdivide en dos clases:
    - `RETRYABLE`: timeout, dependencia externa caída, deadlock, error transitorio.
      Reintentable dentro del TTL si el payload es idéntico.
    - `TERMINAL`: conflicto de negocio estable, operación prohibida, estado
      incompatible. No reintentable; el cliente debe corregir y enviar con nueva key.

    Transiciones permitidas:

  - PENDING → PROCESSING
  - PROCESSING → COMPLETED | FAILED
  - FAILED → PROCESSING (reintento, solo mismo payload Y `failure_class = RETRYABLE`)
  - Cualquier estado → EXPIRED (limpieza por TTL, no se persiste)

    Transiciones NO permitidas:

  - COMPLETED → nada (inmutable). Replay es reproducción, no transición.
  - FAILED (TERMINAL) → PROCESSING
  - FAILED → COMPLETED (no se puede pasar de fallo a éxito sin reprocesar).

### Frontera del registro idempotente

La decisión de registrar o no un resultado depende de si la intención fue aceptada,
no del código HTTP de la respuesta. Esto evita ambigüedades semánticas y asegura
que el cliente obtenga respuestas consistentes aunque haya efectos concurrentes.

| Fase                           | ¿Crea registro? | ¿Qué pasa con la key?                                      |
| ------------------------------ | --------------- | ---------------------------------------------------------- |
| Validación sintáctica previa   | No              | El cliente corrige y reintenta con nueva key               |
| Intención aceptada (insert OK) | Sí              | Se registra el resultado terminal (`COMPLETED` o `FAILED`) |
| Ejecución iniciada             | Sí              | `PROCESSING` → resultado terminal                          |
| Resultado de negocio (no 2xx)  | Sí              | Se cachea igual: 409, 422, regla de negocio                |
| Fallo transitorio              | Sí              | `FAILED` + `failure_class = RETRYABLE`                     |
| Fallo terminal                 | Sí              | `FAILED` + `failure_class = TERMINAL`                      |

Esto significa que errores como 409 Conflict, 422 Unprocessable Entity, o reglas
de negocio deterministas (periodo contable bloqueado, operación ya cerrada) SÍ se
cachean y reproducen, porque ocurrieron después de aceptar la intención idempotente.

### Política de payloads

| Escenario                                      | Comportamiento                                  |
| ---------------------------------------------- | ----------------------------------------------- |
| Misma key, mismo payload, COMPLETED            | Replay: resultado almacenado                    |
| Misma key, mismo payload, FAILED (RETRYABLE)   | Reintento: reprocesa (pasa a PROCESSING)        |
| Misma key, mismo payload, FAILED (TERMINAL)    | 409 Conflict: fallo terminal, no reintentable   |
| Misma key, mismo payload, PROCESSING           | Espera / 409 Conflict hasta completar           |
| Misma key, payload diferente, cualquier estado | 409 Conflict + `IdempotencyConflictError`       |
| Sin key                                        | Operación normal, sin idempotencia              |
| Key inválida (formato)                         | 400 Bad Request (validateKey antes de reservar) |

**Determinismo del hash de request:** El payload se normaliza antes de hashear:

- Keys ordenadas alfabéticamente
- Sin fields ignorables (timestamps generados por cliente, metadatos no funcionales)
- Lista de campos ignorables definida por operation

### TTL y limpieza

- **TTL base:** 24 horas desde la última transición de estado.
- **TTL extendido:** 7 días para operaciones fiscales con efecto irreversible
  (envíos SUNAT, asientos contables).
- **TTL no es la única barrera fiscal.** Para operaciones irreversibles, el TTL de
  la tabla genérica coexiste con una clave natural permanente o de larga duración
  en la entidad de dominio correspondiente — por ejemplo:
  - `UNIQUE(ruc, document_type, document_series, document_number, period)` en asientos
  - `submission_id` externo de SUNAT
  - Hash estable del documento
  - Identificador de transacción SUNAT (CDR) en la tabla de envíos.
    La idempotencia por key es una protección operativa; la unicidad natural es la
    barrera fiscal definitiva.
- **Limpieza:** job diario que elimina registros EXPIRED.
- **Regla de retention mínima:** nunca eliminar un registro COMPLETED antes de 24h.
- Reintento de un registro FAILED: el TTL se mide desde el último intento,
  no desde la creación.

### Concurrencia

1. **Reserva atómica:** INSERT con `ON CONFLICT DO NOTHING` + verificación posterior.
   Si el INSERT falla (key ya existe), se lee el registro existente y se actúa según estado.
2. **Protección contra carrera:** Si dos requests llegan simultáneamente con la misma key,
   solo una completa el INSERT. La otra espera (polling con backoff) o recibe 409.
3. **Advisory lock (opcional):** Para operaciones largas, `pg_advisory_xact_lock()` sobre
   un hash de la key para serializar sin bloquear la fila.
4. **Timeout de PROCESSING:** Si una operación no completa en N segundos
   (configurable por operación, default 30s), se considera huérfana y reintentable.

### Scope multi-tenant

Todo registro idempotente incluye:

- `organization_id` — UUID, NOT NULL
- `company_id` — UUID, NOT NULL

La unicidad es compuesta:

```sql
UNIQUE(organization_id, company_id, operation, idempotency_key)
```

Esto garantiza que Company A no puede bloquear una key de Company B
(problema identificado en H02 characterization tests).

### Lo que se almacena y reproduce

    **Siempre (cuando COMPLETED):**

    - `response_status` — código HTTP o estado análogo. Obligatorio.
    - `response_body` — JSON serializado del resultado. Puede ser NULL para
      respuestas sin cuerpo (204 No Content, comandos cuyo resultado observable
      es solo el status). NULL ≠ resultado incompleto; el estado COMPLETED
      garantiza completitud.
    - `response_headers` — headers relevantes (content-type, location, etag)

**Opcional (cuando aplica):**

- `resource_id` — ID del recurso creado (para re-hidratar en replay)
- `resource_type` — tipo de recurso
- `idempotent_at` — timestamp del primer éxito

### Lo que NO se almacena

- Datos sensibles (credenciales, tokens) — se redactan antes de persistir
- Streams o binary large — no aplica idempotencia
- Errores de validación sintáctica previa (antes de aceptar la intención) — no se
  cachean; el cliente debe corregir y reintentar con nueva key

### Relación con canales específicos

| Canal             | Mecanismo primario                       | Relación con tabla                                                         |
| ----------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| HTTP commands     | Middleware que usa `idempotency_records` | Directa: reserva, procesa, replica                                         |
| Message consumers | Inbox pattern con message_id único       | Tabla `inbox_messages` complementaria; `idempotency_records` como respaldo |
| Jobs (BullMQ)     | jobId nativo + `idempotency_records`     | `idempotency_records` para tracking de efecto más allá del queue           |
| SIRE (legacy)     | `sire_submissions` existente             | Convive durante migración; nueva tabla no reemplaza hasta W2 completo      |

### Exclusión explícita

La idempotencia no resuelve:

- **Deduplicación natural de dominio:** asientos duplicados por combinación
  (period, documentType, documentSeries, documentNumber) deben detectarse con
  constraints de base de datos.
- **Consistencia temporal:** si dos requests con distinta key modifican el mismo
  recurso concurrentemente, la idempotencia no serializa. Eso es control de
  concurrencia (optimistic/pessimistic locking).
- **Reordenamiento de eventos:** fuera de orden se maneja con event sourcing o
  versionamiento, no con idempotencia.

## Consecuencias

**Positivas:**

- Contrato único para toda forma de idempotencia en Drenyra
- Base para W2-02 (tabla), W2-03 (middleware end-to-end), W2-04 (natural uniqueness),
  W2-05 (inbox pattern) y W2-06 (job uniqueness)
- Matriz de comportamiento completa: ningún escenario queda a interpretación
- Rechazo explícito de payloads incompatibles evita corrupción silenciosa
- TTL evita crecimiento infinito de la tabla
- Scope multi-tenant en la restricción única (leverage de Wave 1)

**Negativas:**

- Operaciones sin idempotencyKey no tienen protección — necesario para adopción gradual
- Limpieza programada requiere job adicional
- Almacenar response_body incrementa tamaño de fila significativamente
- Transiciones FAILED → PROCESSING requieren verificación de payload idéntico

## Impacto Fiscal

Alto. La idempotencia es crítica para:

- Envíos SUNAT (no enviar dos veces el mismo libro electrónico)
- Asientos contables (no duplicar un asiento por reintento de red)
- CDR Webhooks (no procesar dos veces la misma respuesta SUNAT)
- Creación de fiscal cases (no duplicar por doble click o timeout del cliente)

Un contrato incorrecto puede generar:

- **Doble efecto fiscal:** si el replay no es fiel al original
- **Pérdida de operaciones:** si el TTL es demasiado corto para reintentos humanos
- **Cross-tenant leak:** si el scope no está en el unique constraint
- **Corrupción fiscal silenciosa:** si se acepta key con payload diferente

Este contrato mitiga los cuatro riesgos explícitamente.

## Supersedes

No reemplaza ADRs existentes. Complementa ADR-005 (domain integrity) y
los contratos definidos en `packages/domain/src/drenyra/contracts.ts`.

## Próximos pasos (W2-02 en adelante)

| Wave  | Artefacto                                 | Dependencia         |
| ----- | ----------------------------------------- | ------------------- |
| W2-02 | Migración `idempotency_records`           | Este ADR aprobado   |
| W2-03 | Middleware/application service end-to-end | Tabla lista         |
| W2-04 | Natural uniqueness patterns               | Contrato claro      |
| W2-05 | Consumer inbox pattern                    | Middleware listo    |
| W2-06 | Job uniqueness                            | Inbox pattern listo |
| W2-07 | PostgreSQL verification + CI guardrail    | Todo lo anterior    |
