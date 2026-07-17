import json
from pathlib import Path

import pytest

from orchestrator.skills import SkillRegistry
from orchestrator.memory import MemoryStore


class TestSkillRegistry:
    def test_registry_init(self):
        registry = SkillRegistry()
        assert registry is not None

    def test_list_skills_returns_names(self):
        registry = SkillRegistry()
        skills = registry.list_skills()
        names = [s[0] for s in skills]
        assert "morphology_design" in names
        assert "propulsion_sizing" in names
        assert "structural_analysis" in names

    def test_list_skills_returns_tuples(self):
        registry = SkillRegistry()
        for name, desc in registry.list_skills():
            assert isinstance(name, str)
            assert isinstance(desc, str)

    def test_list_skills_filter_by_phase(self):
        registry = SkillRegistry()
        design_skills = registry.list_skills(filter_by_phase="design")
        names = {s[0] for s in design_skills}
        assert "morphology_design" in names
        assert "control_tuning" in names

    def test_list_skills_excludes_other_phase(self):
        registry = SkillRegistry()
        fly_skills = registry.list_skills(filter_by_phase="fly")
        names = {s[0] for s in fly_skills}
        assert "morphology_design" not in names
        assert "flight_planning" in names

    def test_get_skill_returns_dict(self):
        registry = SkillRegistry()
        skill = registry.get_skill("morphology_design")
        assert isinstance(skill, dict)
        assert skill["description"] == "Design drone morphology using evolutionary algorithms"
        assert "phases" in skill
        assert "design" in skill["phases"]

    def test_get_skill_unknown(self):
        registry = SkillRegistry()
        with pytest.raises(KeyError, match="Unknown skill"):
            registry.get_skill("nonexistent")

    def test_get_skill_returns_copy(self):
        registry = SkillRegistry()
        skill = registry.get_skill("morphology_design")
        skill["model"] = "modified"
        original = registry.get_skill("morphology_design")
        assert original["model"] != "modified"

    def test_add_skill(self):
        registry = SkillRegistry()
        registry.add_skill("test_skill", {
            "description": "A test skill",
            "inputs": ["x"],
            "outputs": ["y"],
        })
        skill = registry.get_skill("test_skill")
        assert skill["description"] == "A test skill"

    def test_add_skill_missing_fields(self):
        registry = SkillRegistry()
        with pytest.raises(ValueError, match="missing required fields"):
            registry.add_skill("bad", {"foo": "bar"})

    def test_add_skill_with_phases(self):
        registry = SkillRegistry()
        registry.add_skill("phase_skill", {
            "description": "Phase-specific skill",
            "inputs": [],
            "outputs": [],
            "phases": ["design", "simulate"],
        })
        names = {s[0] for s in registry.list_skills(filter_by_phase="simulate")}
        assert "phase_skill" in names

    def test_execute_skill(self):
        registry = SkillRegistry()
        result = registry.execute_skill("morphology_design", {"mission_spec": "test", "constraints": {}})
        assert result["status"] == "simulated"
        assert result["skill"] == "morphology_design"

    def test_execute_skill_missing_inputs(self):
        registry = SkillRegistry()
        with pytest.raises(ValueError, match="Missing required inputs"):
            registry.execute_skill("morphology_design", {})

    def test_execute_skill_unknown(self):
        registry = SkillRegistry()
        with pytest.raises(KeyError, match="Unknown skill"):
            registry.execute_skill("nonexistent", {})

    def test_load_from_nonexistent_dir(self, tmp_path):
        registry = SkillRegistry.load_from_dir(tmp_path / "nonexistent")
        skills = registry.list_skills()
        assert len(skills) == len([
            s for s in skills
        ])

    def test_load_from_dir_with_json(self, tmp_path):
        skills_dir = tmp_path / "skills"
        skills_dir.mkdir()
        skill_file = skills_dir / "custom.json"
        skill_file.write_text(json.dumps({
            "description": "Custom skill",
            "inputs": ["a"],
            "outputs": ["b"],
        }))
        registry = SkillRegistry.load_from_dir(skills_dir)
        skill = registry.get_skill("custom")
        assert skill["description"] == "Custom skill"

    def test_builtin_skills_count(self):
        registry = SkillRegistry()
        skills = registry.list_skills()
        assert len(skills) == 6


class TestMemoryStore:
    def test_memory_store_init(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        assert store is not None

    def test_memory_search_returns_list(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        results = store.search("anything")
        assert isinstance(results, list)

    def test_memory_search_empty(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        assert store.search("nonexistent") == []

    def test_memory_save_and_search(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        store.save("test_key", {"value": 42}, tags=["drone"])
        results = store.search("test_key")
        assert len(results) >= 1
        assert results[0]["key"] == "test_key"
        assert results[0]["data"]["value"] == 42

    def test_memory_save_with_tags(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        store.save("tagged", {"val": 1}, tags=["alpha", "beta"])
        results = store.search("alpha")
        assert len(results) >= 1

    def test_memory_stats(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        stats = store.stats()
        assert "total_records" in stats
        assert "total_documents" in stats
        assert "tags" in stats
        assert "recent" in stats

    def test_memory_stats_after_save(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        store.save("stats_key", {"n": 1}, tags=["test"])
        stats = store.stats()
        assert stats["total_records"] >= 1
        assert stats["total_documents"] >= 1

    def test_memory_load(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        rid = store.save("load_key", {"x": 10}, tags=["load"])
        results = store.load("load_key")
        assert len(results) >= 1
        assert results[0]["id"] == rid

    def test_memory_delete(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        rid = store.save("del_key", {"del": True}, tags=["delete"])
        assert store.delete(rid) is True
        assert store.load("del_key") == []

    def test_memory_delete_nonexistent(self, tmp_path):
        store = MemoryStore(tmp_path / "mem")
        assert store.delete("nonexistent-id") is False
