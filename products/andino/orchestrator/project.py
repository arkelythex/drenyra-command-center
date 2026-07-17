import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .models import ModelRouter


@dataclass
class ProjectConfig:
    name: str = ""
    description: str = ""
    phases_completed: list[str] = field(default_factory=list)
    current_phase: str = ""
    models: dict = field(default_factory=dict)
    created_at: str = ""
    updated_at: str = ""


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_project(directory: Path, name: str, description: str = "") -> ProjectConfig:
    base = Path(directory).expanduser().resolve()
    dot_andino = base / ".andino"

    dirs = [
        dot_andino,
        dot_andino / "phases" / "explore",
        dot_andino / "phases" / "propose",
        dot_andino / "phases" / "spec",
        dot_andino / "phases" / "design",
        dot_andino / "phases" / "simulate",
        dot_andino / "phases" / "build",
        dot_andino / "phases" / "fly",
        dot_andino / "phases" / "verify",
        dot_andino / "phases" / "archive",
        dot_andino / "logs",
        dot_andino / "memory" / "documents",
    ]

    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)

    now = _timestamp()
    cfg = ProjectConfig(
        name=name,
        description=description,
        phases_completed=[],
        current_phase="explore",
        created_at=now,
        updated_at=now,
    )

    # Write config.json
    with open(dot_andino / "config.json", "w") as f:
        json.dump({
            "name": name,
            "description": description,
            "created_at": now,
            "updated_at": now,
        }, f, indent=2)

    # Write state.json
    with open(dot_andino / "state.json", "w") as f:
        json.dump({
            "current_phase": "explore",
            "phases_completed": [],
            "models": {},
            "memory": {"total_records": 0},
            "skills": {},
        }, f, indent=2)

    # Write default models.json
    router = ModelRouter()
    router.save_config(dot_andino / "models.json")

    return cfg


def load_project_config(directory: Path) -> dict:
    base = Path(directory).expanduser().resolve()
    config_path = base / ".andino" / "config.json"
    if not config_path.exists():
        raise FileNotFoundError(f"No project found in {base}. Run 'andino orchestrator init' first.")
    with open(config_path) as f:
        return json.load(f)


def load_project_state(directory: Path) -> dict:
    base = Path(directory).expanduser().resolve()
    state_path = base / ".andino" / "state.json"
    if not state_path.exists():
        return {"current_phase": "none", "phases_completed": [], "models": {}, "memory": {}, "skills": {}}
    with open(state_path) as f:
        return json.load(f)


def save_project_state(directory: Path, state: dict) -> None:
    base = Path(directory).expanduser().resolve()
    state_path = base / ".andino" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)

    now = _timestamp()
    state["updated_at"] = now
    with open(state_path, "w") as f:
        json.dump(state, f, indent=2)

    # Also update config.json timestamp
    config_path = base / ".andino" / "config.json"
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
        config["updated_at"] = now
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)


def save_phase_output(directory: Path, phase: str, content: str) -> Path:
    base = Path(directory).expanduser().resolve()
    phase_dir = base / ".andino" / "phases" / phase
    phase_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(timezone.utc)
    filename = f"{phase}_{now.strftime('%Y%m%d_%H%M%S')}.md"
    fpath = phase_dir / filename

    with open(fpath, "w") as f:
        f.write(content)

    # Also write to phase.md for easy access
    latest = phase_dir / f"{phase}.md"
    with open(latest, "w") as f:
        f.write(content)

    return fpath


def ensure_project(directory: Path) -> Path:
    base = Path(directory).expanduser().resolve()
    dot_andino = base / ".andino"
    if not dot_andino.exists():
        raise FileNotFoundError(
            f"No Andino project found in {base}.\n"
            "  Run: andino orchestrator init --name <project-name>"
        )
    return dot_andino
