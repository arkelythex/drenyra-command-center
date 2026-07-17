#!/usr/bin/env python3
"""
AndinoDroneLab — Engineering Payload Calculator

Professional tool for computing thrust-to-weight ratio, payload capacity,
flight time, and altitude de-rating for multirotor configurations.

Usage:
    python3 calculate_payload.py                              # All configs
    python3 calculate_payload.py --config "Andino Heavy-Lift X8"
    python3 calculate_payload.py --compare
    python3 calculate_payload.py --altitude 4000
    python3 calculate_payload.py --json
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

try:
    from tabulate import tabulate  # type: ignore
except ImportError:
    tabulate = None

# ── ANSI terminal colors ────────────────────────────────────────────────

class Style:
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    GRAY = "\033[90m"
    RESET = "\033[0m"

    @staticmethod
    def good(val: Any) -> str:
        return f"{Style.GREEN}{val}{Style.RESET}"

    @staticmethod
    def warn(val: Any) -> str:
        return f"{Style.YELLOW}{val}{Style.RESET}"

    @staticmethod
    def bad(val: Any) -> str:
        return f"{Style.RED}{val}{Style.RESET}"

    @staticmethod
    def info(val: Any) -> str:
        return f"{Style.CYAN}{val}{Style.RESET}"

    @staticmethod
    def bold(val: Any) -> str:
        return f"{Style.BOLD}{val}{Style.RESET}"

# ── Motor database (2025-2026 bench data) ───────────────────────────────

MOTORS: Dict[str, Dict[str, Any]] = {
    "MN501S_KV240": {
        "weight": 300,
        "kv": 240,
        "max_thrust_g": 8000,
        "cont_power_w": 2200,
        "efficiency_gw": {0.25: 10.5, 0.50: 8.5, 0.75: 6.0, 1.0: 4.5},
        "props": ["18x6", "20x6", "22x6.2"],
        "max_voltage": 50.4,
        "price": 200,
    },
    "MN4116_KV340": {
        "weight": 160,
        "kv": 340,
        "max_thrust_g": 5000,
        "cont_power_w": 1200,
        "efficiency_gw": {0.25: 11.0, 0.50: 8.0, 0.75: 5.5, 1.0: 4.0},
        "props": ["15x5", "16x5.4", "17x5.8"],
        "max_voltage": 25.2,
        "price": 85,
    },
    "U10II_KV100": {
        "weight": 1200,
        "kv": 100,
        "max_thrust_g": 10600,
        "cont_power_w": 3500,
        "efficiency_gw": {0.25: 12.0, 0.50: 8.2, 0.75: 5.7, 1.0: 3.8},
        "props": ["26x8", "28x9.2", "30x10"],
        "max_voltage": 50.4,
        "price": 450,
    },
    "U15II_KV80": {
        "weight": 1740,
        "kv": 80,
        "max_thrust_g": 36500,
        "cont_power_w": 8580,
        "efficiency_gw": {0.25: 10.0, 0.50: 7.0, 0.75: 4.5, 1.0: 3.0},
        "props": ["30x10", "32x12"],
        "max_voltage": 100.8,
        "price": 800,
    },
    "2212_920KV": {
        "weight": 55,
        "kv": 920,
        "max_thrust_g": 1300,
        "cont_power_w": 250,
        "efficiency_gw": {0.25: 7.0, 0.50: 5.5, 0.75: 4.0, 1.0: 3.0},
        "props": ["9x4.5", "10x4.5", "11x5"],
        "max_voltage": 16.8,
        "price": 15,
    },
}

# ── Platform configurations ─────────────────────────────────────────────

CONFIGURATIONS: Dict[str, Dict[str, Any]] = {
    "Andino Heavy-Lift X8": {
        "motor": "MN501S_KV240",
        "num_motors": 8,
        "frame_weight": 2100,
        "esc_weight": 800,
        "fc_weight": 150,
        "gps_weight": 50,
        "compute_weight": 500,
        "sensor_weight": 1200,
        "wiring_weight": 500,
        "battery_capacity_mah": 28000,
        "battery_cells": 12,
        "battery_chemistry": "LiHV",
        "battery_weight": 4500,
        "price": 10230,
    },
    "Andino Scout Y6": {
        "motor": "MN4116_KV340",
        "num_motors": 6,
        "frame_weight": 1200,
        "esc_weight": 300,
        "fc_weight": 50,
        "gps_weight": 35,
        "compute_weight": 345,
        "sensor_weight": 600,
        "wiring_weight": 300,
        "battery_capacity_mah": 22000,
        "battery_cells": 6,
        "battery_chemistry": "LiHV",
        "battery_weight": 3000,
        "price": 5280,
    },
    "Legacy F450 (current BOM)": {
        "motor": "2212_920KV",
        "num_motors": 4,
        "frame_weight": 280,
        "esc_weight": 100,
        "fc_weight": 85,
        "gps_weight": 35,
        "compute_weight": 45,
        "sensor_weight": 15,
        "wiring_weight": 50,
        "battery_capacity_mah": 5200,
        "battery_cells": 4,
        "battery_chemistry": "LiPo",
        "battery_weight": 530,
        "price": 500,
    },
}

# ── Global reference platforms for comparison ───────────────────────────

REFERENCE_PLATFORMS: List[Dict[str, Any]] = [
    {
        "name": "Anduril Ghost-X 🇺🇸",
        "payload_kg": 9.0,
        "endurance_min": 75,
        "mtoW_kg": 25,
        "price": "military contract",
        "notes": "Single-rotor VTOL, tandem-rotor config",
    },
    {
        "name": "Freefly Alta X 🇺🇸",
        "payload_kg": 15.9,
        "endurance_min": 18,
        "mtoW_kg": 34.9,
        "price": 15995,
        "notes": "4 motors, 33in blades, 12S, cinema-grade",
    },
    {
        "name": "DJI FlyCart 30 🇨🇳",
        "payload_kg": 30.0,
        "endurance_min": 18,
        "mtoW_kg": 95,
        "price": 12000,
        "notes": "Dual battery mode, delivery logistics",
    },
    {
        "name": "JOUAV CW-20E 🇨🇳",
        "payload_kg": 6.0,
        "endurance_min": 180,
        "mtoW_kg": 31,
        "price": "enterprise",
        "notes": "VTOL fixed-wing, 100 TOPS onboard AI",
    },
    {
        "name": "DJI Matrice 350 RTK 🇨🇳",
        "payload_kg": 2.7,
        "endurance_min": 55,
        "mtoW_kg": 9.2,
        "price": 11129,
        "notes": "Enterprise inspection, IP55",
    },
    {
        "name": "GRIFF 300 🇳🇴",
        "payload_kg": 227.0,
        "endurance_min": 15,
        "mtoW_kg": 350,
        "price": "custom",
        "notes": "Industrial octo, 200kg+ payload",
    },
]


# ── Data classes ─────────────────────────────────────────────────────────

@dataclass
class ConfigResult:
    name: str
    motor_name: str
    num_motors: int
    total_weight_g: float
    thrust_g: float
    thrust_g_per_motor: float
    twr: float
    payload_g: float
    target_twr: float
    flight_time_min: float
    battery_wh: float
    power_w: float
    hover_efficiency_gw: float
    altitude_analysis: Dict[str, float]
    price: int


# ── Engineering calculations ────────────────────────────────────────────


def _interpolate(
    x: float, xp: List[float], fp: List[float]
) -> float:
    """Linear interpolation (pure Python, no numpy)."""
    if x <= xp[0]:
        return fp[0]
    if x >= xp[-1]:
        return fp[-1]
    for i in range(len(xp) - 1):
        if xp[i] <= x <= xp[i + 1]:
            t = (x - xp[i]) / (xp[i + 1] - xp[i])
            return fp[i] + t * (fp[i + 1] - fp[i])
    return fp[-1]


def get_thrust_at_throttle(
    motor_name: str, throttle_pct: float = 0.75
) -> float:
    """Return thrust (g) per motor at a given throttle percentage (0-1).

    Uses linear interpolation from the motor efficiency curve.
    At 100% throttle -> max_thrust_g; at 0% -> 0.
    """
    motor = MOTORS[motor_name]
    if throttle_pct >= 1.0:
        return motor["max_thrust_g"]
    if throttle_pct <= 0:
        return 0.0

    throttles = sorted(motor["efficiency_gw"].keys())
    fractions = []
    for t in throttles:
        thrust = t * motor["max_thrust_g"]
        fractions.append(thrust)

    thrust = _interpolate(throttle_pct, throttles, fractions)
    return thrust


def calculate_thrust(motor_name: str, num_motors: int, throttle_pct: float = 0.75) -> float:
    """Return total thrust (g) for the system at given throttle."""
    per_motor = get_thrust_at_throttle(motor_name, throttle_pct)
    return per_motor * num_motors


def calculate_payload(
    motor_name: str,
    num_motors: int,
    base_weight: float,
    target_twr: float = 2.5,
) -> float:
    """Return available payload (g) for a given thrust-to-weight ratio.

    TWR = total_thrust / (base_weight + payload)
    => payload = total_thrust / TWR - base_weight
    """
    max_thrust = MOTORS[motor_name]["max_thrust_g"] * num_motors
    total_allowed = max_thrust / target_twr
    payload = total_allowed - base_weight
    return max(0.0, payload)


def get_battery_voltage(cells: int, chemistry: str = "LiPo") -> float:
    """Return nominal voltage for a LiPo/LiHV battery."""
    nom_per_cell = 4.35 if chemistry.upper() == "LIHV" else (4.2 if chemistry.upper() == "LiHV" else 3.7)
    if chemistry.upper() in ("LIPO",):
        nom_per_cell = 3.7
    if chemistry.upper() in ("LIHV", "LIHV (HIGH VOLTAGE)"):
        nom_per_cell = 4.35
    # Allow explicit
    if chemistry.upper() == "LIHV":
        nom_per_cell = 4.35
    return cells * nom_per_cell


def calculate_flight_time(
    battery_capacity_mah: float,
    battery_cells: int,
    battery_chemistry: str,
    total_weight_g: float,
    motor_name: str,
    num_motors: int,
    throttle_pct: float = 0.75,
) -> Tuple[float, float, float]:
    """Return (flight_time_min, battery_energy_wh, hover_power_w).

    Uses:
        Battery energy (Wh) = (capacity × voltage × DoD) / 1000
        Hover power (W)     = total_weight / efficiency at hover throttle
        Flight time         = battery_energy / hover_power × 60
    """
    dod = 0.80  # 80% depth of discharge for LiPo/LiHV
    voltage = get_battery_voltage(battery_cells, battery_chemistry)
    battery_wh = (battery_capacity_mah * voltage * dod) / 1000.0

    motor = MOTORS[motor_name]
    eff = _interpolate(throttle_pct, sorted(motor["efficiency_gw"].keys()),
                       [motor["efficiency_gw"][k] for k in sorted(motor["efficiency_gw"].keys())])

    power_per_motor = (total_weight_g / num_motors) / eff if eff > 0 else float("inf")
    hover_power_w = power_per_motor * num_motors

    if hover_power_w <= 0:
        return 0.0, battery_wh, hover_power_w

    flight_min = (battery_wh / hover_power_w) * 60.0
    return flight_min, battery_wh, hover_power_w, eff


def altitude_derating(thrust_g: float, altitude_m: float) -> float:
    """Apply altitude de-rating factor to thrust.

    Sea level: 1.0
    2000m:     0.85
    3000m:     0.78
    4000m:     0.70
    5000m:     0.62

    Linear interpolation for intermediate altitudes.
    """
    altitudes = [0, 2000, 3000, 4000, 5000]
    factors = [1.0, 0.85, 0.78, 0.70, 0.62]
    factor = _interpolate(altitude_m, altitudes, factors)
    return thrust_g * factor


# ── Full config analysis ────────────────────────────────────────────────


def calculate_config(
    config_name: str,
    altitude_m: Optional[float] = None,
    target_twr: float = 2.5,
) -> ConfigResult:
    """Full analysis for a named configuration.

    Returns a ConfigResult dataclass with all metrics.
    """
    cfg = CONFIGURATIONS[config_name]
    motor_name = cfg["motor"]
    num_motors = cfg["num_motors"]

    base_weight = sum([
        cfg["frame_weight"],
        cfg["esc_weight"],
        cfg["fc_weight"],
        cfg["gps_weight"],
        cfg["compute_weight"],
        cfg["sensor_weight"],
        cfg["wiring_weight"],
        cfg["battery_weight"],
    ])

    max_thrust_total = calculate_thrust(motor_name, num_motors, 1.0)
    hover_thrust_total = calculate_thrust(motor_name, num_motors, 0.75)

    payload_g = calculate_payload(motor_name, num_motors, base_weight, target_twr)
    total_weight = base_weight + payload_g

    flight_min, battery_wh, hover_power_w, hover_eff = calculate_flight_time(
        cfg["battery_capacity_mah"],
        cfg["battery_cells"],
        cfg["battery_chemistry"],
        total_weight,
        motor_name,
        num_motors,
        0.75,
    )

    twr = max_thrust_total / total_weight if total_weight > 0 else 0.0

    alt_analysis: Dict[str, float] = {}
    if altitude_m is not None:
        alt_analysis = {
            "altitude_m": altitude_m,
            "derating_factor": altitude_derating(1.0, altitude_m),
            "thrust_at_altitude_g": altitude_derating(max_thrust_total, altitude_m),
            "twr_at_altitude": altitude_derating(max_thrust_total, altitude_m) / total_weight if total_weight > 0 else 0.0,
        }

    return ConfigResult(
        name=config_name,
        motor_name=motor_name,
        num_motors=num_motors,
        total_weight_g=total_weight,
        thrust_g=max_thrust_total,
        thrust_g_per_motor=max_thrust_total / num_motors if num_motors else 0,
        twr=twr,
        payload_g=payload_g,
        target_twr=target_twr,
        flight_time_min=flight_min,
        battery_wh=battery_wh,
        power_w=hover_power_w,
        hover_efficiency_gw=hover_eff,
        altitude_analysis=alt_analysis,
        price=cfg["price"],
    )


# ── Display helpers ─────────────────────────────────────────────────────


def fmt(val: Any, unit: str = "", decimals: int = 1) -> str:
    """Format a number nicely with a unit."""
    if isinstance(val, str):
        return val
    if unit:
        return f"{val:,.{decimals}f} {unit}"
    return f"{val:,.{decimals}f}"


def _twr_color(twr: float) -> str:
    if twr >= 2.5:
        return Style.good(fmt(twr, "", 2))
    if twr >= 1.8:
        return Style.warn(fmt(twr, "", 2))
    return Style.bad(fmt(twr, "", 2))


def _thrust_color(thrust: float, total: float) -> str:
    ratio = thrust / total if total else 0
    if ratio >= 2.5:
        return Style.good(fmt(thrust, "g"))
    if ratio >= 1.8:
        return Style.warn(fmt(thrust, "g"))
    return Style.bad(fmt(thrust, "g"))


def print_header(text: str) -> None:
    """Print a section header."""
    width = 72
    print()
    print(Style.bold(Style.CYAN + "─" * width))
    print(f"  {text}")
    print("─" * width + Style.RESET)


def print_result_row(label: str, value: str, unit: str = "") -> None:
    """Print a key-value row with alignment."""
    print(f"  {Style.GRAY}{label:<30}{Style.RESET} {value}")


def print_config_result(result: ConfigResult) -> None:
    """Print a full config result to terminal."""
    cfg = CONFIGURATIONS[result.name]

    print_header(f"📋  {result.name}")

    print(f"\n  {Style.BOLD}Platform Specs{Style.RESET}")
    print_result_row("Motors",
                     f"{result.num_motors}× {result.motor_name} ({MOTORS[result.motor_name]['kv']}KV)")
    print_result_row("Frame weight",  fmt(cfg["frame_weight"], "g"))
    print_result_row("ESC weight",    fmt(cfg["esc_weight"], "g"))
    print_result_row("FC weight",     fmt(cfg["fc_weight"], "g"))
    print_result_row("Sensors",       fmt(cfg["sensor_weight"], "g"))
    print_result_row("Battery",       f"{cfg['battery_capacity_mah']:,.0f}mAh {cfg['battery_cells']}S {cfg['battery_chemistry']}")
    print_result_row("BOM price",     f"${cfg['price']:,}")

    print(f"\n  {Style.BOLD}Mass Breakdown{Style.RESET}")
    total_no_payload = result.total_weight_g - result.payload_g
    print_result_row("Base weight (empty)",  fmt(total_no_payload, "g"))
    print_result_row("Payload capacity",     _thrust_color(result.payload_g, result.total_weight_g))
    print_result_row("Total weight (MTOW)",  fmt(result.total_weight_g, "g"))
    print_result_row("AUW → kg",             fmt(result.total_weight_g / 1000, "kg"))

    print(f"\n  {Style.BOLD}Thrust & Power{Style.RESET}")
    print_result_row("Max total thrust",     fmt(result.thrust_g, "g"))
    print_result_row("Per motor",            fmt(result.thrust_g_per_motor, "g"))
    print_result_row("Thrust : Weight",      _twr_color(result.twr))
    print_result_row("Hover efficiency",     fmt(result.hover_efficiency_gw, "g/W"))
    print_result_row("Hover power draw",     fmt(result.power_w, "W"))
    print_result_row("Battery energy (80% DoD)", fmt(result.battery_wh, "Wh"))

    print(f"\n  {Style.BOLD}Flight Performance{Style.RESET}")
    if result.flight_time_min >= 15:
        ft = Style.good(fmt(result.flight_time_min, "min"))
    elif result.flight_time_min >= 8:
        ft = Style.warn(fmt(result.flight_time_min, "min"))
    else:
        ft = Style.bad(fmt(result.flight_time_min, "min"))
    print_result_row("Estimated flight time", ft)

    if result.twr >= 2.5:
        twr_note = Style.good("✓ Excellent — above 2.5:1 safety margin")
    elif result.twr >= 1.8:
        twr_note = Style.warn("⚠ Minimum acceptable — 1.8:1 is the floor")
    else:
        twr_note = Style.bad("✗ WARNING: below 1.8:1 — unsafe for normal flight")
    print_result_row("TWR assessment", twr_note)

    if result.altitude_analysis:
        print(f"\n  {Style.BOLD}Altitude Analysis{Style.RESET}")
        aa = result.altitude_analysis
        print_result_row("Altitude",           fmt(aa["altitude_m"], "m"))
        print_result_row("Derating factor",    fmt(aa["derating_factor"], "", 3))
        print_result_row("Thrust at altitude", fmt(aa["thrust_at_altitude_g"], "g"))
        print_result_row("TWR at altitude",    _twr_color(aa["twr_at_altitude"]))

    print()


def print_comparison_table() -> None:
    """Print comparison table against reference platforms."""
    headers = ["Platform", "Payload", "Endurance", "MTOW", "Price", "Notes"]
    rows: List[List[str]] = []

    for p in REFERENCE_PLATFORMS:
        price = f"${p['price']:,}" if isinstance(p["price"], (int, float)) else str(p["price"])
        rows.append([
            p["name"],
            f"{p['payload_kg']} kg",
            f"{p['endurance_min']} min",
            f"{p['mtoW_kg']} kg",
            price,
            p["notes"],
        ])

    # Add our designs
    for cfg_name in ["Andino Heavy-Lift X8", "Andino Scout Y6"]:
        res = calculate_config(cfg_name)
        rows.append([
            Style.bold(res.name),
            f"{res.payload_g / 1000:.1f} kg",
            f"{res.flight_time_min:.0f} min",
            f"{res.total_weight_g / 1000:.1f} kg",
            f"${res.price:,}",
            "AndinoDroneLab design",
        ])

    print_header("📊  Platform Comparison — Andino vs Reference Platforms")
    if tabulate:
        print(tabulate(rows, headers=headers, tablefmt="fancy_grid"))
    else:
        col_widths = [max(len(str(r[i])) for r in rows + [headers]) for i in range(len(headers))]
        sep = "+-" + "-+-".join("-" * w for w in col_widths) + "-+"
        print(sep)
        print("| " + " | ".join(h.ljust(w) for h, w in zip(headers, col_widths)) + " |")
        print(sep)
        for row in rows:
            print("| " + " | ".join(str(r).ljust(w) for r, w in zip(row, col_widths)) + " |")
        print(sep)
    print()


def _result_to_dict(res: ConfigResult) -> Dict[str, Any]:
    d = asdict(res)
    d["total_weight_kg"] = round(res.total_weight_g / 1000, 2)
    d["thrust_kg"] = round(res.thrust_g / 1000, 2)
    d["payload_kg"] = round(res.payload_g / 1000, 2)
    d["price"] = res.price
    return d


# ── CLI entry point ─────────────────────────────────────────────────────


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        description="AndinoDroneLab — Engineering Payload Calculator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  %(prog)s                         Analyze all configs\n"
            '  %(prog)s --config "Heavy-Lift"   Specific config\n'
            "  %(prog)s --compare               Reference comparison\n"
            "  %(prog)s --altitude 4000          Altitude de-rating\n"
            "  %(prog)s --json                  JSON output\n"
        ),
    )
    parser.add_argument(
        "--config", type=str, default=None,
        help="Analyze a specific configuration (name substring match)",
    )
    parser.add_argument(
        "--compare", action="store_true",
        help="Show comparison table against reference platforms",
    )
    parser.add_argument(
        "--altitude", type=float, default=None,
        help="Altitude in meters for performance de-rating",
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Output results as JSON (no colors)",
    )
    parser.add_argument(
        "--twr", type=float, default=2.5,
        help="Target thrust-to-weight ratio (default: 2.5)",
    )

    args = parser.parse_args(argv)

    # Build list of configs to analyze
    config_names: List[str] = []
    if args.config:
        matches = [k for k in CONFIGURATIONS if args.config.lower() in k.lower()]
        if not matches:
            print(f"{Style.RED}No config matching '{args.config}'. Options:{Style.RESET}")
            for k in CONFIGURATIONS:
                print(f"  • {k}")
            sys.exit(1)
        config_names = matches
    else:
        config_names = list(CONFIGURATIONS.keys())

    # Analyze
    results = [calculate_config(n, altitude_m=args.altitude, target_twr=args.twr) for n in config_names]

    if args.json:
        out: Dict[str, Any] = {
            "configs": {r.name: _result_to_dict(r) for r in results},
        }
        if args.compare or args.altitude:
            if args.compare:
                out["reference_platforms"] = REFERENCE_PLATFORMS
            if args.altitude:
                out["altitude_m"] = args.altitude
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return

    # Terminal output
    print()
    print(Style.BOLD + Style.CYAN + "═══  ANDINO DRONE LAB  ═══  Engineering Payload Calculator" + Style.RESET)
    print(Style.GRAY + "      Motor Database: T-Motor bench data (2025-2026)" + Style.RESET)

    for idx, r in enumerate(results):
        if idx > 0:
            print(Style.GRAY + "  " + "─" * 68 + Style.RESET)
        print_config_result(r)

    if args.compare:
        print_comparison_table()

    if args.altitude is not None:
        print_header(f"🏔  Cross-Config Altitude Summary at {args.altitude:,.0f}m")
        alt_rows = []
        for r in results:
            aa = r.altitude_analysis
            if aa:
                alt_rows.append([
                    r.name,
                    f"{aa['derating_factor']:.3f}",
                    f"{aa['thrust_at_altitude_g']:,.0f} g",
                    f"{aa['twr_at_altitude']:.2f}",
                ])
        if alt_rows:
            if tabulate:
                print(tabulate(alt_rows, headers=["Config", "Factor", "Thrust", "TWR"], tablefmt="simple"))
            else:
                for row in alt_rows:
                    print(f"  {row[0]:<30} {row[1]:>6}  {row[2]:>12}  {row[3]:>6}")
        print()

    # Summary banner
    print(Style.GRAY + "─" * 72 + Style.RESET)
    print(f"  Run with {Style.info('--help')} for full options  |  "
          f"JSON: {Style.info('--json')}  |  Compare: {Style.info('--compare')}")
    print(Style.GRAY + "─" * 72 + Style.RESET)
    print()


if __name__ == "__main__":
    main()
