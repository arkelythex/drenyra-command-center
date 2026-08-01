# 01 — Foundation

**Última actualización:** 2026-08-01
**Propósito:** Documentación fundacional del programa Drenyra FEOS
**Audiencia:** Todos los contribuyentes — desarrolladores, producto, fiscal, dirección

---

## Propósito

Esta sección contiene la documentación canónica que define qué es Drenyra, cómo se construye, cómo se clasifica su documentación y cuál es el estado actual del programa.

Todo documento en las demás secciones se alinea con estos principios fundacionales.

---

## Documentos

| Documento                                           | Descripción                                             | Tipo         |
| --------------------------------------------------- | ------------------------------------------------------- | ------------ |
| [Product Philosophy](./product-philosophy.md)       | Tesis definitiva: Drenyra como Financial Engineering OS | Conceptual   |
| [Strategic Positioning](./strategic-positioning.md) | Elevator pitch, moat, competencia, estrategia de cuña   | Estratégico  |
| [Drenyra-AI — Accounting Agent OS](./drenyra-ai-aos.md) | Ecosistema y protocolo contable: RDA, candidatos, autoridad | Conceptual   |
| [Drenyra-Pi — Pi-Native Harness](./drenyra-pi-harness.md) | Harness Pi-native que convierte Pi en operador contable  | Conceptual   |
| [Drenyra-Engram — Institutional Memory](./drenyra-engram.md) | Memoria institucional contable: procedencia, vigencia, aislamiento | Conceptual   |
| [Canonical Stack](./canonical-stack.md)             | Stack técnico multi-lenguaje y arquitectura hexagonal   | Arquitectura |
| [Program Taxonomy](./program-taxonomy.md)           | Clasificación documental: SDD, ADR, FSD, WSD, ASD       | Canónico     |
| [Capability Map](./capability-map.md)               | 90+ capacidades del programa por dominio                | Canónico     |
| [SDD Audit](./sdd-audit.md)                         | Estado actual de 79 SDDs contra la taxonomía            | Canónico     |

---

## Arquitectura FEOS

Drenyra se organiza en **8 planos arquitectónicos** que ninguna capa superior puede saltarse:

```mermaid
flowchart TB
    subgraph FEOS["Drenyra FEOS — 8 Planes"]
        direction TB

        EP["1. EXPERIENCE PLANE
Workbench · CLI · Mobile · API · Embedded UI"]
        WP["2. WORKSPACE PLANE
Portfolio · Companies · Periods · Change Sets · Attention"]
        IP["3. INTELLIGENCE PLANE
Pi Runtime · Agents · Skills · Model Routing · Memory"]
        TP["4. TRUST PLANE
Evidence · Policy · Materiality · Approval · Receipts"]
        XP["5. EXECUTION PLANE
Temporal · Jobs · Idempotency · Fencing · Recovery"]
        FP["6. FINANCIAL PLANE
Ledger · Close · Tax · Treasury · AP · AR · Payroll"]
        AP["7. INTEGRATION PLANE
SUNAT · Banks · ERPs · Documents · Payments · Authorities"]
        CP["8. COUNTRY PLANE
Peru · Colombia · Chile · Ecuador · Mexico · Brazil"]

        EP --> WP --> IP --> TP --> XP --> FP --> AP --> CP
    end

    style EP fill:#1a237e,color:#fff,stroke:#3949ab
    style WP fill:#283593,color:#fff,stroke:#5c6bc0
    style IP fill:#3949ab,color:#fff,stroke:#7986cb
    style TP fill:#1565c0,color:#fff,stroke:#42a5f5
    style XP fill:#0d47a1,color:#fff,stroke:#1e88e5
    style FP fill:#1b5e20,color:#fff,stroke:#43a047
    style AP fill:#e65100,color:#fff,stroke:#fb8c00
    style CP fill:#4a148c,color:#fff,stroke:#7b1fa2
```

### Flujo de operación material

Un agente no puede llamar directamente a SUNAT. Debe atravesar cada plano:

```mermaid
flowchart LR
    A["🤖 Agent Proposal"] --> B["🔧 Typed Tool"]
    B --> C["📋 Capability Policy"]
    C --> D["🔒 Tenant Scope"]
    D --> E["✅ Deterministic Validator"]
    E --> F["🚪 Approval Gate"]
    F --> G["⚙️ Durable Workflow"]
    G --> H["🔌 External Adapter"]
    H --> I["📜 Evidence Receipt"]

    style A fill:#e3f2fd,color:#1a237e
    style I fill:#e8f5e9,color:#1b5e20
    style F fill:#fff3e0,color:#e65100
    style H fill:#f3e5f5,color:#4a148c
```

### Mapa de navegación

Un agente no puede llamar directamente a SUNAT. Debe atravesar:

```
Agent proposal
→ Typed tool
→ Capability policy
→ Tenant scope
→ Deterministic validator
→ Approval gate
→ Durable workflow
→ External adapter
→ Evidence receipt
```

---

## Mapa de navegación

| Si buscas...                   | Ve a...                                             |
| ------------------------------ | --------------------------------------------------- |
| Entender qué es Drenyra        | [Product Philosophy](./product-philosophy.md)       |
| Entender el ecosistema Drenyra-AI | [Drenyra-AI AOS](./drenyra-ai-aos.md)            |
| Entender el harness Drenyra-Pi | [Drenyra-Pi Harness](./drenyra-pi-harness.md)       |
| Entender la memoria contable    | [Drenyra-Engram](./drenyra-engram.md)              |
| Conocer el stack técnico       | [Canonical Stack](./canonical-stack.md)             |
| Ver el roadmap de capacidades  | [Capability Map](./capability-map.md)               |
| Clasificar un documento nuevo  | [Program Taxonomy](./program-taxonomy.md)           |
| Evaluar el estado del programa | [SDD Audit](./sdd-audit.md)                         |
| Presentar Drenyra a inversores | [Strategic Positioning](./strategic-positioning.md) |

---

## Relación con otras secciones

| Sección                                                       | Dependencia                                 |
| ------------------------------------------------------------- | ------------------------------------------- |
| [10 — Development](../10-development/README.md)               | Hereda guías de desarrollo y engram          |
| [11 — ADR](../11-adr/README.md)                               | Registro de decisiones arquitectónicas      |
| [12 — Security](../12-security/README.md)                     | Controles de seguridad y secretos           |
| [13 — Operations](../13-operations/README.md)                 | Operación, observabilidad y runbooks        |
| [14 — Design](../14-design/README.md)                         | Diseño de producto y protocolos (RED, RDA)  |

---

## Documentos antiguos migrados

Los siguientes documentos de la estructura anterior han sido migrados a esta sección:

| Anterior                                      | Nueva ubicación              |
| --------------------------------------------- | ---------------------------- |
| `docs/products/drenyra-product-philosophy.md` | `./product-philosophy.md`    |
| `docs/products/drenyra-positioning.md`        | `./strategic-positioning.md` |
| `docs/architecture/canonical-stack.md`        | `./canonical-stack.md`       |
| `docs/architecture/program-taxonomy.md`       | `./program-taxonomy.md`      |
| `docs/architecture/capability-map.md`         | `./capability-map.md`        |
| `docs/architecture/sdd-audit.md`              | `./sdd-audit.md`             |
