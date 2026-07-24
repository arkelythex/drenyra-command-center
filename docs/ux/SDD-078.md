# SDD-078 — Audit and Evidence Export

**Estado:** PROPOSED  
**Depende de:** SDD-013–018, 053, 056, 077, 090

## Decisión

Drenyra generará expedientes portables con manifest verificable. Exportar no será descargar una carpeta arbitraria; será una proyección autorizada y reproducible de artefactos, versiones, evidence links y audit events.

## Contenido

- manifest con scope, filtros, generated-at y generator version;
- artifact inventory y hashes;
- source/derived documents permitidos;
- rule/policy versions;
- diffs, reviews y approvals;
- executions y receipts;
- audit timeline;
- omissions/redactions declaradas.

## Formatos

PDF/HTML para lectura, CSV para tablas, JSON para interoperabilidad y archivos fuente permitidos. Un manifest enlaza todos; formatos no cambian semántica.

## Seguridad

Export exige policy, purpose y optional expiry/watermark. Se cifra en tránsito/almacenamiento temporal. Signed access expira. Descargas y shares se auditan. Auditor solo recibe companies/periods concedidos.

## Integridad

Hashes y manifest permiten detectar modificación. Reproducir export con mismo snapshot produce contenido semánticamente equivalente; timestamps de generación no alteran artifacts.

## Criterios de aceptación

- Export grande usa job durable.
- Revocation impide nuevas descargas sin borrar audit.
- Manifest valida todos los archivos incluidos.
- Redactions/omissions son visibles.
- Tests prueban cross-tenant, expiry y corrupted bundle.
