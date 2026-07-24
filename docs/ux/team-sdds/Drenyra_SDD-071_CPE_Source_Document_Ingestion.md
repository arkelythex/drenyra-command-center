# SDD-071 — CPE and Source Document Ingestion

**Estado:** PROPOSED  
**Depende de:** SDD-010, 013, 014, 019, 020, 034, 035

## Decisión

Toda entrada documental seguirá un pipeline durable: `RECEIVED → QUARANTINED → PARSED → VALIDATED → MATCHED → ACCEPTED`, con alternativas `NEEDS_ATTENTION`, `REJECTED`, `DUPLICATE` y `FAILED`.

## Fuentes

Upload, import masivo, email/connector autorizado, API y sincronización externa. Cada fuente produce provenance, hash, MIME real, tamaño, actor y scope.

## Pipeline

- malware/content safety;
- parsing sin confiar en extensión;
- schema validation;
- identidad CPE y natural uniqueness;
- firma/estado externo cuando corresponda;
- match de empresa, partner y periodo;
- classification rules;
- exceptions y evidence.

## Reglas

1. Archivo no procesado no se trata como evidencia válida.
2. Duplicate conserva referencias de recepción sin duplicar artifact fiscal.
3. Parser output es untrusted hasta validar.
4. Corrección manual crea nueva versión y razón.
5. Bulk import reporta resultados parciales por item.
6. Datos cross-company no se autocorrigen mediante heurística.

## UX

Dropzone y batch table muestran progreso durable, no upload ilusorio. El usuario filtra needs attention, corrige mappings y ve original/parsed. Errores incluyen next action y posibilidad de reprocess idempotente.

## Criterios de aceptación

- Failure injection cubre crash, duplicate y parser timeout.
- Archivos peligrosos quedan aislados.
- Identidad/version/evidence son trazables.
- 10k documentos se procesan sin bloquear UI.
- Ningún AgentRun recibe contenido no saneado como instrucciones confiables.
