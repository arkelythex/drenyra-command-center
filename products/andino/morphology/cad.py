"""Generador de archivos CAD listos para impresion 3D via CadQuery.

NOTA: Este modulo genera scripts Python de CadQuery. NO requiere
CadQuery instalado en este entorno. El usuario ejecuta los scripts
generados para producir archivos STEP/STL.

Dependencias para generar CAD:
    pip install cadquery
    pip install build123d  (alternativa, no requerida)
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from .design import DroneDesign, FRAME_MOTORS

DEFAULT_MOTOR_MOUNT_DIAM = 16.0
DEFAULT_ARM_WIDTH = 12.0
DEFAULT_ARM_HEIGHT = 4.0
DEFAULT_CENTER_PLATE_DIAM_FACTOR = 0.25
DEFAULT_PLATE_THICKNESS = 3.0


class CADGenerator:
    """Genera scripts CadQuery para el frame del dron.

    Los archivos generados son scripts Python autocontenidos que el
    usuario ejecuta con::

        python gen_frame.py   # genera STEP/STL

    Attributes:
        output_dir: Directorio donde se escriben los scripts.
    """

    def __init__(self, output_dir: str | Path = "cad_output") -> None:
        self.output_dir = Path(output_dir)

    def generate_frame(self, design: DroneDesign, output_path: str | None = None) -> str:
        """Genera script CadQuery para el frame completo.

        Args:
            design: Diseno del dron.
            output_path: Ruta del script generado (o auto-naming).

        Returns:
            Ruta absoluta al archivo .py generado.
        """
        path = self._resolve_path(output_path or f"frame_{design.frame_type}.py")
        script = self._frame_script(design)

        self.output_dir.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(script)

        return str(path.resolve())

    def generate_motor_mount(self, motor_model: str, output_path: str | None = None) -> str:
        """Genera script para montura de motor.

        Args:
            motor_model: Identificador del motor (e.g. '2205_2300kv').
            output_path: Ruta del script generado.

        Returns:
            Ruta absoluta al archivo .py generado.
        """
        path = self._resolve_path(output_path or f"motor_mount_{motor_model}.py")
        script = self._motor_mount_script(motor_model)

        self.output_dir.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(script)

        return str(path.resolve())

    def generate_arm(
        self,
        length: float,
        angle: float,
        output_path: str | None = None,
    ) -> str:
        """Genera script para un brazo individual.

        Args:
            length: Longitud del brazo en mm.
            angle: Angulo del brazo en grados.
            output_path: Ruta del script generado.

        Returns:
            Ruta absoluta al archivo .py generado.
        """
        path = self._resolve_path(output_path or f"arm_{length}mm_{angle}deg.py")
        script = self._arm_script(length, angle)

        self.output_dir.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(script)

        return str(path.resolve())

    def generate_full_assembly(self, design: DroneDesign, output_path: str | None = None) -> str:
        """Genera script para el ensamblaje completo del dron.

        Incluye placa central, brazos, monturas de motor, y holes
        para el hardware.

        Args:
            design: Diseno del dron.
            output_path: Ruta del script generado.

        Returns:
            Ruta absoluta al archivo .py generado.
        """
        path = self._resolve_path(output_path or f"assembly_{design.frame_type}.py")
        script = self._assembly_script(design)

        self.output_dir.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(script)

        return str(path.resolve())

    def _resolve_path(self, name: str) -> Path:
        name = name.replace(" ", "_").lower()
        if not name.endswith(".py"):
            name += ".py"
        return self.output_dir / name

    def _frame_script(self, design: DroneDesign) -> str:
        motor_count = FRAME_MOTORS.get(design.frame_type, 4)
        center_diam = DEFAULT_CENTER_PLATE_DIAM_FACTOR * design.arm_length * 2

        return f'''#!/usr/bin/env python3
"""Frame generado por AndinoDroneLab Morphology Engine.

Frame type: {design.frame_type}
Material: {design.frame_material}
Arm length: {design.arm_length}mm
Arm angle: {design.arm_angle}deg
Motors: {motor_count}

Uso:
    python {Path(__file__).name}
"""

import cadquery as cq

# Parametros -----------------------------------------------------------------
CENTER_DIAM = {center_diam:.1f}
PLATE_THICKNESS = {DEFAULT_PLATE_THICKNESS}
ARM_LENGTH = {design.arm_length}
ARM_ANGLE = {design.arm_angle}
ARM_WIDTH = {DEFAULT_ARM_WIDTH}
ARM_HEIGHT = {DEFAULT_ARM_HEIGHT}
MOTOR_COUNT = {motor_count}
MOTOR_MOUNT_DIAM = {DEFAULT_MOTOR_MOUNT_DIAM}
MOUNT_HOLE_DIAM = 3.0

# Placa central -------------------------------------------------------------
center = (
    cq.Workplane("XY")
    .circle(CENTER_DIAM / 2)
    .extrude(PLATE_THICKNESS)
)

# Brazos --------------------------------------------------------------------
arms = cq.Workplane("XY")
for i in range(MOTOR_COUNT):
    angle_deg = 360.0 / MOTOR_COUNT * i + ARM_ANGLE
    arm = (
        cq.Workplane("XY")
        .transformed(offset=(0, 0, 0))
        .center(0, 0)
        .rect(ARM_LENGTH, ARM_WIDTH)
        .extrude(ARM_HEIGHT)
        .rotate((0, 0, 0), (0, 0, 1), angle_deg)
    )
    arms = arms.union(arm)

# Motor mounts ---------------------------------------------------------------
mounts = cq.Workplane("XY")
for i in range(MOTOR_COUNT):
    angle_deg = 360.0 / MOTOR_COUNT * i + ARM_ANGLE
    x = (ARM_LENGTH / 2) * math.cos(math.radians(angle_deg))
    y = (ARM_LENGTH / 2) * math.sin(math.radians(angle_deg))
    mount = (
        cq.Workplane("XY")
        .circle(MOTOR_MOUNT_DIAM / 2)
        .extrude(PLATE_THICKNESS)
        .translate((x, y, 0))
    )
    mounts = mounts.union(mount)

# Union final ----------------------------------------------------------------
frame = center.union(arms).union(mounts)

# Holes for screws en centro
frame = (
    frame
    .faces("<Z")
    .workplane()
    .rarray(20, 20, 3, 3, center=True)
    .circle(MOUNT_HOLE_DIAM / 2)
    .cutThruAll()
)

# Export --------------------------------------------------------------------
output_path = "frame_{design.frame_type}.step"
cq.exporters.export(frame, output_path)
print(f"Exportado: {{output_path}}")

output_path_stl = "frame_{design.frame_type}.stl"
cq.exporters.export(frame, output_path_stl)
print(f"Exportado: {{output_path_stl}}")
'''

    def _motor_mount_script(self, motor_model: str) -> str:
        return f'''#!/usr/bin/env python3
"""Motor mount para {motor_model} — generado por AndinoDroneLab.

Uso:
    python {Path(__file__).name}
"""

import cadquery as cq
import math

# Parametros -----------------------------------------------------------------
MOUNT_DIAM = {DEFAULT_MOTOR_MOUNT_DIAM}
MOUNT_HEIGHT = 6.0
SCREW_HOLE_DIAM = 3.0
SCREW_PATTERN_DIAM = 12.0
SCREW_COUNT = 4

# Mount base -----------------------------------------------------------------
mount = (
    cq.Workplane("XY")
    .circle(MOUNT_DIAM / 2)
    .extrude(MOUNT_HEIGHT)
)

# Screw holes ----------------------------------------------------------------
for i in range(SCREW_COUNT):
    angle = 360.0 / SCREW_COUNT * i
    x = (SCREW_PATTERN_DIAM / 2) * math.cos(math.radians(angle))
    y = (SCREW_PATTERN_DIAM / 2) * math.sin(math.radians(angle))
    mount = (
        mount
        .faces(">Z")
        .workhole(SCREW_HOLE_DIAM, MOUNT_HEIGHT)
    )

# Through hole central -------------------------------------------------------
mount = (
    mount
    .faces(">Z")
    .workhole(5.0, MOUNT_HEIGHT)
)

# Export ---------------------------------------------------------------------
output_path = "motor_mount_{motor_model}.step"
cq.exporters.export(mount, output_path)
print(f"Exportado: {{output_path}}")
'''

    def _arm_script(self, length: float, angle: float) -> str:
        return f'''#!/usr/bin/env python3
"""Brazo de dron — generado por AndinoDroneLab.

Longitud: {length}mm
Angulo: {angle}deg

Uso:
    python {Path(__file__).name}
"""

import cadquery as cq
import math

# Parametros -----------------------------------------------------------------
LENGTH = {length}
WIDTH = {DEFAULT_ARM_WIDTH}
HEIGHT = {DEFAULT_ARM_HEIGHT}
ANGLE = {angle}
TAPER_FACTOR = 0.6
MOUNT_HOLE_DIAM = 3.0
MOUNT_SPACING = 20.0

# Arm body (tapered) ---------------------------------------------------------
arm = (
    cq.Workplane("XY")
    .center(-LENGTH / 2, 0)
    .rect(LENGTH, WIDTH)
    .extrude(HEIGHT)
)

# Center mounting holes ------------------------------------------------------
arm = (
    arm
    .faces("<Z")
    .workplane()
    .center(0, 0)
    .rarray(MOUNT_SPACING, MOUNT_SPACING, 2, 1)
    .circle(MOUNT_HOLE_DIAM / 2)
    .cutThruAll()
)

# Motor mount hole -----------------------------------------------------------
arm = (
    arm
    .faces(">Z")
    .workplane()
    .center(LENGTH / 2, 0)
    .circle(8.0 / 2)
    .cutThruAll()
)

# Apply angle ----------------------------------------------------------------
arm = arm.rotate((0, 0, 0), (0, 0, 1), ANGLE)

# Export ---------------------------------------------------------------------
output_path = "arm_{length}mm_{angle}deg.step"
cq.exporters.export(arm, output_path)
print(f"Exportado: {{output_path}}")
'''

    def _assembly_script(self, design: DroneDesign) -> str:
        motor_count = FRAME_MOTORS.get(design.frame_type, 4)
        center_diam = DEFAULT_CENTER_PLATE_DIAM_FACTOR * design.arm_length * 2

        return f'''#!/usr/bin/env python3
"""Ensamblaje completo de dron — generado por AndinoDroneLab.

Design: {design.frame_type}
Motor: {design.motor_model}
Arm length: {design.arm_length}mm
Battery: {design.battery_cells}S {design.battery_capacity}mAh
Frame material: {design.frame_material}
AUW: {design.auw:.0f}g

Uso:
    python {Path(__file__).name}
"""

import cadquery as cq
import math

# Parametros -----------------------------------------------------------------
CENTER_DIAM = {center_diam:.1f}
PLATE_THICKNESS = {DEFAULT_PLATE_THICKNESS}
ARM_LENGTH = {design.arm_length}
ARM_ANGLE = {design.arm_angle}
ARM_WIDTH = {DEFAULT_ARM_WIDTH}
ARM_HEIGHT = {DEFAULT_ARM_HEIGHT}
MOTOR_COUNT = {motor_count}
MOTOR_MOUNT_DIAM = {DEFAULT_MOTOR_MOUNT_DIAM}
BATTERY_SLOT_W = 40.0
BATTERY_SLOT_L = 60.0
STANDOFF_HEIGHT = 20.0
STANDOFF_DIAM = 5.0

# Bottom plate ---------------------------------------------------------------
bot_plate = (
    cq.Workplane("XY")
    .circle(CENTER_DIAM / 2)
    .extrude(PLATE_THICKNESS)
)

# Arms ----------------------------------------------------------------------
arms = cq.Workplane("XY")
for i in range(MOTOR_COUNT):
    a = 360.0 / MOTOR_COUNT * i + ARM_ANGLE
    arm = (
        cq.Workplane("XY")
        .center(ARM_LENGTH / 2, 0)
        .rect(ARM_LENGTH, ARM_WIDTH)
        .extrude(ARM_HEIGHT)
        .rotate((0, 0, 0), (0, 0, 1), a)
    )
    arms = arms.union(arm)

# Motor mounts ---------------------------------------------------------------
motor_mounts = cq.Workplane("XY")
for i in range(MOTOR_COUNT):
    a = 360.0 / MOTOR_COUNT * i + ARM_ANGLE
    x = (ARM_LENGTH / 2) * math.cos(math.radians(a))
    y = (ARM_LENGTH / 2) * math.sin(math.radians(a))
    mount = (
        cq.Workplane("XY")
        .circle(MOTOR_MOUNT_DIAM / 2)
        .extrude(PLATE_THICKNESS + 3.0)
        .translate((x, y, 0))
    )
    motor_mounts = motor_mounts.union(mount)

# Standoffs ------------------------------------------------------------------
standoffs = cq.Workplane("XY")
for i in range(4):
    a = 45.0 + 90.0 * i
    r = CENTER_DIAM / 4
    x = r * math.cos(math.radians(a))
    y = r * math.sin(math.radians(a))
    standoff = (
        cq.Workplane("XY")
        .circle(STANDOFF_DIAM / 2)
        .extrude(STANDOFF_HEIGHT)
        .translate((x, y, 0))
    )
    standoffs = standoffs.union(standoff)

# Base assembly --------------------------------------------------------------
frame = bot_plate.union(arms).union(motor_mounts).union(standoffs)

# Battery slot on bottom plate -----------------------------------------------
frame = (
    frame
    .faces("<Z")
    .workplane()
    .rect(BATTERY_SLOT_L, BATTERY_SLOT_W)
    .cutThruAll()
)

# Top plate ------------------------------------------------------------------
top_plate = (
    cq.Workplane("XY")
    .circle(CENTER_DIAM / 2)
    .extrude(PLATE_THICKNESS)
    .translate((0, 0, STANDOFF_HEIGHT + PLATE_THICKNESS))
)

assembly = frame.union(top_plate)

# Export ---------------------------------------------------------------------
output = "drone_assembly_{design.frame_type}.step"
cq.exporters.export(assembly, output)
print(f"Exportado: {{output}}")

output_stl = "drone_assembly_{design.frame_type}.stl"
cq.exporters.export(assembly, output_stl)
print(f"Exportado: {{output_stl}}")
'''
