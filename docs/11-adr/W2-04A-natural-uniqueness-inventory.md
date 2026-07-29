# W2-04A — Natural Uniqueness: Inventario y Contrato

**Estado:** Borrador
**Fecha:** 2026-07-12
**Depende de:** ADR-009 (Contrato de Idempotencia), W2-03 (Idempotencia end-to-end)

## Objetivo

Identificar para cada agregado de dominio su **clave natural permanente** y decidir la política de conflicto, asegurando que:

- La expiración de `idempotency_records` nunca permita repetir efectos irreversibles.
- Duplicados técnicos (mismo comando reintentado) y duplicados de negocio (mismo documento enviado dos veces por error) se distingan correctamente.
- Todo constraint único incluya scope multi-tenant (organization_id o company_id).
- Las restricciones existentes en PostgreSQL se complementen donde falten.

## Prioridades (por criticidad fiscal)

1. **Journal Entries** — asientos contables
2. **Invoices / Bills** — documentos fiscales (CPE)
3. **SIRE Submissions** — libros electrónicos SUNAT
4. **Imports / External References** — referencias externas
5. **Period-scoped correlatives** — correlativos por período

---

## 1. Journal Entries (`journal_entries`)

### Estado actual

```sql
-- Solo índices, sin unique constraint:
INDEX (company_id, period_key)
INDEX (entry_number)
INDEX (status)
```

### Clave natural

`(company_id, period_key, entry_number)` → un asiento por compañía, período y número de asiento.

### Scope

`company_id` — el asiento pertenece a una compañía. El período ya está en `period_key`.

### Conflicto

| Escenario                                      | Naturaleza   | Comportamiento                                 |
| ---------------------------------------------- | ------------ | ---------------------------------------------- |
| Mismo entry_number en distinto período         | ✅ Legítimo  | Permitido (cada período tiene su numeración)   |
| Mismo entry_number en misma compañía y período | ❌ Duplicado | Rechazar con `UNIQUE VIOLATION`                |
| Misma combinación desde distinta compañía      | ✅ Legítimo  | Permitido (cada compañía numera independiente) |

### Acción

**Añadir**:

```sql
UNIQUE (company_id, period_key, entry_number)
```

### Riesgo

Si el sistema permite re-numeración manual de asientos, un cambio de `entry_number` podría violar el unique. En ese caso, la actualización debe ocurrir en una transacción que valide el nuevo número contra los existentes. Alternativa: `entry_number` generado automáticamente por secuencia.

**Dimensión adicional:** Si la contabilidad usa múltiples libros/diarios (e.g., diario general, diario de ventas, diario de compras), la clave puede necesitar `journal_code` como dimensión extra:

```sql
UNIQUE (company_id, period_key, journal_code, entry_number)
```

Sin `journal_code`, dos asientos del mismo número en libros distintos colisionarían ilegítimamente.

---

## 2. Invoices (`invoices`) y Bills (`bills`)

### Estado actual

```sql
-- invoices:
series: varchar(10) NOT NULL
correlative: integer NOT NULL
-- Sin unique constraint sobre (company_id, series, correlative)
-- Solo FK a company y customer

-- bills:
-- Misma estructura (series + correlative)
```

### Clave natural

**Peruanas (CPE):** `(company_id, document_type, series, correlative)` → una factura/boleta/NC/ND por tipo de documento, serie y correlativo dentro de la compañía. El `document_type` es necesario porque factura, boleta, nota de crédito y nota de débito tienen espacios de numeración separados.

**Recibidas (proveedores):** `(company_id, issuer_tax_id, document_type, series, correlative)` → el `issuer_tax_id` (RUC del emisor) identifica al proveedor, no al comprador. `buyer_tax_id` es siempre el RUC de la propia compañía y no distingue nada. El `document_type` evita colisiones entre distintos tipos de CPE del mismo emisor.

### Scope

`company_id` — cada compañía emite sus propios documentos.

### Conflicto

| Escenario                                               | Naturaleza            | Comportamiento                   |
| ------------------------------------------------------- | --------------------- | -------------------------------- |
| Misma serie + correlativo en misma compañía             | ❌ Duplicado contable | Rechazar (nunca debe existir)    |
| Misma serie + correlativo en compañía distinta          | ✅ Legítimo           | Permitido                        |
| Mismo invoice_number (proveedor) + buyer_tax_id         | ❌ Duplicado (AP)     | Rechazar si ya existe            |
| Misma factura recibida en dos compañías del mismo grupo | ⚠️ Depende            | Ver política del grupo económico |

### Acción

**Añadir**:

```sql
-- Para facturas emitidas (PE):
UNIQUE (company_id, series, correlative)

-- Para facturas recibidas (proveedores):
UNIQUE (company_id, issuer_tax_id, document_type, series, correlative)

-- Para bills (recibidas):
UNIQUE (company_id, series, correlative)  -- si aplica
UNIQUE (company_id, supplier_tax_id, bill_number)
```

### Riesgo

El correlativo de facturación no siempre es secuencial estricto (anulaciones, contingencias). El `UNIQUE` es correcto porque incluso una factura anulada conserva su número original.

---

## 3. SIRE Submissions (`sire_submissions`)

### Estado actual

```sql
idempotency_key varchar(100) UNIQUE NOT NULL
-- Sin unique sobre (company_id, period, ledger_type)
```

### Clave natural

`(company_id, period, ledger_type)` → una declaración SIRE por compañía, período y tipo de libro.

### Scope

`company_id` — cada compañía presenta sus propios libros.

### Conflicto

| Escenario                                     | Naturaleza          | Comportamiento                                                                                         |
| --------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| Misma compañía, período y ledger_type         | ❌ Duplicado fiscal | Rechazar. No se puede enviar dos veces el mismo libro del mismo período                                |
| Mismo período, ledger_type, compañía distinta | ✅ Legítimo         | Permitido                                                                                              |
| Reintento de una submission FAILED            | ⚠️ Técnico          | El idempotency_key lo maneja. La clave natural ya existe y está FAILED → permitir reemplazo controlado |

### Acción

**Añadir**:

```sql
UNIQUE (company_id, period, ledger_type)
```

**Nota:** Esta restricción es complementaria a `idempotency_key`. La clave natural impide dos declaraciones distintas para el mismo período/libro aunque tengan distinta key de idempotencia. La `idempotency_key` impide reintentos de la misma declaración.

### Riesgo

SIRE permite reemplazar una declaración dentro del plazo (rectificatoria). El `UNIQUE` original sobre `(company_id, period, ledger_type)` bloquearía rectificatorias legítimas.

**Solución aplicada:** Se añadió `submission_kind` a la clave y al constraint:

```sql
UNIQUE (company_id, period, ledger_type, submission_kind)
```

Donde `submission_kind` distingue entre `original` y `rectificatoria`. Esto permite que una declaración original y su rectificatoria coexistan como filas independientes.

**Dimensión adicional:** Si el negocio permite múltiples envíos del mismo período/libro (original + rectificatoria), la clave puede necesitar `submission_kind` y `revision_number`:

```sql
UNIQUE (company_id, period, ledger_type, submission_kind, revision_number)
```

Donde `submission_kind` distingue entre `original` y `rectificatoria`. Sin esto, una rectificatoria legítima podría ser rechazada por colisionar con la declaración original.

---

## 4. Imports / External References

### Estado actual

No existe una tabla genérica de `external_references`. Las referencias externas aparecen como columnas sueltas en varias tablas (e.g., `sunat_ticket`, `cdr_url`, `provider_reference`).

### Clave natural

Depende del origen:

| Origen                           | Clave natural                                     | Scope   |
| -------------------------------- | ------------------------------------------------- | ------- |
| SUNAT CDR                        | `(company_id, sunat_ticket)`                      | company |
| Proveedor externo (API)          | `(company_id, provider_name, provider_reference)` | company |
| Upload de archivo                | `(company_id, file_hash)`                         | company |
| Migración desde sistema anterior | `(company_id, legacy_system, legacy_id)`          | company |

### Conflicto

| Escenario                                     | Naturaleza   | Comportamiento                                  |
| --------------------------------------------- | ------------ | ----------------------------------------------- |
| Mismo SUNAT ticket en misma compañía          | ❌ Duplicado | Rechazar (el CDR ya se procesó)                 |
| Mismo hash de archivo en misma compañía       | ❌ Duplicado | Rechazar o upsert según política de importación |
| Misma referencia externa en compañía distinta | ✅ Legítimo  | Permitido                                       |

### Acción

**Propuesta de tabla genérica:**

```sql
CREATE TABLE external_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  source VARCHAR(50) NOT NULL,      -- 'sunat', 'provider_x', 'file_upload', 'legacy'
  external_id VARCHAR(255) NOT NULL, -- ID en el sistema externo
  entity_type VARCHAR(50) NOT NULL,  -- 'invoice', 'journal_entry', 'submission'
  entity_id UUID NOT NULL,           -- FK a la entidad local
  raw_data JSONB,                    -- payload original opcional
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, source, external_id)
);
```

Esto evita procesar dos veces el mismo webhook de SUNAT, la misma respuesta de API o el mismo archivo subido.

---

## 5. Period-Scoped Correlatives

### Estado actual

No existe una tabla de correlativos. Los números de asiento y facturas son campos `varchar`/`integer` sin garantía de secuencia.

### Clave natural

`(company_id, document_type, period_key)` → un correlativo por tipo de documento, compañía y período.

### Propuesta

```sql
CREATE TABLE document_correlatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,  -- 'journal_entry', 'invoice', 'credit_note'
  period_key VARCHAR(7) NOT NULL,       -- YYYY-MM
  last_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, document_type, period_key)
);
```

### Conflicto

| Escenario                               | Naturaleza | Comportamiento                                                                                            |
| --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| Dos transacciones sacan el mismo número | ❌ Race    | El `UNIQUE` evita duplicados. Usar `INSERT ... ON CONFLICT` o `UPDATE ... RETURNING` para nextval atómico |
| Reset periódico                         | ✅ Diseño  | Cada período tiene su propia secuencia                                                                    |

**Nota:** Los correlativos secuenciales no son obligatorios para todos los documentos peruanos (e.g., asientos contables no tienen numeración SUNAT obligatoria), pero son buena práctica de auditoría.

---

## Matriz resumen

| Agregado                | Clave natural                                                     | Scope   | UNIQUE actual             | UNIQUE necesario | Criticidad  |
| ----------------------- | ----------------------------------------------------------------- | ------- | ------------------------- | ---------------- | ----------- |
| `journal_entries`       | `(company_id, period_key, entry_number)`                          | company | ❌                        | ✅               | **ALTA**    |
| `invoices` (emitidas)   | `(company_id, series, correlative)`                               | company | ❌                        | ✅               | **ALTA**    |
| `invoices` (recibidas)  | `(company_id, issuer_tax_id, document_type, series, correlative)` | company | ❌                        | ✅               | ALTA        |
| `bills` (recibidas)     | `(company_id, supplier_tax_id, bill_number)`                      | company | ❌                        | ✅               | ALTA        |
| `sire_submissions`      | `(company_id, period, ledger_type)`                               | company | ❌ (solo idempotency_key) | ✅               | **CRÍTICA** |
| `external_references`   | `(company_id, source, external_id)`                               | company | ❌ (nueva tabla)          | ✅               | MEDIA       |
| `document_correlatives` | `(company_id, document_type, period_key)`                         | company | ❌ (nueva tabla)          | ✅               | BAJA        |
| `pcge_accounts`         | `(company_id, code)`                                              | company | ❌ (solo index)           | ✅               | MEDIA       |

## Limitaciones y excepciones

1. **Rectificatorias SIRE:** La clave natural `(company_id, period, ledger_type)` entra en conflicto con la necesidad de reemplazar declaraciones. Política: `ON CONFLICT DO UPDATE` con registro de auditoría, nunca `DO NOTHING` silencioso.

2. **Anulación de facturas:** La factura anulada conserva su serie + correlativo. El `UNIQUE` es correcto — no se permite reutilizar números aunque el documento esté anulado.

3. **Múltiples empresas del mismo grupo:** Si dos compañías del mismo grupo económico reciben la misma factura de proveedor, el `UNIQUE (company_id, issuer_tax_id, document_type, series, correlative)` lo permite (company_id es diferente). Si se requiere detección cross-company, es un feature separado.

4. **Idempotencia vs. Unicidad natural:** La idempotencia (W2-03) protege contra reintentos del mismo comando. La unicidad natural protege contra documentos intrínsecamente duplicados. Una no reemplaza a la otra — son complementarias.

## Próximos pasos

```text
W2-04B  Constraints y migraciones
W2-04C  Concurrencia + PostgreSQL verification
W2-04D  CI guardrail
```
