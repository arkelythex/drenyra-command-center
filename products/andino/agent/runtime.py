from __future__ import annotations

import json
import logging
import os
import signal
import sys
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from pathlib import Path
from threading import Event, Thread
from typing import Any, Optional

from .cerebrum import Cerebrum, ModelSize
from .cerebellum import Cerebellum, FlightState, FlightResult
from .hard_skills import HardSkills, Polygon
from .soft_skills import SoftSkills, MissionResult
from .memory import AgentMemory
from .roschain import ROSChain

logger = logging.getLogger(__name__)


class RuntimeStatus(Enum):
    INITIALIZING = auto()
    IDLE = auto()
    PLANNING = auto()
    EXECUTING = auto()
    MONITORING = auto()
    REFLECTING = auto()
    ERROR = auto()
    SHUTDOWN = auto()


@dataclass
class RuntimeConfig:
    agent_id: str = "andino-01"
    data_dir: str = "./data/agent"
    log_level: str = "INFO"
    log_file: Optional[str] = None

    # Cerebrum
    llm_backend: str = "llama_cpp"
    model_size: str = "medium"
    llm_rate_limit_rps: float = 10.0
    llm_timeout_s: float = 30.0

    # Cerebellum
    connection_url: str = "udp://:14540"
    heartbeat_timeout_s: float = 5.0
    base_amsl: float = 0.0

    # ROSChain
    ros_namespace: str = ""
    ros_use_sim_time: bool = False

    # Runtime
    heartbeat_interval_s: float = 1.0
    max_retries: int = 3
    emergency_on_error: bool = True

    @classmethod
    def from_file(cls, path: str | Path) -> RuntimeConfig:
        path = Path(path)
        if path.exists():
            with open(path) as f:
                data = json.load(f)
            return cls(**{k: v for k, v in data.items() if k in cls.__annotations__})
        logger.warning("Config file %s not found, using defaults", path)
        return cls()

    def to_dict(self) -> dict[str, Any]:
        return {k: getattr(self, k) for k in self.__annotations__}


class AgenticRuntime:
    """Unified orchestrator for the AndinoDroneLab agent runtime.

    Lifecycle:
        init() → plan() → execute() → monitor() → reflect() → shutdown()

    Integrates:
    - Cerebrum: LLM reasoning engine
    - Cerebellum: PX4/MAVSDK flight controller bridge
    - HardSkills: 10 atomic flight skills
    - SoftSkills: 5 composed mission skills
    - AgentMemory: 4-layer memory architecture
    - ROSChain: ROS 2 bridge for inter-process communication
    """

    def __init__(self, config: Optional[RuntimeConfig | dict[str, Any] | str | Path] = None):
        if config is None:
            self._config = RuntimeConfig()
        elif isinstance(config, RuntimeConfig):
            self._config = config
        elif isinstance(config, dict):
            self._config = RuntimeConfig(**config)
        elif isinstance(config, (str, Path)):
            self._config = RuntimeConfig.from_file(config)
        else:
            raise TypeError(f"Invalid config type: {type(config)}")

        self._status = RuntimeStatus.INITIALIZING
        self._stop_event = Event()
        self._heartbeat_thread: Optional[Thread] = None
        self._current_mission_id: Optional[str] = None
        self._current_plan: list[dict[str, Any]] = []
        self._phase_results: list[dict[str, Any]] = []

        self._setup_logging()

        self.cerebrum: Cerebrum = Cerebrum(
            backend=self._config.llm_backend,
            model_size=ModelSize(self._config.model_size),
            rate_limit_rps=self._config.llm_rate_limit_rps,
            timeout_seconds=self._config.llm_timeout_s,
        )

        self.cerebellum: Cerebellum = Cerebellum(
            connection_url=self._config.connection_url,
            heartbeat_timeout_s=self._config.heartbeat_timeout_s,
            base_amsl=self._config.base_amsl,
        )

        self.hard_skills: HardSkills = HardSkills(self.cerebellum)
        self.soft_skills: SoftSkills = SoftSkills(self.cerebrum, self.hard_skills)

        self.memory: AgentMemory = AgentMemory(
            Path(self._config.data_dir) / "memory",
        )

        self.roschain: ROSChain = ROSChain(
            namespace=self._config.ros_namespace,
            use_sim_time=self._config.ros_use_sim_time,
            cerebellum=self.cerebellum,
        )

        self._data_dir = Path(self._config.data_dir)
        self._data_dir.mkdir(parents=True, exist_ok=True)

        self._register_signal_handlers()
        self._status = RuntimeStatus.IDLE
        logger.info("AgenticRuntime '%s' initialized with config: %s",
                     self._config.agent_id, self._config.to_dict())

    # ── Properties ───────────────────────────────────────────────────────

    @property
    def status(self) -> RuntimeStatus:
        return self._status

    @property
    def is_running(self) -> bool:
        return self._status not in (RuntimeStatus.SHUTDOWN, RuntimeStatus.INITIALIZING)

    @property
    def mission_id(self) -> Optional[str]:
        return self._current_mission_id

    # ── Lifecycle ────────────────────────────────────────────────────────

    def init(self) -> dict[str, Any]:
        logger.info("Runtime: init phase")
        results = {
            "cerebellum_connected": False,
            "roschain_started": False,
            "memory_ready": True,
        }

        try:
            results["cerebellum_connected"] = self.cerebellum.connect()
        except Exception as exc:
            logger.warning("Cerebellum connection failed (will retry at execute): %s", exc)
            results["cerebellum_connected"] = False

        try:
            results["roschain_started"] = self.roschain.start()
        except Exception as exc:
            logger.warning("ROSChain start failed (will retry): %s", exc)
            results["roschain_started"] = False

        memory_report = self.memory.consolidate()
        results["memory_stats"] = memory_report
        self.memory.working.set("init_results", results)
        self._status = RuntimeStatus.IDLE

        logger.info("Runtime init complete: %s", results)
        return results

    def plan(self, mission: str, constraints: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
        logger.info("Runtime: plan phase — mission='%s'", mission[:80])
        self._status = RuntimeStatus.PLANNING
        self.memory.working.set("current_mission", mission)
        self.memory.working.set("mission_constraints", constraints or {})

        past_episodes = self.memory.recall(mission, memory_type="episodic", n=3)
        if past_episodes:
            logger.info("Found %d relevant past episodes for planning", len(past_episodes))

        plan = self.cerebrum.plan(mission, constraints)

        if not plan:
            logger.warning("Cerebrum returned empty plan, using fallback")
            plan = self._fallback_plan(mission)

        self._current_plan = plan
        self.memory.working.set("current_plan", plan)
        logger.info("Plan generated: %d phases", len(plan))
        self._status = RuntimeStatus.IDLE
        return plan

    def execute(self, mission: Optional[str] = None,
                constraints: Optional[dict[str, Any]] = None) -> MissionResult:
        logger.info("Runtime: execute phase")
        self._status = RuntimeStatus.EXECUTING
        self._phase_results = []

        if mission and not self._current_plan:
            self.plan(mission, constraints)

        if not self._current_plan:
            logger.error("No plan available for execution")
            self._status = RuntimeStatus.ERROR
            return MissionResult(False, "execute", error="No plan available")

        if not self.cerebellum.is_connected:
            logger.info("Reconnecting cerebellum...")
            self.cerebellum.connect()

        self._start_heartbeat()
        mission_result = self._execute_plan(self._current_plan)

        self._phase_results = [p.to_dict() if hasattr(p, "to_dict") else p
                               for p in mission_result.phases]

        outcome = mission_result.to_dict()
        self.memory.store(
            key=f"mission:{self._current_mission_id or 'unknown'}",
            data=outcome,
            memory_type="episodic",
            metadata={"outcome": "success" if mission_result.success else "failure"},
        )

        logger.info("Mission %s: success=%s duration_s=%.1f",
                     mission_result.mission_type, mission_result.success,
                     mission_result.metrics.get("total_phases", 0))

        self._status = RuntimeStatus.IDLE
        return mission_result

    def monitor(self) -> dict[str, Any]:
        logger.debug("Runtime: monitor phase")
        self._status = RuntimeStatus.MONITORING

        status = {
            "status": self._status.name,
            "connected": self.cerebellum.is_connected,
            "flight_state": self.cerebellum.state.name,
            "heartbeat_ok": self.cerebellum.check_heartbeat(),
            "roschain_running": self.roschain.is_running,
            "mission_id": self._current_mission_id,
            "plan_phases": len(self._current_plan),
            "phases_executed": len(self._phase_results),
            "working_memory_size": self.memory.working.size,
            "episodic_count": self.memory.episodic.count(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        last_telemetry = self.cerebellum.get_last_telemetry()
        if last_telemetry:
            status["last_telemetry"] = last_telemetry.to_dict()

        logger.debug("Monitor: %s", status)
        self._status = RuntimeStatus.IDLE
        return status

    def reflect(self, outcome: Optional[dict[str, Any]] = None) -> str:
        logger.info("Runtime: reflect phase")
        self._status = RuntimeStatus.REFLECTING

        if outcome is None and self._phase_results:
            outcome = {
                "mission_id": self._current_mission_id,
                "phases": self._phase_results,
                "status": self._status.name,
            }

        if not outcome:
            return "No outcome to reflect on."

        reflection = self.cerebrum.reflect(outcome)

        self.memory.store(
            key=f"reflection:{self._current_mission_id or datetime.now(timezone.utc).isoformat()}",
            data=reflection,
            memory_type="episodic",
            metadata={"outcome": "reflection_complete"},
        )

        # Store skill learnings from each phase
        for phase in self._phase_results:
            if isinstance(phase, dict):
                self.memory.learn(
                    skill_name=phase.get("operation", "unknown"),
                    context={"mission_type": "general"},
                    duration_s=phase.get("metrics", {}).get("duration_s", 0),
                    success=phase.get("success", False),
                )

        logger.info("Reflection complete")
        self._status = RuntimeStatus.IDLE
        return reflection

    def shutdown(self) -> None:
        logger.info("Runtime: shutdown")
        self._status = RuntimeStatus.SHUTDOWN
        self._stop_event.set()

        try:
            if self.cerebellum.state in (FlightState.FLYING, FlightState.TAKEOFF):
                logger.warning("Drone still flying, initiating emergency land during shutdown")
                self.cerebellum.emergency_land()
        except Exception as exc:
            logger.error("Emergency land during shutdown failed: %s", exc)

        try:
            self.cerebellum.disconnect()
        except Exception as exc:
            logger.error("Cerebellum disconnect error: %s", exc)

        try:
            self.roschain.stop()
        except Exception as exc:
            logger.error("ROSChain stop error: %s", exc)

        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            self._heartbeat_thread.join(timeout=3.0)

        self.memory.clear_working()
        logger.info("AgenticRuntime '%s' shut down gracefully", self._config.agent_id)

    def run(self, mission: str, constraints: Optional[dict[str, Any]] = None) -> MissionResult:
        """Convenience method: full lifecycle for a single mission."""
        self.init()
        time.sleep(0.5)
        self.plan(mission, constraints)
        result = self.execute()
        self.reflect(result.to_dict())
        self.shutdown()
        return result

    # ── Error handling ───────────────────────────────────────────────────

    def handle_error(self, error: Exception, phase: str = "unknown") -> dict[str, Any]:
        logger.error("Runtime error in phase '%s': %s", phase, error)
        logger.debug(traceback.format_exc())
        self._status = RuntimeStatus.ERROR

        error_record = {
            "phase": phase,
            "error": str(error),
            "traceback": traceback.format_exc(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "flight_state": self.cerebellum.state.name,
        }

        self.memory.store(
            key=f"error:{phase}:{datetime.now(timezone.utc).isoformat()}",
            data=error_record,
            memory_type="episodic",
            metadata={"outcome": "error", "phase": phase},
        )

        if self._config.emergency_on_error:
            if self.cerebellum.state in (FlightState.FLYING, FlightState.TAKEOFF, FlightState.ARMED):
                try:
                    self.cerebellum.emergency_land()
                except Exception as exc:
                    logger.error("Emergency land failed during error handling: %s", exc)

        return error_record

    # ── Internal ─────────────────────────────────────────────────────────

    def _execute_plan(self, plan: list[dict[str, Any]]) -> MissionResult:
        import uuid
        self._current_mission_id = str(uuid.uuid4())
        mission_result = MissionResult(
            False,
            mission_type=self.memory.working.get("current_mission", "unknown")[:50],
        )

        for i, phase in enumerate(plan):
            phase_name = phase.get("phase_name", phase.get("action", f"phase_{i}"))
            logger.info("Executing phase %d/%d: %s", i + 1, len(plan), phase_name)

            try:
                phase_result = self._execute_phase(phase)
            except Exception as exc:
                logger.error("Phase %s failed with exception: %s", phase_name, exc)
                phase_result = FlightResult(False, phase_name, error=str(exc))

            mission_result.phases.append(phase_result)

            if not phase_result.success and self._config.max_retries > 0:
                logger.info("Retrying phase %s (max %d retries)", phase_name, self._config.max_retries)
                for attempt in range(1, self._config.max_retries + 1):
                    logger.info("Retry attempt %d/%d for phase %s", attempt, self._config.max_retries, phase_name)
                    try:
                        phase_result = self._execute_phase(phase)
                        if phase_result.success:
                            break
                    except Exception as exc:
                        logger.error("Retry %d failed: %s", attempt, exc)

            if not phase_result.success and self._config.emergency_on_error:
                logger.error("Phase %s failed, initiating emergency", phase_name)
                self.cerebellum.emergency_land()
                break

        mission_result.success = all(p.success for p in mission_result.phases)
        mission_result.end_time = datetime.now(timezone.utc).isoformat()
        mission_result.metrics = {
            "total_phases": len(mission_result.phases),
            "successful_phases": sum(1 for p in mission_result.phases if p.success),
            "failed_phases": sum(1 for p in mission_result.phases if not p.success),
        }

        return mission_result

    def _execute_phase(self, phase: dict[str, Any]) -> FlightResult:
        action = phase.get("action", phase.get("phase_name", "")).lower()
        params = phase.get("parameters", {})

        action_map = {
            "takeoff": lambda: self.hard_skills.takeoff(params.get("altitude", 50.0)),
            "land": lambda: self.hard_skills.land(),
            "navigate": lambda: self._navigate_from_params(params),
            "hover": lambda: self.hard_skills.hover(params.get("duration", 10.0)),
            "track": lambda: self.hard_skills.track(params.get("target", "unknown")),
            "thermal_scan": lambda: self._thermal_scan_from_params(params),
            "capture_image": lambda: self.hard_skills.capture_image(),
            "deliver_payload": lambda: self._deliver_from_params(params),
            "emergency_land": lambda: self.hard_skills.emergency_land(),
            "return_to_launch": lambda: self.hard_skills.return_to_launch(),
            "rtl": lambda: self.hard_skills.return_to_launch(),
        }

        handler = action_map.get(action)
        if handler is None:
            # Try soft skills
            soft_map = {
                "inspect_tunnel": lambda: self.soft_skills.inspect_tunnel(params),
                "survey_open_pit": lambda: self._survey_from_params(params),
                "deliver_payload_mission": lambda: self._soft_deliver_from_params(params),
                "follow_pipeline": lambda: self._pipeline_from_params(params),
                "emergency_response": lambda: self.soft_skills.emergency_response(params),
            }
            soft_handler = soft_map.get(action)
            if soft_handler:
                return soft_handler()
            return FlightResult(False, action, error=f"Unknown action: {action}")

        return handler()

    def _navigate_from_params(self, params: dict[str, Any]) -> FlightResult:
        from .cerebellum import Position, Waypoint
        wps_data = params.get("waypoints", params.get("route", []))
        waypoints = []
        for wp in wps_data:
            pos = Position.from_dict(wp) if isinstance(wp, dict) else wp
            waypoints.append(Waypoint(pos, speed=params.get("speed")))
        if not waypoints:
            return FlightResult(False, "navigate", error="No waypoints in parameters")
        return self.hard_skills.navigate(waypoints)

    def _thermal_scan_from_params(self, params: dict[str, Any]) -> FlightResult:
        from .cerebellum import Position
        vertices = params.get("area", params.get("vertices", []))
        if not vertices:
            return FlightResult(False, "thermal_scan", error="No area specified")
        poly = Polygon(vertices=[Position.from_dict(v) for v in vertices])
        return self.hard_skills.thermal_scan(poly)

    def _deliver_from_params(self, params: dict[str, Any]) -> FlightResult:
        pos_data = params.get("position", params.get("target", {}))
        pos = Position.from_dict(pos_data) if isinstance(pos_data, dict) else pos_data
        return self.hard_skills.deliver_payload(pos)

    def _survey_from_params(self, params: dict[str, Any]) -> MissionResult:
        from .cerebellum import Position
        vertices = params.get("area", [])
        poly = Polygon(vertices=[Position.from_dict(v) for v in vertices]) if vertices else None
        if poly is None:
            return MissionResult(False, "survey_open_pit", error="No area specified")
        return self.soft_skills.survey_open_pit(poly, params.get("resolution", 1.0))

    def _soft_deliver_from_params(self, params: dict[str, Any]) -> MissionResult:
        from .cerebellum import Position
        origin = Position.from_dict(params.get("origin", {}))
        dest = Position.from_dict(params.get("destination", params.get("dest", {})))
        payload = params.get("payload", "unknown")
        return self.soft_skills.deliver_payload(origin, dest, payload)

    def _pipeline_from_params(self, params: dict[str, Any]) -> MissionResult:
        from .cerebellum import Position
        route = [Position.from_dict(p) for p in params.get("route", params.get("pipeline_route", []))]
        inspect_flag = params.get("inspect", True)
        return self.soft_skills.follow_pipeline(route, inspect_flag)

    # ── Heartbeat ────────────────────────────────────────────────────────

    def _start_heartbeat(self) -> None:
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return

        def _heartbeat_loop():
            while not self._stop_event.is_set():
                try:
                    self.cerebellum.update_heartbeat()
                    if not self.cerebellum.check_heartbeat():
                        logger.warning("Heartbeat lost, attempting reconnect...")
                        self.cerebellum.connect()
                    self._write_status_file()
                except Exception as exc:
                    logger.error("Heartbeat error: %s", exc)
                self._stop_event.wait(self._config.heartbeat_interval_s)

        self._heartbeat_thread = Thread(target=_heartbeat_loop, daemon=True, name="agent-heartbeat")
        self._heartbeat_thread.start()
        logger.debug("Heartbeat thread started (interval=%.1fs)", self._config.heartbeat_interval_s)

    # ── Status file ──────────────────────────────────────────────────────

    def _write_status_file(self) -> None:
        try:
            status = self.monitor()
            status_path = self._data_dir / "status.json"
            with open(status_path, "w") as f:
                json.dump(status, f, indent=2)
        except Exception as exc:
            logger.debug("Failed to write status file: %s", exc)

    # ── Fallback ─────────────────────────────────────────────────────────

    def _fallback_plan(self, mission: str) -> list[dict[str, Any]]:
        return [
            {"phase_name": "takeoff", "action": "takeoff", "parameters": {"altitude": 50.0}},
            {"phase_name": "hover", "action": "hover", "parameters": {"duration": 5.0}},
            {"phase_name": "navigate", "action": "navigate", "parameters": {"waypoints": []}},
            {"phase_name": "return_to_launch", "action": "rtl", "parameters": {}},
        ]

    # ── Signal handling ──────────────────────────────────────────────────

    def _register_signal_handlers(self) -> None:
        def _handle_signal(signum, frame):
            sig_name = signal.Signals(signum).name
            logger.warning("Received signal %s, initiating graceful shutdown", sig_name)
            self.shutdown()
            sys.exit(0)

        signal.signal(signal.SIGINT, _handle_signal)
        signal.signal(signal.SIGTERM, _handle_signal)

    # ── Logging ──────────────────────────────────────────────────────────

    def _setup_logging(self) -> None:
        level = getattr(logging, self._config.log_level.upper(), logging.INFO)
        handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

        if self._config.log_file:
            log_path = Path(self._config.log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            handlers.append(logging.FileHandler(str(log_path)))

        logging.basicConfig(
            level=level,
            format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
            handlers=handlers,
        )
