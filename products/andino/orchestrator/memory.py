import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


class MemoryStore:
    def __init__(self, base_path: Path):
        self._base = Path(base_path).expanduser().resolve()
        self._db_path = self._base / "memory.db"
        self._docs_dir = self._base / "documents"
        self._docs_dir.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self._db_path))
        conn.execute("""
            CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                doc_path TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                tag TEXT NOT NULL,
                record_id TEXT NOT NULL,
                PRIMARY KEY (tag, record_id)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_records_key ON records(key)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag)")
        conn.commit()
        conn.close()

    def save(self, key: str, data: Any, tags: Optional[list[str]] = None) -> str:
        now = datetime.now(timezone.utc).isoformat()
        record_id = str(uuid.uuid4())
        tags = tags or []

        # Write document
        doc_name = f"{record_id}.json"
        doc_path = self._docs_dir / doc_name
        with open(doc_path, "w") as f:
            json.dump({"key": key, "data": data, "tags": tags, "created_at": now}, f, indent=2)

        # Write record
        conn = sqlite3.connect(str(self._db_path))
        conn.execute(
            "INSERT OR REPLACE INTO records (id, key, tags, doc_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (record_id, key, json.dumps(tags), str(doc_path.relative_to(self._base)), now, now),
        )
        for tag in tags:
            conn.execute("INSERT OR IGNORE INTO tags (tag, record_id) VALUES (?, ?)", (tag, record_id))
        conn.commit()
        conn.close()

        return record_id

    def load(self, key: str) -> list[dict[str, Any]]:
        conn = sqlite3.connect(str(self._db_path))
        rows = conn.execute("SELECT id, key, tags, doc_path, created_at FROM records WHERE key = ? ORDER BY created_at DESC", (key,)).fetchall()
        conn.close()

        results = []
        for row in rows:
            doc_path = self._base / row[3]
            data = {}
            if doc_path.exists():
                with open(doc_path) as f:
                    data = json.load(f)
            results.append({
                "id": row[0],
                "key": row[1],
                "tags": json.loads(row[2]),
                "created_at": row[4],
                "data": data.get("data"),
            })
        return results

    def search(self, query: str, tag_filter: Optional[list[str]] = None, limit: int = 20) -> list[dict[str, Any]]:
        conn = sqlite3.connect(str(self._db_path))

        sql = """
            SELECT DISTINCT r.id, r.key, r.tags, r.doc_path, r.created_at
            FROM records r
            WHERE (
                r.key LIKE ? 
                OR r.id LIKE ?
                OR EXISTS (SELECT 1 FROM tags t WHERE t.record_id = r.id AND t.tag LIKE ?)
            )
        """
        params = [f"%{query}%", f"%{query}%", f"%{query}%"]

        if tag_filter:
            placeholders = ",".join("?" for _ in tag_filter)
            sql += f" AND r.id IN (SELECT record_id FROM tags WHERE tag IN ({placeholders}))"
            params.extend(tag_filter)

        sql += " ORDER BY r.created_at DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(sql, params).fetchall()
        conn.close()

        results = []
        for row in rows:
            doc_path = self._base / row[3]
            data = {}
            if doc_path.exists():
                with open(doc_path) as f:
                    data = json.load(f)
            results.append({
                "id": row[0],
                "key": row[1],
                "tags": json.loads(row[2]),
                "created_at": row[4],
                "data": data.get("data"),
            })
        return results

    def stats(self) -> dict[str, Any]:
        conn = sqlite3.connect(str(self._db_path))
        total = conn.execute("SELECT COUNT(*) FROM records").fetchone()[0]
        tag_rows = conn.execute("SELECT tag, COUNT(*) as cnt FROM tags GROUP BY tag ORDER BY cnt DESC LIMIT 20").fetchall()
        recent = conn.execute("SELECT key, created_at FROM records ORDER BY created_at DESC LIMIT 5").fetchall()
        conn.close()

        doc_count = len(list(self._docs_dir.glob("*.json")))

        return {
            "total_records": total,
            "total_documents": doc_count,
            "tags": [(t[0], t[1]) for t in tag_rows],
            "recent": [{"key": r[0], "created_at": r[1]} for r in recent],
        }

    def delete(self, record_id: str) -> bool:
        conn = sqlite3.connect(str(self._db_path))
        row = conn.execute("SELECT doc_path FROM records WHERE id = ?", (record_id,)).fetchone()
        if row is None:
            conn.close()
            return False

        doc_path = self._base / row[0]
        if doc_path.exists():
            doc_path.unlink()

        conn.execute("DELETE FROM tags WHERE record_id = ?", (record_id,))
        conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
        conn.commit()
        conn.close()
        return True
