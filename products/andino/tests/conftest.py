import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from morphology.design import DroneDesign
from agent.cerebellum import FlightState, FlightResult
from agent.cerebrum import ModelSize


@pytest.fixture
def default_design():
    return DroneDesign(
        frame_type="quad",
        arm_length=250.0,
        arm_angle=45.0,
        motor_model="4010_700kv",
        propeller_diameter=13.0,
        propeller_pitch=4.5,
        battery_cells=6,
        battery_capacity=10000.0,
        frame_material="carbon",
        payload_mass=800.0,
    )


@pytest.fixture
def heavy_design():
    return DroneDesign(
        frame_type="octo",
        arm_length=350.0,
        arm_angle=22.5,
        motor_model="5010_480kv",
        propeller_diameter=15.0,
        propeller_pitch=5.0,
        battery_cells=12,
        battery_capacity=16000.0,
        frame_material="carbon",
        payload_mass=5000.0,
    )


@pytest.fixture
def light_design():
    return DroneDesign(
        frame_type="y6",
        arm_length=180.0,
        arm_angle=30.0,
        motor_model="2207_2450kv",
        propeller_diameter=6.0,
        propeller_pitch=3.5,
        battery_cells=4,
        battery_capacity=4200.0,
        frame_material="pla",
        payload_mass=200.0,
    )


@pytest.fixture
def mock_cerebellum():
    mock = MagicMock()
    mock.state = FlightState.IDLE
    mock.is_connected = True
    mock.connection_url = "udp://:14540"
    mock.base_amsl = 4000.0
    mock.arm.return_value = FlightResult(True, "arm")
    mock.takeoff.return_value = FlightResult(True, "takeoff")
    mock.land.return_value = FlightResult(True, "land")
    mock.goto.return_value = FlightResult(True, "goto")
    mock.emergency_land.return_value = FlightResult(True, "emergency_land")
    mock.hold.return_value = FlightResult(True, "hold")
    mock.rtl.return_value = FlightResult(True, "rtl")
    mock.disconnect.return_value = True
    return mock


@pytest.fixture
def mock_cerebrum():
    mock = MagicMock()
    mock.reason.return_value = "Analysis complete."
    mock.plan.return_value = [
        {"phase_name": "takeoff", "action": "takeoff", "parameters": {"altitude": 50}},
        {"phase_name": "survey", "action": "navigate", "parameters": {"waypoints": []}},
        {"phase_name": "land", "action": "land", "parameters": {}},
    ]
    mock.reflect.return_value = "Mission completed successfully."
    return mock
