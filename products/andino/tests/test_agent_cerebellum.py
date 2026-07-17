import sys
import time
from unittest.mock import patch

import pytest

sys.path.insert(0, ".")

from agent.cerebellum import Cerebellum, FlightState, FlightResult, Position, Waypoint, Telemetry


class TestCerebellum:
    def test_flight_state_enum(self):
        assert FlightState.IDLE is not None
        assert FlightState.ARMED is not None
        assert FlightState.TAKEOFF is not None
        assert FlightState.FLYING is not None
        assert FlightState.LANDING is not None
        assert FlightState.EMERGENCY is not None

    def test_flight_state_values(self):
        expected = {"IDLE", "ARMED", "TAKEOFF", "FLYING", "LANDING", "EMERGENCY"}
        assert set(FlightState.__members__) == expected

    def test_cerebellum_init_defaults(self):
        cb = Cerebellum()
        assert cb._connection_url == "udp://:14540"
        assert cb._heartbeat_timeout == 5.0
        assert cb._telemetry_interval == 0.1
        assert cb._base_amsl == 0.0
        assert cb.state == FlightState.IDLE
        assert cb.is_connected is False

    def test_cerebellum_init_custom(self):
        cb = Cerebellum(
            connection_url="udp://:14550",
            heartbeat_timeout_s=10.0,
            telemetry_interval_hz=20.0,
            base_amsl=4000.0,
        )
        assert cb._connection_url == "udp://:14550"
        assert cb._heartbeat_timeout == 10.0
        assert cb._base_amsl == 4000.0

    def test_connect_simulation_mode(self):
        cb = Cerebellum()
        with patch("agent.cerebellum.logger") as mock_log:
            result = cb.connect()
            assert result is True
            assert cb.is_connected is True

    def test_disconnect(self):
        cb = Cerebellum()
        cb.connect()
        assert cb.is_connected is True
        cb.disconnect()
        assert cb.is_connected is False
        assert cb.state == FlightState.IDLE

    def test_state_transitions(self):
        cb = Cerebellum()
        cb._set_state(FlightState.ARMED)
        assert cb.state == FlightState.ARMED
        cb._set_state(FlightState.TAKEOFF)
        assert cb.state == FlightState.TAKEOFF
        cb._set_state(FlightState.FLYING)
        assert cb.state == FlightState.FLYING
        cb._set_state(FlightState.LANDING)
        assert cb.state == FlightState.LANDING
        cb._set_state(FlightState.IDLE)
        assert cb.state == FlightState.IDLE

    def test_arm(self):
        cb = Cerebellum()
        cb._set_state(FlightState.IDLE)
        result = cb.arm()
        assert result.success is True
        assert result.operation == "arm"
        assert cb.state == FlightState.ARMED

    def test_arm_wrong_state(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        result = cb.arm()
        assert result.success is False
        assert "Cannot arm from FLYING" in result.error

    def test_disarm(self):
        cb = Cerebellum()
        cb._set_state(FlightState.ARMED)
        result = cb.disarm()
        assert result.success is True
        assert result.operation == "disarm"
        assert cb.state == FlightState.IDLE

    def test_disarm_wrong_state(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        result = cb.disarm()
        assert result.success is False

    def test_takeoff(self):
        cb = Cerebellum()
        cb._set_state(FlightState.ARMED)
        result = cb.takeoff(50.0)
        assert result.success is True
        assert result.operation == "takeoff"
        assert result.metrics["target_altitude"] == 50.0
        assert cb.state == FlightState.FLYING

    def test_takeoff_zero_altitude(self):
        cb = Cerebellum()
        cb._set_state(FlightState.ARMED)
        result = cb.takeoff(0)
        assert result.success is False
        assert "Altitude must be positive" in result.error

    def test_takeoff_wrong_state(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        result = cb.takeoff(50)
        assert result.success is False

    def test_land(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        result = cb.land()
        assert result.success is True
        assert result.operation == "land"
        assert cb.state == FlightState.IDLE

    def test_land_wrong_state(self):
        cb = Cerebellum()
        assert cb.state == FlightState.IDLE
        result = cb.land()
        assert result.success is False

    def test_goto(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        cb._drone = None
        pos = Position(-16.5, -68.15, 4000.0)
        with patch("asyncio.get_event_loop") as mock_loop:
            mock_loop.return_value = None
            result = cb.goto(pos)
        assert result.success is True
        assert result.operation == "goto"

    def test_goto_wrong_state(self):
        cb = Cerebellum()
        pos = Position(-16.5, -68.15, 4000.0)
        result = cb.goto(pos)
        assert result.success is False

    def test_hold(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        result = cb.hold()
        assert result.success is True
        assert result.operation == "hold"

    def test_hold_wrong_state(self):
        cb = Cerebellum()
        result = cb.hold()
        assert result.success is False

    def test_rtl(self):
        cb = Cerebellum()
        cb._set_state(FlightState.FLYING)
        result = cb.rtl()
        assert result.success is True
        assert result.operation == "rtl"

    def test_emergency_stop(self):
        cb = Cerebellum()
        result = cb.emergency_stop()
        assert result.success is True
        assert result.operation == "emergency_stop"
        assert cb.state == FlightState.EMERGENCY

    def test_emergency_land(self):
        cb = Cerebellum()
        result = cb.emergency_land()
        assert result.success is True
        assert result.operation == "emergency_land"
        assert cb.state == FlightState.EMERGENCY

    def test_heartbeat_check_connected(self):
        cb = Cerebellum()
        cb._connected = True
        cb._last_heartbeat = time.time()
        assert cb.check_heartbeat() is True

    def test_heartbeat_check_disconnected(self):
        cb = Cerebellum()
        assert cb.check_heartbeat() is False

    def test_heartbeat_check_timeout(self):
        cb = Cerebellum(heartbeat_timeout_s=0.1)
        cb._connected = True
        cb._last_heartbeat = time.time() - 1.0
        assert cb.check_heartbeat() is False
        assert cb.state == FlightState.EMERGENCY

    def test_update_heartbeat(self):
        cb = Cerebellum()
        cb.update_heartbeat()
        assert abs(time.time() - cb._last_heartbeat) < 0.1

    def test_altitude_compensation_low_altitude(self):
        cb = Cerebellum(base_amsl=1000.0)
        assert cb._compensate_altitude(50.0) == 50.0

    def test_altitude_compensation_high_altitude(self):
        cb = Cerebellum(base_amsl=4000.0)
        result = cb._compensate_altitude(50.0)
        expected = round(50.0 * (1.0 + 1.0 * 0.10), 1)
        assert result == expected

    def test_altitude_compensation_at_threshold(self):
        cb = Cerebellum(base_amsl=3000.0)
        assert cb._compensate_altitude(50.0) == 50.0

    def test_altitude_compensation_above_threshold(self):
        cb = Cerebellum(base_amsl=5000.0)
        result = cb._compensate_altitude(100.0)
        delta_km = (5000.0 - 3000.0) / 1000.0
        expected = round(100.0 * (1.0 + delta_km * 0.10), 1)
        assert result == expected

    def test_state_callbacks(self):
        cb = Cerebellum()
        calls = []
        cb.on_state_change(lambda s: calls.append(s.name))
        cb._set_state(FlightState.ARMED)
        assert "ARMED" in calls

    def test_telemetry_callbacks(self):
        cb = Cerebellum()
        calls = []
        cb.on_telemetry(lambda t: calls.append(t))
        assert len(calls) == 0

    def test_get_last_telemetry_none(self):
        cb = Cerebellum()
        assert cb.get_last_telemetry() is None

    def test_telemetry_initialized_empty(self):
        cb = Cerebellum()
        assert len(cb._telemetry_callbacks) == 0
        assert len(cb._state_callbacks) == 0

    def test_flight_result_dataclass(self):
        r = FlightResult(True, "test", metrics={"duration": 10.5})
        assert r.success is True
        assert r.operation == "test"
        assert r.metrics["duration"] == 10.5
        assert r.error is None

    def test_flight_result_with_error(self):
        r = FlightResult(False, "fail", error="Something went wrong")
        assert r.success is False
        assert r.error == "Something went wrong"

    def test_flight_result_to_dict(self):
        r = FlightResult(True, "arm", metrics={"state": "armed"})
        d = r.to_dict()
        assert d["success"] is True
        assert d["operation"] == "arm"

    def test_position_dataclass(self):
        p = Position(-16.5, -68.15, 4000.0)
        assert p.lat == -16.5
        assert p.lon == -68.15
        assert p.alt == 4000.0

    def test_position_to_dict(self):
        p = Position(-16.5, -68.15, 4000.0)
        d = p.to_dict()
        assert d == {"lat": -16.5, "lon": -68.15, "alt": 4000.0}

    def test_position_from_dict(self):
        d = {"lat": -16.5, "lon": -68.15, "alt": 4000.0}
        p = Position.from_dict(d)
        assert p.lat == -16.5
        assert p.lon == -68.15
        assert p.alt == 4000.0

    def test_waypoint_dataclass(self):
        p = Position(-16.5, -68.15, 4000.0)
        wp = Waypoint(p, tolerance=1.0, speed=10.0)
        assert wp.position == p
        assert wp.tolerance == 1.0
        assert wp.speed == 10.0

    def test_waypoint_to_dict(self):
        wp = Waypoint(Position(-16.5, -68.15, 4000.0))
        d = wp.to_dict()
        assert "position" in d
        assert d["tolerance"] == 2.0

    def test_telemetry_dataclass(self):
        p = Position(-16.5, -68.15, 4000.0)
        t = Telemetry(
            position=p,
            battery_voltage=16.8,
            battery_percent=85.0,
            ground_speed_ms=10.0,
            air_speed_ms=12.0,
            altitude_amsl=4050.0,
            altitude_agl=50.0,
            heading_deg=180.0,
        )
        assert t.position == p
        assert t.battery_voltage == 16.8

    def test_telemetry_to_dict(self):
        t = Telemetry(
            position=Position(-16.5, -68.15, 4000.0),
            battery_voltage=16.8, battery_percent=85.0,
            ground_speed_ms=10.0, air_speed_ms=12.0,
            altitude_amsl=4050.0, altitude_agl=50.0, heading_deg=180.0,
        )
        d = t.to_dict()
        assert "position" in d
        assert d["battery_voltage"] == 16.8
