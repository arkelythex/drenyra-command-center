"""MorphologyEngine — Orquestador del motor de evolucion de morfologias.

Pipeline completo: evolucion NSGA-II → surrogate evaluation → CAD generation.
API principal para Andino Orchestrator.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from .design import DroneDesign, REFERENCE_MOTORS
from .evolution import (
    EvolutionConfig,
    EvolutionResult,
    MorphologyEvolution,
)
from .surrogate import PerformanceMetrics, PhysicsSurrogate
from .codesign import CoDesign
from .cad import CADGenerator
from .viz import MorphologyViz

logger = logging.getLogger("morphology.engine")

MISSION_DEFAULTS = {
    "mining_andes": {
        "target_altitude_m": 4000,
        "min_payload_g": 500,
        "min_flight_time_min": 15,
        "max_cost_usd": 2000,
        "mission_type": "survey",
    },
    "cargo_andes": {
        "target_altitude_m": 3500,
        "min_payload_g": 2000,
        "min_flight_time_min": 10,
        "max_cost_usd": 3000,
        "mission_type": "cargo",
    },
    "inspection": {
        "target_altitude_m": 3000,
        "min_payload_g": 200,
        "min_flight_time_min": 25,
        "max_cost_usd": 1500,
        "mission_type": "inspection",
    },
}


@dataclass
class MorphologyConfig:
    evolution: EvolutionConfig = field(default_factory=EvolutionConfig)
    output_dir: str = ".morphology_output"
    cad_output_dir: str = "cad_scripts"
    checkpoint_dir: str = ".evolution_checkpoints"
    mission_profile: str = "mining_andes"
    verbose: bool = True


class MorphologyEngine:
    """Orquestador del motor de evolucion de morfologias.

    Pipeline:
        1. Configurar mision y parametros de evolucion
        2. Ejecutar NSGA-II optimization
        3. Analizar Pareto front
        4. Generar CAD para disenos seleccionados

    Usage:
        engine = MorphologyEngine()
        result = engine.evolve({"min_payload_g": 1000, "min_flight_time_min": 20})
        engine.generate_cad(result.best_designs[0])

    Attributes:
        config: Configuracion del motor.
        surrogate: Modelo surrogate de rendimiento.
        codesign: Evaluador de co-diseno.
        cad: Generador de archivos CAD.
        viz: Visualizador ASCII.
    """

    def __init__(
        self,
        config: MorphologyConfig | None = None,
        surrogate: PhysicsSurrogate | None = None,
    ) -> None:
        self.config = config or MorphologyConfig()
        self.surrogate = surrogate or PhysicsSurrogate()
        self.codesign = CoDesign()
        self.cad = CADGenerator(output_dir=self.config.cad_output_dir)
        self.viz = MorphologyViz()
        self._evolution: MorphologyEvolution | None = None
        self._last_result: EvolutionResult | None = None

    def evolve(self, mission_requirements: dict | None = None) -> EvolutionResult:
        """Pipeline completo de evolucion.

        Args:
            mission_requirements: Dict con requerimientos de mision.
                keys: min_payload_g, min_flight_time_min, max_cost_usd,
                      target_altitude_m, mission_type

        Returns:
            EvolutionResult con Pareto front y mejores disenos.
        """
        reqs = {**MISSION_DEFAULTS.get(self.config.mission_profile, {}), **(mission_requirements or {})}

        logger.info("=" * 60)
        logger.info("MorphologyEngine: Starting evolution pipeline")
        logger.info(f"  Mission profile: {self.config.mission_profile}")
        logger.info(f"  Requirements: {json.dumps(reqs, indent=2)}")
        logger.info(f"  Population: {self.config.evolution.population_size}")
        logger.info(f"  Generations: {self.config.evolution.generations}")
        logger.info("=" * 60)

        evo = MorphologyEvolution(
            config=self.config.evolution,
            surrogate=self.surrogate,
        )
        self._evolution = evo

        result = evo.run()
        self._last_result = result

        valid = self._filter_by_requirements(result.pareto_front, result.pareto_metrics, reqs)

        if not valid:
            logger.warning("No designs meet all mission requirements!")
            logger.warning("Returning best available from Pareto front.")
            result.best_designs = result.pareto_front[:3] if result.pareto_front else []
        else:
            result.best_designs = [d for d, _ in valid[:5]]

        self._save_results(result, reqs)

        if self.config.verbose:
            logger.info(f"\n{result.summary()}")

        return result

    def _filter_by_requirements(
        self,
        designs: list[DroneDesign],
        metrics: list[PerformanceMetrics],
        reqs: dict,
    ) -> list[tuple[DroneDesign, PerformanceMetrics]]:
        """Filtra disenos que cumplen requerimientos minimos de mision.

        Args:
            designs: Lista de disenos del Pareto front.
            metrics: Lista de metricas correspondientes.
            reqs: Requerimientos de mision.

        Returns:
            Lista de (diseno, metricas) que cumplen.
        """
        if not designs or not metrics:
            return []

        min_payload = reqs.get("min_payload_g", 0)
        min_flight = reqs.get("min_flight_time_min", 0)
        max_cost = reqs.get("max_cost_usd", float("inf"))

        valid = []
        for d, m in zip(designs, metrics):
            if m.payload_g < min_payload:
                continue
            if m.flight_time_min < min_flight:
                continue
            if m.cost_usd > max_cost:
                continue
            valid.append((d, m))

        return valid

    def evaluate(self, design: DroneDesign) -> PerformanceMetrics:
        """Evalua un diseno individual via surrogate model.

        Args:
            design: Diseno del dron a evaluar.

        Returns:
            PerformanceMetrics con todas las predicciones.
        """
        return self.surrogate.predict(design)

    def evaluate_with_codesign(self, design: DroneDesign) -> dict[str, Any]:
        """Evalua un diseno con metricas de co-diseno.

        Args:
            design: Diseno del dron.

        Returns:
            Dict con performance metrics + co-design metrics.
        """
        perf = self.evaluate(design)
        return {
            "performance": perf.to_dict(),
            "controllability": self.codesign.controllability(design),
            "stability_margin": self.codesign.stability_margin(design),
            "responsiveness": self.codesign.responsiveness(design),
            "co_design_fitness": self.codesign.co_design_fitness(design),
        }

    def generate_cad(self, design: DroneDesign, output_dir: str | None = None) -> list[str]:
        """Genera archivos CAD para un diseno.

        Args:
            design: Diseno del dron.
            output_dir: Directorio de salida (opcional).

        Returns:
            Lista de rutas a archivos .py generados.
        """
        if output_dir:
            self.cad.output_dir = Path(output_dir)

        files = [
            self.cad.generate_frame(design),
            self.cad.generate_full_assembly(design),
            self.cad.generate_arm(
                length=design.arm_length,
                angle=design.arm_angle,
            ),
            self.cad.generate_motor_mount(design.motor_model),
        ]

        logger.info(f"Generated {len(files)} CAD script(s):")
        for f in files:
            logger.info(f"  • {f}")

        return files

    def compare(self, designs_or_result: list[DroneDesign] | EvolutionResult) -> str:
        """Tabla comparativa de disenos.

        Args:
            designs_or_result: Lista de disenos o EvolutionResult.

        Returns:
            String con tabla ASCII comparativa.
        """
        if isinstance(designs_or_result, EvolutionResult):
            designs = designs_or_result.pareto_front
            metrics = designs_or_result.pareto_metrics
        else:
            designs = designs_or_result
            metrics = [self.evaluate(d) for d in designs]

        if designs and metrics:
            return MorphologyViz.comparison_table(designs, metrics)
        return "(No designs to compare)"

    def show(self, design: DroneDesign, metrics: PerformanceMetrics | None = None) -> str:
        """Muestra resumen visual completo de un diseno.

        Args:
            design: Diseno del dron.
            metrics: Metricas de rendimiento (opcional, auto-calculadas si no se dan).

        Returns:
            String con arte ASCII + tabla de specs.
        """
        if metrics is None:
            metrics = self.evaluate(design)

        parts = [
            MorphologyViz.design_ascii(design),
            "",
            MorphologyViz.design_summary(design, metrics),
        ]
        return "\n".join(parts)

    def _save_results(self, result: EvolutionResult, reqs: dict) -> None:
        """Persiste resultados a disco.

        Args:
            result: Resultado de la evolucion.
            reqs: Requerimientos de mision usados.
        """
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Summary text
        summary = result.summary()
        (output_dir / "evolution_summary.txt").write_text(summary)

        # JSON export
        data = {
            "config": {
                "population_size": self.config.evolution.population_size,
                "generations": self.config.evolution.generations,
                "mission_profile": self.config.mission_profile,
                "requirements": reqs,
            },
            "results": {
                "n_pareto": len(result.pareto_front),
                "n_generations": result.n_generations,
                "designs": [],
            },
        }

        for design, metrics in zip(result.pareto_front, result.pareto_metrics):
            d = {
                "frame_type": design.frame_type,
                "arm_length_mm": design.arm_length,
                "arm_angle_deg": design.arm_angle,
                "motor_model": design.motor_model,
                "motor_count": design.motor_count,
                "propeller_diameter_in": design.propeller_diameter,
                "propeller_pitch": design.propeller_pitch,
                "battery_cells": design.battery_cells,
                "battery_capacity_mah": design.battery_capacity,
                "frame_material": design.frame_material,
                "payload_mass_g": design.payload_mass,
                "auw_g": design.auw,
                "total_thrust_g": design.total_thrust,
                "twr": design.twr,
                "metrics": metrics.to_dict(),
            }
            data["results"]["designs"].append(d)

        (output_dir / "evolution_results.json").write_text(json.dumps(data, indent=2))

        logger.info(f"Results saved to {output_dir.resolve()}")

    def interactive(self) -> None:
        """Modo interactivo simple (consola)."""
        print("AndinoDroneLab Morphology Engine - Interactive Mode")
        print("=" * 50)
        print("Commands: evolve, evaluate, compare, show, cad, help, quit")
        print()

        while True:
            try:
                cmd = input("morph> ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print()
                break

            if cmd in ("quit", "q", "exit"):
                break
            elif cmd in ("help", "?"):
                print("Commands:")
                print("  evolve [profile]  - Run evolution (default: mining_andes)")
                print("  evaluate          - Evaluate a specific design")
                print("  compare           - Compare Pareto designs")
                print("  show <n>          - Show design N from Pareto front")
                print("  cad <n>           - Generate CAD for design N")
                print("  help              - This help")
                print("  quit              - Exit")
            elif cmd.startswith("evolve"):
                parts = cmd.split()
                profile = parts[1] if len(parts) > 1 else "mining_andes"
                self.config.mission_profile = profile
                result = self.evolve()
                print(f"\n{result.summary()}")
            elif cmd == "compare":
                if self._last_result:
                    print(self.compare(self._last_result))
                else:
                    print("Run 'evolve' first.")
            elif cmd.startswith("show"):
                parts = cmd.split()
                if len(parts) > 1 and self._last_result:
                    try:
                        idx = int(parts[1]) - 1
                        if 0 <= idx < len(self._last_result.pareto_front):
                            d = self._last_result.pareto_front[idx]
                            m = self._last_result.pareto_metrics[idx] if idx < len(self._last_result.pareto_metrics) else None
                            print(self.show(d, m))
                        else:
                            print(f"Index out of range (0-{len(self._last_result.pareto_front)})")
                    except ValueError:
                        print("Usage: show <number>")
                else:
                    print("Usage: show <number>")
            elif cmd.startswith("cad"):
                parts = cmd.split()
                if len(parts) > 1 and self._last_result:
                    try:
                        idx = int(parts[1]) - 1
                        if 0 <= idx < len(self._last_result.pareto_front):
                            d = self._last_result.pareto_front[idx]
                            self.generate_cad(d)
                        else:
                            print(f"Index out of range (0-{len(self._last_result.pareto_front)})")
                    except ValueError:
                        print("Usage: cad <number>")
                else:
                    print("Run 'evolve' first, then 'cad <n>'")
            elif cmd == "evaluate":
                print("Quick evaluate: creating random design...")
                import random
                from .design import DroneDesign
                vec = [random.random() for _ in range(10)]
                design = DroneDesign.decode(vec)
                metrics = self.evaluate(design)
                print(self.show(design, metrics))
            else:
                print(f"Unknown command: {cmd}. Type 'help'.")

    @classmethod
    def from_config(cls, config_path: str | Path) -> MorphologyEngine:
        """Carga MorphologyEngine desde archivo JSON de configuracion.

        Args:
            config_path: Ruta al archivo JSON.

        Returns:
            MorphologyEngine configurado.
        """
        path = Path(config_path)
        if not path.exists():
            logger.warning(f"Config not found: {path}. Using defaults.")
            return cls()

        with open(path) as f:
            data = json.load(f)

        evo_config = EvolutionConfig(
            population_size=data.get("population_size", 100),
            generations=data.get("generations", 50),
            crossover_prob=data.get("crossover_prob", 0.8),
            mutation_prob=data.get("mutation_prob", 0.2),
            tournament_size=data.get("tournament_size", 3),
            verbose=data.get("verbose", True),
        )

        config = MorphologyConfig(
            evolution=evo_config,
            output_dir=data.get("output_dir", ".morphology_output"),
            cad_output_dir=data.get("cad_output_dir", "cad_scripts"),
            mission_profile=data.get("mission_profile", "mining_andes"),
            verbose=data.get("verbose", True),
        )

        surrogate = PhysicsSurrogate() if data.get("surrogate", "physics") == "physics" else None

        return cls(config=config, surrogate=surrogate)
