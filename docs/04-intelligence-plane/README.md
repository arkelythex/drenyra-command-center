# 04 — Intelligence Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 3 de 8 — Inteligencia
**Propósito:** Pi Runtime, agents, skills, model routing, memory, context
**Principio:** Pi SDK + Gentle-AI — agentes especializados con contratos, no un superagente monolítico

---

## Filosofía

Drenyra no construye un "superagente contador" monolítico. Construye una **organización digital especializada** donde cada agente tiene:

- Rol y alcance definidos
- Tools permitidas y prohibidas
- Modelo y presupuesto específicos
- Outputs con schema estricto
- Puertas de aprobación según riesgo

### Traducción del stack de ingeniería

| Ingeniería | Drenyra                             |
| ---------- | ----------------------------------- |
| Pi SDK     | Agent Runtime                       |
| Gentle-AI  | SDD + Receipts fiscales             |
| OpenCode   | Financial Workspace modes           |
| Skills     | Procedimientos fiscales ejecutables |
| Codex      | Multi-agent orchestration           |

### Herramientas por nivel de riesgo

| Nivel | Output     | Schema      | Validación                   |
| ----- | ---------- | ----------- | ---------------------------- |
| R0    | Flexible   | Opcional    | Ninguna                      |
| R1    | Structured | Preferido   | Revisión por excepción       |
| R2    | Strict     | Obligatorio | Validación determinista      |
| R3    | Strict     | Obligatorio | Validación + aprobación dual |

---

## Agentes

### Drenyra Conductor (Orquestador)

No contabiliza directamente. Su función es interpretar el objetivo, componer el workflow, asignar agentes, controlar contexto y solicitar aprobaciones.

### Agentes fundamentales

| Agente                | Función                                        |
| --------------------- | ---------------------------------------------- |
| Ingestion Agent       | Ingesta y normalización de documentos          |
| Document Intelligence | Extracción, verificación, confianza            |
| Classification        | Propuesta de cuenta, centro de costo, impuesto |
| Ledger Agent          | Posteo de asientos, ledger inmutable           |
| Reconciliation        | Conciliación banco/ledger/SIRE                 |
| Tax Agent             | Cálculos fiscales deterministas                |
| Payroll Agent         | Nómina y obligaciones laborales                |
| Treasury Agent        | Tesorería y flujo de caja                      |
| Close Agent           | Workflow de cierre mensual                     |
| Reporting Agent       | Generación de reportes y estados               |
| Risk Agent            | Detección de anomalías y riesgo                |
| Audit Agent           | Auditoría continua                             |
| Independent Reviewer  | Revisión independiente (otro modelo)           |

---

## Memoria

Drenyra separa cuatro tipos de memoria (nunca mezclar indiscriminadamente):

1. **Normativa** — normas vigentes por país/periodo
2. **Organizacional** — políticas contables, materialidad, aprobadores
3. **Operacional** — incidencias, patrones, excepciones
4. **Episódica** — qué intentó el agente, qué falló, qué resultó

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs del [programa FEOS](../01-foundation/feos-program.md):

- `agent-architecture.md` — Organización de agentes, roles, orquestación
- `agent-capability-matrix.md` — Tools por agente, deny-by-default
- `model-routing.md` — Selección de modelo por tarea y riesgo
- `skills-registry.md` — Skills fiscales, ciclo de vida
- `memory-design.md` — Cuatro tipos de memoria, aislamiento
- `r0-r3-contracts.md` — Strict tool contracts por nivel de riesgo

---

## Relación con otros planos

| Plano                                                 | Relación                                 |
| ----------------------------------------------------- | ---------------------------------------- |
| [02 — Experience](../02-experience-plane/README.md)   | Agentes se proyectan como Activity en UI |
| [05 — Trust](../05-trust-plane/README.md)             | Agentes requieren approval gates         |
| [06 — Execution](../06-execution-plane/README.md)     | Workflows durables ejecutan agentes      |
| [08 — Integration](../08-integration-plane/README.md) | Tools tipadas para conectores externos   |
