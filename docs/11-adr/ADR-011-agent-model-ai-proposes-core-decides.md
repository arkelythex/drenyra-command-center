# ADR-011: Agent Model — AI Propone, Core Determinista Decide (Design 3)

**Fecha:** 2026-08-11
**Estado:** Aprobado — regla arquitectónica de agentes, skills e integraciones
**Alcance:** Drenyra, Drenyra-AI, Drenyra Pi, Drenyra Skills, Adaptadores, Guardian Angel
**Referencia:** [Design 03 — Agents, Skills, Integrations](https://github.com/arkelythex/drenyra-ai/blob/main/docs/design/design-03-agents-skills-integrations.md)

---

## Context

La tentación de convertir cada función contable en un "agente" produce sistemas donde
la IA toca dinero, estados o autoridad — exactamente lo que un sistema contable
verificable no puede permitir. Sin una regla arquitectónica explícita, cada equipo del
ecosistema podía decidir distinto sobre dónde termina la IA y dónde empieza el código
determinista, y sobre qué autoridad tiene el orquestador.

## Decision

Aprobado el Diseño 3 con tres piezas normativas:

### 1. Regla arquitectónica

> **Usar IA para interpretar, investigar y proponer; usar código determinista para
> calcular, validar, autorizar y registrar.**

No se convierte cada función en un agente: cálculos monetarios, estados, materialidad,
aislamiento, gates, hashes y receipts permanecen **fuera del modelo de agentes**.

Flujo: `Drenyra · Pi · Hosts externos → SDK · MCP · CLI → Mission Orchestrator →
Agentes especializados → Candidatos estructurados → Core determinista → Gates · Receipts · Ledger`.

### 2. Orquestación

**MissionOrchestrator controla la misión pero no posee autoridad fiscal.** Divide el
cierre en trabajos delimitados, selecciona agentes y skills, provee contexto mínimo y
evidencia inmutable, controla presupuesto/intentos/concurrencia, recibe resultados
estructurados, entrega candidatos al Core y pausa cuando falta evidencia o decisión
humana. **El Core es el único componente capaz de aceptar una transición.**

Agentes iniciales (cada uno recibe una tarea acotada y devuelve un esquema conocido;
el texto libre acompaña pero nunca reemplaza importes, referencias, hashes o estados):

| Agente | Resultado permitido |
| --- | --- |
| Close Coordinator | Plan de ejecución y estado |
| Evidence Agent | Manifest de evidencia |
| Invoice/SIRE Agent | Excepciones y candidatos |
| Reconciliation Agent | Diferencias explicadas |
| Journal Candidate Agent | Asientos candidatos |
| Compliance Agent | Hallazgos y requisitos |
| Guardian Angel | Findings — nunca aprobación |

### 3. Skills e integraciones

- **Skills en tres capas:** Foundation (muy estable) · Perú (versionada por vigencia) ·
  Práctica/sector (extensible después). Cada skill declara identificador/versión,
  jurisdicción y vigencia, fuentes normativas, entradas/salidas, permisos, nivel máximo
  de autonomía, pruebas/fixtures, compatibilidad de contratos, firma/checksum y política
  de reemplazo/retiro.
- **Una actualización normativa nunca modifica retrospectivamente una misión** — el
  receipt registra exactamente qué versión de skill y política se usó.
- **Integraciones v1.0 (orden):** Drenyra SDK/API → Drenyra Pi → Servidor MCP →
  Codex/Claude Code/OpenCode → ERP/SUNAT/bancos. Drenyra-AI detecta y configura hosts
  existentes; **nunca instala** Codex, Claude u OpenCode por el usuario.
- **Comandos:** `drenyra-ai install` (configura), `doctor` (read-only estricto),
  `sync` (no sobrescribe cambios ajenos), `capabilities` (declara contratos, skills,
  jurisdicciones, adaptadores).
- **Modelos y proveedores:** agnóstico — selección por capacidad/costo/riesgo, modelos
  distintos por especialidad, prompts y modelos registrados como procedencia, cambio de
  modelo sin alterar contratos ni autoridad, **ningún score de confianza reduce una
  aprobación exigida**, resultados validados contra schemas antes de entrar al Core.

## Consequences

**Positivas:**

- Dinero, estados y autoridad nunca pasan por un modelo de lenguaje.
- El orquestador es reemplazable sin tocar autoridad; el Core permanece autoritativo.
- Skills auditables: cada misión registra la versión exacta usada.
- Proveedor intercambiable sin riesgo contractual o de autoridad.

**Negativas / costos:**

- El catálogo inicial de agentes (7) y los comandos `install/doctor/sync/capabilities`
  son **roadmap v1.0** — el CLI actual de drenyra-ai expone misiones, receipts, ledger,
  candidatos y gates, pero aún no los comandos de integración.
- Requiere schemas estrictos por agente y validación antes del Core (disciplina de
  contratos ya existente en drenyra-ai).

## Alternatives

- **Todo agente (agentes calculando dinero):** descartado — rompe la verificabilidad.
- **Orquestador con autoridad fiscal:** descartado — un orquestador no puede aceptar
  transiciones; eso es del Core.
- **Acoplamiento a un proveedor de modelos:** descartado — viola la agnosticidad y
  mezcla riesgo de proveedor con autoridad contable.

---

**Fuente canónica:** [Design 03 — drenyra-ai](https://github.com/arkelythex/drenyra-ai/blob/main/docs/design/design-03-agents-skills-integrations.md) · Ver también [ADR-010](./ADR-010-ecosystem-boundary-authority.md) (frontera del ecosistema).
