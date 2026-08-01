# Drenyra-Pi — Pi-Native Accounting Operations Harness

**Last updated**: 2026-08-01
**Content type**: Conceptual — Product Thesis (Drenyra-Pi)
**North star:** [Drenyra-AI — Accounting Agent Operating System](./drenyra-ai-aos.md)
**Alineado con:** [Drenyra Product Philosophy](./product-philosophy.md) · [Drenyra Strategic Positioning](./strategic-positioning.md) · [Product Topology](../14-design/product-topology.md)

---

## Definición

> **Drenyra-Pi es el harness Pi-native que convierte Pi en un operador contable disciplinado y verificable.**

Para posicionamiento internacional:

> **Drenyra-Pi is the Pi-native harness that turns Pi into a disciplined and verifiable accounting operator.**

Drenyra-Pi no es otro nombre de Drenyra-AI: **Drenyra-AI debe ser el ecosistema y protocolo contable; Drenyra-Pi debe ser el harness Pi-native que convierte Pi en un operador contable disciplinado y verificable.** No son dos nombres para lo mismo.

---

## La familia de tres productos

```
Gentle AI = ecosistema multiagente para ingeniería de software
Gentle Pi = implementación Pi-native del ecosistema Gentle AI
Drenyra-AI = ecosistema multiagente para contabilidad
Drenyra-Pi = implementación Pi-native de Drenyra-AI
```

La equivalencia completa:

| Ecosistema de ingeniería       | Harness Pi-native de ingeniería | Ecosistema contable        | Harness Pi-native contable      |
| ------------------------------ | ------------------------------- | -------------------------- | ------------------------------- |
| Gentle AI                      | Gentle Pi                       | Drenyra-AI                 | Drenyra-Pi                      |
| Ecosistema multiagente         | Implementación Pi-native        | Ecosistema multiagente     | Implementación Pi-native        |
| para ingeniería de software    | del ecosistema Gentle AI        | para contabilidad          | de Drenyra-AI                   |

Gentle Pi se define como capa operativa que convierte Pi en un harness controlado de desarrollo: empaqueta persona, routing, SDD/OpenSpec, subagentes, TDD, skills, modelos, revisión y un runtime privado de Gentle AI. **Drenyra-Pi hace esa clase de integración trasladada al dominio contable.**

---

## Referencia: qué es Gentle Pi

Gentle Pi es el precedente directo de Drenyra-Pi. Su paquete contiene: `assets/`, `contracts/`, `docs/`, `extensions/`, `lib/`, `prompts/`, `runtime/`, `skills/`, `scripts/`, `tests/`, `themes/`. Registra extensiones, temas, prompts y skills como paquete Pi; su instalación ejecuta un **postinstall** que aprovisiona un runtime privado y versionado de Gentle AI.

Su arquitectura efectiva:

```
Pi
  ↓
Gentle Pi experience layer
  ├─ persona, commands, UI/theme, prompts, skills, subagents, chains, model assignment, safety extensions
  ↓
Gentle AI native runtime
  ├─ candidate identity, review authority, receipts, gates, recovery
```

---

## Arquitectura de Drenyra-Pi

```
Pi
  ↓
Drenyra-Pi
  ├─ persona contable
  ├─ comandos contables
  ├─ panel operativo
  ├─ agentes especializados
  ├─ skills contables
  ├─ procedimientos RDA
  ├─ routing de modelos
  ├─ integraciones
  └─ guardas de seguridad
  ↓
Drenyra-AI Runtime
  ├─ identidad de empresa
  ├─ identidad de periodo
  ├─ accounting candidates
  ├─ políticas
  ├─ materialidad
  ├─ receipts Ed25519
  ├─ audit ledger
  ├─ aprobación
  ├─ recovery
  └─ gates fiscales
```

---

## Definiciones de producto

- **Drenyra-AI**: "El ecosistema abierto y verificable para agentes contables." Proporciona contratos, protocolos, agentes, skills, memoria, receipts, ledger, políticas, materialidad y autoridad contable.
- **Drenyra-Pi**: "El harness Pi-native que convierte Pi en un operador contable controlado, capaz de ejecutar procedimientos con evidencia, separación de funciones y aprobación profesional."
- **Drenyra**: "El command center visual para operar empresas, contabilidad, cierres, evidencia y agentes."

Por tanto:

```
Drenyra-AI = cerebro y protocolo
Drenyra-Pi = terminal agentic especializada
Drenyra    = interfaz operativa empresarial
```

---

## La persona: Accounting Operations Architect

Drenyra-Pi empaqueta una persona profesional contable — el equivalente al "el Gentleman" de Gentle Pi, pero como **Accounting Operations Architect**. Nombre interno: **"The Drenyra Operator" / "El Operador Drenyra"**. Tono: profesional, directo, educativo, consciente del riesgo.

Principios (lista de NO):

```
No inventar evidencia.
No registrar sin identificar empresa y periodo.
No confundir propuesta con autorización.
No modificar un periodo cerrado silenciosamente.
No presentar a SUNAT sin aprobación explícita.
No ocultar diferencias o anomalías.
No confiar en narración del agente cuando existen datos verificables.
```

---

## Startup y panel contextual

Al iniciar, Drenyra-Pi muestra un panel que fija el contexto operativo. **Eso evita operar en la empresa o periodo incorrectos:**

```
DRENYRA-PI
Empresa:         Arkelythex S.A.C.
RUC:             20XXXXXXXXX
Periodo activo:  2026-07
Estado:          OPEN
Rol:             Accounting Operator
Política:        PE-RDA-v1
Materialidad:    S/ 500
Ledger:          VALID
Agentes:         12 disponibles
SUNAT writes:    BLOCKED
```

Los importes como la materialidad se representan en céntimos como BigInt (disciplina Money del ecosistema, nunca floats) — la misma convención del `materialityAmount` de AccountingCandidate en Drenyra-AI.

---

## Routing contable orgánico

| Solicitud                          | Ruta                                 |
| ---------------------------------- | ------------------------------------ |
| Consultar un asiento o documento   | Consulta directa                     |
| Clasificar una factura sencilla    | Operación directa controlada         |
| Conciliar múltiples fuentes        | Delegación especializada             |
| Preparar un cierre mensual         | Procedimiento RDA                    |
| Modificar una regla fiscal         | Procedimiento formal obligatorio     |
| Presentar a SUNAT                  | Gate fiscal + humano                 |

```
Pregunta simple → respuesta directa
Operación rutinaria → candidato contable + validación
Trabajo multiárea → agentes especializados
Trabajo material/fiscal → Receipt-Driven Accounting
```

---

## Agentes Pi-native

Drenyra-Pi incluye agentes nativos de Pi. **El padre conserva el control; los hijos reciben contextos acotados:**

- `drenyra-orchestrator`
- `document-intake`
- `accounting-classifier`
- `journal-entry`
- `bank-reconciliation`
- `accounts-payable`
- `accounts-receivable`
- `fixed-assets`
- `inventory`
- `payroll`
- `sire`
- `tax-validator`
- `monthly-close`
- `evidence-reviewer`
- `recovery-investigator`

Ejemplo de delegación:

```
Drenyra Orchestrator
  ├─ document-intake lee comprobantes
  ├─ accounting-classifier propone cuentas
  ├─ tax-validator revisa IGV y requisitos
  ├─ evidence-reviewer verifica sustentos
  └─ orchestrator construye un candidato consolidado
```

**Ninguno autoriza por sí mismo.**

---

## Skills contables

Registry equivalente al de Gentle Pi. Primera colección:

- `peru-chart-of-accounts`
- `sunat-document-validation`
- `igv-classification`
- `sire-purchases`
- `sire-sales`
- `bank-reconciliation`
- `journal-entry-review`
- `monthly-close`
- `fixed-assets-depreciation`
- `accounts-payable-aging`
- `accounts-receivable-aging`
- `detracciones`
- `retenciones`
- `percepciones`
- `evidence-request`
- `accounting-policy-authoring`
- `rda-defect-workflow`

Cada skill declara un contrato ejecutable y versionado:

```yaml
id:
version:
jurisdiction:
applicable_period:
required_inputs:
produced_artifacts:
risk_level:
human_approval:
external_effects:
```

**No basta un SKILL.md informal para operaciones críticas: las skills fiscales necesitan contratos ejecutables y versiones.**

---

## Chains y procedimientos RDA

Chains RDA:

```
/rda-intake, /rda-scope, /rda-policy, /rda-evidence, /rda-tasks, /rda-execute, /rda-reconcile, /rda-review, /rda-approve, /rda-close, /rda-archive
```

Flujo de cierre mensual:

```
/rda-close-init → identificar empresa y periodo → congelar alcance → reunir evidencias → ejecutar conciliaciones → proponer ajustes → evaluar materialidad → revisar excepciones → solicitar aprobación → emitir receipt de cierre → cerrar periodo
```

---

## Comandos propuestos

```
/drenyra:status, /drenyra:doctor, /drenyra:company, /drenyra:period, /drenyra:models, /drenyra:agents, /drenyra:skills, /drenyra:policy, /drenyra:materiality, /drenyra:evidence, /drenyra:mission-status, /drenyra:receipt, /drenyra:ledger, /drenyra:recover, /drenyra:submission-status
```

Ejemplos:

```
/drenyra:company select arkelythex-sac
/drenyra:period select 2026-07
/drenyra:mission-status monthly-close
/drenyra:receipt verify receipt_01...
/drenyra:ledger validate
```

---

## Routing de modelos

```yaml
models:
  orchestrator:      model: gpt-5.6       effort: medium
  tax-validator:     model: gpt-5.6       effort: high
  accounting-policy: model: gpt-5.6       effort: high
  document-intake:   model: deepseek-v4-flash effort: low
  reconciliation:    model: deepseek-v4-flash effort: medium
  evidence-reviewer: model: independent-review-model effort: medium
```

**La salida de cualquier modelo se considera propuesta, nunca autoridad.**

---

## Runtime privado

Gentle Pi instala su propia versión privada de Gentle AI en vez de confiar en binarios del PATH — patrón que elimina drift y dependencias accidentales. **Drenyra-Pi hace lo mismo con Drenyra-AI.**

Rutas del runtime privado:

- `node_modules/drenyra-pi/.drenyra-ai/`
- `~/.pi/packages/drenyra-pi/runtime/`

Binarios: `drenyra-ai`, `drenyra-ledger`, `drenyra-receipt`, `drenyra-policy`, `drenyra-candidate`, `drenyra-gate`.

**No debe usar silenciosamente otra versión global:**

```
package-local runtime → versión fijada → manifest → SHA-256 → firma → verificación postinstall → fail closed
```

---

## Seguridad específica de contabilidad

```
READ → permitido según tenant y rol
PROPOSE → permitido con evidencia
POST → requiere gate contable
CLOSE_PERIOD → requiere autorización humana
REOPEN_PERIOD → requiere autorización reforzada
EXPORT_BOOKS → requiere validación
SUBMIT_TO_SUNAT → bloqueado por defecto
```

Kill switches:

```yaml
effects:
  read: enabled
  classify: enabled
  propose_entries: enabled
  post_entries: approval_required
  close_period: approval_required
  reopen_period: disabled
  sunat_submission: disabled
```

---

## Por qué no es una copia literal

Gentle Pi trabaja sobre un repo Git (candidato derivable de archivos/commits); **Drenyra-Pi trabaja sobre documentos, registros, bases de datos, APIs, periodos, políticas, evidencia externa y sistemas fiscales.** Su autoridad no depende exclusivamente de Git. Identidad compuesta:

```ts
interface AccountingExecutionIdentity {
  tenantId: string;
  companyId: string;
  fiscalPeriodId: string;
  missionId: string;
  policySnapshotHash: string;
  sourceEvidenceHash: string;
  candidateHash: string;
  actorContextHash: string;
}
```

Git sigue útil para versionar código y políticas, pero **no es la fuente única de verdad operacional.**

---

## Estructura de repositorios recomendada

Opción recomendada: **repositorios separados** — `arkelythex/Drenyra` (producto web), `arkelythex/drenyra-ai` (runtime, protocolos, contracts, agents, authority), `arkelythex/drenyra-pi` (paquete Pi-native), `arkelythex/drenyra-skills` (skills y policies versionadas).

Inicialmente pueden vivir en el monorepo, pero con boundaries diseñados como productos independientes:

```
packages/drenyra-ai-runtime
packages/drenyra-ai-contracts
packages/drenyra-accounting-agents
packages/drenyra-accounting-skills
packages/drenyra-pi
```

Más adelante se extraen **sin reescribir el dominio**.

---

## Primer producto vertical: Monthly Close Harness

**Drenyra-Pi v0.1**: seleccionar empresa, seleccionar periodo, iniciar misión, ejecutar checklist, delegar conciliaciones, recopilar evidencia, proponer ajustes, clasificar bloqueos, pedir aprobaciones, emitir receipts, verificar ledger, cerrar o reanudar.

Aprovecha lo ya construido: 15 estados, MissionRuntime, persistencia de eventos, recovery, retries, SSE, CLI, receipts Ed25519, ledger canónico, verificación offline.

---

## Roadmap conjunto

```
Phase 0 — Product contracts (Drenyra-AI thesis, Drenyra-Pi thesis, RDA protocol, boundaries)
Phase 1 — Pi harness shell (package, persona, status, doctor, company/period context, model routing)
Phase 2 — Accounting agents (orchestrator, close agent, reconciliation, evidence, review)
Phase 3 — Native authority (accounting candidate, receipt integration, ledger integration, approval gates)
Phase 4 — Monthly close (full vertical, recovery, CLI + Pi + Drenyra UI)
Phase 5 — Peru fiscal skills (SIRE, IGV, detracciones, retenciones, SUNAT gates)
```

---

## Decisión arquitectónica final

```
ARKELYTHEX
│
├── Drenyra — Accounting Command Center
├── Drenyra-AI — Evidence-driven accounting agent ecosystem
└── Drenyra-Pi — Pi-native accounting operations harness
```

Tesis conjunta:

> **Drenyra-AI aporta el protocolo, la inteligencia operativa y la autoridad verificable. Drenyra-Pi convierte Pi en la terminal contable disciplinada que ejecuta ese protocolo. Drenyra ofrece la superficie visual donde profesionales y empresas supervisan, revisan y autorizan el trabajo.**

---

## Navegación

- [Drenyra-AI — Accounting Agent Operating System](./drenyra-ai-aos.md)
- [Drenyra Product Philosophy — Definitive Thesis](./product-philosophy.md)
- [Drenyra Strategic Positioning](./strategic-positioning.md)
- [Product Topology](../14-design/product-topology.md)
- [RED — Receipt-Driven Execution](../14-design/red-spec.md)
