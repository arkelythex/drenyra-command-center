# Andino Agentic Morpholab — System Architecture

> *Agentic AI platform for drone engineering. Spec-Driven Drone Evolution.*
> *Design. Build. Fly. Remember.*

---

## 1. System Overview

```ascii
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                             ANDINO STUDIO (Web UI)                                   │
│                                                                                      │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │   Agent Window   │ │   Design Mode    │ │  Morphology Lab  │ │ Flight Dashboard │ │
│  │  (Orchestrator)   │ │  (3D Editor)     │ │  (Evolution)     │ │  (Telemetry + AI) │ │
│  │  • Phase cards   │ │  • AI-generated   │ │  • Side-by-side  │ │  • Live video    │ │
│  │  • Agent status  │ │  • Drag & adjust  │ │  • Radar charts  │ │  • AI reasoning  │ │
│  │  • Chat interface │ │  • Live metrics   │ │  • Lineage tree  │ │  • Mission state │ │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘ │
└───────────┼────────────────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │                    │
┌───────────▼────────────────────▼────────────────────▼────────────────────▼────────────┐
│                              ANDINO CORE (Agentic Backend)                             │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        AGENTIC ORCHESTRATOR (Python)                              │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │  SDD Engine   │  │Phase Executor│  │Skill Registry│  │   Model Router       │  │  │
│  │  │  (state       │  │• Phase deps  │  │• Hard skills │  │  • Explore: cheap    │  │  │
│  │  │   machine)    │  │• I/O gates   │  │• Soft skills │  │  • Design: powerful  │  │  │
│  │  │               │  │• Verify gate │  │• MCP plugins │  │  • Fallback chain    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          PERSISTENT MEMORY (Engram-style)                         │  │
│  │                                                                                   │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │  │
│  │  │  Design Memory  │  │Flight Episodic │  │  Skill Library │  │  World Model      │  │  │
│  │  │  • Morphologies │  │ • Flight logs  │  │ • Hard skills  │  │ • Terrain maps    │  │  │
│  │  │  • Specs        │  │ • Telemetry    │  │ • Soft skills  │  │ • Wind models     │  │  │
│  │  │  • CAD files    │  │ • Failures     │  │ • Composed     │  │ • Obstacle DB     │  │  │
│  │  │  • Simulation   │  │ • Edge cases   │  │ • Learned      │  │ • Regulatory      │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          MORPHOLOGY ENGINE (Evolution + AI)                        │  │
│  │                                                                                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐  │  │
│  │  │    Evolutionary   │  │   Transformer    │  │    Co-Design     │  │  CAD Gen   │  │  │
│  │  │    Optimizer      │  │   Surrogate      │  │  (BodyGen RL)    │  │  (CadQuery)│  │  │
│  │  │  • NSGA-II        │  │ • Performance    │  │ • Morph+control  │  │ • Parametric│  │  │
│  │  │  • CMA-ES         │  │   predictor      │  │ • Reward shaping │  │ • STEP/STL  │  │  │
│  │  │  • Multi-objective│  │ • Token encoder  │  │ • Curriculum     │  │ • BOM gen   │  │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
            │                    │                    │                    │
┌───────────▼────────────────────▼────────────────────▼────────────────────▼────────────┐
│                              AGENTIC DRONE RUNTIME                                      │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          ONBOARD AGENT (NVIDIA Jetson)                             │  │
│  │                                                                                   │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │  │
│  │  │   CEREBRUM      │  │  4-Layer Memory │  │   Skills Lib   │  │   ROSchain       │  │  │
│  │  │  (LLM on edge)  │  │  • Working     │  │  • Hard: takeoff│  │  (Agent-ROS      │  │  │
│  │  │  • Mission      │  │  • Episodic    │  │    land, hover  │  │   Bridge)        │  │  │
│  │  │    understanding │  │  • Skill       │  │  • Soft: inspect│  │  • Agent actions │  │  │
│  │  │  • Replanning   │  │  • World       │  │    survey, track│  │  • ROS topics    │  │  │
│  │  │  • Self-reflect │  │                │  │    deliver      │  │  • Event stream  │  │  │
│  │  │  • Skill compose│  │                │  │                 │  │                  │  │  │
│  │  └────────┬───────┘  └────────────────┘  └────────────────┘  └────────┬─────────┘  │  │
│  └───────────┼──────────────────────────────────────────────────────────┼──────────────┘  │
│              │                                                          │                  │
│  ┌───────────▼──────────────────────────────────────────────────────────▼──────────────┐  │
│  │                          CEREBELLUM (PX4 + ROS 2)                                    │  │
│  │                                                                                     │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │  │
│  │  │  Flight Control │  │  Sensor Fusion  │  │ Actuator Mgmt  │  │  Safety Layer    │  │  │
│  │  │  • Attitude     │  │  • IMU (3x)    │  │  • PWM/DShot   │  │  • Geofence       │  │  │
│  │  │  • Position     │  │  • GPS (2x)    │  │  • Motor mix   │  │  • Failsafe       │  │  │
│  │  │  • Velocity     │  │  • LiDAR       │  │  • Servo output │  │  • Parachute      │  │  │
│  │  │  • 1kHz loop    │  │  • Optical flow│  │                 │  │  • Watchdog       │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Andino Orchestrator (Gentle AI-inspired)

The orchestrator manages the entire drone engineering lifecycle as an SDD (Spec-Driven Development) pipeline. It is a **state machine** where each phase is a formal skill with defined contracts.

#### Architecture

```python
class Orchestrator:
    """
    Agentic state machine for drone engineering.
    Each phase is a Skill with inputs, outputs, and verification gates.
    """
    phases: OrderedDict[str, Phase] = {
        "explore":  Phase(model="gpt-4o-mini",   next="propose"),
        "propose":  Phase(model="claude-sonnet-4", next="spec"),
        "spec":     Phase(model="claude-sonnet-4", next="design"),
        "design":   Phase(model="claude-opus-4",   next="simulate"),
        "simulate": Phase(model="simulation",     next="build"),
        "build":    Phase(model="claude-sonnet-4", next="fly"),
        "fly":      Phase(model="agentic-runtime", next="verify"),
        "verify":   Phase(model="claude-sonnet-4", next="archive"),
        "archive":  Phase(model="gpt-4o-mini",   next=None),
    }
```

#### Phase Contract

Every phase implements:

```python
@dataclass
class PhaseContract:
    input_schema:  JSONSchema      # What this phase needs
    output_schema: JSONSchema      # What this phase produces
    verify_gate:   Callable        # Validation before transition
    model:         ModelSpec       # Which AI model to use
    timeout:       timedelta       # Max execution time
    retry_policy:  RetryStrategy   # How to handle failure
```

#### Per-Phase Model Routing

| Phase | Model | Rationale |
|-------|-------|-----------|
| Explore | GPT-4o-mini / Claude Haiku | Cheap, fast — broad research |
| Propose | Claude Sonnet 4 | Medium — needs reasoning + variety |
| Spec | Claude Sonnet 4 | Medium — precision matters |
| Design | Claude Opus 4 / DeepSeek-R1 | Powerful — core creativity |
| Simulate | Gazebo + PX4 SITL | Physics engine, not LLM |
| Build | Claude Sonnet 4 | Medium — instructions + BOM |
| Fly | Onboard LLM (Phi-4-mini) | Edge-inference, low latency |
| Verify | Claude Sonnet 4 | Medium — analysis |
| Archive | GPT-4o-mini | Cheap — summarization |

#### Parallel Execution

When phases are independent, the orchestrator spawns parallel sub-agents:

```ascii
Design Phase ────┬──► Evolutionary Optimizer (NSGA-II) ────┐
                 │                                          │
                 ├──► Surrogate Model (Transformer)  ───────┤──► Merge Results
                 │                                          │
                 └──► Co-Design RL (BodyGen) ───────────────┘
```

#### Failure Handling

- **Retry**: Same model, same input (transient errors)
- **Fallback**: Switch to cheaper model (rate limits)
- **Escalate**: Human-in-the-loop for verification failures
- **Archive failure**: The failed attempt itself enters persistent memory

---

### 2.2 Persistent Memory (Engram-style)

Andino's memory is not a database. It's a **knowledge graph** that grows with every project, every flight, every failure.

#### Memory Types

| Type | Content | Storage | Query |
|------|---------|---------|-------|
| **Design Memory** | Morphologies, specs, CAD, simulation results | SQLite + file store | By morphology parameters, mission type, performance |
| **Flight Episodic** | Telemetry logs, flight paths, failures, edge cases | Vector DB (LanceDB) | Semantic search: "times when the drone oscillated at high altitude" |
| **Skill Library** | Hard skills (atomic actions), soft skills (composed strategies), learned behaviors | Compiled policies + metadata | By capability: "autonomous landing on moving platform" |
| **World Model** | Terrain maps, wind patterns, obstacle databases, regulatory info | Geospatial DB + vector | Spatial + semantic queries |

#### Cross-Project Memory

Memory is not project-scoped. When Andino designs a new drone, it queries ALL past projects:

```ascii
"design a drone for tunnel inspection at 4000m"
    │
    ▼
Memory Search ────► Find similar missions ────► "Y6 with collision-tolerant frame"
    │                │                              worked best at 3800m
    │                └──► "X8 had resonance at 60%"
    │                     "Lower rotor stall at low throttle for Y6 at altitude"
    │
    ▼
Design Phase starts with knowledge, not from scratch
```

#### Memory Persistence Flow

```ascii
Every phase output  ──►  Structured observation
                           │
                           ▼
                    Project memory (SQLite)
                           │
                           ▼
                    Global index (cross-project)
                           │
                           ▼
                    Available for future queries
```

---

### 2.3 Morphology Engine

The morphology engine is the heart of drone evolution. It treats design as a **multi-objective search problem** over a parameterized design space.

#### Design Genome

The drone morphology is encoded as a sequence of tokens:

```python
@dataclass
class DroneGenome:
    # Frame
    frame_type: Literal["X", "H", "Y6", "X8", "coaxial_x8", "plus", "V-tail"]
    arm_count: int                          # 4, 6, 8
    arm_angle_deg: float                    # 0-90 degrees from forward
    arm_length_mm: float                    # center-to-motor distance
    frame_material: Literal["CF", "AL", "PLA", "PETG", "Nylon"]

    # Propulsion
    motor_model: str                        # e.g., "MN501S", "MN4116"
    motor_kv: int                           # RPM per volt
    prop_diameter_in: float                 # inches
    prop_pitch_in: float                    # inches
    prop_material: Literal["CF", "plastic", "nylon"]

    # Power
    battery_cells: int                      # 4S, 6S, 12S
    battery_capacity_mah: int
    battery_chemistry: Literal["LiPo", "LiHV", "Li-ion"]

    # Configuration
    motor_spacing_mm: float                 # coaxial distance if applicable
    esc_model: str
    esc_current_a: int

    # Payload (from mission spec)
    estimated_payload_kg: float
    sensor_suite: list[str]

    # Computed
    estimated_weight_kg: float              # from parametric model
    estimated_thrust_kg: float              # from motor+prop model
    estimated_endurance_min: float          # from battery+load model
```

#### Search Space Dimensions

| Parameter | Min | Max | Typical Step |
|-----------|-----|-----|-------------|
| Arm count | 4 | 16 | Even numbers |
| Arm angle | 0° | 90° | 5° |
| Arm length | 200 mm | 1200 mm | 10 mm |
| Prop diameter | 5" | 30" | 1" |
| Battery cells | 3S | 14S | 1S |
| Battery capacity | 5000 mAh | 50000 mAh | 1000 mAh |

Effective search space: **~10^15 possible designs** (enumerated). Evolutionary search finds Pareto-optimal solutions in ~1000 generations of population 100.

#### Evolutionary Optimizer (NSGA-II)

```ascii
Population (100 genomes)
    │
    ▼
Fitness Evaluation ────► Objectives:
    │                       • Maximize payload
    │                       • Maximize endurance
    │                       • Minimize cost
    │                       • Maximize stability index
    │
    ▼
Non-dominated Sorting (Pareto fronts)
    │
    ▼
Crowding Distance Selection
    │
    ▼
Crossover + Mutation ────► New generation
    │
    ▼
Repeat for N generations
    │
    ▼
Pareto front: set of optimal tradeoff designs
```

#### Transformer Surrogate Model

Full CFD/FEM simulation is expensive (~hours per design). The surrogate model predicts performance in **milliseconds**:

```ascii
Genome tokens ──► Embedding ──► Transformer Encoder
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            Thrust predictor  Endurance pred.  Stability pred.
                 │                │                │
                 └────────────────┼────────────────┘
                                  ▼
                          Fitness vector
```

- **Training data**: Initial 1000 designs evaluated via simplified physics model
- **Architecture**: 4-layer Transformer with 8 heads, 512-dim embeddings
- **Fine-tuning**: Active learning — uncertain predictions trigger real simulation
- **Target accuracy**: <5% MAPE on held-out designs

#### Co-Design RL (BodyGen-style)

Morphology and control policy are optimized together:

```ascii
DroneGenome ──► Morphology parameters ──► Physics simulation (simplified)
    │                                              │
    │                    ┌─────────────────────────┘
    ▼                    ▼
Control Policy (MLP) ──► Actuator commands ──► Simulation step
                                                    │
                                                    ▼
                                              Reward:
                                              • Altitude hold
                                              • Energy efficiency
                                              • Disturbance recovery
                                              • Hover precision
                                                    │
                                                    ▼
                                        Policy gradient update
                                        Morphology mutation
```

#### CAD Generation (CadQuery)

Once a design is selected, CAD files are generated from parametric templates:

```ascii
Genome ──► CadQuery parametric script
              │
              ├──► Frame center stack
              ├──► Arm geometry (optimized cross-section)
              ├──► Motor mounts (custom per motor model)
              ├──► Battery tray
              ├──► Landing gear
              └──► Component mounts (FC, Jetson, sensors)
                    │
                    ▼
              STEP files ──► STL (for 3D printing)
              BOM CSV ────► Component list with quantities
              Assembly instructions (AI-generated)
```

---

### 2.4 Agentic Drone Runtime

Every Andino drone is an **embodied AI agent**. The runtime is a two-layer architecture:

#### CEREBRUM (High-Level — LLM on Jetson)

The cerebrum handles everything that requires reasoning:

```ascii
┌─────────────────────────────────────────────┐
│              CEREBRUM (LLM)                  │
│                                             │
│  Inputs:                                    │
│  • Natural language mission from human       │
│  • Telemetry stream from PX4 (via ROSchain) │
│  • Camera frames (detections)               │
│  • Memory queries (past experiences)        │
│                                             │
│  Capabilities:                              │
│  • Mission understanding & decomposition    │
│  • Dynamic replanning (obstacle, weather)   │
│  • Self-reflection (what went wrong, why)   │
│  • Skill composition (combine hard skills)  │
│  • Human comm (explain actions, ask)        │
│  • Memory consolidation (log + learn)       │
│                                             │
│  Model: Phi-4-mini / Llama-3.2-3B, 4-bit   │
│  Hardware: NVIDIA Jetson (Orin NX / AGX)   │
│  Inference: Llama.cpp / ONNX Runtime        │
│  Frequency: ~1-5 Hz (event-driven)         │
└─────────────────────────────────────────────┘
```

#### CEREBELLUM (Low-Level — PX4 + ROS 2)

The cerebellum handles real-time flight:

```ascii
┌─────────────────────────────────────────────┐
│             CEREBELLUM (PX4 + ROS 2)         │
│                                             │
│  Loops:                                     │
│  • 1 kHz: Attitude control (rate + angle)   │
│  • 250 Hz: EKF2 state estimation            │
│  • 50 Hz: Position control + navigation     │
│  • 10 Hz: Sensor fusion (GPS, LiDAR, VO)   │
│                                             │
│  Subsystems:                                │
│  • Flight Control: MC attitude/position     │
│  • Sensor Fusion: EKF2 (triple IMU, dual    │
│    GPS, mag, baro, optical flow, visual     │
│    odometry)                                │
│  • Actuator Management: Motor mixing,       │
│    ESC protocol (DShot/PWM), servo output   │
│  • Safety Layer: Geofence, failsafe         │
│    detection, parachute trigger, watchdog   │
│                                             │
│  Hardware: Holybro Pixhawk 6X/6C           │
│  Firmware: PX4 v1.15+ (custom airframes)   │
│  Bridge: ROSchain (agent ↔ ROS ↔ MAVSDK)   │
└─────────────────────────────────────────────┘
```

#### Skill System

Skills are the API between cerebrum and cerebellum:

```python
@dataclass
class HardSkill:
    """Atomic, indivisible action. Runs on PX4 via ROSchain."""
    name: str                                # "takeoff", "land"
    params: dict                             # {"altitude_m": 10}
    preconditions: list[str]                 # ["motor_armed", "gps_fix"]
    postconditions: list[str]                # ["hovering"]
    timeout_s: float                         # 30
    safety_checks: list[Callable]            # altitude limits, geofence
    fallback: str                            # "land"

@dataclass
class SoftSkill:
    """Composed strategy. Orchestrates hard skills + LLM reasoning."""
    name: str                                # "inspect_tunnel"
    hard_skills: list[HardSkill]             # [hover, navigate, track]
    reasoning_template: PromptTemplate       # How to decide skill sequence
    memory_queries: list[str]                # Past tunnel missions
    human_checkpoints: list[str]             # Points where human confirm required
```

**Hard skills** (implemented on PX4):

| Skill | Description |
|-------|-------------|
| `takeoff` | Throttle ramp to hover at altitude |
| `land` | Descent with ground detection |
| `hover` | Position hold with wind rejection |
| `navigate` | Go to GPS waypoint with obstacle avoidance |
| `return_to_home` | RTL with altitude buffer |
| `track_object` | Follow visual target |
| `orbit` | Circle point at radius |
| `emergency_stop` | Immediate disarm |
| `parachute_deploy` | Trigger parachute mechanism |

**Soft skills** (composed by LLM):

| Skill | Composition |
|-------|-------------|
| `inspect_tunnel` | navigate(entrance) → hover → track(wall) → navigate(along axis) → record(video) → return_to_home |
| `survey_open_pit` | navigate(center) → orbit(radius, speed) → record(pointcloud) → navigate(next_center) → ... |
| `deliver_payload` | takeoff → navigate(waypoints) → hover(drop) → release → return_to_home |
| `thermal_scan` | navigate(grid_pattern) → hover(waypoint) → capture(thermal) → ... → return_to_home |
| `follow_pipeline` | navigate(start) → track(feature) → follow(corridor) → return_to_home |

#### 4-Layer Memory

```ascii
┌──────────────────────────────────────────────────────────────┐
│                    WORKING MEMORY                              │
│  Current mission state. Ephemeral. Lost on power-off.         │
│  • Mission plan (waypoints, actions)                          │
│  • Current position, velocity, attitude                        │
│  • Active skill + progress                                     │
│  • Immediate sensor readings                                   │
│  Storage: RAM (Python objects)                                 │
│  Capacity: ~1 MB                                              │
├──────────────────────────────────────────────────────────────┤
│                    EPISODIC MEMORY                              │
│  Past flights. Persistent. Vector searchable.                  │
│  • Flight logs (compressed telemetry)                         │
│  • Failure events (what happened, context, outcome)            │
│  • Edge cases (unusual sensor readings, environmental events)  │
│  • Human feedback (corrections, approvals)                     │
│  Storage: LanceDB (vector embeddings on NVMe)                 │
│  Capacity: 10,000+ flights (256 GB NVMe)                      │
├──────────────────────────────────────────────────────────────┤
│                    SKILL MEMORY                                 │
│  Learned behaviors. Compiled for fast execution.               │
│  • Hard skill parameters (tuned PID gains per config)          │
│  • Soft skill templates (proven sequences)                     │
│  • Learned control policies (from RL training)                 │
│  • Adaptation rules (e.g., "above 4000m, reduce max thrust")  │
│  Storage: ONNX models + SQLite metadata                       │
│  Capacity: 1000+ skills (~1 GB)                                │
├──────────────────────────────────────────────────────────────┤
│                    WORLD MEMORY                                 │
│  Environment model. Shared across projects.                    │
│  • Terrain maps (DEM, satellite imagery)                      │
│  • Wind patterns (historical + real-time)                     │
│  • Obstacle databases (cell towers, power lines)               │
│  • Regulatory zones (no-fly, altitude limits)                  │
│  • Weather models (precipitation, visibility)                  │
│  Storage: Geospatial DB (PostGIS) + tile cache                │
│  Capacity: Regional coverage (~100 GB)                         │
└──────────────────────────────────────────────────────────────┘
```

#### ROSchain (Agent-ROS Bridge)

A bidirectional bridge connecting the LLM agent to ROS 2 and PX4:

```ascii
┌──────────┐          ┌──────────────┐          ┌─────────┐
│ CEREBRUM │◄────────►│   ROSchain    │◄────────►│ ROS 2   │
│  (LLM)   │  Actions │   (Bridge)   │  Topics  │ Nodes   │
│          │  Events  │              │  Services│         │
└──────────┘          └──────┬───────┘          └─────────┘
                             │
                             │ MAVSDK (UART/CAN)
                             │
                      ┌──────▼───────┐
                      │    PX4       │
                      │  (Pixhawk)   │
                      └──────────────┘
```

**ROSchain protocol**:

```python
# Action: Cerebrum → ROS
{
    "action": "navigate",
    "params": {"lat": -16.409, "lon": -71.537, "alt_m": 50},
    "id": "act-001"
}

# Event: ROS → Cerebrum
{
    "event": "obstacle_detected",
    "params": {"distance_m": 15, "bearing_deg": 45, "type": "tower"},
    "source": "/drone_navigation/local_planner",
    "timestamp": 1712345678
}
```

---

### 2.5 Andino Studio (Web UI)

Built with Next.js 15 + Tailwind 4, inspired by Cursor 3.0's agent-first design.

#### Agent Window (Primary Interface)

The default view. Shows the orchestrator's current state:

```ascii
┌──────────────────────────────────────────────────────────────┐
│  Andino Studio — Tunnel Inspection Drone (Project: and-023)  │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Phase: Design (3/9)           │ Model: Claude Opus 4    │ │
│ │ Status: Running ─── 67%       │ Est. time: 2 min 34s   │ │
│ │ Sub-agents:                                          │ │
│ │   ✅ Evolutionary Optimizer — Generation 847/1000       │ │
│ │   🔄 Surrogate Model — Evaluating pareto front (42/156) │ │
│ │   ⏳ Co-Design RL — Waiting for morphology selection    │ │
│ │   ⏳ CAD Gen — Waiting for genome                      │ │
│ │ [Pause] [Cancel] [Request human input]                  │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Agent Chat                                              │ │
│ │                                                          │ │
│ │ Human> Why did you choose Y6 over X8 for this mission?   │ │
│ │                                                          │ │
│ │ Agent> At 4000m, air density is 35% lower than sea       │ │
│ │ level. The Y6 coaxial configuration needs only 6 motors  │ │
│ │ vs X8's 8, reducing total drag by 12% at hover.         │ │
│ │ The thrust-to-weight at this altitude favors Y6 by       │ │
│ │ about 8% based on the propulsion model. However, if     │ │
│ │ payload exceeds 3.5kg, X8 becomes the better choice.    │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Design parameters to adjust?                         │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │ [Send]                                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### Design Mode (3D Canvas)

Three.js-based 3D editor where AI generates and human refines:

- **AI-generated morphology** rendered in real-time
- **Drag-to-adjust** parameters: arm angle, length, motor position
- **Live performance metrics**: thrust, weight, endurance update on drag
- **Split view**: current design vs pareto-optimal variants
- **Export**: one-click CAD generation

#### Morphology Lab

Side-by-side comparison of evolved designs:

```ascii
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Design A     │  │ Design B     │  │ Design C     │
│ Y6, 650mm    │  │ X8, 810mm    │  │ V-tail quad  │
│ 25 min end.  │  │ 37 min end.  │  │ 18 min end.  │
│ 3.0 kg payl. │  │ 6.4 kg payl. │  │ 1.2 kg payl. │
│ ┌─────────┐  │  │ ┌─────────┐  │  │ ┌─────────┐  │
│ │ Radar   │  │  │ │ Radar   │  │  │ │ Radar   │  │
│ └─────────┘  │  │ └─────────┘  │  │ └─────────┘  │
│ [Select]     │  │ [Select]     │  │ [Select]     │
└─────────────┘  └─────────────┘  └─────────────┘
         │ Lineage tree (evolution path)
         ▼
┌──────────────────────────────────────┐
│ Gen 1 → Gen 10 → Gen 100 → Gen 847  │
│ (Fitness trajectory over generations) │
└──────────────────────────────────────┘
```

#### Flight Dashboard

Real-time telemetry with AI reasoning overlay:

```ascii
┌──────────────────────────────────────┬──────────────────────────┐
│ Live Video (AI annotations)          │ Agent Reasoning           │
│ ┌────────────────────────────────┐   │                           │
│ │                                │   │ "I see an obstacle 45m   │
│ │     [OBSTACLE DETECTED]        │   │ ahead. Reducing speed    │
│ │     Tower 45m ahead           │   │ from 12 to 6 m/s and     │
│ │     ████░░░░░░░░░░░░░ 60%     │   │ adjusting altitude by    │
│ │                                │   │ 8m to clear it.         │
│ │                                │   │ Continuing on mission."  │
│ └────────────────────────────────┘   │                           │
├──────────────────────────────────────┤                           │
│ Telemetry                            │                           │
│ Speed: 12 m/s   Alt: 47 m AGL       │                           │
│ Battery: 72%    Est. remaining: 14m │                           │
│ Wind: 8 m/s @ 230°  GPS: 20 sats   │ [Interrupt] [Approve]     │
└──────────────────────────────────────┴──────────────────────────┘
```

#### Marketplace (MCP Plugin System)

Extend the platform via MCP-compatible plugins:

| Plugin Type | Examples |
|-------------|----------|
| **Sensors** | Thermal camera, multispectral, LiDAR, gas detector, magnetometer |
| **Payloads** | Gripper, sprayer, dropper, speaker, spotlight |
| **AI Models** | Custom detector, terrain classifier, anomaly detector |
| **Simulation** | Custom environment, wind model, failure injector |
| **Export** | STEP, STL, URDF, PX4 params, ROS 2 package |

---

## 3. Data Flow

### 3.1 End-to-End Lifecycle

```ascii
Human Intent ──► Orchestrator ──► Morphology Engine ──► CAD ──► 3D Print
                                     │                             │
                                     │                             ▼
                                     │                    Build + Assemble
                                     │                             │
                                     │                             ▼
                                     └────────────────► Onboard Agent (Cerebrum)
                                                                │
                                                                ▼
                                                          PX4 (Cerebellum)
                                                                │
                                                                ▼
                                                           Drone Flies
                                                                │
                                                                ▼
                                                     Flight Data → Memory
                                                                │
                                                                ▼
                                                     Verification Report
                                                                │
                                                                ▼
                                                     Archive → Next iteration
```

### 3.2 Phase Data Flow

```ascii
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Explore   │────►│  Propose   │────►│   Spec     │
│  (doc)     │     │  (3-5      │     │  (formal   │
│            │     │   designs) │     │   spec)    │
└────────────┘     └────────────┘     └────────────┘
                                          │
                                          ▼
                                     ┌────────────┐
                                     │   Design   │
                                     │  (genome + │
                                     │  CAD files)│
                                     └────────────┘
                                          │
                                          ▼
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Archive   │◄────│  Verify    │◄────│  Simulate  │
│  (memory)  │     │ (report)   │     │ (validation)│
└────────────┘     └────────────┘     └────────────┘
                        │
                        ▼
                   ┌────────────┐
                   │    Fly     │
                   │ (onboard)  │
                   │            │
                   │   Build    │────► 3D Printer
                   │ (prepare)  │
                   └────────────┘
```

### 3.3 Memory Integration

Data flows INTO memory at every phase and OUT of memory for every decision:

```ascii
┌──────────┐    Memory OUT ────────► "Has this been tried before?"
│ Decision │                            │
│ Point   │◄──────────────────── Memory IN
│         │    "Store what we learned"  │
└──────────┘                            │
                                        ▼
                                 ┌──────────────┐
                                 │   Memory DB   │
                                 │  (SQLite +    │
                                 │   LanceDB)    │
                                 └──────────────┘
                                        │
                                        ▼
                              Cross-project queries
```

---

## 4. Technology Stack

```ascii
Layer                    Technology
────────────────────────────────────────────────────────────────────
Orchestrator             Python 3.12 (async, FastAPI)
Phase State Machine      Python + SQLite (phase manager)
Model Router             LiteLLM (multi-provider abstraction)
                         ├─ OpenAI (GPT-4o, GPT-4o-mini)
                         ├─ Anthropic (Claude Opus 4, Sonnet 4)
                         └─ Local (Ollama, Llama.cpp)

Web UI                   Next.js 15 + Tailwind 4
3D Canvas                Three.js / React Three Fiber
State Management         Zustand 5

Memory Base              SQLite (structured)
Vector Memory            LanceDB (embeddings, n=1024)
Embeddings               text-embedding-3-small / BGE-M3

Morphology Engine
  Evolutionary           DEAP (NSGA-II, CMA-ES)
  Surrogate              PyTorch 2.x (Transformer)
  Co-Design RL           Gymnasium + Stable-Baselines3 (PPO)
  CAD Gen                CadQuery + OpenSCAD

Drone Runtime (Onboard)
  Cerebrum               Llama.cpp / ONNX Runtime
  Model                  Phi-4-mini / Llama-3.2-3B (4-bit)
  Agent-ROS Bridge       ROSchain (Python asyncio)
  Flight Control         PX4 v1.15+ (custom airframes)

Simulation               Gazebo Fortress + PX4 SITL
Physics Backend          PyBullet (fast surrogate)
CFD                      OpenFOAM (final validation)
Structural               CalculiX (FEM)

Data & Storage
  Telemetry              InfluxDB + Grafana (real-time)
  Logs                   ROS bag (MCAP format)
  Build Artifacts        MinIO / S3-compatible
  Geospatial             PostGIS (world model)

CI/CD                    GitHub Actions
Pre-commit               pre-commit + ruff + yamllint
```

---

## 5. Phases Detail (Spec-Driven Drone Engineering)

### 5.1 Explore Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Investigate mission requirements and constraints |
| **AI Model** | GPT-4o-mini (cheap, fast, broad) |
| **Input** | Natural language mission description |
| **Output** | Structured mission analysis document |
| **Timeout** | 5 minutes |
| **Verification Gate** | All required fields populated |

**Activities**:
1. Research mission environment (terrain, altitude, weather patterns)
2. Identify operational constraints (regulatory, safety, logistical)
3. Determine payload requirements (sensors, cameras, computing)
4. Analyze similar missions from memory (cross-project query)
5. Generate mission analysis document

**Output Schema**:
```yaml
mission_analysis:
  environment:
    terrain_type: "tunnel"
    altitude_range_m: [3500, 4200]
    expected_wind_ms: [0, 5]
    temperature_range_c: [-5, 15]
    lighting_conditions: "low_light"
  constraints:
    regulatory: "DGAC Peru — VLOS"
    max_flight_time_min: 25
    max_altitude_agl_m: 100
    safety_requirements: ["geofence", "failsafe_return"]
  payload_requirements:
    sensors:
      - type: "lidar"
        model: "Livox Mid-360"
        weight_g: 965
      - type: "camera"
        model: "OAK-D Pro"
        weight_g: 120
    total_payload_kg: 2.5
  similar_missions:
    - "And-017: Y6 coaxial at 3800m, tunnel inspection — optimized for endurance"
    - "And-012: X8 open-pit survey — overkill for confined space"
```

### 5.2 Propose Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | AI proposes 3-5 drone morphologies with tradeoffs |
| **AI Model** | Claude Sonnet 4 |
| **Input** | Mission analysis document |
| **Output** | Design proposals with performance estimates |
| **Timeout** | 10 minutes |
| **Verification Gate** | At least 3 proposals, each with tradeoff analysis |

**Output Schema**:
```yaml
proposals:
  - id: "prop-001"
    name: "Y6 Tunnel Scout"
    genome:
      frame_type: "Y6"
      arm_count: 6
      arm_length_mm: 480
      motor_model: "MN4116"
      motor_kv: 340
      prop_diameter_in: 16
      battery_cells: 6
      battery_capacity_mah: 22000
    estimated_performance:
      payload_kg: 3.0
      endurance_min: 28
      twr: 2.8
      cost_score: 7.2  # 1-10, lower is cheaper
    tradeoffs:
      pros: ["Best endurance/payload ratio", "Proven at altitude"]
      cons: ["Motor redundancy lower than X8", "Larger than quad for tunnel"]
    confidence: 0.85
  - id: "prop-002"
    # ... more proposals
```

### 5.3 Spec Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Formal engineering specification |
| **AI Model** | Claude Sonnet 4 |
| **Input** | Selected proposal |
| **Output** | Engineering specification document |
| **Timeout** | 10 minutes |
| **Verification Gate** | Internal consistency checks pass |

**Output Includes**:
- Mass budget (component-level)
- Thrust requirements (hover, climb, emergency)
- TWR targets (minimum, target, maximum)
- Component selections with rationale
- Wiring diagram specification
- PX4 parameter ranges

### 5.4 Design Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Generative design + co-optimization |
| **AI Model** | Claude Opus 4 (orchestration) + NSGA-II + Transformer + RL |
| **Input** | Engineering specification |
| **Output** | 3D-printable CAD files + PX4 parameters |
| **Timeout** | 60 minutes (can be extended) |
| **Verification Gate** | CAD files pass basic integrity checks |

**Sub-phases**:
1. **Evolutionary search** (NSGA-II, 1000 generations, population 100)
2. **Surrogate evaluation** (Transformer predicts top 5% designs)
3. **Full simulation** (PyBullet for top 10 designs)
4. **Co-design RL** (optimize control policy for best morphology)
5. **CAD generation** (CadQuery from genome parameters)
6. **BOM generation** (component list with quantities)
7. **PX4 parameter derivation** (airframe config, PID gains)

### 5.5 Simulate Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Multi-physics validation |
| **AI Model** | Gazebo + PX4 SITL + physics solvers |
| **Input** | Design files + PX4 parameters |
| **Output** | Validation report |
| **Timeout** | 120 minutes |
| **Verification Gate** | All pass/fail criteria met |

**Validation Stages**:
1. **Propulsion**: Thrust stand simulation (motor + prop efficiency curves)
2. **Structural**: FEM analysis (arm stress, frame vibration modes)
3. **Control**: PX4 SITL (step response, disturbance rejection, trajectory following)
4. **Mission**: Gazebo full simulation (complete mission in simulated environment)
5. **Edge cases**: Motor failure, wind gust, GPS loss, sensor failure

### 5.6 Build Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Generate build artifacts |
| **AI Model** | Claude Sonnet 4 |
| **Input** | Validated design files |
| **Output** | Build package |
| **Timeout** | 15 minutes |
| **Verification Gate** | BOM matches CAD quantities |

**Output**:
- 3D-printable STL files (frame, mounts, carriers)
- STEP files (for CNC alternatives)
- BOM CSV (component, quantity, source, price)
- Assembly instructions (AI-generated with diagrams)
- Wiring diagram
- PX4 parameter file (ready to upload)
- Calibration checklist

### 5.7 Fly Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Autonomous flight with agentic runtime |
| **AI Model** | Onboard LLM (Phi-4-mini) |
| **Input** | Built drone + mission specification |
| **Output** | Flight data + mission report |
| **Verification Gate** | Human decides when to fly |

**Runtime Architecture**:
```ascii
Mission Plan ──► Cerebrum (LLM) ──► Skill Composition
                                        │
                                        ▼
                                ROSchain Actions
                                        │
                                        ▼
                                PX4 Executes
                                        │
                                        ▼
                                Telemetry → Cerebrum
                                        │
                                        ▼
                        Replan? ←──── Assess
                                        │
                                     No ──► Continue
                                        │
                                     Yes ──► New Plan
```

### 5.8 Verify Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Compare actual vs predicted performance |
| **AI Model** | Claude Sonnet 4 |
| **Input** | Flight data + simulation predictions |
| **Output** | Verification report |
| **Timeout** | 15 minutes |
| **Verification Gate** | Discrepancies identified and recorded |

**Comparison Metrics**:
- Endurance: actual vs predicted
- Thrust: actual (from telemetry) vs predicted
- Stability: oscillation amplitude vs simulation
- Sensor accuracy: noise levels vs spec
- Failures: encountered vs anticipated

### 5.9 Archive Phase

| Attribute | Value |
|-----------|-------|
| **Purpose** | Everything into persistent memory |
| **AI Model** | GPT-4o-mini |
| **Input** | All phase outputs |
| **Output** | Archived design in global library |
| **Timeout** | 5 minutes |
| **Verification Gate** | All artifacts stored, indexes updated |

**Stored Artifacts**:
- Full genome + CAD files → Design Memory
- Flight logs → Episodic Memory
- Verification discrepancies → cross-project learnings
- Human feedback → preference model
- Skills used → Skill Library

---

## 6. Scaling Architecture

```ascii
                    ┌───────────────────────────┐
                    │   SINGLE PROJECT           │
                    │                           │
                    │  One drone designed by AI  │
                    │  for one mission           │
                    │  ~2 hours from intent to   │
                    │  validated design          │
                    └───────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────┐
                    │   MULTI-PROJECT            │
                    │                           │
                    │  Ten drones for different │
                    │  missions, sharing memory  │
                    │  Designs borrow from each  │
                    │  other's successes/failures│
                    └───────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────┐
                    │   FLEET DESIGN             │
                    │                           │
                    │  100+ drones designed for  │
                    │  coordinated operations    │
                    │  Platform optimizes fleet  │
                    │  composition (mix of types) │
                    └───────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────┐
                    │   AUTONOMOUS EVOLUTION     │
                    │                           │
                    │  Platform evolves its own  │
                    │  design algorithms         │
                    │  Discovers better search   │
                    │  strategies, surrogates,   │
                    │  fabrication methods       │
                    └───────────────────────────┘
```

---

## 7. API Surface

### 7.1 Orchestrator API (REST)

```yaml
POST   /api/v1/projects                     # Create new project
GET    /api/v1/projects/{id}                # Get project status
POST   /api/v1/projects/{id}/start          # Start SDD pipeline
POST   /api/v1/projects/{id}/phase/{phase}  # Execute single phase
GET    /api/v1/projects/{id}/phase/{phase}  # Get phase status
POST   /api/v1/projects/{id}/input          # Provide human input
GET    /api/v1/projects/{id}/artifacts      # List all artifacts
GET    /api/v1/memory/search                # Query persistent memory
POST   /api/v1/memory/ingest               # Manual memory injection
GET    /api/v1/models                       # List available models
GET    /api/v1/skills                       # List available skills
POST   /api/v1/skills/register              # Register custom skill
```

### 7.2 Drone Runtime API (WebSocket + gRPC)

```yaml
# Real-time telemetry (WebSocket)
subscribe: /drone/{id}/telemetry            # Position, velocity, attitude
subscribe: /drone/{id}/video                # Camera stream
subscribe: /drone/{id}/reasoning            # AI reasoning trace

# Command (gRPC)
rpc SendMission(MissionPlan) returns (MissionStatus)
rpc ExecuteSkill(SkillCommand) returns (SkillResult)
rpc Interrupt(InterruptRequest) returns (Acknowledge)
rpc GetState(Empty) returns (DroneState)
rpc QueryMemory(MemoryQuery) returns (MemoryResult)
```

### 7.3 MCP Plugin Interface

```python
class AndinoPlugin:
    """Base class for MCP-compatible plugins."""
    
    name: str
    version: str
    type: Literal["sensor", "payload", "ai_model", "simulation", "export"]
    
    async def register(self, orchestrator: Orchestrator) -> None
    async def execute(self, params: dict) -> PluginResult
    async def health_check(self) -> bool
```

---

## 8. Safety & Reliability

### 8.1 Orchestrator Safety

| Risk | Mitigation |
|------|------------|
| AI hallucinates design | Verification gate at every phase, human approval for critical decisions |
| Infinite loop | Phase timeouts, maximum iteration limits, escalation to human |
| Data loss | Every phase output is persisted before next phase starts |
| Model failure | Fallback chain: primary → same class cheaper → secondary provider → human |

### 8.2 Drone Runtime Safety

| Layer | Protection |
|-------|------------|
| **Hardware** | Triple IMU, dual GPS, dual barometer, dual telemetry, parachute |
| **Firmware** | PX4 geofence, failsafe actions, IMU voting, watchdog timer |
| **Runtime** | Cerebrum self-checks (is the LLM reasoning coherent?), skills have pre/post conditions |
| **Human** | Interrupt button, manual RC override, telemetry heartbeat, video feed |

### 8.3 Design Safety

| Risk | Mitigation |
|------|------------|
| Unstable design | Stability index in fitness function — only stable designs survive |
| Structural failure | FEM validation stage, safety factor > 2.0 |
| Motor overcurrent | ESC rating must be 20% above estimated peak current |
| Battery sag | Voltage drop model checks minimum voltage under load |

---

## 9. Development Roadmap

### Phase 1: Foundation (Months 1–4)

| Milestone | Deliverable |
|-----------|-------------|
| P1.1 | Andino Orchestrator — SDD state machine + memory integration |
| P1.2 | Andino Studio — Agent Window + project management |
| P1.3 | Morphology Engine v1 — DEAP + CadQuery pipeline |
| P1.4 | ROSchain v1 — basic action/event bridge |
| P1.5 | Flying drone hardware (Scout Y6) |

### Phase 2: Intelligence (Months 5–8)

| Milestone | Deliverable |
|-----------|-------------|
| P2.1 | Transformer surrogate model + training pipeline |
| P2.2 | Co-design RL (BodyGen-style) for control policy |
| P2.3 | Onboard LLM integration (Phi-4-mini on Jetson) |
| P2.4 | 4-layer memory system (all types) |
| P2.5 | Skill system (hard + soft skills) |

### Phase 3: Studio (Months 9–12)

| Milestone | Deliverable |
|-----------|-------------|
| P3.1 | Design Mode (3D canvas) |
| P3.2 | Morphology Lab (side-by-side comparison) |
| P3.3 | Flight Dashboard (telemetry + AI overlay) |
| P3.4 | Marketplace (MCP plugin system) |

### Phase 4: Autonomy (Months 13–18)

| Milestone | Deliverable |
|-----------|-------------|
| P4.1 | Cross-project memory querying |
| P4.2 | Multi-drone fleet design |
| P4.3 | Autonomous evolution (platform improves itself) |
| P4.4 | Full Gazebo simulation pipeline |
| P4.5 | Heavy-Lift X8 flight certification |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Cerebrum** | High-level LLM on Jetson — reasoning, planning, self-reflection |
| **Cerebellum** | Low-level PX4 flight controller — stabilization, safety |
| **Co-Design RL** | Reinforcement learning that optimizes morphology and control policy jointly |
| **Design Genome** | Parametric encoding of drone morphology as a sequence of tokens |
| **Design Memory** | Persistent store of all past designs, specs, CAD, and simulation results |
| **Episodic Memory** | Persistent store of past flight experiences (telemetry, failures, edge cases) |
| **Hard Skill** | Atomic, indivisible action (takeoff, land, navigate) |
| **Morphology Engine** | Evolutionary + AI system that searches for optimal drone designs |
| **NSGA-II** | Non-dominated Sorting Genetic Algorithm II — multi-objective evolutionary optimizer |
| **Pareto Front** | Set of optimal tradeoff designs where no objective can be improved without worsening another |
| **ROSchain** | Bidirectional bridge connecting LLM agent to ROS 2 and PX4 |
| **SDD** | Spec-Driven Development — phase-based engineering lifecycle with formal contracts |
| **Skill Memory** | Store of learned behaviors (hard skills, soft skills, control policies) |
| **Soft Skill** | Composed strategy orchestrating multiple hard skills with LLM reasoning |
| **Surrogate Model** | Transformer that predicts drone performance without full simulation |
| **TWR** | Thrust-to-Weight Ratio — available thrust divided by total weight |
| **Working Memory** | Ephemeral store of current mission state (position, plan, active skill) |
| **World Model** | Persistent store of environment knowledge (terrain, wind, obstacles, regulations) |

---

## 11. References

| Resource | URL |
|----------|-----|
| Gentle AI — Spec-Driven Development | https://github.com/Gentleman-Programming/Gentle.AI |
| Cursor 3.0 Agent-First UI | https://cursor.sh |
| OpenAI Codex Agent Loop | https://openai.com/index/introducing-codex-agent/ |
| BodyGen — Morphology Co-Design | https://arxiv.org/abs/2403.12943 |
| AI Designer for UAVs | https://arxiv.org/abs/2306.08987 |
| NSGA-II (DEAP) | https://deap.readthedocs.io/ |
| PX4 Autopilot | https://px4.io/ |
| ROS 2 | https://docs.ros.org/en/rolling/ |
| CadQuery | https://cadquery.readthedocs.io/ |
| LanceDB | https://lancedb.com/ |
| Engram Persistent Memory | https://opencc.ai/ |

---

> **Version**
> | Version | Date | Author | Changes |
> |---------|------|--------|---------|
> | v2.0 | 2026-06-21 | AndinoDroneLab Team | Complete rewrite: agentic AI-first architecture with orchestrator, morphology engine, agentic runtime, and persistent memory |
