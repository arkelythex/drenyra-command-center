# AndinoDroneLab 🤖🚁

**Agentic AI platform for drone engineering evolution — design, fly, and learn with AI.**

> **Status: Fase 1 — Fundación** (90 %) · [Roadmap](docs/roadmap.md) · [Manifiesto](docs/manifesto.md) · [Arquitectura](docs/architecture.md)

---

## 🧬 Philosophy

| Principle | Meaning |
|-----------|---------|
| **Agentic AI-first** | AI is the centre, not an accessory. It designs, orchestrates, flies, and learns. |
| **Evolutionary morphologies** | We don't build ONE drone. We evolve designs via NSGA-II, evaluate with physics, and generate CAD. |
| **SDD for drones** | Spec-Driven Drone Engineering: 9 phases from Explore to Archive, with per-phase model routing. |
| **Closed loop** | Every flight feeds episodic memory — the system improves itself. |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                       ANDINO ORCHESTRATOR                            │
│   Typer CLI · 9 SDD phases · per-phase model routing · Rich TUI     │
│                                                                      │
│   pipeline "quadcopter 4km altitude" --yes                           │
│   ┌──────┐ ┌──────┐ ┌────┐ ┌──────┐ ┌────────┐ ┌─────┐ ┌───┐ ┌────┐  │
│   │Explore│→│Propose│→│Spec│→│Design│→│Simulate│→│Build│→│Fly│→│Ver.│→│→Archive
│   └──┬───┘ └──┬───┘ └──┬─┘ └──┬───┘ └───┬────┘ └──┬──┘ └─┬─┘ └──┬─┘  │
│      │mission │concepts│ specs│evolved  │sim data │ BOM  │flight│report│
│      │analysis│        │      │designs  │         │      │logs  │      │
│      └────────┴────────┴──────┴─────────┴─────────┴──────┴──────┴──────┘
│                                                                      │
│   PipelineContext — structured data flows between all 9 phases       │
└──────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  MORPHOLOGY     │   │  AGENTIC         │   │  ANDINO STUDIO   │
│  ENGINE         │   │  RUNTIME         │   │  (Next.js 15)    │
│                 │   │                  │   │                  │
│ • NSGA-II (DEAP)│   │ • Cerebrum (LLM) │   │ • Agent Window   │
│ • PhysicsSurr.  │   │ • Cerebellum(PX4)│   │ • Design Mode    │
│ • Co-design     │   │ • 10 Hard Skills │   │ • Flight Dash.   │
│ • CadQuery gen  │   │ • 5 Soft Skills  │   │                  │
│ • ASCII viz     │   │ • 4-layer Memory │   │                  │
│                 │   │ • ROS 2 Bridge   │   │                  │
└─────────────────┘   └──────────────────┘   └──────────────────┘
```

### Data pipeline

Each phase produces typed `PhaseResult` with structured `data` that feeds the next:

| Phase | Produces | Feeds into |
|-------|----------|------------|
| `explore` | Mission analysis (altitude, payload, constraints) | `propose` |
| `propose` | 3–5 design concepts with tradeoffs | `spec` |
| `spec` | Engineering spec (battery, propulsion, frame) | `design` |
| `design` | Evolved designs via **MorphologyEngine** | `simulate` |
| `simulate` | Physics-based performance (flight time, power, stability) | `build` |
| `build` | BOM with costs, tools, assembly steps | `fly` |
| `fly` | Mission execution via **AgenticRuntime** | `verify` |
| `verify` | Pass/fail checks vs. requirements, verdict | `archive` |
| `archive` | MemoryStore persistence + pipeline report | — |

---

## 📦 Modules

| Module | Files | Lines | What it does |
|--------|-------|-------|-------------|
| `orchestrator/` | 9 | ~4,300 | Typer CLI · 9 SDD phases · PipelineContext · PhaseResult typing · Rich TUI · MemoryStore · SkillRegistry · ModelRouter |
| `agent/` | 8 | ~2,700 | Agentic Runtime: Cerebrum (LLM planning) + Cerebellum (PX4 control) + 10 hard skills + 5 soft skills + 4-layer memory + ROS 2 bridge |
| `morphology/` | 8 | ~2,300 | Morphology Engine: DroneDesign DSL · NSGA-II via DEAP · PhysicsSurrogate (BEMT) · co-design · CadQuery CAD generation · ASCII viz |
| `studio/` | 6 | ~3,300 | Next.js 15 web app with Agent, Design, and Flight pages |
| `tests/` | 16 | ~4,000 | 378 tests across all modules |
| `docs/` | 5 | ~1,500 | Manifesto · Architecture v2.0 · Roadmap · Hardware BOM · Pipeline flow |

---

## 🛠️ Tool Stack

Cada herramienta acá abajo es un proyecto open-source real de GitHub. Nada inventado.

| Tool | GitHub | Stars | License | What we use it for |
|------|--------|-------|---------|-------------------|
| **Typer** | [fastapi/typer](https://github.com/fastapi/typer) | ⭐19.5K | MIT | CLI framework — auto-help, type hints, subcommands. By the creator of FastAPI. |
| **Rich** | [textualize/rich](https://github.com/textualize/rich) | ⭐56.6K | MIT | Terminal formatting — tables, progress bars, colours, prompts, markdown. |
| **Pydantic** | [pydantic/pydantic](https://github.com/pydantic/pydantic) | ⭐22K+ | MIT | Data validation via Python type hints. Used for `PhaseResult`, configs. |
| **DEAP** | [DEAP/deap](https://github.com/DEAP/deap) | ⭐6.4K | LGPL-3.0 | Evolutionary computation framework — NSGA-II multi-objective optimisation. |
| **CadQuery** | [CadQuery/cadquery](https://github.com/CadQuery/cadquery) | ⭐5.3K | Apache-2.0 | Parametric 3D CAD for Python — generates STEP/STL for 3D printing (Fase 2). |
| **PX4** | [PX4/PX4-Autopilot](https://github.com/PX4/PX4-Autopilot) | ⭐12K | BSD-3 | Open-source autopilot — runs on Pixhawk, SITL simulation, MAVLink. |
| **Gazebo** | [gazebosim/gz-sim](https://github.com/gazebosim/gz-sim) | ⭐2.5K | Apache-2.0 | Physics simulation — sensor modelling, dynamics, world environments. |
| **ArduPilot Gazebo** | [ArduPilot/ardupilot_gazebo](https://github.com/ArduPilot/ardupilot_gazebo) | ⭐500+ | GPL-3.0 | Official Gazebo plugin for ArduPilot SITL — Iris, Zephyr, custom models. |
| **Next.js** | [vercel/next.js](https://github.com/vercel/next.js) | ⭐130K | MIT | React framework for the Studio web app (App Router, Server Components). |
| **MAVSDK** | [mavlink/MAVSDK](https://github.com/mavlink/MAVSDK) | ⭐2.2K | BSD-3 | MAVLink SDK for drone control — telemetry, mission, action. |
| **uv** | [astral-sh/uv](https://github.com/astral-sh/uv) | ⭐45K+ | Apache-2.0 | Python package manager — 10-100x faster than pip. |

### Upcoming (Fase 2+)

| Tool | GitHub | Stars | When |
|------|--------|-------|------|
| **ROS 2 Humble** | [ros2/ros2](https://github.com/ros2/ros2) | ⭐8K+ | Fase 2 — Gazebo integration |
| **Llama.cpp** | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | ⭐76K+ | Fase 3 — On-device LLM on Jetson |
| **Textual** | [textualize/textual](https://github.com/textualize/textual) | ⭐27K+ | Future — TUI dashboard |
| **ChromaDB** | [chroma-core/chroma](https://github.com/chroma-core/chroma) | ⭐17K+ | Future — vector memory search |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.10+ and uv (fast package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Install & run

```bash
# Clone and enter
git clone https://github.com/your-org/andinodronelab.git
cd andinodronelab

# Install deps (—dev includes pytest)
uv sync --dev

# Run the full SDD pipeline — one command
uv run andino pipeline "Quadcopter for tunnel inspection at 4000m, 500g payload" --yes

# Or step by step
uv run andino init --name "Mi Dron" --description "Inspection drone"
uv run andino explore "Survey mission at 4000m altitude" --yes
uv run andino propose --payload 500 --altitude 4000 --yes
uv run andino spec --yes
uv run andino design --yes
uv run andino simulate --yes
uv run andino build --yes
uv run andino fly --yes
uv run andino verify --yes
uv run andino archive --yes

# Status dashboard
uv run andino status
```

### Use the Python API

```python
from morphology.engine import MorphologyEngine

engine = MorphologyEngine()
result = engine.evolve({"min_payload_g": 500, "target_altitude_m": 4000})
print(result.summary())
best = result.best_designs[0]
print(f"Best: {best.frame_type}, AUW: {best.auw}g, TWR: {best.twr}")
```

### Run tests

```bash
uv run pytest tests/ -q --tb=short -m "not slow"
# 378 tests pass
```

---

## ⚙️ 9 SDD Phases

```
Explore → Propose → Spec → Design → Simulate → Build → Fly → Verify → Archive
   ↑                                                                      │
   └────────────────── Continuous improvement loop ────────────────────────┘
```

| # | Phase | What happens | Data output |
|---|-------|-------------|-------------|
| 1 | **explore** | Analyse mission: altitude, payload, environment, constraints | `mission_analysis` |
| 2 | **propose** | AI generates 3–5 concepts with tradeoffs | `design_proposals` |
| 3 | **spec** | Engineering spec: battery sizing, propulsion, TWR targets | `design_spec` |
| 4 | **design** | NSGA-II evolution → Pareto front → best designs | `design_result` |
| 5 | **simulate** | Physics simulation: hover power, flight time, stability | `simulation_results` |
| 6 | **build** | BOM generation with costs, tools, assembly steps | `build_artifacts` |
| 7 | **fly** | AgenticRuntime: plan → execute → reflect (or simulated) | `flight_result` |
| 8 | **verify** | Pass/fail vs. requirements → verdict | `verification_report` |
| 9 | **archive** | Save to MemoryStore → pipeline report | `archive_ref` |

---

## 🧪 Test Suite

```
Module                Tests
──────────────────────────────────────
orchestrator/engine      43  ✅
orchestrator/pipeline    24  ✅
orchestrator/cli         25  ✅
orchestrator/models      20  ✅
orchestrator/skills      25  ✅
orchestrator/project     25  ✅
orchestrator/memory      19  ✅
morphology/design        66  ✅
morphology/evolution     30  ✅
agent/cerebellum         60  ✅
agent/cerebrum           35  ✅
agent/memory             30  ✅
agent/skills             30  ✅
──────────────────────────────────────
Total                   378  ✅
```

---

## 🗺️ Roadmap

```
Fundación:  ████████████████████████░  90%  ← YOU ARE HERE
Evolución:  ░░░░░░░░░░░░░░░░░░░░░░░   0%
Vuelo:      ░░░░░░░░░░░░░░░░░░░░░░░   0%
Escala:     ░░░░░░░░░░░░░░░░░░░░░░░   0%
Global:     ██████░░░░░░░░░░░░░░░░░  23%
```

| Phase | Timeline | Goal |
|-------|----------|------|
| **F1: Foundation** | Months 1–3 | ✅ CLI, pipeline, morphology, agent, studio, 378 tests |
| **F2: Evolution** | Months 4–6 | 🔄 Gazebo SITL, autonomous morphology loop, CadQuery CAD |
| **F3: Flight** | Months 7–9 | Hardware: Jetson + PX4 + T-Motor, runtime onboard |
| **F4: Scale** | Months 10–12 | Fleet, shared memory, autonomous evolution, web UI |

Full details → [docs/roadmap.md](docs/roadmap.md)

---

## 🌄 Target Application

Mining drones for the Peruvian Andes (3000–5000 m):

- Tunnel and open-pit inspection
- Light cargo delivery at camps
- 3D mapping of advance fronts
- Slope stability monitoring
- Asset and personnel tracking

> At 4000 m, available thrust drops ~30 %. Extreme conditions demand intelligent design — there's no margin for error. That's why we evolve before building.

---

## 📄 License

MIT — Build, evolve, fly. Credit where it's due.

---

*Built with [Typer](https://typer.tiangolo.com/), [Rich](https://rich.readthedocs.io/), [DEAP](https://deap.readthedocs.io/), [CadQuery](https://cadquery.org/), and way too much ☕.*
