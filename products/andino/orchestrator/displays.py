"""Display utilities — powered by Rich.

Replaces the old colorama + manual table/progress implementation
with Rich's Console, Table, Progress, and Prompt.
All function signatures preserved for backward compat.
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta
from typing import Any, Optional

from rich.console import Console
from rich.table import Table
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
)
from rich.prompt import Confirm
from rich.panel import Panel
from rich.text import Text
from rich.style import Style as RichStyle
from rich.columns import Columns
from rich import box

# ── Single console instance ──────────────────────────────────────────────────
_console = Console()

# ── Backward-compat color/style aliases ───────────────────────────────────────


class _FakeStyle:
    """Provides attribute-style access like colorama Fore/Style/Back."""

    def __init__(self, prefix: str = "") -> None:
        self._prefix = prefix

    def __getattr__(self, name: str) -> str:
        return f"<{self._prefix}:{name}>"


# These are purely for backward compat if any code does `Fore.RED`.
# The actual styling is handled by Rich internally.
Fore = _FakeStyle("Fore")
Back = _FakeStyle("Back")
Style = _FakeStyle("Style")

# ── Phase icons ──────────────────────────────────────────────────────────────

PHASE_ICONS = {
    "explore": "🔍",
    "propose": "💡",
    "spec": "📋",
    "design": "🎨",
    "simulate": "🔄",
    "build": "🔧",
    "fly": "🚁",
    "verify": "✅",
    "archive": "📦",
}

LOGO = """
        █████╗ ███╗   ██╗██████╗ ██╗███╗   ██╗ ██████╗
       ██╔══██╗████╗  ██║██╔══██╗██║████╗  ██║██╔═══██╗
       ███████║██╔██╗ ██║██║  ██║██║██╔██╗ ██║██║   ██║
       ██╔══██║██║╚██╗██║██║  ██║██║██║╚██╗██║██║   ██║
       ██║  ██║██║ ╚████║██████╔╝██║██║ ╚████║╚██████╔╝
       ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝
               D R O N E   L A B   —   v0.1.0
"""


# ── Public API ───────────────────────────────────────────────────────────────


def colorize(text: str, color: Any = None, style: Any = None) -> str:
    """Return text string; Rich handles styling natively in console output.
    This is a no-op string wrapper for backward compat."""
    return text


def print_logo() -> None:
    """Print the Andino logo panel."""
    panel = Panel(
        Text(LOGO.strip("\n"), style="bold cyan"),
        border_style="dim cyan",
        padding=(0, 2),
    )
    _console.print(panel)


def print_header(title: str, char: str = "═") -> None:
    """Print a section header."""
    _console.rule(f"[bold cyan]{title}[/bold cyan]", style="cyan", characters=char)
    _console.print()


def print_phase_info(phase: str, description: str) -> None:
    """Print phase information."""
    icon = PHASE_ICONS.get(phase, "•")
    _console.print(f"  {icon} [bold cyan]{phase.upper()}[/bold cyan]")
    _console.print(f"    {description}")
    _console.print()


def print_table(
    headers: list[str],
    rows: list[list[str]],
    max_width: int | None = None,
) -> None:
    """Print a table using Rich's Table."""
    table = Table(
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
        width=max_width,
    )
    for h in headers:
        table.add_column(h)

    for row in rows:
        table.add_row(*[str(c) for c in row])

    _console.print(table)
    _console.print()


def print_status_dashboard(
    config: dict,
    state: dict,
    phases: list[str],
    phase_descriptions: dict[str, str],
) -> None:
    """Print project status dashboard."""
    print_logo()
    print_header("PROJECT STATUS")

    _console.print(f"  [bold]Name:[/bold]        {config.get('name', 'Untitled')}")
    _console.print(f"  [bold]Description:[/bold] {config.get('description', '—')}")
    _console.print(f"  [bold]Created:[/bold]    {config.get('created_at', '—')}")
    _console.print(f"  [bold]Updated:[/bold]    {config.get('updated_at', '—')}")
    _console.print()

    print_header("PHASE PROGRESS")

    current = state.get("current_phase", "none")
    completed = set(state.get("phases_completed", []))

    for phase in phases:
        icon = PHASE_ICONS.get(phase, "•")
        desc = phase_descriptions.get(phase, "")
        if phase in completed:
            status = "[green bold]✓ DONE[/green bold]"
        elif phase == current:
            status = "[yellow bold]► ACTIVE[/yellow bold]"
        else:
            status = "[dim]○ PENDING[/dim]"

        _console.print(
            f"  {icon} [bold]{phase:<12}[/bold] {status}  — {desc}"
        )
    _console.print()

    model_assignments = state.get("models", {})
    if model_assignments:
        print_header("MODEL ASSIGNMENTS")
        for phase, info in model_assignments.items():
            _console.print(
                f"  {phase:<12} → {info.get('provider', '?')}/{info.get('model', '?')}  ({info.get('reasoning', '?')})"
            )
        _console.print()

    memory = state.get("memory", {})
    print_header("MEMORY STATS")
    _console.print(f"  Records:    {memory.get('total_records', '—')}")
    _console.print(f"  Skills:     {len(state.get('skills', {}))}")
    _console.print()


def print_progress(current: int, total: int, label: str = "") -> None:
    """Progress display using Rich Progress."""
    # Simple inline — for engine.py's simulated execution steps
    pct = current / total * 100 if total > 0 else 0
    bar_len = 30
    filled = int(bar_len * pct / 100)
    bar = "█" * filled + "░" * (bar_len - filled)
    _console.print(f"\r  {label} [{bar}] {pct:5.1f}%  ({current}/{total})", end="")
    if current >= total:
        _console.print()


def confirm_action(prompt: str, default: bool = True) -> bool:
    """Confirm action using Rich's Confirm prompt."""
    result = Confirm.ask(f"  [yellow]?[/yellow] {prompt}", default=default)
    return result


def print_error(msg: str) -> None:
    """Print error message."""
    _console.print(f"\n  [red bold]ERROR:[/red bold] {msg}\n", file=sys.stderr)


def print_warning(msg: str) -> None:
    """Print warning message."""
    _console.print(f"\n  [yellow bold]WARNING:[/yellow bold] {msg}\n")


def print_success(msg: str) -> None:
    """Print success message."""
    _console.print(f"\n  [green bold]✓[/green bold] {msg}\n")


def print_info(msg: str) -> None:
    """Print info message."""
    _console.print(f"  [cyan]i[/cyan] {msg}")
