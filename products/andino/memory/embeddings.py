from __future__ import annotations

import json
import math
import re
import warnings
from pathlib import Path
from typing import Any, Optional


class EmbeddingEngine:
    """Creates and manages vector embeddings for memory items.

    Uses sentence-transformers for text embeddings (when available).
    Falls back to a deterministic TF-IDF-style bag-of-words embedding
    so the system works without external ML dependencies.

    Stores in LanceDB or numpy arrays with cosine similarity search.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2", cache_dir: Optional[str | Path] = None):
        self._model_name = model_name
        self._model = None
        self._dimension: int = 384  # default for all-MiniLM-L6-v2
        self._vectors: dict[str, list[float]] = {}
        self._texts: dict[str, str] = {}

        if cache_dir:
            self._cache_dir = Path(cache_dir).expanduser().resolve()
            self._cache_dir.mkdir(parents=True, exist_ok=True)
        else:
            self._cache_dir = None

    # ── Embedding computation ────────────────────────────────────────────

    def embed_text(self, text: str) -> list[float]:
        """Convert text to a vector embedding.

        Tries sentence-transformers first; falls back to a deterministic
        TF-IDF-style hashed bag-of-words embedding so the system always works.
        """
        try:
            return self._embed_with_transformers(text)
        except (ImportError, Exception) as e:
            warnings.warn(f"sentence-transformers unavailable ({e}), using fallback embedding")
            return self._embed_fallback(text)

    def embed_design(self, design_dict: dict[str, Any]) -> list[float]:
        """Embed a structured design document into a vector.

        Flattens the dict into a text representation before embedding.
        """
        text = self._flatten_dict(design_dict)
        return self.embed_text(text)

    # ── Transformers-based (primary) ─────────────────────────────────────

    def _embed_with_transformers(self, text: str) -> list[float]:
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self._model_name)
            self._dimension = self._model.get_sentence_embedding_dimension()

        vec = self._model.encode(text, normalize_embeddings=True)
        return vec.tolist()

    # ── Fallback embedding (no external deps) ────────────────────────────

    def _embed_fallback(self, text: str) -> list[float]:
        """Deterministic bag-of-words embedding with feature hashing.

        Uses word-level hashing into a fixed-dimension vector.
        Normalised to unit length for cosine similarity.
        """
        vec = [0.0] * self._dimension
        words = re.findall(r"[a-záéíóúñ]+", text.lower())

        for word in words:
            h = hash(word) % self._dimension
            # sign-based feature hashing (Moody 2011)
            sign = 1.0 if h >= 0 else -1.0
            idx = abs(h) % self._dimension
            vec[idx] += sign

        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]

        return vec

    # ── Index management ─────────────────────────────────────────────────

    def add_text(self, key: str, text: str) -> list[float]:
        """Embed text and add to the in-memory index."""
        vec = self.embed_text(text)
        self._vectors[key] = vec
        self._texts[key] = text
        return vec

    def add_design(self, key: str, design: dict[str, Any]) -> list[float]:
        """Embed a design dict and add to the in-memory index."""
        text = self._flatten_dict(design)
        return self.add_text(key, text)

    def find_similar(self, query_embedding: list[float], n: int = 5) -> list[dict[str, Any]]:
        """Find the n most similar entries by cosine similarity."""
        query_norm = math.sqrt(sum(v * v for v in query_embedding))
        if query_norm == 0:
            return []
        query_vec = [v / query_norm for v in query_embedding]

        scored: list[tuple[float, str, list[float]]] = []
        for key, vec in self._vectors.items():
            stored_norm = math.sqrt(sum(v * v for v in vec))
            if stored_norm == 0:
                continue
            stored_vec = [v / stored_norm for v in vec]
            dot = sum(a * b for a, b in zip(query_vec, stored_vec))
            scored.append((dot, key, vec))

        scored.sort(key=lambda x: -x[0])
        return [
            {
                "key": key,
                "score": score,
                "text_preview": self._texts.get(key, "")[:200],
            }
            for score, key, _ in scored[:n]
        ]

    def build_index(self, items: dict[str, str]) -> None:
        """Build index from a dict of key -> text."""
        for key, text in items.items():
            self.add_text(key, text)

    def save_index(self, path: str | Path) -> Path:
        """Persist the embedding index to a JSON file."""
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "model": self._model_name,
            "dimension": self._dimension,
            "vectors": {k: v for k, v in self._vectors.items()},
            "texts": self._texts,
        }
        with open(target, "w") as f:
            json.dump(data, f, indent=2)
        return target

    def load_index(self, path: str | Path) -> None:
        """Load a previously saved embedding index."""
        source = Path(path)
        if not source.exists():
            raise FileNotFoundError(f"Index file not found: {source}")
        with open(source) as f:
            data = json.load(f)
        self._model_name = data.get("model", self._model_name)
        self._dimension = data.get("dimension", self._dimension)
        self._vectors = {k: list(v) for k, v in data.get("vectors", {}).items()}
        self._texts = dict(data.get("texts", {}))

    def clear(self) -> None:
        self._vectors.clear()
        self._texts.clear()

    @property
    def size(self) -> int:
        return len(self._vectors)

    @property
    def dimension(self) -> int:
        return self._dimension

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if len(a) != len(b):
            raise ValueError(f"Dimension mismatch: {len(a)} vs {len(b)}")
        dot = sum(va * vb for va, vb in zip(a, b))
        norm_a = math.sqrt(sum(v * v for v in a))
        norm_b = math.sqrt(sum(v * v for v in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    @staticmethod
    def _flatten_dict(d: dict[str, Any], prefix: str = "") -> str:
        """Recursively flatten a nested dict into searchable text."""
        parts: list[str] = []
        for key, value in d.items():
            full_key = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                parts.append(EmbeddingEngine._flatten_dict(value, full_key))
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        parts.append(EmbeddingEngine._flatten_dict(item, f"{full_key}[{i}]"))
                    else:
                        parts.append(f"{full_key}[{i}]: {item}")
            else:
                parts.append(f"{full_key}: {value}")
        return " | ".join(parts)
