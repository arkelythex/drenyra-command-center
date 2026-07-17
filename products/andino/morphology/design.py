"""Drone Design Language — parametros morfologicos y encoding para NSGA-II."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

GRAVITY = 9.81
AIR_DENSITY_SEA = 1.225
AIR_DENSITY_4000M = 0.909  # kg/m^3 a ~4000m

FrameType = Literal["quad", "y6", "x8", "hexa", "octo"]
FrameMaterial = Literal["carbon", "aluminum", "pla", "petg"]

# Rangos fisicos para normalizacion encode/decode
PARAM_RANGES: dict[str, tuple[float, float]] = {
    "arm_length":         (50.0, 500.0),
    "arm_angle":          (0.0, 60.0),
    "propeller_diameter": (3.0, 16.0),
    "propeller_pitch":    (2.0, 8.0),
    "battery_cells":      (3, 14),
    "battery_capacity":   (500.0, 22000.0),
    "payload_mass":       (0.0, 10000.0),
}

# Mapeo de frame_type a motor_count
FRAME_MOTORS: dict[str, int] = {
    "quad": 4,
    "y6":   6,
    "x8":   8,
    "hexa": 6,
    "octo": 8,
}

# Densidad de materiales (g/cm^3)
MATERIAL_DENSITY: dict[str, float] = {
    "carbon":   1.6,
    "aluminum": 2.7,
    "pla":      1.24,
    "petg":     1.27,
}

# Costo por material (USD/kg)
MATERIAL_COST: dict[str, float] = {
    "carbon":   80.0,
    "aluminum": 15.0,
    "pla":      20.0,
    "petg":     25.0,
}

# Modelos de motor referencia: (kv, max_thrust_g, weight_g, cost_usd, amp_max)
REFERENCE_MOTORS: dict[str, tuple[int, float, float, float, float]] = {
    "2204_2300kv":   (2300, 280,   25,  12.0, 12),
    "2205_2300kv":   (2300, 350,   28,  14.0, 15),
    "2207_2450kv":   (2450, 450,   32,  16.0, 22),
    "2306_1900kv":   (1900, 540,   35,  18.0, 28),
    "2806_1300kv":   (1300, 750,   45,  22.0, 30),
    "3110_1000kv":   (1000, 1100,  65,  30.0, 35),
    "3515_900kv":    (900,  1800,  85,  40.0, 45),
    "4010_700kv":    (700,  2600,  110, 55.0, 55),
    "5010_480kv":    (480,  3800,  160, 75.0, 60),
    "6010_380kv":    (380,  5200,  220, 95.0, 70),
    "8015_300kv":    (300,  9000,  380, 150.0, 90),
}


class MorphologyError(Exception):
    """Error base del modulo morphology."""


class ValidationError(MorphologyError):
    """Un diseno no cumple restricciones fisicas."""


@dataclass
class DroneDesign:
    frame_type: FrameType = "quad"
    arm_length: float = 150.0
    arm_angle: float = 0.0
    motor_model: str = "2205_2300kv"
    propeller_diameter: float = 5.0
    propeller_pitch: float = 3.0
    battery_cells: int = 4
    battery_capacity: float = 1500.0
    frame_material: FrameMaterial = "pla"
    payload_mass: float = 200.0

    # Campos computados (se llenan via compute_derived o decode)
    motor_count: int = field(init=False)
    thrust_per_motor: float = field(init=False)
    total_thrust: float = field(init=False)
    auw: float = field(init=False)

    def __post_init__(self) -> None:
        self.motor_count = FRAME_MOTORS.get(self.frame_type, 4)
        self.compute_derived()

    def compute_derived(self) -> None:
        motor_data = REFERENCE_MOTORS.get(self.motor_model)
        if motor_data is None:
            raise ValidationError(f"Motor desconocido: {self.motor_model}")
        _, max_thrust_g, _, _, _ = motor_data

        # Correccion por altitud: el thrust cae ~0.7x a 4000m
        altitude_factor = AIR_DENSITY_4000M / AIR_DENSITY_SEA
        self.thrust_per_motor = max_thrust_g * altitude_factor
        self.total_thrust = self.thrust_per_motor * self.motor_count
        self.auw = self._estimate_auw()

    def _estimate_auw(self) -> float:
        motor_data = REFERENCE_MOTORS.get(self.motor_model)
        if motor_data is None:
            return 0.0
        _, _, motor_weight, _, _ = motor_data

        weight_grams = 0.0

        weight_grams += motor_weight * self.motor_count

        arm_volume = (
            math.pi * (5.0 ** 2) * self.arm_length * self.motor_count * 0.3
        )
        material_density = MATERIAL_DENSITY.get(self.frame_material, 1.24)
        weight_grams += arm_volume * material_density * 1e-3

        central_plate_diam = 2.0 * self.arm_length * 0.25
        plate_area = math.pi * (central_plate_diam / 2.0) ** 2
        plate_thickness = 3.0
        plate_volume = plate_area * plate_thickness
        weight_grams += plate_volume * material_density * 1e-3

        battery_energy = self.battery_cells * 3.7 * self.battery_capacity / 1000.0
        battery_weight = 0.008 * battery_energy * 1000.0
        weight_grams += battery_weight

        weight_grams += self.payload_mass

        return weight_grams

    def encode(self) -> list[float]:
        vector = []

        frame_types = list(FRAME_MOTORS.keys())
        ft_idx = frame_types.index(self.frame_type) if self.frame_type in frame_types else 0
        vector.append(ft_idx / (len(frame_types) - 1))

        vector.append(self._norm("arm_length", self.arm_length))
        vector.append(self._norm("arm_angle", self.arm_angle))

        motor_names = list(REFERENCE_MOTORS.keys())
        mi_idx = motor_names.index(self.motor_model) if self.motor_model in motor_names else 0
        vector.append(mi_idx / (len(motor_names) - 1))

        vector.append(self._norm("propeller_diameter", self.propeller_diameter))
        vector.append(self._norm("propeller_pitch", self.propeller_pitch))
        vector.append(self._norm("battery_cells", float(self.battery_cells)))
        vector.append(self._norm("battery_capacity", self.battery_capacity))

        fm_types = list(MATERIAL_DENSITY.keys())
        fm_idx = fm_types.index(self.frame_material) if self.frame_material in fm_types else 0
        vector.append(fm_idx / (len(fm_types) - 1))

        vector.append(self._norm("payload_mass", self.payload_mass))

        return vector

    @classmethod
    def decode(cls, vector: list[float]) -> DroneDesign:
        if len(vector) < 10:
            raise ValidationError(f"Vector debe tener 10 elementos, tiene {len(vector)}")

        frame_types = list(FRAME_MOTORS.keys())
        ft_idx = round(vector[0] * (len(frame_types) - 1))
        frame_type = frame_types[ft_idx]

        arm_length = cls._denorm("arm_length", vector[1])
        arm_angle = cls._denorm("arm_angle", vector[2])

        motor_names = list(REFERENCE_MOTORS.keys())
        mi_idx = round(vector[3] * (len(motor_names) - 1))
        motor_model = motor_names[mi_idx]

        propeller_diameter = cls._denorm("propeller_diameter", vector[4])
        propeller_pitch = cls._denorm("propeller_pitch", vector[5])
        battery_cells = round(cls._denorm("battery_cells", vector[6]))
        battery_capacity = cls._denorm("battery_capacity", vector[7])

        fm_types = list(MATERIAL_DENSITY.keys())
        fm_idx = round(vector[8] * (len(fm_types) - 1))
        frame_material = fm_types[fm_idx]

        payload_mass = cls._denorm("payload_mass", vector[9])

        return cls(
            frame_type=frame_type,
            arm_length=arm_length,
            arm_angle=arm_angle,
            motor_model=motor_model,
            propeller_diameter=propeller_diameter,
            propeller_pitch=propeller_pitch,
            battery_cells=battery_cells,
            battery_capacity=battery_capacity,
            frame_material=frame_material,
            payload_mass=payload_mass,
        )

    @property
    def twr(self) -> float:
        if self.auw <= 0:
            return 0.0
        return self.total_thrust / self.auw

    def estimate_payload(self) -> float:
        usable_thrust = self.total_thrust - (self.auw - self.payload_mass) * 1.8
        return max(0.0, usable_thrust)

    def estimate_flight_time(self, hover_current: float | None = None) -> float:
        if hover_current is None:
            hover_current = self._estimate_hover_current()

        battery_wh = self.battery_cells * 3.7 * self.battery_capacity / 1000.0
        usable_wh = battery_wh * 0.8

        if hover_current <= 0:
            return 0.0

        hours = usable_wh / (hover_current * 3.7 * self.battery_cells)
        return hours * 60.0

    def _estimate_hover_current(self) -> float:
        motor_data = REFERENCE_MOTORS.get(self.motor_model)
        if motor_data is None:
            return 1.0
        _, max_thrust_g, _, _, amp_max = motor_data

        thrust_fraction = (self.auw / self.motor_count) / max_thrust_g
        thrust_fraction = max(0.1, min(1.0, thrust_fraction))

        return amp_max * thrust_fraction ** 1.5

    def estimate_cost(self) -> float:
        cost = 0.0

        motor_data = REFERENCE_MOTORS.get(self.motor_model)
        if motor_data:
            _, _, _, motor_cost, _ = motor_data
            cost += motor_cost * self.motor_count

        material_cost_per_kg = MATERIAL_COST.get(self.frame_material, 20.0)
        frame_weight_kg = (self.auw - self.payload_mass) / 1000.0
        cost += frame_weight_kg * material_cost_per_kg * 2.0

        battery_wh = self.battery_cells * 3.7 * self.battery_capacity / 1000.0
        cost += battery_wh * 0.3

        cost += 50.0

        return cost

    def validate(self) -> list[str]:
        errors = []
        if self.twr < 1.8:
            errors.append(f"TWR ({self.twr:.2f}) < 1.8")
        if self.arm_length < 50 or self.arm_length > 500:
            errors.append(f"Arm length ({self.arm_length}) fuera de rango [50, 500]")
        if self.propeller_diameter < 3 or self.propeller_diameter > 16:
            errors.append(f"Propeller ({self.propeller_diameter}\") fuera de rango [3, 16]")
        if self.auw <= 0:
            errors.append("AUW debe ser positivo")
        if self.motor_model not in REFERENCE_MOTORS:
            errors.append(f"Motor desconocido: {self.motor_model}")
        payload_ratio = self.payload_mass / self.auw * 100 if self.auw > 0 else 0
        if payload_ratio > 60:
            errors.append(f"Payload ratio ({payload_ratio:.1f}%) > 60%")
        return errors

    def _norm(self, param: str, value: float) -> float:
        lo, hi = PARAM_RANGES[param]
        return max(0.0, min(1.0, (value - lo) / (hi - lo)))

    @staticmethod
    def _denorm(param: str, normed: float) -> float:
        lo, hi = PARAM_RANGES[param]
        return lo + normed * (hi - lo)
