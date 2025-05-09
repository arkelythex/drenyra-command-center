# W2-06D — Job Atomicity Matrix

**Última actualización:** 2026-07-13  
**Estado:** Final (W2-06D)  
**Siguiente:** W2-07 — End-to-End Integrity Verification

---

## Clasificación general

| Categoría                     | Significado                                                                                       | Jobs                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------- |
| **DB\_ATOMIC**                | Efecto + completion comparten transacción PostgreSQL. Retry siempre seguro.                       | J1, J2, J5, J6, J8, J9  |
| **DB\_SPLIT\_TRANSACTION**    | Efecto y completion en commits separados. Ventana de duplicación posible.                         | — (ninguno actualmente) |
| **EXTERNAL\_IDEMPOTENT**      | Efecto externo, pero el proveedor garantiza idempotencia o existe clave natural para reconciliar. | J3 (SUNAT)              |
| **EXTERNAL\_NON\_IDEMPOTENT** | Efecto externo sin garantía de idempotencia del proveedor. Requiere estado UNKNOWN.               | J4 (Email)              |
| **MIXED**                     | Sub-operaciones con distintas fronteras transaccionales.                                          | J7 (Fiscal nightly)     |

---

## Matriz detallada

### J1 — OCR: process-document

| Propiedad                       | Valor                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- |
| **Categoría**                   | `DB_ATOMIC`                                                            |
| **Frontera transaccional**      | SHARED: `UPDATE documents` + `job_executions.complete` en misma tx PG  |
| **Clave natural / idempotente** | `document_id + content_hash + processor_version` (en logical_key)      |
| **Estado ambiguo posible**      | Ninguno. Todo en PG, misma transacción.                                |
| **Estrategia de retry**         | Siempre seguro. El UPDATE es idempotente (mismo input → mismo output). |
| **Reconciliador**               | Registry basta. `PERMANENT_BY_INPUT` bloquea identidad duplicada.      |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'`                                  |
| **Riesgo residual**             | Ninguno.                                                               |

### J2 — AI Analysis: analyze

| Propiedad                       | Valor                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| **Categoría**                   | `DB_ATOMIC`                                                       |
| **Frontera transaccional**      | SHARED: UPSERT + completion en misma tx PG                        |
| **Clave natural / idempotente** | `(document_id, analysis_type, model_version)` + unique constraint |
| **Estado ambiguo posible**      | Ninguno.                                                          |
| **Estrategia de retry**         | Siempre seguro. UPSERT por clave natural es idempotente.          |
| **Reconciliador**               | Registry + unique constraint natural.                             |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'`                             |
| **Riesgo residual**             | Ninguno.                                                          |

### J3 — SUNAT: submit

| Propiedad                       | Valor                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Categoría**                   | `EXTERNAL_IDEMPOTENT`                                                                                                           |
| **Frontera transaccional**      | SPLIT: HTTP a SUNAT OSE entre commits PG                                                                                        |
| **Clave natural / idempotente** | SUNAT CDR idempotente por `(invoice_id, RUC_emisor, serie, numero)`. Reconciliation por RUC + período + tipo de envío + ticket. |
| **Estado ambiguo posible**      | `UNKNOWN` si timeout después de enviar HTTP (no se sabe si SUNAT recibió).                                                      |
| **Estrategia de retry**         | Reconciliation-first. Consultar estado SUNAT antes de retry. Si timeout post-envío → `RUNNING → UNKNOWN`. No retry ciego.       |
| **Reconciliador**               | Reconciliation especializado que consulta CDR vía API SUNAT.                                                                    |
| **Señal de éxito definitiva**   | CDR firmado por SUNAT almacenado en PG + `job_executions.status = 'COMPLETED'`                                                  |
| **Riesgo residual**             | Doble envío: SUNAT retorna mismo CDR (idempotente). Timeout: UNKNOWN hasta reconciliar.                                         |

### J4 — Email: send

| Propiedad                       | Valor                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Categoría**                   | `EXTERNAL_NON_IDEMPOTENT`                                                                                                                                              |
| **Frontera transaccional**      | SPLIT: HTTP a proveedor externo                                                                                                                                        |
| **Clave natural / idempotente** | Resend `Idempotency-Key` header cuando disponible. Fallback: webhook + estado UNKNOWN.                                                                                 |
| **Estado ambiguo posible**      | `UNKNOWN` si HTTP se envió pero no hubo respuesta. **No re-intentar sin confirmación.**                                                                                |
| **Estrategia de retry**         | 1) Usar `Idempotency-Key` del proveedor (Resend). 2) Persistir identifier devuelto. 3) Webhook para resolver UNKNOWN. 4) UNKNOWN irresoluble requiere revisión manual. |
| **Reconciliador**               | Delivery webhook callback + dashboard de UNKNOWN.                                                                                                                      |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'` + delivery confirmation via webhook.                                                                                             |
| **Riesgo residual**             | Email duplicado si el proveedor no soporta idempotencia y no hay webhook. UNKNOWN irresoluble requiere humano.                                                         |

**Prioridad de resolución de ambigüedad:**

1. `Idempotency-Key` del proveedor → retry seguro
2. Identificador externo persistido → reconciliation
3. Webhook delivery → resuelve UNKNOWN automáticamente
4. UNKNOWN persistente → dashboard + acción manual

### J5 — Report: generate

| Propiedad                       | Valor                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| **Categoría**                   | `DB_ATOMIC`                                                                               |
| **Frontera transaccional**      | SHARED: UPSERT en `report_registry` + completion. File S3 overwrite es idempotente.       |
| **Clave natural / idempotente** | `(report_type, org_id, date_from, date_to, format)` + unique constraint                   |
| **Estado ambiguo posible**      | File generado en S3 pero registro PG no insertado → reconciliation re-genera (overwrite). |
| **Estrategia de retry**         | Siempre seguro. Unique constraint + S3 overwrite.                                         |
| **Reconciliador**               | Registry basta. REPLACEABLE permite nueva generación.                                     |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'`                                                     |
| **Riesgo residual**             | Archivo S3 dos veces (mismo contenido, overwrite). No hay duplicación funcional.          |

### J6 — Document: process (main pipeline)

| Propiedad                       | Valor                                           |
| ------------------------------- | ----------------------------------------------- |
| **Categoría**                   | `DB_ATOMIC`                                     |
| **Frontera transaccional**      | SHARED: UPDATE documents + completion           |
| **Clave natural / idempotente** | `document_id + content_hash + pipeline_version` |
| **Estado ambiguo posible**      | Ninguno.                                        |
| **Estrategia de retry**         | Siempre seguro. Mismo input → mismo resultado.  |
| **Reconciliador**               | Registry basta.                                 |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'`           |
| **Riesgo residual**             | Ninguno.                                        |

### J7 — Fiscal nightly (WINDOWED)

| Propiedad                       | Valor                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Categoría**                   | `MIXED`                                                                                                     |
| **Frontera transaccional**      | SPLIT: cada sub-operación tiene su propia frontera PG. Algunas son solo lectura, otras envían emails.       |
| **Clave natural / idempotente** | Por sub-operación individual. Ventana `(org_id, company_id, period)`.                                       |
| **Estado ambiguo posible**      | Posible si una sub-operación con proveedor externo deja UNKNOWN.                                            |
| **Estrategia de retry**         | Ventana completa es retryable. Cada sub-op idempotente individualmente. No re-envía efectos ya confirmados. |
| **Reconciliador**               | Reconciliation por ventana WINDOWED. Cada sub-operación con su propio reconciler.                           |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'` + todos los checks de la ventana verificados.                         |
| **Riesgo residual**             | Alerta duplicada si el proveedor de email no es idempotente. Mitigación: J4 idempotency key.                |

### J8 — CSV batch (ACTIVE_ONLY)

| Propiedad                       | Valor                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Categoría**                   | `DB_ATOMIC`                                                                                      |
| **Frontera transaccional**      | SHARED: batch INSERT + completion                                                                |
| **Clave natural / idempotente** | N/A (batch_id transciente)                                                                       |
| **Estado ambiguo posible**      | Ninguno.                                                                                         |
| **Estrategia de retry**         | Siempre seguro (mismos datos → mismos rows). ACTIVE_ONLY permite nueva ejecución tras COMPLETED. |
| **Reconciliador**               | Registry basta.                                                                                  |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'`                                                            |
| **Riesgo residual**             | Ninguno.                                                                                         |

### J9 — Pre-audit (WINDOWED)

| Propiedad                       | Valor                                                  |
| ------------------------------- | ------------------------------------------------------ |
| **Categoría**                   | `DB_ATOMIC`                                            |
| **Frontera transaccional**      | SHARED: solo lectura + resultado en PG                 |
| **Clave natural / idempotente** | `(org_id, date)` + window                              |
| **Estado ambiguo posible**      | Ninguno.                                               |
| **Estrategia de retry**         | Siempre seguro. Solo lectura + escritura de resultado. |
| **Reconciliador**               | Registry basta.                                        |
| **Señal de éxito definitiva**   | `job_executions.status = 'COMPLETED'`                  |
| **Riesgo residual**             | Ninguno.                                               |

---

## Resumen

| Categoría                     | Jobs                   | Retry seguro                | Riesgo                    | Mitigación                    |
| ----------------------------- | ---------------------- | --------------------------- | ------------------------- | ----------------------------- |
| **DB\_ATOMIC**                | J1, J2, J5, J6, J8, J9 | ✅ Siempre                  | Ninguno                   | N/A                           |
| **EXTERNAL\_IDEMPOTENT**      | J3 (SUNAT)             | ✅ Con reconciliation       | Timeout → UNKNOWN         | Consulta CDR pre-retry        |
| **EXTERNAL\_NON\_IDEMPOTENT** | J4 (Email)             | ⚠️ Solo con Idempotency-Key | Email duplicado o perdido | UNKNOWN + webhook + dashboard |
| **MIXED**                     | J7 (Fiscal nightly)    | ✅ Por sub-operación        | Alerta duplicada          | J4 idempotency key            |

**Regla general:** Ningún job está clasificado como "retry siempre seguro" sin justificar por qué la frontera transaccional lo garantiza.
