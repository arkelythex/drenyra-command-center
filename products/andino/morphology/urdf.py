"""Generador de URDF para Gazebo a partir de DroneDesign.

Convierte parametros morfologicos del DSL en modelos URDF listos
para simular en Gazebo + PX4 SITL. Soporta todos los frame types:

    - quad: 4 brazos, 1 motor cada uno
    - y6:   3 brazos coaxiales, 6 motores
    - x8:   4 brazos coaxiales, 8 motores
    - hexa: 6 brazos, 6 motores
    - octo:  8 brazos, 8 motores

NOTA: Genera URDF puro (no xacro). Todos los valores se precalculan
en Python para no depender del runtime de ROS 2.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from .design import DroneDesign, FRAME_MOTORS, REFERENCE_MOTORS

# ── Constants ─────────────────────────────────────────────────────────────────

ARM_RADIUS = 0.008          # m — espesor del brazo de carbono
COAXIAL_SPACING = 0.085     # m — separacion entre motores coaxiales
PROP_THICKNESS = 0.0015     # m — espesor de helice
MOTOR_RADIUS = 0.025        # m — radio del motor
MOTOR_HEIGHT = 0.035        # m — altura del motor
BASE_RADIUS = 0.09          # m — radio de la placa central
BASE_THICKNESS = 0.005      # m — espesor de la placa central
PI = math.pi

# Materiales URDF predefinidos
MATERIALS = {
    "carbon": '<material name="carbon"><color rgba="0.05 0.05 0.05 1.0"/></material>',
    "carbon_silver": '<material name="carbon_silver"><color rgba="0.15 0.15 0.16 1.0"/></material>',
    "red": '<material name="red"><color rgba="0.85 0.15 0.05 1.0"/></material>',
    "blue": '<material name="blue"><color rgba="0.05 0.25 0.85 1.0"/></material>',
    "orange": '<material name="orange"><color rgba="1.0 0.45 0.0 1.0"/></material>',
    "white": '<material name="white"><color rgba="0.85 0.85 0.85 1.0"/></material>',
}


@dataclass
class ArmConfig:
    """Configuracion geometrica de un brazo del dron."""
    name: str
    angle: float          # angulo en radianes
    x: float              # posicion X del extremo del brazo (m)
    y: float              # posicion Y del extremo del brazo (m)
    top_spin: str = "red"     # color/sentido helice superior
    bottom_spin: str = "blue" # color/sentido helice inferior
    coaxial: bool = False     # si tiene 2 motores (coaxial stack)
    motor_num_top: int = 1
    motor_num_bottom: int = 2


def _cylinder_inertia(mass: float, radius: float, height: float) -> str:
    return (
        f'<inertia ixx="{mass * (3*radius**2 + height**2) / 12}" '
        f'iyy="{mass * (3*radius**2 + height**2) / 12}" '
        f'izz="{mass * radius**2 / 2}" '
        f'ixy="0.0" ixz="0.0" iyz="0.0"/>'
    )


def _box_inertia(mass: float, x: float, y: float, z: float) -> str:
    return (
        f'<inertia ixx="{mass * (y**2 + z**2) / 12}" '
        f'iyy="{mass * (x**2 + z**2) / 12}" '
        f'izz="{mass * (x**2 + y**2) / 12}" '
        f'ixy="0.0" ixz="0.0" iyz="0.0"/>'
    )


def _get_arm_layout(frame_type: str, arm_length_m: float) -> list[ArmConfig]:
    """Calcula posiciones de brazos segun el frame type.

    Returns:
        Lista de ArmConfig con geometria de cada brazo.
    """
    layouts: dict[str, list[dict[str, Any]]] = {
        "quad": [
            {"name": "fr", "angle": PI / 4},
            {"name": "fl", "angle": 3 * PI / 4},
            {"name": "bl", "angle": 5 * PI / 4},
            {"name": "br", "angle": 7 * PI / 4},
        ],
        "x8": [
            {"name": "fr", "angle": PI / 4},
            {"name": "fl", "angle": 3 * PI / 4},
            {"name": "bl", "angle": 5 * PI / 4},
            {"name": "br", "angle": 7 * PI / 4},
        ],
        "y6": [
            {"name": "f", "angle": PI / 2},
            {"name": "bl", "angle": 7 * PI / 6},
            {"name": "br", "angle": 11 * PI / 6},
        ],
        "hexa": [
            {"name": "f", "angle": PI / 2},
            {"name": "fr", "angle": PI / 6},
            {"name": "br", "angle": 11 * PI / 6},
            {"name": "b", "angle": 3 * PI / 2},
            {"name": "bl", "angle": 7 * PI / 6},
            {"name": "fl", "angle": 5 * PI / 6},
        ],
        "octo": [
            {"name": "f", "angle": PI / 2},
            {"name": "fr", "angle": PI / 4},
            {"name": "r", "angle": 0},
            {"name": "br", "angle": 7 * PI / 4},
            {"name": "b", "angle": 3 * PI / 2},
            {"name": "bl", "angle": 5 * PI / 4},
            {"name": "l", "angle": PI},
            {"name": "fl", "angle": 3 * PI / 4},
        ],
    }

    is_coaxial = frame_type in ("x8", "y6")
    spin_pattern = ["red", "blue", "blue", "red", "red", "blue", "blue", "red"]
    arms = []
    motor_num = 1

    for i, cfg in enumerate(layouts.get(frame_type, layouts["quad"])):
        angle = cfg["angle"]
        # Naming: arm type name + position
        arm_name = f"arm_{cfg['name']}"

        top_spin = spin_pattern[i % len(spin_pattern)]
        bottom_spin = "blue" if top_spin == "red" else "red"

        arms.append(ArmConfig(
            name=arm_name,
            angle=angle,
            x=arm_length_m * math.cos(angle),
            y=arm_length_m * math.sin(angle),
            top_spin=top_spin,
            bottom_spin=bottom_spin,
            coaxial=is_coaxial,
            motor_num_top=motor_num,
            motor_num_bottom=motor_num + 1,
        ))
        motor_num += 2 if is_coaxial else 1

    return arms


def _generate_arm_xml(arm: ArmConfig, arm_length_m: float, prop_radius_m: float,
                      arm_mass: float, motor_mass: float, prop_mass: float) -> str:
    """Genera XML URDF para un brazo con sus motores y helices.

    Para configuracion coaxial (x8, y6), genera 2 motores por brazo.
    Para configuracion simple (quad, hexa, octo), genera 1 motor.

    Returns:
        String con XML del brazo completo.
    """
    AL = arm_length_m
    CS = COAXIAL_SPACING

    if arm.coaxial:
        # Brazo coaxial: frame → arm → motor_top + motor_bottom → prop_top + prop_bottom
        return f'''
    <!-- {arm.name} — coaxial ({arm.angle:.3f} rad) -->
    <joint name="{arm.name}_joint" type="fixed">
      <parent link="base_link"/>
      <child link="{arm.name}"/>
      <origin xyz="{arm.x} {arm.y} 0" rpy="0 0 {arm.angle}"/>
    </joint>
    <link name="{arm.name}">
      <visual>
        <geometry><cylinder radius="{ARM_RADIUS}" length="{AL}"/></geometry>
        <origin xyz="{AL/2} 0 0" rpy="0 {PI/2} 0"/>
        {MATERIALS["carbon_silver"]}
      </visual>
      <collision>
        <geometry><cylinder radius="{ARM_RADIUS}" length="{AL}"/></geometry>
        <origin xyz="{AL/2} 0 0" rpy="0 {PI/2} 0"/>
      </collision>
      <inertial>
        <mass value="{arm_mass}"/>
        <origin xyz="{AL/2} 0 0"/>
        {_cylinder_inertia(arm_mass, ARM_RADIUS, AL)}
      </inertial>
    </link>

    <joint name="{arm.name}_motor_top_joint" type="fixed">
      <parent link="{arm.name}"/><child link="{arm.name}_motor_top"/>
      <origin xyz="{AL} 0 {CS/2}"/>
    </joint>
    <link name="{arm.name}_motor_top">
      <visual>
        <geometry><cylinder radius="{MOTOR_RADIUS}" length="{MOTOR_HEIGHT}"/></geometry>
        {MATERIALS["carbon_silver"]}
      </visual>
      <collision>
        <geometry><cylinder radius="{MOTOR_RADIUS}" length="{MOTOR_HEIGHT}"/></geometry>
      </collision>
      <inertial>
        <mass value="{motor_mass}"/>
        {_cylinder_inertia(motor_mass, MOTOR_RADIUS, MOTOR_HEIGHT)}
      </inertial>
    </link>

    <joint name="{arm.name}_motor_bottom_joint" type="fixed">
      <parent link="{arm.name}"/><child link="{arm.name}_motor_bottom"/>
      <origin xyz="{AL} 0 {-CS/2}"/>
    </joint>
    <link name="{arm.name}_motor_bottom">
      <visual>
        <geometry><cylinder radius="{MOTOR_RADIUS}" length="{MOTOR_HEIGHT}"/></geometry>
        {MATERIALS["carbon_silver"]}
      </visual>
      <collision>
        <geometry><cylinder radius="{MOTOR_RADIUS}" length="{MOTOR_HEIGHT}"/></geometry>
      </collision>
      <inertial>
        <mass value="{motor_mass}"/>
        {_cylinder_inertia(motor_mass, MOTOR_RADIUS, MOTOR_HEIGHT)}
      </inertial>
    </link>

    <joint name="{arm.name}_prop_top_joint" type="continuous">
      <parent link="{arm.name}_motor_top"/><child link="{arm.name}_prop_top"/>
      <origin xyz="0 0 0.017" rpy="0 0 0"/>
      <axis xyz="0 0 1"/>
      <dynamics damping="0.0005" friction="0.0001"/>
    </joint>
    <link name="{arm.name}_prop_top">
      <visual>
        <geometry><cylinder radius="{prop_radius_m}" length="{PROP_THICKNESS}"/></geometry>
        <material name="{arm.top_spin}"><color rgba="{"1 0 0 1" if arm.top_spin=="red" else "0 0 1 1"}"/></material>
      </visual>
      <collision>
        <geometry><cylinder radius="{prop_radius_m}" length="{PROP_THICKNESS}"/></geometry>
      </collision>
      <inertial>
        <mass value="{prop_mass}"/>
        {_cylinder_inertia(prop_mass, prop_radius_m, PROP_THICKNESS)}
      </inertial>
    </link>

    <joint name="{arm.name}_prop_bottom_joint" type="continuous">
      <parent link="{arm.name}_motor_bottom"/><child link="{arm.name}_prop_bottom"/>
      <origin xyz="0 0 0.017" rpy="0 0 0"/>
      <axis xyz="0 0 1"/>
      <dynamics damping="0.0005" friction="0.0001"/>
    </joint>
    <link name="{arm.name}_prop_bottom">
      <visual>
        <geometry><cylinder radius="{prop_radius_m}" length="{PROP_THICKNESS}"/></geometry>
        <material name="{arm.bottom_spin}"><color rgba="{"1 0 0 1" if arm.bottom_spin=="red" else "0 0 1 1"}"/></material>
      </visual>
      <collision>
        <geometry><cylinder radius="{prop_radius_m}" length="{PROP_THICKNESS}"/></geometry>
      </collision>
      <inertial>
        <mass value="{prop_mass}"/>
        {_cylinder_inertia(prop_mass, prop_radius_m, PROP_THICKNESS)}
      </inertial>
    </link>

    <transmission name="{arm.name}_trans_top">
      <type>transmission_interface/SimpleTransmission</type>
      <joint name="{arm.name}_prop_top_joint">
        <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
      </joint>
      <actuator name="{arm.name}_motor_top"><mechanicalReduction>1</mechanicalReduction></actuator>
    </transmission>
    <transmission name="{arm.name}_trans_bottom">
      <type>transmission_interface/SimpleTransmission</type>
      <joint name="{arm.name}_prop_bottom_joint">
        <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
      </joint>
      <actuator name="{arm.name}_motor_bottom"><mechanicalReduction>1</mechanicalReduction></actuator>
    </transmission>

    <gazebo reference="{arm.name}_prop_top_joint">
      <plugin name="{arm.name}_prop_top_plugin" filename="libgazebo_ros_multicopter_motor_model.so">
        <jointName>{arm.name}_prop_top_joint</jointName>
        <linkName>{arm.name}_prop_top</linkName>
        <turningDirection>{arm.top_spin}</turningDirection>
        <timeConstantUp>0.05</timeConstantUp>
        <timeConstantDown>0.02</timeConstantDown>
        <maxRotVelocity>9000</maxRotVelocity>
        <motorConstant>1.0e-06</motorConstant>
        <momentConstant>0.016</momentConstant>
        <commandSubTopic>/gazebo/command/motor_speed</commandSubTopic>
        <motorNumber>{arm.motor_num_top}</motorNumber>
      </plugin>
    </gazebo>
    <gazebo reference="{arm.name}_prop_bottom_joint">
      <plugin name="{arm.name}_prop_bottom_plugin" filename="libgazebo_ros_multicopter_motor_model.so">
        <jointName>{arm.name}_prop_bottom_joint</jointName>
        <linkName>{arm.name}_prop_bottom</linkName>
        <turningDirection>{arm.bottom_spin}</turningDirection>
        <timeConstantUp>0.05</timeConstantUp>
        <timeConstantDown>0.02</timeConstantDown>
        <maxRotVelocity>9000</maxRotVelocity>
        <motorConstant>1.0e-06</motorConstant>
        <momentConstant>0.016</momentConstant>
        <commandSubTopic>/gazebo/command/motor_speed</commandSubTopic>
        <motorNumber>{arm.motor_num_bottom}</motorNumber>
      </plugin>
    </gazebo>'''
    else:
        # Brazo simple: frame → arm → motor → prop (1 motor por brazo)
        return f'''
    <!-- {arm.name} — simple ({arm.angle:.3f} rad) -->
    <joint name="{arm.name}_joint" type="fixed">
      <parent link="base_link"/>
      <child link="{arm.name}"/>
      <origin xyz="{arm.x} {arm.y} 0" rpy="0 0 {arm.angle}"/>
    </joint>
    <link name="{arm.name}">
      <visual>
        <geometry><cylinder radius="{ARM_RADIUS}" length="{AL}"/></geometry>
        <origin xyz="{AL/2} 0 0" rpy="0 {PI/2} 0"/>
        {MATERIALS["carbon_silver"]}
      </visual>
      <collision>
        <geometry><cylinder radius="{ARM_RADIUS}" length="{AL}"/></geometry>
        <origin xyz="{AL/2} 0 0" rpy="0 {PI/2} 0"/>
      </collision>
      <inertial>
        <mass value="{arm_mass}"/>
        <origin xyz="{AL/2} 0 0"/>
        {_cylinder_inertia(arm_mass, ARM_RADIUS, AL)}
      </inertial>
    </link>

    <joint name="{arm.name}_motor_joint" type="fixed">
      <parent link="{arm.name}"/><child link="{arm.name}_motor"/>
      <origin xyz="{AL} 0 0"/>
    </joint>
    <link name="{arm.name}_motor">
      <visual>
        <geometry><cylinder radius="{MOTOR_RADIUS}" length="{MOTOR_HEIGHT}"/></geometry>
        {MATERIALS["carbon_silver"]}
      </visual>
      <collision>
        <geometry><cylinder radius="{MOTOR_RADIUS}" length="{MOTOR_HEIGHT}"/></geometry>
      </collision>
      <inertial>
        <mass value="{motor_mass}"/>
        {_cylinder_inertia(motor_mass, MOTOR_RADIUS, MOTOR_HEIGHT)}
      </inertial>
    </link>

    <joint name="{arm.name}_prop_joint" type="continuous">
      <parent link="{arm.name}_motor"/><child link="{arm.name}_prop"/>
      <origin xyz="0 0 0.017" rpy="0 0 0"/>
      <axis xyz="0 0 1"/>
      <dynamics damping="0.0005" friction="0.0001"/>
    </joint>
    <link name="{arm.name}_prop">
      <visual>
        <geometry><cylinder radius="{prop_radius_m}" length="{PROP_THICKNESS}"/></geometry>
        <material name="{arm.top_spin}"><color rgba="{"1 0 0 1" if arm.top_spin=="red" else "0 0 1 1"}"/></material>
      </visual>
      <collision>
        <geometry><cylinder radius="{prop_radius_m}" length="{PROP_THICKNESS}"/></geometry>
      </collision>
      <inertial>
        <mass value="{prop_mass}"/>
        {_cylinder_inertia(prop_mass, prop_radius_m, PROP_THICKNESS)}
      </inertial>
    </link>

    <transmission name="{arm.name}_trans">
      <type>transmission_interface/SimpleTransmission</type>
      <joint name="{arm.name}_prop_joint">
        <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
      </joint>
      <actuator name="{arm.name}_motor"><mechanicalReduction>1</mechanicalReduction></actuator>
    </transmission>

    <gazebo reference="{arm.name}_prop_joint">
      <plugin name="{arm.name}_prop_plugin" filename="libgazebo_ros_multicopter_motor_model.so">
        <jointName>{arm.name}_prop_joint</jointName>
        <linkName>{arm.name}_prop</linkName>
        <turningDirection>{arm.top_spin}</turningDirection>
        <timeConstantUp>0.05</timeConstantUp>
        <timeConstantDown>0.02</timeConstantDown>
        <maxRotVelocity>9000</maxRotVelocity>
        <motorConstant>1.0e-06</motorConstant>
        <momentConstant>0.016</momentConstant>
        <commandSubTopic>/gazebo/command/motor_speed</commandSubTopic>
        <motorNumber>{arm.motor_num_top}</motorNumber>
      </plugin>
    </gazebo>'''


class URDFGenerator:
    """Genera modelos URDF para Gazebo desde DroneDesign.

    Los archivos generados son URDF puro (no xacro), con todos
    los valores precalculados. Incluye:

    - Brazos con geometria parametrica segun frame_type
    - Motores y helices con inertias calculadas
    - Sensores: IMU, GPS, LiDAR, camaras
    - Plugins Gazebo para multicopter motor model

    Usage:
        gen = URDFGenerator()
        path = gen.generate(design, "output/drone.urdf")
    """

    def __init__(self, output_dir: str | Path = "generated_urdf") -> None:
        self.output_dir = Path(output_dir)

    def generate(
        self,
        design: DroneDesign,
        output_path: str | None = None,
        namespace: str = "drone",
        include_sensors: bool = True,
    ) -> str:
        """Genera archivo URDF a partir del DroneDesign.

        Args:
            design: Diseno del dron a generar.
            output_path: Ruta del archivo .urdf (o auto-naming).
            namespace: Namespace ROS 2 para los plugins.
            include_sensors: Incluir IMU, GPS, LiDAR, camaras.

        Returns:
            Ruta absoluta al archivo .urdf generado.
        """
        # Precalcular constantes fisicas
        arm_length_m = design.arm_length / 1000.0  # mm → m
        prop_radius_m = (design.propeller_diameter * 0.0254) / 2  # in → m
        arm_mass = 0.03 * (arm_length_m / 0.2)  # escalado por longitud
        motor_data = REFERENCE_MOTORS.get(design.motor_model, (1000, 500, 30, 20, 20))
        motor_mass = motor_data[2] / 1000.0  # g → kg
        prop_mass = 0.02 * (prop_radius_m / 0.15)  # escalado por radio
        total_mass_kg = design.auw / 1000.0

        # Calcular layout de brazos
        arms = _get_arm_layout(design.frame_type, arm_length_m)
        motor_count = len(arms) * (2 if design.frame_type in ("x8", "y6") else 1)

        # ── Construir URDF ────────────────────────────────────────────────
        parts = [
            '<?xml version="1.0"?>',
            f'<robot name="andino_{design.frame_type}" xmlns:xacro="http://www.ros.org/wiki/xacro">',
            "",
            "  <!-- GENERATED BY URDFGenerator — DO NOT EDIT BY HAND -->",
            f"  <!-- Frame: {design.frame_type}, Motors: {motor_count} -->",
            f"  <!-- Arm length: {design.arm_length:.0f}mm, Prop: {design.propeller_diameter:.1f}in -->",
            f"  <!-- AUW: {design.auw:.0f}g, TWR: {design.twr:.2f} -->",
            "",
            "  <!-- Materials -->",
            *[f"  {v}" for v in MATERIALS.values()],
            "",
        ]

        # ── Base link ──────────────────────────────────────────────────────
        parts.append(f'''
  <!-- Base frame -->
  <link name="base_link">
    <visual>
      <geometry><cylinder radius="{BASE_RADIUS}" length="{BASE_THICKNESS}"/></geometry>
      {MATERIALS["carbon"]}
    </visual>
    <collision>
      <geometry><cylinder radius="{BASE_RADIUS}" length="{BASE_THICKNESS}"/></geometry>
    </collision>
    <inertial>
      <mass value="{total_mass_kg * 0.4:.3f}"/>
      <origin xyz="0 0 0"/>
      {_cylinder_inertia(total_mass_kg * 0.4, BASE_RADIUS, BASE_THICKNESS)}
    </inertial>
  </link>
''')

        # ── Arms ───────────────────────────────────────────────────────────
        for arm in arms:
            parts.append(_generate_arm_xml(
                arm, arm_length_m, prop_radius_m,
                arm_mass, motor_mass, prop_mass,
            ))

        # ── Sensors ────────────────────────────────────────────────────────
        if include_sensors:
            parts.append(self._sensors_xml(namespace))

        parts.append("</robot>")
        urdf_content = "\n".join(parts)

        # ── Write file ─────────────────────────────────────────────────────
        self.output_dir.mkdir(parents=True, exist_ok=True)
        if output_path is None:
            output_path = str(self.output_dir / f"andino_{design.frame_type}.urdf")

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(urdf_content)

        return str(out.resolve())

    def _sensors_xml(self, namespace: str = "drone") -> str:
        """Genera XML de sensores: IMU, GPS, LiDAR, camaras, bateria."""
        return f'''
  <!-- Pixhawk (IMU) -->
  <link name="pixhawk_link">
    <visual>
      <geometry><box size="0.068 0.045 0.015"/></geometry>
      {MATERIALS["white"]}
    </visual>
    <collision><geometry><box size="0.068 0.045 0.015"/></geometry></collision>
    <inertial>
      <mass value="0.085"/>
      {_box_inertia(0.085, 0.068, 0.045, 0.015)}
    </inertial>
  </link>
  <joint name="joint_pixhawk" type="fixed">
    <parent link="base_link"/><child link="pixhawk_link"/>
    <origin xyz="0.02 0 0.015" rpy="0 0 0"/>
  </joint>

  <!-- IMU (virtual, attached to pixhawk) -->
  <link name="imu_link"/>
  <joint name="joint_imu" type="fixed">
    <parent link="pixhawk_link"/><child link="imu_link"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </joint>

  <!-- GPS mast -->
  <link name="gps_mast_link">
    <visual>
      <geometry><cylinder radius="0.003" length="0.15"/></geometry>
      <origin xyz="0 0 0.075" rpy="0 0 0"/>
      {MATERIALS["carbon_silver"]}
    </visual>
    <collision><geometry><cylinder radius="0.003" length="0.15"/></geometry></collision>
    <inertial>
      <mass value="0.02"/>
      {_cylinder_inertia(0.02, 0.003, 0.15)}
    </inertial>
  </link>
  <joint name="joint_gps_mast" type="fixed">
    <parent link="base_link"/><child link="gps_mast_link"/>
    <origin xyz="-0.04 0 0.005" rpy="0 0 0"/>
  </joint>

  <!-- GPS receiver -->
  <link name="gps_link">
    <visual>
      <geometry><box size="0.06 0.06 0.015"/></geometry>
      {MATERIALS["orange"]}
    </visual>
    <collision><geometry><box size="0.06 0.06 0.015"/></geometry></collision>
    <inertial>
      <mass value="0.05"/>
      {_box_inertia(0.05, 0.06, 0.06, 0.015)}
    </inertial>
  </link>
  <joint name="joint_gps" type="fixed">
    <parent link="gps_mast_link"/><child link="gps_link"/>
    <origin xyz="0 0 0.15" rpy="0 0 0"/>
  </joint>

  <!-- Battery -->
  <link name="battery_link">
    <visual>
      <geometry><box size="0.150 0.080 0.045"/></geometry>
      {MATERIALS["orange"]}
    </visual>
    <collision><geometry><box size="0.150 0.080 0.045"/></geometry></collision>
    <inertial>
      <mass value="1.2"/>
      {_box_inertia(1.2, 0.150, 0.080, 0.045)}
    </inertial>
  </link>
  <joint name="joint_battery" type="fixed">
    <parent link="base_link"/><child link="battery_link"/>
    <origin xyz="0 0 -0.030" rpy="0 0 0"/>
  </joint>

  <!-- Gazebo plugins: IMU, GPS -->
  <gazebo>
    <plugin name="gazebo_ros_imu" filename="libgazebo_ros_imu_sensor.so">
      <ros><namespace>/{namespace}</namespace></ros>
      <updateRate>200.0</updateRate>
      <bodyName>imu_link</bodyName>
      <topicName>imu/data_raw</topicName>
      <gaussianNoise>0.0003</gaussianNoise>
      <accelerometerGaussianNoise>0.001</accelerometerGaussianNoise>
      <gyroscopeGaussianNoise>0.0003</gyroscopeGaussianNoise>
    </plugin>

    <plugin name="gazebo_ros_gps" filename="libgazebo_ros_gps.so">
      <ros><namespace>/{namespace}</namespace></ros>
      <updateRate>10.0</updateRate>
      <bodyName>gps_link</bodyName>
      <topicName>gps/fix</topicName>
      <gaussianNoise>0.5</gaussianNoise>
      <velocityGaussianNoise>0.1</velocityGaussianNoise>
    </plugin>
  </gazebo>
'''

    def generate_all_configs(
        self,
        base_design: DroneDesign,
        output_dir: str | Path | None = None,
    ) -> list[str]:
        """Genera URDF para todas las configuraciones de frame_type.

        Util para generar la libreria de modelos completa.
        """
        out_dir = Path(output_dir) if output_dir else self.output_dir
        paths = []
        for ft in ("quad", "y6", "x8", "hexa", "octo"):
            design = DroneDesign(
                frame_type=ft,  # type: ignore
                arm_length=base_design.arm_length,
                motor_model=base_design.motor_model,
                propeller_diameter=base_design.propeller_diameter,
                propeller_pitch=base_design.propeller_pitch,
                battery_cells=base_design.battery_cells,
                battery_capacity=base_design.battery_capacity,
                payload_mass=base_design.payload_mass,
            )
            path = self.generate(design, str(out_dir / f"andino_{ft}.urdf"))
            paths.append(path)
        return paths
