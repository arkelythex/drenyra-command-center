from __future__ import annotations

import json
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any, Optional

from .definitions import SkillDefinition
from .registry import SkillRegistry


@dataclass
class ValidationResult:
    """Result of skill validation against provided parameters."""

    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def merge(self, other: ValidationResult) -> ValidationResult:
        return ValidationResult(
            valid=self.valid and other.valid,
            errors=self.errors + other.errors,
            warnings=self.warnings + other.warnings,
        )


@dataclass
class SkillPipeline:
    """An executable pipeline compiled from a skill definition and parameters."""

    skill_name: str
    skill_definition: SkillDefinition
    params: dict[str, Any]
    resolved_dependencies: list[str] = field(default_factory=list)
    execution_order: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "skill_name": self.skill_name,
            "params": dict(self.params),
            "resolved_dependencies": self.resolved_dependencies[:],
            "execution_order": self.execution_order[:],
        }


class SkillCompiler:
    """Compiles skill definitions into executable pipelines.

    Validates:
    - All required inputs present
    - No circular dependencies
    - Input/output type matching
    - Phase compatibility

    Can detect dependency cycles and inform the caller of the minimum
    transitive skill graph needed to run a given skill.
    """

    def __init__(self, registry: SkillRegistry):
        self._registry = registry

    def compile(self, skill_name: str, params: dict[str, Any]) -> SkillPipeline:
        skill = self._registry.get(skill_name)
        resolved = self.resolve_dependencies(skill_name)
        graph = self.get_execution_graph(skill_name, resolved)

        return SkillPipeline(
            skill_name=skill_name,
            skill_definition=skill,
            params=dict(params),
            resolved_dependencies=resolved,
            execution_order=graph,
        )

    def validate(self, skill_name: str, params: dict[str, Any]) -> ValidationResult:
        errors: list[str] = []
        warnings: list[str] = []

        try:
            skill = self._registry.get(skill_name)
        except KeyError as e:
            return ValidationResult(valid=False, errors=[str(e)])

        for inp in skill.inputs:
            value = params.get(inp.name)
            ok, msg = inp.validate_value(value)
            if not ok:
                errors.append(msg)

        extra = set(params.keys()) - {i.name for i in skill.inputs}
        if extra:
            warnings.append(f"Unexpected parameters provided: {', '.join(sorted(extra))}")

        deps_result = self._validate_dependencies(skill_name)
        result = ValidationResult(valid=not errors, errors=errors, warnings=warnings)
        if deps_result is not None:
            result = result.merge(deps_result)

        if not result.valid:
            return result

        for dep_name in skill.dependencies:
            try:
                dep_skill = self._registry.get(dep_name)
            except KeyError:
                result.errors.append(f"Dependency '{dep_name}' not found in registry")
                result.valid = False
                continue

            dep_phase_ok = self._check_phase_compatibility(skill.phase, dep_skill.phase)
            if not dep_phase_ok:
                warnings.append(
                    f"Dependency '{dep_name}' has phase '{dep_skill.phase}', "
                    f"which may not be compatible with '{skill.phase}'"
                )

        return result

    def _validate_dependencies(self, skill_name: str) -> Optional[ValidationResult]:
        """Check for circular dependencies within the dependency graph."""
        visited: set[str] = set()
        stack: set[str] = set()
        errors: list[str] = []

        def _visit(name: str) -> None:
            if name in stack:
                path = " -> ".join(list(stack) + [name])
                errors.append(f"Circular dependency detected: {path}")
                return
            if name in visited:
                return
            visited.add(name)
            stack.add(name)
            try:
                skill = self._registry._skills[name]
            except KeyError:
                errors.append(f"Dependency '{name}' not found in registry")
                stack.discard(name)
                return
            for dep in skill.dependencies:
                _visit(dep)
            stack.discard(name)

        _visit(skill_name)
        if errors:
            return ValidationResult(valid=False, errors=errors)
        return None

    def resolve_dependencies(self, skill_name: str) -> list[str]:
        """Resolve all transitive dependencies in execution order.

        Returns a topological ordering of the dependency graph.
        Raises ValueError if a circular dependency is detected.
        """
        skill = self._registry.get(skill_name)
        graph: dict[str, set[str]] = {}
        visited: set[str] = set()

        def _build_graph(name: str) -> None:
            if name in visited:
                return
            visited.add(name)
            try:
                s = self._registry._skills[name]
            except KeyError:
                raise KeyError(f"Dependency '{name}' not found")
            graph[name] = set(s.dependencies)
            for dep in s.dependencies:
                _build_graph(dep)

        _build_graph(skill_name)

        # Topological sort (Kahn's algorithm)
        in_degree: dict[str, int] = {n: 0 for n in graph}
        for node in graph:
            for dep in graph[node]:
                if dep in in_degree:
                    in_degree[dep] += 1

        queue = [n for n in graph if in_degree[n] == 0]
        ordered: list[str] = []

        while queue:
            node = queue.pop(0)
            ordered.append(node)
            for dep in graph.get(node, set()):
                if dep in in_degree:
                    in_degree[dep] -= 1
                    if in_degree[dep] == 0:
                        queue.append(dep)

        if len(ordered) != len(graph):
            raise ValueError(f"Circular dependency detected in skill '{skill_name}' dependency graph")

        return ordered

    def get_execution_graph(self, skill_name: str, resolved: Optional[list[str]] = None) -> list[str]:
        """Get the execution order for a skill and its dependencies.

        The skill itself is last (executed after all dependencies).
        """
        if resolved is None:
            resolved = self.resolve_dependencies(skill_name)
        return resolved

    def _check_phase_compatibility(self, phase_a: str, phase_b: str) -> bool:
        from .registry import PHASE_CATEGORIES
        cat_a = PHASE_CATEGORIES.get(phase_a)
        cat_b = PHASE_CATEGORIES.get(phase_b)
        if cat_a == cat_b:
            return True
        if cat_a == "analysis" and cat_b in ("engineering",):
            return False
        if cat_a == "flight" and cat_b == "analysis":
            return False
        return True

    @classmethod
    def from_registry(cls, registry: SkillRegistry) -> SkillCompiler:
        return cls(registry)
