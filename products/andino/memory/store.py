from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


# ── Recognised tag keys that convey semantic meaning ────────────────────
VALID_TAG_KEYS = {"project", "type", "phase", "platform"}


def _validate_tags(tags: Optional[dict[str, str]]) -> dict[str, str]:
    tags = tags or {}
    for key in tags:
        if key not in VALID_TAG_KEYS:
            raise ValueError(f"Invalid tag key: '{key}'. Allowed: {', '.join(sorted(VALID_TAG_KEYS))}")
    return dict(tags)


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class MemoryStore:
    """Unified persistent memory for the Andino platform.

    Uses:
    - SQLite for structured data (designs, flights, skills)
    - JSON files for documents (reports, analyses, specs)
    - Vector embeddings (LanceDB or simple cosine similarity) for semantic search

    All data is tagged with:
    - project: project name
    - type: design | flight | skill | decision | analysis
    - phase: explore | propose | spec | design | simulate | build | fly | verify | archive
    - platform: scout_y6 | heavy_x8 | custom
    - timestamp: ISO datetime
    """

    def __init__(self, base_path: str | Path):
        self._base = Path(base_path).expanduser().resolve()
        self._db_path = self._base / "memory.db"
        self._docs_dir = self._base / "documents"
        self._docs_dir.mkdir(parents=True, exist_ok=True)
        self._init_db()

    # ── Schema ───────────────────────────────────────────────────────────

    def _init_db(self) -> None:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self._db_path))
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL,
                tags_json TEXT DEFAULT '{}',
                doc_path TEXT,
                embedding BLOB,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tag_index (
                tag_key TEXT NOT NULL,
                tag_value TEXT NOT NULL,
                record_id TEXT NOT NULL,
                PRIMARY KEY (tag_key, tag_value, record_id),
                FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_records_key ON records(key)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tag_index_key ON tag_index(tag_key, tag_value)")
        conn.commit()
        conn.close()

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    # ── CRUD ─────────────────────────────────────────────────────────────

    def store(self, key: str, data: Any, tags: Optional[dict[str, str]] = None) -> str:
        """Store a record and return its unique ID."""
        tags = _validate_tags(tags)
        now = _iso_now()
        record_id = str(uuid.uuid4())

        doc_name = f"{record_id}.json"
        doc_path = self._docs_dir / doc_name
        with open(doc_path, "w") as f:
            json.dump({
                "key": key,
                "data": data,
                "tags": tags,
                "created_at": now,
            }, f, indent=2)

        conn = self._conn()
        try:
            conn.execute(
                "INSERT INTO records (id, key, tags_json, doc_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (record_id, key, json.dumps(tags), str(doc_path.relative_to(self._base)), now, now),
            )
            for tag_key, tag_value in tags.items():
                conn.execute(
                    "INSERT OR IGNORE INTO tag_index (tag_key, tag_value, record_id) VALUES (?, ?, ?)",
                    (tag_key, tag_value, record_id),
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

        return record_id

    def load(self, key: str, limit: int = 20) -> list[dict[str, Any]]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT id, key, tags_json, doc_path, created_at FROM records WHERE key = ? ORDER BY created_at DESC LIMIT ?",
            (key, limit),
        ).fetchall()
        conn.close()
        return [self._row_to_result(r) for r in rows]

    def load_by_id(self, record_id: str) -> Optional[dict[str, Any]]:
        conn = self._conn()
        row = conn.execute(
            "SELECT id, key, tags_json, doc_path, created_at FROM records WHERE id = ?",
            (record_id,),
        ).fetchone()
        conn.close()
        if row is None:
            return None
        return self._row_to_result(row)

    def delete(self, record_id: str) -> bool:
        conn = self._conn()
        try:
            row = conn.execute("SELECT doc_path FROM records WHERE id = ?", (record_id,)).fetchone()
            if row is None:
                return False

            doc_path = self._base / row["doc_path"]
            if doc_path.exists():
                doc_path.unlink()

            conn.execute("DELETE FROM tag_index WHERE record_id = ?", (record_id,))
            conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
            conn.commit()
            return True
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    # ── Search ───────────────────────────────────────────────────────────

    def search(self, query: str, tags: Optional[dict[str, str]] = None, limit: int = 10) -> list[dict[str, Any]]:
        """Full-text search across keys and tag values, with optional tag filtering."""
        tags = tags or {}

        conn = self._conn()
        like_pattern = f"%{query}%"

        sql = """
            SELECT DISTINCT r.id, r.key, r.tags_json, r.doc_path, r.created_at
            FROM records r
            WHERE (
                r.key LIKE ?
                OR EXISTS (SELECT 1 FROM tag_index t WHERE t.record_id = r.id AND t.tag_value LIKE ?)
            )
        """
        params: list[Any] = [like_pattern, like_pattern]

        for tag_key, tag_value in tags.items():
            sql += " AND r.id IN (SELECT record_id FROM tag_index WHERE tag_key = ? AND tag_value = ?)"
            params.extend([tag_key, tag_value])

        sql += " ORDER BY r.created_at DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(sql, params).fetchall()
        conn.close()
        return [self._row_to_result(r) for r in rows]

    def search_similar(self, embedding: list[float], n: int = 5) -> list[dict[str, Any]]:
        """Find records whose stored embedding is closest to *embedding*.

        Uses cosine similarity via inline math (works for small datasets).
        For larger datasets, consider LanceDB or FAISS.
        """
        import math

        query_norm = math.sqrt(sum(v * v for v in embedding))
        if query_norm == 0:
            return []
        query_vec = [v / query_norm for v in embedding]

        conn = self._conn()
        rows = conn.execute(
            "SELECT id, key, tags_json, doc_path, created_at, embedding FROM records WHERE embedding IS NOT NULL"
        ).fetchall()
        conn.close()

        scored: list[tuple[float, dict[str, Any]]] = []
        for r in rows:
            raw = r["embedding"]
            if raw is None:
                continue
            stored = list(json.loads(raw))
            stored_norm = math.sqrt(sum(v * v for v in stored))
            if stored_norm == 0:
                continue
            stored_vec = [v / stored_norm for v in stored]

            dot = sum(a * b for a, b in zip(query_vec, stored_vec))
            scored.append((dot, self._row_to_result(r)))

        scored.sort(key=lambda x: -x[0])
        return [r for _, r in scored[:n]]

    def list_by_tags(self, tags: dict[str, str], page: int = 1, per_page: int = 20) -> list[dict[str, Any]]:
        """Paginated listing of records matching all specified tags."""
        if not tags:
            return []

        conn = self._conn()
        conditions = []
        params: list[Any] = []
        for tag_key, tag_value in tags.items():
            conditions.append(
                "r.id IN (SELECT record_id FROM tag_index WHERE tag_key = ? AND tag_value = ?)"
            )
            params.extend([tag_key, tag_value])

        sql = f"""
            SELECT r.id, r.key, r.tags_json, r.doc_path, r.created_at
            FROM records r
            WHERE {' AND '.join(conditions)}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, (page - 1) * per_page])

        rows = conn.execute(sql, params).fetchall()
        conn.close()
        return [self._row_to_result(r) for r in rows]

    # ─── Statistics ──────────────────────────────────────────────────────

    def get_stats(self) -> dict[str, Any]:
        conn = self._conn()
        total = conn.execute("SELECT COUNT(*) FROM records").fetchone()[0]

        type_counts = conn.execute(
            "SELECT tag_value, COUNT(*) as cnt FROM tag_index WHERE tag_key='type' GROUP BY tag_value ORDER BY cnt DESC"
        ).fetchall()

        phase_counts = conn.execute(
            "SELECT tag_value, COUNT(*) as cnt FROM tag_index WHERE tag_key='phase' GROUP BY tag_value ORDER BY cnt DESC"
        ).fetchall()

        recent = conn.execute(
            "SELECT key, created_at FROM records ORDER BY created_at DESC LIMIT 5"
        ).fetchall()
        conn.close()

        return {
            "total_records": total,
            "by_type": {r["tag_value"]: r["cnt"] for r in type_counts},
            "by_phase": {r["tag_value"]: r["cnt"] for r in phase_counts},
            "recent": [{"key": r["key"], "created_at": r["created_at"]} for r in recent],
            "storage_path": str(self._base),
        }

    # ─── Export / Import ─────────────────────────────────────────────────

    def export(self, path: str | Path) -> Path:
        """Export all records as a JSON archive."""
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)

        conn = self._conn()
        rows = conn.execute("SELECT id, key, tags_json, doc_path, created_at, updated_at FROM records").fetchall()
        conn.close()

        records = []
        for r in rows:
            doc_path = self._base / r["doc_path"]
            data = {}
            if doc_path.exists():
                with open(doc_path) as f:
                    data = json.load(f)
            records.append({
                "id": r["id"],
                "key": r["key"],
                "tags": json.loads(r["tags_json"]),
                "data": data.get("data"),
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            })

        with open(target, "w") as f:
            json.dump({"version": "1.0", "records": records}, f, indent=2)

        return target

    def import_data(self, path: str | Path) -> int:
        """Import records from a JSON archive. Returns number of records imported."""
        source = Path(path)
        if not source.exists():
            raise FileNotFoundError(f"Import file not found: {source}")

        with open(source) as f:
            archive = json.load(f)

        count = 0
        for record in archive.get("records", []):
            self.store(
                key=record.get("key", "imported"),
                data=record.get("data"),
                tags=record.get("tags"),
            )
            count += 1
        return count

    # ─── Internals ───────────────────────────────────────────────────────

    def _row_to_result(self, row: sqlite3.Row) -> dict[str, Any]:
        doc_path = self._base / row["doc_path"]
        data = {}
        if doc_path.exists():
            with open(doc_path) as f:
                data = json.load(f)
        return {
            "id": row["id"],
            "key": row["key"],
            "tags": json.loads(row["tags_json"]),
            "created_at": row["created_at"],
            "data": data.get("data"),
        }

    def _update_embedding(self, record_id: str, embedding: list[float]) -> None:
        conn = self._conn()
        conn.execute(
            "UPDATE records SET embedding = ?, updated_at = ? WHERE id = ?",
            (json.dumps(embedding), _iso_now(), record_id),
        )
        conn.commit()
        conn.close()
