# Drenyra Operating Model — Fiscal Execution OS

**Última actualización:** 2026-08-05
**Audiencia:** Producto, arquitectura, estrategia
**Alineado con:** [Product Philosophy](./product-philosophy.md), [Strategic Positioning](./strategic-positioning.md), [Drenyra-AI AOS](./drenyra-ai-aos.md), [Drenyra-Pi Harness](./drenyra-pi-harness.md)

---

## Resumen ejecutivo

> Drenyra no compite copiando funciones aisladas de Codex, Cursor, Digits, Intuit o Xero. Compite con un **modelo operativo único**: web como plano de control, desktop como nodo local seguro, móvil como captura y supervisión, y un runtime compartido de misiones con evidencia.

> **Codex organiza las misiones. Cursor aporta continuidad de ejecución. Digits aporta cierre continuo. Intuit aporta control de cartera. Xero aporta inteligencia responsable. Drenyra une todo y añade fiscalidad peruana, validación determinista, autorización profesional y evidencia criptográfica.**

**Invariante de dinero:** todo monto se modela con el tipo `Money` (BigInt en cents) — nunca floats ni números crudos ([Non-negotiables](../../AGENTS.md)). Este invariante aplica a cada superficie descrita en este documento, desde el Review Studio hasta el Continuous Fiscal Close.

Este documento declara ese modelo operativo, distinguiendo **lo que ya existe** (con ruta de código o SDD) de **lo que es brecha real** (propuesta pendiente de SDD). Es el documento de navegación entre la [filosofía de producto](./product-philosophy.md) (el "por qué") y el [Capability Map](./capability-map.md) / [SDD Audit](./sdd-audit.md) (el "qué y cuánto").

| Patrón operativo | Estado actual | Brecha real |
| ---------------- | ------------- | ----------- |
| Bandeja de atención (gestión por excepción) | ✅ Implementado: `packages/domain/src/feos/attention.ts`, SDD-WB-008 | Priorización visual completa en web |
| Revisión visual (fuente → propuesta → evidencia) | 🟡 Parcial: `ReconciliationDiffView`, evidence rail | Review Studio (anotaciones, bounding boxes, efecto tributario) |
| Continuidad de ejecución (cloud ↔ desktop ↔ móvil) | 🟡 Base: mission-domain, SDD-WB-012 (Tauri, planned) | `ExecutionTarget` + handoff + Cloud Agent Runtime |
| Catálogo de agentes comprensible | 🟡 13 agentes internos (concepto) | 6 áreas públicas con contrato `agent.yaml` |
| Extensibilidad gobernada | ✅ SDD-FEOS-011, `drenyra-skills-automations` | Marketplace visible + conectores Drive/Gmail/Calendar |
| Portfolio Intelligence (cross-client) | 🟡 Tipo `portfolio-operations` en workspace | Consultas cross-client con política explícita de firma |
| Cierre continuo | 🟡 `monthly-close.chain.ts`, gates de `m2-real-monthly-close` | "El periodo siempre preparado" como estado, no misión |

**Regla de oro del modelo:** el motor ya tiene integridad (estados persistentes, recovery, idempotencia, gates, receipts Ed25519, router de modelos, separación IA / validación / aprobación humana). La brecha está en la **superficie operativa** — no en el motor.

---

## 1. El modelo operativo único

Cinco patrones que los productos líderes convergen en adoptar, declarados aquí como la gramática de Drenyra:

1. **Bandeja de atención** — el profesional no busca trabajo; el sistema lo ordena por `risk × materiality × deadline`.
2. **Gestión por excepción** — se revisa lo que exige juicio, no todas las líneas.
3. **Revisión visual** — fuente, propuesta, efecto fiscal y evidencia en la misma pantalla.
4. **Continuidad de ejecución** — cloud, desktop y móvil comparten la misma misión.
5. **Extensibilidad gobernada** — skills, conectores y agentes con permisos, versiones y gates.

La IA asiste; el sistema valida; el profesional revisa; la evidencia permanece.

---

## 2. Loop canónico de operación material

El loop ya existe en el repositorio (ver [01 — Foundation README](./README.md)) y es la base de cualquier superficie nueva:

```text
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

**Declaración operativa:** cualquier misión — sea lanzada desde web, desktop, móvil o CLI — atraviesa este loop. Ninguna superficie puede saltarse un paso (por ejemplo, un agente nunca llama a SUNAT directamente). La variante de gestión por excepción se inserta entre `Deterministic validator` y `Approval gate`:

```text
Observe → Prepare → Validate → Surface Exception → Human Review
→ Execute → Verify → Preserve Evidence
```

Las excepciones son la unidad de trabajo del contador: aprobar, devolver con instrucciones, o escalar.

---

## 3. Los cuatro planos de ejecución

| Plano | Rol | Estado |
| ----- | --- | ------ |
| **Web** — control plane | Cartera, empresas/RUC, periodos, misiones, aprobaciones, configuración, trazabilidad | ✅ Base: workspaces + attention + control tower service |
| **Desktop** — local execution node | Archivos locales, certificados SOL, sesiones de navegador, automatización de portales, evidencia del entorno | 🟡 [SDD-WB-012](./../../openspec/changes/sdd-wb-012/proposal.md) (Tauri 2, planned) |
| **Mobile/PWA** — capture & approval | Fotografiar comprobantes, compartir PDF/XML, aprobar/rechazar, supervisar misiones | 🟡 [SDD-FEOS-013](./feos-program.md#sdd-feos-013--mobile-supervision-and-approval) (React Native, planned) |
| **Cloud runtime** — mission & evidence | Misiones duraderas, handoff, idempotencia, receipts, evidence bundles | ✅ Base: `packages/mission-domain`, `mission-protocol` |

**La web es el centro de operación de la firma.** La navegación principal evoluciona hacia:

```text
Attention → Workspaces → Review → Clients → Agents → Skills
→ Integrations → Evidence → Audit → Settings
```

> **Decisión abierta:** la propuesta de investigación usa "Control Tower" como primera vista; el repositorio ya archivó `drenyra-control-tower` a favor del Attention Inbox (SDD-WB-008). Recomendación: mantener "Portfolio Overview" (estado transversal) y "Attention" (acción priorizada) como vistas separadas, sin resucitar el nombre "Control Tower".

### 3.1 Drenyra Web — el plano de control

Responsabilidades: cartera completa, estado del cierre por cliente/periodo, misiones, aprobaciones, insights transversales, configuración de agentes/skills/políticas, trazabilidad y auditoría.

### 3.2 Drenyra Desktop — nodo seguro de ejecución local

No es una copia de la web. Es el nodo especializado para: archivos y carpetas locales, certificados y credenciales locales, sesiones de navegador, automatización de portales, importación masiva, visualización de alta densidad y trabajo offline limitado. La lógica de negocio y las misiones viven en el runtime compartido; Desktop añade el **Local Executor**.

```text
Drenyra Desktop
├── Local Sources
├── Fiscal Browser
├── Review Studio
├── Running Missions
├── Downloads & Evidence
├── Local Credentials Broker
└── Desktop Agent
```

[SDD-WB-012](./../../openspec/changes/sdd-wb-012/proposal.md) ya define el shell Tauri 2 (system tray con conteo de attention inbox, multi-window, certificados locales SUNAT SOL, Drenyra Bridge, secure storage, background sync) con la regla **"reuse web UI — no segunda implementación"**.

### 3.3 Drenyra Mobile/PWA — captura y supervisión

La primera versión no replica el ERP. Se concentra en: fotografiar comprobantes, compartir PDFs/XML desde WhatsApp/Gmail/archivos, responder solicitudes, aprobar/rechazar con step-up auth, comentar anomalías, revisar alertas, supervisar misiones y pausar/reanudar ejecuciones permitidas. [SDD-FEOS-013](./feos-program.md#sdd-feos-013--mobile-supervision-and-approval) define la base (attention inbox móvil, portfolio status, receipt verification, push, React Native compartiendo tipos con web).

### 3.4 Cloud runtime — misiones y evidencia

Una misión puede comenzar en web, necesitar un certificado local, pasar a desktop y regresar a cloud conservando: `missionId`, cursor, estado, approvals, receipts, evidence bundle e idempotency key. La semántica de misión existe (`mission-domain`, `mission-protocol`); falta el transporte explícito de continuidad (ver §6).

---

## 4. Bandeja de atención — el corazón de la gestión por excepción

**Estado: ✅ implementado en dominio y API.**

`packages/domain/src/feos/attention.ts` (FEOS-003) define el modelo: categorías (`blocked`, `approval_needed`, `evidence_needed`, `input_needed`, `failed`, `approaching_deadline`, `risk_detected`), prioridad `risk × materiality × deadline`, rollups workspace → company → portfolio, y campos operativos (`resolutionHint`, `actionUrl`, `downstreamImpact`). SDD-WB-008 reemplazó al archivado `drenyra-control-tower`.

**Brecha:** completar la superficie visual priorizada en web y el conteo en tray de desktop (SDD-WB-012). El modelo ya responde la pregunta central: *¿dónde tiene que intervenir el contador ahora?*

---

## 5. Catálogo de agentes públicos

**Estado actual:** el concepto "13 agentes especializados orquestados por un Conductor" está en [Strategic Positioning](./strategic-positioning.md). Internamente se convocan agentes por fase (fiscal-agent con pasos, categorizador PCGE, swarm).

**Propuesta (brecha):** exponer **seis áreas comprensibles** al usuario, manteniendo los agentes internos como componentes:

| Agente público | Responsabilidad |
| -------------- | --------------- |
| **Facturación y CPE** | Validación, clasificación, notas de crédito, inconsistencias y estado SUNAT |
| **Bancos y Conciliación** | Estados de cuenta, matching, duplicados, faltantes y diferencias |
| **Cierre Contable** | Checklist, provisiones, depreciaciones, asientos y estados financieros |
| **SIRE y Libros Electrónicos** | RVIE/RCE, propuestas, diferencias, PLE y trazabilidad |
| **Impuestos** | IGV, renta, PDT 621, detracciones, percepciones y retenciones |
| **Auditoría y Evidencia** | Muestreo, anomalías, procedencia, receipts y expediente de auditoría |

El usuario elige un resultado ("revisar SIRE"), no cuál de trece agentes técnicos convocar. Cada agente público exige un contrato explícito:

```yaml
agent:
  id: sire-review
  scope:
    - tenant
    - fiscal-period
  allowed_tools:
    - sire-read
    - cpe-query
  prohibited_actions:
    - submit-without-approval
  deterministic_validators:
    - rvie-schema
    - rce-schema
    - period-consistency
  approval_policy: explicit
  evidence_policy: mandatory
  model_class: fiscal-reasoning
  fallback: human-review
```

Este contrato es el enlace entre el [flujo de operación material](./README.md#flujo-de-operación-material) y el Capability Map. Dominios existentes que anclan las seis áreas: `features/taxation` (PDT 621), `features/reconciliations`, `features/ai-swarm`, `fiscal-compliance-pipeline/chains/monthly-close.chain.ts`, SIRE en `packages/infrastructure/src/sunat/`.

---

## 6. Continuidad de ejecución: ExecutionTarget y handoff

**Estado actual:** misiones, intents (`monthly-close`, `portfolio-operations`, `sire-review`, `rce-rectification`), `MissionSnapshot` y readiness gates ya existen en `packages/mission-domain` / `mission-protocol` y `m2-real-monthly-close`.

**Propuesta (brecha):** declarar el destino de ejecución como parte del contrato de misión:

```ts
type ExecutionTarget =
  | "cloud"
  | "desktop"
  | "hybrid";

interface ExecutionEnvironment {
  target: ExecutionTarget;
  capabilities: string[];
  networkPolicy: string;
  secretsPolicy: string;
  checkpointPolicy: string;
  evidencePolicy: string;
  approvalPolicy: string;
}
```

- **Cloud:** clasificación, conciliación, OCR, preparación de cierres, revisión SIRE, detección de anomalías, reportes.
- **Desktop:** certificado local, archivo protegido, aplicación instalada, sesión SUNAT, directorio observado, portal sin API, interacción humana próxima.
- **Hybrid:** cloud prepara → desktop completa el paso local → cloud valida y genera el expediente final.

También se incorpora un **Drenyra Runtime Doctor** (inspirado en Cloud Doctor de Cursor, limitado a infraestructura): conexión caída, skill incompatible, worker sin salud, token vencido, dependencia ausente, error transitorio, cola bloqueada. **No corrige decisiones fiscales autónomamente**; repara o escala el entorno de ejecución.

---

## 7. Constrained Fiscal Computer Use

**Estado actual:** `SunatScraper` / `SunatStealthScraper` (Puppeteer con anti-detección y captcha) operan portal SUNAT y Buzón Electrónico; los bancos se integran por parsing de CSV/Excel (BCP/BBVA/Interbank) en `apps/data-engine` y `agentic-ledger`.

**Política propuesta (brecha de documentación):** no existe "Computer Use general". Drenyra define **Constrained Fiscal Computer Use** en tres niveles:

| Nivel | Mecanismo | Regla |
| ----- | --------- | ----- |
| **1 — API o conector** | Integración oficial | Siempre preferido |
| **2 — Browser playbook determinista** | Dominio permitido, acción declarada, selectores conocidos, precondiciones, captura antes/después, descarga con hash, receipt por acción | Selectores versionados, nunca navegación libre |
| **3 — Visión como fallback** | Navegación asistida read-only | Cualquier envío, declaración o modificación requiere aprobación explícita |

El modelo **nunca recibe contraseñas SOL, certificados o secretos bancarios directamente**: un credential broker controla la autenticación y entrega únicamente la sesión o acción autorizada. El stealth scraping y la resolución de captcha quedan aislados como implementación excepcional — no como promesa central de producto.

---

## 8. Skills, Connectors, Agents, Missions, Policies, Receipts

**Estado actual:** la base documental de Financial Skills existe ([Product Philosophy §11](./product-philosophy.md)), con SDD-FEOS-011 (Skills and Automation Registry: `reconcile`, `classify`, `review-sire`, `calculate-depreciation`) y `drenyra-skills-automations` applied. El runtime de skills está en `drenyra-studio-platform` (skills SUNAT seed: `sire-readiness`, `adversarial-audit`, `knowledge-retrieval`).

**Separación conceptual (declarada):**

```text
Skills      = conocimiento + procedimiento
Connectors  = acceso a sistemas externos
Agents      = identidad operacional
Missions    = ejecución concreta
Policies    = límites y autorizaciones
Receipts    = evidencia del resultado
```

**Brecha:** convertir la base en experiencia visible y gobernada. Cada skill debe mostrar: oficial o comunitaria, autor, firma, versión, año tributario compatible, regímenes compatibles, permisos, conectores requeridos, operaciones de lectura/escritura, gates de aprobación, evaluaciones, cobertura de pruebas, costo estimado e historial. Los primeros conectores generales de alto valor: **Drive, Gmail y Calendar** (patrón Cursor Google Workspace), combinados con los conectores fiscales, bancarios y de facturación propios.

---

## 9. Portfolio Intelligence

**Estado actual:** el workspace ya soporta el objetivo `portfolio-operations` con layout dedicado (`packages/workspace-layout/src/templates/portfolio-operations.ts`) y la promesa de cuña "Cierra 100 empresas como si fueran un solo sistema" ([Strategic Positioning](./strategic-positioning.md)).

**Propuesta (brecha):** elevar la unidad de análisis desde el cliente individual a la cartera, con consultas cross-client **autorizadas por política explícita de firma contable**:

- segmentación por régimen, industria, oficina o responsable;
- clientes con cierres atrasados, anomalías recurrentes, impuestos próximos;
- calidad documental, performance de agentes, tiempo ahorrado, capacidad del equipo;
- benchmark interno anonimizado.

Ejemplos: *"Muéstrame los clientes del Régimen MYPE con diferencias SIRE no resueltas"*, *"¿Qué empresas tienen compras sin detracción por encima del umbral?"*, *"¿Cuáles son los cierres con mayor riesgo de retraso esta semana?"*

**Restricción innegociable:** las consultas nunca mezclan información entre tenants sin política explícita de firma y autorización de cartera (ver tenant guard: [Non-negotiables](../../AGENTS.md)).

---

## 10. Continuous Fiscal Close

**Estado actual:** el cierre es una cadena determinista (`packages/fiscal-compliance-pipeline/src/chains/monthly-close.chain.ts`: Cierre Mensual → PLE → SIRE → PDT) con 7 readiness gates automatizados (`m2-real-monthly-close`) y CLI `drenyra workflow run monthly-close` ([Product Philosophy §9](./product-philosophy.md)).

**Propuesta (declaración estratégica):** el cierre mensual deja de ser una misión que construye todo desde cero al fin de mes. Pasa a ser una misión de **confirmación, resolución de pendientes, aprobación, congelamiento, firma y generación del expediente** sobre un periodo mantenido todo el mes:

```text
Ingreso de CPE
→ Clasificación y validación
→ Cruce SUNAT / SIRE / banco
→ Control determinista
→ Excepción o contabilización propuesta
→ Revisión humana cuando corresponda
→ Periodo siempre preparado
```

La ventaja diferencial de Drenyra: llevar el cierre continuo a la realidad regulatoria peruana (CPE, SIRE, PLE, PDT 621, detracciones, percepciones, retenciones) con evidencia normativa — no a un cierre genérico.

---

## 11. Router de modelos por clases de capacidad

**Estado actual:** implementado (`packages/domain/src/feos/model-routing.ts`: "Frontier models are NOT used for tasks a smaller model can handle"; `AdaptiveRouter` + `ModelRegistryService` + fallback en `packages/infrastructure/src/ai/model-router/`; `ModelRouter` por fase fiscal en `fiscal-sdd`) y declarado en SDD-FEOS-012 (task → model class mapping, risk-based selection, cost budgeting).

**Regla contractual (declarada):** los contratos internos no dependen de nombres comerciales de modelos (GPT-x, Claude-x), sino de **clases de capacidad**: `frontier-reasoning`, `fast-extraction`, `vision-review`, `deterministic-classifier`. Esto hace el runtime inmune a retiradas de modelos (como la retirada programada de GPT-5.4 en Codex) y permite modelo barato/rápido para tareas rutinarias (clasificar gastos) + modelo frontier para análisis complejos o explicaciones fiscales.

---

## 12. Roadmap priorizado

Anclado al estado real: las filas citan el SDD existente o marcan la brecha sin SDD.

### P0 — Superficie operativa

1. **Attention Inbox visual completo** — base ✅ (`feos/attention.ts`, SDD-WB-008); falta priorización visual y flujo de acción en web.
2. **Catálogo de seis agentes públicos** — brecha; contrato `agent.yaml` (§5).
3. **Review Studio** — brecha; CPE, estado bancario y propuesta SIRE en tres paneles (ver §3.2, layout en la propuesta de producto).
4. **`ExecutionTarget` cloud/desktop/hybrid** — brecha; base de misión ✅ (`mission-domain`).
5. **Captura móvil por cámara y share sheet** — brecha; base SDD-FEOS-013 (planned).
6. **Readiness score por cliente y periodo** — brecha; gates de cierre ✅ (`m2-real-monthly-close`), falta score de cartera.

### P1 — Continuidad

1. **Cloud Agent Runtime** — brecha.
2. **Handoff web ↔ desktop** — base SDD-WB-012 (planned).
3. **Continuous Fiscal Close** — base ✅ (`monthly-close.chain.ts`); falta el estado "periodo siempre preparado".
4. **Portfolio Overview transversal** — base ✅ (workspace `portfolio-operations`); falta la vista de cartera unificada.
5. **Conectores Drive, Gmail, Calendar** — brecha (patrón §8).
6. **Misiones fijadas, forks y subthreads** — brecha (base de threads con quick-actions).

### P2 — Escala

1. **Fiscal Browser restringido** — Constrained CFC nivel 2/3 (§7).
2. **Marketplace de Skills** — base SDD-FEOS-011 + `drenyra-studio-platform`.
3. **Cross-Client Intelligence** — brecha con política explícita de firma (§9).
4. **Drenyra Remote desde móvil** — brecha.
5. **Runtime Doctor** — brecha (§6).
6. **Benchmark y telemetría de modelos y agentes** — base SDD-FEOS-012.

---

## 13. Qué no construir

- ❌ Trece mascotas o chats separados visibles (el catálogo público es de seis áreas).
- ❌ Computer Use irrestricto (solo Constrained Fiscal Computer Use, §7).
- ❌ Una aplicación desktop con lógica divergente de la web (SDD-WB-012: reuse web UI).
- ❌ Automatización fiscal basada solamente en prompts (todo atraviesa el loop de §2).
- ❌ Acciones irreversibles sin gates.
- ❌ Modelo de datos centrado en conversaciones (el centro es la misión y la evidencia).
- ❌ Contratos con nombres permanentes de modelos comerciales (solo clases de capacidad, §11).
- ❌ Dashboards que muestran métricas sin conducir a acción (todo conduce al Attention Inbox).
- ❌ Un agente cloud que no pueda explicar qué hizo, con qué fuente y bajo qué autorización.

---

## Related docs

- [Product Philosophy](./product-philosophy.md) — tesis definitiva y skills contables
- [Strategic Positioning](./strategic-positioning.md) — elevator pitch, moat, competencia
- [Drenyra-AI AOS](./drenyra-ai-aos.md) — ecosistema y protocolo contable
- [Drenyra-Pi Harness](./drenyra-pi-harness.md) — terminal Pi-native, agentes y routing
- [Capability Map](./capability-map.md) — 90+ capacidades del programa
- [SDD Audit](./sdd-audit.md) — estado de los SDDs
- [FEOS Program](./feos-program.md) — SDD-FEOS-011/012/013 (skills, routing, mobile)
- [Workbench Design](./../14-design/cap-workbench-00.md) — surfaces, attention, desktop shell
- [01 — Foundation README](./README.md) — loop de operación material y planos FEOS
