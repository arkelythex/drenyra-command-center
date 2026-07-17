from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from .cerebellum import Cerebellum, FlightResult, Position, Waypoint, FlightState

logger = logging.getLogger(__name__)


@dataclass
class Polygon:
    vertices: list[Position]

    def to_dict(self) -> list[dict[str, float]]:
        return [v.to_dict() for v in self.vertices]

    @classmethod
    def from_dict(cls, data: list[dict[str, float]]) -> Polygon:
        return cls(vertices=[Position.from_dict(v) for v in data])


class HardSkills:
    """10 atomic flight skills for AndinoDroneLab.

    Each skill validates inputs, executes via Cerebellum, logs outcome,
    and returns a structured FlightResult with timing and metrics.
    """

    def __init__(self, cerebellum: Cerebellum, default_timeout_s: float = 30.0):
        self._cb = cerebellum
        self._default_timeout = default_timeout_s

    # ── 1. Takeoff ───────────────────────────────────────────────────────

    def takeoff(self, altitude: float) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: takeoff altitude=%.1fm", altitude)
        if altitude <= 0:
            return FlightResult(False, "takeoff", error="Altitude must be positive")
        if altitude > 500:
            return FlightResult(False, "takeoff", error="Altitude exceeds 500m safety limit")

        result = self._cb.takeoff(altitude)
        result.metrics["duration_s"] = round(time.time() - start, 2)
        self._log_result(result)
        return result

    # ── 2. Land ──────────────────────────────────────────────────────────

    def land(self) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: land")
        result = self._cb.land()
        result.metrics["duration_s"] = round(time.time() - start, 2)
        self._log_result(result)
        return result

    # ── 3. Navigate ──────────────────────────────────────────────────────

    def navigate(self, waypoints: list[Waypoint]) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: navigate waypoints=%d", len(waypoints))

        if not waypoints:
            return FlightResult(False, "navigate", error="No waypoints provided")
        if self._cb.state not in (FlightState.FLYING,):
            return FlightResult(False, "navigate", error="Drone must be flying")

        visited = 0
        for i, wp in enumerate(waypoints):
            logger.debug("Navigating to waypoint %d/%d: %s", i + 1, len(waypoints), wp.position.to_dict())
            result = self._cb.goto(wp.position)
            if not result.success:
                return FlightResult(
                    False, "navigate",
                    error=f"Failed at waypoint {i + 1}: {result.error}",
                    metrics={"waypoints_visited": visited, "total_waypoints": len(waypoints)},
                )
            visited += 1
            time.sleep(wp.tolerance * 0.5)

        return FlightResult(
            True, "navigate",
            metrics={
                "waypoints_visited": visited,
                "total_waypoints": len(waypoints),
                "duration_s": round(time.time() - start, 2),
            },
        )

    # ── 4. Hover ─────────────────────────────────────────────────────────

    def hover(self, duration: float) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: hover duration=%.1fs", duration)

        if duration <= 0:
            return FlightResult(False, "hover", error="Duration must be positive")
        if duration > 300:
            return FlightResult(False, "hover", error="Duration exceeds 300s safety limit")

        result = self._cb.hold()
        if result.success:
            time.sleep(min(duration, 300))
        result.metrics["duration_s"] = round(time.time() - start, 2)
        result.metrics["hover_target_s"] = duration
        self._log_result(result)
        return result

    # ── 5. Track ─────────────────────────────────────────────────────────

    def track(self, target: str) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: track target=%s", target)

        if not target:
            return FlightResult(False, "track", error="No target specified")

        if self._cb.state not in (FlightState.FLYING,):
            return FlightResult(False, "track", error="Drone must be flying")

        # In production: vision-based target tracking pipeline
        # Here we simulate tracking offset correction
        time.sleep(1.0)

        return FlightResult(
            True, "track",
            metrics={
                "target": target,
                "tracking_duration_s": round(time.time() - start, 2),
                "method": "simulated_visual_follow",
            },
        )

    # ── 6. Thermal Scan ──────────────────────────────────────────────────

    def thermal_scan(self, area: Polygon) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: thermal_scan vertices=%d", len(area.vertices))

        if len(area.vertices) < 3:
            return FlightResult(False, "thermal_scan", error="Area polygon must have at least 3 vertices")
        if self._cb.state not in (FlightState.FLYING,):
            return FlightResult(False, "thermal_scan", error="Drone must be flying")

        # Generate scan waypoints from polygon and fly them
        scan_wps = self._generate_scan_pattern(area)
        nav_result = self.navigate(scan_wps)

        return FlightResult(
            nav_result.success, "thermal_scan",
            metrics={
                "area_vertices": len(area.vertices),
                "scan_waypoints": len(scan_wps),
                "duration_s": round(time.time() - start, 2),
            },
            error=nav_result.error,
        )

    # ── 7. Capture Image ─────────────────────────────────────────────────

    def capture_image(self) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: capture_image")
        # In production: trigger camera via MAVSDK or GPIO
        time.sleep(0.5)

        return FlightResult(
            True, "capture_image",
            metrics={
                "capture_time_s": round(time.time() - start, 2),
                "resolution": "4096x2160",
                "format": "jpg",
                "storage_path": "/data/captures/",
            },
        )

    # ── 8. Deliver Payload ───────────────────────────────────────────────

    def deliver_payload(self, position: Position) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: deliver_payload target=%s", position.to_dict())

        if self._cb.state not in (FlightState.FLYING,):
            return FlightResult(False, "deliver_payload", error="Drone must be flying")

        result = self._cb.goto(position)
        if result.success:
            time.sleep(2.0)  # Simulate payload release mechanism

        return FlightResult(
            result.success, "deliver_payload",
            metrics={
                "target": position.to_dict(),
                "delivery_duration_s": round(time.time() - start, 2),
            },
            error=result.error,
        )

    # ── 9. Emergency Land ────────────────────────────────────────────────

    def emergency_land(self) -> FlightResult:
        start = time.time()
        logger.warning("HardSkill: emergency_land")
        result = self._cb.emergency_land()
        result.metrics["duration_s"] = round(time.time() - start, 2)
        self._log_result(result)
        return result

    # ── 10. Return To Launch ─────────────────────────────────────────────

    def return_to_launch(self) -> FlightResult:
        start = time.time()
        logger.info("HardSkill: return_to_launch")
        result = self._cb.rtl()
        result.metrics["duration_s"] = round(time.time() - start, 2)
        self._log_result(result)
        return result

    # ── Internal ─────────────────────────────────────────────────────────

    def _generate_scan_pattern(self, area: Polygon) -> list[Waypoint]:
        if len(area.vertices) < 3:
            return []
        lats = [v.lat for v in area.vertices]
        lons = [v.lon for v in area.vertices]
        alt = area.vertices[0].alt
        center_lat = sum(lats) / len(lats)
        center_lon = sum(lons) / len(lons)

        scan_alt = alt + 50.0
        waypoints = []
        # Lawnmower pattern over bounding box
        for i in range(5):
            offset = (i - 2) * 0.0005
            waypoints.append(Waypoint(Position(center_lat - 0.001, center_lon + offset, scan_alt)))
            waypoints.append(Waypoint(Position(center_lat + 0.001, center_lon + offset, scan_alt)))
        return waypoints

    def _log_result(self, result: FlightResult) -> None:
        level = logging.INFO if result.success else logging.ERROR
        logger.log(level, "HardSkill %s: success=%s error=%s metrics=%s",
                    result.operation, result.success, result.error, result.metrics)
