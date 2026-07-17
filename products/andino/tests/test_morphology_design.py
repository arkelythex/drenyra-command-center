import pytest
import sys
sys.path.insert(0, '.')

import math
from morphology.design import (
    DroneDesign,
    REFERENCE_MOTORS,
    FRAME_MOTORS,
    MATERIAL_DENSITY,
    PARAM_RANGES,
    AIR_DENSITY_SEA,
    AIR_DENSITY_4000M,
    ValidationError,
)


class TestDroneDesignDefaults:

    def test_default_design(self):
        d = DroneDesign()
        assert d.frame_type == "quad"
        assert d.arm_length == 150.0
        assert d.arm_angle == 0.0
        assert d.motor_model == "2205_2300kv"
        assert d.propeller_diameter == 5.0
        assert d.propeller_pitch == 3.0
        assert d.battery_cells == 4
        assert d.battery_capacity == 1500.0
        assert d.frame_material == "pla"
        assert d.payload_mass == 200.0
        assert d.motor_count == 4
        assert d.auw > 0
        assert d.total_thrust > 0


class TestDesignRoundtrip:

    def test_encode_decode_roundtrip(self, default_design):
        vec = default_design.encode()
        restored = DroneDesign.decode(vec)
        assert restored.frame_type == default_design.frame_type
        assert restored.motor_model == default_design.motor_model
        assert restored.frame_material == default_design.frame_material
        assert restored.arm_length == pytest.approx(default_design.arm_length, rel=1e-4)
        assert restored.arm_angle == pytest.approx(default_design.arm_angle, rel=1e-4)
        assert restored.propeller_diameter == pytest.approx(default_design.propeller_diameter, rel=1e-4)
        assert restored.propeller_pitch == pytest.approx(default_design.propeller_pitch, rel=1e-4)
        assert restored.battery_capacity == pytest.approx(default_design.battery_capacity, rel=1e-4)
        assert restored.payload_mass == pytest.approx(default_design.payload_mass, rel=1e-4)

    def test_encode_bounds(self, default_design):
        vec = default_design.encode()
        for i, v in enumerate(vec):
            assert 0.0 <= v <= 1.0, f"Elemento {i} fuera de rango: {v}"

    def test_decode_bounds(self):
        vec = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        d = DroneDesign.decode(vec)
        assert 50.0 <= d.arm_length <= 500.0
        assert 0.0 <= d.arm_angle <= 60.0
        assert 3.0 <= d.propeller_diameter <= 16.0
        assert 2.0 <= d.propeller_pitch <= 8.0
        assert 3 <= d.battery_cells <= 14
        assert 500.0 <= d.battery_capacity <= 22000.0

        vec_max = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        d_max = DroneDesign.decode(vec_max)
        assert d_max.arm_length == pytest.approx(500.0, rel=1e-4)
        assert d_max.propeller_diameter == pytest.approx(16.0, rel=1e-4)

    def test_decode_invalid_vector_length(self):
        with pytest.raises(ValidationError):
            DroneDesign.decode([0.5, 0.5])

    def test_all_frame_types(self):
        for ft in FRAME_MOTORS:
            d = DroneDesign(frame_type=ft)
            assert d.motor_count == FRAME_MOTORS[ft]
            assert d.frame_type == ft

    def test_all_materials(self):
        for mat in MATERIAL_DENSITY:
            d = DroneDesign(frame_material=mat)
            assert d.frame_material == mat


class TestTWR:

    def test_twr_calculation(self, default_design):
        expected = default_design.total_thrust / default_design.auw
        assert default_design.twr == pytest.approx(expected, rel=1e-6)

    def test_twr_positive(self, default_design):
        assert default_design.twr > 0

    def test_twr_minimum(self):
        heavy = DroneDesign(
            frame_type="quad",
            arm_length=150.0,
            arm_angle=0.0,
            motor_model="2204_2300kv",
            propeller_diameter=5.0,
            propeller_pitch=3.0,
            battery_cells=3,
            battery_capacity=500.0,
            frame_material="pla",
            payload_mass=9000.0,
        )
        errors = heavy.validate()
        twr_errors = [e for e in errors if "TWR" in e]
        assert len(twr_errors) > 0, f"TWR ({heavy.twr:.2f}) deberia ser < 1.8"

    def test_twr_default_validates(self, default_design):
        errors = default_design.validate()
        twr_errors = [e for e in errors if "TWR" in e]
        if default_design.twr < 1.8:
            assert len(twr_errors) > 0
        else:
            assert len(twr_errors) == 0


class TestEstimates:

    def test_flight_time_estimate(self, default_design):
        ft = default_design.estimate_flight_time()
        assert ft > 0
        assert ft < 120

    def test_flight_time_zero_on_invalid(self):
        d = DroneDesign(motor_model="2205_2300kv")
        d.auw = 0
        d.motor_count = 0
        ft = d.estimate_flight_time(hover_current=0.0)
        assert ft == 0.0

    def test_payload_estimate(self, default_design):
        p = default_design.estimate_payload()
        assert p >= 0
        assert p < default_design.total_thrust

    def test_cost_estimate(self, default_design):
        cost = default_design.estimate_cost()
        assert cost > 0
        assert cost < 10000

    def test_auw_reasonable(self, default_design):
        assert default_design.auw > default_design.payload_mass


class TestValidation:

    def test_validate_passes_good_design(self, default_design):
        errors = default_design.validate()
        assert isinstance(errors, list)

    def test_unknown_motor_model(self):
        with pytest.raises(ValidationError):
            DroneDesign(motor_model="FAKE_MOTOR")

    def test_invalid_frame_type_graceful(self):
        d = DroneDesign(frame_type="tri_wtf")
        assert d.motor_count == 4

    def test_encode_unknown_type_fallsback(self):
        d = DroneDesign(frame_type="tri_wtf")
        vec = d.encode()
        restored = DroneDesign.decode(vec)
        assert restored.frame_type == "quad"
