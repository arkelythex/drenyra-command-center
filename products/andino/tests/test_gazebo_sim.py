"""Tests for the Gazebo simulation wrapper."""
import pytest
from pathlib import Path

from morphology.design import DroneDesign, FRAME_MOTORS
from morphology.gazebo_sim import (
    simulate,
    simulate_analytical,
    _gazebo_available,
    GAZEBO_WORLDS,
)


class TestAnalyticalSimulation:
    """Tests for the analytical (fallback) simulator."""

    def test_basic_quad(self):
        d = DroneDesign(frame_type="quad", arm_length=250.0, propeller_diameter=10.0)
        r = simulate_analytical(d, "open_pit")
        assert r.success
        assert r.hover_time_s > 0
        assert r.max_altitude_m > 0
        assert 0 <= r.stability_score <= 1
        assert 0 <= r.battery_drain_pct <= 100
        assert not r.crash

    def test_max_altitude_scales_with_twr(self):
        """Higher thrust-to-weight ratio should yield higher max altitude."""
        low_twr = DroneDesign(frame_type="quad", arm_length=200.0, payload_mass=2000)
        high_twr = DroneDesign(frame_type="quad", arm_length=200.0, payload_mass=100)
        r_low = simulate_analytical(low_twr, "open_pit")
        r_high = simulate_analytical(high_twr, "open_pit")
        assert r_high.max_altitude_m >= r_low.max_altitude_m

    def test_underpowered_crashes(self):
        """A design with TWR < 1 should not be able to fly."""
        d = DroneDesign(frame_type="quad", arm_length=500.0, payload_mass=10000, propeller_diameter=5.0)
        r = simulate_analytical(d, "open_pit")
        assert r.crash
        assert r.stability_score == 0.0

    def test_waypoints_scale_with_twr(self):
        d_good = DroneDesign(frame_type="quad", arm_length=200.0, payload_mass=100)  # TWR > 1.5
        d_bad = DroneDesign(frame_type="quad", arm_length=500.0, payload_mass=5000, propeller_diameter=5.0)  # TWR < 1
        r_good = simulate_analytical(d_good, "open_pit")
        r_bad = simulate_analytical(d_bad, "open_pit")
        assert r_good.waypoints_reached >= r_bad.waypoints_reached

    def test_world_affects_performance(self):
        """High altitude should reduce performance vs open pit."""
        d = DroneDesign(frame_type="quad", arm_length=250.0, propeller_diameter=10.0)
        r_open = simulate_analytical(d, "open_pit")
        r_high = simulate_analytical(d, "high_altitude")
        assert r_high.hover_time_s <= r_open.hover_time_s
        assert r_high.avg_wind_recovery_s >= r_open.avg_wind_recovery_s

    def test_tunnel_reduced_stability(self):
        """Tunnel has slightly reduced performance vs open pit."""
        d = DroneDesign(frame_type="quad", arm_length=250.0)
        r_open = simulate_analytical(d, "open_pit")
        r_tunnel = simulate_analytical(d, "tunnel")
        # Tunnel reduces hover time
        assert r_tunnel.hover_time_s <= r_open.hover_time_s

    def test_all_worlds_work(self):
        d = DroneDesign(frame_type="quad", arm_length=250.0)
        for world in ("open_pit", "tunnel", "high_altitude"):
            r = simulate_analytical(d, world)
            assert isinstance(r.hover_time_s, float)

    def test_coaxial_penalty(self):
        """Coaxial frames have reduced hover time (less efficient)."""
        d_quad = DroneDesign(frame_type="quad", arm_length=250.0)
        d_x8 = DroneDesign(frame_type="x8", arm_length=250.0)
        r_quad = simulate_analytical(d_quad, "open_pit")
        r_x8 = simulate_analytical(d_x8, "open_pit")
        assert r_x8.hover_time_s <= r_quad.hover_time_s

    def test_result_has_all_fields(self):
        d = DroneDesign(frame_type="quad", arm_length=250.0)
        r = simulate_analytical(d, "open_pit")
        assert hasattr(r, "success")
        assert hasattr(r, "hover_time_s")
        assert hasattr(r, "max_altitude_m")
        assert hasattr(r, "battery_drain_pct")
        assert hasattr(r, "stability_score")
        assert hasattr(r, "waypoints_reached")
        assert hasattr(r, "total_waypoints")
        assert hasattr(r, "avg_wind_recovery_s")
        assert hasattr(r, "crash")
        assert hasattr(r, "data")


class TestUnifiedSimulate:
    """Tests for the unified simulate() entry point."""

    def test_falls_back_to_analytical_when_no_gazebo(self):
        """When Gazebo isn't available, simulate() should use analytical."""
        d = DroneDesign(frame_type="quad", arm_length=250.0)
        r = simulate(d, "open_pit", prefer_gazebo=True)
        assert r.success

    def test_gazebo_available_flag(self):
        """_gazebo_available() should return False in test environment."""
        assert not _gazebo_available()

    def test_default_world_is_open_pit(self):
        d = DroneDesign(frame_type="quad", arm_length=250.0)
        r = simulate(d)
        assert r.data.get("world", "open_pit") == "open_pit"

    def test_world_files_exist(self):
        """All configured world files should exist on disk."""
        for name, rel_path in GAZEBO_WORLDS.items():
            path = Path(rel_path)
            assert path.exists(), f"World file not found: {path}"


class TestDesignsInSimulation:
    """All 5 frame types should produce valid simulation results."""

    @pytest.mark.parametrize("frame_type", ["quad", "y6", "x8", "hexa", "octo"])
    def test_all_frame_types(self, frame_type: str):
        d = DroneDesign(frame_type=frame_type, arm_length=250.0)  # type: ignore
        r = simulate_analytical(d)
        assert r.success or r.crash  # Crash is a valid result for underpowered configs
        assert r.hover_time_s >= 0
        assert r.max_altitude_m >= 0
