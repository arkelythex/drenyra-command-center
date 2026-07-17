"""Surrogate performance models — physics-based y transformer-based.

v0.1: PhysicsSurrogate usa ecuaciones analiticas de thrust, drag, bateria.
v1.0: TransformerSurrogate aprendera de datos simulados (futuro).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from .design import DroneDesign, AIR_DENSITY_SEA, AIR_DENSITY_4000M, GRAVITY, REFERENCE_MOTORS

# Constantes fisicas
K_THRUST = 1.0e-7       # Coeficiente propulsivo generico (T = k * RPM^2 * D^4 * pitch)
CD_FLAT_PLATE = 1.12    # Coeficiente de arrastre placa plana
DRAG_COEFF = 0.8        # Coeficiente de arrastre generico multirotor
MOTOR_EFFICIENCY = 0.75
PROPELLER_EFFICIENCY = 0.70
BATTERY_EFFICIENCY = 0.85
ESC_EFFICIENCY = 0.92


@dataclass
class PerformanceMetrics:
    payload_g: float = 0.0
    flight_time_min: float = 0.0
    cost_usd: float = 0.0
    stability_index: float = 0.0
    altitude_performance: float = 0.0
    hover_current_a: float = 0.0
    max_speed_ms: float = 0.0
    drag_n: float = 0.0
    power_w: float = 0.0
    energy_wh: float = 0.0
    disc_loading_g_dm2: float = 0.0
    reynolds_prop: float = 0.0

    def to_tuple(self) -> tuple[float, float, float, float, float]:
        return (
            self.payload_g,
            self.flight_time_min,
            self.cost_usd,
            self.stability_index,
            self.altitude_performance,
        )

    def to_dict(self) -> dict[str, float]:
        return {
            "payload_g": self.payload_g,
            "flight_time_min": self.flight_time_min,
            "cost_usd": self.cost_usd,
            "stability_index": self.stability_index,
            "altitude_performance": self.altitude_performance,
            "hover_current_a": self.hover_current_a,
            "max_speed_ms": self.max_speed_ms,
            "drag_n": self.drag_n,
            "power_w": self.power_w,
            "energy_wh": self.energy_wh,
            "disc_loading_g_dm2": self.disc_loading_g_dm2,
            "reynolds_prop": self.reynolds_prop,
        }


class PhysicsSurrogate:
    """Modelo surrogate basado en fisica analitica.

    Calcula thrust con correccion por altitud, drag simplificado,
    bateria, costos, y estabilidad. Valido para exploracion temprana
    del espacio de diseno (evaluacion ~1ms).
    """

    def predict(self, design: DroneDesign) -> PerformanceMetrics:
        m = PerformanceMetrics()

        altitude_factor = AIR_DENSITY_4000M / AIR_DENSITY_SEA

        m.payload_g = design.estimate_payload()
        m.cost_usd = design.estimate_cost()

        m.hover_current_a = self._hover_current(design)
        m.flight_time_min = design.estimate_flight_time(m.hover_current_a)

        m.stability_index = self._stability_index(design)

        m.altitude_performance = self._altitude_performance(design, altitude_factor)

        m.drag_n = self._drag_force(design)
        m.power_w = self._power_consumption(design, m.hover_current_a)
        m.energy_wh = design.battery_cells * 3.7 * design.battery_capacity / 1000.0

        m.disc_loading_g_dm2 = self._disk_loading(design)
        m.reynolds_prop = self._reynolds_propeller(design)

        m.max_speed_ms = self._max_speed(design, m.drag_n)

        return m

    def _hover_current(self, design: DroneDesign) -> float:
        motor_data = REFERENCE_MOTORS.get(design.motor_model)
        if motor_data is None:
            return 1.0
        _, max_thrust_g, _, _, amp_max = motor_data

        thrust_per_motor = design.auw / design.motor_count
        thrust_fraction = thrust_per_motor / max_thrust_g if max_thrust_g > 0 else 0.5
        thrust_fraction = max(0.1, min(1.0, thrust_fraction))

        return amp_max * (thrust_fraction ** 1.5)

    def _stability_index(self, design: DroneDesign) -> float:
        avg_arm_m = design.arm_length / 1000.0
        if avg_arm_m <= 0 or design.motor_count <= 0:
            return 0.0
        raw = 1.0 / (avg_arm_m ** 2 * design.motor_count)
        return min(1.0, raw / 20.0)

    def _altitude_performance(self, design: DroneDesign, altitude_factor: float) -> float:
        thrust_sea = self._theoretical_thrust(design, AIR_DENSITY_SEA)
        thrust_alt = self._theoretical_thrust(design, AIR_DENSITY_4000M)
        if thrust_sea <= 0:
            return 0.0
        return thrust_alt / thrust_sea

    def _theoretical_thrust(self, design: DroneDesign, rho: float) -> float:
        kv_rps, _, _, _, _ = self._motor_params(design)
        d_m = design.propeller_diameter * 0.0254
        pitch_m = design.propeller_pitch * 0.0254

        rpm = kv_rps * 60.0 / (2.0 * math.pi * 14.8)
        rpm = max(1000, rpm)

        thrust_n = K_THRUST * rho * (rpm ** 2) * (d_m ** 4) * pitch_m
        return thrust_n * design.motor_count * MOTOR_EFFICIENCY

    def _motor_params(self, design: DroneDesign) -> tuple[float, float, float, float, float]:
        motor_data = REFERENCE_MOTORS.get(design.motor_model)
        if motor_data is None:
            return 1000.0, 500.0, 30.0, 20.0, 20.0
        kv, thrust_g, weight_g, cost_usd, amp_max = motor_data
        kv_rps = float(kv) * 2.0 * math.pi / 60.0
        return kv_rps, thrust_g, weight_g, cost_usd, amp_max

    def _drag_force(self, design: DroneDesign) -> float:
        frontal_area = self._frontal_area(design)
        velocity = 10.0
        dynamic_pressure = 0.5 * AIR_DENSITY_4000M * velocity ** 2
        return DRAG_COEFF * frontal_area * dynamic_pressure

    def _frontal_area(self, design: DroneDesign) -> float:
        arm_diameter = 0.01 * design.motor_count * 0.5
        central_area = 0.02
        return central_area + arm_diameter * (design.arm_length / 1000.0)

    def _power_consumption(self, design: DroneDesign, hover_current: float) -> float:
        voltage = design.battery_cells * 3.7
        return voltage * hover_current * ESC_EFFICIENCY

    def _disk_loading(self, design: DroneDesign) -> float:
        d_m = design.propeller_diameter * 0.0254
        total_area = design.motor_count * math.pi * (d_m / 2.0) ** 2
        if total_area <= 0:
            return 0.0
        area_dm2 = total_area * 100.0
        return design.auw / area_dm2 if area_dm2 > 0 else 0.0

    def _reynolds_propeller(self, design: DroneDesign) -> float:
        d_m = design.propeller_diameter * 0.0254
        kv_rps, _, _, _, _ = self._motor_params(design)
        voltage = design.battery_cells * 3.7
        rpm = kv_rps * voltage * 60.0 / (2.0 * math.pi)
        rpm = max(1000, rpm)
        tip_speed = rpm / 60.0 * math.pi * d_m
        mu = 1.8e-5
        return AIR_DENSITY_4000M * tip_speed * d_m / mu

    def _max_speed(self, design: DroneDesign, drag_n: float) -> float:
        motor_data = REFERENCE_MOTORS.get(design.motor_model)
        if motor_data is None:
            return 5.0
        kv_rps, _, _, _, _ = self._motor_params(design)
        voltage = design.battery_cells * 3.7
        max_rpm = kv_rps * voltage * 60.0 / (2.0 * math.pi)
        d_m = design.propeller_diameter * 0.0254
        pitch_m = design.propeller_pitch * 0.0254
        theoretical_speed = (max_rpm / 60.0) * pitch_m
        return theoretical_speed * PROPELLER_EFFICIENCY


class SurrogateTrainer:
    """Entrenador del surrogate basado en feedback de simulacion.

    Colecciona pares (parametros de diseno, resultados de simulacion)
    y calcula factores de correccion para mejorar la precision del
    PhysicsSurrogate. Cada iteracion del pipeline ajusta los
    coeficientes analiticos con datos reales de simulacion.

    Usage:
        trainer = SurrogateTrainer()
        trainer.add_sample(design_params, sim_metrics)
        corrections = trainer.compute_corrections()
        adjusted_metrics = trainer.correct_prediction(raw_metrics)
    """

    def __init__(self) -> None:
        self.samples: list[dict[str, Any]] = []
        self._convergence_history: list[float] = []

    def add_sample(
        self,
        design_params: dict[str, float],
        sim_metrics: dict[str, float],
    ) -> None:
        """Registra un par diseno → simulacion para entrenamiento."""
        self.samples.append({
            "design": design_params,
            "simulation": sim_metrics,
            "iteration": len(self.samples),
        })

    def compute_corrections(self) -> dict[str, float]:
        """Calcula factores de correccion basados en errores de prediccion.

        Returns:
            Dict con factores multiplicativos para cada metrica.
            Valores > 1.0 = surrogate subestima, < 1.0 = sobreestima.
        """
        if len(self.samples) < 2:
            return {}

        corrections = {}
        metrics = [
            "flight_time_min", "hover_current_a", "max_speed_ms",
            "power_w", "stability_index",
        ]

        for metric in metrics:
            predicted = []
            actual = []
            for s in self.samples[-3:]:  # ultimas 3 muestras
                des = s["design"]
                sim = s["simulation"]
                if metric in sim and metric in des:
                    predicted.append(des.get(metric, 1.0))
                    actual.append(sim.get(metric, 1.0))

            if predicted and actual:
                avg_pred = sum(predicted) / len(predicted)
                avg_act = sum(actual) / len(actual)
                if avg_pred > 0:
                    corrections[metric] = avg_act / avg_pred

        return corrections

    def correct_prediction(
        self,
        raw_metrics: dict[str, float],
        corrections: dict[str, float],
    ) -> dict[str, float]:
        """Aplica factores de correccion a una prediccion raw.

        Si no hay correccion para una metrica, devuelve el valor raw.
        """
        corrected = dict(raw_metrics)
        for metric, factor in corrections.items():
            if metric in corrected:
                corrected[metric] = corrected[metric] * factor
        return corrected

    def convergence_score(self) -> float:
        """Calcula convergencia basada en cuan estables son las metricas.

        Returns:
            0.0 = sin convergencia, 1.0 = completamente convergido.
        """
        if len(self.samples) < 3:
            return 0.0

        # Coeficiente de variacion de las ultimas iteraciones
        flight_times = [s["simulation"].get("flight_time_min", 0)
                        for s in self.samples[-3:]]
        if not flight_times or max(flight_times) == 0:
            return 0.0

        mean_ft = sum(flight_times) / len(flight_times)
        variance = sum((ft - mean_ft) ** 2 for ft in flight_times) / len(flight_times)
        cv = math.sqrt(variance) / mean_ft if mean_ft > 0 else 1.0

        return max(0.0, min(1.0, 1.0 - cv))

    def summary(self) -> str:
        """Reporte de entrenamiento."""
        conv = self.convergence_score()
        corrections = self.compute_corrections()
        lines = [
            "=== SurrogateTrainer ===",
            f"Samples: {len(self.samples)}",
            f"Convergence: {conv:.3f}",
            f"Corrections: {len(corrections)} metrics",
        ]
        for metric, factor in corrections.items():
            lines.append(f"  {metric}: x{factor:.3f}")
        return "\n".join(lines)


class TransformerSurrogate:
    """v1.0: Transformer encoder que aprende de datos simulados.

    Pendiente de implementacion. Por ahora delega a PhysicsSurrogate
    y provee la interfaz para futuro entrenamiento.
    """

    def __init__(self) -> None:
        self._physics = PhysicsSurrogate()
        self._trained = False
        self._model: Any = None

    @property
    def is_trained(self) -> bool:
        return self._trained

    def train(
        self,
        dataset: list[tuple[DroneDesign, PerformanceMetrics]],
        epochs: int = 100,
    ) -> dict[str, float]:
        """Entrena el transformer con datos simulados.

        Args:
            dataset: Lista de (DroneDesign, PerformanceMetrics).
            epochs: Epocas de entrenamiento.

        Returns:
            Dict con metricas de entrenamiento.

        Raises:
            NotImplementedError: hasta que se implemente el modelo real.
        """
        raise NotImplementedError(
            "TransformerSurrogate requiere implementacion del modelo transformer. "
            "Usa PhysicsSurrogate.predict() mientras tanto."
        )

    def predict(self, design: DroneDesign) -> PerformanceMetrics:
        if self._trained:
            raise NotImplementedError(
                "Modelo entrenado aun no implementado. "
                "Usa PhysicsSurrogate.predict() mientras tanto."
            )
        return self._physics.predict(design)
