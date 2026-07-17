import math
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, ".")

from agent.memory import (
    WorkingMemory,
    EpisodicMemory,
    SkillMemory,
    WorldMemory,
    AgentMemory,
    _cosine_similarity,
    _make_embedding,
    _iso_now,
)


class TestWorkingMemory:
    def test_set_and_get(self):
        wm = WorkingMemory()
        wm.set("key1", "value1")
        assert wm.get("key1") == "value1"

    def test_missing_key(self):
        wm = WorkingMemory()
        assert wm.get("nonexistent") is None

    def test_missing_key_with_default(self):
        wm = WorkingMemory()
        assert wm.get("nonexistent", "fallback") == "fallback"

    def test_overwrite(self):
        wm = WorkingMemory()
        wm.set("key", "old")
        wm.set("key", "new")
        assert wm.get("key") == "new"

    def test_clear(self):
        wm = WorkingMemory()
        wm.set("a", 1)
        wm.set("b", 2)
        wm.clear()
        assert wm.size == 0
        assert wm.get("a") is None

    def test_size(self):
        wm = WorkingMemory()
        assert wm.size == 0
        wm.set("a", 1)
        assert wm.size == 1
        wm.set("b", 2)
        assert wm.size == 2

    def test_get_all(self):
        wm = WorkingMemory()
        wm.set("a", 1)
        wm.set("b", 2)
        snap = wm.snapshot()
        assert snap == {"a": 1, "b": 2}

    def test_update(self):
        wm = WorkingMemory()
        wm.set("a", 1)
        wm.update({"b": 2, "c": 3})
        assert wm.get("a") == 1
        assert wm.get("b") == 2
        assert wm.get("c") == 3
        assert wm.size == 3

    def test_keys(self):
        wm = WorkingMemory()
        wm.set("x", 10)
        wm.set("y", 20)
        assert sorted(wm.keys()) == ["x", "y"]


class TestEpisodicMemory:
    @pytest.fixture
    def memory(self, tmp_path):
        return EpisodicMemory(tmp_path / "episodic")

    def test_store_and_search(self, memory):
        eid = memory.store("flight-001", "Survey mission over Andes valley", "success")
        assert eid is not None
        results = memory.recall("Andes valley survey", n=5)
        assert len(results) >= 1
        assert results[0]["flight_id"] == "flight-001"
        assert results[0]["outcome"] == "success"

    def test_cosine_similarity(self):
        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        assert _cosine_similarity(a, a) == pytest.approx(1.0)
        assert _cosine_similarity(a, b) == pytest.approx(0.0)

    def test_cosine_similarity_similar_text(self):
        emb1 = _make_embedding("drone flying over mountain")
        emb2 = _make_embedding("drone flying over valley")
        emb3 = _make_embedding("battery charging station")
        sim_similar = _cosine_similarity(emb1, emb2)
        sim_different = _cosine_similarity(emb1, emb3)
        assert sim_similar > sim_different

    def test_empty_search(self, memory):
        results = memory.recall("anything", n=5)
        assert results == []

    def test_count(self, memory):
        assert memory.count() == 0
        memory.store("f1", "summary 1", "ok")
        assert memory.count() == 1
        memory.store("f2", "summary 2", "ok")
        assert memory.count() == 2

    def test_embedding_deterministic(self):
        emb1 = _make_embedding("survey mission andes valley")
        emb2 = _make_embedding("survey mission andes valley")
        assert emb1 == emb2

    def test_get_episode(self, memory):
        eid = memory.store("f1", "test summary", "success")
        ep = memory.get(eid)
        assert ep is not None
        assert ep.flight_id == "f1"
        assert ep.summary == "test summary"

    def test_list_recent(self, memory):
        memory.store("f1", "first", "ok")
        memory.store("f2", "second", "ok")
        memory.store("f3", "third", "ok")
        recent = memory.list_recent(n=2)
        assert len(recent) == 2


class TestSkillMemory:
    @pytest.fixture
    def memory(self, tmp_path):
        return SkillMemory(tmp_path / "skill")

    def test_learn(self, memory):
        pattern = memory.learn(
            "takeoff", {"altitude": 50, "terrain": "flat"}, 15.0, True
        )
        assert pattern.skill_name == "takeoff"
        assert pattern.success_rate == 1.0
        assert pattern.use_count == 1

    def test_recall(self, memory):
        memory.learn("land", {"terrain": "rough"}, 20.0, True)
        recalled = memory.recall("land", {"terrain": "rough"})
        assert recalled is not None
        assert recalled.skill_name == "land"

    def test_persistence(self, tmp_path):
        path = tmp_path / "skill"
        mem1 = SkillMemory(path)
        mem1.learn("hover", {"duration": 30}, 25.0, True)
        mem2 = SkillMemory(path)
        recalled = mem2.recall("hover", {"duration": 30})
        assert recalled is not None
        assert recalled.skill_name == "hover"
        assert recalled.use_count == 1

    def test_empty_recall(self, memory):
        result = memory.recall("nonexistent", {"test": 1})
        assert result is None

    def test_learn_updates_stats(self, memory):
        memory.learn("takeoff", {"alt": 50}, 10.0, True)
        memory.learn("takeoff", {"alt": 50}, 20.0, False)
        pattern = memory.recall("takeoff", {"alt": 50})
        assert pattern.use_count == 2
        assert pattern.success_rate == 0.5
        assert pattern.avg_duration_s == 15.0

    def test_best_for(self, memory):
        memory.learn("takeoff", {"alt": 10}, 5.0, True)
        memory.learn("takeoff", {"alt": 50}, 10.0, True)
        best = memory.best_for("takeoff")
        assert best is not None
        assert best.skill_name == "takeoff"

    def test_best_for_empty(self, memory):
        assert memory.best_for("nonexistent") is None

    def test_list_skills(self, memory):
        memory.learn("takeoff", {}, 1.0, True)
        memory.learn("land", {}, 1.0, True)
        assert memory.list_skills() == ["land", "takeoff"]

    def test_stats(self, memory):
        memory.learn("takeoff", {}, 1.0, True)
        memory.learn("land", {}, 1.0, True)
        stats = memory.stats()
        assert stats["total_patterns"] == 2
        assert sorted(stats["skill_names"]) == ["land", "takeoff"]


class TestWorldMemory:
    @pytest.fixture
    def memory(self, tmp_path):
        return WorldMemory(tmp_path / "world")

    def test_init_creates_tables(self, memory):
        stats = memory.get_stats()
        for key in ("terrain_points", "obstacles", "no_fly_zones", "weather_records"):
            assert key in stats

    def test_store_terrain(self, memory):
        rid = memory.store_terrain(-16.5, -68.15, 4050.0)
        assert rid > 0

    def test_query_terrain(self, memory):
        memory.store_terrain(-16.5, -68.15, 4050.0)
        elev = memory.get_elevation(-16.5, -68.15)
        assert elev == pytest.approx(4050.0)

    def test_query_terrain_missing(self, memory):
        assert memory.get_elevation(0.0, 0.0) is None

    def test_store_no_fly_zone(self, memory):
        from agent.cerebellum import Position

        polygon = [
            Position(-16.5, -68.15, 4000),
            Position(-16.5, -68.14, 4000),
            Position(-16.49, -68.14, 4000),
        ]
        rid = memory.store_no_fly_zone("La Paz Airport", polygon)
        assert rid > 0

    def test_query_no_fly_zone(self, memory):
        from agent.cerebellum import Position

        polygon = [Position(-16.5, -68.15, 4000), Position(-16.5, -68.14, 4000), Position(-16.49, -68.14, 4000)]
        memory.store_no_fly_zone("Test Zone", polygon, alt_min=0, alt_max=5000)
        zones = memory.is_in_no_fly_zone(-16.5, -68.14, 1000)
        assert len(zones) >= 1
        assert zones[0]["name"] == "Test Zone"

    def test_store_obstacle(self, memory):
        rid = memory.store_obstacle(-16.5, -68.15, 50.0, obstacle_type="tower")
        assert rid > 0

    def test_query_obstacles_near(self, memory):
        memory.store_obstacle(-16.5, -68.15, 50.0, obstacle_type="tower")
        obstacles = memory.get_obstacles_near(-16.5, -68.15, radius_deg=0.02)
        assert len(obstacles) >= 1

    def test_store_weather(self, memory):
        rid = memory.store_weather(-16.5, -68.15, wind_speed_ms=5.0, temperature_c=15.0)
        assert rid > 0

    def test_recent_weather(self, memory):
        memory.store_weather(-16.5, -68.15, wind_speed_ms=5.0)
        records = memory.recent_weather(-16.5, -68.15, hours=24)
        assert len(records) >= 1

    def test_get_stats_counts(self, memory):
        memory.store_terrain(-16.5, -68.15, 4000.0)
        stats = memory.get_stats()
        assert stats["terrain_points"] >= 1


class TestAgentMemory:
    @pytest.fixture
    def agent_memory(self, tmp_path):
        return AgentMemory(tmp_path / "agent_mem")

    def test_agent_memory_store_recall(self, agent_memory):
        eid = agent_memory.store(
            "flight-001",
            "Survey mission over valley",
            memory_type="episodic",
            metadata={"outcome": "success"},
        )
        assert eid is not None
        results = agent_memory.recall("valley survey", memory_type="episodic")
        assert len(results) >= 1

    def test_agent_memory_learn(self, agent_memory):
        pattern = agent_memory.learn(
            "takeoff", {"altitude": 50}, duration_s=15.0, success=True
        )
        assert pattern.skill_name == "takeoff"
        assert pattern.success_rate == 1.0

    def test_agent_memory_working(self, agent_memory):
        agent_memory.store("current_alt", 4000.0, memory_type="working")
        results = agent_memory.recall("current_alt", memory_type="working")
        assert len(results) == 1
        assert results[0]["value"] == 4000.0

    def test_agent_memory_consolidate(self, agent_memory):
        agent_memory.store("test", "data", memory_type="working")
        agent_memory.store("f1", "test mission", memory_type="episodic", metadata={"outcome": "ok"})
        report = agent_memory.consolidate()
        assert "working" in report
        assert "episodic" in report
        assert "skill" in report
        assert "world" in report
        assert report["working"]["size"] == 1
        assert report["episodic"]["count"] == 1

    def test_agent_memory_clear_working(self, agent_memory):
        agent_memory.store("key", "val", memory_type="working")
        assert agent_memory.recall("key", memory_type="working") != []
        agent_memory.clear_working()
        assert agent_memory.recall("key", memory_type="working") == []

    def test_store_invalid_type(self, agent_memory):
        with pytest.raises(ValueError, match="Unknown memory_type"):
            agent_memory.store("key", "val", memory_type="invalid")

    def test_store_skill_learning(self, agent_memory):
        pid = agent_memory.store(
            "hover",
            "",
            memory_type="skill",
            metadata={"context": {"duration": 30}, "duration_s": 25.0, "success": True},
        )
        assert pid is not None
        results = agent_memory.recall("hover", memory_type="skill")
        assert len(results) == 1
