"""Visualizacion ASCII para morfologias de drones y resultados evolutivos.

Sin dependencias externas. Usa unicamente caracteres Unicode para
tablas, graficos y arte ASCII.
"""

from __future__ import annotations

import math
from typing import Any

from .design import DroneDesign, FRAME_MOTORS, REFERENCE_MOTORS
from .surrogate import PerformanceMetrics

# Caracteres Unicode para graficos
H_BAR = "━"
V_BAR = "┃"
TL = "┏"
TM = "┳"
TR = "┓"
ML = "┣"
MM = "╋"
MR = "┫"
BL = "┗"
BM = "┻"
BR = "┛"

BLOCK_FULL = "█"
BLOCK_MEDIUM = "▓"
BLOCK_LIGHT = "░"
BLOCK_EMPTY = " "


class MorphologyViz:
    """Visualizaciones ASCII para el morphology engine."""

    @staticmethod
    def design_summary(design: DroneDesign, metrics: PerformanceMetrics | None = None) -> str:
        """Tabla ASCII con specs clave del diseno.

        Args:
            design: Diseno del dron.
            metrics: Metricas de rendimiento (opcional).

        Returns:
            String con tabla formateada.
        """
        w = 20
        lines = [
            f"{TL}{H_BAR * w}{TM}{H_BAR * (w + 10)}{TR}",
            f"{V_BAR}{'Parameter':>{w}}{V_BAR}{'Value':<{w + 10}}{V_BAR}",
            f"{ML}{H_BAR * w}{MM}{H_BAR * (w + 10)}{MR}",
            MorphologyViz._row("Frame Type", design.frame_type, w),
            MorphologyViz._row("Arm Length", f"{design.arm_length:.0f} mm", w),
            MorphologyViz._row("Arm Angle", f"{design.arm_angle:.0f}°", w),
            MorphologyViz._row("Motors", f"{design.motor_count} x {design.motor_model}", w),
            MorphologyViz._row("Propeller", f"{design.propeller_diameter}\" x {design.propeller_pitch}\"", w),
            MorphologyViz._row("Battery", f"{design.battery_cells}S {design.battery_capacity:.0f}mAh", w),
            MorphologyViz._row("Frame Material", design.frame_material, w),
            MorphologyViz._row("Payload", f"{design.payload_mass:.0f} g", w),
            MorphologyViz._row("AUW", f"{design.auw:.0f} g", w),
            MorphologyViz._row("Total Thrust", f"{design.total_thrust:.0f} g", w),
            MorphologyViz._row("TWR", f"{design.twr:.2f}", w),
            f"{ML}{H_BAR * w}{MM}{H_BAR * (w + 10)}{MR}",
        ]

        if metrics:
            lines.extend([
                MorphologyViz._row("Est. Payload", f"{metrics.payload_g:.0f} g", w),
                MorphologyViz._row("Flight Time", f"{metrics.flight_time_min:.1f} min", w),
                MorphologyViz._row("Est. Cost", f"${metrics.cost_usd:.0f}", w),
                MorphologyViz._row("Stability", f"{metrics.stability_index:.3f}", w),
                MorphologyViz._row("Altitude Perf.", f"{metrics.altitude_performance:.3f}", w),
                MorphologyViz._row("Hover Current", f"{metrics.hover_current_a:.1f} A", w),
                MorphologyViz._row("Disk Loading", f"{metrics.disc_loading_g_dm2:.1f} g/dm²", w),
            ])

        lines.append(f"{BL}{H_BAR * w}{BM}{H_BAR * (w + 10)}{BR}")
        return "\n".join(lines)

    @staticmethod
    def _row(label: str, value: str, w: int, extra: int = 10) -> str:
        return f"{V_BAR}{label:>{w}}{V_BAR}{value:<{w + extra}}{V_BAR}"

    @staticmethod
    def pareto_front(
        points: list[tuple[float, ...]],
        labels: list[str] | None = None,
        objectives: tuple[int, int] = (0, 1),
        width: int = 40,
        height: int = 12,
    ) -> str:
        """Grafico ASCII 2D del Pareto front.

        Args:
            points: Lista de tuplas de fitness (5 objetivos).
            labels: Etiquetas para cada punto (opcional).
            objectives: Indices de los 2 objetivos a graficar (x, y).
            width: Ancho del grafico en caracteres.
            height: Alto del grafico en caracteres.

        Returns:
            String con grafico ASCII.
        """
        if not points:
            return "(No Pareto points to display)"

        x_vals = [p[objectives[0]] for p in points]
        y_vals = [p[objectives[1]] for p in points]

        x_min, x_max = min(x_vals), max(x_vals)
        y_min, y_max = min(y_vals), max(y_vals)

        x_range = max(x_max - x_min, 0.001)
        y_range = max(y_max - y_min, 0.001)

        obj_names = ["Payload", "Flight Time", "Cost", "Stability", "Altitude Perf."]
        x_label = obj_names[objectives[0]]
        y_label = obj_names[objectives[1]]

        grid = [[BLOCK_EMPTY] * width for _ in range(height)]

        for i, pt in enumerate(points):
            xi = int((pt[objectives[0]] - x_min) / x_range * (width - 1))
            yi = int((1.0 - (pt[objectives[1]] - y_min) / y_range) * (height - 1))
            xi = max(0, min(width - 1, xi))
            yi = max(0, min(height - 1, yi))

            marker = labels[i][0] if labels and i < len(labels) and labels[i] else "X"
            grid[yi][xi] = marker

        lines = [f"  Pareto Front: {x_label} vs {y_label}", ""]

        lines.append(f"{y_label}")
        for row_idx, row in enumerate(grid):
            label = f"{y_max - (row_idx / height) * y_range:.2f}"
            lines.append(f"{label} ┤ {''.join(row)}")

        lines.append(f"  └{'─' * width}┐")
        x_ticks = 5
        tick_spacing = max(1, (width - 2) // (x_ticks - 1))
        tick_line = "   "
        for i in range(x_ticks):
            pos = i * tick_spacing
            val = x_min + (pos / (width - 1)) * x_range
            tick_line += f"{val:.2f}{' ' * (tick_spacing - 5)}"
        lines.append(tick_line)
        lines.append(f"  {x_label}")

        return "\n".join(lines)

    @staticmethod
    def evolution_progress(history: list[dict[str, Any]]) -> str:
        """Linea de tiempo ASCII de generaciones.

        Args:
            history: Lista de dicts con stats por generacion.

        Returns:
            String con progreso formateado.
        """
        if not history:
            return "(No evolution history)"

        lines = [
            "╔══════════════════════════════════════════════════════╗",
            "║           Evolution Progress Timeline               ║",
            "╠══════════════════════════════════════════════════════╣",
        ]

        max_gen = len(history)
        gen_width = len(str(max_gen))

        # Header
        hdr = f"║ {'Gen':>{gen_width}} | Valid | Best Payload | Best Flight | Pareto ║"
        lines.append(hdr)
        lines.append(f"╠{'═' * (gen_width + 1)}╬══════╬═════════════╬═════════════╬════════╣")

        for i, gen in enumerate(history):
            gen_num = gen.get("generation", i)
            valid = gen.get("n_valid", "?")
            p = gen.get("best_payload", 0)
            ft = gen.get("best_flight_time", 0)
            ps = gen.get("pareto_size", "?")

            bar_len = 20
            progress = (i + 1) / max_gen if max_gen > 0 else 0
            filled = int(bar_len * progress)
            bar = BLOCK_FULL * filled + BLOCK_EMPTY * (bar_len - filled)

            lines.append(
                f"║ {gen_num:>{gen_width}} | {valid:<4} | "
                f"{p:>8.0f}g    | {ft:>7.1f}min   | {str(ps):<6} ║"
            )

        lines.append("╚══════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def design_ascii(design: DroneDesign) -> str:
        """Arte ASCII representando el dron (vista superior).

        Args:
            design: Diseno del dron.

        Returns:
            String con arte ASCII del dron.
        """
        renderer = DroneASCIIRenderer()
        return renderer.render(design)

    @staticmethod
    def comparison_table(designs: list[DroneDesign], metrics_list: list[PerformanceMetrics]) -> str:
        """Tabla comparativa de multiples disenos.

        Args:
            designs: Lista de disenos.
            metrics_list: Lista de metricas correspondientes.

        Returns:
            String con tabla comparativa.
        """
        if not designs:
            return "(No designs to compare)"

        n = len(designs)
        cols = [f"  Design {i + 1}  " for i in range(n)]
        col_w = max(len(c) for c in cols)

        separator = f"┏{'┳'.join(['━' * col_w for _ in range(n)])}┓"

        rows = [
            f"┃{'┃'.join(c.center(col_w) for c in cols)}┃",
            f"┣{'╋'.join(['━' * col_w for _ in range(n)])}┫",
        ]

        fields = [
            ("Type", [d.frame_type for d in designs]),
            ("Arm", [f"{d.arm_length:.0f}mm" for d in designs]),
            ("Motors", [f"{d.motor_count}x{d.motor_model[:4]}" for d in designs]),
            ("Prop", [f'{d.propeller_diameter}"' for d in designs]),
            ("Battery", [f"{d.battery_cells}S" for d in designs]),
            ("AUW", [f"{d.auw:.0f}g" for d in designs]),
            ("TWR", [f"{d.twr:.2f}" for d in designs]),
        ]

        if metrics_list and len(metrics_list) == n:
            fields.extend([
                ("Payload", [f"{m.payload_g:.0f}g" for m in metrics_list]),
                ("Flight", [f"{m.flight_time_min:.1f}m" for m in metrics_list]),
                ("Cost", [f"${m.cost_usd:.0f}" for m in metrics_list]),
                ("Stab.", [f"{m.stability_index:.3f}" for m in metrics_list]),
            ])

        for label, vals in fields:
            row = f"┃{'┃'.join(v.center(col_w) for v in vals)}┃"
            rows.append(f"{label}: {row}")

        rows.append(f"┗{'┻'.join(['━' * col_w for _ in range(n)])}┛")

        return "\n".join(rows)


class DroneASCIIRenderer:
    """Renderiza un dron en ASCII segun su configuracion."""

    def render(self, design: DroneDesign) -> str:
        motor_count = FRAME_MOTORS.get(design.frame_type, 4)

        if motor_count == 4:
            return self._render_quad()
        elif motor_count == 6:
            return self._render_hexa()
        elif motor_count == 8:
            return self._render_octo()
        else:
            return self._render_generic(motor_count)

    @staticmethod
    def _render_quad() -> str:
        return """\
              ╱
             ╱ M1
            ╱
    ╭──────╯
    │       ╲
    │   +   ╲ M2
    │       ╱
    ╰──────╮
           │
           ╱
          ╱ M4
    M3   ╱
    """

    @staticmethod
    def _render_hexa() -> str:
        return """\
        M1  ╱ ╲  M2
          ╱       ╲
         ╱         ╲
        │    +     │
         ╲         ╱
          ╲       ╱
        M6  ╲ ╱  M3
           ╱ ╲
          ╱   ╲
        M5     M4
    """

    @staticmethod
    def _render_octo() -> str:
        return """\
    M1 ╱───────╲ M2
     ╱           ╲
    │   M7  M8   │
    │    +       │
    │   M5  M6   │
     ╲           ╱
    M4 ╲───────╱ M3
    """

    @staticmethod
    def _render_generic(n: int) -> str:
        lines = [f"  Drone with {n} motors (top view)", ""]
        for i in range(n):
            angle = 360.0 / n * i
            lines.append(f"  M{i + 1} @ {angle:.0f}°")
        return "\n".join(lines)
