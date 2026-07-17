import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, ".")

from agent.cerebellum import FlightResult, FlightState, Position, Waypoint
from agent.hard_skills import HardSkills, Polygon
from agent.soft_skills import SoftSkills, MissionResult


class TestHardSkills:
    def test_hard_skills_init(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        assert hs._cb == mock_cerebellum
        assert hs._default_timeout == 30.0

    def test_takeoff_result_structure(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.takeoff(50.0)
        assert isinstance(result, FlightResult)
        assert result.success is True
        assert result.operation == "takeoff"
        assert "duration_s" in result.metrics

    def test_takeoff_zero_altitude(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.takeoff(0)
        assert result.success is False
        assert "positive" in result.error

    def test_takeoff_exceeds_max(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.takeoff(501)
        assert result.success is False
        assert "500m" in result.error

    def test_land_result(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.land()
        assert isinstance(result, FlightResult)
        assert result.success is True
        assert result.operation == "land"
        assert "duration_s" in result.metrics

    def test_navigate_with_empty_waypoints(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.navigate([])
        assert result.success is False
        assert "No waypoints" in result.error

    def test_navigate_with_waypoints(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        wps = [
            Waypoint(Position(-16.5, -68.15, 4050.0)),
            Waypoint(Position(-16.5, -68.14, 4050.0)),
        ]
        result = hs.navigate(wps)
        assert result.success is True
        assert result.operation == "navigate"
        assert result.metrics["waypoints_visited"] == 2

    def test_hover_positive_duration(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.hover(5.0)
        assert result.success is True
        assert result.operation == "hold"
        assert result.metrics["hover_target_s"] == 5.0

    def test_hover_zero_duration(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.hover(0)
        assert result.success is False

    def test_hover_exceeds_limit(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.hover(301)
        assert result.success is False

    def test_track_with_target(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        result = hs.track("vehicle-01")
        assert result.success is True
        assert result.operation == "track"
        assert result.metrics["target"] == "vehicle-01"

    def test_track_empty_target(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.track("")
        assert result.success is False

    def test_track_not_flying(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.IDLE
        hs = HardSkills(mock_cerebellum)
        result = hs.track("vehicle")
        assert result.success is False

    def test_thermal_scan_valid_polygon(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        poly = Polygon([
            Position(-16.5, -68.15, 4000),
            Position(-16.5, -68.14, 4000),
            Position(-16.49, -68.14, 4000),
        ])
        result = hs.thermal_scan(poly)
        assert result.operation == "thermal_scan"
        assert result.metrics["scan_waypoints"] > 0

    def test_thermal_scan_few_vertices(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        poly = Polygon([Position(-16.5, -68.15, 4000), Position(-16.5, -68.14, 4000)])
        result = hs.thermal_scan(poly)
        assert result.success is False
        assert "at least 3 vertices" in result.error

    def test_thermal_scan_not_flying(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.IDLE
        hs = HardSkills(mock_cerebellum)
        poly = Polygon([
            Position(-16.5, -68.15, 4000),
            Position(-16.5, -68.14, 4000),
            Position(-16.49, -68.14, 4000),
        ])
        result = hs.thermal_scan(poly)
        assert result.success is False

    def test_capture_image(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.capture_image()
        assert result.success is True
        assert result.operation == "capture_image"
        assert result.metrics["resolution"] == "4096x2160"

    def test_deliver_payload(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        pos = Position(-16.5, -68.15, 4000)
        result = hs.deliver_payload(pos)
        assert result.operation == "deliver_payload"

    def test_deliver_payload_not_flying(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.IDLE
        hs = HardSkills(mock_cerebellum)
        result = hs.deliver_payload(Position(-16.5, -68.15, 4000))
        assert result.success is False

    def test_emergency_land(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.emergency_land()
        assert result.success is True
        assert result.operation == "emergency_land"

    def test_return_to_launch(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        result = hs.return_to_launch()
        assert result.success is True
        assert result.operation == "rtl"

    def test_all_hard_skills_return_result(self, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        poly = Polygon([Position(-16.5, -68.15, 4000), Position(-16.5, -68.14, 4000), Position(-16.49, -68.14, 4000)])
        skills = [
            hs.takeoff(50),
            hs.land(),
            hs.hover(5),
            hs.track("target"),
        ]
        for result in skills:
            assert isinstance(result, FlightResult)

    def test_generate_scan_pattern(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        poly = Polygon([
            Position(-16.5, -68.15, 4000),
            Position(-16.5, -68.14, 4000),
            Position(-16.49, -68.14, 4000),
        ])
        wps = hs._generate_scan_pattern(poly)
        assert len(wps) > 0
        assert all(isinstance(wp, Waypoint) for wp in wps)

    def test_generate_scan_pattern_few_vertices(self, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        poly = Polygon([Position(-16.5, -68.15, 4000)])
        wps = hs._generate_scan_pattern(poly)
        assert wps == []

    def test_polygon_dataclass(self):
        verts = [Position(-16.5, -68.15, 4000), Position(-16.5, -68.14, 4000)]
        poly = Polygon(verts)
        assert len(poly.vertices) == 2

    def test_polygon_to_dict(self):
        verts = [Position(-16.5, -68.15, 4000)]
        poly = Polygon(verts)
        d = poly.to_dict()
        assert d == [{"lat": -16.5, "lon": -68.15, "alt": 4000.0}]

    def test_polygon_from_dict(self):
        data = [{"lat": -16.5, "lon": -68.15, "alt": 4000.0}]
        poly = Polygon.from_dict(data)
        assert poly.vertices[0].lat == -16.5


class TestSoftSkills:
    def test_soft_skills_init(self, mock_cerebrum, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        assert ss._cerebrum == mock_cerebrum
        assert ss._hs == hs

    def test_mission_result_dataclass(self):
        mr = MissionResult(
            success=True,
            mission_type="survey",
            metrics={"duration": 120.0},
        )
        assert mr.success is True
        assert mr.mission_type == "survey"

    def test_mission_result_to_dict(self):
        mr = MissionResult(success=True, mission_type="test")
        d = mr.to_dict()
        assert d["success"] is True
        assert d["mission_type"] == "test"
        assert "phases" in d

    def test_mission_result_defaults(self):
        mr = MissionResult(False, "inspect")
        assert mr.success is False
        assert mr.phases == []
        assert mr.error is None

    def test_inspect_tunnel_missing_params(self, mock_cerebrum, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        result = ss.inspect_tunnel({})
        assert result.success is False
        assert "Tunnel entrance" in result.error

    def test_survey_open_pit_result(self, mock_cerebrum, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        area = Polygon([
            Position(-16.5, -68.15, 4000),
            Position(-16.5, -68.14, 4000),
            Position(-16.49, -68.14, 4000),
        ])
        result = ss.survey_open_pit(area, resolution=0.5)
        assert isinstance(result, MissionResult)
        assert result.mission_type == "survey_open_pit"
        assert result.metrics["resolution"] == 0.5

    def test_deliver_payload_result(self, mock_cerebrum, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        origin = Position(-16.5, -68.15, 4000)
        dest = Position(-16.5, -68.14, 4050)
        result = ss.deliver_payload(origin, dest, "medical_supplies")
        assert isinstance(result, MissionResult)
        assert result.metrics["payload"] == "medical_supplies"

    def test_follow_pipeline_short_route(self, mock_cerebrum, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        route = [Position(-16.5, -68.15, 4000), Position(-16.5, -68.14, 4050)]
        result = ss.follow_pipeline(route, inspect=False)
        assert isinstance(result, MissionResult)
        assert result.metrics["route_waypoints"] == 2

    def test_follow_pipeline_too_short(self, mock_cerebrum, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        result = ss.follow_pipeline([Position(-16.5, -68.15, 4000)], inspect=False)
        assert result.success is False
        assert "at least 2 positions" in result.error

    def test_emergency_response_no_position(self, mock_cerebrum, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        result = ss.emergency_response({"type": "fire"})
        assert result.success is False
        assert "position required" in result.error

    def test_emergency_response_with_position(self, mock_cerebrum, mock_cerebellum):
        mock_cerebellum.state = FlightState.FLYING
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        result = ss.emergency_response({
            "type": "fire",
            "position": {"lat": -16.5, "lon": -68.15, "alt": 4000},
        })
        assert isinstance(result, MissionResult)
        assert result.metrics["incident_type"] == "fire"

    def test_haversine_distance(self, mock_cerebrum, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        p1 = Position(0.0, 0.0, 0.0)
        p2 = Position(0.0, 1.0, 0.0)
        dist = ss._haversine(p1, p2)
        assert dist == pytest.approx(111.195, rel=1e-3)

    def test_soft_skill_finalize(self, mock_cerebrum, mock_cerebellum):
        hs = HardSkills(mock_cerebellum)
        ss = SoftSkills(mock_cerebrum, hs)
        mission = MissionResult(False, mission_type="test")
        phases = [
            FlightResult(True, "takeoff"),
            FlightResult(True, "land"),
        ]
        result = ss._finalize(mission, phases, {"extra": "data"})
        assert result.success is True
        assert result.metrics["total_phases"] == 2
        assert result.metrics["extra"] == "data"
