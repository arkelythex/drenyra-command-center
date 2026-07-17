#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# run_simulation.sh — Lanzar simulación Gazebo + ROS 2
# ============================================================

echo "Sourcing ROS 2..."
source /opt/ros/rolling/setup.bash 2>/dev/null || source /opt/ros/humble/setup.bash 2>/dev/null || {
    echo "Error: ROS 2 no encontrado en /opt/ros/"
    exit 1
}

echo "Sourcing workspace..."
cd "$(dirname "$0")/../ros2_ws"
source install/setup.bash 2>/dev/null || {
    echo "Warning: workspace no compilado aún. Ejecutá 'colcon build' primero."
}

echo "Lanzando simulación..."
ros2 launch drone_bringup simulation.launch.py
