# Drenyra on Mastra — POC

> **¿Qué pasaría si Drenyra dejara de ser un framework de agentes y se convirtiera en UNA PLATAFORMA FISCAL sobre Mastra?**

Este POC demuestra cómo reemplazar **63,000 líneas** de infraestructura custom (`agent-swarm` + `ai` + `platform-core` + `harness`) por **< 5,000 líneas** de integración con [Mastra](https://mastra.ai) + [Vercel AI SDK](https://sdk.vercel.ai), manteniendo la jerarquía Latin Moderno y toda la inteligencia fiscal.

## Filosofía

```
Cursor = VSCode + Agentic Context for Code
Drenyra = Mastra + Agentic Context for Accounting
```

| Concepto | Cursor | Drenyra (propuesta) |
|----------|--------|-------------------|
| **Base** | VSCode (Monaco + Electron) | Mastra + Vercel AI SDK |
| **Valor diferencial** | Context-aware code editing, composer, multi-file | Fiscal intelligence, SUNAT, PCGE, Latin Moderno hierarchy |
| **Modelos** | Anthropic, OpenAI (agnóstico) | Cualquier modelo (agnóstico via AI SDK) |
| **Lo commodity** | Editor, file tree, terminal | Agent framework, runtime, event bus, tool calling |

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   DRENYRA                        │
│  ┌─────────────────────────────────────────────┐│
│  │        L1 — SUPERVISOR (Mastra Workflow)    ││
│  │  Decide, delega, escalade, aprueba          ││
│  └──────────────┬──────────────────────────────┘│
│                 │                                │
│    ┌────────────┼────────────┐                   │
│    ▼            ▼            ▼                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │Cerno │  │Custos│  │Necto │  ... 8 L2 Agents  │
│  │      │  │      │  │      │                   │
│  │ Mastra Agent + Tools   │                     │
│  └──────┘  └──────┘  └──────┘                   │
│         │         │         │                    │
│         ▼         ▼         ▼                    │
│  ┌──────────────────────────────┐                │
│  │   Vercel AI SDK (model call) │                │
│  │   openai/anthropic/google    │                │
│  └──────────────────────────────┘                │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │   @arkelythex/domain         │ ← INTOCABLE    │
│  │   Money, RUC, UBL, IGV       │                │
│  └──────────────────────────────┘                │
└─────────────────────────────────────────────────┘
```

## Hoja de Ruta

| Fase | Qué | Impacto |
|------|-----|---------|
| **1** | Migrar `agent-swarm` core a Mastra Agents + Workflows | -32K líneas |
| **2** | Reemplazar `@arkelythex/ai` con Vercel AI SDK directo | -19K líneas |
| **3** | Eliminar `platform-core` + `harness` | -5K líneas |
| **4** | Tools fiscales como Mastra Tools (sin cambios en domain) | 0 líneas nuevas |
| **5** | Approval gates como middleware de Mastra | -500 líneas |

## Comparativa de Tamaño

| Componente | Antes (custom) | Después (Mastra) | Reducción |
|-----------|---------------|------------------|-----------|
| agent-swarm | 37,046 líneas | 3,500 líneas | **90%** |
| @arkelythex/ai | 21,185 líneas | 500 líneas | **97%** |
| platform-core | 4,303 líneas | 0 (Mastra runtime) | **100%** |
| harness | 822 líneas | 200 líneas | **75%** |
| **Total infra** | **~63,356 líneas** | **~4,200 líneas** | **~93%** |
| domain (intocable) | 33,279 líneas | 33,279 líneas | 0% |

## Cómo probar este POC

```bash
cd labs/mastra-poc
bun install
bun run src/basic-workflow.ts
```

## Archivos del POC

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Este archivo |
| `architecture.md` | Documento detallado de arquitectura |
| `src/agents/latin-agents.ts` | Definición de los 8 Latin Agents como Mastra Agents |
| `src/tools/fiscal-tools.ts` | Tools fiscales (IGV, SIRE, CPE, calendario) |
| `src/workflows/latin-moderno.ts` | Workflow Supervisor → DomainAgent → SubAgent |
| `src/middleware/approval-gate.ts` | Approval gate como middleware |
| `src/mastra-orchestrator.ts` | LatinModernoOrchestrator sobre Mastra |
| `src/evidence-graph.ts` | Integración con evidence graph |
| `src/basic-workflow.ts` | Ejemplo ejecutable |
