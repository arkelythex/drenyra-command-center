from __future__ import annotations

import json
from copy import deepcopy
from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass
class SkillParam:
    """A single input or output parameter for a skill."""

    name: str
    type: str  # string | number | boolean | gps_coord | polygon | file
    description: str
    required: bool = True
    default: Any = None

    def validate_value(self, value: Any) -> tuple[bool, str]:
        if self.required and value is None:
            return False, f"'{self.name}' is required"
        if value is None:
            return True, ""

        type_map = {
            "string": str,
            "number": (int, float),
            "boolean": bool,
            "gps_coord": dict,
            "polygon": list,
            "file": str,
        }
        expected = type_map.get(self.type)
        if expected is None:
            return True, ""
        if not isinstance(value, expected):
            return False, f"'{self.name}' expected {self.type}, got {type(value).__name__}"
        return True, ""


@dataclass
class SkillDefinition:
    """Complete definition of a skill shared between design-time and flight-time."""

    name: str
    description: str
    category: str  # engineering | flight | safety | analysis
    inputs: list[SkillParam] = field(default_factory=list)
    outputs: list[SkillParam] = field(default_factory=list)
    model: str = "claude-sonnet-4"
    phase: str = "design"
    tags: list[str] = field(default_factory=list)
    version: str = "1.0.0"
    author: str = "andino"
    dependencies: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "inputs": [asdict(p) for p in self.inputs],
            "outputs": [asdict(p) for p in self.outputs],
            "model": self.model,
            "phase": self.phase,
            "tags": self.tags[:],
            "version": self.version,
            "author": self.author,
            "dependencies": self.dependencies[:],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SkillDefinition:
        inputs = [SkillParam(**p) if isinstance(p, dict) else p for p in data.get("inputs", [])]
        outputs = [SkillParam(**p) if isinstance(p, dict) else p for p in data.get("outputs", [])]
        return cls(
            name=data["name"],
            description=data.get("description", ""),
            category=data.get("category", "engineering"),
            inputs=inputs,
            outputs=outputs,
            model=data.get("model", "claude-sonnet-4"),
            phase=data.get("phase", "design"),
            tags=data.get("tags", []),
            version=data.get("version", "1.0.0"),
            author=data.get("author", "andino"),
            dependencies=data.get("dependencies", []),
        )

    def clone(self) -> SkillDefinition:
        return deepcopy(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_json(cls, raw: str) -> SkillDefinition:
        return cls.from_dict(json.loads(raw))
