# Drenyra Superiority — Estrategia 2026-2027 (Revisada)

> **Basado en investigación de mercado Julio 2026.**
> Objetivo: Ser el equivalente contable de gentle-ai — el estándar abierto de ejecución contable verificable (Drenyra-AI).
> Para Perú, con visión a Latinoamérica.

---

> **Nota — pivot Drenyra-AI (agosto 2026):** la comparación cambió de "beat" a "analog". Drenyra-AI no busca superar a gentle-ai como harness de ingeniería: busca ser **el gentle-ai de la contabilidad** — un producto independiente que aplica la misma disciplina (especificaciones, candidatos exactos, receipts, gates, revisión humana, autoridad) al dominio contable, y que Drenyra consume como superficie. La familia se completa con **Drenyra-Pi**, el harness Pi-native que ejecuta el protocolo RDA en Pi (como Gentle Pi ejecuta Gentle AI): Drenyra-AI es el ecosistema y protocolo contable; Drenyra-Pi es la terminal contable disciplinada; Drenyra es la superficie visual. Ver también [Drenyra-Pi — Pi-Native Accounting Operations Harness](../docs/01-foundation/drenyra-pi-harness.md). Se suma **Drenyra-Engram**, la memoria institucional contable: la capa que conserva lo que la organización sabe y puede demostrar sobre su contabilidad, con procedencia, vigencia y aislamiento — recordar no significa autorizar. Ver [Drenyra-Engram — Institutional Accounting Memory](../docs/01-foundation/drenyra-engram.md). La investigación de mercado que sigue sigue siendo relevante: Digits, Cursor, Codex y gentle-ai continúan siendo competencia y referencia en sus respectivos dominios. Ver [Drenyra-AI — Accounting Agent Operating System](../docs/01-foundation/drenyra-ai-aos.md).

---

## 1. El Campo de Batalla Real (Julio 2026)

### Digits — El competidor directo

Digits es **la referencia en AI accounting**. No es un startup experimental:

- **Agentic General Ledger™**: AI nativa en el ledger, no retrofitting
- **95% automatización**: transacciones, categorización, reconciliación
- **170M+ transacciones entrenadas** = $825B. 43% más preciso que GPT-5/Claude en tareas contables
- **MCP Server**: Cualquier AI tool (Claude, ChatGPT, Cursor) consulta datos financieros en vivo
- **Ledger en tiempo real**: no batch, no 2 semanas de atraso
- **Objetos con identificadores estables**: no matching por texto
- **SOC 2 Type II**, encryption, bank-grade security
- **Aprendizaje**: 1-2 meses de review inicial, luego mejora solo

### Lo que Digits NO hace (oportunidades de Drenyra)

| Digits NO puede                   | Oportunidad Drenyra                            |
| --------------------------------- | ---------------------------------------------- |
| SUNAT, SIRE, CDR, detracciones    | Moat PERÚ — imposible de copiar                |
| Multi-país LATAM                  | COL, CHL, MEX, ARG — Digits es USA-only        |
| Multi-currency                    | Digits explícitamente no hace foreign currency |
| Evidence hash-chain               | Drenyra ya tiene INPUT→OUTPUT→GATE per phase   |
| Pipeline agentico con gates       | Drenyra ya tiene solicitud→auditoría           |
| CLI fiscal                        | Drenyra CLI existe, potenciarlo                |
| Cumplimiento normativo automático | SUNAT monitor + pipeline auto-trigger          |
| Fiscal health score               | H1 plan                                        |

### Cursor 3.0 — La referencia en UX agéntica

Cursor 3.0 en 2026 tiene:

- **Agent mode**: tareas end-to-end, multi-file editing, autonomous exploration
- **Background agents**: sub-agentes corriendo en paralelo
- **Skills**: capacidades reutilizables por contexto
- **MCP integration**: conecta cualquier tool
- **Rules system**: comportamiento configurable por proyecto
- **CLI + IDE + Web**: 3 superficies

### Gentle-ai — La referencia en harness

- SDD pipeline con gates
- Sub-agentes por fase
- Artifact store (openspec/engram/hybrid)
- Review workload guard
- Skill registry
- Model routing por fase

---

## 2. Lo que me equivoqué (y corrijo)

### ❌ Error 1: "Digits es solo dashboards inteligentes"

**Realidad:** Digits tiene un **Agentic General Ledger** con 95% auto-booking, MCP server, y está entrenado en $825B en transacciones. No es "solo analytics". Es una plataforma AI-native completa.

**Corrección:** Drenyra necesita su propio **Fiscal General Ledger** — no solo contabilidad, sino registro fiscal con clasificación automática de impacto tributario.

### ❌ Error 2: "Construir features análogos a Digits"

**Realidad:** Digits tiene 170M transacciones de ventaja en datos de entrenamiento. Competir en su terreno (categorización automática, reconciliación) es perder.

**Corrección:** NO competir en bookkeeping. Competir en **fiscal compliance, evidence chains, multi-país, y deterministic+AI hybrid**. Son terrenos donde Digits no puede jugar.

### ❌ Error 3: "Sub-agentes es feature, no moat"

**Realidad:** Cursor 3.0 y gentle-ai ya tienen sub-agentes. Digits tiene MCP. Los sub-agentes son commodity.

**Corrección:** El moat no son los sub-agentes. Es **qué hacen los sub-agentes**: compliance chains, validación SUNAT, preparación de DDJJ, detección de anomalías fiscales. El dominio fiscal es el moat.

---

## 3. La Estrategia Real

### Principio: No competir en bookkeeping. Competir en fiscal intelligence

```
Digits:    Bookkeeping  → 95% automated  → USA GAAP
Drenyra:   Compliance   → 95% automated  → Perú + LATAM
                      + Evidence chain   → Audit trail
                      + Multi-país       → Escala LATAM
                      + Deterministic+AI → Fiscal correctness garantizada
```

### H0: Fiscal General Ledger (FGL)

El ledger de Drenyra no es contable, es **FISCAL**. Cada transacción se clasifica automáticamente por:

- **Impacto IGV** (crédito fiscal, débito fiscal, exportación, exonerado)
- **Detracción aplicable** (por tipo de bien/servicio, según tabla SUNAT)
- **Percepción/Retención** (si aplica)
- **SIRE category** (compras/ventas/notas)
- **Período fiscal** (para cierre mensual)
- **RUC** (para multi-tenant)

Así como Digits tiene un `Agentic General Ledger`, Drenyra tiene un **Agentic Fiscal Ledger**.

### H1: Compliance Pipeline (ya existe, profundizar)

Lo que ya funciona y hay que llevar a 95%:

- Auto-detección de cambios normativos SUNAT
- Pipeline automático: solicitud → análisis → diseño → plan → migración → auditoría
- Compliance chains: Detracciones → PLE → SIRE (4 chains ya)
- Evidence hash-chain por fase (único en el mercado)
- ReviewGuard: protege al contador de cambios grandes

### H2: MCP + API First

Digits tiene MCP server y cualquier AI tool consulta datos en vivo.
Drenyra necesita:

- **MCP Server** para que Claude/ChatGPT/Cursor consulten datos fiscales
- **REST API pública** (ya existe, documentarla full)
- **CLI Gentleman Terminal** con slash commands fiscales

### H3: Multi-country Fiscal Plugin Architecture

Digits es USA-only. Drenyra escala LATAM:

| País      | Entidad | Tax ID  | Tax     | Factura Electrónica    |
| --------- | ------- | ------- | ------- | ---------------------- |
| Perú      | SUNAT   | RUC 11  | IGV 18% | UBL 2.1                |
| Colombia  | DIAN    | RUT/NIT | IVA 19% | Factura Electrónica CO |
| Chile     | SII     | RUT     | IVA 19% | DTE / bolsa            |
| México    | SAT     | RFC     | IVA 16% | CFDI 4.0               |
| Argentina | AFIP    | CUIT    | IVA 21% | Factura Electrónica AR |

Cada país = plugin que implementa `FiscalCountry` interface.

### H4: Deterministic + AI Hybrid

Digits es pure ML (170M transacciones). Drenyra tiene algo que Digits no puede tener: **reglas fiscales determinísticas**.

- **IGV calculation**: regla determinística (AI solo para clasificar)
- **Detracciones**: tabla SUNAT (determinística)
- **SIRE validation**: matching contra ledger (determinístico)
- **RUC validation**: Módulo 11 (determinístico)
- **Anomaly detection**: AI (donde realmente aporta)

La combinación es más poderosa que solo ML: las reglas determinísticas garantizan corrección fiscal, la AI encuentra patrones que las reglas no pueden.

### H5: Fiscal Training Data Moat

Digits tiene 170M transacciones. Drenyra necesita su propio dataset fiscal:

- **Cada pipeline ejecutado** genera datos de entrenamiento (input, output, gate results)
- **Cada corrección del contador** es training data
- **Cada compliance chain** es training data estructurado
- **Cada validación SUNAT** es training data

Con el tiempo, Drenyra tendrá el mejor modelo de compliance fiscal de LATAM.

---

## 4. Roadmap Realista

### Q3 2026 (Jul-Sep): Foundation + Perú Moat

| Sprint | Focus                  | Entregable                                                 |
| ------ | ---------------------- | ---------------------------------------------------------- |
| S1     | MCP Server             | Drenyra fiscal data consultable por Claude/ChatGPT/Cursor  |
| S2     | Fiscal Ledger (v1)     | Clasificación automática de impacto fiscal por transacción |
| S3     | Compliance 95%         | Pipeline auto-trigger por cambio normativo SUNAT           |
| S4     | CLI Gentleman Terminal | Slash commands: /solicitud, /auditar, /estado              |

### Q4 2026 (Oct-Dic): Scale LATAM

| Sprint | Focus               | Entregable                               |
| ------ | ------------------- | ---------------------------------------- |
| S5     | Colombia plugin     | DIAN, IVA 19%, factura electrónica CO    |
| S6     | Chile plugin        | SII, IVA 19%, DTE                        |
| S7     | Fiscal Intelligence | Anomaly detection, fiscal health score   |
| S8     | Evidence Browser    | Timeline visual de evidencia (web + CLI) |

### Q1 2027: México + Argentina + Marketplace

| Sprint | Focus                     | Entregable                              |
| ------ | ------------------------- | --------------------------------------- |
| S9     | México plugin             | SAT, CFDI 4.0, IVA 16%                  |
| S10    | Argentina plugin          | AFIP, IVA 21%, factura electrónica AR   |
| S11    | Fiscal Rules Marketplace  | Comunidad contribuye reglas por país    |
| S12    | Multi-agent collaboration | Agentes fiscales trabajando en paralelo |

---

## 5. Métricas de Superioridad (Julio 2026)

| vs Digits               | vs Cursor/Codex                  | vs gentle-ai                                |
| ----------------------- | -------------------------------- | ------------------------------------------- |
| SUNAT compliance nativa | UX agéntica fiscal (no genérica) | Pipeline con identidad fiscal               |
| Multi-país LATAM        | Evidence timeline visual         | Compliance chains por país                  |
| Deterministic+AI hybrid | CLI fiscal con slash commands    | ReviewGuard fiscal (por subsistema crítico) |
| Evidence hash-chain     | Background agents fiscales       | Skill registry fiscal                       |
| Fiscal health score     | MCP para datos fiscales          | Artifact store fiscal                       |

---

## 6. Lo que NO vamos a construir

- **No** competir con Digits en bookkeeping genérico (categorización de transacciones, reconciliación bancaria estándar)
- **No** copiar Cursor/Codex en features de ingeniería de software
- **No** hacer un IDE. Hacer un **Fiscal Command Center**
- **No** hacer otro MCP server genérico. Hacer un **Fiscal MCP** con tipos fiscales

> **Diferencia clave:** Digits automatiza bookkeeping. Drenyra automatiza COMPLIANCE.
> El bookkeeping se hace en USA. El compliance se necesita en TODOS lados.

---

**Última actualización:** 2026-08-01
