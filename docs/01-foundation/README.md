# 01 — Foundation

**Última actualización:** 2026-07-27
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
| [Canonical Stack](./canonical-stack.md)             | Stack técnico multi-lenguaje y arquitectura hexagonal   | Arquitectura |
| [Program Taxonomy](./program-taxonomy.md)           | Clasificación documental: SDD, ADR, FSD, WSD, ASD       | Canónico     |
| [Capability Map](./capability-map.md)               | 90+ capacidades del programa por dominio                | Canónico     |
| [SDD Audit](./sdd-audit.md)                         | Estado actual de 79 SDDs contra la taxonomía            | Canónico     |

---

## Arquitectura FEOS

Drenyra se organiza en **8 planos arquitectónicos** que ninguna capa superior puede saltarse:

```
┌─────────────────────────────────────────────────────────────┐
│  1. EXPERIENCE PLANE                                       │
│  Workbench · CLI · Mobile · API · Embedded UI              │
├─────────────────────────────────────────────────────────────┤
│  2. WORKSPACE PLANE                                        │
│  Portfolio · Companies · Periods · Change Sets · Attention  │
├─────────────────────────────────────────────────────────────┤
│  3. INTELLIGENCE PLANE                                     │
│  Pi Runtime · Agents · Skills · Model Routing · Memory      │
├─────────────────────────────────────────────────────────────┤
│  4. TRUST PLANE                                            │
│  Evidence · Policy · Materiality · Approval · Receipts      │
├─────────────────────────────────────────────────────────────┤
│  5. EXECUTION PLANE                                        │
│  Temporal · Jobs · Idempotency · Fencing · Recovery        │
├─────────────────────────────────────────────────────────────┤
│  6. FINANCIAL PLANE                                        │
│  Ledger · Close · Tax · Treasury · AP · AR · Payroll       │
├─────────────────────────────────────────────────────────────┤
│  7. INTEGRATION PLANE                                      │
│  SUNAT · Banks · ERPs · Documents · Payments · Authorities  │
├─────────────────────────────────────────────────────────────┤
│  8. COUNTRY PLANE                                          │
│  Peru · Colombia · Chile · Ecuador · Mexico · Brazil       │
└─────────────────────────────────────────────────────────────┘
```

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
| Conocer el stack técnico       | [Canonical Stack](./canonical-stack.md)             |
| Ver el roadmap de capacidades  | [Capability Map](./capability-map.md)               |
| Clasificar un documento nuevo  | [Program Taxonomy](./program-taxonomy.md)           |
| Evaluar el estado del programa | [SDD Audit](./sdd-audit.md)                         |
| Presentar Drenyra a inversores | [Strategic Positioning](./strategic-positioning.md) |

---

## Relación con otras secciones

| Sección                                                 | Dependencia                                 |
| ------------------------------------------------------- | ------------------------------------------- |
| [02 — Experience](../02-experience-plane/README.md)     | Hereda principios de UX y filosofía         |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Hereda taxonomía de agentes (ASD)           |
| [05 — Trust](../05-trust-plane/README.md)               | Hereda contractos de evidence y receipts    |
| [07 — Financial](../07-financial-plane/README.md)       | Hereda capability map de ledger, close, tax |
| [08 — Integration](../08-integration-plane/README.md)   | Hereda principios DFP                       |

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
