"""NSGA-II Evolutionary Optimizer para morfologias de drones.

Usa DEAP (Distributed Evolutionary Algorithms in Python) con
fallback graceful si no esta instalado.
"""

from __future__ import annotations

import logging
import math
import pickle
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .design import DroneDesign, ValidationError
from .surrogate import PhysicsSurrogate, PerformanceMetrics

logger = logging.getLogger("morphology.evolution")


@dataclass
class EvolutionConfig:
    population_size: int = 100
    generations: int = 50
    crossover_prob: float = 0.8
    mutation_prob: float = 0.2
    tournament_size: int = 3
    seed: int = 42
    checkpoint_interval: int = 10
    checkpoint_dir: str = ".evolution_checkpoints"
    verbose: bool = True

    def validate(self) -> list[str]:
        errors = []
        if self.population_size < 10:
            errors.append("population_size debe ser >= 10")
        if self.generations < 1:
            errors.append("generations debe ser >= 1")
        if not 0 <= self.crossover_prob <= 1:
            errors.append("crossover_prob debe estar en [0, 1]")
        if not 0 <= self.mutation_prob <= 1:
            errors.append("mutation_prob debe estar en [0, 1]")
        if self.tournament_size < 2:
            errors.append("tournament_size debe ser >= 2")
        return errors


@dataclass
class EvolutionResult:
    pareto_front: list[DroneDesign] = field(default_factory=list)
    pareto_metrics: list[PerformanceMetrics] = field(default_factory=list)
    history: list[dict[str, Any]] = field(default_factory=list)
    best_designs: list[DroneDesign] = field(default_factory=list)
    n_generations: int = 0
    config: EvolutionConfig = field(default_factory=EvolutionConfig)

    def summary(self) -> str:
        lines = [
            "=== Evolution Result ===",
            f"Generations: {self.n_generations}",
            f"Pareto front size: {len(self.pareto_front)}",
            f"Best designs: {len(self.best_designs)}",
            "",
        ]
        if self.pareto_front:
            best = self.pareto_front[0]
            m = self.pareto_metrics[0] if self.pareto_metrics else None
            lines.append(f"Best design: {best.frame_type} | arm={best.arm_length:.0f}mm")
            lines.append(f"  AUW: {best.auw:.0f}g | TWR: {best.twr:.2f}")
            if m:
                lines.append(f"  Payload: {m.payload_g:.0f}g | Flight: {m.flight_time_min:.1f}min")
                lines.append(f"  Cost: ${m.cost_usd:.0f} | Stability: {m.stability_index:.3f}")
        return "\n".join(lines)


class DEAPNotInstalledError(RuntimeError):
    """DEAP no esta instalado. Instalalo con: pip install deap"""


class MorphologyEvolution:
    """Optimizador evolutivo NSGA-II para morfologias de drones.

    Usa DEAP internamente con fallback si no esta disponible.
    Optimiza 5 objetivos simultaneamente.

    Usage:
        config = EvolutionConfig(population_size=50, generations=30)
        evo = MorphologyEvolution(config)
        result = evo.run()
        print(result.summary())
    """

    def __init__(
        self,
        config: EvolutionConfig | None = None,
        surrogate: PhysicsSurrogate | None = None,
    ) -> None:
        self.config = config or EvolutionConfig()
        self.surrogate = surrogate or PhysicsSurrogate()
        self._deap = None
        self._toolbox = None
        self._population = None
        self._pareto_front = []

        self._try_import_deap()

    def _try_import_deap(self) -> None:
        try:
            from deap import algorithms, base, benchmarks, creator, tools
            self._deap = (algorithms, base, benchmarks, creator, tools)
        except ImportError:
            msg = (
                "DEAP no esta instalado. El morphology engine puede "
                "ejecutarse sin DEAP usando run_simple(). "
                "Instalacion: pip install deap"
            )
            logger.warning(msg)
            self._deap = None

    @property
    def deap_available(self) -> bool:
        return self._deap is not None

    def setup(self) -> None:
        """Registra tipos, operadores y fitness en DEAP para NSGA-II."""
        if not self.deap_available:
            raise DEAPNotInstalledError(
                "DEAP no esta instalado. Usa run_simple() o instala DEAP."
            )

        algorithms, base, benchmarks, creator, tools = self._deap

        if "FitnessMulti" not in dir(creator):
            creator.create("FitnessMulti", base.Fitness, weights=(1.0, 1.0, -1.0, 1.0, 1.0))
            creator.create("Individual", list, fitness=creator.FitnessMulti)

        self._toolbox = base.Toolbox()
        toolbox = self._toolbox

        toolbox.register("attr_float", random.random)
        toolbox.register(
            "individual",
            tools.initRepeat,
            creator.Individual,
            toolbox.attr_float,
            n=10,
        )
        toolbox.register("population", tools.initRepeat, list, toolbox.individual)

        toolbox.register("evaluate", self.fitness)
        toolbox.register("mate", tools.cxSimulatedBinaryBounded, low=0.0, up=1.0, eta=20.0)
        toolbox.register(
            "mutate",
            tools.mutPolynomialBounded,
            low=0.0,
            up=1.0,
            eta=20.0,
            indpb=self.config.mutation_prob,
        )
        toolbox.register("select", tools.selNSGA2)

    def fitness(self, vector: list[float]) -> tuple[float, ...]:
        """Evalua 5 objetivos de fitness para un individuo.

        Objetivos:
            1. Maximizar payload (g)
            2. Maximizar flight time (min)
            3. Minimizar cost (USD)
            4. Maximizar estabilidad
            5. Maximizar altitude performance

        Returns:
            Tupla con 5 valores de fitness.
        """
        try:
            design = DroneDesign.decode(vector)
        except (ValidationError, Exception) as e:
            return (0.0, 0.0, 1e6, 0.0, 0.0)

        errors = design.validate()
        if errors:
            return (0.0, 0.0, 1e6, 0.0, 0.0)

        metrics = self.surrogate.predict(design)

        f1 = metrics.payload_g / 5000.0
        f2 = metrics.flight_time_min / 60.0
        f3 = metrics.cost_usd / 2000.0
        f4 = metrics.stability_index
        f5 = metrics.altitude_performance

        return (f1, f2, f3, f4, f5)

    def run(self) -> EvolutionResult:
        """Ejecuta la optimizacion NSGA-II completa.

        Returns:
            EvolutionResult con Pareto front, historial y mejores disenos.
        """
        if not self.deap_available:
            logger.info("DEAP no disponible, usando run_simple() como fallback.")
            return self.run_simple()

        return self._run_deap()

    def _run_deap(self) -> EvolutionResult:
        algorithms, base, benchmarks, creator, tools = self._deap

        self.setup()
        toolbox = self._toolbox
        config = self.config
        result = EvolutionResult(config=config)

        random.seed(config.seed)

        pop = toolbox.population(n=config.population_size)
        hof = tools.ParetoFront()

        stats = tools.Statistics(lambda ind: ind.fitness.values)
        stats.register("avg", lambda vals: [sum(v[i] for v in vals) / len(vals) for i in range(5)])
        stats.register("min", lambda vals: [min(v[i] for v in vals) for i in range(5)])
        stats.register("max", lambda vals: [max(v[i] for v in vals) for i in range(5)])

        checkpoints = Path(config.checkpoint_dir)
        checkpoints.mkdir(parents=True, exist_ok=True)

        if config.verbose:
            logger.info(f"Iniciando NSGA-II: pop={config.population_size}, "
                        f"gen={config.generations}, seed={config.seed}")

        algorithms.eaMuPlusLambda(
            pop,
            toolbox,
            mu=config.population_size,
            lambda_=config.population_size,
            cxpb=config.crossover_prob,
            mutpb=config.mutation_prob,
            ngen=config.generations,
            stats=stats,
            halloffame=hof,
            verbose=config.verbose,
        )

        self._population = pop
        self._pareto_front = list(hof.items)

        for gen_idx, ind in enumerate(pop):
            gen = gen_idx // config.population_size
            if gen >= len(result.history):
                result.history.append({
                    "generation": gen,
                    "population_size": len(pop),
                    "pareto_size": len(hof),
                })

        result.n_generations = config.generations

        for ind in self._pareto_front:
            try:
                design = DroneDesign.decode(list(ind))
                metrics = self.surrogate.predict(design)
                result.pareto_front.append(design)
                result.pareto_metrics.append(metrics)
            except Exception:
                continue

        result.pareto_front = sorted(
            result.pareto_front,
            key=lambda d: d.estimate_payload(),
            reverse=True,
        )

        result.best_designs = self._select_best(result)

        if config.verbose:
            logger.info(f"NSGA-II complete: {len(result.pareto_front)} soluciones Pareto")

        return result

    def run_simple(self) -> EvolutionResult:
        """Ejecucion simple sin DEAP (random search + Pareto sorting).

        Fallback cuando DEAP no esta instalado. Usa muestreo aleatorio
        con seleccion por crowding distance.
        """
        config = self.config
        result = EvolutionResult(config=config)

        random.seed(config.seed)

        all_designs: list[tuple[DroneDesign, PerformanceMetrics]] = []

        total_samples = config.population_size * config.generations

        if config.verbose:
            logger.info(f"Ejecutando busqueda simple: {total_samples} muestras")

        for gen in range(config.generations):
            gen_designs: list[tuple[DroneDesign, PerformanceMetrics]] = []

            for _ in range(config.population_size):
                vector = [random.random() for _ in range(10)]
                try:
                    design = DroneDesign.decode(vector)
                    if not design.validate():
                        metrics = self.surrogate.predict(design)
                        if metrics.payload_g > 0 and metrics.flight_time_min > 0:
                            gen_designs.append((design, metrics))
                except Exception:
                    continue

            gen_designs.sort(key=lambda x: x[1].payload_g, reverse=True)
            best_gen = gen_designs[:10] if gen_designs else []

            result.history.append({
                "generation": gen,
                "n_valid": len(gen_designs),
                "n_best": len(best_gen),
                "best_payload": best_gen[0][1].payload_g if best_gen else 0.0,
                "best_flight_time": best_gen[0][1].flight_time_min if best_gen else 0.0,
            })

            all_designs.extend(best_gen)

            if config.verbose and gen % max(1, config.generations // 10) == 0:
                logger.info(f"  Gen {gen}: {len(gen_designs)} validos, "
                           f"best payload={best_gen[0][1].payload_g:.0f}g" if best_gen else f"  Gen {gen}: 0 validos")

        pareto = self._pareto_filter(all_designs)
        result.pareto_front = [d for d, _ in pareto]
        result.pareto_metrics = [m for _, m in pareto]
        result.n_generations = config.generations
        result.best_designs = self._select_best(result)

        if config.verbose:
            logger.info(f"Simple search complete: {len(result.pareto_front)} Pareto solutions")

        return result

    def _pareto_filter(
        self,
        designs: list[tuple[DroneDesign, PerformanceMetrics]],
    ) -> list[tuple[DroneDesign, PerformanceMetrics]]:
        """Filtro Pareto: retorna solo soluciones no-dominadas."""
        pareto = []
        for i, (d1, m1) in enumerate(designs):
            dominated = False
            for j, (d2, m2) in enumerate(designs):
                if i == j:
                    continue

                p2_better = (
                    m2.payload_g > m1.payload_g
                    or m2.flight_time_min > m1.flight_time_min
                    or m2.cost_usd < m1.cost_usd
                    or m2.stability_index > m1.stability_index
                    or m2.altitude_performance > m1.altitude_performance
                )
                p2_not_worse = (
                    m2.payload_g >= m1.payload_g
                    and m2.flight_time_min >= m1.flight_time_min
                    and m2.cost_usd <= m1.cost_usd
                    and m2.stability_index >= m1.stability_index
                    and m2.altitude_performance >= m1.altitude_performance
                )

                if p2_better and p2_not_worse:
                    dominated = True
                    break

            if not dominated:
                pareto.append((d1, m1))

        pareto.sort(key=lambda x: x[1].payload_g, reverse=True)
        return pareto

    def _select_best(self, result: EvolutionResult) -> list[DroneDesign]:
        """Selecciona los mejores disenos por weighted sum."""
        scored = []
        for design, metrics in zip(result.pareto_front, result.pareto_metrics):
            score = (
                0.3 * (metrics.payload_g / 5000.0)
                + 0.3 * (metrics.flight_time_min / 60.0)
                - 0.2 * (metrics.cost_usd / 2000.0)
                + 0.1 * metrics.stability_index
                + 0.1 * metrics.altitude_performance
            )
            scored.append((score, design))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [d for _, d in scored[:5]]

    def save_checkpoint(self, path: str | Path | None = None) -> str:
        """Guarda checkpoint de la evolucion actual.

        Args:
            path: Ruta del checkpoint (o auto-naming).

        Returns:
            Ruta del archivo guardado.
        """
        if self._population is None:
            raise RuntimeError("No hay poblacion para checkpoint. Ejecuta run() primero.")

        path = Path(path or f"{self.config.checkpoint_dir}/checkpoint_gen{self.config.generations}.pkl")
        path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "population": self._population,
            "pareto_front": self._pareto_front,
            "config": self.config,
        }
        with open(path, "wb") as f:
            pickle.dump(data, f)

        logger.info(f"Checkpoint guardado: {path}")
        return str(path)

    @classmethod
    def load_checkpoint(cls, path: str | Path) -> MorphologyEvolution:
        """Carga evolucion desde checkpoint.

        Args:
            path: Ruta del checkpoint pickle.

        Returns:
            MorphologyEvolution con poblacion restaurada.
        """
        with open(path, "rb") as f:
            data = pickle.load(f)

        config = data.get("config", EvolutionConfig())
        evo = cls(config)
        evo._population = data.get("population")
        evo._pareto_front = data.get("pareto_front", [])
        return evo
