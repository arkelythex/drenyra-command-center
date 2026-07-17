"""Andino CLI — Typer-based command line interface.

Replaces the old argparse implementation. Auto-generated help,
type validation, and subcommand groups via Typer.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Annotated, Optional

import typer

from . import __version__
from .project import init_project, load_project_config, load_project_state, ensure_project
from .engine import PhaseEngine, PHASE_ORDER, PHASE_DESCRIPTIONS
from .models import ModelRouter
from .memory import MemoryStore
from .skills import SkillRegistry
from .displays import (
    print_logo,
    print_header,
    print_table,
    print_status_dashboard,
    print_success,
    print_error,
    print_warning,
    print_info,
    PHASE_ICONS,
)

# ── Typer app ────────────────────────────────────────────────────────────────

app = typer.Typer(
    name="andino",
    help="Andino Drone Lab — AI-driven drone engineering pipeline.",
    rich_markup_mode="rich",
)

phases_app = typer.Typer(name="phases", help="Phase management commands.")
app.add_typer(phases_app)

model_app = typer.Typer(name="model", help="Model routing management.")
app.add_typer(model_app)

skills_app = typer.Typer(name="skills", help="Skill registry management.")
app.add_typer(skills_app)

memory_app = typer.Typer(name="memory", help="Persistent memory management.")
app.add_typer(memory_app)


# ── Shared mission option types (reused across commands) ─────────────────────

MissionPayload = Annotated[int, typer.Option(help="Minimum payload in grams")]
MissionAltitude = Annotated[int, typer.Option(help="Target altitude in meters AMSL")]
MissionFlightTime = Annotated[int, typer.Option(help="Minimum flight time in minutes")]
MissionMaxCost = Annotated[int, typer.Option(help="Maximum budget in USD")]
MissionType = Annotated[str, typer.Option(help="Mission type (survey / cargo / inspection)")]
MissionPopulation = Annotated[int, typer.Option(help="Evolution population size")]
MissionGenerations = Annotated[int, typer.Option(help="Evolution generations count")]
MissionIterations = Annotated[int, typer.Option("--iterations", "-i", help="Evolution loop iterations (design→simulate→feedback)")]


def _mission_reqs(
    payload: int = 500,
    altitude: int = 4000,
    flight_time: int = 15,
    max_cost: int = 2000,
    mission_type: str = "survey",
    population: int = 50,
    generations: int = 30,
) -> dict:
    """Convert CLI flags into mission requirements dict."""
    return {
        "min_payload_g": payload,
        "target_altitude_m": altitude,
        "min_flight_time_min": flight_time,
        "max_cost_usd": max_cost,
        "mission_type": mission_type,
        "population_size": population,
        "generations": generations,
    }


def _load_engine(
    ctx: typer.Context,
    mission_reqs: Optional[dict] = None,
) -> PhaseEngine:
    """Load PhaseEngine for the current project directory."""
    project_dir = Path.cwd()
    try:
        engine = PhaseEngine(project_dir, mission_requirements=mission_reqs or {})
    except FileNotFoundError:
        print_error(f"No Andino project found in {project_dir}.")
        print_info("Run: andino init --name <project-name>")
        raise typer.Exit(1)
    return engine


# ═══════════════════════════════════════════════════════════════════════════════
# Error handler
# ═══════════════════════════════════════════════════════════════════════════════


_no_project_msg = "[red]ERROR:[/red] No Andino project found."


# ═══════════════════════════════════════════════════════════════════════════════
# COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════


@app.command()
def init(
    name: Annotated[str, typer.Option(help="Project name")] = "My Drone",
    description: Annotated[str, typer.Option(help="Project description")] = "",
):
    """Initialise a new Andino project in the current directory."""
    print_logo()
    print_header("INITIALISE PROJECT")
    project_dir = Path.cwd()
    init_project(project_dir, name, description)
    print_success(f"Project '{name}' initialised in {project_dir}")
    print_info("Start with: andino explore \"your mission description\"")


# ── Single-phase commands ────────────────────────────────────────────────────


@app.command()
def explore(
    mission: Annotated[str, typer.Argument(help="Mission description")] = "",
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
):
    """Phase 1: Explore mission requirements."""
    engine = _load_engine(None)
    engine.execute("explore", force=force, skip_confirm=yes,
                   mission_requirements={"mission_description": mission} if mission else None)


@app.command()
def propose(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 2: Generate 3–5 drone morphology proposals."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("propose", force=force, skip_confirm=yes)


@app.command()
def spec(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 3: Formal engineering specification."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("spec", force=force, skip_confirm=yes)


@app.command()
def design(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 4: Evolutionary morphology optimisation + CAD."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("design", force=force, skip_confirm=yes)


@app.command()
def simulate(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 5: Multi-physics simulation."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("simulate", force=force, skip_confirm=yes)


@app.command()
def build(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 6: Generate BOM and assembly instructions."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("build", force=force, skip_confirm=yes)


@app.command()
def fly(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 7: Execute autonomous flight with agentic runtime."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("fly", force=force, skip_confirm=yes)


@app.command()
def verify(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 8: Compare actual vs predicted performance."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("verify", force=force, skip_confirm=yes)


@app.command()
def archive(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmation")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
):
    """Phase 9: Persist all data to memory for future iterations."""
    engine = _load_engine(None, _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations))
    engine.execute("archive", force=force, skip_confirm=yes)


# ── Pipeline command ─────────────────────────────────────────────────────────


@app.command()
def pipeline(
    mission: Annotated[str, typer.Argument(help="Mission description")] = "",
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip all confirmations")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution ignoring deps")] = False,
    payload: MissionPayload = 500,
    altitude: MissionAltitude = 4000,
    flight_time: MissionFlightTime = 15,
    max_cost: MissionMaxCost = 2000,
    mission_type: MissionType = "survey",
    population: MissionPopulation = 50,
    generations: MissionGenerations = 30,
    iterations: MissionIterations = 1,
):
    """Run full SDD pipeline end-to-end (explore → archive).

    Auto-initialises a project if none exists in the current directory.

    When --iterations/-i > 1, runs an autonomous evolution loop:
    design → simulate → feedback for N iterations before the final build/fly/verify/archive.
    """
    project_dir = Path.cwd()

    # Auto-init if needed
    if not (project_dir / ".andino").exists():
        print_info("No project found. Initialising…")
        name = mission[:40] if mission else "Andino Mission"
        init_project(project_dir, name, mission)
        print_success(f"Project '{name}' initialised.")
        print()

    mission_req = _mission_reqs(payload, altitude, flight_time, max_cost, mission_type, population, generations)
    if mission:
        mission_req["mission_description"] = mission

    engine = _load_engine(None, mission_req)
    ctx = engine.run_pipeline(
        mission_description=mission,
        force=force,
        skip_confirm=yes,
        iterations=iterations,
    )

    if ctx.successful:
        print_success("Pipeline completed successfully.")
    else:
        print_warning("Pipeline completed with some issues. Check phase outputs.")


# ── Status and history ───────────────────────────────────────────────────────


@app.command()
def status():
    """Show current project status dashboard."""
    project_dir = Path.cwd()
    try:
        ensure_project(project_dir)
    except FileNotFoundError as e:
        print_error(str(e))
        raise typer.Exit(1)

    config = load_project_config(project_dir)
    state = load_project_state(project_dir)
    engine = _load_engine(None)
    status_data = engine.status()

    print_status_dashboard(config, state, PHASE_ORDER, PHASE_DESCRIPTIONS)

    next_phase = status_data.get("next_phase")
    if next_phase:
        from rich.text import Text
        print_info(f"Next phase: [bold green]{next_phase}[/bold green]")
        print_info(f"  → {PHASE_DESCRIPTIONS.get(next_phase, '')}")
    else:
        print_success("All phases complete!")


@app.command()
def history():
    """Show project phase history."""
    project_dir = Path.cwd()
    try:
        ensure_project(project_dir)
    except FileNotFoundError as e:
        print_error(str(e))
        raise typer.Exit(1)

    engine = _load_engine(None)
    entries = engine.history()

    print_header("PROJECT HISTORY")

    if not entries:
        print_info("No phases completed yet.")
        return

    for entry in entries:
        icon = PHASE_ICONS.get(entry["phase"], "•")
        status_str = "[green]✓ Completed[/green]" if entry["completed"] else "[yellow]○ Pending[/yellow]"
        print_info(f"  {icon} {entry['phase'].upper():<12} {status_str}")
        print_info(f"      {entry['description']}")
        print()


# ── Phases subcommands ───────────────────────────────────────────────────────


@phases_app.command("list")
def phases_list():
    """List all 9 SDD phases with descriptions and dependencies."""
    from .engine import PHASE_DEPENDENCIES, PHASE_ESTIMATED_DURATION

    print_header("PHASES OVERVIEW")
    rows = []
    for i, phase in enumerate(PHASE_ORDER, 1):
        deps = ", ".join(PHASE_DEPENDENCIES.get(phase, [])) or "—"
        rows.append([
            str(i),
            phase,
            PHASE_DESCRIPTIONS.get(phase, ""),
            PHASE_ESTIMATED_DURATION.get(phase, "—"),
            deps,
        ])
    print_table(["#", "Phase", "Description", "Duration", "Depends On"], rows)


@phases_app.command("run")
def phases_run(
    from_phase: Annotated[str, typer.Option("--from", help="Starting phase")] = "explore",
    to_phase: Annotated[str, typer.Option("--to", help="Ending phase")] = "archive",
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip confirmations")] = False,
    force: Annotated[bool, typer.Option("--force", "-f", help="Force execution")] = False,
):
    """Execute a range of phases sequentially."""
    engine = _load_engine(None)

    if not (yes or force):
        print_header(f"PHASE RANGE: {from_phase} → {to_phase}")
        print_info(f"This will execute phases: {from_phase} through {to_phase}")
        from rich.prompt import Confirm
        if not Confirm.ask("  Continue?"):
            print_warning("Cancelled.")
            raise typer.Exit(0)

    skip = yes or force
    engine.execute_range(from_phase, to_phase, force=force, skip_confirm=skip)


# ── Model subcommands ────────────────────────────────────────────────────────


@model_app.command("set")
def model_set(
    phase: Annotated[str, typer.Option(help="Phase to assign model to")],
    model: Annotated[str, typer.Option(help="Model name (e.g., claude-opus-4)")],
    provider: Annotated[str, typer.Option(help="Provider name")] = "anthropic",
):
    """Set the AI model for a specific phase."""
    if phase not in PHASE_ORDER:
        print_error(f"Unknown phase: {phase}")
        raise typer.Exit(1)

    project_dir = Path.cwd()
    try:
        ensure_project(project_dir)
    except FileNotFoundError as e:
        print_error(str(e))
        raise typer.Exit(1)

    dot_andino = project_dir / ".andino"
    router = ModelRouter.load_config(dot_andino / "models.json")
    router.set_model(phase, provider, model)
    router.save_config(dot_andino / "models.json")
    print_success(f"Model for '{phase}' set to {provider}/{model}")


@model_app.command("list")
def model_list():
    """List current model assignments per phase."""
    project_dir = Path.cwd()
    try:
        ensure_project(project_dir)
    except FileNotFoundError as e:
        print_error(str(e))
        raise typer.Exit(1)

    dot_andino = project_dir / ".andino"
    router = ModelRouter.load_config(dot_andino / "models.json")

    print_header("MODEL ASSIGNMENTS")
    rows = []
    for phase, provider, model, reason in router.list_models():
        rows.append([phase, provider, model, reason])
    print_table(["Phase", "Provider", "Model", "Reasoning"], rows)


# ── Skills subcommands ───────────────────────────────────────────────────────


@skills_app.command("list")
def skills_list(
    phase: Annotated[Optional[str], typer.Option(help="Filter by phase")] = None,
):
    """List available skills, optionally filtered by phase."""
    project_dir = Path.cwd()
    dot_andino = project_dir / ".andino"

    skills_dir = None
    try:
        ensure_project(project_dir)
        skills_dir = dot_andino / "skills"
    except FileNotFoundError:
        pass

    registry = SkillRegistry.load_from_dir(skills_dir) if skills_dir else SkillRegistry()

    print_header("AVAILABLE SKILLS")
    skills = registry.list_skills(filter_by_phase=phase)

    if not skills:
        print_info("No skills found.")
        return

    rows = []
    for name, desc in skills:
        skill = registry.get_skill(name)
        phases_str = ", ".join(skill.get("phases", []))
        model_name = skill.get("model", "—")
        rows.append([name, desc[:60], model_name, phases_str])

    print_table(["Name", "Description", "Model", "Phases"], rows)


@skills_app.command("add")
def skills_add(
    name: Annotated[str, typer.Option(help="Skill name")],
    file: Annotated[Path, typer.Option(help="Path to skill JSON definition")],
):
    """Add a custom skill from a JSON definition file."""
    project_dir = Path.cwd()
    dot_andino = project_dir / ".andino"

    try:
        ensure_project(project_dir)
    except FileNotFoundError:
        print_error("No Andino project found.")
        raise typer.Exit(1)

    if not file.exists():
        print_error(f"Skill file not found: {file}")
        raise typer.Exit(1)

    try:
        with open(file) as f:
            definition = json.load(f)
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON: {e}")
        raise typer.Exit(1)

    registry = SkillRegistry()
    try:
        registry.add_skill(name, definition)
    except ValueError as e:
        print_error(str(e))
        raise typer.Exit(1)

    skills_dir = dot_andino / "skills"
    skills_dir.mkdir(parents=True, exist_ok=True)
    skill_file = skills_dir / f"{name}.json"
    with open(skill_file, "w") as f:
        json.dump(definition, f, indent=2)
    print_success(f"Skill '{name}' saved to {skill_file}")


# ── Memory subcommands ───────────────────────────────────────────────────────


@memory_app.command("search")
def memory_search(
    query: Annotated[str, typer.Argument(help="Search query")],
):
    """Search persistent memory for past results and learnings."""
    project_dir = Path.cwd()
    try:
        ensure_project(project_dir)
    except FileNotFoundError as e:
        print_error(str(e))
        raise typer.Exit(1)

    dot_andino = project_dir / ".andino"
    mem = MemoryStore(dot_andino / "memory")

    print_header(f"MEMORY SEARCH: '{query}'")
    results = mem.search(query)

    if not results:
        print_info(f"No results for '{query}'.")
        return

    for r in results:
        tags = ", ".join(r.get("tags", []))
        from rich.text import Text
        rid_short = r["id"][:8]
        print_info(f"  [bold cyan]{rid_short}[/bold cyan] [bold]{r['key']}[/bold]")
        print_info(f"       Tags: {tags or '—'}")
        print_info(f"       Created: {r.get('created_at', '—')}")
        if r.get("data"):
            preview = json.dumps(r["data"], indent=2)[:200]
            print_info(f"       Data: {preview}")
        print()


@memory_app.command("stats")
def memory_stats():
    """Show memory storage statistics."""
    project_dir = Path.cwd()
    try:
        ensure_project(project_dir)
    except FileNotFoundError as e:
        print_error(str(e))
        raise typer.Exit(1)

    dot_andino = project_dir / ".andino"
    mem = MemoryStore(dot_andino / "memory")

    print_header("MEMORY STATISTICS")
    stats = mem.stats()
    print_info(f"  Total records:    [bold green]{stats['total_records']}[/bold green]")
    print_info(f"  Total documents:  {stats['total_documents']}")
    print()
    if stats.get("tags"):
        print_info("Top tags:")
        for tag, count in stats["tags"][:10]:
            print_info(f"    {tag:<30} {count}")
        print()
    if stats.get("recent"):
        print_info("Recent entries:")
        for r in stats["recent"]:
            print_info(f"    {r['key']:<30} {r['created_at']}")


# ── Entry point ──────────────────────────────────────────────────────────────


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    version: Annotated[bool, typer.Option("--version", help="Show version and exit")] = False,
):
    """Andino Drone Lab — AI-driven drone engineering pipeline."""
    if version:
        print(f"Andino Orchestrator v{__version__}")
        raise typer.Exit()
    if ctx.invoked_subcommand is None:
        print_logo()
        print_info("Use [bold]andino --help[/bold] for available commands.")
        print_info("Start with: [bold]andino init --name 'My Project'[/bold]")


if __name__ == "__main__":
    app()
