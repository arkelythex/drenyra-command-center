# Drenyra Program Taxonomy

**Última actualización:** 2026-07-24
**Content type:** Canonical — Document Classification
**North star:** [Drenyra Product Philosophy](../products/drenyra-product-philosophy.md)

---

Drenyra no es un proyecto que se especifique completo antes de construir. Es un programa de plataforma que evoluciona por fases, donde cada documento tiene un propósito, una audiencia y un ciclo de vida específicos.

Este documento define las **clases documentales canónicas** del programa Drenyra y cómo se relacionan entre sí.

---

## 1. Clases documentales

### 1.1 SDD — System Design Document

Describe una capacidad concreta, desde el problema hasta el rollout.

**Formato:** `SDD-<DOMINIO>-<NÚMERO>.md`

**Contenido:**

- Problema y contexto
- Alcance (incluye / no incluye)
- Arquitectura y decisiones
- Estados e invariantes
- APIs, eventos, comandos
- Permisos y scoping
- Fallos y recovery
- Pruebas y verificación
- Rollout y runbook

**Ciclo de vida:** Draft → Proposed → Approved → Implemented → Verified → Deprecated/Superseded
**Madurez:** L0 (idea) → L1 (requirements) → L2 (architecture) → L3 (executable design) → L4 (verified contract)

**Estimación total:** 220–300 SDD canónicos para Perú + plataforma base

---

### 1.2 ADR — Architecture Decision Record

Una decisión irreversible o costosa.

**Formato:** `ADR-<NÚMERO>.md`
**Contenido:** Contexto, decisión, consecuencias, alternativas.
**Estimación total:** 40–80 ADR

---

### 1.3 FSD — Fiscal Specification Document

Documento normativo por obligación, país y periodo.

**Formato:** `FSD-<PAÍS>-<OBLIGACIÓN>-<NÚMERO>.md`

**Contenido:**

- Base legal y normativa aplicable
- Reglas de negocio y cálculo
- Validaciones fiscales
- Periodicidad y vencimientos
- Campos y formatos SUNAT/autoridad
- Casos de borde documentados
- Versión normativa y vigencia

**Estimación total:** 50–100 FSD para Perú; 300–700+ para LATAM completa

> Los FSD se versionan por país, régimen, tipo de contribuyente, obligación, periodo de vigencia y versión normativa.

---

### 1.4 WSD — Workflow Specification Document

Describe un flujo ejecutable con estados, transiciones y gates.

**Formato:** `WSD-<DOMINIO>-<NÚMERO>.md`

**Contenido:** Mapa de estados, transiciones, gates humanos/automáticos, excepciones, timeouts.
**Estimación total:** 50–100 workflows principales

---

### 1.5 ASD — Agent Specification Document

Un documento por agente o capacidad agentic.

**Formato:** `ASD-<DOMINIO>-<NÚMERO>.md`

**Contenido:**

- Objetivo y alcance del agente
- Tools permitidas y prohibidas
- Contexto y memoria
- Output schema
- Límites y política de escalamiento
- Evaluaciones y modelo de riesgo

**Estimación total:** 20–40 agentes principales

---

### 1.6 Contract Specs

Contratos técnicos versionados: APIs, eventos, comandos, tools, MCP/DFP connectors, schemas, receipts, permisos.

**Formato:** OpenAPI / AsyncAPI / JSON Schema / Protobuf / TypeScript contracts
**Estimación total:** 100–250 contratos versionados
**Nota:** No se convierten en SDD separados. Viven como schemas en `packages/`.

---

### 1.7 Threat Models

Análisis de seguridad por área crítica.

**Áreas requeridas:** Autenticación, multi-tenancy, SUNAT, banca, agentes, ejecución externa, documentos, marketplace, plugins, credenciales, country packs, ledger, pagos.
**Estimación total:** 15–30 threat models

---

### 1.8 Runbooks

Procedimientos para incidentes y operación.

**Formato:** `RUNBOOK-<DOMINIO>-<INCIDENTE>.md`
**Estimación total:** 30–70 runbooks

---

## 2. Estructura del programa

```
DRENYRA PROGRAM
├── Foundation
├── Peru Command
├── Ledger
├── Evidence
├── Close
├── Tax Peru
├── Agent Runtime
├── Treasury
├── Studio
├── Platform
└── Country Expansion
```

Cada dominio tiene un **Capability Map** que lista las capacidades que lo componen.

---

## 3. Madurez de documentos (L0–L4)

| Nivel | Nombre            | Qué contiene                         | Decisiones             |
| ----- | ----------------- | ------------------------------------ | ---------------------- |
| L0    | Idea              | Concepto, problema, enfoque          | Seguir o no seguir     |
| L1    | Requirements      | Alcance, criterios, escenarios       | Priorizar o posponer   |
| L2    | Architecture      | Arquitectura, decisiones, riesgos    | Aprobar diseño         |
| L3    | Executable Design | APIs, schemas, tests, contratos      | Iniciar implementación |
| L4    | Verified Contract | Implementado, probado, con evidencia | Cerrar capacidad       |

---

## 4. Ciclo de fases

| Fase                     | Objetivo                                                         | SDD acumulados | Estado        |
| ------------------------ | ---------------------------------------------------------------- | -------------- | ------------- |
| **F0** — Foundation      | Núcleo: tenancy, identity, ledger, jobs, evidence, agent runtime | 20–30          | ● En progreso |
| **F1** — Peru Close      | Cierre contable multiempresa, SIRE, conciliación                 | 55–85          | ◌ Siguiente   |
| **F2** — Peru AOS        | Accounting OS completo: AP/AR, treasury, fixed assets, taxes     | 115–175        | ◌             |
| **F3** — Studio/Platform | Skills, SDK, CLI, marketplace, policy studio                     | 150–230        | ◌             |
| **F4** — LATAM           | Expansión por país (Colombia, Chile, México, Brasil...)          | 250–400+       | ◌             |

---

## 5. Reglas de organización

1. **No todo debe ser SDD.** Usar ADR para decisiones, FSD para normativa fiscal, WSD para workflows, ASD para agentes.
2. **Los SDD se crean al entrar en implementación**, no antes. El Capability Map mantiene la visión.
3. **Cada SDD solo se cierra** cuando: spec aprobada → contratos implementados → tests pasando → threat model revisado → telemetría activa → runbook listo → evidencia capturada.
4. **Un SDD hereda** invariantes, gates y non-goals de su capability padre.
5. **No medir progreso por cantidad de SDD.** La métrica correcta: `capability coverage × implementation coverage × verification coverage × production evidence`.

---

## 6. Relación con la documentación existente

| Clase   | Ubicación actual               | Estado                    |
| ------- | ------------------------------ | ------------------------- |
| SDD     | `openspec/changes/*/`          | ~79 SDDs, varios en L1–L2 |
| ADR     | `docs/adr/` y `docs/02-adr/`   | ~12 ADRs                  |
| FSD     | No existe aún                  | Crear por país/obligación |
| WSD     | `docs/architecture/` (parcial) | Migrar cuando corresponda |
| ASD     | No existe aún                  | Crear por agente          |
| Amenaza | No existe aún                  | Crear por área            |
| Runbook | No existe aún                  | Crear por incidente       |

**Próximo paso:** crear el [Capability Map](./capability-map.md) inicial con 60–80 capacidades.
