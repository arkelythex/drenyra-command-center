from pathlib import Path

import pytest

from orchestrator.engine import (
    PhaseEngine,
    PHASE_ORDER,
    PHASE_DESCRIPTIONS,
    PHASE_DEPENDENCIES,
)
from orchestrator.project import init_project


def _init_test_project(tmp_path: Path) -> Path:
    proj = tmp_path / "test_project"
    proj.mkdir()
    init_project(proj, "Test Drone", "A test project")
    return proj


class TestPhaseOrder:
    def test_phases_order(self):
        assert PHASE_ORDER == [
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

    def test_phases_count(self):
        assert len(PHASE_ORDER) == 9

    def test_no_duplicates(self):
        assert len(PHASE_ORDER) == len(set(PHASE_ORDER))


class TestPhaseDescriptions:
    def test_all_phases_have_descriptions(self):
        for phase in PHASE_ORDER:
            assert phase in PHASE_DESCRIPTIONS
            assert PHASE_DESCRIPTIONS[phase]

    def test_descriptions_are_strings(self):
        for desc in PHASE_DESCRIPTIONS.values():
            assert isinstance(desc, str)
            assert len(desc) > 10


class TestPhaseDependencies:
    def test_explore_has_no_deps(self):
        assert PHASE_DEPENDENCIES["explore"] == []

    def test_subsequent_depends_on_previous(self):
        for i, phase in enumerate(PHASE_ORDER[1:], 1):
            prev = PHASE_ORDER[i - 1]
            assert phase in PHASE_DEPENDENCIES
            assert prev in PHASE_DEPENDENCIES[phase]

    def test_propose_depends_on_explore(self):
        assert PHASE_DEPENDENCIES["propose"] == ["explore"]

    def test_spec_depends_on_propose(self):
        assert PHASE_DEPENDENCIES["spec"] == ["propose"]

    def test_design_depends_on_spec(self):
        assert PHASE_DEPENDENCIES["design"] == ["spec"]

    def test_simulate_depends_on_design(self):
        assert PHASE_DEPENDENCIES["simulate"] == ["design"]

    def test_build_depends_on_simulate(self):
        assert PHASE_DEPENDENCIES["build"] == ["simulate"]

    def test_fly_depends_on_build(self):
        assert PHASE_DEPENDENCIES["fly"] == ["build"]

    def test_verify_depends_on_fly(self):
        assert PHASE_DEPENDENCIES["verify"] == ["fly"]

    def test_archive_depends_on_verify(self):
        assert PHASE_DEPENDENCIES["archive"] == ["verify"]

    def test_all_phases_in_deps(self):
        for phase in PHASE_ORDER:
            assert phase in PHASE_DEPENDENCIES

    def test_archive_depends_on_all_previous_transitively(self):
        all_previous = set(PHASE_ORDER[:-1])
        visited = set()
        to_visit = list(PHASE_DEPENDENCIES["archive"])
        while to_visit:
            p = to_visit.pop(0)
            if p not in visited:
                visited.add(p)
                to_visit.extend(PHASE_DEPENDENCIES.get(p, []))
        assert visited == all_previous


class TestPhaseEngineInit:
    def test_engine_init(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        assert engine._project_dir == proj.resolve()

    def test_engine_init_with_mission_reqs(self, tmp_path):
        proj = _init_test_project(tmp_path)
        reqs = {"mission_type": "survey", "min_payload_g": 500}
        engine = PhaseEngine(proj, mission_requirements=reqs)
        assert engine._mission_requirements == reqs

    def test_engine_init_outside_project(self, tmp_path):
        with pytest.raises(FileNotFoundError, match="No Andino project found"):
            PhaseEngine(tmp_path / "nonexistent")


class TestEngineStatus:
    def test_status_returns_dict(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        status = engine.status()
        assert isinstance(status, dict)

    def test_status_has_expected_keys(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        status = engine.status()
        expected_keys = {
            "project", "state", "current_phase", "next_phase",
            "phases_completed", "phases_remaining", "models", "memory",
        }
        assert expected_keys.issubset(status.keys())

    def test_status_phases_completed_empty_initially(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        assert engine.phases_completed == []


class TestEngineNextPhase:
    def test_next_phase_initially_explore(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        assert engine.next_phase == "explore"

    def test_next_phase_none_when_complete(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        for phase in PHASE_ORDER:
            engine.execute(phase, force=True, skip_confirm=True)
        assert engine.next_phase is None


class TestEngineCanExecute:
    def test_can_execute_explore(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        ok, reason = engine.can_execute("explore")
        assert ok is True
        assert reason == "ready"

    def test_cannot_execute_design_without_deps(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        ok, reason = engine.can_execute("design")
        assert ok is False
        assert "Missing dependencies" in reason

    def test_can_execute_unknown_phase(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        ok, reason = engine.can_execute("nonexistent")
        assert ok is False
        assert "Unknown phase" in reason

    def test_can_execute_after_deps_met(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        engine.execute("explore", force=True, skip_confirm=True)
        engine.execute("propose", force=True, skip_confirm=True)
        engine.execute("spec", force=True, skip_confirm=True)
        ok, _ = engine.can_execute("design")
        assert ok is True


class TestEngineExecute:
    def test_execute_explore(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        result = engine.execute("explore", force=True, skip_confirm=True)
        assert result["phase"] == "explore"
        assert result["status"] == "completed"

    def test_execute_twice(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        result1 = engine.execute("explore", force=True, skip_confirm=True)
        result2 = engine.execute("explore", force=True, skip_confirm=True)
        assert result1["status"] == "completed"
        assert result2["status"] == "completed"

    def test_execute_unknown_phase(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        with pytest.raises(ValueError, match="Unknown phase"):
            engine.execute("nonexistent", force=True, skip_confirm=True)

    def test_cannot_execute_without_deps(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        with pytest.raises(RuntimeError, match="Cannot execute 'design'"):
            engine.execute("design", skip_confirm=True)

    def test_execute_force_overrides_deps(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        result = engine.execute("design", force=True, skip_confirm=True)
        assert result["status"] == "completed"
        assert result["phase"] == "design"


class TestEngineExecuteRange:
    def test_execute_range_explore_to_propose(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        results = engine.execute_range("explore", "propose", force=True, skip_confirm=True)
        assert len(results) == 2
        assert results[0]["phase"] == "explore"
        assert results[1]["phase"] == "propose"
        assert all(r["status"] == "completed" for r in results)

    def test_execute_range_invalid_from(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        with pytest.raises(ValueError, match="Unknown from_phase"):
            engine.execute_range("nope", "explore", force=True, skip_confirm=True)

    def test_execute_range_invalid_to(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        with pytest.raises(ValueError, match="Unknown to_phase"):
            engine.execute_range("explore", "nope", force=True, skip_confirm=True)

    def test_execute_range_reversed_order(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        with pytest.raises(ValueError, match="comes after"):
            engine.execute_range("archive", "explore", force=True, skip_confirm=True)


class TestEngineHistory:
    def test_history_empty_initially(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        assert engine.history() == []

    def test_history_after_execution(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        engine.execute("explore", force=True, skip_confirm=True)
        history = engine.history()
        assert len(history) == 1
        assert history[0]["phase"] == "explore"
        assert history[0]["completed"] is True


class TestEngineGetPhaseOutput:
    def test_get_phase_output_none_for_unexecuted(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        assert engine.get_phase_output("design") is None

    def test_get_phase_output_after_execution(self, tmp_path):
        proj = _init_test_project(tmp_path)
        engine = PhaseEngine(proj)
        engine.execute("explore", force=True, skip_confirm=True)
        output = engine.get_phase_output("explore")
        assert output is not None
        assert "# Phase: explore" in output


class TestEngineVersion:
    def test_version_exists(self):
        import orchestrator
        assert hasattr(orchestrator, "__version__")
        assert orchestrator.__version__ == "0.1.0"
