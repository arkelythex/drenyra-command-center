import json
import tempfile
from pathlib import Path

import pytest

from orchestrator.models import ModelRouter
from orchestrator.engine import PHASE_ORDER


class TestModelRouterDefault:
    def test_models_default_all_phases(self):
        router = ModelRouter()
        models = router.to_dict()
        for phase in PHASE_ORDER:
            assert phase in models, f"Missing model config for {phase}"

    def test_default_routing_for_design(self):
        router = ModelRouter()
        cfg = router.get_model("design")
        assert cfg["provider"] == "anthropic"
        assert cfg["model"] == "claude-opus-4"
        assert cfg["reasoning"] == "high"

    def test_default_routing_for_explore(self):
        router = ModelRouter()
        cfg = router.get_model("explore")
        assert cfg["provider"] == "openai"
        assert cfg["model"] == "gpt-4o-mini"
        assert cfg["reasoning"] == "low"

    def test_default_routing_for_simulate(self):
        router = ModelRouter()
        cfg = router.get_model("simulate")
        assert cfg["provider"] == "local"
        assert cfg["model"] == "simulation-engine"

    def test_default_routing_for_fly(self):
        router = ModelRouter()
        cfg = router.get_model("fly")
        assert cfg["provider"] == "local"
        assert cfg["model"] == "px4-autopilot"

    def test_get_model_returns_copy(self):
        router = ModelRouter()
        cfg1 = router.get_model("design")
        cfg2 = router.get_model("design")
        cfg1["model"] = "modified"
        assert cfg2["model"] == "claude-opus-4"


class TestModelRouterSet:
    def test_set_model_updates_config(self):
        router = ModelRouter()
        router.set_model("design", "openai", "gpt-4o")
        cfg = router.get_model("design")
        assert cfg["provider"] == "openai"
        assert cfg["model"] == "gpt-4o"

    def test_set_model_for_new_phase(self):
        router = ModelRouter()
        router.set_model("custom_phase", "anthropic", "claude-opus-4")
        cfg = router.get_model("custom_phase")
        assert cfg["provider"] == "anthropic"
        assert cfg["model"] == "claude-opus-4"

    def test_set_model_keeps_other_phases(self):
        router = ModelRouter()
        original = router.get_model("explore")
        router.set_model("design", "openai", "gpt-4o")
        unchanged = router.get_model("explore")
        assert unchanged == original


class TestModelRouterSaveLoad:
    def test_save_load_roundtrip(self, tmp_path):
        config_path = tmp_path / "models.json"
        router = ModelRouter()
        router.set_model("design", "openai", "gpt-4o")
        router.save_config(config_path)

        loaded = ModelRouter.load_config(config_path)
        cfg = loaded.get_model("design")
        assert cfg["provider"] == "openai"
        assert cfg["model"] == "gpt-4o"

    def test_load_missing_file(self, tmp_path):
        config_path = tmp_path / "nonexistent.json"
        router = ModelRouter.load_config(config_path)
        assert router.to_dict() != {}

    def test_save_creates_parent_dir(self, tmp_path):
        deep_path = tmp_path / "a" / "b" / "models.json"
        router = ModelRouter()
        router.save_config(deep_path)
        assert deep_path.exists()
        data = json.loads(deep_path.read_text())
        assert "design" in data


class TestModelRouterList:
    def test_list_models(self):
        router = ModelRouter()
        models = router.list_models()
        assert len(models) == len(PHASE_ORDER)
        for entry in models:
            assert len(entry) == 4

    def test_list_models_contains_all_phases(self):
        router = ModelRouter()
        phases_in_list = {entry[0] for entry in router.list_models()}
        assert phases_in_list == set(PHASE_ORDER)

    def test_list_models_format(self):
        router = ModelRouter()
        for phase, provider, model, reasoning in router.list_models():
            assert isinstance(phase, str)
            assert isinstance(provider, str)
            assert isinstance(model, str)
            assert isinstance(reasoning, str)


class TestModelRouterToDict:
    def test_to_dict_returns_serializable(self):
        router = ModelRouter()
        d = router.to_dict()
        serialized = json.dumps(d)
        assert isinstance(serialized, str)

    def test_to_dict_is_deep_copy(self):
        router = ModelRouter()
        d = router.to_dict()
        d["design"]["model"] = "hacked"
        original = router.get_model("design")
        assert original["model"] == "claude-opus-4"


class TestModelRouterUnknownPhase:
    def test_get_model_unknown_phase(self):
        router = ModelRouter()
        with pytest.raises(KeyError, match="Unknown phase"):
            router.get_model("nonexistent")
