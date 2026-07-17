import pytest
import sys
sys.path.insert(0, '.')

from morphology.evolution import (
    EvolutionConfig,
    EvolutionResult,
    MorphologyEvolution,
)


class TestEvolutionConfig:

    def test_evolution_config_defaults(self):
        config = EvolutionConfig()
        assert config.population_size == 100
        assert config.generations == 50
        assert config.crossover_prob == 0.8
        assert config.mutation_prob == 0.2
        assert config.tournament_size == 3
        assert config.seed == 42

    def test_config_validation(self):
        config = EvolutionConfig(population_size=5)
        errors = config.validate()
        assert len(errors) > 0

        config2 = EvolutionConfig(population_size=50, generations=10)
        errors2 = config2.validate()
        assert len(errors2) == 0

    def test_config_custom_values(self):
        config = EvolutionConfig(
            population_size=25,
            generations=10,
            crossover_prob=0.7,
            mutation_prob=0.15,
            seed=123,
        )
        assert config.population_size == 25
        assert config.generations == 10
        assert config.crossover_prob == 0.7

    def test_config_tournament_minimum(self):
        config = EvolutionConfig(tournament_size=1)
        errors = config.validate()
        tournament_errors = [e for e in errors if "tournament" in e.lower()]
        assert len(tournament_errors) > 0


class TestEvolutionFallback:

    def test_evolution_with_fallback(self):
        config = EvolutionConfig(
            population_size=10,
            generations=5,
            verbose=False,
            seed=42,
        )
        evo = MorphologyEvolution(config=config)
        evo._deap = None
        result = evo.run()
        assert isinstance(result, EvolutionResult)
        assert result.n_generations == 5

    def test_simple_run_produces_designs(self):
        config = EvolutionConfig(population_size=8, generations=3, verbose=False, seed=7)
        evo = MorphologyEvolution(config=config)
        evo._deap = None
        result = evo.run_simple()
        assert len(result.history) == 3
        assert result.n_generations == 3

    def test_deap_availability_detected(self):
        evo = MorphologyEvolution()
        if evo.deap_available:
            assert evo._deap is not None
        else:
            assert evo._deap is None


class TestEvolutionResult:

    def test_evolution_result_structure(self):
        result = EvolutionResult()
        assert isinstance(result.pareto_front, list)
        assert isinstance(result.pareto_metrics, list)
        assert isinstance(result.history, list)
        assert isinstance(result.best_designs, list)
        assert result.n_generations == 0

    def test_summary_not_empty(self):
        config = EvolutionConfig(population_size=10, generations=3, verbose=False, seed=42)
        evo = MorphologyEvolution(config=config)
        evo._deap = None
        result = evo.run()
        summary = result.summary()
        assert isinstance(summary, str)
        assert len(summary) > 0

    def test_pareto_front_not_empty(self):
        config = EvolutionConfig(population_size=10, generations=5, verbose=False, seed=42)
        evo = MorphologyEvolution(config=config)
        evo._deap = None
        result = evo.run()
        assert len(result.pareto_front) > 0, "Pareto front deberia tener al menos un diseno"

    def test_best_designs_valid(self):
        config = EvolutionConfig(population_size=10, generations=5, verbose=False, seed=42)
        evo = MorphologyEvolution(config=config)
        evo._deap = None
        result = evo.run()
        for d in result.best_designs:
            assert d.auw > 0, f"AUW debe ser positivo: {d}"
            assert d.twr > 0, f"TWR debe ser positivo: {d}"
            assert d.total_thrust > 0, f"Total thrust debe ser positivo: {d}"

    def test_pareto_metrics_match_front(self, default_design):
        result = EvolutionResult()
        result.pareto_front = [default_design]
        from morphology.surrogate import PhysicsSurrogate
        surrogate = PhysicsSurrogate()
        result.pareto_metrics = [surrogate.predict(default_design)]
        assert len(result.pareto_front) == len(result.pareto_metrics)


class TestEvolutionEdgeCases:

    def test_empty_pareto_summary(self):
        result = EvolutionResult()
        summary = result.summary()
        assert isinstance(summary, str)
        assert "Pareto front size: 0" in summary

    def test_fitness_handles_invalid_vector(self):
        evo = MorphologyEvolution()
        fitness = evo.fitness([-999, -999, -999, -999, -999, -999, -999, -999, -999, -999])
        assert len(fitness) == 5

    def test_fitness_penalizes_invalid(self):
        evo = MorphologyEvolution()
        fitness = evo.fitness([2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0])
        assert fitness[2] >= 1e6

    def test_checkpoint_without_run_raises(self):
        evo = MorphologyEvolution()
        with pytest.raises(RuntimeError):
            evo.save_checkpoint()
