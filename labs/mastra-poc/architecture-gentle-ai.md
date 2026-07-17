# Drenyra → Gentle-AI for Accounting

> **Adaptación del ecosistema Gentle-AI (SDD para ingeniería de software)  
> a un ecosistema fiscal agentivo para contabilidad peruana.**

---

## La Tesis

Así como Gentle-AI configura agents de coding para que tengan **memoria, workflows, skills y persona** para ingeniería de software, **Drenyra debe hacer lo mismo para contabilidad fiscal.**

| Gentle-AI (software) | Drenyra (accounting) |
|---------------------|---------------------|
| Spec-Driven Development | Fiscal-Driven Processing |
| SDD phases: explore → propose → spec → design → apply → verify → archive | Fiscal phases: extract → classify → validate → comply → approve → submit → archive |
| Code memory (Engram) | Fiscal memory (Evidence Graph) |
| Coding skills (React, TS, Go) | Fiscal skills (SUNAT, PCGE, UBL, SIRE) |
| Code review triggers | Fiscal audit triggers |
| Developer persona | Compliance officer persona |
| 15 coding agents supported | 8 Latin Moderno fiscal agents |

---

## Mapeo Conceptual: Gentle-AI Components → Drenyra

### 1. SDD Workflow → Fiscal Workflow (FD - Fiscal-Driven)

| Gentle-AI SDD | Drenyra FD | Descripción |
|---------------|-----------|-------------|
| `sdd-explore` | `fd-extract` | Extraer datos fiscales (facturas, libros, extractos) |
| `sdd-propose` | `fd-classify` | Clasificar operaciones según PCGE |
| `sdd-spec` | `fd-validate` | Validar contra esquemas UBL 2.1 y reglas SUNAT |
| `sdd-design` | `fd-comply` | Verificar compliance (detracciones, retenciones, IGV) |
| `sdd-apply` | `fd-approve` | Aprobación fiscal (governance gates, humano-in-the-loop) |
| `sdd-verify` | `fd-submit` | Envío a SUNAT / OSE con evidencia |
| `sdd-archive` | `fd-archive` | Archivar con evidencia completa para auditoría |

### 2. Sub-Agents SDD → Latin Moderno Hierarchy

| Gentle-AI Sub-agent | Drenyra Latin Agent | Rol Fiscal |
|--------------------|-------------------|------------|
| `sdd-explore` | **Cerno** (ver/discernir) | Análisis fiscal, detección de anomalías |
| `sdd-spec` | **Regula** (regla) | Reglas PCGE, asientos contables |
| `sdd-design` | **Custos** (guardián) | Compliance SUNAT, approval gates |
| `sdd-apply` | **Necto** (conectar) | Integraciones con SUNAT/OSE/bancos |
| `sdd-verify` | **Fusio** (fusionar) | Conciliación, correlación, validación cruzada |
| `sdd-archive` | **Capsa** (caja) | Almacenamiento, evidencia, auditoría |
| Insight | **Lumen** (luz) | Reportes, tendencias, dashboards |
| Documentation | **Scripta** (escribir) | PDFs, exportaciones, documentación |

### 3. Trigger Rules → Fiscal Trigger Rules

Las reglas de trigger de Gentle-AI adaptadas a contabilidad:

```
Tier 1 — Advisory (operaciones cotidianas)
- Antes de enviar un CPE: ejecutar validateCPE
- Al clasificar una factura: ejecutar classifyPCGE
- Costo: ~1x

Tier 2 — Strong (operaciones sensibles)
- Monto > S/ 10,000: requerir fiscal_gate (Custos valida)
- Envío a SUNAT: requerir approval gate + evidence log
- Detracción/retención detectada: verificar compliance completo
- Costo: ~4x

Tier 3 — Strong (operaciones críticas)
- Cierre mensual/anual: ejecutar auditoría completa (todos los Latin Agents)
- Modificación de datos maestros fiscales: requerir approval humano
- Discrepancia > 5% en conciliación: escalar a humano
- Costo: ~8x + findings
```

### 4. Engram Memory → Evidence Graph Fiscal

| Engram (Gentle-AI) | Evidence Graph (Drenyra) |
|--------------------|------------------------|
| Memoria entre sesiones de coding | Trazabilidad fiscal inmutable |
| `mem_save` guarda decisiones de código | `evidence.append` guarda cada acción fiscal |
| `mem_search` busca decisiones pasadas | `evidence.getByRUC` consulta historial por contribuyente |
| `mem_session_summary` resume la sesión | `evidence.getByPeriod` auditoría por período |
| Sincronizable entre equipos | Exportable para SUNAT / auditoría externa |

### 5. Skill Registry → Fiscal Capability Registry

El orchestrator Drenyra necesita saber qué capacidades fiscales están disponibles:

```typescript
// skill-registry.ts — Inspirado en Gentle-AI
export const fiscalRegistry = {
  id: 'drenyra-capabilities',
  version: '1.0',
  skills: [
    { id: 'igv-calculation', type: 'fiscal', tools: ['calculateIGV'] },
    { id: 'cpe-validation',  type: 'fiscal', tools: ['validateCPE'] },
    { id: 'sire-submission', type: 'compliance', tools: ['submitSIRE'], approvalRequired: true },
    { id: 'detraction-check', type: 'compliance', tools: ['checkDetraction'] },
    { id: 'retention-check',  type: 'compliance', tools: ['checkRetention'] },
    { id: 'pcge-classification', type: 'accounting', tools: ['classifyPCGE'] },
  ],
  agents: ['cerno', 'custos', 'necto', 'regula', 'lumen', 'fusio', 'scripta', 'capsa'],
  // Por RUC pueden cambiar las capacidades disponibles
  perTenant: (ruc: string) => {
    // Consultar capacidades contratadas por el contribuyente
  },
}
```

---

## Arquitectura Drenyra: Gentle-AI para Contabilidad

```ascii
┌─────────────────────────────────────────────────────────────────────┐
│                       DRENYRA ORCHESTRATOR                          │
│              (Inspirado en gentle-orchestrator)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   FISCAL WORKFLOW (FD)                       │   │
│  │                                                              │   │
│  │  EXTRACT → CLASSIFY → VALIDATE → COMPLY → APPROVE → SUBMIT  │   │
│  │    ↑           ↑           ↑        ↑       ↑        ↑       │   │
│  │  ┌─┴──┐    ┌──┴──┐    ┌──┴──┐  ┌──┴──┐ ┌──┴──┐  ┌──┴──┐   │   │
│  │  │Cerno│    │Regula│   │Custos│  │Custos│ │Necto│  │Capsa│   │   │
│  │  └─────┘   └─────┘   └─────┘  └─────┘ └─────┘  └─────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              TRIGGER RULES ENGINE                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │   │
│  │  │ Advisory │ │  Strong  │ │ Critical │ │ Escalation    │   │   │
│  │  │ T1: auto │ │ T2: gate │ │ T3:human │ │ Handler       │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              EVIDENCE GRAPH (Fiscal Memory)                   │   │
│  │  Cada acción fiscal queda registrada immutablemente           │   │
│  │  rastreable por: sesión, RUC, período, tipo de operación     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              FISCAL CAPABILITY REGISTRY                       │   │
│  │  Skills disponibles → Latin Agents + Tools                       │   │
│  │  Per-tenant: qué capacidades tiene cada RUC                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flujo Completo: De Factura a Archivo

```
1. Llega una factura electrónica (XML)
   │
2. EXTRACT ─ Cerno analiza la factura
   │          - Extrae datos (RUC emisor, montos, IGV)
   │          - Detecta anomalías (monto inusual, RUC sospechoso)
   │
3. CLASSIFY ─ Regula clasifica según PCGE
   │          - Determina cuenta contable
   │          - Prepara asiento automático
   │
4. VALIDATE ─ Custos valida contra SUNAT
   │          - Valida CPE (UBL 2.1 + checksum)
   │          - Verifica RUC (Módulo 11)
   │          - Calcula IGV
   │          │
   │          ⚠️ Si IGV calculado ≠ IGV declarado → ESCALAR
   │          │
5. COMPLY ── Custos verifica compliance
   │          - ¿Aplica detracción?
   │          - ¿Aplica retención?
   │          - ¿Período correcto?
   │          │
   │          ⚠️ Si monto > S/ 10,000 → APPROVAL GATE
   │          │
6. APPROVE ─ Approval Gate
   │          - Si fiscal_gate: governance rules verifican
   │          - Si human_required: notificar a contador
   │          │
7. SUBMIT ── Necto envía a SUNAT/OSE
   │          - Prepara XML firmado digitalmente
   │          - Envía a OSE
   │          - Recibe CDR (Comprobante de Recepción)
   │          │
8. ARCHIVE ─ Capsa almacena todo
   │          - XML original + CDR
   │          - Evidencia de cada paso
   │          - Trazabilidad completa para SUNAT
   │
   └── EVIDENCE GRAPH registra todo el flujo
```

---

## Drenyra Orchestrator (Inspirado en gentle-orchestrator)

```typescript
// El corazón de Drenyra: un orchestrator fiscal
// que reemplaza el orquestador genérico de agent-swarm

class DrenyraOrchestrator {
  async processInvoice(xml: string, tenant: Tenant): Promise<FiscalResult> {
    // 1. Registry lookup — qué capacidades tiene este tenant
    const registry = await FiscalRegistry.getForTenant(tenant.ruc)
    
    // 2. Trigger check — ¿qué nivel de procesamiento aplica?
    const trigger = await TriggerEngine.evaluate({ 
      type: 'invoice',
      amount: parseAmount(xml),
      tenant,
    })
    
    // 3. Execute fiscal workflow
    const workflow = new FiscalWorkflow(registry)
    
    return workflow
      .step('extract',   agents.cerno)    // Análisis
      .step('classify',  agents.regula)   // PCGE
      .step('validate',  agents.custos)   // Compliance
      .step('approve',   approvalGate)    // Governance
      .step('submit',    agents.necto)    // SUNAT/OSE
      .step('archive',   agents.capsa)    // Evidencia
      .execute({ xml, tenant, trigger })
  }
}
```

---

## Comparativa: Gentle-AI vs Drenyra

| Característica | Gentle-AI | Drenyra |
|---------------|-----------|---------|
| **Propósito** | Configurar coding agents | Configurar fiscal agents |
| **Orquestador** | `gentle-orchestrator` (SDD phases) | `drenyra-orchestrator` (FD phases) |
| **Workflow** | explore → propose → spec → design → apply → verify → archive | extract → classify → validate → comply → approve → submit → archive |
| **Sub-agents** | sdd-explore, sdd-propose, sdd-spec, etc. | cerno, regula, custos, necto, fusio, capsa, lumen, scripta |
| **Memoria** | Engram (decisiones de código) | Evidence Graph (acciones fiscales) |
| **Triggers** | pre-commit, pre-pr, pre-push | pre-cpe, pre-sire, pre-cierre, pre-auditoría |
| **Registry** | Skill registry (skills de código) | Capability registry (skills fiscales) |
| **Persona** | Teaching-oriented developer | Compliance-oriented accountant |
| **Modelos** | 15+ coding agents | Model-agnostic (Vercel AI SDK) |
| **Runtime** | Configura agents existentes | Mastra + Vercel AI SDK |
| **Output** | Código verificado | Comprobante fiscal auditado |
