import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


# ── Pipeline Data Model ──────────────────────────────────────────────────────


@dataclass
class PhaseResult:
    """Resultado tipado de la ejecucion de una fase del pipeline."""
    phase: str
    status: str  # "completed" | "cancelled" | "failed"
    output_path: Optional[Path] = None
    model: dict[str, str] = field(default_factory=dict)
    summary: str = ""
    key_findings: list[str] = field(default_factory=list)
    data: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    duration_s: float = 0.0
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    def __getitem__(self, key: str) -> Any:
        """Allow dict-style access (result["phase"]) for backward compat with tests."""
        return getattr(self, key)

    def __setitem__(self, key: str, value: Any) -> None:
        setattr(self, key, value)

    def __contains__(self, key: str) -> bool:
        return hasattr(self, key)

    def to_dict(self) -> dict[str, Any]:
        """Return dict compatible with existing test expectations."""
        return {
            "phase": self.phase,
            "status": self.status,
            "output_path": str(self.output_path) if self.output_path else None,
            "model": self.model,
            "summary": self.summary,
            "key_findings": self.key_findings,
            "data": self.data,
            "error": self.error,
            "duration_s": self.duration_s,
            "timestamp": self.timestamp,
        }


class PipelineContext:
    """Contexto mutable que transporta datos entre fases del pipeline.

    Cada fase lee del contexto lo que necesita y escribe su resultado.
    El pipeline completo (explore → archive) construye este contexto
    paso a paso.
    """

    def __init__(self, mission_requirements: dict[str, Any] | None = None) -> None:
        self.mission_requirements: dict[str, Any] = mission_requirements or {}
        self.results: dict[str, PhaseResult] = {}
        self.start_time: str = datetime.now(timezone.utc).isoformat()

        # Datos estructurados que fluyen entre fases
        self.mission_analysis: dict[str, Any] = {}
        self.design_proposals: list[dict[str, Any]] = []
        self.design_spec: dict[str, Any] = {}
        self.design_result: dict[str, Any] = {}
        self.simulation_results: dict[str, Any] = {}
        self.build_artifacts: dict[str, Any] = {}
        self.flight_result: dict[str, Any] = {}
        self.verification_report: dict[str, Any] = {}
        self.archive_ref: str = ""

    def add_result(self, result: PhaseResult) -> None:
        """Almacena el resultado de una fase y extrae datos estructurados."""
        self.results[result.phase] = result
        if result.data:
            attr_map = {
                "explore": "mission_analysis",
                "propose": "design_proposals",
                "spec": "design_spec",
                "design": "design_result",
                "simulate": "simulation_results",
                "build": "build_artifacts",
                "fly": "flight_result",
                "verify": "verification_report",
                "archive": "archive_ref",
            }
            attr = attr_map.get(result.phase)
            if attr:
                setattr(self, attr, result.data)

    def get_result(self, phase: str) -> Optional[PhaseResult]:
        return self.results.get(phase)

    @property
    def completed_phases(self) -> list[str]:
        return [p for p, r in self.results.items() if r.status == "completed"]

    @property
    def successful(self) -> bool:
        return all(r.status == "completed" for r in self.results.values())

    def to_dict(self) -> dict[str, Any]:
        return {
            "mission_requirements": self.mission_requirements,
            "start_time": self.start_time,
            "results": {p: r.to_dict() for p, r in self.results.items()},
            "completed_phases": self.completed_phases,
        }


# ── Original model routing code ──────────────────────────────────────────────


MODEL_ROUTING: dict[str, dict[str, str]] = {
    "explore":  {"provider": "openai",    "model": "gpt-4o-mini",       "reasoning": "low"},
    "propose":  {"provider": "anthropic", "model": "claude-sonnet-4",   "reasoning": "medium"},
    "spec":     {"provider": "anthropic", "model": "claude-sonnet-4",   "reasoning": "medium"},
    "design":   {"provider": "anthropic", "model": "claude-opus-4",     "reasoning": "high"},
    "simulate": {"provider": "local",     "model": "simulation-engine", "reasoning": "n/a"},
    "build":    {"provider": "anthropic", "model": "claude-sonnet-4",   "reasoning": "medium"},
    "fly":      {"provider": "local",     "model": "px4-autopilot",     "reasoning": "n/a"},
    "verify":   {"provider": "anthropic", "model": "claude-sonnet-4",   "reasoning": "medium"},
    "archive":  {"provider": "openai",    "model": "gpt-4o-mini",       "reasoning": "low"},
}


class ModelRouter:
    def __init__(self, routing: Optional[dict[str, dict[str, str]]] = None):
        self._routing = {}
        for phase, cfg in (routing or MODEL_ROUTING).items():
            self._routing[phase] = dict(cfg)

    def get_model(self, phase: str) -> dict[str, str]:
        cfg = self._routing.get(phase)
        if cfg is None:
            raise KeyError(f"Unknown phase: {phase}")
        return dict(cfg)

    def set_model(self, phase: str, provider: str, model: str) -> None:
        if phase in self._routing:
            self._routing[phase]["provider"] = provider
            self._routing[phase]["model"] = model
        else:
            self._routing[phase] = {"provider": provider, "model": model, "reasoning": "medium"}

    def list_models(self) -> list[tuple[str, str, str, str]]:
        return [
            (phase, cfg["provider"], cfg["model"], cfg["reasoning"])
            for phase, cfg in self._routing.items()
        ]

    def save_config(self, config_path: Path) -> None:
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w") as f:
            json.dump(self._routing, f, indent=2)

    @classmethod
    def load_config(cls, config_path: Path) -> "ModelRouter":
        if config_path.exists():
            with open(config_path) as f:
                data = json.load(f)
            return cls(data)
        return cls()

    def to_dict(self) -> dict[str, dict[str, str]]:
        return {k: dict(v) for k, v in self._routing.items()}
