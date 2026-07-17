from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .definitions import SkillDefinition


class SkillMarketplace:
    """Platform for sharing and discovering drone engineering skills.

    Like MCP Marketplace but for drone skills.
    Skills can be:
    - Public (community contributed)
    - Private (team-only)
    - Premium (verified, commercial)
    """

    # Built-in sources for common skill repositories
    DEFAULT_SOURCES = {
        "andino-official": "https://skills.andino.io/api/v1",
        "community": "https://skills.andino.io/community",
    }

    def __init__(self, local_dir: Optional[str | Path] = None):
        self._local_dir = Path(local_dir).expanduser().resolve() if local_dir else Path.home() / ".andino" / "skills"
        self._local_dir.mkdir(parents=True, exist_ok=True)
        self._installed: dict[str, SkillDefinition] = {}
        self._metadata: dict[str, dict[str, Any]] = {}
        self._sources: dict[str, str] = dict(self.DEFAULT_SOURCES)
        self._load_installed()

    def _load_installed(self) -> None:
        for fpath in sorted(self._local_dir.glob("*.json")):
            try:
                with open(fpath) as f:
                    data = json.load(f)
                skill = SkillDefinition.from_dict(data)
                self._installed[skill.name] = skill
            except (json.JSONDecodeError, KeyError) as e:
                import warnings
                warnings.warn(f"Skipping invalid installed skill file {fpath}: {e}")

    def _save_metadata(self) -> None:
        meta = {
            name: {
                "name": name,
                "version": skill.version,
                "category": skill.category,
                "author": skill.author,
                "installed_at": self._metadata.get(name, {}).get("installed_at", datetime.now(timezone.utc).isoformat()),
                "source": self._metadata.get(name, {}).get("source", "local"),
                "rating": self._metadata.get(name, {}).get("rating", 0),
                "install_count": self._metadata.get(name, {}).get("install_count", 1),
                "visibility": self._metadata.get(name, {}).get("visibility", "private"),
            }
            for name, skill in self._installed.items()
        }
        meta_path = self._local_dir / "marketplace_meta.json"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

    def publish(self, skill_def: SkillDefinition, visibility: str = "public") -> dict[str, Any]:
        if visibility not in ("public", "private", "premium"):
            raise ValueError(f"Invalid visibility: {visibility}. Must be public, private, or premium")

        filepath = self._local_dir / f"{skill_def.name}.json"
        filepath.write_text(skill_def.to_json())

        self._installed[skill_def.name] = skill_def
        self._metadata[skill_def.name] = {
            "installed_at": datetime.now(timezone.utc).isoformat(),
            "source": "local",
            "rating": 0,
            "install_count": 1,
            "visibility": visibility,
        }
        self._save_metadata()

        return {
            "name": skill_def.name,
            "version": skill_def.version,
            "visibility": visibility,
            "path": str(filepath),
        }

    def install(self, skill_name: str, source: str = "registry") -> SkillDefinition:
        if source == "registry":
            return self._install_from_registry(skill_name)
        if source.startswith("http://") or source.startswith("https://"):
            return self._install_from_url(skill_name, source)
        if Path(source).exists():
            return self._install_from_file(skill_name, source)
        raise ValueError(f"Unknown source: {source}")

    def _install_from_registry(self, skill_name: str) -> SkillDefinition:
        for url in self._sources.values():
            try:
                skill = self._install_from_url(skill_name, url)
                return skill
            except Exception:
                continue
        raise FileNotFoundError(f"Skill '{skill_name}' not found in any configured registry source")

    def _install_from_url(self, skill_name: str, url: str) -> SkillDefinition:
        import warnings
        warnings.warn(
            f"Remote installation from '{url}' is not yet implemented. "
            f"Download the skill JSON file and use install(skill_name, source='/path/to/file.json')"
        )
        raise NotImplementedError("Remote skill installation is not yet implemented")

    def _install_from_file(self, skill_name: str, filepath: str) -> SkillDefinition:
        source = Path(filepath)
        if not source.exists():
            raise FileNotFoundError(f"Skill file not found: {source}")

        with open(source) as f:
            data = json.load(f)
        skill = SkillDefinition.from_dict(data)

        if skill.name != skill_name:
            warnings.warn(
                f"Skill name in file ('{skill.name}') differs from requested name ('{skill_name}')"
            )

        target_path = self._local_dir / f"{skill.name}.json"
        target_path.write_text(skill.to_json())

        self._installed[skill.name] = skill
        self._metadata[skill.name] = {
            "installed_at": datetime.now(timezone.utc).isoformat(),
            "source": str(source),
            "rating": 0,
            "install_count": 1,
            "visibility": "private",
        }
        self._save_metadata()
        return skill

    def search(self, query: str, category: Optional[str] = None) -> list[dict[str, Any]]:
        q = query.lower()
        results: list[tuple[dict[str, Any], int]] = []

        for name, skill in self._installed.items():
            if category and skill.category != category:
                continue

            meta = self._metadata.get(name, {})
            score = 0
            if q in name.lower():
                score += 10
            if q in skill.description.lower():
                score += 5
            for tag in skill.tags:
                if q in tag.lower():
                    score += 3

            if score > 0:
                results.append(({
                    "name": name,
                    "description": skill.description,
                    "category": skill.category,
                    "version": skill.version,
                    "author": skill.author,
                    "tags": skill.tags[:],
                    "rating": meta.get("rating", 0),
                    "visibility": meta.get("visibility", "private"),
                }, score))

        results.sort(key=lambda x: (-x[1], -x[0].get("rating", 0), x[0]["name"]))
        return [r[0] for r in results]

    def rate(self, skill_name: str, rating: int) -> None:
        if skill_name not in self._installed:
            raise KeyError(f"Skill '{skill_name}' is not installed")
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")

        meta = self._metadata.setdefault(skill_name, {})
        old = meta.get("rating", 0)
        count = meta.get("rating_count", 0)
        new_total = old * count + rating
        new_count = count + 1
        meta["rating"] = round(new_total / new_count, 1)
        meta["rating_count"] = new_count
        self._save_metadata()

    def get_top(self, category: Optional[str] = None, n: int = 10) -> list[dict[str, Any]]:
        candidates = []
        for name, skill in self._installed.items():
            if category and skill.category != category:
                continue
            meta = self._metadata.get(name, {})
            candidates.append({
                "name": name,
                "description": skill.description,
                "category": skill.category,
                "version": skill.version,
                "rating": meta.get("rating", 0),
                "install_count": meta.get("install_count", 0),
                "visibility": meta.get("visibility", "private"),
            })

        candidates.sort(key=lambda x: (-x["rating"], -x["install_count"], x["name"]))
        return candidates[:n]

    def add_source(self, name: str, url: str) -> None:
        self._sources[name] = url

    def remove_source(self, name: str) -> None:
        self._sources.pop(name, None)

    def list_sources(self) -> dict[str, str]:
        return dict(self._sources)

    def list_installed(self) -> list[dict[str, Any]]:
        return [
            {
                "name": name,
                "description": skill.description,
                "category": skill.category,
                "version": skill.version,
                "author": skill.author,
                "visibility": self._metadata.get(name, {}).get("visibility", "private"),
                "installed_at": self._metadata.get(name, {}).get("installed_at", "unknown"),
            }
            for name, skill in sorted(self._installed.items())
        ]

    def uninstall(self, skill_name: str) -> bool:
        if skill_name not in self._installed:
            return False
        del self._installed[skill_name]
        self._metadata.pop(skill_name, None)
        skill_file = self._local_dir / f"{skill_name}.json"
        if skill_file.exists():
            skill_file.unlink()
        self._save_metadata()
        return True
