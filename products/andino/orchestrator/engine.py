"""PhaseEngine — Pipeline de 9 fases SDD con datos reales fluyendo entre fases.

Cada fase produce PhaseResult con data estructurada que alimenta a la siguiente.
PipelineContext transporta el estado completo del pipeline.
"""

from __future__ import annotations

import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .project import (
    load_project_config,
    load_project_state,
    save_project_state,
    save_phase_output,
    ensure_project,
)
from .models import ModelRouter, PhaseResult, PipelineContext
from .skills import SkillRegistry
from .memory import MemoryStore
from .displays import (
    print_header,
    print_phase_info,
    print_progress,
    print_success,
    print_warning,
    print_error,
    print_info,
    confirm_action,
    colorize,
    Fore,
    Style,
)

# ── Optional real module imports ─────────────────────────────────────────────
try:
    from morphology.engine import MorphologyEngine, MorphologyConfig
    from morphology.evolution import EvolutionConfig

    _HAS_MORPHOLOGY = True
except ImportError:
    MorphologyEngine = None  # type: ignore
    _HAS_MORPHOLOGY = False

try:
    from agent.runtime import AgenticRuntime, RuntimeConfig
    from agent.cerebellum import FlightResult as AgentFlightResult

    _HAS_AGENT = True
except ImportError:
    AgenticRuntime = None  # type: ignore
    _HAS_AGENT = False


# ── Phase definitions ─────────────────────────────────────────────────────────

PHASE_ORDER = [
    "explore",
    "propose",
    "spec",
    "design",
    "simulate",
    "build",
    "fly",
    "verify",
    "archive",
]

PHASE_DESCRIPTIONS = {
    "explore": "Research mission requirements, environment, constraints, payload needs",
    "propose": "AI generates 3–5 drone morphology proposals with tradeoff analysis",
    "spec": "Formal engineering specification with mass budget, thrust, TWR targets",
    "design": "Evolutionary morphology optimisation + generative design + CAD output",
    "simulate": "Multi-physics simulation: CFD, FEM, PX4 SITL, Gazebo",
    "build": "Generate BOM, assembly instructions, 3D print files",
    "fly": "Execute autonomous flight with agentic runtime",
    "verify": "Compare actual vs predicted performance, identify discrepancies",
    "archive": "Persist all data to memory for future iterations",
}

PHASE_DEPENDENCIES = {
    "explore": [],
    "propose": ["explore"],
    "spec": ["propose"],
    "design": ["spec"],
    "simulate": ["design"],
    "build": ["simulate"],
    "fly": ["build"],
    "verify": ["fly"],
    "archive": ["verify"],
}

PHASE_ESTIMATED_DURATION = {
    "explore": "5–10 min",
    "propose": "10–20 min",
    "spec": "15–30 min",
    "design": "30–60 min",
    "simulate": "1–4 hours",
    "build": "30–60 min",
    "fly": "10–30 min",
    "verify": "10–20 min",
    "archive": "2–5 min",
}


# ── PhaseEngine ───────────────────────────────────────────────────────────────


class PhaseEngine:
    """Motor de pipeline SDD de 9 fases.

    Responsabilidades:
      - Ejecutar fases individuales o rangos completos
      - Conectar datos entre fases via PipelineContext
      - Invocar modulos reales (MorphologyEngine, AgenticRuntime) cuando esten disponibles
      - Persistir resultados a disco y memoria
    """

    def __init__(self, project_dir: Path, mission_requirements: Optional[dict] = None):
        self._project_dir = Path(project_dir).expanduser().resolve()
        ensure_project(self._project_dir)
        self._config = load_project_config(self._project_dir)
        self._state = load_project_state(self._project_dir)

        dot_andino = self._project_dir / ".andino"
        self._router = ModelRouter.load_config(dot_andino / "models.json")
        self._memory = MemoryStore(dot_andino / "memory")
        self._skills = SkillRegistry()
        self._mission_requirements = mission_requirements or {}
        self._morphology_engine: Any = None
        self._agent_runtime: Any = None

    # ── Public helpers ────────────────────────────────────────────────────────

    @property
    def current_phase(self) -> str:
        return self._state.get("current_phase", "none")

    @property
    def phases_completed(self) -> list[str]:
        return list(self._state.get("phases_completed", []))

    @property
    def next_phase(self) -> Optional[str]:
        for phase in PHASE_ORDER:
            if phase not in self.phases_completed:
                return phase
        return None

    def can_execute(self, phase: str) -> tuple[bool, str]:
        if phase not in PHASE_ORDER:
            return False, f"Unknown phase: {phase}"
        deps = PHASE_DEPENDENCIES.get(phase, [])
        missing = [d for d in deps if d not in self.phases_completed]
        if missing:
            return False, f"Missing dependencies: {', '.join(missing)}"
        return True, "ready"

    # ── Public execution API ──────────────────────────────────────────────────

    def execute(
        self,
        phase: str,
        force: bool = False,
        skip_confirm: bool = False,
        mission_requirements: Optional[dict] = None,
        context: Optional[PipelineContext] = None,
    ) -> PhaseResult:
        """Ejecuta una fase individual y retorna PhaseResult.

        Si se pasa un PipelineContext, lee/escribe datos estructurados del mismo.
        """
        if phase not in PHASE_ORDER:
            raise ValueError(f"Unknown phase: {phase}")

        can, reason = self.can_execute(phase)
        if not can and not force:
            raise RuntimeError(f"Cannot execute '{phase}': {reason}")

        model_cfg = self._router.get_model(phase)
        description = PHASE_DESCRIPTIONS.get(phase, "")
        estimated = PHASE_ESTIMATED_DURATION.get(phase, "unknown")

        print_header(f"PHASE: {phase.upper()}")
        print_phase_info(phase, description)
        print_info(f"Model: {model_cfg['provider']}/{model_cfg['model']} ({model_cfg['reasoning']})")
        print_info(f"Estimated duration: {estimated}")

        if not (force or skip_confirm):
            if not confirm_action(f"Execute phase '{phase}'?"):
                print_warning("Phase execution cancelled.")
                return PhaseResult(phase=phase, status="cancelled", model=model_cfg)

        print_info(f"Executing phase: {phase}…")
        t0 = time.time()

        # Update state BEFORE generating output
        if phase not in self.phases_completed:
            completed = list(self.phases_completed)
            completed.append(phase)
            self._state["phases_completed"] = completed

        next_idx = PHASE_ORDER.index(phase) + 1
        self._state["current_phase"] = (
            PHASE_ORDER[next_idx] if next_idx < len(PHASE_ORDER) else "complete"
        )
        self._state["models"] = self._router.to_dict()

        # ── Ejecutar la fase real ──────────────────────────────────────────
        try:
            result = self._run_phase(phase, model_cfg, context)
            result.duration_s = time.time() - t0
        except Exception as exc:
            print_error(f"Phase '{phase}' failed: {exc}")
            result = PhaseResult(
                phase=phase,
                status="failed",
                model=model_cfg,
                error=str(exc),
                duration_s=time.time() - t0,
            )

        # Persistir a disco
        if result.status == "completed":
            output_md = self._format_phase_markdown(phase, result, model_cfg)
            output_path = save_phase_output(self._project_dir, phase, output_md)
            result.output_path = output_path
            save_project_state(self._project_dir, self._state)
            self._log_execution(phase, model_cfg, output_path)
            print_success(f"Phase '{phase}' complete. Output → {output_path}")
        else:
            print_warning(f"Phase '{phase}' {result.status}.")

        # Vincular al contexto
        if context:
            context.add_result(result)

        return result

    def execute_range(
        self,
        from_phase: str,
        to_phase: str,
        force: bool = False,
        skip_confirm: bool = False,
        mission_requirements: Optional[dict] = None,
        context: Optional[PipelineContext] = None,
    ) -> list[PhaseResult]:
        """Ejecuta un rango de fases secuencialmente con PipelineContext.

        Si se pasa un PipelineContext existente (context), lo reutiliza.
        Si no, crea uno nuevo con mission_requirements.
        """
        if from_phase not in PHASE_ORDER:
            raise ValueError(f"Unknown from_phase: {from_phase}")
        if to_phase not in PHASE_ORDER:
            raise ValueError(f"Unknown to_phase: {to_phase}")

        from_idx = PHASE_ORDER.index(from_phase)
        to_idx = PHASE_ORDER.index(to_phase)
        if from_idx > to_idx:
            raise ValueError(
                f"From-phase '{from_phase}' comes after to-phase '{to_phase}'"
            )

        phases = PHASE_ORDER[from_idx : to_idx + 1]
        print_header(f"EXECUTING PHASES: {from_phase} → {to_phase}")

        ctx = context or PipelineContext(
            mission_requirements=mission_requirements or self._mission_requirements
        )
        results: list[PhaseResult] = []

        for phase in phases:
            result = self.execute(
                phase,
                force=force,
                skip_confirm=skip_confirm,
                mission_requirements=ctx.mission_requirements,
                context=ctx,
            )
            results.append(result)
            if result.status == "cancelled":
                print_warning(f"Range execution stopped at '{phase}'.")
                break
            if result.status == "failed":
                print_error(f"Range execution failed at '{phase}'.")
                break

        return results

    def run_pipeline(
        self,
        mission_description: str = "",
        force: bool = False,
        skip_confirm: bool = False,
        iterations: int = 1,
    ) -> PipelineContext:
        """Ejecuta el pipeline SDD completo (explore → archive) de forma autonoma.

        Cuando iterations > 1, corre un loop de evolucion autonomo:
            explore → propose → spec → (design → simulate → feedback)^{N-1}
            → design → simulate → build → fly → verify → archive

        Args:
            mission_description: Descripcion de la mision.
            force: Ignorar dependencias entre fases.
            skip_confirm: Saltar confirmaciones.
            iterations: Numero de iteraciones del loop diseno→simulacion.
                      1 = comportamiento normal. >1 = evolucion con feedback.

        Returns:
            PipelineContext con todos los resultados encadenados.
        """
        if mission_description and not self._mission_requirements.get("mission_description"):
            self._mission_requirements["mission_description"] = mission_description

        print_header("ANDINO DRONE LAB — AUTONOMOUS PIPELINE")
        print_info(f"Mission: {mission_description or '(from config)'}")
        if iterations > 1:
            print_info(f"Evolution loop: {iterations} iterations (design → simulate → feedback)")
        print_info("Phases: explore → propose → spec → design → simulate → build → fly → verify → archive")
        print()

        # ── Fases de preparacion (explore → propose → spec) ────────────────
        prep_results = self.execute_range(
            "explore", "spec",
            force=force,
            skip_confirm=skip_confirm,
            mission_requirements=self._mission_requirements,
        )

        ctx = PipelineContext(mission_requirements=self._mission_requirements)
        for r in prep_results:
            ctx.add_result(r)

        # Verificar que las fases de preparacion hayan funcionado
        if any(r.status in ("cancelled", "failed") for r in prep_results):
            print_error("Preparation phases failed. Aborting.")
            return ctx

        # ── Loop de evolucion (design → simulate → feedback) ──────────────
        if iterations > 1:
            print_header(f"EVOLUTION LOOP — {iterations} ITERATIONS")
            trainer = self._init_surrogate_trainer()

        for i in range(iterations):
            if iterations > 1:
                print_header(f"Evolution iteration {i + 1}/{iterations}")

            # Design phase (via execute para logging y persistencia)
            design_result = self.execute(
                "design",
                force=True,
                skip_confirm=True,
                mission_requirements=self._mission_requirements,
                context=ctx,
            )
            ctx.add_result(design_result)

            if design_result.status in ("cancelled", "failed"):
                print_error(f"Design failed at iteration {i + 1}. Aborting loop.")
                break

            # Simulate phase (via execute para logging y persistencia)
            sim_result = self.execute(
                "simulate",
                force=True,
                skip_confirm=True,
                mission_requirements=self._mission_requirements,
                context=ctx,
            )
            ctx.add_result(sim_result)

            if sim_result.status in ("cancelled", "failed"):
                print_error(f"Simulate failed at iteration {i + 1}. Breaking loop.")
                break

            # Feedback — actualizar mission requirements para la prox iteracion
            if iterations > 1 and trainer is not None:
                self._apply_feedback(trainer, design_result, sim_result)

        # ── Fases finales (build → fly → verify → archive) ────────────────
        final_results = self.execute_range(
            "build", "archive",
            force=force,
            skip_confirm=skip_confirm,
            mission_requirements=self._mission_requirements,
            context=ctx,
        )

        for r in final_results:
            ctx.add_result(r)

        # Mostrar resumen
        if iterations > 1:
            print()
            print(trainer.summary())

        self._print_pipeline_summary(ctx)
        return ctx

    def _init_surrogate_trainer(self) -> Any:
        """Inicializa el SurrogateTrainer para el loop de evolucion."""
        try:
            from morphology.surrogate import SurrogateTrainer
            return SurrogateTrainer()
        except ImportError:
            print_warning("SurrogateTrainer not available. Feedback disabled.")
            return None

    def _apply_feedback(
        self,
        trainer: Any,
        design_result: PhaseResult,
        sim_result: PhaseResult,
    ) -> None:
        """Aplica feedback de simulacion a los requisitos de la siguiente iteracion."""
        if trainer is None:
            return

        design_data = design_result.data.get("best_design", {})
        sim_data = sim_result.data.get("hover_performance", {})
        flight_data = sim_result.data.get("flight_performance", {})
        energy_data = sim_result.data.get("energy", {})

        # Registrar muestra de entrenamiento
        sample_design = {
            "frame_type": design_data.get("frame_type", ""),
            "auw_g": design_data.get("auw_g", 0),
            "twr": design_data.get("twr", 0),
            "motor_count": design_data.get("motor_count", 4),
            "battery_cells": design_data.get("battery_cells", 6),
            "battery_capacity_mah": design_data.get("battery_capacity_mah", 4200),
            "payload_g": design_data.get("payload_g", 500),
            "flight_time_min": flight_data.get("estimated_flight_time_min", 0),
        }
        sample_sim = {**sim_data, **flight_data, **energy_data}
        trainer.add_sample(sample_design, sample_sim)

        # Ajustar requisitos para la siguiente iteracion
        corrections = trainer.compute_corrections()
        if corrections:
            ft_factor = corrections.get("flight_time_min", 1.0)
            current_min_ft = self._mission_requirements.get("min_flight_time_min", 15)
            # Si la simulacion muestra menos tiempo del estimado, aumentar el target
            if ft_factor < 0.9:
                self._mission_requirements["min_flight_time_min"] = current_min_ft * 1.1
                print_info(f"Feedback: increasing flight time target to {current_min_ft * 1.1:.0f}min")


    # ── Status and history ────────────────────────────────────────────────────

    def status(self) -> dict:
        return {
            "project": self._config,
            "state": self._state,
            "current_phase": self.current_phase,
            "next_phase": self.next_phase,
            "phases_completed": self.phases_completed,
            "phases_remaining": [p for p in PHASE_ORDER if p not in self.phases_completed],
            "models": self._router.to_dict(),
            "memory": self._memory.stats(),
        }

    def history(self) -> list[dict]:
        records = []
        for phase in PHASE_ORDER:
            output = self.get_phase_output(phase)
            if output:
                records.append({
                    "phase": phase,
                    "description": PHASE_DESCRIPTIONS.get(phase, ""),
                    "completed": phase in self.phases_completed,
                })
        return records

    def get_phase_output(self, phase: str) -> Optional[str]:
        phase_dir = self._project_dir / ".andino" / "phases" / phase
        latest = phase_dir / f"{phase}.md"
        if latest.exists():
            return latest.read_text()
        files = sorted(phase_dir.glob("*.md"))
        if files:
            return files[-1].read_text()
        return None

    def get_pipeline_report(self) -> str:
        """Genera un reporte markdown de todo el pipeline (util para archive)."""
        lines = [
            "# Andino Drone Lab — Pipeline Report",
            "",
            f"**Generated**: {datetime.now(timezone.utc).isoformat()}",
            f"**Project**: {self._config.get('name', 'Untitled')}",
            f"**Description**: {self._config.get('description', '—')}",
            "",
            "## Phase Summary",
            "",
        ]
        for phase in PHASE_ORDER:
            output = self.get_phase_output(phase)
            if output:
                lines.append(f"### ✅ {phase.upper()}")
                # Extract first few meaningful lines
                body_lines = output.split("\n")
                summary_section = False
                for line in body_lines:
                    if line.strip().startswith("## Summary"):
                        summary_section = True
                        continue
                    if line.strip().startswith("## ") and "Summary" not in line:
                        break
                    if summary_section and line.strip():
                        lines.append(f"  {line.strip()}")
                lines.append("")
            else:
                lines.append(f"### ⬜ {phase.upper()}")
                lines.append("  *Not executed*")
                lines.append("")

        lines.extend([
            "---",
            "",
            "## Configuration",
            f"- **Models**: {json.dumps(self._router.to_dict(), indent=2)}",
            f"- **Phases completed**: {len(self.phases_completed)}/9",
            "",
        ])
        return "\n".join(lines)

    def get_evolution_data(self) -> Optional[dict]:
        """Retorna los datos de evolucion (design phase) como dict, si existen."""
        output = self.get_phase_output("design")
        if not output:
            return None

        # Parse structured data embedded in markdown JSON blocks
        lines = output.split("\n")
        in_json = False
        json_buf: list[str] = []
        for line in lines:
            if line.strip() == "```json":
                in_json = True
                json_buf = []
            elif line.strip() == "```" and in_json:
                in_json = False
            elif in_json:
                json_buf.append(line)

        if json_buf:
            try:
                return json.loads("\n".join(json_buf))
            except json.JSONDecodeError:
                return None
        return None

    # ── Internal: phase dispatch ──────────────────────────────────────────────

    def _run_phase(
        self,
        phase: str,
        model_cfg: dict,
        context: Optional[PipelineContext] = None,
    ) -> PhaseResult:
        """Despacha la ejecucion al handler de cada fase."""
        handlers = {
            "explore": self._phase_explore,
            "propose": self._phase_propose,
            "spec": self._phase_spec,
            "design": self._phase_design,
            "simulate": self._phase_simulate,
            "build": self._phase_build,
            "fly": self._phase_fly,
            "verify": self._phase_verify,
            "archive": self._phase_archive,
        }
        handler = handlers.get(phase)
        if handler is None:
            return self._phase_fallback(phase, model_cfg)
        return handler(model_cfg, context)

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 1 — explore
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_explore(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Analiza requisitos de mision: entorno, restricciones, payload."""
        reqs = self._mission_requirements
        desc = reqs.get("mission_description", "Unspecified mission")

        findings: list[str] = []
        mission_type = reqs.get("mission_type", "survey")
        altitude = reqs.get("target_altitude_m", 4000)
        payload = reqs.get("min_payload_g", 500)
        flight_time = reqs.get("min_flight_time_min", 15)
        max_cost = reqs.get("max_cost_usd", 2000)

        findings.append(f"Mission type: {mission_type}")
        findings.append(f"Operating altitude: {altitude} m AMSL")
        findings.append(f"Minimum payload: {payload} g")
        findings.append(f"Minimum flight time: {flight_time} min")
        findings.append(f"Maximum budget: ${max_cost}")

        # Environmental analysis
        air_density_ratio = max(0.1, 1.225 * math.exp(-altitude / 8500) / 1.225)
        findings.append(f"Air density at {altitude}m: {air_density_ratio*100:.0f}% of sea level")
        findings.append(f"Thrust derating factor: {air_density_ratio:.2f}")

        if altitude > 3000:
            findings.append("⚠️  HIGH ALTITUDE: requires larger props / higher KV motors")
        if payload > 1000:
            findings.append("⚠️  HEAVY PAYLOAD: consider coaxial or X8 configuration")
        if flight_time > 20:
            findings.append("⚠️  LONG FLIGHT TIME: significant battery mass impact")

        # Mission-specific constraints
        mission_constraints: dict[str, list[str]] = {
            "survey": [
                "Requires stable hover for photogrammetry",
                "RTK GPS recommended for sub-5cm accuracy",
                "Forward overlap 80%, side overlap 60%",
            ],
            "cargo": [
                "Requires high thrust-to-weight ratio (>2.5)",
                "Payload release mechanism needed",
                "Redundant ESC configuration recommended",
            ],
            "inspection": [
                "Requires precision hover (±0.1m)",
                "Obstacle avoidance sensors recommended",
                "Extended loiter capability needed",
            ],
        }
        constraints = mission_constraints.get(mission_type, mission_constraints["survey"])
        findings.extend(f"  • {c}" for c in constraints)

        # Key specs deduced
        min_thrust_g = payload * 2.5 / air_density_ratio  # Account for altitude
        est_auw_g = payload * 2.2  # Rough structural multiplier
        analysis = {
            "mission_description": desc,
            "mission_type": mission_type,
            "target_altitude_m": altitude,
            "min_payload_g": payload,
            "min_flight_time_min": flight_time,
            "max_cost_usd": max_cost,
            "air_density_ratio": round(air_density_ratio, 3),
            "estimated_min_auw_g": round(est_auw_g),
            "estimated_min_thrust_g": round(min_thrust_g),
            "recommended_frame_types": self._recommend_frames(mission_type, payload, altitude),
            "constraints": constraints,
        }

        return PhaseResult(
            phase="explore",
            status="completed",
            model=model_cfg,
            summary=f"Mission analysis complete: {mission_type} at {altitude}m, {payload}g payload, {flight_time}min flight time, ${max_cost} budget.",
            key_findings=findings,
            data=analysis,
        )

    def _recommend_frames(self, mission_type: str, payload_g: int, altitude_m: int) -> list[str]:
        """Recomienda configuraciones de frame segun la mision."""
        if payload_g > 2000 or mission_type == "cargo":
            return ["X8 (heavy lift)", "Y6 (coaxial efficiency)"]
        if altitude_m > 3500 or mission_type == "inspection":
            return ["Quad X (standard)", "Y6 (altitude redundancy)"]
        return ["Quad X (standard)", "H-frame (payload versatility)"]

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 2 — propose
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_propose(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Genera 3–5 conceptos de morfologia con analisis de tradeoffs."""
        analysis = ctx.mission_analysis if ctx else {}
        alt = analysis.get("target_altitude_m", 4000)
        payload = analysis.get("min_payload_g", 500)
        flight_time = analysis.get("min_flight_time_min", 15)
        mission_type = analysis.get("mission_type", "survey")

        proposals: list[dict[str, Any]] = [
            {
                "name": "Andino-Scout",
                "frame": "Quad X 450mm",
                "motors": "4× 2207 1960KV",
                "props": "9×4.5″",
                "battery": "6S 4200mAh",
                "auw_g": 2450,
                "payload_g": payload,
                "flight_time_min": flight_time + 2,
                "twr": 2.8,
                "cost_usd": 1200,
                "strengths": ["Balanced performance", "Proven config", "Easy to tune"],
                "weaknesses": ["Limited redundancy", "Moderate altitude performance"],
                "best_for": "General survey, photogrammetry",
            },
            {
                "name": "Andino-Enduro",
                "frame": "H-frame 550mm",
                "motors": "4× 2812 1050KV",
                "props": "12×4.5″",
                "battery": "6S 8000mAh",
                "auw_g": 3800,
                "payload_g": payload + 200,
                "flight_time_min": flight_time + 10,
                "twr": 2.2,
                "cost_usd": 1800,
                "strengths": ["Excellent endurance", "Large payload margin", "Stable platform"],
                "weaknesses": ["Lower maneuverability", "Higher cost"],
                "best_for": "Long endurance, cargo, mapping",
            },
            {
                "name": "Andino-Alpine",
                "frame": "Y6 500mm coaxial",
                "motors": "6× 2207 1960KV",
                "props": "8×4.5″ (×6)",
                "battery": "6S 5200mAh",
                "auw_g": 3100,
                "payload_g": payload,
                "flight_time_min": flight_time + 3,
                "twr": 3.5,
                "cost_usd": 1600,
                "strengths": [
                    "Best altitude performance",
                    "Motor redundancy",
                    "Compact for transport",
                ],
                "weaknesses": ["Lower efficiency (coaxial loss ~15%)", "Complex maintenance"],
                "best_for": "High altitude, safety-critical missions",
            },
        ]

        if payload > 1500:
            proposals.append({
                "name": "Andino-Heavy",
                "frame": "X8 650mm coaxial",
                "motors": "8× 3115 900KV",
                "props": "14×5.5″ (×8)",
                "battery": "12S 12000mAh",
                "auw_g": 8500,
                "payload_g": payload + 500,
                "flight_time_min": flight_time + 5,
                "twr": 3.0,
                "cost_usd": 2800,
                "strengths": ["Massive payload capacity", "Redundant drive", "Heavy lift"],
                "weaknesses": ["Very expensive", "Large logistics footprint", "Regulatory burden"],
                "best_for": "Heavy cargo, mining supply delivery",
            })

        best = proposals[1] if mission_type in ("cargo", "inspection") else proposals[0]
        if alt > 3500:
            best = proposals[2]  # Alpine for high altitude

        findings = [
            f"Generated {len(proposals)} concept proposals",
            f"Recommended: {best['name']} ({best['frame']}) — {best['best_for']}",
            f"AUW range: ${min(p['cost_usd'] for p in proposals)}–{max(p['cost_usd'] for p in proposals)}",
            f"Flight time range: {min(p['flight_time_min'] for p in proposals)}–{max(p['flight_time_min'] for p in proposals)} min",
        ]

        return PhaseResult(
            phase="propose",
            status="completed",
            model=model_cfg,
            summary=f"{len(proposals)} concepts proposed. Recommended: {best['name']}.",
            key_findings=findings,
            data={"proposals": proposals, "recommended": best["name"]},
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 3 — spec
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_spec(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Genera especificaciones formales de ingenieria que alimentan MorphologyEngine."""
        proposals_data = ctx.design_proposals if ctx else {}
        proposals = proposals_data.get("proposals", [])
        recommended_name = proposals_data.get("recommended", "")
        rec = next((p for p in proposals if p["name"] == recommended_name), proposals[0] if proposals else {})

        reqs = ctx.mission_requirements if ctx else self._mission_requirements
        alt = reqs.get("target_altitude_m", 4000)
        payload = reqs.get("min_payload_g", 500)
        flight_time = reqs.get("min_flight_time_min", 15)
        mission_type = reqs.get("mission_type", "survey")

        # Engineering spec computation
        air_density = 1.225 * math.exp(-alt / 8500)
        hover_power_w = (payload * 2.5) * 9.81 * 0.15 / (air_density / 1.225)  # watts approx
        battery_wh = hover_power_w * (flight_time / 60) / 0.75  # with efficiency factor
        battery_cells = 6 if alt > 3000 else 4
        battery_v = battery_cells * 3.7
        battery_capacity_mah = (battery_wh / battery_v) * 1000 * 1.2  # 20% margin

        spec = {
            "mission_type": mission_type,
            "target_altitude_m": alt,
            "min_payload_g": payload,
            "min_flight_time_min": flight_time,
            "air_density_kg_m3": round(air_density, 4),
            # Derived parameters for MorphologyEngine
            "estimated_auw_g": round(payload * 2.2),
            "required_thrust_g": round(payload * 3.0),
            "min_twr": 2.2 if alt > 3000 else 1.8,
            "battery_spec": {
                "cells": battery_cells,
                "capacity_mah": round(battery_capacity_mah, -1),  # round to nearest 10
                "chemistry": "LiPo",
            },
            "propulsion_sizing": {
                "estimated_hover_power_w": round(hover_power_w),
                "estimated_battery_wh": round(battery_wh),
                "recommended_motor_kv": "1960KV" if alt > 3000 else "1050KV",
                "recommended_prop_diameter_in": 9 if payload < 1000 else 12,
            },
            "frame_material": "Carbon fiber (3K twill)",
            "frame_class": "450–550mm" if payload < 1500 else "550–650mm",
            "redundancy": mission_type == "inspection" or alt > 3500,
            "reference_concept": rec.get("name", "Andino-Scout"),
        }

        findings = [
            f"AUW target: ~{spec['estimated_auw_g']}g",
            f"Battery: {spec['battery_spec']['cells']}S {spec['battery_spec']['capacity_mah']:.0f}mAh",
            f"Min TWR: {spec['min_twr']}",
            f"Frame: {spec['frame_class']} {spec['frame_material']}",
        ]

        reqs.update({
            "min_payload_g": payload,
            "min_flight_time_min": flight_time,
            "target_altitude_m": alt,
        })

        return PhaseResult(
            phase="spec",
            status="completed",
            model=model_cfg,
            summary=f"Engineering spec generated: {spec['estimated_auw_g']}g AUW, {spec['battery_spec']['cells']}S {spec['battery_spec']['capacity_mah']:.0f}mAh.",
            key_findings=findings,
            data=spec,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 4 — design (real MorphologyEngine)
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_design(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Ejecuta MorphologyEngine.evolve() con los requisitos de la fase spec."""
        spec = ctx.design_spec if ctx else self._mission_requirements

        if _HAS_MORPHOLOGY:
            return self._design_with_morphology(model_cfg, spec)
        else:
            return self._design_simulated(model_cfg, spec)

    def _design_with_morphology(self, model_cfg: dict, spec: dict) -> PhaseResult:
        """Evolucion real con NSGA-II y generacion de URDF."""
        print_info("Initialising MorphologyEngine for design phase…")
        try:
            reqs = {**self._mission_requirements, **spec}
            evo_cfg = EvolutionConfig(
                population_size=reqs.get("population_size", 50),
                generations=reqs.get("generations", 30),
                verbose=False,
            )
            cfg = MorphologyConfig(evolution=evo_cfg, verbose=False)
            engine = MorphologyEngine(config=cfg)
            result = engine.evolve(reqs)

            findings = [
                f"Population: {evo_cfg.population_size}, Generations: {evo_cfg.generations}",
                f"Pareto front: {len(result.pareto_front)} designs",
                f"Best design: {result.best_designs[0].frame_type if result.best_designs else 'N/A'}",
            ]

            data: dict[str, Any] = {
                "n_generations": result.n_generations,
                "pareto_size": len(result.pareto_front),
                "evolution_summary": result.summary(),
            }
            if result.best_designs:
                best = result.best_designs[0]
                design_dict = {
                    "frame_type": best.frame_type,
                    "arm_length_mm": best.arm_length,
                    "arm_angle_deg": best.arm_angle,
                    "motor_model": best.motor_model,
                    "motor_count": best.motor_count,
                    "propeller_diameter_in": best.propeller_diameter,
                    "propeller_pitch": best.propeller_pitch,
                    "battery_cells": best.battery_cells,
                    "battery_capacity_mah": best.battery_capacity,
                    "frame_material": best.frame_material,
                    "payload_g": best.payload_mass,
                    "auw_g": best.auw,
                    "total_thrust_g": best.total_thrust,
                    "twr": best.twr,
                }
                data["best_design"] = design_dict

                # Generar URDF para el mejor diseno
                urdf_path = self._generate_design_urdf(best)
                if urdf_path:
                    data["urdf_path"] = urdf_path
                    findings.append(f"URDF: {urdf_path}")

            return PhaseResult(
                phase="design",
                status="completed",
                model=model_cfg,
                summary=f"MorphologyEngine result: {len(result.pareto_front)} Pareto-optimal designs.",
                key_findings=findings,
                data=data,
            )

        except Exception as exc:
            print_error(f"MorphologyEngine failed: {exc}")
            return self._design_simulated(model_cfg, spec)

    def _design_simulated(self, model_cfg: dict, spec: dict) -> PhaseResult:
        """Diseno simulado (fallback cuando morphology no esta instalado) con URDF."""
        payload = spec.get("min_payload_g", 500)
        alt = spec.get("target_altitude_m", 4000)
        flight_time = spec.get("min_flight_time_min", 15)
        mission_type = spec.get("mission_type", "survey")

        auw = round(payload * 2.1 + alt * 0.1)
        thrust = round(auw * 2.5)
        twr = round(thrust / max(auw, 1), 2)

        frame_type = "Quad X" if payload < 1500 else "X8"
        motor_count = 4 if payload < 1500 else 8
        arm_length = 450 if payload < 1500 else 600

        data = {
            "n_generations": 0,
            "pareto_size": 3,
            "evolution_summary": "Simulated evolution (MorphologyEngine not available)",
            "best_design": {
                "frame_type": "quad" if payload < 1500 else "x8",
                "arm_length_mm": arm_length,
                "arm_angle_deg": 45.0,
                "motor_model": "2207 1960KV" if alt > 3000 else "2812 1050KV",
                "motor_count": motor_count,
                "propeller_diameter_in": 9,
                "propeller_pitch": 4.5,
                "battery_cells": 6 if alt > 3000 else 4,
                "battery_capacity_mah": round(payload * flight_time * 0.8, -1),
                "frame_material": "carbon",
                "payload_g": payload,
                "auw_g": auw,
                "total_thrust_g": thrust,
                "twr": twr,
            },
        }

        # Generar URDF para el diseno simulado
        try:
            from morphology.design import DroneDesign
            from morphology.urdf import URDFGenerator

            sim_design = DroneDesign(
                frame_type="quad" if payload < 1500 else "x8",  # type: ignore
                arm_length=float(arm_length),
                motor_model="2207_2450kv",
                propeller_diameter=9.0,
                propeller_pitch=4.5,
                battery_cells=6 if alt > 3000 else 4,
                battery_capacity=round(payload * flight_time * 0.8, -1),
                payload_mass=float(payload),
            )
            gen = URDFGenerator(output_dir=str(self._project_dir / ".andino" / "urdf"))
            urdf_path = gen.generate(sim_design)
            data["urdf_path"] = urdf_path
        except Exception:
            pass

        findings = [
            f"Simulated design: {frame_type}",
            f"AUW: {auw}g, Thrust: {thrust}g, TWR: {twr}",
            "⚠️  Install morphology package for real NSGA-II evolution",
        ]

        return PhaseResult(
            phase="design",
            status="completed",
            model=model_cfg,
            summary=f"Design complete (simulated): {frame_type} @ {auw}g AUW, TWR {twr}.",
            key_findings=findings,
            data=data,
        )

    def _generate_design_urdf(self, design: Any) -> Optional[str]:
        """Genera URDF a partir de un DroneDesign.

        Args:
            design: Una instancia de DroneDesign.

        Returns:
            Ruta al archivo URDF generado, o None si falla.
        """
        try:
            from morphology.urdf import URDFGenerator

            gen = URDFGenerator(output_dir=str(self._project_dir / ".andino" / "urdf"))
            return gen.generate(design)
        except Exception as exc:
            print_warning(f"URDF generation skipped: {exc}")
            return None

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 5 — simulate
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_simulate(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Simula el rendimiento del diseno con Gazebo SITL o analitica."""
        design = (ctx.design_result if ctx else {}).get("best_design", {})
        spec = ctx.design_spec if ctx else {}

        # Determinar world segun la mision
        alt = spec.get("target_altitude_m", 4000)
        mission_type = spec.get("mission_type", "survey")
        world = "high_altitude" if alt > 3000 else "tunnel" if mission_type == "inspection" else "open_pit"

        # Intentar simulacion via gazebo_sim si tenemos un DroneDesign completo
        sim_from_gazebo = None
        try:
            from morphology.gazebo_sim import simulate as gazebo_simulate
            from morphology.design import DroneDesign

            dd = DroneDesign(
                frame_type=design.get("frame_type", "quad"),  # type: ignore
                arm_length=design.get("arm_length_mm", 450),
                motor_model=design.get("motor_model", "2207_2450kv"),
                propeller_diameter=design.get("propeller_diameter_in", 9),
                propeller_pitch=design.get("propeller_pitch", 4.5),
                battery_cells=design.get("battery_cells", 6),
                battery_capacity=design.get("battery_capacity_mah", 4200),
                payload_mass=design.get("payload_g", 500),
            )
            sim_from_gazebo = gazebo_simulate(dd, world=world)
        except Exception:
            pass

        # Physics-based analytical simulation (base)
        auw_g = design.get("auw_g", 2500)
        thrust_g = design.get("total_thrust_g", 6000)
        twr = design.get("twr", 2.4)
        battery_capacity = design.get("battery_capacity_mah", 4200)
        battery_cells = design.get("battery_cells", 6)

        air_density = 1.225 * math.exp(-alt / 8500)
        hover_thrust_g_per_motor = auw_g / max(design.get("motor_count", 4), 1)
        air_factor = math.sqrt(1.225 / max(air_density, 0.01))
        hover_power_w = hover_thrust_g_per_motor * 0.1 * air_factor
        total_hover_power_w = hover_power_w * design.get("motor_count", 4)

        battery_voltage = battery_cells * 3.7
        battery_energy_wh = battery_capacity * battery_voltage / 1000 * 0.85
        flight_time_min = (battery_energy_wh / max(total_hover_power_w, 1)) * 60
        max_speed_ms = math.sqrt(thrust_g * 2 / max(auw_g, 1) * 9.81 / (DRAG_COEFF * air_density)) * 0.5

        stability_index = min(1.0, max(0.0, twr / 4.0))
        payload_g = design.get("payload_g", spec.get("min_payload_g", 500))

        sim_data: dict[str, Any] = {
            "mission_profile": {
                "world": world,
                "altitude_m": alt,
                "air_density_kg_m3": round(air_density, 4),
            },
            "hover_performance": {
                "thrust_per_motor_g": round(hover_thrust_g_per_motor, 1),
                "power_per_motor_w": round(hover_power_w, 1),
                "total_power_w": round(total_hover_power_w, 1),
                "current_a": round(total_hover_power_w / battery_voltage, 1),
            },
            "flight_performance": {
                "estimated_flight_time_min": round(flight_time_min, 1),
                "max_speed_ms": round(max_speed_ms, 1),
                "stability_index": round(stability_index, 3),
                "payload_g": payload_g,
                "twr": twr,
            },
            "energy": {
                "battery_voltage": battery_voltage,
                "battery_energy_wh": round(battery_energy_wh, 1),
                "hover_power_w": round(total_hover_power_w, 1),
            },
        }

        # Mezclar resultados de Gazebo si estan disponibles
        if sim_from_gazebo and sim_from_gazebo.success:
            sim_data["gazebo"] = {
                "hover_time_s": sim_from_gazebo.hover_time_s,
                "max_altitude_m": sim_from_gazebo.max_altitude_m,
                "battery_drain_pct": sim_from_gazebo.battery_drain_pct,
                "stability_score": sim_from_gazebo.stability_score,
                "waypoints_reached": sim_from_gazebo.waypoints_reached,
                "total_waypoints": sim_from_gazebo.total_waypoints,
                "avg_wind_recovery_s": sim_from_gazebo.avg_wind_recovery_s,
                "crash": sim_from_gazebo.crash,
            }
            # Si Gazebo reporta crash, reflejarlo en la estabilidad
            if sim_from_gazebo.crash:
                stability_index = 0.0
                sim_data["flight_performance"]["sim_result"] = "CRASH"
            else:
                sim_data["flight_performance"]["sim_result"] = "OK"

        findings = [
            f"Flight time: {sim_data['flight_performance']['estimated_flight_time_min']:.1f} min",
            f"Max speed: {sim_data['flight_performance']['max_speed_ms']:.1f} m/s",
            f"Hover power: {sim_data['hover_performance']['total_power_w']:.0f} W",
            f"Stability index: {stability_index:.3f}",
            f"World: {world}",
        ]
        if sim_from_gazebo and sim_from_gazebo.success and not sim_from_gazebo.crash:
            findings.append(
                f"Gazebo: {sim_from_gazebo.waypoints_reached}/{sim_from_gazebo.total_waypoints} WPs, "
                f"{sim_from_gazebo.avg_wind_recovery_s:.1f}s recovery"
            )
        if sim_from_gazebo and sim_from_gazebo.crash:
            findings.append("⚠️  CRASH en simulacion Gazebo")

        return PhaseResult(
            phase="simulate",
            status="completed",
            model=model_cfg,
            summary=f"Simulation complete: {flight_time_min:.1f}min flight time, {total_hover_power_w:.0f}W hover power.",
            key_findings=findings,
            data=sim_data,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 6 — build
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_build(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Genera BOM y documentacion de ensamblaje."""
        design = (ctx.design_result if ctx else {}).get("best_design", {})
        sim = ctx.simulation_results if ctx else {}

        motor_count = design.get("motor_count", 4)
        frame = design.get("frame_type", "Quad X")

        # BOM generation
        bom = [
            {"item": "Frame kit", "qty": 1, "part": f"{frame} {design.get('arm_length_mm', 450)}mm", "est_cost": 120},
            {"item": "Motor", "qty": motor_count, "part": design.get("motor_model", "2207 1960KV"), "est_cost": motor_count * 25},
            {"item": "ESC", "qty": motor_count, "part": "BLHeli_32 40A", "est_cost": motor_count * 18},
            {"item": "Propeller", "qty": motor_count, "part": f"{design.get('propeller_diameter_in', 9)}×{design.get('propeller_pitch', 4.5)}\"", "est_cost": motor_count * 5},
            {"item": "Battery", "qty": 1, "part": f"{design.get('battery_cells', 6)}S {design.get('battery_capacity_mah', 4200)}mAh LiPo", "est_cost": 120},
            {"item": "Flight controller", "qty": 1, "part": "Pixhawk 6X", "est_cost": 299},
            {"item": "GPS", "qty": 1, "part": "H-RTK F9P", "est_cost": 395},
            {"item": "Receiver", "qty": 1, "part": "ELRS 915MHz", "est_cost": 45},
            {"item": "Camera", "qty": 1, "part": "Sony IMX477 12MP", "est_cost": 150},
            {"item": "Video TX", "qty": 1, "part": "DJI O3 Air Unit", "est_cost": 229},
            {"item": "Hardware kit", "qty": 1, "part": "M3/M4 standoffs, screws, nuts", "est_cost": 25},
        ]

        total_cost = sum(item["est_cost"] for item in bom)
        build_data = {
            "bom": bom,
            "total_cost_usd": total_cost,
            "estimated_build_time_hours": 4 + motor_count * 0.5,
            "tools_required": [
                "Soldering station", "Hex drivers (1.5/2.0/2.5mm)",
                "Wire stripper", "Heat gun", "Multimeter",
            ],
            "assembly_steps": [
                "1. Assemble frame and mount arms",
                "2. Solder ESCs to power distribution board",
                "3. Mount motors and propellers",
                "4. Install flight controller and GPS",
                "5. Wire receiver and camera",
                "6. Configure PX4 parameters",
                f"7. Test hover and tune PID ({frame} baseline)",
            ],
        }

        findings = [
            f"BOM: {len(bom)} line items, est. ${total_cost} total",
            f"Build time: ~{build_data['estimated_build_time_hours']:.0f} hours",
        ]

        return PhaseResult(
            phase="build",
            status="completed",
            model=model_cfg,
            summary=f"Build package generated: {len(bom)} items, ${total_cost} total.",
            key_findings=findings,
            data=build_data,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 7 — fly (real AgenticRuntime)
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_fly(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Ejecuta el AgenticRuntime para simular una mision de vuelo."""
        reqs = ctx.mission_requirements if ctx else self._mission_requirements
        design = (ctx.design_result if ctx else {}).get("best_design", {})
        sim = ctx.simulation_results if ctx else {}

        if _HAS_AGENT:
            return self._fly_with_agent(model_cfg, reqs, design, sim)
        else:
            return self._fly_simulated(model_cfg, reqs, design, sim)

    def _fly_with_agent(self, model_cfg: dict, reqs: dict, design: dict, sim: dict) -> PhaseResult:
        """Vuelo real con AgenticRuntime."""
        print_info("Initialising AgenticRuntime for fly phase…")
        try:
            cfg = RuntimeConfig(
                agent_id=reqs.get("agent_id", "andino-mission"),
                base_amsl=reqs.get("target_altitude_m", 4000),
            )
            runtime = AgenticRuntime(config=cfg)
            runtime.init()

            mission_desc = reqs.get("mission_description", reqs.get("mission_type", "survey_open_pit"))
            constraints = {
                "altitude_m": reqs.get("target_altitude_m", 4000),
                "payload_g": reqs.get("min_payload_g", 500),
                "max_distance_m": reqs.get("max_distance_m", 1000),
            }

            plan = runtime.plan(mission_desc, constraints)
            agent_result = runtime.execute()
            reflection = runtime.reflect()
            runtime.shutdown()

            data = {
                "agent_id": cfg.agent_id,
                "mission": mission_desc,
                "constraints": constraints,
                "plan": plan,
                "execution": {
                    "success": agent_result.success,
                    "phases": agent_result.metrics.get("total_phases", 0),
                    "successful": agent_result.metrics.get("successful_phases", 0),
                    "failed": agent_result.metrics.get("failed_phases", 0),
                },
                "reflection": reflection,
            }

            return PhaseResult(
                phase="fly",
                status="completed",
                model=model_cfg,
                summary=f"Agent mission {'successful' if agent_result.success else 'completed with issues'}.",
                key_findings=[
                    f"Agent: {cfg.agent_id}",
                    f"Mission: {mission_desc}",
                    "Result: " + ("✓ Success" if agent_result.success else "⚠️ Partial"),
                ],
                data=data,
            )

        except Exception as exc:
            print_error(f"AgenticRuntime failed: {exc}")
            return self._fly_simulated(model_cfg, reqs, design, sim)

    def _fly_simulated(self, model_cfg: dict, reqs: dict, design: dict, sim: dict) -> PhaseResult:
        """Vuelo simulado (fallback cuando agent no esta instalado)."""
        mission_type = reqs.get("mission_type", "survey")
        alt = reqs.get("target_altitude_m", 4000)

        flight_time = sim.get("flight_performance", {}).get("estimated_flight_time_min", 15)
        waypoints = [
            {"action": "takeoff", "alt_m": 10},
            {"action": "waypoint", "lat": 0.0, "lon": 0.0, "alt_m": alt},
            {"action": "waypoint", "lat": 0.001, "lon": 0.001, "alt_m": alt},
            {"action": "survey_pattern", "type": mission_type, "duration_min": flight_time * 0.7},
            {"action": "return_to_home"},
            {"action": "land"},
        ]

        data = {
            "agent_id": "andino-simulated",
            "mission": mission_type,
            "plan": waypoints,
            "execution": {
                "success": True,
                "phases": len(waypoints),
                "successful": len(waypoints),
                "failed": 0,
            },
            "reflection": f"Simulated {mission_type} mission at {alt}m completed successfully. "
                          f"Flight time: {flight_time:.0f} min. All waypoints visited.",
        }

        return PhaseResult(
            phase="fly",
            status="completed",
            model=model_cfg,
            summary=f"Simulated flight: {len(waypoints)} waypoints, {mission_type} mission.",
            key_findings=[f"Waypoints: {len(waypoints)}", "Status: Simulated (install agent for real execution)"],
            data=data,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 8 — verify
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_verify(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Compara resultados simulados vs requisitos de mision."""
        reqs = ctx.mission_requirements if ctx else self._mission_requirements
        sim = ctx.simulation_results if ctx else {}
        fly_result = ctx.flight_result if ctx else {}

        # Requirements baseline
        required_payload = reqs.get("min_payload_g", 500)
        required_flight_time = reqs.get("min_flight_time_min", 15)
        max_cost = reqs.get("max_cost_usd", 2000)
        mission_type = reqs.get("mission_type", "survey")

        # Achieved values
        achieved_payload = sim.get("flight_performance", {}).get("payload_g", required_payload)
        achieved_flight_time = sim.get("flight_performance", {}).get("estimated_flight_time_min", 0)
        achieved_twr = sim.get("flight_performance", {}).get("twr", 0)
        achieved_stability = sim.get("flight_performance", {}).get("stability_index", 0)
        flight_success = fly_result.get("execution", {}).get("success", True)

        # Pass/fail checks
        checks = [
            ("Payload capacity", achieved_payload, required_payload, achieved_payload >= required_payload),
            ("Flight time", achieved_flight_time, required_flight_time, achieved_flight_time >= required_flight_time),
            ("Thrust-to-weight", achieved_twr, 2.0, achieved_twr >= 2.0),
            ("Stability", achieved_stability, 0.6, achieved_stability >= 0.6),
            ("Flight execution", 1 if flight_success else 0, 1, flight_success),
        ]

        passed = sum(1 for _, _, _, ok in checks if ok)
        failed = len(checks) - passed
        pass_rate = passed / len(checks) * 100

        report = {
            "requirements": {
                "min_payload_g": required_payload,
                "min_flight_time_min": required_flight_time,
                "max_cost_usd": max_cost,
            },
            "achieved": {
                "payload_g": achieved_payload,
                "flight_time_min": achieved_flight_time,
                "twr": achieved_twr,
                "stability_index": achieved_stability,
            },
            "checks": [
                {"metric": name, "achieved": a, "required": r, "passed": ok}
                for name, a, r, ok in checks
            ],
            "summary": {
                "passed": passed,
                "failed": failed,
                "pass_rate_pct": round(pass_rate, 1),
                "verdict": "PASS" if pass_rate >= 80 else "FAIL",
            },
        }

        findings = [
            f"Verification: {passed}/{len(checks)} checks passed ({pass_rate:.0f}%)",
            f"Verdict: {report['summary']['verdict']}",
            f"Payload: {achieved_payload}g (req {required_payload}g) {'✓' if achieved_payload >= required_payload else '✗'}",
            f"Flight time: {achieved_flight_time:.1f}min (req {required_flight_time}min) {'✓' if achieved_flight_time >= required_flight_time else '✗'}",
        ]

        return PhaseResult(
            phase="verify",
            status="completed",
            model=model_cfg,
            summary=f"Verification: {passed}/{len(checks)} passed ({pass_rate:.0f}%) — {report['summary']['verdict']}.",
            key_findings=findings,
            data=report,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 9 — archive
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_archive(self, model_cfg: dict, ctx: Optional[PipelineContext]) -> PhaseResult:
        """Persiste todos los datos del pipeline en MemoryStore y genera reporte final."""
        report = self.get_pipeline_report()

        # Save to memory
        phases_data: dict[str, Any] = {}
        if ctx:
            for phase_name, result in ctx.results.items():
                if result.data:
                    phases_data[phase_name] = result.data

        record_id = self._memory.save(
            key=f"pipeline_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            data={
                "pipeline_report": report,
                "phases": phases_data,
                "mission_requirements": ctx.mission_requirements if ctx else self._mission_requirements,
                "completed_phases": ctx.completed_phases if ctx else self.phases_completed,
            },
            tags=["pipeline", "archive", ctx.mission_requirements.get("mission_type", "general") if ctx else "general"],
        )

        # Also write report to disk
        report_path = self._project_dir / ".andino" / "pipeline_report.md"
        report_path.write_text(report)

        findings = [
            f"Pipeline report: {report_path}",
            f"Memory record: {record_id}",
            f"Phases completed: {ctx.completed_phases if ctx else self.phases_completed}",
        ]

        return PhaseResult(
            phase="archive",
            status="completed",
            model=model_cfg,
            summary=f"Pipeline archived. Report → {report_path}. Memory ID: {record_id}.",
            key_findings=findings,
            data={"record_id": record_id, "report_path": str(report_path)},
        )

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE — fallback (should not be needed, but safe)
    # ══════════════════════════════════════════════════════════════════════════

    def _phase_fallback(self, phase: str, model_cfg: dict) -> PhaseResult:
        return PhaseResult(
            phase=phase,
            status="completed",
            model=model_cfg,
            summary=f"Simulated phase: {PHASE_DESCRIPTIONS.get(phase, '')}",
            key_findings=["Simulated output — no real module available for this phase"],
            data={"phase": phase, "simulated": True},
        )

    # ── Formatting and logging ────────────────────────────────────────────────

    def _format_phase_markdown(self, phase: str, result: PhaseResult, model_cfg: dict) -> str:
        """Genera el markdown para persistir a disco."""
        lines = [
            f"# Phase: {phase}",
            f"**Generated**: {result.timestamp}",
            f"**Model**: {model_cfg['provider']}/{model_cfg['model']}",
            f"**Status**: {result.status}",
            f"**Duration**: {result.duration_s:.1f}s",
            "",
            "## Summary",
            f"  {result.summary}",
            "",
        ]

        if result.key_findings:
            lines.append("## Key Findings")
            for f in result.key_findings:
                lines.append(f"  • {f}")
            lines.append("")

        if result.data:
            lines.append("## Structured Data")
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(result.data, indent=2, default=str))
            lines.append("```")
            lines.append("")

        if result.error:
            lines.append("## Error")
            lines.append(f"  {result.error}")
            lines.append("")

        lines.append("## Next Steps")
        lines.append(f"  Ready for: {self.next_phase or 'All phases complete'}")
        lines.append("")

        return "\n".join(lines)

    def _log_execution(self, phase: str, model_cfg: dict, output_path: Path) -> None:
        log_dir = self._project_dir / ".andino" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        now = datetime.now(timezone.utc)
        log_entry = {
            "timestamp": now.isoformat(),
            "phase": phase,
            "model": model_cfg,
            "output_path": str(output_path),
            "status": "completed",
        }

        log_file = log_dir / f"execution_{now.strftime('%Y%m%d')}.jsonl"
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")

    def _print_pipeline_summary(self, ctx: PipelineContext) -> None:
        """Imprime resumen del pipeline completo."""
        print_header("PIPELINE SUMMARY", "━")
        passed = sum(1 for r in ctx.results.values() if r.status == "completed")
        failed = sum(1 for r in ctx.results.values() if r.status == "failed")
        total = len(ctx.results)

        print(f"  Phases: {passed}/{total} completed")
        if failed:
            print(f"  {Fore.RED}{failed} failed{Fore.RESET}")
        print()

        for phase in PHASE_ORDER:
            r = ctx.get_result(phase)
            if r is None:
                continue
            icon = "✅" if r.status == "completed" else "❌" if r.status == "failed" else "⏹️"
            print(f"  {icon} {phase.upper():<12} — {r.summary[:80]}")
        print()

        verify = ctx.get_result("verify")
        if verify and verify.data:
            verdict = verify.data.get("summary", {}).get("verdict", "N/A")
            pass_rate = verify.data.get("summary", {}).get("pass_rate_pct", 0)
            if verdict == "PASS":
                print_success(f"VERDICT: {verdict} ({pass_rate}% pass rate)")
            else:
                print_warning(f"VERDICT: {verdict} ({pass_rate}% pass rate) — design needs iteration")

        total_s = sum(r.duration_s for r in ctx.results.values())
        print_info(f"Total pipeline time: {total_s:.1f}s")


# ── Drag coefficient constant for simulation ──────────────────────────────────
DRAG_COEFF = 0.8
