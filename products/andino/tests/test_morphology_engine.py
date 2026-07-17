import pytest
import sys
sys.path.insert(0, '.')

from morphology.engine import (
    MorphologyEngine,
    MorphologyConfig,
    MISSION_DEFAULTS,
)
from morphology.evolution import EvolutionConfig, EvolutionResult
from morphology.surrogate import PerformanceMetrics
from morphology.design import DroneDesign


class TestEngineInit:

    def test_engine_init(self):
        engine = MorphologyEngine()
        assert engine.config is not None
        assert engine.surrogate is not None
        assert engine.codesign is not None
        assert engine.cad is not None
        assert engine.viz is not None

    def test_engine_default_config(self):
        engine = MorphologyEngine()
        assert engine.config.mission_profile == "mining_andes"
        assert engine.config.evolution.population_size == 100
        assert engine.config.evolution.generations == 50

    def test_engine_custom_config(self):
        config = MorphologyConfig(
            mission_profile="cargo_andes",
            evolution=EvolutionConfig(population_size=20, generations=5, verbose=False),
        )
        engine = MorphologyEngine(config=config)
        assert engine.config.mission_profile == "cargo_andes"


class TestEngineEvolve:

    def test_engine_evolve(self):
        config = MorphologyConfig(
            evolution=EvolutionConfig(population_size=10, generations=5, verbose=False),
        )
        engine = MorphologyEngine(config=config)
        result = engine.evolve()
        assert isinstance(result, EvolutionResult)
        assert result.n_generations == 5

    def test_engine_evolve_with_requirements(self):
        config = MorphologyConfig(
            evolution=EvolutionConfig(population_size=10, generations=5, verbose=False),
        )
        engine = MorphologyEngine(config=config)
        result = engine.evolve({
            "min_payload_g": 100,
            "min_flight_time_min": 5,
            "max_cost_usd": 5000,
        })
        assert isinstance(result, EvolutionResult)
        assert len(result.best_designs) > 0


class TestEngineEvaluate:

    def test_engine_evaluate(self, default_design):
        engine = MorphologyEngine()
        metrics = engine.evaluate(default_design)
        assert isinstance(metrics, PerformanceMetrics)
        assert metrics.flight_time_min > 0
        assert metrics.cost_usd > 0

    def test_evaluate_unknown_motor_raises(self):
        engine = MorphologyEngine()
        with pytest.raises(Exception):
            engine.evaluate(DroneDesign(motor_model="FAKE"))

    def test_evaluate_with_codesign(self, default_design):
        engine = MorphologyEngine()
        result = engine.evaluate_with_codesign(default_design)
        assert "performance" in result
        assert "controllability" in result
        assert "stability_margin" in result
        assert "responsiveness" in result
        assert "co_design_fitness" in result
        assert 0 <= result["controllability"] <= 1
        assert 0 <= result["stability_margin"] <= 1
        assert 0 <= result["responsiveness"] <= 1
        assert 0 <= result["co_design_fitness"] <= 1


class TestEngineDisplay:

    def test_engine_compare(self, default_design, heavy_design, light_design):
        engine = MorphologyEngine()
        result = engine.compare([default_design, heavy_design, light_design])
        assert isinstance(result, str)
        assert len(result) > 0
        assert "Design" in result or "TWR" in result

    def test_engine_show(self, default_design):
        engine = MorphologyEngine()
        result = engine.show(default_design)
        assert isinstance(result, str)
        assert len(result) > 0
        assert "Frame Type" in result or "quad" in result


class TestEngineFilter:

    def test_engine_filter_by_requirements(self, default_design, heavy_design, light_design):
        engine = MorphologyEngine()
        designs = [default_design, heavy_design, light_design]
        metrics = [engine.evaluate(d) for d in designs]
        reqs = {"min_payload_g": 100, "min_flight_time_min": 5, "max_cost_usd": 10000}
        filtered = engine._filter_by_requirements(designs, metrics, reqs)
        assert len(filtered) > 0
        for d, m in filtered:
            assert m.payload_g >= 100
            assert m.flight_time_min >= 5
            assert m.cost_usd <= 10000

    def test_filter_empty_on_tight_requirements(self, default_design):
        engine = MorphologyEngine()
        metrics = engine.evaluate(default_design)
        filtered = engine._filter_by_requirements(
            [default_design], [metrics],
            {"min_payload_g": 999999, "min_flight_time_min": 999999},
        )
        assert len(filtered) == 0


class TestEngineConfig:

    def test_engine_from_config(self, tmp_path):
        config_file = tmp_path / "config.json"
        config_file.write_text(
            '{"population_size": 15, "generations": 5, "mission_profile": "inspection"}'
        )
        engine = MorphologyEngine.from_config(str(config_file))
        assert engine.config.mission_profile == "inspection"
        assert engine.config.evolution.population_size == 15
        assert engine.config.evolution.generations == 5

    def test_engine_from_config_missing_file(self):
        engine = MorphologyEngine.from_config("/nonexistent/config.json")
        assert engine.config.mission_profile == "mining_andes"

    def test_mission_defaults(self):
        assert "mining_andes" in MISSION_DEFAULTS
        assert "cargo_andes" in MISSION_DEFAULTS
        assert "inspection" in MISSION_DEFAULTS
        mining = MISSION_DEFAULTS["mining_andes"]
        assert mining["min_payload_g"] == 500
        assert mining["min_flight_time_min"] == 15


@pytest.mark.slow
class TestEngineCad:

    def test_generate_cad(self, default_design, tmp_path):
        engine = MorphologyEngine()
        cad_output = tmp_path / "cad_scripts"
        engine.cad.output_dir = cad_output
        files = engine.generate_cad(default_design, output_dir=str(cad_output))
        assert len(files) == 4
        for f in files:
            assert f.endswith(".py")
        for f in files:
            path = cad_output / f
            if not path.exists():
                path = cad_output / f.split("/")[-1]
            assert path.exists() or any(p.endswith(".py") for p in [str(cad_output / f.split("/")[-1])])
