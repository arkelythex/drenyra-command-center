"""End-to-end pipeline integration tests.

Tests the full SDD pipeline (explore → archive) with PhaseResult
typing, PipelineContext data flow, and structured phase outputs.
"""

from pathlib import Path

import pytest

from orchestrator.models import PhaseResult, PipelineContext
from orchestrator.engine import PhaseEngine, PHASE_ORDER, PHASE_DESCRIPTIONS
from orchestrator.project import init_project


SAMPLE_MISSION = "Quadcopter for tunnel inspection at 4000m altitude with 500g payload"


def _init_project(tmp_path: Path) -> Path:
    proj = tmp_path / "pipeline_test"
    proj.mkdir()
    init_project(proj, "Pipeline Test", SAMPLE_MISSION)
    return proj


# ── PhaseResult tests ─────────────────────────────────────────────────────────


class TestPhaseResult:
    def test_phase_result_fields(self):
        r = PhaseResult(phase="explore", status="completed")
        assert r.phase == "explore"
        assert r.status == "completed"
        assert r.timestamp != ""

    def test_phase_result_dict_access(self):
        """PhaseResult must support dict-style access for backward compat."""
        r = PhaseResult(phase="explore", status="completed")
        assert r["phase"] == "explore"
        assert r["status"] == "completed"

    def test_phase_result_to_dict(self):
        r = PhaseResult(
            phase="test", status="completed",
            summary="Test phase",
            key_findings=["Finding 1"],
            data={"key": "value"},
        )
        d = r.to_dict()
        assert d["phase"] == "test"
        assert d["status"] == "completed"
        assert d["summary"] == "Test phase"
        assert d["key_findings"] == ["Finding 1"]
        assert d["data"] == {"key": "value"}

    def test_phase_result_failed_status(self):
        r = PhaseResult(phase="design", status="failed", error="Something broke")
        assert r["status"] == "failed"
        assert r.error == "Something broke"

    def test_phase_result_cancelled_status(self):
        r = PhaseResult(phase="explore", status="cancelled")
        assert r["status"] == "cancelled"


# ── PipelineContext tests ─────────────────────────────────────────────────────


class TestPipelineContext:
    def test_context_init(self):
        ctx = PipelineContext({"mission_type": "survey"})
        assert ctx.mission_requirements == {"mission_type": "survey"}
        assert ctx.results == {}
        assert ctx.completed_phases == []

    def test_context_add_result(self):
        ctx = PipelineContext({"mission_type": "survey"})
        r = PhaseResult(phase="explore", status="completed", data={"key": "value"})
        ctx.add_result(r)
        assert "explore" in ctx.results
        assert ctx.mission_analysis == {"key": "value"}
        assert ctx.completed_phases == ["explore"]

    def test_context_add_result_maps_correctly(self):
        ctx = PipelineContext()
        phase_data = {
            "explore": ("mission_analysis", {"altitude": 4000}),
            "propose": ("design_proposals", [{"name": "Design A"}]),
            "spec": ("design_spec", {"battery": "6S"}),
            "design": ("design_result", {"auw_g": 2500}),
            "simulate": ("simulation_results", {"flight_time_min": 20}),
            "build": ("build_artifacts", {"bom": []}),
            "fly": ("flight_result", {"success": True}),
            "verify": ("verification_report", {"passed": 5}),
            "archive": ("archive_ref", "record_123"),
        }
        for phase, (attr, data) in phase_data.items():
            r = PhaseResult(phase=phase, status="completed", data=data)
            ctx.add_result(r)
            assert getattr(ctx, attr) == data

    def test_context_not_successful_on_failure(self):
        ctx = PipelineContext()
        ctx.add_result(PhaseResult(phase="explore", status="completed"))
        ctx.add_result(PhaseResult(phase="design", status="failed", error="fail"))
        assert ctx.successful is False

    def test_context_successful_all_completed(self):
        ctx = PipelineContext()
        for phase in PHASE_ORDER:
            ctx.add_result(PhaseResult(phase=phase, status="completed"))
        assert ctx.successful is True


# ── Single phase execution tests ─────────────────────────────────────────────


class TestSinglePhaseExecution:
    def test_explore_returns_phase_result(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={"mission_type": "survey"})
        result = engine.execute("explore", force=True, skip_confirm=True)
        assert isinstance(result, PhaseResult)
        assert result["phase"] == "explore"
        assert result["status"] == "completed"
        assert result.summary != ""

    def test_explore_has_data(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={
            "mission_type": "survey", "target_altitude_m": 4000, "min_payload_g": 500,
        })
        result = engine.execute("explore", force=True, skip_confirm=True)
        assert result.data is not None
        assert "mission_type" in result.data
        assert result.data["target_altitude_m"] == 4000
        assert result.data["min_payload_g"] == 500
        assert result.key_findings

    def test_propose_requires_explore_context(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={"mission_type": "survey"})
        engine.execute("explore", force=True, skip_confirm=True)
        result = engine.execute("propose", force=True, skip_confirm=True)
        assert result.status == "completed"
        assert result.data is not None
        assert "proposals" in result.data
        assert len(result.data["proposals"]) >= 3

    def test_design_returns_design_data(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={
            "mission_type": "survey", "min_payload_g": 500,
        })
        # Run through deps
        for phase in ["explore", "propose", "spec"]:
            engine.execute(phase, force=True, skip_confirm=True)
        result = engine.execute("design", force=True, skip_confirm=True)
        assert result.status == "completed"
        assert result.data is not None
        assert "best_design" in result.data
        assert result.data["best_design"]["payload_g"] >= 500

    def test_verify_depends_on_full_chain(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={
            "mission_type": "survey", "min_payload_g": 500, "min_flight_time_min": 15,
        })
        for phase in PHASE_ORDER:
            if phase == "verify":
                break
            engine.execute(phase, force=True, skip_confirm=True)
        result = engine.execute("verify", force=True, skip_confirm=True)
        assert result.status == "completed"
        assert result.data is not None
        assert "summary" in result.data
        assert "verdict" in result.data["summary"]

    def test_verify_all_phases_markdown_output(self, tmp_path):
        """Each completed phase should produce a readable .md file."""
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj)
        for phase in PHASE_ORDER:
            engine.execute(phase, force=True, skip_confirm=True)
            output = engine.get_phase_output(phase)
            assert output is not None, f"No output for phase {phase}"
            assert f"# Phase: {phase}" in output, f"Missing header in {phase}"
            assert "## Summary" in output, f"Missing Summary in {phase}"


# ── PipelineContext integration ──────────────────────────────────────────────


class TestPipelineContextIntegration:
    def test_execute_range_creates_context(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={
            "mission_type": "survey", "min_payload_g": 500,
        })
        results = engine.execute_range("explore", "propose", force=True, skip_confirm=True)
        assert len(results) == 2
        assert all(isinstance(r, PhaseResult) for r in results)

    def test_run_pipeline_returns_context(self, tmp_path):
        proj = _init_project(tmp_path)
        # Re-init with sample mission
        init_project(proj, "Pipeline Test", SAMPLE_MISSION)
        engine = PhaseEngine(proj, mission_requirements={
            "mission_description": SAMPLE_MISSION,
            "mission_type": "inspection",
            "target_altitude_m": 4000,
            "min_payload_g": 500,
            "min_flight_time_min": 15,
        })
        ctx = engine.run_pipeline("", force=True, skip_confirm=True)
        assert isinstance(ctx, PipelineContext)
        assert "explore" in ctx.results
        assert "archive" in ctx.results
        assert all(r.status == "completed" for r in ctx.results.values())

    def test_pipeline_data_flows_between_phases(self, tmp_path):
        """Data from explore should inform propose, etc."""
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={
            "mission_type": "inspection", "target_altitude_m": 4000,
            "min_payload_g": 500, "min_flight_time_min": 15,
        })

        # Run explore → propose with context
        results = engine.execute_range("explore", "propose", force=True, skip_confirm=True)

        # Explore should have mission analysis
        explore = results[0]
        assert explore.data is not None
        assert "mission_type" in explore.data
        assert explore.data["mission_type"] == "inspection"

        # Propose should have design proposals
        propose = results[1]
        assert propose.data is not None
        assert "proposals" in propose.data

    def test_pipeline_report_generates(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj)
        engine.execute("explore", force=True, skip_confirm=True)
        report = engine.get_pipeline_report()
        assert "# Andino Drone Lab — Pipeline Report" in report
        assert "## Phase Summary" in report
        assert "### ✅ EXPLORE" in report

    def test_get_evolution_data(self, tmp_path):
        proj = _init_project(tmp_path)
        engine = PhaseEngine(proj, mission_requirements={
            "min_payload_g": 500, "target_altitude_m": 4000,
        })
        # Run up to spec so design can execute
        engine.execute("explore", force=True, skip_confirm=True)
        engine.execute("propose", force=True, skip_confirm=True)
        engine.execute("spec", force=True, skip_confirm=True)
        engine.execute("design", force=True, skip_confirm=True)
        evo = engine.get_evolution_data()
        assert evo is not None
        assert "best_design" in evo
