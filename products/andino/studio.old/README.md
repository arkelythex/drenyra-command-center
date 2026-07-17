# Andino Studio — Agentic Drone Design Workspace

> A web-based UI inspired by **Cursor 3.0**'s agent-first interface and **OpenAI Codex**'s architecture. The visual workspace where humans direct AI agents that design, simulate, build, and fly drones for the AndinoDroneLab platform.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ANDINO STUDIO                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────────┐  ┌───────────┐  │
│  │ AGENT POOL  │  │   WORKSPACE ENGINE   │  │  PLUGINS  │  │
│  │             │  │                      │  │           │  │
│  │ • Explorer  │  │  ┌────────────────┐  │  │ • MCP     │  │
│  │ • Designer  │  │  │ Phase Manager  │  │  │ • Skills  │  │
│  │ • Simulator │──┼──│ (SDD Cycle)    │──┼──│ • Tools   │  │
│  │ • Builder   │  │  └────────────────┘  │  │ • Adapters│  │
│  │ • Pilot     │  │  ┌────────────────┐  │  └───────────┘  │
│  │ • Verifier  │  │  │ 3D Viewport    │  │                 │
│  └─────────────┘  │  │ (R3F + Three)  │  │  ┌───────────┐  │
│                   │  └────────────────┘  │  │  STATE     │  │
│  ┌─────────────┐  │  ┌────────────────┐  │  │  (Zustand) │  │
│  │ CHAT ENGINE │  │  │ Metrics Engine │  │  └───────────┘  │
│  │ (WS + SSE)  │──┼──│ (Real-time)    │  │                 │
│  └─────────────┘  │  └────────────────┘  │  ┌───────────┐  │
│                   │  ┌────────────────┐  │  │  FILE     │  │
│  ┌─────────────┐  │  │ Chat / Agent   │  │  │  SYSTEM   │  │
│  │ MEMORY      │──┼──│ Reasoning View │  │  │ (WebDAV)  │  │
│  │ (Engram)    │  │  └────────────────┘  │  └───────────┘  │
│  └─────────────┘  └──────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | Description |
|---|---|
| **Agent Pool** | Specialized AI agents (explore, design, simulate, build, fly, verify) that collaborate on missions. Each has unique skills and tool access. |
| **SDD Cycle** | Structured Design & Development flow: **Explore → Propose → Spec → Design → Simulate → Build → Fly → Verify → Archive**. Each phase activates different tools and views. |
| **Workspace Engine** | Phase-aware viewport that shows the right tools and visualizations for the current stage of development. |
| **Chat / Reasoning** | Transparent agent reasoning stream — humans see *why* agents make decisions and can approve, reject, or redirect at any step. |
| **MCP Protocol** | Plugin system using the Model Context Protocol — any tool, simulator, or external service can be plugged in as a skill. |

---

## Screenshots (concept)

### Main Studio Workspace
The primary interface. Left sidebar lists active agents with live progress. Center shows the current SDD phase with relevant tools (3D viewport, engineering tables, simulation stream). Bottom panel shows the agent reasoning chat — the human-agent dialogue that drives every decision.

### Design Mode
Standalone parametric 3D editor for drone morphology. Real-time sliders adjust arm length, motor angle, frame size, battery capacity — with instant metric feedback. AI suggestions appear as overlays with one-click application.

### Flight Dashboard
Full telemetry suite with live gauges, simulated video feed with HUD overlay, mission progress tracking, agent reasoning log, and emergency controls (RTL, Land, Stop).

---

## Tech Stack (production target)

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Styling** | Tailwind CSS 4 |
| **3D Rendering** | Three.js / React Three Fiber |
| **Real-time** | WebSocket (agent updates) + SSE (telemetry) |
| **State** | Zustand 5 |
| **Editor** | Monaco Editor (config/spec editing) |
| **Plugin System** | MCP Protocol (Model Context Protocol) |
| **Memory** | Engram (persistent agent memory) |
| **Charts** | Recharts / D3 (metrics dashboard) |

---

## Project Structure

```
studio/
├── README.md                # This file
├── index.html               # Main workspace prototype
├── design-mode.html         # Parametric 3D editor prototype
├── flight-dashboard.html    # Live telemetry dashboard prototype
└── assets/
    ├── style.css            # Shared design system (CSS custom properties)
    └── app.js               # Shared application logic (agent state, chat, simulation)
```

> **Note:** These are **design specification prototypes** built as self-contained HTML/CSS/JS files. They demonstrate the vision, UI/UX patterns, and interaction model. Production implementation will use the Next.js 15 + Tailwind CSS 4 stack above.

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#0a0a0f` | App background |
| `--bg-surface` | `#14141f` | Cards, panels |
| `--accent` | `#ff6b9d` | Primary action (rose) |
| `--secondary` | `#00d4aa` | Success, secondary (teal) |
| `--warning` | `#ffa94d` | Warning state (amber) |
| `--error` | `#ff4757` | Danger state (red) |

**Font:** `system-ui, -apple-system, sans-serif` (UI) / `JetBrains Mono` (code/metrics)

---

## Interaction Model

1. **User states a mission goal** in the chat panel → "Design a drone for tunnel inspection"
2. **Agents activate** — Explorer gathers requirements, Designer proposes morphologies, Simulator runs CFD
3. **Agent reasoning is transparent** — every decision appears in chat with "why" explanations
4. **User approves/rejects** at key decision points → agents adapt
5. **Phase transitions** happen automatically as work completes — or manually via the phase header
6. **Metrics update in real-time** as parameters change in Design Mode
7. **Flight Dashboard** takes over for simulation and live missions

---

*Part of the AndinoDroneLab platform — where AI agents design, simulate, build, and fly drones.*
