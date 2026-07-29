# 08 — Integration Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 7 de 8 — Integración
**Propósito:** conectar sistemas externos mediante contratos financieros homogéneos, verificables y recuperables.

---

## Qué es

El Integration Plane define cómo Drenyra se relaciona con SUNAT y otras autoridades, bancos, ERPs, fuentes de documentos, gateways de pago, proveedores de nómina y registros externos. Su identidad es DFP, el **Drenyra Financial Protocol**: una abstracción de dominio que ofrece capacidades consistentes aunque por debajo use APIs, archivos, colas, OCR o adaptadores específicos.

DFP evita que la topología del proveedor se filtre al dominio. El Financial Plane pide “obtener estado de comprobante”, “enviar registro fiscal” o “conciliar transacciones”; el conector traduce esa intención tipada al protocolo de SUNAT, un banco o un ERP. Cada llamada conserva compañía, jurisdicción, credenciales autorizadas, correlación, candidate y receipt cuando corresponda.

## Qué no es

No es una colección de scripts ad hoc, SDKs expuestos directamente a agentes ni una excusa para enviar texto libre a un sistema externo. Un conector no decide impuestos, aprueba pagos ni interpreta una respuesta ambigua como éxito. Los contratos de [Intelligence](../04-intelligence-plane/README.md), las gates de [Trust](../05-trust-plane/README.md) y la durabilidad de [Execution](../06-execution-plane/README.md) se mantienen al otro lado de la frontera.

## Adopt before build

Drenyra adopta infraestructura probada antes de construir equivalentes propios: motores de workflow, almacenamiento de objetos, identity providers, KMS/Vault, streaming, OCR y SDKs bancarios. Construye sobre ellos la semántica diferenciadora: DFP, mapeos financieros, evidencia, políticas, conformance y operación multi-tenant. Este criterio reduce superficie de fallo y permite concentrar el esfuerzo en lo que requiere conocimiento fiscal.

Por ejemplo, puede adoptar un proveedor de extracción documental, pero Drenyra debe construir la verificación de RUC, reglas de consistencia fiscal, mapping contable y lineage de evidencia. Puede adoptar un gateway de pagos, pero conserva su propia idempotencia, aprobación y conciliación.

## Connector Conformance Framework

Todo conector implementa un contrato versionado y una suite de conformidad. El framework exige:

- capacidades declaradas y schemas de request/response;
- autenticación y credenciales aisladas por tenant;
- idempotency, correlación y propagación de fencing cuando la operación es material;
- timeouts, retry classes, circuit breaker y manejo explícito de respuestas parciales;
- normalización de errores a un vocabulario DFP;
- eventos y observabilidad por llamada, sin filtrar secretos;
- fixtures sandbox, pruebas de compatibilidad y versionado de cambios.

Un conector que no puede confirmar una presentación devuelve un resultado que permite `unknown`; no inventa `completed`. Los cambios incompatibles se versionan y se prueban antes de adoptar una API de proveedor nueva.

## Ejemplo práctico

Para presentar un registro en SUNAT, un workflow recibe un candidate aprobado y usa una tool R3 tipada: jurisdicción, compañía, período, tipo de registro, candidate receipt y approval token. El conector valida capability y credenciales, transforma el request al formato de la autoridad y registra la correlación externa. Si la red falla después del envío, Execution marca `unknown` y consulta el estado antes de repetir. El receipt final conserva request hash, respuesta normalizada, versión del conector y evidencia de confirmación.

Para un banco, la misma disciplina permite importar movimientos, normalizarlos y exponerlos a conciliación sin asumir que dos proveedores comparten identificadores o fechas. El [Financial Plane](../07-financial-plane/README.md) consume el modelo normalizado; no conoce los detalles del API bancario.

## Country Packs e integración

La variación regional no convierte cada conector en una bifurcación de plataforma. El [Country Plane](../09-country-plane/README.md) declara autoridades, documentos, calendarios y reglas de cada jurisdicción; Integration resuelve los adaptadores compatibles. Un pack de Perú puede requerir SUNAT, SIRE y CPE; uno de Colombia DIAN y sus documentos electrónicos, pero ambos implementan capacidades DFP compartidas cuando su semántica lo permite.

## Reglas operativas

### Hacer

- Adoptar infraestructura probada antes de construir equivalentes propios — concentrar esfuerzo en semántica fiscal.
- Implementar el Connector Conformance Framework para cada integración.
- Normalizar errores externos al vocabulario DFP.
- Aislar credenciales por tenant — nunca compartir autorizaciones entre compañías.

### No hacer

- No exponer SDKs de proveedores directamente a agentes — siempre a través de una tool tipada.
- No interpretar una respuesta ambigua como éxito — retornar `unknown` y dejar que Execution reconcilie.
- No construir conectores sin un contrato versionado y suite de conformidad.
- No bifurcar la plataforma por variación regional — usar [Country Packs](../09-country-plane/README.md) para declarar diferencias.

---

## Relación con los demás planos

- [Workspace](../03-workspace-plane/README.md) fija el scope de compañía, período y objetivo de cada llamada.
- [Intelligence](../04-intelligence-plane/README.md) accede a conectores sólo por tools autorizadas y schemas.
- [Trust](../05-trust-plane/README.md) enlaza aprobaciones y receipts a efectos externos.
- [Execution](../06-execution-plane/README.md) garantiza reintentos, fences y reconciliación.
- [Financial](../07-financial-plane/README.md) recibe hechos normalizados y resultados confirmados.

Una integración conforme no es sólo una conexión exitosa: es una frontera que conserva significado, autoridad y evidencia incluso cuando el proveedor falla.
