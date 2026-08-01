# Drenyra-AI — Accounting Agent Operating System

**Last updated**: 2026-08-01
**Content type**: Conceptual — Product Thesis (Drenyra-AI)
**North star:** [Drenyra Product Philosophy](./product-philosophy.md)
**Alineado con:** [Drenyra Strategic Positioning](./strategic-positioning.md) · [Product Topology](../14-design/product-topology.md)

---

## Definición

> **Drenyra-AI es el sistema operativo verificable para agentes contables. Coordina personas e IA, aplica políticas contables y fiscales, valida cada operación y conserva evidencia auditable antes del registro, cierre o presentación.**

Para posicionamiento internacional:

> **Drenyra-AI is the verifiable operating system for accounting agents. It coordinates humans and AI, enforces accounting and fiscal policies, validates every operation, and preserves auditable evidence before posting, closing, or filing.**

Drenyra-AI deja de ser una capa interna de desarrollo para convertirse en un **producto independiente**: un Accounting Agent Operating System. Como Gentle AI convirtió la disciplina de ingeniería en un estándar ejecutable, Drenyra-AI convierte la disciplina contable en un estándar abierto de ejecución verificable.

---

## La equivalencia correcta: Gentle AI ↔ Drenyra-AI

Drenyra-AI no imita a Gentle AI: lo **analoga** al dominio contable. Cada concepto de ingeniería tiene un equivalente contable exacto:

| Gentle AI (ingeniería)                | Drenyra-AI (contabilidad)                          |
| ------------------------------------- | -------------------------------------------------- |
| Repositorio                           | Empresa / tenant                                   |
| Código fuente                         | Documentos / registros contables                   |
| Cambio de código                       | Operación contable                                  |
| Spec / SDD                            | Política contable / procedimiento / cierre         |
| Test                                  | Validación contable                                 |
| Build                                 | Procesamiento / consolidación                      |
| Code review                           | Revisión del contador                              |
| Candidate                             | Lote contable exacto (AccountingCandidate)         |
| Diff                                  | Cambios en asientos                                |
| Receipt                               | Evidencia firmada                                  |
| Commit                                | Registro contable confirmado                       |
| Pull request                          | Propuesta de ajuste pendiente de aprobación        |
| CI/CD gate                            | Gate fiscal / contable                             |
| Release                               | Cierre mensual / declaración                       |
| Rollback                              | Reversión con asiento correctivo                   |
| Maintainer                            | Contador responsable                               |
| Production deployment                 | Envío a SUNAT                                      |

Esta tabla es la fuente de verdad para **todo** el diseño de Drenyra-AI. Si un mecanismo del producto no tiene equivalente claro en esta tabla, es sospechoso.

---

## Qué es un Accounting Agent Operating System

Un sistema operativo no ejecuta una sola tarea: **gobierna** los recursos de un dominio. Drenyra-AI gobierna:

- **Memoria** — el estado contable y el contexto persistente de cada tenant, periodo y candidato.
- **Conocimiento** — políticas contables, planes de cuenta, reglas fiscales, country packs.
- **Políticas** — las reglas que ningún agente puede saltarse: materialidad, flujos de aprobación, separación de funciones.
- **Herramientas** — contratos de herramientas tipados (R0–R3) que los agentes usan con permisos medibles.
- **Workflows** — rutas de trabajo durables con estado, retries y recuperación.
- **Separación de funciones** — nadie (persona ni agente) puede proponer, validar, ejecutar y certificar lo mismo sin intervención ajena.
- **Revisión humana** — el profesional contable revisa y autoriza; la IA propone y procesa.
- **Receipts firmados** — toda operación material termina en evidencia criptográficamente verificable.
- **Trazabilidad** — `source → normalized → validated → proposed → approved → executed` completo.
- **Recuperación** — estados UNKNOWN, reconciliación obligatoria, reapertura controlada de periodos.
- **Gates** — compuertas fiscales/contables que detienen el flujo cuando una invariante no se cumple.

---

## La tesis central

> **"La IA propone y procesa. Drenyra valida y conserva evidencia. El profesional contable revisa y autoriza."**

La IA nunca es la autoridad. La autoridad pertenece a Drenyra-AI mediante tenant identity, period identity, candidate identity, policies, gates, receipts, approvals y audit ledger. Los agentes son ejecutores capaces, no árbitros.

---

## El flujo central

```text
Documentos / datos fuente
        ↓
Document Intake (ingesta con hash de evidencia)
        ↓
Accounting Classification (propuesta de clasificación)
        ↓
Tax Validation (validación determinista: IGV, detracciones, SIRE, RUC)
        ↓
AccountingCandidate (lote exacto congelado y hasheado)
        ↓
Gate fiscal/contable → Review del contador → Aprobación explícita
        ↓
Registro / cierre / presentación
        ↓
Receipt firmado → Audit ledger
```

Cada flecha produce evidencia. Si una flecha no puede producir evidencia verificable, el flujo se detiene.

---

## Las tres rutas de trabajo

Como Gentle AI no obliga a SDD siempre, Drenyra-AI ofrece tres rutas proporcionales al riesgo:

### Ruta directa — operaciones rutinarias deterministas

```text
factura → clasificación → validación → contabilización → receipt
```

Operaciones repetitivas, reglas conocidas, impacto inmaterial o rutinario. Un solo agente ejecuta el flujo completo con validación determinista.

### Ruta delegada — varios agentes coordinados

```text
conciliación bancaria:
  extraction → matching → anomalías → propuesta → revisión
```

Varios agentes especializados (extraction, matching, anomaly detection) trabajan en paralelo bajo el Drenyra Orchestrator y entregan una propuesta que un humano revisa.

### Ruta formal — operaciones materiales

```text
alcance → política → evidencias → tareas → ejecución → revisión → aprobación → cierre
```

El equivalente del SDD, sin llamarse SDD: el cierre mensual. Alcance definido, política explícita, evidencias recopiladas, tareas con estado, ejecución monitoreada, revisión profesional, aprobación explícita y cierre con receipt final.

---

## RDA — Receipt-Driven Accounting

El protocolo de producto se llama **RDA — Receipt-Driven Accounting**. Es la disciplina de producto completa: cada operación contable nace de una política, se ejecuta como candidato exacto, se valida, se revisa, se aprueba y **termina en un receipt firmado** que conserva el estado completo del lote.

**¿Por qué RDA y no SDD/APD/EDA?**

- **SDD** (Spec-Driven Development) describe el ciclo de desarrollo de software. La contabilidad no "desarrolla": registra, cierra y presenta. RDA conserva la disciplina (alcance → política → evidencias → tareas → ejecución → revisión → aprobación) sin importar la jerga de ingeniería.
- **APD** (Agent-Processed Documentation) no expresa lo esencial: la **evidencia** y la **autoridad**.
- **EDA** (Event-Driven Architecture) describe un estilo técnico de mensajería, no un protocolo de confianza contable.
- **RDA** conecta directamente con la arquitectura de receipts que Drenyra ya tiene implementada en runtime: cada etapa del protocolo produce el receipt que RED ya sabe construir y verificar.

**Relación con RED (importante — no renombrar):**

| Concepto    | Rol                                                                                    |
| ----------- | --------------------------------------------------------------------------------------- |
| **RDA**     | Protocolo de producto: cómo se definen, ejecutan, validan, aprueban y cierran operaciones |
| **RED**     | Mecanismo de receipts del runtime, ya implementado: cómo se construye y verifica cada receipt |

RDA es la política; RED es el mecanismo. Conviven: RDA define *qué* debe quedar evidenciado y en qué orden, RED implementa *cómo* se firma, hashea y verifica. Véase [RED — Receipt-Driven Execution](../14-design/red-spec.md).

---

## Los agentes del ecosistema

Drenyra-AI opera con agentes especializados orquestados por el **Drenyra Orchestrator**:

```text
Drenyra Orchestrator
├── Document Intake
├── Accounting Classification
├── Tax Validation
├── Reconciliation
├── Journal Entry
├── Accounts Payable
├── Accounts Receivable
├── Payroll
├── Fixed Assets
├── Inventory
├── SIRE
├── Closing
├── Evidence
├── Review
└── Recovery
```

**La autoridad que NO tienen:** ningún agente tiene autoridad absoluta. Ningún agente puede:

- ejecutar un registro material sin candidate aprobado;
- saltarse un gate fiscal o contable;
- modificar evidencia fuente;
- auto-aprobar su propia propuesta;
- firmar un receipt en nombre del contador responsable.

La autoridad pertenece a Drenyra-AI mediante tenant identity, period identity, candidate identity, policies, gates, receipts, approvals y audit ledger.

---

## La unidad central: AccountingCandidate

Todo trabajo contable se congela en una unidad exacta: el **AccountingCandidate**. Antes de ejecutar nada, Drenyra-AI hashea el payload exacto y valida contra él. No se aprueban intenciones: se aprueba un lote contable exacto.

```typescript
interface AccountingCandidate {
  /** Tenant contable (empresa/RUC) */
  companyId: string
  /** Periodo fiscal al que afecta */
  fiscalPeriodId: string
  /** Tipo de operación contable */
  kind:
    | 'document-batch'
    | 'journal-entry'
    | 'reconciliation'
    | 'tax-book'
    | 'monthly-close'
    | 'tax-submission'
  /** Hash de la evidencia fuente (documentos originales) */
  sourceEvidenceHash: string
  /** Hash del payload normalizado */
  normalizedPayloadHash: string
  /** Hash del impacto contable (asientos, montos, cuentas) */
  accountingImpactHash: string
  /** Hash del snapshot de políticas aplicadas */
  policySnapshotHash: string
  /** Moneda del candidato */
  currency: string
  /** Importe con relevancia material para el nivel de review — BigInt en céntimos */
  materialityAmount: bigint
  /** Timestamp ISO 8601 de creación */
  createdAt: string
}
```

**Qué invalida un receipt anterior:** cualquier cambio en documentos, montos, cuentas, periodo, RUC, impuestos, política o evidencia invalida el receipt anterior. Un candidate re-hasheado requiere un nuevo receipt; nunca se reutiliza evidencia de un lote distinto.

---

## Review proporcional al riesgo contable

El nivel de revisión no lo decide el agente: lo decide la materialidad y el tipo de operación.

| Nivel | Riesgo | Cobertura |
| ----- | ------ | --------- |
| **Nivel 0 — Automático** | Bajo | Repetitivo, match exacto, inmaterial. Se ejecuta y evidencia sin intervención humana. |
| **Nivel 1 — Operativo** | Medio-bajo | Clasificación no trivial, conciliación con diferencias pequeñas, ajustes reversibles. Revisión operativa. |
| **Nivel 2 — Material** | Medio-alto | Asientos manuales, provisiones, estimaciones, depreciación, ajustes de cierre, intercompañía. Requieren revisión profesional. |
| **Nivel 3 — Fiscal crítico** | Alto | SIRE, libros electrónicos, IGV, renta, detracciones, retenciones, percepciones, planillas, SUNAT, reapertura de periodos. |

**Bloque requerido en todo Nivel 3:**

```text
evidencia completa
+ policy snapshot
+ pruebas deterministas
+ receipt firmado
+ revisión profesional
+ aprobación explícita
+ registro en audit ledger
```

Sin este bloque completo, un Nivel 3 no puede registrarse, cerrarse ni presentarse. No hay excepciones.

---

## Las tres capas de producto

```text
┌──────────────────────────────────────────────────────────────┐
│  1. ECOSYSTEM CONFIGURATOR                                  │
│  Plan contable · políticas · materialidad · flujos de        │
│  aprobación · SUNAT · SIRE · bancos · ERP · roles ·          │
│  agentes · modelos · memoria                                 │
├──────────────────────────────────────────────────────────────┤
│  2. ACCOUNTING AGENT FRAMEWORK                              │
│  Agentes · skills · prompts · herramientas · workflows ·     │
│  contratos · routing · memoria · recuperación                │
├──────────────────────────────────────────────────────────────┤
│  3. NATIVE ACCOUNTING AUTHORITY                             │
│  Candidatos · receipts · firmas · ledger · gates ·           │
│  aprobaciones · separación de funciones · cierre ·           │
│  presentación                                                │
└──────────────────────────────────────────────────────────────┘
```

**La capa 3 es la que diferencia a Drenyra-AI de un "Copilot para contadores".** Un copilot propone. Drenyra-AI valida, evidencia, gobierna y conserva la autoridad. Sin la capa 3, Drenyra-AI sería otro asistente; con ella, es un sistema operativo.

---

## Posicionamiento

> **EN:** Drenyra-AI is the verifiable operating system for accounting agents. It coordinates humans and AI, enforces accounting and fiscal policies, validates every operation, and preserves auditable evidence before posting, closing, or filing.

> **ES:** Drenyra-AI es el sistema operativo verificable para agentes contables. Coordina personas e IA, aplica políticas contables y fiscales, valida cada operación y conserva evidencia auditable antes del registro, cierre o presentación.

Drenyra-AI aspira a ser el **estándar abierto de ejecución contable verificable**: un proyecto/plataforma independiente dentro del ecosistema Arkelythex, consumido inicialmente por Drenyra, y diseñado para funcionar con CLI, API, otros ERPs, otros SaaS, agentes externos e integraciones.

---

## Relación con Drenyra

```text
Drenyra-AI                         Drenyra
─────────────────                  ─────────────────
framework + runtime                producto visual y operativo
agentes + skills                   command center contable
receipts + autoridad               para empresas y contadores
       │
       └────────── consume ───────► Drenyra (surface)
```

La analogía exacta es Gentle AI → OpenCode/Claude Code: **Drenyra-AI es el ecosistema; Drenyra es la superficie**. Drenyra consume Drenyra-AI, pero Drenyra-AI funciona solo con CLI, API, otros ERPs, otros SaaS, agentes externos e integraciones. Entre el ecosistema y la superficie existe **Drenyra-Pi**, la terminal agentic Pi-native que ejecuta el protocolo RDA en Pi (véase [Drenyra-Pi — Pi-Native Accounting Operations Harness](./drenyra-pi-harness.md)). La separación es estructural, no cosmética.

---

## Cambio de dirección del plan

**No se empieza implementando candidate review.** Primero se define formalmente, en este orden:

1. Drenyra-AI Product Thesis *(este documento)*
2. Drenyra-AI Architecture
3. Receipt-Driven Accounting protocol (RDA)
4. Accounting Agent Registry
5. Accounting Skill Contract
6. Accounting Candidate Contract
7. Review and Materiality Model
8. Human Authority Model
9. Integration Boundary with Drenyra

Luego se construye el primer vertical completo: **Monthly Close Execution** — documentos → conciliaciones → pendientes → ajustes → revisión → aprobación → cierre → receipt final.

**Decisión arquitectónica final:** Drenyra-AI es un proyecto/plataforma independiente dentro del ecosistema Arkelythex, consumido inicialmente por Drenyra y diseñado para ser el estándar abierto de ejecución contable verificable.

---

## Drenyra-Pi — el harness Pi-native

Drenyra-AI es el ecosistema y protocolo contable; **Drenyra-Pi es su implementación Pi-native** — el harness que convierte Pi en un operador contable disciplinado y verificable. La analogía es exacta: como Gentle Pi es la implementación Pi-native de Gentle AI, Drenyra-Pi es la implementación Pi-native de Drenyra-AI. No son dos nombres para lo mismo: Drenyra-AI aporta contratos, protocolos, agentes, skills, memoria, receipts, ledger, políticas, materialidad y autoridad; Drenyra-Pi empaqueta esa clase de integración como persona contable, comandos, panel operativo, agentes, skills, procedimientos RDA, routing de modelos, integraciones y guardas de seguridad sobre el runtime de Drenyra-AI.

La tesis conjunta:

> **Drenyra-AI aporta el protocolo, la inteligencia operativa y la autoridad verificable. Drenyra-Pi convierte Pi en la terminal contable disciplinada que ejecuta ese protocolo. Drenyra ofrece la superficie visual donde profesionales y empresas supervisan, revisan y autorizan el trabajo.**

Documento completo: [Drenyra-Pi — Pi-Native Accounting Operations Harness](./drenyra-pi-harness.md).

---

## Drenyra-Engram — la memoria institucional

Drenyra-AI consulta la memoria antes de planificar: recupera políticas y aprendizajes, guarda observaciones después de ejecutar, propone nuevas memorias y detecta conflictos. **Drenyra-Engram** persiste, busca, relaciona, versiona, aísla y conserva procedencia — sin cargar toda la memoria indiscriminadamente: pide contexto mínimo por misión (mission type + company + period + accounts + counterparties + policy families).

El principio que rige la integración:

> **Recordar no significa autorizar. Una memoria orienta el trabajo; solo la evidencia, las políticas vigentes y la aprobación profesional permiten ejecutarlo.**

Documento completo: [Drenyra-Engram — Institutional Accounting Memory](./drenyra-engram.md).

---

## Navegación

- [Drenyra-Engram — Institutional Accounting Memory](./drenyra-engram.md)
- [Drenyra Product Philosophy — Definitive Thesis](./product-philosophy.md)
- [Drenyra Strategic Positioning](./strategic-positioning.md)
- [Product Topology](../14-design/product-topology.md)
- [RED — Receipt-Driven Execution](../14-design/red-spec.md)
