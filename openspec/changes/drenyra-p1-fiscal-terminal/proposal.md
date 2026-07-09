# P1: Fiscal Terminal — Drenyra CLI como gentle-pi

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**Inspiración:** Microsoft Intelligent Terminal 0.1 (Mayo 2026), gentle-pi, OpenAI Codex CLI
**PRs estimados:** 4
**Líneas estimadas:** ~1,500
**Depende de:** S5 (contratos Go↔TS alineados)

---

## Problema

El Go CLI (`apps/drenyra-cli/`) actual es un CLI clásico de comandos secos:

```bash
drenyra close --month 06 --year 2026
drenyra sire export --period 202606
drenyra detraction create --invoice INV-123
```

Funciona, pero está **10 años atrás** de lo que debería ser un CLI fiscal en 2026. No tiene:

- Sesiones con memoria contextual (qué período estás cerrando, qué falta)
- Slash commands con autocompletado (`/close`, `/sire`, `/detraer`)
- Agent pane con el asistente fiscal al lado
- Historial de decisiones entre sesiones
- Sub-agentes fiscales dedicados (detracciones, SIRE, conciliación)
- Command palette con prompt mode (`? busco facturas vencidas`)
- Auto-detección de errores ("esta detracción no cuadra con SUNAT")

Mientras Microsoft lanza Intelligent Terminal con agente nativo (Mayo 2026) y gentle-pi demuestra el patrón terminal+AI+sesiones, Drenyra CLI sigue siendo un binary de Go clásico.

## Visión

```text
┌──────────────────────────────────────────────┐
│  Drenyra Fiscal Terminal                      │
│  ┌──────────────────────────────────────────┐ │
│  │  $ /close --period 2026-06               │ │
│  │  │                                       │ │
│  │  │  │  Cierre mensual iniciado           │ │
│  │  │  │  ✓ Detracciones: 12 pendientes    │ │
│  │  │  │  ✓ SIRE ventas: 148 registros     │ │
│  │  │  │  ✓ SIRE compras: 203 registros    │ │
│  │  │  │  ✗ IGV no cuadra (-S/ 2,340.50)  │ │
│  │  │  │                                    │ │
│  │  │  │  → ¿Investigar discrepancia? [y/N] │ │
│  │  │  │                                    │ │
│  │  │  │  ┌─ Agent ──────────────────────┐  │ │
│  │  │  │  │ La discrepancia de IGV       │  │ │
│  │  │  │  │ parece venir de 3 facturas   │  │ │
│  │  │  │  │ de compras sin detracción    │  │ │
│  │  │  │  │ ¿Querés que las revise?      │  │ │
│  │  │  │  └──────────────────────────────┘  │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Cambios Propuestos

### PR 1: Agent Pane + Status Bar (400 líneas)

- Implementar un dock panel lateral en Bubbletea (tui/agent/pane.go)
- Status bar persistente con estado del agente fiscal
- Auto-detección de errores en comandos (cuando un comando falla, el agente sugiere la corrección)
- Atajos de teclado: `Ctrl+Shift+.` toggle pane, `Ctrl+Shift+I` focus

### PR 2: Slash Commands + Autocompletado (450 líneas)

- Sistema de slash commands: `/close`, `/sire`, `/detraer`, `/conciliar`, `/ple`, `/evidencia`
- Autocompletado con Tab (mostrando flags disponibles)
- Cada slash command es un sub-comando con su propio help contextual
- Command palette con prompt mode (`?` prefix para preguntas en lenguaje natural)

### PR 3: Sesiones Fiscales con Memoria (400 líneas)

- Sesiones con contexto persistente (qué período estás trabajando, qué falta)
- Integración con Engram (memoria cross-session)
- Historial de decisiones: "la última vez que cerraste junio, ajustaste IGV por S/ 2,340"
- Reanudación de sesión: volver a un workflow que quedó a medias
- Timeline de actividad fiscal

### PR 4: Sub-agentes Fiscales (250 líneas)

- Sub-agente de detracciones (especialista SPOT)
- Sub-agente de SIRE (registros de compras/ventas)
- Sub-agente de conciliación (bancaria + fiscal)
- Cada sub-agente con su propio contexto y scope

## Arquitectura

```text
apps/drenyra-cli/
├── cmd/
│   └── drenyra/
│       └── main.go                    # Punto de entrada (existente)
├── internal/
│   ├── tui/
│   │   ├── app/
│   │   │   ├── app.go                 # Bubbletea app (existente)
│   │   │   ├── agent-pane.go          # NUEVO: Agent pane dockeable
│   │   │   ├── status-bar.go          # NUEVO: Status bar con estado
│   │   │   └── command-palette.go     # NUEVO: Command palette con prompt mode
│   │   ├── slash/
│   │   │   ├── registry.go            # NUEVO: Registro de slash commands
│   │   │   ├── close.go               # NUEVO: /close command
│   │   │   ├── sire.go                # NUEVO: /sire command
│   │   │   ├── detraer.go             # NUEVO: /detraer command
│   │   │   └── conciliar.go           # NUEVO: /conciliar command
│   │   └── keybindings.go             # NUEVO: Atajos de teclado
│   ├── session/
│   │   ├── manager.go                 # NUEVO: Gestión de sesiones fiscales
│   │   ├── memory.go                  # NUEVO: Integración con Engram
│   │   └── timeline.go               # NUEVO: Timeline de actividad
│   └── agents/
│       ├── registry.go                # NUEVO: Registro de sub-agentes
│       ├── detraction-agent.go        # NUEVO: Sub-agente de detracciones
│       ├── sire-agent.go              # NUEVO: Sub-agente de SIRE
│       └── reconciliation-agent.go    # NUEVO: Sub-agente de conciliación
```

## Criterios de Aceptación

1. `Ctrl+Shift+.` abre y cierra el agent pane
2. `/close --period 2026-06` inicia un flujo de cierre con estado
3. `? qué facturas están vencidas` responde con datos reales
4. El agente detecta errores de comandos y sugiere correcciones
5. Las sesiones persisten entre reinicios del CLI
6. Cada sub-agente fiscal responde en su dominio específico

## Medición de Éxito

- Usuario puede completar un cierre mensual completo desde el CLI sin abrir la web
- Reducción de tiempo de cierre: de horas a minutos para operaciones standard
- Tasa de aceptación de sugerencias del agente > 70%
