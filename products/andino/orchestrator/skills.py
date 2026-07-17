import json
from pathlib import Path
from typing import Any, Optional

BUILTIN_SKILLS = {
    "morphology_design": {
        "description": "Design drone morphology using evolutionary algorithms",
        "inputs": ["mission_spec", "constraints"],
        "outputs": ["morphology_config", "cad_files"],
        "model": "claude-opus-4",
        "phases": ["design"],
    },
    "propulsion_sizing": {
        "description": "Calculate motor, prop, ESC, battery requirements",
        "inputs": ["mass_budget", "target_twr", "altitude"],
        "outputs": ["propulsion_config"],
        "model": "claude-sonnet-4",
        "phases": ["spec", "design"],
    },
    "structural_analysis": {
        "description": "Analyze frame structural integrity with FEM",
        "inputs": ["frame_geometry", "materials", "load_cases"],
        "outputs": ["structural_report"],
        "model": "simulation",
        "phases": ["simulate"],
    },
    "control_tuning": {
        "description": "Tune PX4 PID parameters for specific morphology",
        "inputs": ["morphology_config", "mass_props"],
        "outputs": ["px4_params"],
        "model": "claude-sonnet-4",
        "phases": ["design", "fly"],
    },
    "flight_planning": {
        "description": "Plan autonomous mission with waypoints and actions",
        "inputs": ["mission_spec", "environment_map"],
        "outputs": ["mission_plan"],
        "model": "claude-sonnet-4",
        "phases": ["fly"],
    },
    "failure_analysis": {
        "description": "Analyze flight data and identify failure modes",
        "inputs": ["flight_logs", "design_spec"],
        "outputs": ["failure_report"],
        "model": "claude-opus-4",
        "phases": ["verify"],
    },
}


class SkillRegistry:
    def __init__(self, custom_skills: Optional[dict[str, dict]] = None):
        self._skills = dict(BUILTIN_SKILLS)
        if custom_skills:
            self._skills.update(custom_skills)

    def list_skills(self, filter_by_phase: Optional[str] = None) -> list[tuple[str, str]]:
        results = []
        for name, skill in self._skills.items():
            if filter_by_phase is None or filter_by_phase in skill.get("phases", []):
                results.append((name, skill["description"]))
        return sorted(results)

    def get_skill(self, name: str) -> dict:
        skill = self._skills.get(name)
        if skill is None:
            raise KeyError(f"Unknown skill: {name}")
        return dict(skill)

    def add_skill(self, name: str, definition: dict) -> None:
        required = {"description", "inputs", "outputs"}
        missing = required - set(definition.keys())
        if missing:
            raise ValueError(f"Skill definition missing required fields: {missing}")
        self._skills[name] = definition

    def execute_skill(self, name: str, context: dict) -> dict:
        skill = self.get_skill(name)

        missing = [i for i in skill.get("inputs", []) if i not in context]
        if missing:
            raise ValueError(f"Missing required inputs for skill '{name}': {missing}")

        return {
            "skill": name,
            "status": "simulated",
            "model": skill.get("model", "unknown"),
            "phases": list(skill.get("phases", [])),
            "estimated_duration_min": self._estimate_duration(skill),
            "context": {k: context[k] for k in skill.get("inputs", []) if k in context},
        }

    def to_dict(self) -> dict[str, dict]:
        return {k: dict(v) for k, v in self._skills.items()}

    @classmethod
    def load_from_dir(cls, skills_dir: Path) -> "SkillRegistry":
        custom = {}
        if skills_dir.exists():
            for fpath in sorted(skills_dir.glob("*.json")):
                try:
                    with open(fpath) as f:
                        skill_data = json.load(f)
                    name = fpath.stem
                    custom[name] = skill_data
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Warning: skipping invalid skill file {fpath}: {e}")
        return cls(custom)

    @staticmethod
    def _estimate_duration(skill: dict) -> int:
        model = skill.get("model", "")
        if "opus" in model:
            return 15
        if "sonnet" in model:
            return 8
        if "mini" in model:
            return 3
        if model == "simulation":
            return 45
        return 10
