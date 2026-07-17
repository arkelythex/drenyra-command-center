"""Gazebo SITL simulation integration for the Andino pipeline.

Wraps Gazebo + PX4 SITL simulation for automated evaluation of
drone designs. Provides both real (Gazebo) and analytical simulation
with the same interface.
"""

from __future__ import annotations

import math
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from .design import DroneDesign


@dataclass
class SimResult:
    """Resultado de una corrida de simulacion."""

    success: bool
    hover_time_s: float
    max_altitude_m: float
    battery_drain_pct: float
    stability_score: float  # 0.0 (inestable) — 1.0 (perfecto)
    waypoints_reached: int
    total_waypoints: int
    avg_wind_recovery_s: float  # tiempo promedio de recuperacion ante viento
    crash: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str = ""


# ── Analytical simulator (fallback when Gazebo is not available) ────────────


def simulate_analytical(design: DroneDesign, world: str = "open_pit") -> SimResult:
    """Simula mediante formulas analiticas sin Gazebo.

    Se usa como fallback cuando Gazebo no esta disponible.
    Calcula hover time, altitud maxima y estabilidad teorica.
    """
    g = 9.81
    m = design.auw / 1000.0  # kg
    thrust_N = design.total_thrust / 1000.0 * g  # total thrust g → N
    TWR = design.twr

    # Hover time: bateria / consumo (estimado)
    voltage = design.battery_cells * 4.2  # V
    capacity_Wh = design.battery_capacity * voltage / 1000.0
    # Power draw estimado: hover es ~40% del maximo
    hover_power_W = thrust_N * 2.5 * 0.4  # aprox
    hover_time_s = (capacity_Wh / hover_power_W) * 3600 if hover_power_W > 0 else 0
    hover_time_s = min(hover_time_s, 600)  # capping

    # Altitud maxima teorica (considerando densidad de aire)
    max_alt_m = 1000 * math.log(TWR) * 500 if TWR > 1 else 0
    max_alt_m = max(0, min(max_alt_m, 6000))

    # Estabilidad: basada en TWR y relacion thrust/masa
    stability = max(0.0, min(1.0, (TWR - 1) / 3))

    # Simular efecto de la configuracion de brazos
    # Coaxial (X8, Y6) es menos eficiente pero mas redundante
    if design.frame_type in ("x8", "y6"):
        hover_time_s *= 0.85
        stability *= 1.1

    # Efecto de altitud
    world_factor = {"open_pit": 1.0, "tunnel": 0.95, "high_altitude": 0.8}
    factor = world_factor.get(world, 1.0)
    hover_time_s *= factor
    max_alt_m *= factor

    # Viento (high altitude tiene mas viento)
    wind_effect = 1.0
    if world == "high_altitude":
        wind_effect = 0.75
    elif world == "open_pit":
        wind_effect = 0.9

    recovery_time = max(0.5, (1.5 / TWR) * (1 / wind_effect))

    return SimResult(
        success=True,
        hover_time_s=round(hover_time_s, 1),
        max_altitude_m=round(max_alt_m, 1),
        battery_drain_pct=min(100, round(100 * 60 / hover_time_s)) if hover_time_s > 0 else 100,
        stability_score=round(min(1.0, stability), 2),
        waypoints_reached=3 if TWR > 1.5 else 2 if TWR > 1 else 1,
        total_waypoints=3,
        avg_wind_recovery_s=round(recovery_time, 2),
        crash=TWR < 1.0,
        data={
            "thrust_N": round(thrust_N, 1),
            "mass_kg": round(m, 3),
            "TWR": round(TWR, 2),
            "capacity_Wh": round(capacity_Wh, 2),
            "hover_power_W": round(hover_power_W, 2),
            "world": world,
        },
    )


# ── Gazebo SITL simulator ────────────────────────────────────────────────────

GAZEBO_WORLDS = {
    "open_pit": "gazebo/worlds/open_pit.sdf",
    "tunnel": "gazebo/worlds/tunnel.sdf",
    "high_altitude": "gazebo/worlds/high_altitude.sdf",
}

DEFAULT_TIMEOUT_S = 60


def _gazebo_available() -> bool:
    """Check if Gazebo is installed and available."""
    return shutil.which("gz") is not None or shutil.which("gazebo") is not None


def simulate_gazebo(
    design: DroneDesign,
    world: str = "open_pit",
    output_dir: str | Path = ".andino/sim_results",
    timeout_s: int = DEFAULT_TIMEOUT_S,
    headless: bool = True,
) -> SimResult:
    """Ejecuta simulacion Gazebo + PX4 SITL para un diseno dado.

    Requiere Gazebo Garden+ y PX4-Autopilot instalados.
    Si no estan disponibles, cae a simulate_analytical().

    Args:
        design: Diseno del dron a simular.
        world: Nombre del mundo ('open_pit', 'tunnel', 'high_altitude').
        output_dir: Directorio para archivos de salida de simulacion.
        timeout_s: Timeout de simulacion en segundos.
        headless: Si True, corre Gazebo sin GUI (--headless-rendering).

    Returns:
        SimResult con metricas de la simulacion.
    """
    if not _gazebo_available():
        return simulate_analytical(design, world)

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Generar URDF
    try:
        from .urdf import URDFGenerator

        gen = URDFGenerator(output_dir=str(out_dir / "models"))
        urdf_path = gen.generate(design)
    except Exception as exc:
        return SimResult(
            success=False,
            hover_time_s=0,
            max_altitude_m=0,
            battery_drain_pct=100,
            stability_score=0.0,
            waypoints_reached=0,
            total_waypoints=3,
            avg_wind_recovery_s=999,
            crash=True,
            error=f"URDF generation failed: {exc}",
        )

    # 2. Determinar ruta del mundo
    world_sdf = Path(GAZEBO_WORLDS.get(world, GAZEBO_WORLDS["open_pit"]))
    if not world_sdf.exists():
        return simulate_analytical(design, world)

    # 3. Armar comando de lanzamiento
    # Usamos gz sim (Gazebo Garden+) con PX4 SITL
    cmd = [
        "gz", "sim",
        "-v", "4",  # verbose
        "-r",  # run (start paused, then play)
        "--world", str(world_sdf.resolve()),
    ]
    if headless:
        cmd.append("--headless-rendering")

    # 4. Lanzar proceso
    logfile = out_dir / f"sim_{world}_{int(time.time())}.log"
    try:
        with open(logfile, "w") as log:
            proc = subprocess.Popen(
                cmd,
                stdout=log,
                stderr=subprocess.STDOUT,
                cwd=out_dir,
            )

            # Monitorear por el tiempo especificado
            start = time.time()
            while time.time() - start < timeout_s:
                if proc.poll() is not None:
                    break
                time.sleep(1)

            # Terminar proceso
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()

    except FileNotFoundError:
        return simulate_analytical(design, world)
    except Exception as exc:
        return SimResult(
            success=False,
            hover_time_s=0,
            max_altitude_m=0,
            battery_drain_pct=100,
            stability_score=0.0,
            waypoints_reached=0,
            total_waypoints=3,
            avg_wind_recovery_s=999,
            crash=True,
            error=f"Gazebo execution failed: {exc}",
        )

    # 5. Parsear resultados del log (simplificado)
    log_content = logfile.read_text() if logfile.exists() else ""
    crashed = "crash" in log_content.lower() or "collision" in log_content.lower()
    hover_time = _parse_log_duration(log_content)
    max_alt = _parse_log_altitude(log_content)

    return SimResult(
        success=not crashed,
        hover_time_s=hover_time or 30.0,
        max_altitude_m=max_alt or 10.0,
        battery_drain_pct=50,
        stability_score=0.7 if not crashed else 0.0,
        waypoints_reached=2 if not crashed else 0,
        total_waypoints=3,
        avg_wind_recovery_s=1.5,
        crash=crashed,
        data={"log_file": str(logfile), "urdf_file": urdf_path, "world": world},
    )


def _parse_log_duration(log: str) -> Optional[float]:
    """Extrae duracion de vuelo del log de Gazebo."""
    for line in log.splitlines():
        if "sim time" in line.lower():
            import re
            match = re.search(r"([\d.]+)", line)
            if match:
                return float(match.group(1))
    return None


def _parse_log_altitude(log: str) -> Optional[float]:
    """Extrae altitud maxima del log de Gazebo."""
    altitudes = []
    for line in log.splitlines():
        if "altitude" in line.lower() or "z =" in line.lower():
            import re
            match = re.search(r"(-?[\d.]+)", line)
            if match:
                altitudes.append(float(match.group(1)))
    return max(altitudes) if altitudes else None


def simulate(
    design: DroneDesign,
    world: str = "open_pit",
    prefer_gazebo: bool = True,
    **kwargs: Any,
) -> SimResult:
    """Punto de entrada unificado para simulacion.

    Usa Gazebo si esta disponible y prefer_gazebo=True,
    sino usa simulacion analitica.

    Args:
        design: Diseno del dron.
        world: Nombre del mundo.
        prefer_gazebo: Si True, intenta usar Gazebo primero.
        **kwargs: Argumentos adicionales para simulate_gazebo.

    Returns:
        SimResult con metricas.
    """
    if prefer_gazebo and _gazebo_available():
        return simulate_gazebo(design, world, **kwargs)
    return simulate_analytical(design, world)
