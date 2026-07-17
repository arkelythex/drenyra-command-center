import json
from pathlib import Path

import pytest

from orchestrator.project import (
    init_project,
    load_project_config,
    load_project_state,
    save_phase_output,
    save_project_state,
    ensure_project,
)
from orchestrator.engine import PHASE_ORDER


class TestInitProject:
    def test_init_project_creates_andino_dir(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "desc")
        assert (proj / ".andino").exists()
        assert (proj / ".andino").is_dir()

    def test_init_project_creates_config(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "desc")
        config_path = proj / ".andino" / "config.json"
        assert config_path.exists()
        data = json.loads(config_path.read_text())
        assert data["name"] == "Test"
        assert data["description"] == "desc"

    def test_init_project_creates_state(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "")
        state_path = proj / ".andino" / "state.json"
        assert state_path.exists()
        data = json.loads(state_path.read_text())
        assert data["current_phase"] == "explore"
        assert data["phases_completed"] == []

    def test_init_project_creates_models(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "")
        models_path = proj / ".andino" / "models.json"
        assert models_path.exists()
        data = json.loads(models_path.read_text())
        assert "design" in data

    def test_init_project_creates_phase_dirs(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "")
        for phase in PHASE_ORDER:
            phase_dir = proj / ".andino" / "phases" / phase
            assert phase_dir.exists(), f"Missing phase dir: {phase}"
            assert phase_dir.is_dir()

    def test_init_project_creates_logs_dir(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "")
        assert (proj / ".andino" / "logs").exists()

    def test_init_project_creates_memory_dirs(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        init_project(proj, "Test", "")
        assert (proj / ".andino" / "memory" / "documents").exists()

    def test_init_project_returns_config(self, tmp_path):
        proj = tmp_path / "my_project"
        proj.mkdir()
        cfg = init_project(proj, "My Drone", "Description here")
        assert cfg.name == "My Drone"
        assert cfg.description == "Description here"
        assert cfg.current_phase == "explore"
        assert cfg.phases_completed == []


class TestLoadConfig:
    def test_load_config(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "LoadTest", "Loaded")
        config = load_project_config(proj)
        assert config["name"] == "LoadTest"
        assert config["description"] == "Loaded"

    def test_load_config_missing(self, tmp_path):
        with pytest.raises(FileNotFoundError, match="No project found"):
            load_project_config(tmp_path / "nonexistent")


class TestLoadState:
    def test_load_state(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "StateTest", "")
        state = load_project_state(proj)
        assert state["current_phase"] == "explore"

    def test_load_state_missing_returns_default(self, tmp_path):
        state = load_project_state(tmp_path / "nonexistent")
        assert state["current_phase"] == "none"
        assert state["phases_completed"] == []


class TestSaveState:
    def test_save_state_updates_phase(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        state = load_project_state(proj)
        state["current_phase"] = "design"
        state["phases_completed"] = ["explore", "propose", "spec"]
        save_project_state(proj, state)

        loaded = load_project_state(proj)
        assert loaded["current_phase"] == "design"
        assert loaded["phases_completed"] == ["explore", "propose", "spec"]

    def test_save_state_adds_updated_at(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        state = load_project_state(proj)
        save_project_state(proj, state)
        loaded = load_project_state(proj)
        assert "updated_at" in loaded

    def test_save_state_updates_config_timestamp(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        state = load_project_state(proj)
        save_project_state(proj, state)
        config = load_project_config(proj)
        assert "updated_at" in config


class TestSavePhaseOutput:
    def test_save_phase_output_writes_file(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        fpath = save_phase_output(proj, "explore", "# Explore phase output")
        assert fpath.exists()
        assert fpath.read_text() == "# Explore phase output"

    def test_save_phase_output_in_correct_dir(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        fpath = save_phase_output(proj, "design", "# Design output")
        assert fpath.parent == (proj / ".andino" / "phases" / "design")

    def test_save_phase_output_creates_latest(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        save_phase_output(proj, "explore", "v1")
        latest = proj / ".andino" / "phases" / "explore" / "explore.md"
        assert latest.exists()
        assert latest.read_text() == "v1"

    def test_save_phase_output_overwrites_latest(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        save_phase_output(proj, "explore", "v1")
        save_phase_output(proj, "explore", "v2")
        latest = proj / ".andino" / "phases" / "explore" / "explore.md"
        assert latest.read_text() == "v2"

    def test_save_phase_output_creates_timestamped_file(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        fpath = save_phase_output(proj, "explore", "content")
        assert fpath.name.startswith("explore_")
        assert fpath.suffix == ".md"

    def test_save_phase_output_creates_parent_dir(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        fpath = save_phase_output(proj, "custom_phase", "output")
        assert fpath.exists()


class TestEnsureProject:
    def test_ensure_project_success(self, tmp_path):
        proj = tmp_path / "proj"
        proj.mkdir()
        init_project(proj, "Test", "")
        result = ensure_project(proj)
        assert result == (proj / ".andino")

    def test_ensure_project_fails(self, tmp_path):
        with pytest.raises(FileNotFoundError, match="No Andino project found"):
            ensure_project(tmp_path / "empty")

    def test_ensure_project_outside_project(self, tmp_path):
        proj = tmp_path / "no_dot_andino"
        proj.mkdir()
        with pytest.raises(FileNotFoundError, match="No Andino project found"):
            ensure_project(proj)
