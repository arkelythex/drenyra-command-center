# Drenyra-Engram — Institutional Accounting Memory

**Last updated**: 2026-08-01
**Content type**: Conceptual — Product Thesis (Drenyra-Engram)
**North star:** [Drenyra-AI — Accounting Agent Operating System](./drenyra-ai-aos.md)
**Alineado con:** [Drenyra Product Philosophy](./product-philosophy.md) · [Drenyra Strategic Positioning](./strategic-positioning.md) · [Product Topology](../14-design/product-topology.md)

---

## Definición

> **Drenyra-Engram es la memoria institucional y contable verificable de una empresa. Conserva conocimiento operativo: qué ocurrió, qué política se aplicó, qué evidencia existía, quién decidió, cuál era el periodo, qué conclusión se aprobó, cuál quedó obsoleta, por qué se corrigió, cuál es la versión vigente.**

Para posicionamiento internacional:

> **Drenyra-Engram is the verifiable institutional accounting memory of an organization. It preserves operational knowledge: what happened, which policy was applied, what evidence existed, who decided, which period was in effect, which conclusion was approved, which one became obsolete, why it was corrected, and which version is current.**

El principio central:

> **Recordar no significa autorizar. Una memoria orienta el trabajo; solo la evidencia, las políticas vigentes y la aprobación profesional permiten ejecutarlo.**

Drenyra-Engram es la cuarta pieza del ecosistema Drenyra: la capa de memoria que conserva lo que la organización sabe y puede demostrar sobre su contabilidad, con procedencia, vigencia y aislamiento. No autoriza nada: recuerda, relaciona y contextualiza para que el profesional contable decida con conocimiento.

---

## La familia de cuatro piezas

El ecosistema pasa de tres a cuatro piezas complementarias:

```text
Gentle AI      → protocolo y ecosistema de ingeniería
Gentle Pi      → harness Pi-native para operar ese protocolo
Engram         → memoria persistente compartida entre agentes
────────────────────────────────────────────────────────
Drenyra-AI     → protocolo y ecosistema contable
Drenyra-Pi     → harness Pi-native para operaciones contables
Drenyra-Engram → memoria contable persistente, estructurada y verificable
Drenyra        → command center visual
```

Como Engram es la memoria compartida del ecosistema Gentle AI, **Drenyra-Engram es la memoria compartida del ecosistema Drenyra**, adaptada a las exigencias de la contabilidad: estructura, procedencia, vigencia, autoridad y aislamiento entre empresas.

---

## Qué es Engram hoy (referencia)

Engram es la memoria persistente y agnóstica para agentes — binario Go con SQLite y FTS5, accesible vía CLI, HTTP, MCP y TUI. Guarda observaciones, busca contexto, reconstruye sesiones, compara recuerdos, detecta conflictos y comparte memoria entre agentes. Cuatro funciones:

1. Guardar/actualizar observaciones.
2. Buscar/recuperar contexto.
3. Gestionar sesiones.
4. Comparar/juzgar/revisar memorias.

SQLite local es la fuente primaria; la nube es replicación opcional. Cambio reciente (2026-07-30): `mem_search` con `match_mode "any"`. Julio 2026: ranking FTS5 BM25 ponderado, deduplicación en imports, persistencia de relaciones en sync cloud, resúmenes de sesión con override de proyecto, recuperación tras fallos transitorios, escrituras inciertas sin reintentos ciegos, config cloud desde TUI, relaciones y conflictos.

Drenyra-Engram hereda estas capacidades y las proyecta al dominio contable.

---

## Qué debe ser Drenyra-Engram

> **Drenyra-Engram será la memoria institucional y contable verificable de una empresa.**

La diferencia con Engram es de dominio y de responsabilidad:

```text
Engram: recuerda lo que los agentes aprendieron sobre un proyecto.
Drenyra-Engram: recuerda lo que la organización sabe y puede demostrar sobre su contabilidad.
```

Drenyra-Engram conserva conocimiento operativo: qué ocurrió, qué política se aplicó, qué evidencia existía, quién decidió, cuál era el periodo, qué conclusión se aprobó, cuál quedó obsoleta, por qué se corrigió, cuál es la versión vigente. Todo con procedencia, vigencia y aislamiento.

---

## Separación memoria / evidencia / autoridad (crítica)

Drenyra-Engram **NO** debe ser: el libro mayor, el ledger criptográfico de receipts, la fuente canónica de documentos, el motor que autoriza asientos, ni el sistema que aprueba declaraciones. Es la capa de memoria y conocimiento que **REFERENCIA** esas fuentes.

```text
Sistema contable → verdad transaccional
Evidence Store → documentos y sustentos
Receipt Ledger → prueba de ejecución y aprobación
Drenyra-Engram → memoria semántica, contexto y conocimiento institucional
```

Ejemplo completo: memoria "durante julio 2026 las diferencias del banco X menores a S/ 2 provenían de redondeos del procesador Y" + Evidencia (extractos, reportes) + Receipt (resultado firmado de conciliación) + Autoridad (contador que aprobó). La memoria ayuda a investigar agosto pero **NO** autoriza repetir el tratamiento.

---

## Equivalencia con Engram

| Engram para software             | Drenyra-Engram para contabilidad     |
| -------------------------------- | ------------------------------------ |
| Proyecto                         | Empresa o unidad contable            |
| Sesión de desarrollo             | Sesión o misión contable             |
| Observación técnica              | Observación contable                 |
| Decisión arquitectónica          | Política o juicio contable           |
| Bug aprendido                    | Incidencia o anomalía                |
| Archivo o módulo                 | Documento, cuenta o proceso          |
| Commit relacionado               | Receipt, asiento o cierre relacionado |
| Memoria obsoleta                 | Política sustituida                  |
| Conflicto entre decisiones       | Conflicto contable o fiscal          |
| Resumen de sesión                | Resumen de misión                    |
| Timeline del proyecto            | Timeline del periodo o cuenta        |
| Proyecto compartido              | Tenant o compañía compartida         |

---

## Tipos de memoria

Vocabulario cerrado y versionado:

```ts
type AccountingMemoryType =
  | "accounting-policy" | "tax-policy" | "professional-judgment"
  | "company-convention" | "reconciliation-pattern" | "document-pattern"
  | "anomaly" | "control-deficiency" | "close-observation"
  | "audit-finding" | "approval-rationale" | "regulatory-interpretation"
  | "operational-procedure" | "learned-exception";
```

Tres ejemplos completos:

1. **Política** — "Reconocimiento de comisiones de pasarela": qué/por qué/aplicación (desde 2026-07)/evidencia (policy_snapshot_012).
2. **Excepción aprendida** — "Proveedor Andino emite notas de crédito tardías": qué/impacto (no cerrar AP hasta completar búsqueda)/confianza (alta, 6 periodos).
3. **Juicio profesional** — "Materialidad para diferencias de conciliación": diferencias < S/ 2 agrupables, el total acumulado requiere revisión > S/ 100; aprobado por Accounting Manager; vigencia 2026-07 a 2026-12.

Los importes se representan en céntimos como BigInt (disciplina Money del ecosistema, nunca floats) — la misma convención del `materialityAmount` de AccountingCandidate en Drenyra-AI.

---

## Identidad y aislamiento

```ts
interface AccountingMemoryScope {
  organizationId: string;
  companyId: string;
  fiscalPeriodId?: string;
  missionId?: string;
  accountId?: string;
  counterpartyId?: string;
  documentId?: string;
  jurisdiction: string;
}
```

Una memoria de una empresa NUNCA aparece en otra por similitud semántica. Consultas scope-first:

```text
1. verificar membresía; 2. fijar organización; 3. fijar compañía;
4. restricciones de periodo; 5. recién entonces buscar.
```

**NO** buscar globalmente → filtrar tenant después. El aislamiento es una propiedad de la consulta, no un filtro posterior.

---

## Cuatro niveles de memoria

1. **Session memory** — contexto efímero: qué hace el agente, qué leyó, qué hipótesis evalúa.
2. **Mission memory** — durable de una ejecución: cierre mensual, conciliación, SIRE, auditoría, corrección.
3. **Period memory** — conocimiento del periodo: excepciones de julio, documentos pendientes, ajustes, hechos posteriores.
4. **Institutional memory** — reusable: políticas, criterios, patrones, convenciones, riesgos recurrentes, decisiones aprobadas.

Promotion workflow (no todo asciende automáticamente):

```text
Session → síntesis → Mission → revisión → Period → aprobación → Institutional
```

---

## Promotion workflow (diferenciador principal)

```text
CAPTURED → CANDIDATE → REVIEWED → APPROVED → ACTIVE
ACTIVE → SUPERSEDED → RETIRED
CANDIDATE → CONFLICTED → REJECTED
```

Una observación generada por IA empieza como CANDIDATE; no puede convertirse sola en política vigente.

```ts
interface AccountingMemoryAuthority {
  status: "captured" | "candidate" | "reviewed" | "approved" | "active" | "superseded" | "rejected";
  source: "agent" | "human" | "system" | "import";
  approvedBy?: string;
  approvalReceiptId?: string;
}
```

---

## Relaciones entre memorias

```ts
type MemoryRelation =
  | "supports" | "contradicts" | "supersedes" | "refines" | "derived-from"
  | "applies-to" | "exception-to" | "caused-by" | "resolved-by" | "evidenced-by";
```

Ejemplo: política 2025 "registrar diferencia bancaria como gasto" → política 2026 "investigar primero si corresponde a comisión de pasarela"; la nueva **SUPERSEDES** a la vieja. No borrar la anterior: conservarla con vigencia y procedencia. El grafo de relaciones permite reconstruir la historia de cada criterio.

---

## Conflictos (workflow contable formal)

Tipos de conflicto:

- dos políticas activas incompatibles;
- dos conclusiones para el mismo documento;
- cambio regulatorio que invalida una memoria;
- memoria de periodo usada fuera de vigencia;
- criterio de una empresa aplicado a otra;
- conclusión humana contradicha por nueva evidencia.

Flujo formal:

```text
conflicto detectado → congelar memorias implicadas → obtener fuentes →
identificar vigencia → comparar jurisdicción y compañía →
solicitar juicio profesional → emitir resolución →
relacionar successor y predecessor
```

La IA puede **DETECTAR** el conflicto; no debe decidir sola qué interpretación fiscal queda vigente.

---

## Modelo de vigencia

```ts
interface MemoryValidity {
  validFrom?: string;
  validTo?: string;
  fiscalPeriods?: string[];
  jurisdiction?: string;
  policyVersion?: string;
  regulationVersion?: string;
}
```

Evita recuperar en 2027 una interpretación válida solo durante 2026. La búsqueda pondera: scope exacto + estado activo + vigencia + autoridad + similitud + recencia (no solo similitud textual).

---

## Búsqueda contable híbrida

```text
tenant filters + structured metadata + FTS/BM25 + embeddings opcionales +
relation graph + authority ranking + validity ranking
```

Consulta "¿Cómo tratamos las diferencias de Culqi en cierres anteriores?" debe recuperar:

1. la política activa de comisiones;
2. conciliaciones anteriores relacionadas;
3. anomalías recurrentes;
4. receipts relevantes;
5. memorias superseded claramente marcadas;
6. documentos sin revelar contenido fuera del permiso.

`match_mode "any"` es útil para exploración, pero convive con filtros estrictos de empresa/periodo/autoridad.

---

## Resultados inciertos (lección clave de Engram)

```text
timeout antes de enviar → retry permitido
timeout después de posible envío → UNKNOWN → consultar idempotency key →
reconciliar → nunca repetir a ciegas
```

```ts
interface MemoryWriteRequest {
  idempotencyKey: string;
  /** Ordinal de revisión — entero simple, no una disciplina Money; los importes van como BigInt en céntimos */
  expectedRevision?: number;
  memory: AccountingMemory;
}
```

Resultados: CREATED, UPDATED, DUPLICATE, CONFLICT, UNKNOWN, REJECTED. Encaja con el estado UNKNOWN que Drenyra ya maneja.

---

## Integración con Drenyra-AI

Drenyra-AI: consulta memoria antes de planificar, recupera políticas y aprendizajes, guarda observaciones después de ejecutar, propone nuevas memorias, detecta conflictos. Drenyra-Engram: persiste, busca, relaciona, versiona, aísla, conserva procedencia.

Drenyra-AI no carga toda la memoria indiscriminadamente — pide contexto mínimo por misión: mission type + company + period + accounts + counterparties + policy families.

---

## Integración con Drenyra-Pi

Comandos:

```text
/drenyra:memory-search /drenyra:memory-save /drenyra:memory-context
/drenyra:memory-timeline /drenyra:memory-compare /drenyra:memory-review
/drenyra:memory-promote /drenyra:memory-supersede /drenyra:memory-doctor
```

Ejemplo:

```text
/drenyra:memory-context --company arkelythex-sac --period 2026-07 --topic bank-reconciliation
```

Al iniciar misión:

```text
Drenyra-Pi → selecciona empresa → selecciona periodo → inicia sesión de memoria →
carga contexto relevante → ejecuta misión → genera resumen → propone memorias nuevas
```

---

## Integración con el audit ledger (relacionarse, no fusionarse)

```text
Memory: memoryId, revision, contentHash, sourceRefs, authorityStatus
Ledger entry: MEMORY_PROPOSED, MEMORY_APPROVED, MEMORY_SUPERSEDED, memoryHash
```

El ledger prueba que la memoria cambió de estado; Drenyra-Engram conserva contenido y relaciones. Son capas distintas que se referencian, nunca un mismo sistema fusionado.

---

## Privacidad y seguridad

Necesidades: tenant isolation; company isolation; row-level authorization; field-level redaction; encryption at rest; auditor read-only access; retention policies; right-to-delete controls; legal holds; access audit; secret detection; PII classification.

Reglas para agentes:

- NO guardar contraseñas;
- NO almacenar llaves SOL;
- NO copiar documentos completos por defecto;
- guardar referencias y resúmenes mínimos;
- contenido sensible cifrado con claves por tenant;
- búsquedas respetan el rol del actor.

---

## Arquitectura propuesta

```text
Drenyra-Engram
├── Memory API (save, update, search, compare, timeline, review)
├── Scope Authority (organization, company, period, actor)
├── Memory Store (PostgreSQL metadata, FTS/BM25, optional vector index, relation graph)
├── Provenance Layer (source references, content hashes, receipts, revisions)
├── Lifecycle (candidate, review, approve, supersede, retire)
└── Clients (Drenyra-AI, Drenyra-Pi, Drenyra Web, CLI, MCP)
```

---

## Local-first vs cloud

| Contexto                          | Almacenamiento autoritativo                     |
| --------------------------------- | ----------------------------------------------- |
| Desarrollador individual/sandbox  | SQLite local autoritativo                       |
| Empresa                           | PostgreSQL tenant-scoped autoritativo           |
| Offline                           | Réplica local cifrada y limitada                |
| Cloud                             | Sincronización autenticada e idempotente        |

**NO** permitir dos laptops con políticas contables activas divergentes sin reconciliación explícita.

---

## Estructura de productos (5 repos)

```text
arkelythex/Drenyra (command center)
arkelythex/drenyra-ai (runtime y protocolo contable)
arkelythex/drenyra-pi (harness Pi-native)
arkelythex/drenyra-engram (memoria institucional contable)
arkelythex/drenyra-skills (skills y políticas versionadas)
```

Monorepo inicial:

```text
packages/drenyra-engram-contracts
packages/drenyra-engram-core
packages/drenyra-engram-postgres
packages/drenyra-engram-mcp
packages/drenyra-engram-client
```

---

## Primer vertical: restringido a Monthly Close

Debe recordar: excepciones recurrentes, documentos pendientes, explicaciones de diferencias, criterios aprobados, ajustes anteriores, bloqueos, decisiones humanas, resultados de conciliaciones, aprendizajes del cierre.

```text
Inicio del cierre → recuperar memoria de cierres anteriores → ejecutar misión →
capturar observaciones → generar resumen → proponer aprendizajes →
revisión humana → promover memorias aprobadas
```

---

## La familia definitiva

```text
ARKELYTHEX
└── DRENYRA ECOSYSTEM
    ├── Drenyra — Accounting Command Center
    ├── Drenyra-AI — Verifiable accounting agent ecosystem
    ├── Drenyra-Pi — Pi-native accounting operations harness
    ├── Drenyra-Engram — Institutional accounting memory
    └── Drenyra-Skills — Versioned accounting capabilities
```

Tesis conjunta:

> **Drenyra-AI razona y coordina. Drenyra-Pi proporciona la experiencia operativa. Drenyra-Engram conserva el conocimiento institucional con procedencia, vigencia y aislamiento. El runtime y el ledger verifican. El profesional contable mantiene la autoridad.**

Principio central de Drenyra-Engram:

> **Recordar no significa autorizar. Una memoria orienta el trabajo; solo la evidencia, las políticas vigentes y la aprobación profesional permiten ejecutarlo.**

---

## Navegación

- [Drenyra-AI — Accounting Agent Operating System](./drenyra-ai-aos.md)
- [Drenyra-Pi — Pi-Native Accounting Operations Harness](./drenyra-pi-harness.md)
- [Drenyra Product Philosophy — Definitive Thesis](./product-philosophy.md)
- [Drenyra Strategic Positioning](./strategic-positioning.md)
- [Product Topology](../14-design/product-topology.md)
- [RED — Receipt-Driven Execution](../14-design/red-spec.md)
