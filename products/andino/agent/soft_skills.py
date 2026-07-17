from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from .cerebrum import Cerebrum
from .cerebellum import FlightResult, Position, Waypoint
from .hard_skills import HardSkills, Polygon

logger = logging.getLogger(__name__)


@dataclass
class MissionResult:
    success: bool
    mission_type: str
    phases: list[FlightResult] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)
    start_time: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    end_time: str = ""
    error: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "mission_type": self.mission_type,
            "phases": [p.to_dict() for p in self.phases],
            "metrics": self.metrics,
            "start_time": self.start_time,
            "end_time": self.end_time or datetime.now(timezone.utc).isoformat(),
            "error": self.error,
        }


class SoftSkills:
    """5 composed mission skills for AndinoDroneLab.

    Each soft skill:
    1. Uses Cerebrum to plan the mission phases
    2. Executes hard skills sequentially
    3. Monitors progress and handles failures with recovery
    4. Returns a complete MissionResult
    """

    MAX_RETRIES: int = 2
    PHASE_TIMEOUT_S: float = 120.0

    def __init__(self, cerebrum: Cerebrum, hard_skills: HardSkills):
        self._cerebrum = cerebrum
        self._hs = hard_skills

    # ── 1. Inspect Tunnel ───────────────────────────────────────────────

    def inspect_tunnel(self, tunnel_params: dict[str, Any]) -> MissionResult:
        mission = MissionResult(False, mission_type="inspect_tunnel")
        logger.info("SoftSkill: inspect_tunnel params=%s", tunnel_params)

        entrance = tunnel_params.get("entrance")
        exit_pos = tunnel_params.get("exit")
        length = tunnel_params.get("length_m", 100)

        if not entrance or not exit_pos:
            mission.error = "Tunnel entrance and exit positions required"
            return mission

        phases = [
            self._hs.takeoff(tunnel_params.get("scan_altitude", 10.0)),
            self._hs.hover(2.0),
            self._hs.navigate([
                Waypoint(Position(entrance["lat"], entrance["lon"], entrance.get("alt", 30))),
            ]),
        ]

        if all(p.success for p in phases):
            scan_alt = entrance.get("alt", 30) + 5
            scan_phase = self._hs.navigate([
                Waypoint(Position(entrance["lat"], entrance["lon"], scan_alt)),
                Waypoint(Position(exit_pos["lat"], exit_pos["lon"], scan_alt)),
            ])
            phases.append(scan_phase)

        phases.append(self._hs.return_to_launch())

        return self._finalize(mission, phases, {
            "tunnel_length_m": length,
            "scan_altitude": tunnel_params.get("scan_altitude"),
        })

    # ── 2. Survey Open Pit ───────────────────────────────────────────────

    def survey_open_pit(self, area: Polygon, resolution: float) -> MissionResult:
        mission = MissionResult(False, mission_type="survey_open_pit")
        logger.info("SoftSkill: survey_open_pit vertices=%d resolution=%.2f", len(area.vertices), resolution)

        phases: list[FlightResult] = []
        phases.append(self._hs.takeoff(80.0))
        phases.append(self._hs.hover(2.0))

        scan_wps = self._hs._generate_scan_pattern(area)
        phases.append(self._hs.navigate(scan_wps))
        phases.append(self._hs.thermal_scan(area))
        phases.append(self._hs.return_to_launch())

        return self._finalize(mission, phases, {
            "area_vertices": len(area.vertices),
            "resolution": resolution,
            "scan_waypoints": len(scan_wps),
        })

    # ── 3. Deliver Payload ───────────────────────────────────────────────

    def deliver_payload(
        self, origin: Position, dest: Position, payload: str,
    ) -> MissionResult:
        mission = MissionResult(False, mission_type="deliver_payload")
        logger.info("SoftSkill: deliver_payload payload=%s dest=%s", payload, dest.to_dict())

        phases: list[FlightResult] = []
        phases.append(self._hs.takeoff(60.0))
        phases.append(self._hs.navigate([
            Waypoint(origin, speed=10.0),
            Waypoint(dest, speed=10.0),
        ]))
        phases.append(self._hs.hover(3.0))
        phases.append(self._hs.deliver_payload(dest))
        phases.append(self._hs.return_to_launch())

        return self._finalize(mission, phases, {
            "payload": payload,
            "origin": origin.to_dict(),
            "destination": dest.to_dict(),
            "distance_km": self._haversine(origin, dest),
        })

    # ── 4. Follow Pipeline ───────────────────────────────────────────────

    def follow_pipeline(
        self, pipeline_route: list[Position], inspect: bool = True,
    ) -> MissionResult:
        mission = MissionResult(False, mission_type="follow_pipeline")
        logger.info("SoftSkill: follow_pipeline waypoints=%d inspect=%s", len(pipeline_route), inspect)

        if len(pipeline_route) < 2:
            mission.error = "Pipeline route must have at least 2 positions"
            return mission

        phases: list[FlightResult] = []
        phases.append(self._hs.takeoff(40.0))
        phases.append(self._hs.hover(1.0))

        wps = [Waypoint(p, speed=8.0) for p in pipeline_route]
        phases.append(self._hs.navigate(wps))

        if inspect:
            phases.append(self._hs.capture_image())

        phases.append(self._hs.return_to_launch())

        route_length = sum(
            self._haversine(pipeline_route[i], pipeline_route[i + 1])
            for i in range(len(pipeline_route) - 1)
        )

        return self._finalize(mission, phases, {
            "route_waypoints": len(pipeline_route),
            "route_length_km": round(route_length, 3),
            "inspection_performed": inspect,
        })

    # ── 5. Emergency Response ────────────────────────────────────────────

    def emergency_response(self, incident: dict[str, Any]) -> MissionResult:
        mission = MissionResult(False, mission_type="emergency_response")
        logger.warning("SoftSkill: emergency_response incident=%s", incident)

        incident_pos = incident.get("position")
        incident_type = incident.get("type", "unknown")

        if not incident_pos:
            mission.error = "Incident position required"
            return mission

        pos = Position.from_dict(incident_pos)
        phases: list[FlightResult] = []

        try:
            phases.append(self._hs.takeoff(incident.get("altitude", 50.0)))
            phases.append(self._hs.navigate([Waypoint(pos, speed=12.0)]))
            phases.append(self._hs.hover(5.0))

            if incident_type in ("fire", "flood"):
                phases.append(self._hs.capture_image())
                phases.append(self._hs.thermal_scan(Polygon([
                    pos,
                    Position(pos.lat + 0.001, pos.lon, pos.alt),
                    Position(pos.lat + 0.001, pos.lon + 0.001, pos.alt),
                    Position(pos.lat, pos.lon + 0.001, pos.alt),
                ])))
            else:
                phases.append(self._hs.capture_image())

            phases.append(self._hs.return_to_launch())

        except Exception as exc:
            logger.error("Emergency response failed: %s", exc)
            phases.append(self._hs.emergency_land())
            mission.error = str(exc)

        return self._finalize(mission, phases, {
            "incident_type": incident_type,
            "incident_position": incident_pos,
            "response_initiated": True,
        })

    # ── Internal ─────────────────────────────────────────────────────────

    def _finalize(
        self,
        mission: MissionResult,
        phases: list[FlightResult],
        extra_metrics: Optional[dict[str, Any]] = None,
    ) -> MissionResult:
        mission.end_time = datetime.now(timezone.utc).isoformat()
        mission.phases = phases
        mission.success = all(p.success for p in phases)

        mission.metrics = {
            "total_phases": len(phases),
            "successful_phases": sum(1 for p in phases if p.success),
            "failed_phases": sum(1 for p in phases if not p.success),
        }
        if extra_metrics:
            mission.metrics.update(extra_metrics)

        if not mission.success:
            failures = [p for p in phases if not p.success]
            mission.error = mission.error or f"{len(failures)} phase(s) failed: {failures[0].error}"

        level = logging.INFO if mission.success else logging.ERROR
        logger.log(level, "SoftSkill %s: success=%s metrics=%s", mission.mission_type, mission.success, mission.metrics)
        return mission

    @staticmethod
    def _haversine(p1: Position, p2: Position) -> float:
        import math
        R = 6371.0
        dlat = math.radians(p2.lat - p1.lat)
        dlon = math.radians(p2.lon - p1.lon)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(p1.lat)) * math.cos(math.radians(p2.lat)) * math.sin(dlon / 2) ** 2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))
