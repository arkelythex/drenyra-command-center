# Drenyra Product Philosophy

**Last updated**: 2026-07-27
**Content type**: Conceptual — Definitive Thesis
**Supersedes**: v2 (2026-07-24)
**FEOS Version**: CAP-FEOS-00 — Drenyra Financial Engineering OS

---

## The Definitive Thesis

Drenyra no debe limitarse a ser "un software contable con IA". Esa categoría ya está siendo ocupada por Digits, QuickBooks, Xero y numerosos agentes especializados. Drenyra debe convertirse en:

> **El sistema operativo financiero verificable de Latinoamérica: una plataforma donde agentes especializados ejecutan el trabajo repetitivo, motores deterministas validan cada resultado, profesionales controlan las decisiones materiales y toda acción permanece respaldada por evidencia.**

La inspiración no es un ERP con chatbot. Es el **Financial Engineering Environment**: una disciplina que aplica el rigor de la ingeniería de software moderna (especificaciones, versiones, agentes, CI/CD, receipts) a la contabilidad.

```text
Git + GitHub + terminal + IDE + agentes + CI/CD
             ↓
Ledger + Evidence Graph + Fiscal Workspace + Agents + Validation Pipeline
```

---

## FEOS — Drenyra Financial Engineering Operating System

Drenyra no es un monolito con 200 menús. Es una **plataforma universal con un núcleo coherente y módulos especializados** que comparten identidad, ledger, evidencia, políticas, workflows, agentes y contratos.

### Los 8 planos arquitectónicos

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

**Regla fundamental:** Ninguna capa superior puede saltarse las garantías de las inferiores. Un agente no puede llamar directamente a SUNAT. Debe atravesar cada plano:

```
Agent proposal
→ Typed tool (Intelligence Plane)
→ Capability policy (Trust Plane)
→ Tenant scope (Workspace Plane)
→ Deterministic validator (Trust Plane)
→ Approval gate (Trust Plane)
→ Durable workflow (Execution Plane)
→ External adapter (Integration Plane)
→ Evidence receipt (Trust Plane)
```

---

## Drenyra no es una aplicación

Debe ser simultáneamente:

1. **Accounting Operating System**
2. **Fiscal Intelligence Platform**
3. **Agent Execution Environment**
4. **Professional Collaboration Network**
5. **Financial Evidence Infrastructure**
6. **API y developer platform**
7. **Marketplace de conocimiento contable**
8. **Capa de interoperabilidad gubernamental**
9. **Sistema de control y auditoría continua**
10. **Infraestructura financiera para Latinoamérica**

Su definición:

> **Drenyra is the verifiable financial operating system for businesses, accountants and governments.**

Pero el orden importa. Intentar construir "todo" desde el primer día destruiría el proyecto. La estrategia correcta es diseñar el núcleo para soportarlo todo y conquistar el mercado mediante una cuña extremadamente fuerte.

---

## Traducción exacta de la ingeniería de software

| Ingeniería moderna   | Drenyra                         |
| -------------------- | ------------------------------- |
| Proyecto/repositorio | Empresa o portafolio            |
| Workspace            | Empresa + periodo + objetivo    |
| Terminal pane        | Vista financiera operativa      |
| Worktree             | Change Set aislado              |
| Branch               | Escenario o candidato           |
| Commit               | Cambio financiero atómico       |
| Diff                 | Diferencia con impacto          |
| Pull request         | Paquete de revisión             |
| Code review          | Revisión profesional            |
| Tests                | Invariantes financieras         |
| CI pipeline          | Validación contable y fiscal    |
| Merge                | Posting/aprobación              |
| Deploy               | Ejecución externa               |
| Release              | Cierre de periodo               |
| Artifact             | Reporte, libro o declaración    |
| Logs                 | Audit trail                     |
| Skill                | Procedimiento fiscal ejecutable |
| Agent                | Especialista financiero digital |
| AGENTS.md            | Políticas de la organización    |
| SDD                  | Especificación contable/fiscal  |
| Receipt              | Prueba verificable              |
| Rollback             | Contraasiento o compensación    |

---

## Inspiraciones del stack de ingeniería

| Herramienta   | Inspiración                                              | Aplicación en Drenyra                                                          |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Ghostty**   | Velocidad, profundidad opcional, cero fricción           | Workbench instantáneo, 4 modos de profundidad, sin configuración inicial       |
| **Herdr**     | Workspaces persistentes, composición, rollups semánticos | Portfolio con rollups operacionales, estados canónicos, UNKNOWN nunca es éxito |
| **Pi**        | Runtime agentic, tools, sesiones, modelos                | Agent runtime, tool contracts R0–R3, model routing, streaming de eventos       |
| **OpenCode**  | Modos plan/exec, ergonomía agentic                       | Financial Workspace con modos de planificación y ejecución                     |
| **Gentle-AI** | SDD, revisión, autoridad, receipts                       | FSD + RED + Exact Candidate Authority + fail-closed                            |
| **Codex**     | Multiagente, skills, automations, supervisión remota     | Drenyra Conductor, Financial Skills, Approval Control Plane                    |

```text
Diseñar para el mundo
→ construir para Perú
→ dominar un workflow
→ dominar el estudio contable
→ dominar el cierre fiscal
→ dominar la empresa
→ exportar el núcleo
```

---

## 1. La equivalencia entre ingeniería de software y contabilidad

El flujo de desarrollo puede traducirse casi literalmente.

| Ingeniería de software | Drenyra                                |
| ---------------------- | -------------------------------------- |
| Repositorio Git        | Workspace financiero                   |
| Código fuente          | Documentos y transacciones             |
| Commit                 | Cambio contable atómico                |
| Diff                   | Diferencia financiera explicada        |
| Branch                 | Escenario, borrador o propuesta        |
| Pull request           | Paquete de revisión contable           |
| Code review            | Revisión del contador                  |
| Merge                  | Aprobación y contabilización           |
| CI                     | Validaciones contables y fiscales      |
| Tests                  | Invariantes financieras                |
| Build                  | Generación de libros/declaraciones     |
| Deploy                 | Presentación o ejecución financiera    |
| Release                | Cierre de periodo                      |
| Rollback               | Reversión mediante contraasiento       |
| Issues                 | Excepciones y observaciones            |
| Logs                   | Audit trail                            |
| Artifact               | Reporte, declaración o evidencia       |
| Secrets                | Credenciales SUNAT/bancarias           |
| IDE                    | Fiscal Workspace                       |
| CLI                    | Drenyra CLI                            |
| MCP                    | Conectores contables normalizados      |
| AGENTS.md              | Políticas contables de la organización |
| SDD                    | Accounting/Fiscal Specification        |
| Receipt                | Comprobante criptográfico de ejecución |

Ésta es la gran innovación conceptual:

> **Aplicar el nivel de rigor, trazabilidad, automatización y colaboración de la ingeniería de software moderna a la contabilidad.**

---

## 2. El flujo ideal del contador

El contador actual suele trabajar así:

```text
WhatsApp
→ correo
→ carpetas
→ Excel
→ sistema contable
→ portal SUNAT
→ comparación manual
→ corrección
→ exportación
→ envío al cliente
```

Drenyra debe convertirlo en:

```text
Ingest
→ Normalize
→ Classify
→ Reconcile
→ Explain
→ Propose
→ Validate
→ Review
→ Approve
→ Execute
→ Attest
→ Monitor
```

### Ejemplo real

El usuario abre Drenyra y escribe:

```text
Revisa el cierre de junio de todas las empresas.
Prioriza diferencias SIRE, comprobantes sin sustento,
cuentas bancarias sin conciliar y riesgos tributarios.
```

Drenyra no responde con un simple texto. Construye un **Execution Plan**:

```text
CLOSE-2026-06

Scope:
  74 compañías
  18,430 documentos
  12 cuentas bancarias
  RVIE + RCE + ledger + treasury

Agents:
  ingestion-agent
  document-agent
  reconciliation-agent
  tax-agent
  accounting-agent
  risk-agent
  reviewer-agent

Required gates:
  document completeness
  debit-credit balance
  period openness
  duplicate detection
  tenant boundary
  SUNAT consistency
  materiality threshold
  professional approval
```

Después devuelve trabajo estructurado:

```text
62 compañías ready
7 requieren revisión
3 bloqueadas por documentos
2 presentan riesgo material
```

Ese es el equivalente contable de ejecutar un pipeline de CI.

---

## 3. Drenyra Workspace: el "Ghostty + OpenCode" del contador

La interfaz no debe parecer una terminal antigua. Debe adoptar la **densidad operativa y el poder composable** de las herramientas de ingeniería, pero traducidas a usuarios financieros.

### Superficie principal

```text
┌───────────────────────────────────────────────────────────┐
│ DRENYRA        Company / Period / Workspace        ⌘ K    │
├───────────────┬───────────────────────┬───────────────────┤
│ Explorer      │ Operational Canvas    │ Agent / Evidence  │
│               │                       │                   │
│ Companies     │ Ledger / SIRE / Bank  │ Plan              │
│ Periods       │ Diff / Reconciliation │ Findings          │
│ Workflows     │ Documents / Reports   │ Sources           │
│ Cases         │                       │ Approvals         │
├───────────────┴───────────────────────┴───────────────────┤
│ Command Bar / Activity / Running Agents / Risk / Context  │
└───────────────────────────────────────────────────────────┘
```

### Explorer

Equivalente al explorador de archivos de un IDE:

```text
Acme Perú SAC
├── 2026
│   ├── Junio
│   │   ├── Sales
│   │   ├── Purchases
│   │   ├── Banking
│   │   ├── Payroll
│   │   ├── Ledger
│   │   ├── Taxes
│   │   ├── Evidence
│   │   └── Close
```

### Command palette

No obliga al contador a memorizar rutas o menús:

```text
> Conciliar banco BCP junio
> Generar propuesta de asiento
> Comparar RCE contra compras
> Mostrar documentos sin sustento
> Ejecutar cierre preliminar
> Crear revisión para María
> Explicar variación de IGV
```

### Vistas composables

Como un desarrollador divide terminal, editor y navegador, el contador debe poder dividir:

```text
Documento | Asiento | Regla | Evidencia
Banco | Conciliación | Excepciones
SIRE | Ledger | Diferencias
Estado financiero | Variación | Explicación
```

---

## 4. Fiscal Development Workflow

Debes crear una metodología propia, inspirada en SDD y RDD.

Gentle-AI utiliza fases explícitas, delegación, revisión acotada y receipts vinculados al candidato revisado; además recomienda mantener delgado al orquestador y delegar cuando aumenta la complejidad.

En Drenyra eso se convierte en:

### FSD — Fiscal Specification-Driven Execution

Todo workflow material empieza con una especificación.

```yaml
spec:
  id: CLOSE-PERU-MONTHLY-01
  jurisdiction: PE
  period: 2026-06
  objective: monthly_fiscal_close

scope:
  company_id: cmp_arkelythex
  sources:
    - ledger
    - bank
    - rvie
    - rce
    - electronic_documents

invariants:
  - ledger_balanced
  - no_duplicate_vouchers
  - all_entries_have_provenance
  - submitted_period_is_locked
  - cross_tenant_access_denied

approval:
  required_role: senior_accountant
  materiality_threshold: 5000_PEN
```

### RED — Receipt-Driven Execution

Cada acción relevante genera un receipt inmutable:

```json
{
  "executionId": "exec_01K...",
  "workflow": "rce-reconciliation",
  "company": "cmp_...",
  "period": "2026-06",
  "inputHash": "sha256:...",
  "policyVersion": "pe-tax-2026.07",
  "model": "specialized-model-v4",
  "deterministicChecks": {
    "passed": 42,
    "failed": 0
  },
  "approvedBy": "user_...",
  "executedAt": "2026-07-24T...",
  "outputHash": "sha256:..."
}
```

Esto debe cubrir:

- qué datos entraron;
- qué agente intervino;
- qué modelo fue utilizado;
- qué regla fiscal estaba vigente;
- qué propuesta se creó;
- qué validaciones pasaron;
- quién aprobó;
- qué se ejecutó;
- qué respondió SUNAT;
- qué evidencia quedó almacenada.

---

## 5. Arquitectura de agentes

No debes crear un "superagente contador" monolítico. Debes construir una organización digital especializada.

OpenCode permite agentes especializados con prompts, modelos y permisos diferentes, además de separar un agente de planificación sin permisos de edición de uno capaz de construir.

Drenyra debería replicar ese patrón.

### Orquestador

#### Drenyra Conductor

No contabiliza directamente. Su función es:

- interpretar el objetivo;
- determinar alcance;
- componer el workflow;
- asignar agentes;
- controlar el contexto;
- administrar presupuesto;
- detectar bloqueos;
- solicitar aprobaciones;
- consolidar resultados.

### Agentes fundamentales

```text
Drenyra Conductor
├── Ingestion Agent
├── Document Intelligence Agent
├── Accounting Classification Agent
├── Ledger Agent
├── Reconciliation Agent
├── Tax Agent
├── Payroll Agent
├── Treasury Agent
├── Close Agent
├── Reporting Agent
├── Risk Agent
├── Audit Agent
└── Independent Reviewer
```

#### Document Intelligence Agent

- extrae documentos;
- identifica comprobantes;
- verifica estructura;
- detecta alteraciones;
- relaciona XML, PDF, CDR y pagos;
- puntúa confianza;
- nunca genera asientos finales.

#### Accounting Classification Agent

- propone cuenta;
- centro de costo;
- tercero;
- impuesto;
- proyecto;
- tratamiento;
- explicación y alternativas.

#### Reconciliation Agent

- banco contra ledger;
- ventas contra RVIE;
- compras contra RCE;
- pago contra factura;
- nómina contra tesorería;
- intercompany;
- saldos auxiliares contra mayor.

#### Tax Agent

- interpreta política tributaria versionada;
- identifica obligaciones;
- ejecuta cálculos deterministas;
- detecta riesgo;
- cita fuente normativa;
- prepara, pero no presenta sin gate.

#### Independent Reviewer

Debe utilizar:

- contexto mínimo;
- modelo diferente cuando sea posible;
- inputs congelados;
- criterios predefinidos;
- cero capacidad de modificar silenciosamente la propuesta.

---

## 6. El equivalente de MCP: Drenyra Financial Protocol

MCP no debería exponerse directamente como la identidad estratégica del producto. Debes crear una abstracción propia:

> **DFP — Drenyra Financial Protocol**

Internamente puede apoyarse en MCP, APIs, colas y adaptadores. Externamente debe dar una interfaz financiera homogénea.

```text
DFP Connectors
├── Tax Authorities
│   ├── SUNAT
│   ├── DIAN
│   ├── SAT
│   ├── SII
│   └── SRI
├── Banking
├── Electronic Invoicing
├── Payroll
├── ERP
├── Commerce
├── Payments
├── Document Storage
└── Government Registries
```

Cada herramienta tendría contratos estrictos:

```typescript
interface SubmitFiscalRecord {
  jurisdiction: 'PE'
  companyId: CompanyId
  fiscalPeriodId: FiscalPeriodId
  recordType: 'RVIE' | 'RCE'
  candidateReceipt: ReceiptId
  approvalToken: ApprovalToken
}
```

La IA jamás debería enviar:

```typescript
submitToSunat(rawTextFromModel)
```

Debería solicitar una acción tipada:

```typescript
submitFiscalRecord(validatedCandidate)
```

---

## 7. Ledger como Git

Ésta puede ser una de las propiedades más diferenciadoras.

### Financial branches

El usuario puede crear:

```text
main
├── scenario/cost-reduction
├── forecast/q4
├── adjustment/audit-2026
├── close/2026-06
└── tax/rectification-2026-03
```

No significa que los asientos legales se "reescriban". Significa que Drenyra permite mantener representaciones alternativas y propuestas hasta su aprobación.

### Financial diff

En lugar de mostrar únicamente filas cambiadas:

```diff
- Servicios terceros       S/ 42,500
+ Servicios terceros       S/ 38,200
+ Activo intangible        S/  4,300
```

Drenyra explica:

```text
Impacto:
• EBITDA: +S/4,300
• Activos: +S/4,300
• Impuesto diferido: potencial
• Motivo: reclasificación del desarrollo capitalizable
• Evidencia: contrato, factura y aprobación técnica
• Confianza: 86%
• Revisión profesional requerida
```

### Financial pull request

```text
Close PR #482
────────────────────────────────────────
Company: Arkelythex SAC
Period: June 2026

Changes:
  412 proposed classifications
   18 reconciliations
    7 accruals
    3 tax adjustments

Checks:
  Ledger balance              PASS
  Document provenance         PASS
  Bank reconciliation         PASS
  SIRE consistency            PASS
  Cross-period integrity      PASS
  Material risk               REVIEW

Reviewers:
  Junior accountant           APPROVED
  Tax agent                   PASS
  Senior accountant           REQUIRED
```

Eso es mucho más poderoso que copiar visualmente GitHub. Estás trasladando su **modelo de confianza**.

---

## 8. Contabilidad como CI/CD

### Financial CI

Cada cambio ejecuta automáticamente:

```text
Static checks
├── schema validation
├── account validity
├── date/period validity
├── duplicate detection
└── tenant scope

Accounting tests
├── debit = credit
├── subsidiary = general ledger
├── opening + movement = closing
└── document → entry provenance

Fiscal tests
├── tax rule compatibility
├── SIRE reconciliation
├── withholding validation
├── deduction validation
└── filing-state compatibility

Risk tests
├── materiality
├── anomaly detection
├── related parties
├── unusual journal entries
└── fraud indicators
```

### Financial deployment

Las acciones deben tener niveles:

```text
Preview
→ Draft
→ Review
→ Approved
→ Scheduled
→ Executed
→ Accepted
→ Reconciled
→ Attested
```

Enviar a SUNAT, pagar, cerrar un periodo o emitir estados financieros no son "botones". Son despliegues controlados.

---

## 9. Drenyra CLI

Sí deberías construir una CLI. No será el producto principal para todos los contadores, pero puede ser fundamental para:

- equipos técnicos;
- grandes estudios;
- integradores;
- auditores;
- automatización;
- CI financiero;
- migraciones;
- operaciones masivas.

```bash
drenyra auth login
drenyra company use arkelythex
drenyra period use 2026-06

drenyra ingest ./documents
drenyra reconcile bank:bcp
drenyra diff sire ledger
drenyra close plan
drenyra close run --dry-run
drenyra review create
drenyra receipt verify exec_01K...
```

En lenguaje natural:

```bash
drenyra ask "¿Por qué aumentó el IGV por pagar este mes?"
```

Y para automatización:

```bash
drenyra workflow run monthly-close \
  --company all \
  --period 2026-06 \
  --require-review
```

La CLI debe actuar sobre el mismo Execution Engine de la interfaz web. Nunca crear un segundo backend.

---

## 10. La memoria de Drenyra

Gentle-AI utiliza memoria persistente para conservar decisiones, errores y contexto entre sesiones.

En contabilidad esto es aún más valioso, pero requiere separación rigurosa.

### Cuatro memorias diferentes

#### Memoria normativa

```text
Qué norma existe
Cuándo entró en vigor
A qué país/régimen aplica
Qué versión estaba vigente en el periodo
```

#### Memoria organizacional

```text
Políticas contables
Materialidad
Plan de cuentas
Centros de costo
Aprobadores
Tratamientos recurrentes
```

#### Memoria operacional

```text
Incidencias anteriores
Errores del cierre
Documentos faltantes
Excepciones aceptadas
Patrones de conciliación
```

#### Memoria episódica del agente

```text
Qué intentó
Qué falló
Qué herramienta utilizó
Qué resultado obtuvo
```

Nunca deben mezclarse indiscriminadamente.

Un tratamiento aplicado en una empresa no debe convertirse automáticamente en regla para otra. Una conversación tampoco puede reemplazar una política contable aprobada.

---

## 11. Skills contables

Así como los agentes de ingeniería utilizan skills reutilizables, Drenyra debe desarrollar un ecosistema de **Financial Skills**.

```text
skills/
├── reconcile-bank-account/
├── classify-electronic-invoice/
├── review-sire-proposal/
├── calculate-depreciation/
├── detect-duplicate-payment/
├── prepare-monthly-close/
├── analyze-working-capital/
├── evaluate-going-concern/
└── audit-journal-entries/
```

Cada skill incluiría:

```text
SKILL.md
├── Purpose
├── Required inputs
├── Applicable jurisdictions
├── Allowed tools
├── Forbidden actions
├── Deterministic validators
├── Approval requirements
├── Output schema
├── Test fixtures
└── Version
```

### Marketplace

Posteriormente:

```text
Drenyra Registry
├── Official skills
├── Audit-firm skills
├── Country packs
├── Industry packs
├── ERP connectors
├── Reporting templates
└── Control frameworks
```

No permitas un marketplace completamente abierto sobre ejecución fiscal. Debe existir:

- firma de paquetes;
- verificación de proveedor;
- permisos declarados;
- análisis de seguridad;
- versiones;
- compatibilidad;
- revocación;
- auditoría.

---

## 12. Country Packs

La expansión latinoamericana debe diseñarse desde el inicio como composición, no como forks.

```text
Drenyra Core
├── Universal Ledger
├── Evidence Graph
├── Agent Runtime
├── Workflow Engine
├── Policy Engine
├── Identity and Permissions
├── Reporting Engine
└── Country Packs
```

Cada Country Pack:

```text
country-packs/peru/
├── authority-connectors/
├── tax-calendar/
├── document-types/
├── chart-mappings/
├── validation-rules/
├── filing-workflows/
├── terminology/
├── legal-sources/
├── test-cases/
└── migrations/
```

### Orden razonable de expansión

No escogería países solamente por tamaño.

Evaluaría:

```text
Market attractiveness
× regulatory digitization
× accounting pain
× API accessibility
× partner availability
× competitive weakness
÷ localization cost
```

Una secuencia posible:

```text
Perú
→ Colombia
→ Chile
→ Ecuador
→ México
→ Brasil
```

Brasil debería diseñarse desde el inicio, pero probablemente abordarse después de contar con capital, expertos locales y una arquitectura probada.

---

## 13. Arquitectura técnica de escala mundial

### Plano de control

```text
Identity
Organizations
Companies
Roles
Policy
Agent registry
Workflow definitions
Model routing
Approvals
Billing
```

### Plano de datos

```text
Documents
Transactions
Ledger
Tax records
Bank movements
Evidence
Reports
Country-specific projections
```

### Plano de ejecución

```text
Durable workflows
Queues
Jobs
Idempotency
Fencing
Retries
Human approvals
Compensation
UNKNOWN reconciliation
Receipts
```

Tu trabajo actual en Drenyra —idempotencia, fencing, outbox, recuperación, `UNKNOWN`, tenant boundaries— no es infraestructura excesiva. Es exactamente la base que requiere una plataforma que ejecute acciones financieras reales.

### Plano de inteligencia

```text
Model gateway
Context assembler
Retrieval
Skill runtime
Tool authorization
Evaluation
Confidence calibration
Policy enforcement
Cost routing
```

### Plano de confianza

```text
Evidence graph
Immutable audit trail
Hashing
Digital signatures
Temporal policy versions
Data lineage
Execution receipts
Regulatory source provenance
```

---

## 14. Model routing

No debes depender de un solo modelo.

```text
Task                              Model class
────────────────────────────────────────────────
OCR / extraction                  specialized
Classification                    fast economical
Complex tax analysis              frontier reasoning
Reconciliation                    deterministic + ML
Narrative reporting               language model
Independent review                separate frontier model
Fraud/anomaly detection           statistical + ML
Sensitive local processing        private/local model
```

La clave no es elegir "el mejor LLM". Es construir una plataforma capaz de cambiar modelos sin cambiar la semántica del workflow.

```text
User intent
→ canonical task
→ policy evaluation
→ model selection
→ structured proposal
→ deterministic validation
→ receipt
```

---

## 15. Human-in-the-loop por riesgo

No todo necesita aprobación humana y no todo puede ser autónomo.

### R0 — lectura

- consultar;
- resumir;
- comparar;
- explicar.

Autonomía alta.

### R1 — propuesta

- clasificación;
- conciliación sugerida;
- borrador;
- reporte preliminar.

Autonomía alta, revisión por excepción.

### R2 — cambio interno

- crear asiento;
- ajustar clasificación;
- cerrar tarea;
- actualizar políticas no críticas.

Aprobación dependiendo de monto y materialidad.

### R3 — ejecución externa o irreversible

- enviar a SUNAT;
- pagar;
- declarar;
- cerrar un periodo;
- modificar datos maestros críticos;
- emitir estados firmados.

Aprobación explícita, credencial separada, receipt, doble control cuando corresponda.

Esta filosofía es más importante que el chatbot.

---

## 16. El verdadero moat

La interfaz puede copiarse. Los agentes pueden copiarse. Incluso los prompts pueden copiarse.

Tu moat debe ser compuesto:

```text
Moat =
  fiscal knowledge graph
+ execution history
+ country packs
+ validated workflows
+ evidence graph
+ accounting firm network
+ trusted integrations
+ proprietary evaluations
+ professional review data
+ institutional credibility
```

Digits ya se presenta como un sistema AI-native con ledger, conciliación, cierre, pagos, facturación y finanzas en tiempo real. Eso valida la dirección, pero también significa que "AI-native accounting" por sí solo no basta.

QuickBooks y Xero también están introduciendo agentes y automatización financiera; Xero ha declarado su ambición de convertirse en un ecosistema confiable para la era agentic.

Por eso Drenyra debe ganar mediante:

> **Profundidad fiscal latinoamericana + ejecución verificable + experiencia operacional superior.**

---

## 17. Estrategia para dominar Perú

### Primera cuña

No comiences vendiendo "todo para todas las empresas".

La cuña más fuerte sería:

> **Drenyra Close & SIRE Workspace para estudios contables multiempresa.**

Producto inicial:

```text
Portfolio Command Center
├── Companies
├── Fiscal periods
├── SIRE status
├── Missing documents
├── Bank reconciliation
├── Accounting exceptions
├── Tax risk
├── Close readiness
└── Team workload
```

Promesa:

```text
Cierra 100 empresas como si fueran un solo sistema.
```

### Después expandes

```text
1. SIRE + documentos + conciliación
2. Cierre mensual
3. General ledger
4. Facturación y cobranza
5. Tesorería
6. Nómina
7. Planeamiento y reporting
8. Auditoría continua
9. ERP completo
10. Financial network
```

Así Drenyra termina siendo "todo" porque gana cada capa con coherencia, no porque lance 40 módulos superficiales.

---

## 18. Estructura de producto recomendada

```text
Drenyra
├── Command
│   └── portfolio and operational control
├── Ledger
│   └── universal accounting core
├── Evidence
│   └── documents, lineage and provenance
├── Close
│   └── reconciliations and monthly close
├── Tax
│   └── compliance and country packs
├── Treasury
│   └── banking, cash and payments
├── Revenue
│   └── invoices and collections
├── Spend
│   └── purchasing, bills and payables
├── Payroll
│   └── workforce financial operations
├── Intelligence
│   └── analysis, forecast and recommendations
├── Audit
│   └── controls, tests and continuous assurance
├── Studio
│   └── workflows, skills and automations
└── Platform
    └── APIs, CLI, connectors and marketplace
```

---

## 19. Lo que no debes hacer

No conviertas Drenyra en:

- un chat flotante pegado a un ERP;
- una colección de dashboards;
- un clon visual de Codex;
- un wrapper de modelos;
- un RPA frágil de SUNAT;
- un sistema que oculta errores detrás de "confianza de IA";
- una interfaz terminal obligatoria para contadores;
- un monolito específico de Perú imposible de internacionalizar;
- un ERP genérico que intenta copiar SAP módulo por módulo;
- un agente autónomo que contabiliza sin evidencia.

---

## 20. La formulación definitiva

> **Drenyra será el sistema operativo financiero y fiscal verificable de Latinoamérica: una plataforma donde agentes especializados ejecutan el trabajo repetitivo, motores deterministas validan cada resultado, profesionales controlan las decisiones materiales y toda acción permanece respaldada por evidencia.**

Y la experiencia:

> **El poder de una terminal moderna, la colaboración de GitHub, la automatización de CI/CD, la inteligencia de agentes especializados y la confianza exigida por la contabilidad.**

La secuencia estratégica:

```text
Perú-native
→ accountant-native
→ workflow-native
→ agent-native
→ evidence-native
→ platform-native
→ Latin America-native
→ globally competitive
```

El concepto interno que mejor captura todo esto:

# Drenyra Financial Engineering Environment

No estás construyendo únicamente tecnología para contadores.

Estás creando una nueva disciplina:

> **Financial Engineering Operations: contabilidad administrada con especificaciones, versiones, agentes, validaciones, revisiones, despliegues y evidencia verificable.**

---

## Product references

These products are references, not templates to copy:

| Reference                       | What Drenyra should learn                                                  |
| ------------------------------- | -------------------------------------------------------------------------- |
| Git + GitHub                    | Versioning, collaboration, diff, review, immutable history                 |
| CI/CD pipelines                 | Automated validation, gated deployment, deterministic checks               |
| Codex app                       | Focused task execution, context awareness, and verification loops          |
| Cursor 3.0                      | Contextual collaboration across edit, explain, review, and execute flows   |
| Digits AI accounting            | Modern accounting clarity, automation, and visual financial confidence     |
| Global accounting leaders       | Trust, reconciliation, reporting, period close, controls, and auditability |
| Pi CLI, OpenCode, and Codex CLI | Terminal-native workflows, harness discipline, and precise execution       |
| Gentleman philosophy            | Spec-driven development, review empathy, teaching, and controlled agents   |
| MCP (Model Context Protocol)    | Normalized tool interfaces, connector contracts, typed execution           |

---

## Review checklist

Use this checklist for product, web, CLI, and agentic accounting changes:

- [ ] The change preserves SUNAT, UBL 2.1, SIRE, IGV, retenciones, detracciones, and audit invariants
- [ ] The change preserves tenant, company, and RUC scoping
- [ ] Agent recommendations expose evidence, confidence, scope, and approval state
- [ ] Risky fiscal mutations require human approval and audit output
- [ ] Every execution generates an immutable receipt (RED)
- [ ] Workflows are specification-driven (FSD) when material
- [ ] The web and CLI use compatible fiscal concepts
- [ ] The pull request stays under the 400-line review budget or documents an exception
- [ ] Documentation explains the why, the non-goals, and the verification path
- [ ] Country-specific logic is isolated in Country Packs, not hardcoded in core

---

## Related OpenSpec plans

| Plan                                                                                                                        | Purpose                                |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [`drenyra-north-star-philosophy`](../../openspec/changes/drenyra-north-star-philosophy/proposal.md)                         | Parent strategy and product guardrails |
| [`drenyra-web-agentic-accounting-philosophy`](../../openspec/changes/drenyra-web-agentic-accounting-philosophy/proposal.md) | Web command center model               |
| [`drenyra-cli-gentleman-fiscal-terminal`](../../openspec/changes/drenyra-cli-gentleman-fiscal-terminal/proposal.md)         | CLI fiscal terminal model              |
| [`drenyra-philosophy-docs-alignment`](../../openspec/changes/drenyra-philosophy-docs-alignment/proposal.md)                 | Documentation and guidance rollout     |
| [`drenyra-accountant-operating-system`](../../openspec/changes/drenyra-accountant-operating-system/proposal.md)             | Accounting OS design                   |
| [`drenyra-cierre-flow`](../../openspec/changes/drenyra-cierre-flow/proposal.md)                                             | Monthly close workflow                 |
| [`drenyra-global-shell`](../../openspec/changes/drenyra-global-shell/proposal.md)                                           | Application shell architecture         |
| [`drenyra-h02-tenant-isolation`](../../openspec/changes/drenyra-h02-tenant-isolation/design.md)                             | Tenant isolation design                |
