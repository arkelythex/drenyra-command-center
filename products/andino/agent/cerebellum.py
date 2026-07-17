from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)


class FlightState(Enum):
    IDLE = auto()
    ARMED = auto()
    TAKEOFF = auto()
    FLYING = auto()
    LANDING = auto()
    EMERGENCY = auto()


@dataclass
class Position:
    lat: float
    lon: float
    alt: float

    def to_dict(self) -> dict[str, float]:
        return {"lat": self.lat, "lon": self.lon, "alt": self.alt}

    @classmethod
    def from_dict(cls, data: dict[str, float]) -> Position:
        return cls(lat=data["lat"], lon=data["lon"], alt=data.get("alt", 0.0))


@dataclass
class Waypoint:
    position: Position
    tolerance: float = 2.0
    speed: Optional[float] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "position": self.position.to_dict(),
            "tolerance": self.tolerance,
            "speed": self.speed,
        }


@dataclass
class Telemetry:
    position: Position
    battery_voltage: float
    battery_percent: float
    ground_speed_ms: float
    air_speed_ms: float
    altitude_amsl: float
    altitude_agl: float
    heading_deg: float
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "position": self.position.to_dict(),
            "battery_voltage": self.battery_voltage,
            "battery_percent": self.battery_percent,
            "ground_speed_ms": self.ground_speed_ms,
            "air_speed_ms": self.air_speed_ms,
            "altitude_amsl": self.altitude_amsl,
            "altitude_agl": self.altitude_agl,
            "heading_deg": self.heading_deg,
            "timestamp": self.timestamp,
        }


@dataclass
class FlightResult:
    success: bool
    operation: str
    metrics: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "operation": self.operation,
            "metrics": self.metrics,
            "timestamp": self.timestamp,
            "error": self.error,
        }


TELEMETRY_CALLBACK = Callable[[Telemetry], None]
STATE_CALLBACK = Callable[[FlightState], None]


class Cerebellum:
    """Flight Controller Bridge for AndinoDroneLab.

    Wraps MAVSDK (PX4) for drone command-and-control. Handles:
    - State management (IDLE → ARMED → TAKEOFF → FLYING → LANDING)
    - Telemetry callbacks at configurable intervals
    - Emergency procedures (emergency_stop, emergency_land)
    - High-altitude thrust compensation (3000-5000m AMSL)
    - Heartbeat monitoring with configurable timeout
    """

    HIGH_ALT_MSL_MIN: float = 3000.0
    THRUST_COMPENSATION_PER_KM: float = 0.10

    def __init__(
        self,
        connection_url: str = "udp://:14540",
        heartbeat_timeout_s: float = 5.0,
        telemetry_interval_hz: float = 10.0,
        base_amsl: float = 0.0,
    ):
        self._connection_url = connection_url
        self._heartbeat_timeout = heartbeat_timeout_s
        self._telemetry_interval = 1.0 / max(telemetry_interval_hz, 1.0)
        self._base_amsl = base_amsl
        self._state = FlightState.IDLE
        self._last_heartbeat: float = time.time()
        self._telemetry_callbacks: list[TELEMETRY_CALLBACK] = []
        self._state_callbacks: list[STATE_CALLBACK] = []
        self._drone = None
        self._connected = False
        self._last_telemetry: Optional[Telemetry] = None

        logger.info(
            "Cerebellum initialized: connection=%s heartbeat_timeout=%ss base_amsl=%dm",
            connection_url, heartbeat_timeout_s, base_amsl,
        )

    # ── Connection ───────────────────────────────────────────────────────

    def connect(self) -> bool:
        try:
            import asyncio
            from mavsdk import System

            async def _connect():
                drone = System()
                await drone.connect(system_address=self._connection_url)
                logger.info("Waiting for drone connection...")
                async for state in drone.core.connection_state():
                    if state.is_connected:
                        self._connected = True
                        self._drone = drone
                        self._last_heartbeat = time.time()
                        logger.info("Drone connected via %s", self._connection_url)
                        return True
                    break
                return False

            loop = asyncio.get_event_loop()
            result = loop.run_until_complete(_connect())
            if result:
                self._start_telemetry_loop()
            return result

        except ImportError:
            logger.warning("mavsdk not installed, running in simulation mode")
            self._connected = True
            self._last_heartbeat = time.time()
            return True

    def disconnect(self) -> None:
        self._connected = False
        self._state = FlightState.IDLE
        self._drone = None
        logger.info("Cerebellum disconnected")

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def state(self) -> FlightState:
        return self._state

    # ── State management ─────────────────────────────────────────────────

    def _set_state(self, new_state: FlightState) -> None:
        old_state = self._state
        self._state = new_state
        logger.info("Flight state: %s → %s", old_state.name, new_state.name)
        for cb in self._state_callbacks:
            try:
                cb(new_state)
            except Exception as exc:
                logger.error("State callback error: %s", exc)

    # ── Commands ─────────────────────────────────────────────────────────

    def arm(self) -> FlightResult:
        if self._state not in (FlightState.IDLE,):
            return FlightResult(False, "arm", error=f"Cannot arm from {self._state.name}")
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.arm())
            self._set_state(FlightState.ARMED)
            return FlightResult(True, "arm", metrics={"state": "armed"})
        except Exception as exc:
            logger.error("Arm failed: %s", exc)
            return FlightResult(False, "arm", error=str(exc))

    def disarm(self) -> FlightResult:
        if self._state not in (FlightState.ARMED, FlightState.IDLE):
            return FlightResult(False, "disarm", error=f"Cannot disarm from {self._state.name}")
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.disarm())
            self._set_state(FlightState.IDLE)
            return FlightResult(True, "disarm", metrics={"state": "idle"})
        except Exception as exc:
            logger.error("Disarm failed: %s", exc)
            return FlightResult(False, "disarm", error=str(exc))

    def takeoff(self, altitude_m: float) -> FlightResult:
        if self._state not in (FlightState.ARMED, FlightState.IDLE):
            return FlightResult(False, "takeoff", error=f"Cannot takeoff from {self._state.name}")
        if altitude_m <= 0:
            return FlightResult(False, "takeoff", error="Altitude must be positive")

        compensated = self._compensate_altitude(altitude_m)
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.takeoff())
                loop.run_until_complete(
                    self._drone.action.set_takeoff_altitude(compensated)
                )
            self._set_state(FlightState.TAKEOFF)
            time.sleep(2)
            self._set_state(FlightState.FLYING)
            return FlightResult(
                True, "takeoff",
                metrics={"target_altitude": altitude_m, "compensated_altitude": compensated},
            )
        except Exception as exc:
            logger.error("Takeoff failed: %s", exc)
            self._set_state(FlightState.EMERGENCY)
            return FlightResult(False, "takeoff", error=str(exc))

    def land(self) -> FlightResult:
        if self._state not in (FlightState.FLYING, FlightState.TAKEOFF):
            return FlightResult(False, "land", error=f"Cannot land from {self._state.name}")
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.land())
            self._set_state(FlightState.LANDING)
            time.sleep(3)
            self._set_state(FlightState.IDLE)
            return FlightResult(True, "land", metrics={"state": "landed"})
        except Exception as exc:
            logger.error("Land failed: %s", exc)
            return FlightResult(False, "land", error=str(exc))

    def goto(self, position: Position) -> FlightResult:
        if self._state not in (FlightState.FLYING,):
            return FlightResult(False, "goto", error=f"Cannot goto from {self._state.name}")
        try:
            compensated_alt = self._compensate_altitude(position.alt)
            import asyncio
            loop = asyncio.get_event_loop()

            if self._drone is not None:
                loop.run_until_complete(
                    self._drone.action.goto_location(
                        position.lat, position.lon, compensated_alt, 0.0,
                    )
                )
            else:
                time.sleep(0.5)

            return FlightResult(
                True, "goto",
                metrics={
                    "target": position.to_dict(),
                    "compensated_altitude": compensated_alt,
                },
            )
        except Exception as exc:
            logger.error("Goto failed: %s", exc)
            return FlightResult(False, "goto", error=str(exc))

    def hold(self) -> FlightResult:
        if self._state not in (FlightState.FLYING,):
            return FlightResult(False, "hold", error=f"Cannot hold from {self._state.name}")
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.hold())
            return FlightResult(True, "hold", metrics={"state": "hovering"})
        except Exception as exc:
            logger.error("Hold failed: %s", exc)
            return FlightResult(False, "hold", error=str(exc))

    def rtl(self) -> FlightResult:
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.return_to_launch())
            self._set_state(FlightState.LANDING)
            time.sleep(3)
            self._set_state(FlightState.IDLE)
            return FlightResult(True, "rtl", metrics={"state": "landed_via_rtl"})
        except Exception as exc:
            logger.error("RTL failed: %s", exc)
            return FlightResult(False, "rtl", error=str(exc))

    # ── Emergency ────────────────────────────────────────────────────────

    def emergency_stop(self) -> FlightResult:
        logger.warning("EMERGENCY STOP initiated")
        self._set_state(FlightState.EMERGENCY)
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.kill())
            return FlightResult(True, "emergency_stop", metrics={"state": "killed"})
        except Exception as exc:
            logger.error("Emergency stop failed: %s", exc)
            return FlightResult(False, "emergency_stop", error=str(exc))

    def emergency_land(self) -> FlightResult:
        logger.warning("EMERGENCY LAND initiated")
        self._set_state(FlightState.EMERGENCY)
        try:
            if self._drone is not None:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._drone.action.emergency_land())
            return FlightResult(True, "emergency_land", metrics={"state": "emergency_landing"})
        except Exception as exc:
            logger.error("Emergency land failed: %s", exc)
            return FlightResult(False, "emergency_land", error=str(exc))

    # ── Telemetry ────────────────────────────────────────────────────────

    def on_telemetry(self, callback: TELEMETRY_CALLBACK) -> None:
        self._telemetry_callbacks.append(callback)

    def on_state_change(self, callback: STATE_CALLBACK) -> None:
        self._state_callbacks.append(callback)

    def get_last_telemetry(self) -> Optional[Telemetry]:
        return self._last_telemetry

    def check_heartbeat(self) -> bool:
        if not self._connected:
            return False
        elapsed = time.time() - self._last_heartbeat
        if elapsed > self._heartbeat_timeout:
            logger.error("Heartbeat timeout: %.1fs without contact", elapsed)
            self._set_state(FlightState.EMERGENCY)
            return False
        return True

    def update_heartbeat(self) -> None:
        self._last_heartbeat = time.time()

    # ── Altitude compensation ────────────────────────────────────────────

    def _compensate_altitude(self, target_alt: float) -> float:
        if self._base_amsl < self.HIGH_ALT_MSL_MIN:
            return target_alt
        delta_km = (self._base_amsl - self.HIGH_ALT_MSL_MIN) / 1000.0
        factor = 1.0 + delta_km * self.THRUST_COMPENSATION_PER_KM
        return round(target_alt * factor, 1)

    # ── Internal ─────────────────────────────────────────────────────────

    def _start_telemetry_loop(self) -> None:
        if self._drone is None:
            return

        import asyncio
        import threading

        async def _telemetry_loop():
            async for tele in self._drone.telemetry.position():
                if not self._connected:
                    break
                pos = Position(lat=tele.latitude_deg, lon=tele.longitude_deg, alt=tele.absolute_altitude_m)

                telem = Telemetry(
                    position=pos,
                    battery_voltage=0.0,
                    battery_percent=0.0,
                    ground_speed_ms=0.0,
                    air_speed_ms=0.0,
                    altitude_amsl=tele.absolute_altitude_m,
                    altitude_agl=tele.relative_altitude_m,
                    heading_deg=0.0,
                )
                self._last_telemetry = telem
                self.update_heartbeat()

                for cb in self._telemetry_callbacks:
                    try:
                        cb(telem)
                    except Exception as exc:
                        logger.error("Telemetry callback error: %s", exc)

                await asyncio.sleep(self._telemetry_interval)

        def _run():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(_telemetry_loop())

        thread = threading.Thread(target=_run, daemon=True, name="cerebellum-telemetry")
        thread.start()
