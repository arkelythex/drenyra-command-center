"""CLI tests using Typer's CliRunner.

Uses monkeypatch + tmp_path for clean CWD isolation per test.
"""

from pathlib import Path

import pytest
from typer.testing import CliRunner

from orchestrator.cli import app
from orchestrator.project import init_project

runner = CliRunner()


@pytest.fixture
def project_dir(tmp_path):
    """Create a tmp dir with an initialised Andino project."""
    proj = tmp_path / "project"
    proj.mkdir()
    init_project(proj, "Test Project", "CLI test project")
    return proj


@pytest.fixture
def empty_dir(tmp_path):
    """Create a clean tmp dir with NO Andino project."""
    empty = tmp_path / "empty"
    empty.mkdir()
    return empty


class TestCLIInit:
    def test_init_with_args(self, empty_dir, monkeypatch):
        monkeypatch.chdir(empty_dir)
        result = runner.invoke(app, ["init", "--name", "My Drone", "--description", "A test"])
        assert result.exit_code == 0
        assert "My Drone" in result.stdout
        assert "initialised" in result.stdout

    def test_init_defaults(self, empty_dir, monkeypatch):
        monkeypatch.chdir(empty_dir)
        result = runner.invoke(app, ["init"])
        assert result.exit_code == 0
        assert "initialised" in result.stdout


class TestCLIExplore:
    def test_explore_accepts_mission(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["explore", "survey the pit", "--yes", "--force"])
        assert result.exit_code == 0
        assert "EXPLORE" in result.stdout or "Phase" in result.stdout

    def test_explore_with_yes(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["explore", "--yes", "--force"])
        assert result.exit_code == 0


class TestCLIDesign:
    def test_design_with_flags(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        # Need to run through deps first
        runner.invoke(app, ["explore", "--yes", "--force"])
        runner.invoke(app, ["propose", "--yes", "--force"])
        runner.invoke(app, ["spec", "--yes", "--force"])
        result = runner.invoke(app, [
            "design",
            "--payload", "1000",
            "--altitude", "4000",
            "--flight-time", "20",
            "--max-cost", "3000",
            "--mission-type", "cargo",
            "--yes", "--force",
        ])
        assert result.exit_code == 0

    def test_design_shows_help(self):
        result = runner.invoke(app, ["design", "--help"])
        assert result.exit_code == 0
        assert "Phase 4" in result.stdout


class TestCLIStatus:
    def test_status_with_project(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["status"])
        assert result.exit_code == 0
        assert "PROJECT STATUS" in result.stdout or "explore" in result.stdout


class TestCLIHistory:
    def test_history_empty(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["history"])
        assert result.exit_code == 0
        assert "No phases completed" in result.stdout or "HISTORY" in result.stdout


class TestCLIPhases:
    def test_phases_list(self):
        result = runner.invoke(app, ["phases", "list"])
        assert result.exit_code == 0
        assert "explore" in result.stdout
        assert "archive" in result.stdout

    def test_phases_run(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["phases", "run",
                                      "--from", "explore", "--to", "design",
                                      "--yes", "--force"])
        assert result.exit_code == 0
        assert "PHASE" in result.stdout


class TestCLIModel:
    def test_model_list(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["model", "list"])
        assert result.exit_code == 0
        assert "explore" in result.stdout or "Model" in result.stdout

    def test_model_set(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["model", "set",
                                      "--phase", "design",
                                      "--model", "claude-opus-4",
                                      "--provider", "anthropic"])
        assert result.exit_code == 0
        assert "set" in result.stdout


class TestCLISkills:
    def test_skills_list(self):
        result = runner.invoke(app, ["skills", "list"])
        assert result.exit_code == 0
        assert "morphology_design" in result.stdout

    def test_skills_list_with_phase(self):
        result = runner.invoke(app, ["skills", "list", "--phase", "design"])
        assert result.exit_code == 0

    def test_skills_add(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        import json, tempfile
        skill_file = Path(tempfile.mktemp(suffix=".json"))
        skill_file.write_text(json.dumps({
            "description": "Test skill",
            "inputs": ["a"],
            "outputs": ["b"],
            "phases": ["design"],
        }))
        result = runner.invoke(app, ["skills", "add",
                                      "--name", "test_skill",
                                      "--file", str(skill_file)])
        assert result.exit_code == 0
        assert "saved" in result.stdout


class TestCLIMemory:
    def test_memory_search(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["memory", "search", "quadcopter"])
        assert result.exit_code == 0

    def test_memory_stats(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, ["memory", "stats"])
        assert result.exit_code == 0


class TestCLIVersion:
    def test_version(self):
        result = runner.invoke(app, ["--version"])
        assert result.exit_code == 0
        assert "Andino Orchestrator" in result.stdout


class TestCLIHelp:
    def test_help(self):
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        for cmd in ["init", "explore", "design", "status", "phases", "pipeline"]:
            assert cmd in result.stdout

    def test_no_args_shows_logo(self, empty_dir, monkeypatch):
        monkeypatch.chdir(empty_dir)
        result = runner.invoke(app, [])
        assert result.exit_code == 0
        assert "DRONE LAB" in result.stdout or "andino" in result.stdout.lower()


class TestCLIPipeline:
    def test_pipeline(self, project_dir, monkeypatch):
        monkeypatch.chdir(project_dir)
        result = runner.invoke(app, [
            "pipeline", "test mission", "--yes", "--force",
            "--payload", "2000", "--altitude", "3500",
            "--flight-time", "20", "--max-cost", "3000",
        ])
        assert result.exit_code == 0

    def test_pipeline_help(self):
        result = runner.invoke(app, ["pipeline", "--help"])
        assert result.exit_code == 0
