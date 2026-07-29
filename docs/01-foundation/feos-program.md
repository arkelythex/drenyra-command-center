# CAP-FEOS-00 — Drenyra Financial Engineering Operating System

**Última actualización:** 2026-07-27
**Content type:** Program — Canonical SDD Program
**North star:** [Product Philosophy](./product-philosophy.md)
**Taxonomy:** [Program Taxonomy](./program-taxonomy.md)

---

## Resumen

CAP-FEOS-00 es el programa paraguas que define Drenyra como el **Financial Engineering Operating System de Latinoamérica**. Agrupa 18 SDDs canónicos que cubren los 8 planos arquitectónicos FEOS.

### El stack completo

```text
Ghostty         → velocidad, profundidad opcional, cero fricción
Herdr           → persistencia, composición, supervisión semántica
Pi              → runtime, tools, sesiones, modelos
OpenCode        → modos plan/exec, ergonomía agentic
Gentle-AI       → especificación, revisión, autoridad, receipts
Codex           → multiagente, skills, automations, supervisión remota
Drenyra         → semántica financiera, evidencia, riesgo, ejecución verificable
```

### Principio rector

> **Los agentes no deben dominar Drenyra. Deben permanecer debajo de una experiencia financiera superior, obedeciendo contratos, políticas y autoridad profesional.**

---

## Los 18 SDDs FEOS

### Orden de implementación: Fase 1

| #   | SDD                                                  | Plano        | Prioridad  |
| --- | ---------------------------------------------------- | ------------ | ---------- |
| 005 | [Exact Candidate Review Authority](#sdd-feos-005)    | Trust        | 🔴 Crítica |
| 006 | [R0–R3 Strict Tool Contracts](#sdd-feos-006)         | Intelligence | 🔴 Crítica |
| 007 | [Agent Event Projection](#sdd-feos-007)              | Intelligence | 🔴 Crítica |
| 001 | [Universal Financial Workspace](#sdd-feos-001)       | Workspace    | 🟡 Alta    |
| 003 | [Portfolio Attention Rollups](#sdd-feos-003)         | Workspace    | 🟡 Alta    |
| 004 | [Financial Change Sets](#sdd-feos-004)               | Workspace    | 🟡 Alta    |
| 009 | [Financial Impact Diff](#sdd-feos-009)               | Financial    | 🟡 Alta    |
| 008 | [Professional Approval Control Plane](#sdd-feos-008) | Trust        | 🟡 Alta    |
| 010 | [Evidence Root and Receipt Protocol](#sdd-feos-010)  | Trust        | 🟡 Alta    |

### Orden de implementación: Fase 2

| #   | SDD                                                           | Plano        | Prioridad |
| --- | ------------------------------------------------------------- | ------------ | --------- |
| 002 | [Persistent Pane and Layout Runtime](#sdd-feos-002)           | Experience   | 🟢 Media  |
| 011 | [Skills and Automation Registry](#sdd-feos-011)               | Intelligence | 🟢 Media  |
| 012 | [Model Routing and Cost Control](#sdd-feos-012)               | Intelligence | 🟢 Media  |
| 013 | [Mobile Supervision and Approval](#sdd-feos-013)              | Experience   | 🟢 Media  |
| 014 | [Country Pack Runtime](#sdd-feos-014)                         | Country      | 🟢 Media  |
| 015 | [Connector Conformance Framework](#sdd-feos-015)              | Integration  | 🟢 Media  |
| 016 | [Performance and UX Budgets](#sdd-feos-016)                   | Experience   | 🟢 Media  |
| 017 | [Degraded and UNKNOWN Operations](#sdd-feos-017)              | Execution    | 🟢 Media  |
| 018 | [Product Telemetry and Continuous Improvement](#sdd-feos-018) | Platform     | 🟢 Media  |

---

## SDD Definitions

### SDD-FEOS-001 — Universal Financial Workspace

**Plano:** 03 — Workspace

Workspace financiero universal que abstrae empresa, periodo y objetivo bajo una misma interfaz.

**Alcance:**

- Workspace model y lifecycle
- Scope: company + period + objective
- Estados operacionales canónicos
- Persistencia y restauración
- Migración de `drenyra-studio-platform` existente

**No incluye:** Vistas UI (se cubre en FEOS-002), Change Sets (FEOS-004)

---

### SDD-FEOS-002 — Persistent Pane and Layout Runtime

**Plano:** 02 — Experience

Runtime de layouts persistentes con paneles composables, similar a los panes de Herdr.

**Alcance:**

- Layout definitions y persistencia
- Pane resizing, splitting, regrouping
- Layout templates (Monthly Close, SIRE Review, etc.)
- Restauración de layouts entre sesiones
- Temas y densidad

---

### SDD-FEOS-003 — Portfolio Attention Rollups

**Plano:** 03 — Workspace

Portfolio multi-empresa con rollups operacionales priorizados por riesgo × materialidad × deadline.

**Alcance:**

- Portfolio entity y jerarquía
- State rollup: working → verifying → blocked → attention
- Priorización: risk × materiality × deadline × downstream impact
- Attention Inbox
- 1, 10, 100, 10,000 companies

---

### SDD-FEOS-004 — Financial Change Sets

**Plano:** 03 — Workspace

Cambios financieros aislados como branches de Git, con diff, review y merge.

**Alcance:**

- Change set entity y lifecycle
- Aislamiento de propuestas (escenarios, borradores, ajustes)
- Financial diff con impacto explicado
- Review workflow
- Merge/posting con evidencias

---

### SDD-FEOS-005 — Exact Candidate Review Authority

**Plano:** 05 — Trust

El profesional no aprueba una intención. Aprueba un candidato financiero exacto y congelado.

**Alcance:**

- Candidate freeze: hash del payload completo
- Review authority: quién, cuándo, bajo qué política
- Re-validation pre-execution: si cambió algo, la autorización expira
- Fail-closed: si no puede verificarse, no se ejecuta
- Integración con Gentle-AI receipt protocol

**Referencia:** Gentle-AI 2.1.4–2.2.0 — exact candidate, verifiable authority, fail-closed

---

### SDD-FEOS-006 — R0–R3 Strict Tool Contracts

**Plano:** 04 — Intelligence

Contratos de herramientas estrictos por nivel de riesgo, con JSON Schema y validación determinista.

**Alcance:**

- R0: flexible output
- R1: structured preferred
- R2: strict schema required
- R3: strict schema + deterministic validation + dual approval
- Constrained tool sampling (Pi 0.82+)
- Policy enforcement: modelo debe soportar el schema requerido

**Referencia:** Pi 0.82.0/0.82.1 — constrained tool calling, JSON Schema, multi-provider

---

### SDD-FEOS-007 — Agent Event Projection

**Plano:** 04 — Intelligence

Eventos de agentes no deben mostrarse como tokens de chat sin estructura. Se proyectan como objetos profesionales.

**Alcance:**

- Agent event → domain event mapping
- Event types: tool_started, tool_progress, tool_completed, workflow_waiting, etc.
- Projection: Finding, Exception, Task, Proposed Entry, Reconciliation, etc.
- UI updates con estado y progreso
- Streaming RPC correlacionado

---

### SDD-FEOS-008 — Professional Approval Control Plane

**Plano:** 05 — Trust

Control de aprobaciones profesionales con materiality, escalamiento, step-up auth y receipts.

**Alcance:**

- Approval gates por nivel de riesgo
- Materiality thresholds por company/type/amount
- Escalamiento automático
- Step-up authentication para R3
- Dual control para operaciones irreversibles
- Approval receipts inmutables

---

### SDD-FEOS-009 — Financial Impact Diff

**Plano:** 07 — Financial

Diferencia financiera explicada con impacto, evidencia, política aplicable y revisión requerida.

**Alcance:**

- Before/after comparison
- Impact analysis (EBITDA, assets, tax deferred)
- Evidence references
- Policy version reference
- Confidence scoring
- Professional review flagging

---

### SDD-FEOS-010 — Evidence Root and Receipt Protocol

**Plano:** 05 — Trust

RED (Receipt-Driven Execution): cada acción genera un receipt inmutable con input hash, modelo, policy, validaciones y firmas.

**Alcance:**

- Receipt schema canónico
- Input hashing y evidence root
- Policy version binding
- Deterministic check results
- Approval chain
- Receipt verification CLI
- Receipt signing (Rust engine)

---

### SDD-FEOS-011 — Skills and Automation Registry

**Plano:** 04 — Intelligence

Registry de skills fiscales ejecutables con versionado, permisos, evaluación y ciclo de vida.

**Alcance:**

- Skill definition schema (SKILL.md canónico)
- Skills: reconcile, classify, review-sire, calculate-depreciation, etc.
- Versionado y compatibilidad
- Permisos y tools autorizadas
- Marketplace framework
- Evaluación y telemetría

---

### SDD-FEOS-012 — Model Routing and Cost Control

**Plano:** 04 — Intelligence

Routing de modelos por tarea y nivel de riesgo, con control de costos y evaluación continua.

**Alcance:**

- Task → model class mapping
- Risk-based model selection
- Cost budgeting por workspace/company
- Fallback y degraded mode
- Provider abstraction (Pi model gateway)
- Telemetría: cost per processed document, tokens per workflow

---

### SDD-FEOS-013 — Mobile Supervision and Approval

**Plano:** 02 — Experience

Supervisión y aprobación móvil para profesionales en movimiento.

**Alcance:**

- Attention inbox móvil
- Approval/rejection con step-up auth
- Portfolio status overview
- Receipt verification
- Notificaciones push correlacionadas
- React Native (comparte tipos con web)

---

### SDD-FEOS-014 — Country Pack Runtime

**Plano:** 09 — Country

Runtime para country packs componibles con reglas fiscales aisladas.

**Alcance:**

- Country pack loading y lifecycle
- Fiscal rules en WASM (Rust)
- Tax calendar, document types, chart mappings
- Validation rules por jurisdicción
- Test cases y fixtures por país
- Estrategia: Perú → Colombia → Chile → Ecuador → México → Brasil

---

### SDD-FEOS-015 — Connector Conformance Framework

**Plano:** 08 — Integration

Framework de conformidad para conectores externos con contratos, tests y versionado.

**Alcance:**

- Connector interface contracts
- Conformance test suite
- Versionado y compatibilidad forward/backward
- Credential management
- Circuit breaker, retry, timeout policies
- Observabilidad por conector

---

### SDD-FEOS-016 — Performance and UX Budgets

**Plano:** 02 — Experience

Presupuestos de performance y UX medibles que no deben romperse.

**Alcance:**

- UX budgets: command palette < 100ms, workspace restore < 300ms, agent first event < 500ms
- Performance budgets: page load, API latency, DB query time
- CI gates que fallan si se exceden
- Telemetría de performance
- Profiling y optimización continua

---

### SDD-FEOS-017 — Degraded and UNKNOWN Operations

**Plano:** 06 — Execution

Operaciones en modo degradado y reconciliación de estados UNKNOWN.

**Alcance:**

- UNKNOWN state: cuándo y cómo se produce
- Degraded mode: operación con dependencias caídas
- Reconciliación automática de UNKNOWN
- Manual reconciliation workflow
- Guaranteed delivery en modo degradado
- Timeouts, dead letters, retry policies

---

### SDD-FEOS-018 — Product Telemetry and Continuous Improvement

**Plano:** Platform

Telemetría de producto que alimenta directamente el roadmap.

**Alcance:**

- Cost per processed document
- Cost per reconciled transaction
- Cost per closed company
- Tokens per completed workflow
- Human minutes per exception
- Infrastructure cost per tenant
- Feature usage y adoption
- Continuous improvement cycle: observe → diagnose → implement → verify → measure

---

## Relación con documentación

- [FEOS Documentation Index](../00-INDEX.md) — Mapa maestro
- [Foundation README](./README.md) — Docs fundacionales
- [Product Philosophy](./product-philosophy.md) — Tesis definitiva
- [Capability Map](./capability-map.md) — Capacidades del programa
- [SDD Audit](./sdd-audit.md) — Estado actual de SDDs
- [OpenSpec Changes](../../openspec/changes/) — SDDs en ejecución
