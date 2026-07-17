from __future__ import annotations

import json
import logging
import math
import os
import sqlite3
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)
import logging

EMBEDDING_DIM: int = 128


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return 0.0
    dot = sum(va * vb for va, vb in zip(a, b))
    na = math.sqrt(sum(v * v for v in a))
    nb = math.sqrt(sum(v * v for v in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _make_embedding(text: str) -> list[float]:
    vec = [0.0] * EMBEDDING_DIM
    words = text.lower().split()
    for word in words:
        h = hash(word) % EMBEDDING_DIM
        sign = 1.0 if h >= 0 else -1.0
        idx = abs(h) % EMBEDDING_DIM
        vec[idx] += sign
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


# ── Layer 1: Working Memory (volatile, in-memory) ───────────────────────


class WorkingMemory:
    """Volatile in-memory store for the current mission context.

    Data is lost on shutdown. Used for real-time state tracking.
    """

    def __init__(self):
        self._data: dict[str, Any] = {}

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def update(self, mapping: dict[str, Any]) -> None:
        self._data.update(mapping)

    def keys(self) -> list[str]:
        return list(self._data.keys())

    def clear(self) -> None:
        self._data.clear()

    def snapshot(self) -> dict[str, Any]:
        return dict(self._data)

    @property
    def size(self) -> int:
        return len(self._data)


# ── Layer 2: Episodic Memory (vector DB, numpy + cosine) ────────────────


@dataclass
class Episode:
    episode_id: str
    flight_id: str
    timestamp: str
    embedding: list[float]
    summary: str
    outcome: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "episode_id": self.episode_id,
            "flight_id": self.flight_id,
            "timestamp": self.timestamp,
            "summary": self.summary,
            "outcome": self.outcome,
            "metadata": self.metadata,
        }


class EpisodicMemory:
    """Past flight episode store with vector similarity search.

    Stores episodes as JSON files. Uses cosine similarity over
    128-dimensional embeddings for retrieval.
    """

    def __init__(self, storage_path: str | Path):
        self._path = Path(storage_path).expanduser().resolve()
        self._path.mkdir(parents=True, exist_ok=True)
        self._episodes: dict[str, Episode] = {}
        self._load()

    def store(self, flight_id: str, summary: str, outcome: str,
              metadata: Optional[dict[str, Any]] = None) -> str:
        episode_id = str(uuid.uuid4())
        embedding = _make_embedding(f"{summary} {outcome}")
        episode = Episode(
            episode_id=episode_id,
            flight_id=flight_id,
            timestamp=_iso_now(),
            embedding=embedding,
            summary=summary,
            outcome=outcome,
            metadata=metadata or {},
        )
        self._episodes[episode_id] = episode
        self._persist(episode)
        logger.debug("EpisodicMemory: stored %s (flight=%s)", episode_id, flight_id)
        return episode_id

    def recall(self, query: str, n: int = 5) -> list[dict[str, Any]]:
        query_emb = _make_embedding(query)
        scored: list[tuple[float, Episode]] = []
        for ep in self._episodes.values():
            sim = _cosine_similarity(query_emb, ep.embedding)
            scored.append((sim, ep))
        scored.sort(key=lambda x: -x[0])
        return [
            {
                "episode_id": ep.episode_id,
                "flight_id": ep.flight_id,
                "timestamp": ep.timestamp,
                "summary": ep.summary,
                "outcome": ep.outcome,
                "similarity": round(sim, 4),
                "metadata": ep.metadata,
            }
            for sim, ep in scored[:n]
        ]

    def get(self, episode_id: str) -> Optional[Episode]:
        return self._episodes.get(episode_id)

    def list_recent(self, n: int = 10) -> list[Episode]:
        sorted_eps = sorted(
            self._episodes.values(),
            key=lambda e: e.timestamp,
            reverse=True,
        )
        return sorted_eps[:n]

    def count(self) -> int:
        return len(self._episodes)

    def _persist(self, episode: Episode) -> None:
        filepath = self._path / f"{episode.episode_id}.json"
        with open(filepath, "w") as f:
            json.dump(episode.to_dict(), f, indent=2)

    def _load(self) -> None:
        for filepath in self._path.glob("*.json"):
            try:
                with open(filepath) as f:
                    data = json.load(f)
                embedding = _make_embedding(f"{data.get('summary', '')} {data.get('outcome', '')}")
                episode = Episode(
                    episode_id=data["episode_id"],
                    flight_id=data.get("flight_id", ""),
                    timestamp=data.get("timestamp", ""),
                    embedding=embedding,
                    summary=data.get("summary", ""),
                    outcome=data.get("outcome", ""),
                    metadata=data.get("metadata", {}),
                )
                self._episodes[episode.episode_id] = episode
            except (json.JSONDecodeError, KeyError) as exc:
                logger.warning("EpisodicMemory: skipping corrupt file %s: %s", filepath.name, exc)
        logger.info("EpisodicMemory: loaded %d episodes from %s", len(self._episodes), self._path)


# ── Layer 3: Skill Memory (learned patterns, JSON) ──────────────────────


@dataclass
class SkillPattern:
    pattern_id: str
    skill_name: str
    context_signature: str
    success_rate: float
    avg_duration_s: float
    use_count: int
    last_used: str
    conditions: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "pattern_id": self.pattern_id,
            "skill_name": self.skill_name,
            "context_signature": self.context_signature,
            "success_rate": self.success_rate,
            "avg_duration_s": self.avg_duration_s,
            "use_count": self.use_count,
            "last_used": self.last_used,
            "conditions": self.conditions,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SkillPattern:
        return cls(
            pattern_id=data["pattern_id"],
            skill_name=data["skill_name"],
            context_signature=data["context_signature"],
            success_rate=data.get("success_rate", 0.0),
            avg_duration_s=data.get("avg_duration_s", 0.0),
            use_count=data.get("use_count", 0),
            last_used=data.get("last_used", ""),
            conditions=data.get("conditions", {}),
        )


class SkillMemory:
    """Learned skill patterns stored as persistent JSON.

    Maps context signatures to skill configurations that worked well.
    """

    def __init__(self, storage_path: str | Path):
        self._path = Path(storage_path).expanduser().resolve() / "skill_memory.json"
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._patterns: dict[str, SkillPattern] = {}
        self._load()

    def learn(self, skill_name: str, context: dict[str, Any], duration_s: float, success: bool) -> SkillPattern:
        signature = self._make_signature(context)
        existing = self._find_by_signature(skill_name, signature)

        if existing:
            old = existing
            new_count = old.use_count + 1
            new_rate = ((old.success_rate * old.use_count) + (1.0 if success else 0.0)) / new_count
            new_duration = ((old.avg_duration_s * old.use_count) + duration_s) / new_count
            existing.use_count = new_count
            existing.success_rate = round(new_rate, 4)
            existing.avg_duration_s = round(new_duration, 2)
            existing.last_used = _iso_now()
            existing.conditions = context
            pattern = existing
        else:
            pattern = SkillPattern(
                pattern_id=str(uuid.uuid4()),
                skill_name=skill_name,
                context_signature=signature,
                success_rate=1.0 if success else 0.0,
                avg_duration_s=round(duration_s, 2),
                use_count=1,
                last_used=_iso_now(),
                conditions=context,
            )
            self._patterns[pattern.pattern_id] = pattern

        self._save()
        return pattern

    def recall(self, skill_name: str, context: dict[str, Any]) -> Optional[SkillPattern]:
        signature = self._make_signature(context)
        return self._find_by_signature(skill_name, signature)

    def best_for(self, skill_name: str) -> Optional[SkillPattern]:
        candidates = [p for p in self._patterns.values() if p.skill_name == skill_name]
        if not candidates:
            return None
        return max(candidates, key=lambda p: (p.success_rate, p.use_count))

    def list_skills(self) -> list[str]:
        return sorted(set(p.skill_name for p in self._patterns.values()))

    def stats(self) -> dict[str, Any]:
        return {
            "total_patterns": len(self._patterns),
            "skill_names": self.list_skills(),
        }

    def _find_by_signature(self, skill_name: str, signature: str) -> Optional[SkillPattern]:
        for p in self._patterns.values():
            if p.skill_name == skill_name and p.context_signature == signature:
                return p
        return None

    def _make_signature(self, context: dict[str, Any]) -> str:
        return json.dumps(context, sort_keys=True)

    def _save(self) -> None:
        data = [p.to_dict() for p in self._patterns.values()]
        with open(self._path, "w") as f:
            json.dump(data, f, indent=2)

    def _load(self) -> None:
        if self._path.exists():
            try:
                with open(self._path) as f:
                    data = json.load(f)
                for item in data:
                    pattern = SkillPattern.from_dict(item)
                    self._patterns[pattern.pattern_id] = pattern
            except (json.JSONDecodeError, KeyError) as exc:
                logger.warning("SkillMemory: corrupt file %s: %s", self._path.name, exc)
        logger.info("SkillMemory: loaded %d patterns from %s", len(self._patterns), self._path)


# ── Layer 4: World Memory (environment model, SQLite) ───────────────────


class WorldMemory:
    """Environment model stored in SQLite with geo schema.

    Tables:
    - terrain: elevation data points
    - obstacles: known obstacles with position and height
    - no_fly_zones: restricted areas (polygons)
    - weather_patterns: historical/local weather data
    """

    def __init__(self, db_path: str | Path):
        self._db_path = Path(db_path).expanduser().resolve() / "world_memory.db"
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    # ── Schema ───────────────────────────────────────────────────────────

    def _init_db(self) -> None:
        conn = sqlite3.connect(str(self._db_path))
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS terrain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                elevation_m REAL NOT NULL,
                source TEXT DEFAULT 'survey',
                recorded_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS obstacles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                height_m REAL NOT NULL,
                radius_m REAL DEFAULT 5.0,
                obstacle_type TEXT DEFAULT 'unknown',
                recorded_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS no_fly_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                polygon_json TEXT NOT NULL,
                altitude_min_m REAL DEFAULT 0,
                altitude_max_m REAL DEFAULT 5000,
                restriction_type TEXT DEFAULT 'permanent',
                active INTEGER DEFAULT 1,
                recorded_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS weather_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                wind_speed_ms REAL,
                wind_direction_deg REAL,
                visibility_m REAL,
                temperature_c REAL,
                recorded_at TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_terrain_pos ON terrain(lat, lon)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_obstacles_pos ON obstacles(lat, lon)")
        conn.commit()
        conn.close()

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        return conn

    # ── Terrain ──────────────────────────────────────────────────────────

    def store_terrain(self, lat: float, lon: float, elevation_m: float,
                      source: str = "survey") -> int:
        conn = self._conn()
        cursor = conn.execute(
            "INSERT INTO terrain (lat, lon, elevation_m, source, recorded_at) VALUES (?, ?, ?, ?, ?)",
            (lat, lon, elevation_m, source, _iso_now()),
        )
        conn.commit()
        rid = cursor.lastrowid
        conn.close()
        return rid

    def get_elevation(self, lat: float, lon: float) -> Optional[float]:
        conn = self._conn()
        row = conn.execute(
            "SELECT elevation_m FROM terrain ORDER BY ABS(lat - ?) + ABS(lon - ?) LIMIT 1",
            (lat, lon),
        ).fetchone()
        conn.close()
        return row["elevation_m"] if row else None

    # ── Obstacles ────────────────────────────────────────────────────────

    def store_obstacle(self, lat: float, lon: float, height_m: float,
                       radius_m: float = 5.0, obstacle_type: str = "unknown") -> int:
        conn = self._conn()
        cursor = conn.execute(
            "INSERT INTO obstacles (lat, lon, height_m, radius_m, obstacle_type, recorded_at) VALUES (?, ?, ?, ?, ?, ?)",
            (lat, lon, height_m, radius_m, obstacle_type, _iso_now()),
        )
        conn.commit()
        rid = cursor.lastrowid
        conn.close()
        return rid

    def get_obstacles_near(self, lat: float, lon: float, radius_deg: float = 0.01) -> list[dict[str, Any]]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM obstacles WHERE ABS(lat - ?) < ? AND ABS(lon - ?) < ?",
            (lat, radius_deg, lon, radius_deg),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # ── No-fly zones ─────────────────────────────────────────────────────

    def store_no_fly_zone(self, name: str, polygon: list[Position],
                          alt_min: float = 0, alt_max: float = 5000,
                          restriction_type: str = "permanent") -> int:
        from .cerebellum import Position
        poly_data = [{"lat": p.lat, "lon": p.lon} for p in polygon]
        conn = self._conn()
        cursor = conn.execute(
            "INSERT INTO no_fly_zones (name, polygon_json, altitude_min_m, altitude_max_m, restriction_type, active, recorded_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
            (name, json.dumps(poly_data), alt_min, alt_max, restriction_type, _iso_now()),
        )
        conn.commit()
        rid = cursor.lastrowid
        conn.close()
        return rid

    def is_in_no_fly_zone(self, lat: float, lon: float, alt: float) -> list[dict[str, Any]]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM no_fly_zones WHERE active = 1 AND altitude_min_m <= ? AND altitude_max_m >= ?",
            (alt, alt),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # ── Weather ──────────────────────────────────────────────────────────

    def store_weather(self, lat: float, lon: float, wind_speed_ms: Optional[float] = None,
                      wind_direction_deg: Optional[float] = None,
                      visibility_m: Optional[float] = None,
                      temperature_c: Optional[float] = None) -> int:
        conn = self._conn()
        cursor = conn.execute(
            "INSERT INTO weather_patterns (lat, lon, wind_speed_ms, wind_direction_deg, visibility_m, temperature_c, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (lat, lon, wind_speed_ms, wind_direction_deg, visibility_m, temperature_c, _iso_now()),
        )
        conn.commit()
        rid = cursor.lastrowid
        conn.close()
        return rid

    def recent_weather(self, lat: float, lon: float, hours: int = 24) -> list[dict[str, Any]]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM weather_patterns WHERE ABS(lat - ?) < 0.1 AND ABS(lon - ?) < 0.1 ORDER BY recorded_at DESC LIMIT ?",
            (lat, lon, hours),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_stats(self) -> dict[str, int]:
        conn = self._conn()
        counts = {
            "terrain_points": conn.execute("SELECT COUNT(*) FROM terrain").fetchone()[0],
            "obstacles": conn.execute("SELECT COUNT(*) FROM obstacles").fetchone()[0],
            "no_fly_zones": conn.execute("SELECT COUNT(*) FROM no_fly_zones").fetchone()[0],
            "weather_records": conn.execute("SELECT COUNT(*) FROM weather_patterns").fetchone()[0],
        }
        conn.close()
        return counts


# ── Unified Facade ──────────────────────────────────────────────────────


class AgentMemory:
    """Unified facade over the 4-layer memory architecture.

    Provides a single API: store(), recall(), learn(), consolidate().
    """

    def __init__(self, base_path: str | Path):
        base = Path(base_path).expanduser().resolve()
        base.mkdir(parents=True, exist_ok=True)

        self.working = WorkingMemory()
        self.episodic = EpisodicMemory(base / "episodic")
        self.skill = SkillMemory(base / "skill")
        self.world = WorldMemory(base / "world")

        logger.info("AgentMemory initialized at %s", base)

    def store(self, key: str, data: Any,
              memory_type: str = "working",
              metadata: Optional[dict[str, Any]] = None) -> Optional[str]:
        """Store data in the appropriate memory layer.

        Args:
            key: Identifier for the data.
            data: Data to store.
            memory_type: One of 'working', 'episodic', 'skill', 'world'.
            metadata: Optional metadata for episodic/skill storage.

        Returns:
            Storage ID for persistent layers, None for working memory.
        """
        if memory_type == "working":
            self.working.set(key, data)
            return None
        elif memory_type == "episodic":
            summary = str(data)[:200] if not isinstance(data, str) else data[:200]
            outcome = (metadata or {}).get("outcome", "unknown")
            return self.episodic.store(key, summary, outcome, metadata)
        elif memory_type == "skill":
            pattern = self.skill.learn(
                skill_name=key,
                context=(metadata or {}).get("context", {}),
                duration_s=(metadata or {}).get("duration_s", 0.0),
                success=(metadata or {}).get("success", True),
            )
            return pattern.pattern_id
        elif memory_type == "world":
            return None
        else:
            raise ValueError(f"Unknown memory_type: {memory_type}")

    def recall(self, query: str, memory_type: str = "episodic", n: int = 5) -> list[dict[str, Any]]:
        """Search across memory layers.

        Args:
            query: Search text or key.
            memory_type: 'episodic' (vector search), 'skill', or 'working'.
            n: Number of results.

        Returns:
            List of matching records.
        """
        if memory_type == "working":
            val = self.working.get(query)
            return [{"key": query, "value": val}] if val is not None else []
        elif memory_type == "episodic":
            return self.episodic.recall(query, n)
        elif memory_type == "skill":
            pattern = self.skill.best_for(query)
            return [pattern.to_dict()] if pattern else []
        else:
            return []

    def learn(self, skill_name: str, context: dict[str, Any],
              duration_s: float, success: bool) -> SkillPattern:
        """Record a skill execution outcome for future optimization."""
        return self.skill.learn(skill_name, context, duration_s, success)

    def consolidate(self) -> dict[str, Any]:
        """Across all memory layers, produce a consolidation report."""
        report = {
            "working": {"keys": self.working.keys(), "size": self.working.size},
            "episodic": {"count": self.episodic.count()},
            "skill": self.skill.stats(),
            "world": self.world.get_stats(),
            "timestamp": _iso_now(),
        }
        logger.info("Memory consolidation: %d episodes, %d skill patterns",
                     report["episodic"]["count"], report["skill"]["total_patterns"])
        return report

    def clear_working(self) -> None:
        self.working.clear()
        logger.debug("Working memory cleared")
