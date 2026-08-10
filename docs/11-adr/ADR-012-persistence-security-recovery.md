# ADR-012: Persistencia, Seguridad y Recuperación (Design 4)

**Fecha:** 2026-08-11
**Estado:** Aprobado — modelo de almacenamiento, datos autoritativos, idempotencia, estados desconocidos y controles de seguridad
**Alcance:** Drenyra, Drenyra-AI, Drenyra Pi, Drenyra Engram, Adaptadores
**Referencia:** [Design 04 — Persistence, Security & Recovery](https://github.com/arkelythex/drenyra-ai/blob/main/docs/design/design-04-persistence-security-recovery.md)

---

## Context

El estado autoritativo no puede vivir en la conversación ni en la memoria del modelo:
una misión debe recuperarse desde eventos, evidencia y receipts, no desde un transcript.
Sin un modelo de almacenamiento y recuperación formal, cada componente del ecosistema
podía decidir distinto sobre qué es canónico, cómo se garantiza idempotencia y cómo se
tratan los resultados desconocidos de llamadas externas (riesgo de asientos duplicados).

## Decision

Aprobado el Diseño 4 con cinco piezas normativas:

### 1. Modelo de almacenamiento

| Almacén | Contenido | Propiedad |
| --- | --- | --- |
| **PostgreSQL** | Misiones, eventos, candidatos, aprobaciones, gates e idempotencia | Estado transaccional |
| **Object storage** | XML, PDF, extractos y evidencia original | Artefactos inmutables por hash |
| **Ledger append-only** | Receipts ordenados y encadenados | Historia verificable |
| **KMS / Key Vault** | Claves Ed25519 y secretos de conectores | Material criptográfico |
| **Policy Registry** | Skills y políticas versionadas | Reglas reproducibles |
| **Engram** | Decisiones, contexto y conocimiento institucional | **Memoria no autoritativa** |

El adaptador JSON actual queda **limitado a desarrollo y demostraciones**. Producción
requiere transacciones, control de concurrencia y persistencia durable.

### 2. Modelo de datos autoritativo

Toda entidad fiscal lleva obligatoriamente: `tenantId`, `ruc`, `companyId`,
`fiscalPeriodId`, `missionId`, `schemaVersion`, `createdAt` e identidad del actor/sistema
de origen. El scope es parte de consultas, mutaciones, restricciones únicas, idempotency
keys y hashes — **no basta con filtrar después de leer**.

### 3. Evidencia y aprobaciones

- **Evidencia:** los archivos originales se almacenan una vez y se referencian por hash,
  tipo/formato, sistema de procedencia, fecha de obtención, periodo declarado, actor o
  conector, estado de verificación y política de retención. Los documentos son **entrada
  no confiable**: un PDF/XML/descripción nunca puede inyectar instrucciones al agente,
  modificar permisos ni solicitar herramientas.
- **Aprobación** vinculada a: hash exacto del candidato, scope exacto, materialidad
  calculada, evidencia disponible, identidad y rol del aprobador, momento y política
  aplicada. Si cambia el candidato, la evidencia o el scope, la aprobación **deja de
  gobernar** la nueva versión. Para R3, los dos aprobadores deben ser identidades
  distintas con los roles exigidos.

### 4. Idempotencia, concurrencia y estados desconocidos

- Idempotency key derivada de `tenant + company + fiscalPeriod + intent + candidateIdentity`.
- Optimistic concurrency, versiones esperadas, fencing tokens para workers, unicidad en
  DB, inbox/outbox, deducción de reintentos y confirmación externa antes de repetir
  mutaciones. Dos agentes pueden analizar en paralelo, pero **no pueden confirmar dos
  veces el mismo candidato**.
- **Estados desconocidos:** una llamada interrumpida después de enviarse no se marca como
  error — se registra `UNKNOWN`, se consulta el sistema externo y se resuelve: ejecutada
  (registrar), no ejecutada (reintento idempotente) o indeterminada (intervención humana).
- Clasificación de errores (entrada inválida, scope, evidencia, política, aprobación,
  transitorio, resultado desconocido, integridad, terminal): **no existen errores
  silenciosos ni estados convertidos en éxito por conveniencia de interfaz**.

### 5. Controles de seguridad

Cifrado en tránsito y reposo; secretos fuera de prompts/logs/receipts públicos;
herramientas por capacidad y misión; egress limitado; separación lectura/propuesta/
aprobación/ejecución; sanitización de documentos contra prompt injection; verificación
de firma y confianza del signer; auditoría de accesos a evidencia; minimización y
retención configurable; revocación de conectores y claves; Guardian Angel en modo
read-only sobre candidatos congelados.

> **El modelo puede estar comprometido o equivocarse y aun así no debe poder saltarse un
> gate, cruzar un tenant, falsificar una aprobación ni reescribir el ledger.**

## Consequences

**Positivas:**

- Recuperación desde estado persistido (no transcript): la misión sobrevive a la caída
  de la UI y del modelo.
- Sin dobles asientos por retry ciego (UNKNOWN → reconciliar antes de repetir).
- Prompt injection neutralizado: los documentos nunca gobiernan al agente.
- Aprobaciones estrictas: un candidato mutado pierde su aprobación automáticamente.

**Negativas / costos:**

- El adaptador JSON actual (dev) no satisface producción: PostgreSQL + object storage +
  KMS son **roadmap v1.0** no implementado.
- Fencing tokens, inbox/outbox y confirmación externa requieren infraestructura de
  mensajería y workers aún no construida.

## Alternatives

- **Transcript como fuente de recuperación:** descartado — la conversación no es estado
  autoritativo (regla central del diseño).
- **Memoria (Engram) como almacén autoritativo:** descartado — "remember is not
  authorize"; Engram es memoria no autoritativa.
- **Retry ciego sobre resultado desconocido:** descartado — duplicaría asientos, envíos
  o declaraciones.

---

**Fuente canónica:** [Design 04 — drenyra-ai](https://github.com/arkelythex/drenyra-ai/blob/main/docs/design/design-04-persistence-security-recovery.md) · Ver también [ADR-010](./ADR-010-ecosystem-boundary-authority.md) (frontera) y [ADR-011](./ADR-011-agent-model-ai-proposes-core-decides.md) (agentes).
