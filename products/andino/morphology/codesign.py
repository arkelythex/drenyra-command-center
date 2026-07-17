"""Co-diseno aerodinamica-controlabilidad (BodyGen-style).

Evalua la controlabilidad de un diseno antes de construir, basado en
geometria de brazos, distribucion de motores, y estimaciones de
momento de inercia.
"""

from __future__ import annotations

import math

from .design import DroneDesign, REFERENCE_MOTORS

# Constantes de control
MAX_TORQUE_PER_MOTOR = 0.05       # Nm (estimado generico)
CG_OFFSET_TOLERANCE = 0.15        # tolerancia CG como fraccion de arm_length


class CoDesign:
    """Evaluacion de co-diseno aerodinamica + control.

    Provee metricas de controlabilidad, margen de estabilidad,
    y capacidad de respuesta. El fitness compuesto combina
    aerodinamica y control para descartar disenos inestables
    antes de simulacion.
    """

    def controllability(self, design: DroneDesign) -> float:
        """Capacidad de generar torque diferencial.

        Basado en geometria de brazos y distribucion de motores.
        Un diseno con brazos largos y mas motores tiene mayor
        capacidad de control.

        Returns:
            Indice normalizado [0, 1].
        """
        arm_m = design.arm_length / 1000.0

        max_moment_arm = self._max_moment_arm(design)
        if max_moment_arm <= 0:
            return 0.0

        torque_capability = MAX_TORQUE_PER_MOTOR * max_moment_arm * design.motor_count

        quad_torque = MAX_TORQUE_PER_MOTOR * 0.15 * 4
        normalized = torque_capability / quad_torque if quad_torque > 0 else 0.0

        return min(1.0, normalized)

    def _max_moment_arm(self, design: DroneDesign) -> float:
        """Brazo de palanca maximo para torque diferencial."""
        arm_m = design.arm_length / 1000.0
        angle_rad = math.radians(design.arm_angle)
        return arm_m * math.cos(angle_rad)

    def stability_margin(self, design: DroneDesign) -> float:
        """Margen de estabilidad estatica.

        Estima distancia entre CG y centro de thrust como fraccion
        del brazo promedio. Valores > 0 indican estabilidad.

        Returns:
            Fraccion [0, 1] donde 1 = optimo.
        """
        # Centro de thrust estimado en el centro geometrico
        # CG estimado como desplazado por payload y bateria
        arm_m = design.arm_length / 1000.0

        payload_offset = 0.0
        if design.auw > 0:
            payload_offset = 0.05 * (design.payload_mass / design.auw)

        total_offset = abs(payload_offset)
        max_allowed = CG_OFFSET_TOLERANCE * arm_m

        if max_allowed <= 0:
            return 0.0

        margin = 1.0 - (total_offset / max_allowed)
        return max(0.0, min(1.0, margin))

    def responsiveness(self, design: DroneDesign) -> float:
        """Capacidad de respuesta = inversa del momento de inercia.

        Estima el momento de inercia como masa * brazo^2.

        Returns:
            Indice normalizado [0, 1].
        """
        if design.auw <= 0:
            return 0.0

        arm_m = design.arm_length / 1000.0
        mass_kg = design.auw / 1000.0

        inertia = mass_kg * (arm_m ** 2) * design.motor_count

        quad_inertia = 0.5 * (0.15 ** 2) * 4
        responsiveness_raw = quad_inertia / inertia if inertia > 0 else 0.0

        return min(1.0, responsiveness_raw)

    def co_design_fitness(self, design: DroneDesign) -> float:
        """Fitness compuesto: aerodinamica + control.

        Combina estabilidad, controlabilidad y respuesta en una
        metrica unica.

        Returns:
            Fitness compuesto [0, 1].
        """
        ctrl = self.controllability(design)
        stab = self.stability_margin(design)
        resp = self.responsiveness(design)

        return 0.4 * ctrl + 0.4 * stab + 0.2 * resp
