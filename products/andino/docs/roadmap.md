# 🧬 AndinoDroneLab — Agentic AI Platform Roadmap

> **Mission**: Construir una plataforma agentic AI-first que evolucione, diseñe, construya y vuele drones autónomos para minería en los Andes — con un loop cerrado de mejora continua.

---

## Fase 1: Fundación 🏗️ (Meses 1-3)
**Estado: 🟢 90% — pipeline end-to-end funcional**

Construir la plataforma base: orquestador, morphology engine, agentic runtime, y studio UI. Sin hardware real — todo corre en simulación.

### Módulos Core

| Módulo | Archivos | Líneas | Estado |
|--------|----------|--------|--------|
| **Andino Orchestrator** | 8 | ~3,500 | ✅ Completo — CLI con 20+ comandos, 9 fases SDD, model routing, memoria de proyecto |
| **Morphology Engine** | 8 | ~2,313 | ✅ Completo — DroneDesign DSL, NSGA-II, surrogate físico, co-diseño, CAD gen, ASCII viz |
| **Agentic Runtime** | 8 | ~2,744 | ✅ Completo — Cerebrum, Cerebellum, 10 hard skills, 5 soft skills, 4-layer memory, ROSchain |
| **Skills System** | 5 | ~1,200 | ✅ Completo — Registry (29 skills), Compiler (topological), Marketplace |
| **Memory System** | 4 | ~800 | ✅ Completo — SQLite+JSON store, EmbeddingEngine, FlightHistory |
| **Andino Studio** | 6 | ~3,354 | ✅ Completo — UI prototypes (Agent Window, Design Mode, Flight Dashboard) |

### Documentación

| Documento | Estado |
|-----------|--------|
| Manifiesto (`docs/manifesto.md`) | ✅ Visión agentic AI, 4 pilares, SDD-for-drones |
| Arquitectura v2.0 (`docs/architecture.md`) | ✅ Diagrama ASCII, 9 fases, per-phase routing |
| Roadmap (`docs/roadmap.md`) | ✅ Actualizado a plataforma agentic |
| Hardware BOM (`docs/hardware/bom.md`) | ➡️ Legacy — referencia histórica |

### Pendientes Fase 1 (completado)

- [x] Pipeline end-to-end: explore → propose → spec → design → simulate → build → fly → verify → archive con datos reales fluyendo entre fases
- [x] Tests del pipeline end-to-end (24 tests, 378 total)
- [x] CLI `andino pipeline` command con auto-init
- [x] Entry point `andino` instalable via pip
- [x] Integración morphology → agent → orchestrator en el pipeline completo
- [x] Deploy del Studio como web app (Next.js 15 + Tailwind 4 + Three.js)
- [x] CI/CD para los módulos Python (lint, test, type-check)

---

## Fase 2: Evolución 🧬 (Meses 4-6)
**Estado: ⏳ No iniciado**

Cerrar el loop morphology: la IA diseña, simula, evalúa y evoluciona drones autónomamente.

### Objetivos

| Objetivo | Descripción |
|----------|-------------|
| **Loop morphology completo** | Explore → Propose → Spec → Design → Simulate → Archive, sin intervención humana |
| **Multi-objetivo real** | NSGA-II con 5 objetivos + Pareto front analysis + sensitivity analysis |
| **Surrogate v1.0** | De physics-based a transformer surrogate entrenado con datos de simulación |
| **Generación CAD real** | Scripts CadQuery que producen STEP/STL listos para impresión 3D |
| **Gazebo integration** | Morphology → URDF → Gazebo SITL → performance metrics → retroalimentación |

### Hitos

| Semana | Hito |
|--------|------|
| 1-2 | Pipeline morphology autónomo sin intervención |
| 3-4 | Surrogate model validado contra Gazebo SITL |
| 5-6 | 100+ generaciones de evolución, Pareto front estable |
| 7-8 | CAD exports + ensamblaje virtual |
| 9-10 | Documentación de diseño evolutivo |
| 11-12 | Demo: "describe una misión → recibe un diseño optimizado" |

---

## Fase 3: Vuelo 🚁 (Meses 7-9)
**Estado: ⏳ No iniciado**

Hardware real: el runtime agentic vuela un dron físico. La IA que diseñó la morfología ahora la pilotea.

### Hardware Target

```
┌─────────────────────────────┐
│  NVIDIA Jetson Orin NX/AGX  │ ← Cerebrum + ROS 2
│  (edge AI, 100 TOPS)        │
├─────────────────────────────┤
│  Pixhawk 6X + PX4           │ ← Cerebellum (control实时)
│  + H-RTK F9P (RTK GPS)      │
├─────────────────────────────┤
│  T-Motor MN501S / U15       │ ← Propulsión
│  + Alpha 60A ESC            │
├─────────────────────────────┤
│  Livox Mid-360 / Ouster     │ ← Percepción
│  OAK-D Pro / ZED X          │
├─────────────────────────────┤
│  RFD900x / 5G               │ ← Telemetría
│  + ESP32 telemetry           │
└─────────────────────────────┘
```

### Hitos

| Semana | Hito |
|--------|------|
| 1-2 | Ensamblaje Scout Y6 + PX4 bringup |
| 3-4 | Jetson + Cerebrum onboard + MAVSDK bridge |
| 5-6 | Hard skills en hardware real (takeoff, land, navigate) |
| 7-8 | Soft skills: survey_open_pit, inspect_tunnel |
| 9-10 | Loop verify: real vs predicción surrogate |
| 11-12 | Demo: diseño evolutivo → build → fly → verify |

### Hardware Budget

| Plataforma | Costo |
|------------|-------|
| Scout Y6 (1.5 kg payload) | ~$6,280 |
| Heavy-Lift X8 (10 kg payload) | ~$12,230 |
| Spares + tools | ~$3,000 |
| **Total** | **~$21,510** |

> Ver BOM legacy en `docs/hardware/bom.md` y `projects/fpv_miner_drone/`

---

## Fase 4: Escala 🌐 (Meses 10-12)
**Estado: ⏳ No iniciado**

Múltiples drones, memoria compartida, evolución autónoma. La plataforma escala de un drone a una flota.

### Objetivos

| Objetivo | Descripción |
|----------|-------------|
| **Flota** | 3+ drones operando coordinadamente, namespaces ROS 2 diferenciados |
| **Memoria compartida** | EpisodicMemory sincronizada entre drones — un aprendizaje sirve a toda la flota |
| **Evolución autónoma** | El sistema detecta gaps de performance y lanza evoluciones sin intervención |
| **Web UI** | Andino Studio como app web real (Next.js 15 + Three.js) |
| **Regulatory** | Guías de cumplimiento ANAC/DGAC/MTC para operaciones mineras |

### Hitos

| Semana | Hito |
|--------|------|
| 1-2 | Multi-drone orchestration (namespaces, deconfliction) |
| 3-4 | Memoria compartida entre drones vía SQLite sync |
| 5-6 | Evolución autónoma gatillada por verify failures |
| 7-8 | Andino Studio web app v1 |
| 9-10 | Demo mining customer: 3 drones, misión coordinada |
| 11-12 | Release open-source + documentación completa |

---

## Gantt Resumen

```
Mes:      1   2   3   4   5   6   7   8   9  10  11  12
F1: Core  [████████████████]
F2: Evol           [████████████████]
F3: Vuel                      [████████████████]
F4: Escala                             [████████████████]
Orch      [████████]                            
Morph     [████████]                            
Agent     [████████]                            
Studio    [████████]                 [████████]
Gazebo          [████████████████]
HW Y6                       [████████]
HW X8                            [████████████]
Flota                                       [████████]
Reg                                              [████]
Release                                              [████]
```

---

## Métricas Clave

| Métrica | F1: Core | F2: Evol | F3: Vuelo | F4: Escala |
|---------|----------|----------|-----------|------------|
| Archivos | 80+ | 100+ | 120+ | 150+ |
| Líneas | 20K+ | 30K+ | 40K+ | 50K+ |
| Tests | — | 50+ | 100+ | 200+ |
| Drones | 0 | 0 | 1-2 | 3+ |
| Evol. gens | — | 100+ | 500+ | 1000+ |
| Misión loop | manual | semi-auto | auto | autónomo |

---

## ⚡ Estado Actual

```
Fundación:  ████████████████████████░  90%
Evolución:  ░░░░░░░░░░░░░░░░░░░░░░░   0%
Vuelo:      ░░░░░░░░░░░░░░░░░░░░░░░   0%
Escala:     ░░░░░░░░░░░░░░░░░░░░░░░   0%
Global:     ██████░░░░░░░░░░░░░░░░░  23%

Próximo: Dockerizar pipeline + Studio, iniciar Fase 2 (Gazebo SITL)
```
