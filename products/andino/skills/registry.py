from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional

from .definitions import SkillDefinition, SkillParam


BUILTIN_SKILLS: list[SkillDefinition] = [
    # ── Engineering ──────────────────────────────────────────────────────
    SkillDefinition(
        name="morphology_design",
        description="Design drone morphology using evolutionary algorithms",
        category="engineering",
        inputs=[
            SkillParam("mission_spec", "string", "Mission description and requirements", True),
            SkillParam("constraints", "string", "Design constraints (weight, size, budget)", True),
            SkillParam("payload_mass_kg", "number", "Expected payload mass in kg", False, 0.5),
            SkillParam("flight_time_min", "number", "Minimum required flight time in minutes", False, 20),
        ],
        outputs=[
            SkillParam("morphology_config", "string", "Configuration of frame, arms, motor layout"),
            SkillParam("cad_files", "file", "Generated CAD files for the design"),
            SkillParam("reasoning", "string", "Design rationale and trade-off analysis"),
        ],
        model="claude-opus-4",
        phase="design",
        tags=["morphology", "evolutionary", "optimization"],
        version="2.1.0",
        author="andino",
        dependencies=["propulsion_sizing"],
    ),
    SkillDefinition(
        name="propulsion_sizing",
        description="Calculate motor, propeller, ESC, and battery requirements",
        category="engineering",
        inputs=[
            SkillParam("mass_budget_kg", "number", "Total drone mass budget in kg", True),
            SkillParam("target_twr", "number", "Target thrust-to-weight ratio", False, 2.0),
            SkillParam("altitude_m", "number", "Operating altitude in meters", False, 300),
            SkillParam("cell_count", "number", "Battery cell count (e.g. 4, 6)", False, 6),
        ],
        outputs=[
            SkillParam("propulsion_config", "string", "Motor, prop, ESC, battery specs"),
            SkillParam("thrust_curve", "string", "Estimated thrust vs throttle curve"),
        ],
        model="claude-sonnet-4",
        phase="design",
        tags=["propulsion", "sizing", "power"],
        version="2.0.0",
        author="andino",
        dependencies=[],
    ),
    SkillDefinition(
        name="structural_analysis",
        description="Analyze frame structural integrity with finite element methods",
        category="engineering",
        inputs=[
            SkillParam("frame_geometry", "string", "Frame geometry description or file", True),
            SkillParam("materials", "string", "Frame material specifications", True),
            SkillParam("load_cases", "string", "Load cases to simulate (hover, gust, crash)", False, "hover+gust"),
        ],
        outputs=[
            SkillParam("structural_report", "file", "FEM analysis report"),
            SkillParam("stress_points", "string", "Critical stress points identified"),
            SkillParam("safety_factor", "number", "Minimum safety factor across all load cases"),
        ],
        model="claude-opus-4",
        phase="simulate",
        tags=["structural", "fem", "analysis"],
        version="1.2.0",
        author="andino",
        dependencies=["morphology_design"],
    ),
    SkillDefinition(
        name="control_tuning",
        description="Tune PX4 PID parameters for specific drone morphology",
        category="engineering",
        inputs=[
            SkillParam("morphology_config", "string", "Drone morphology configuration", True),
            SkillParam("mass_props", "string", "Mass properties (weight, inertia, CoG)", True),
            SkillParam("tuning_style", "string", "Tuning style: conservative|aggressive|custom", False, "conservative"),
        ],
        outputs=[
            SkillParam("px4_params", "string", "PX4 parameter file for the design"),
            SkillParam("step_response", "string", "Expected step response characteristics"),
        ],
        model="claude-sonnet-4",
        phase="design",
        tags=["control", "pid", "tuning", "px4"],
        version="1.3.0",
        author="andino",
        dependencies=["morphology_design", "propulsion_sizing"],
    ),
    SkillDefinition(
        name="cad_generation",
        description="Generate CAD models from morphology configuration",
        category="engineering",
        inputs=[
            SkillParam("morphology_config", "string", "Morphology configuration to CAD-ify", True),
            SkillParam("format", "string", "Output format: step|stl|obj", False, "step"),
            SkillParam("resolution", "string", "Mesh resolution: low|medium|high", False, "medium"),
        ],
        outputs=[
            SkillParam("cad_files", "file", "Generated CAD model files"),
            SkillParam("render_preview", "file", "Preview render image"),
        ],
        model="claude-sonnet-4",
        phase="design",
        tags=["cad", "modeling", "design"],
        version="1.0.0",
        author="andino",
        dependencies=["morphology_design"],
    ),
    SkillDefinition(
        name="bom_generation",
        description="Generate bill of materials from completed design",
        category="engineering",
        inputs=[
            SkillParam("design_config", "string", "Complete design configuration", True),
            SkillParam("supplier_preference", "string", "Preferred supplier or region", False, "any"),
        ],
        outputs=[
            SkillParam("bom", "file", "Bill of materials CSV/JSON"),
            SkillParam("cost_estimate", "number", "Estimated total cost in USD"),
            SkillParam("lead_time_days", "number", "Estimated lead time in days"),
        ],
        model="claude-sonnet-4",
        phase="design",
        tags=["bom", "procurement", "cost"],
        version="1.1.0",
        author="andino",
        dependencies=["morphology_design", "propulsion_sizing"],
    ),
    SkillDefinition(
        name="cost_estimation",
        description="Estimate total drone cost including materials and manufacturing",
        category="engineering",
        inputs=[
            SkillParam("bom", "string", "Bill of materials", True),
            SkillParam("quantity", "number", "Production quantity", False, 1),
            SkillParam("labor_rate", "number", "Hourly labor rate in USD", False, 50),
        ],
        outputs=[
            SkillParam("total_cost", "number", "Total estimated cost"),
            SkillParam("cost_breakdown", "string", "Cost breakdown by category"),
        ],
        model="claude-sonnet-4",
        phase="design",
        tags=["cost", "budget", "estimation"],
        version="1.0.0",
        author="andino",
        dependencies=["bom_generation"],
    ),
    SkillDefinition(
        name="flight_time_prediction",
        description="Predict flight time based on design parameters and mission profile",
        category="engineering",
        inputs=[
            SkillParam("mass_total_kg", "number", "Total drone mass in kg", True),
            SkillParam("battery_wh", "number", "Battery energy in watt-hours", True),
            SkillParam("propulsion_efficiency", "number", "Propulsion system efficiency 0-1", False, 0.7),
            SkillParam("mission_profile", "string", "Mission profile: hover|cruise|mixed", False, "mixed"),
        ],
        outputs=[
            SkillParam("predicted_flight_time", "number", "Predicted flight time in minutes"),
            SkillParam("confidence_interval", "string", "90% confidence interval"),
        ],
        model="claude-sonnet-4",
        phase="simulate",
        tags=["flight-time", "prediction", "performance"],
        version="1.2.0",
        author="andino",
        dependencies=["propulsion_sizing"],
    ),
    # ── Flight ────────────────────────────────────────────────────────────
    SkillDefinition(
        name="takeoff",
        description="Execute automated takeoff sequence with safety checks",
        category="flight",
        inputs=[
            SkillParam("altitude_target_m", "number", "Target takeoff altitude in meters", True),
            SkillParam("takeoff_speed", "number", "Ascent speed in m/s", False, 1.5),
            SkillParam("safety_timeout_s", "number", "Max time for takeoff in seconds", False, 30),
        ],
        outputs=[
            SkillParam("takeoff_status", "string", "Takeoff completion status"),
            SkillParam("final_altitude_m", "number", "Actual reached altitude"),
        ],
        model="px4-autopilot",
        phase="fly",
        tags=["takeoff", "flight", "auto"],
        version="1.0.0",
        author="andino",
        dependencies=[],
    ),
    SkillDefinition(
        name="land",
        description="Execute automated landing sequence with terrain awareness",
        category="flight",
        inputs=[
            SkillParam("landing_zone", "gps_coord", "GPS coordinates of landing zone", False),
            SkillParam("descent_speed", "number", "Descent speed in m/s", False, 0.8),
            SkillParam("precision_landing", "boolean", "Enable precision landing", False, False),
        ],
        outputs=[
            SkillParam("land_status", "string", "Landing completion status"),
            SkillParam("landing_accuracy_m", "number", "Distance from target in meters"),
        ],
        model="px4-autopilot",
        phase="fly",
        tags=["land", "flight", "precision"],
        version="1.1.0",
        author="andino",
        dependencies=[],
    ),
    SkillDefinition(
        name="navigate",
        description="Navigate between GPS waypoints with obstacle awareness",
        category="flight",
        inputs=[
            SkillParam("waypoints", "string", "List of GPS waypoints", True),
            SkillParam("cruise_speed", "number", "Cruise speed in m/s", False, 10.0),
            SkillParam("obstacle_avoidance", "boolean", "Enable obstacle avoidance", False, True),
        ],
        outputs=[
            SkillParam("navigation_log", "string", "Navigation event log"),
            SkillParam("distance_traveled_m", "number", "Total distance traveled"),
        ],
        model="px4-autopilot",
        phase="fly",
        tags=["navigation", "waypoint", "gps"],
        version="1.2.0",
        author="andino",
        dependencies=["takeoff"],
    ),
    SkillDefinition(
        name="hold",
        description="Hold position at current GPS coordinate with altitude lock",
        category="flight",
        inputs=[
            SkillParam("hold_duration_s", "number", "Hold duration in seconds", False, 60),
            SkillParam("hold_altitude_m", "number", "Hold altitude (0 = current)", False, 0),
            SkillParam("gps_accuracy_m", "number", "Required GPS accuracy in meters", False, 2.0),
        ],
        outputs=[
            SkillParam("hold_accuracy_m", "number", "RMS position error during hold"),
            SkillParam("hold_completed", "boolean", "Whether hold completed successfully"),
        ],
        model="px4-autopilot",
        phase="fly",
        tags=["hold", "position", "loiter"],
        version="1.0.0",
        author="andino",
        dependencies=["navigate"],
    ),
    SkillDefinition(
        name="track_object",
        description="Track a moving object with camera and GPS",
        category="flight",
        inputs=[
            SkillParam("object_type", "string", "Type of object to track (vehicle|person|vessel)", True),
            SkillParam("initial_position", "gps_coord", "Initial object GPS position", True),
            SkillParam("tracking_mode", "string", "Tracking mode: gps|visual|fusion", False, "fusion"),
        ],
        outputs=[
            SkillParam("track_log", "string", "Tracking path and events"),
            SkillParam("tracking_quality", "number", "Tracking quality 0-1"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["tracking", "object", "vision"],
        version="1.1.0",
        author="andino",
        dependencies=["navigate", "hold"],
    ),
    SkillDefinition(
        name="thermal_scan",
        description="Execute thermal imaging scan of a defined area",
        category="flight",
        inputs=[
            SkillParam("scan_area", "polygon", "Area polygon to scan", True),
            SkillParam("altitude_m", "number", "Scan altitude in meters", False, 50),
            SkillParam("overlap_percent", "number", "Image overlap percentage", False, 75),
        ],
        outputs=[
            SkillParam("thermal_map", "file", "Stitched thermal map"),
            SkillParam("hotspots", "string", "Detected thermal hotspots"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["thermal", "scan", "inspection"],
        version="1.0.0",
        author="andino",
        dependencies=["navigate"],
    ),
    SkillDefinition(
        name="multispectral_scan",
        description="Execute multispectral scanning mission for agriculture or environmental monitoring",
        category="flight",
        inputs=[
            SkillParam("scan_area", "polygon", "Area polygon to scan", True),
            SkillParam("bands", "string", "Spectral bands to capture (ndvi,ndwi,etc)", False, "ndvi"),
            SkillParam("altitude_m", "number", "Scan altitude in meters", False, 100),
        ],
        outputs=[
            SkillParam("multispectral_map", "file", "Processed multispectral map"),
            SkillParam("vegetation_index", "string", "Calculated vegetation indices"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["multispectral", "agriculture", "survey"],
        version="1.0.0",
        author="andino",
        dependencies=["navigate"],
    ),
    SkillDefinition(
        name="payload_delivery",
        description="Execute precision payload delivery with release mechanism",
        category="flight",
        inputs=[
            SkillParam("payload_mass_g", "number", "Payload mass in grams", True),
            SkillParam("delivery_coord", "gps_coord", "GPS delivery coordinate", True),
            SkillParam("release_altitude_m", "number", "Release altitude in meters", False, 5),
            SkillParam("return_to_base", "boolean", "Return to launch after delivery", False, True),
        ],
        outputs=[
            SkillParam("delivery_status", "string", "Delivery completion status"),
            SkillParam("drop_accuracy_m", "number", "Drop accuracy in meters"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["delivery", "payload", "cargo"],
        version="1.1.0",
        author="andino",
        dependencies=["navigate", "land"],
    ),
    SkillDefinition(
        name="waypoint_mission",
        description="Execute a full waypoint mission with actions at each waypoint",
        category="flight",
        inputs=[
            SkillParam("mission_plan", "string", "Complete mission plan with waypoints and actions", True),
            SkillParam("auto_rtl", "boolean", "Auto return-to-launch on completion", False, True),
            SkillParam("max_mission_time_s", "number", "Maximum mission time in seconds", False, 1800),
        ],
        outputs=[
            SkillParam("mission_log", "string", "Complete mission execution log"),
            SkillParam("waypoints_reached", "number", "Number of waypoints successfully reached"),
            SkillParam("mission_success", "boolean", "Whether mission completed successfully"),
        ],
        model="px4-autopilot",
        phase="fly",
        tags=["mission", "waypoint", "autonomous"],
        version="1.2.0",
        author="andino",
        dependencies=["navigate", "takeoff", "land"],
    ),
    SkillDefinition(
        name="rtl",
        description="Return-to-launch with altitude management and obstacle avoidance",
        category="flight",
        inputs=[
            SkillParam("rtl_altitude_m", "number", "RTL cruise altitude in meters", False, 50),
            SkillParam("obstacle_avoidance", "boolean", "Enable obstacle avoidance during RTL", False, True),
        ],
        outputs=[
            SkillParam("rtl_status", "string", "RTL completion status"),
            SkillParam("rtl_duration_s", "number", "RTL duration in seconds"),
        ],
        model="px4-autopilot",
        phase="fly",
        tags=["rtl", "return", "safety", "home"],
        version="1.0.0",
        author="andino",
        dependencies=["navigate"],
    ),
    # ── Safety ────────────────────────────────────────────────────────────
    SkillDefinition(
        name="geofence_monitor",
        description="Monitor drone position against geofence boundaries",
        category="safety",
        inputs=[
            SkillParam("geofence", "polygon", "Geofence boundary polygon", True),
            SkillParam("action_on_breach", "string", "Action: rtl|land|hold", False, "rtl"),
            SkillParam("buffer_m", "number", "Buffer distance in meters before breach", False, 10),
        ],
        outputs=[
            SkillParam("geofence_status", "string", "Current geofence status"),
            SkillParam("breach_events", "string", "Log of any breach events"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["geofence", "safety", "boundary"],
        version="1.2.0",
        author="andino",
        dependencies=[],
    ),
    SkillDefinition(
        name="battery_failsafe",
        description="Monitor battery and execute failsafe actions at critical levels",
        category="safety",
        inputs=[
            SkillParam("critical_voltage_v", "number", "Critical voltage threshold", True),
            SkillParam("low_voltage_v", "number", "Low voltage warning threshold", False, 3.5),
            SkillParam("failsafe_action", "string", "Action: rtl|land|continue", False, "rtl"),
        ],
        outputs=[
            SkillParam("battery_status", "string", "Current battery state"),
            SkillParam("remaining_flight_time_s", "number", "Estimated remaining flight time"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["battery", "failsafe", "power", "safety"],
        version="1.1.0",
        author="andino",
        dependencies=["rtl"],
    ),
    SkillDefinition(
        name="gps_loss_recovery",
        description="Handle GPS signal loss with smooth recovery procedures",
        category="safety",
        inputs=[
            SkillParam("loss_duration_s", "number", "GPS loss duration in seconds", True),
            SkillParam("fallback_mode", "string", "Fallback: hold|land|optical_flow", False, "hold"),
            SkillParam("optical_flow_available", "boolean", "Optical flow sensor available", False, False),
        ],
        outputs=[
            SkillParam("recovery_status", "string", "Recovery action taken"),
            SkillParam("position_error_m", "number", "Estimated position drift during loss"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["gps", "recovery", "safety", "fallback"],
        version="1.0.0",
        author="andino",
        dependencies=["hold", "land"],
    ),
    SkillDefinition(
        name="motor_fail_recovery",
        description="Detect motor failure and execute recovery maneuvers",
        category="safety",
        inputs=[
            SkillParam("failed_motor_id", "number", "Index of failed motor (0-based)", True),
            SkillParam("morphology_type", "string", "Drone morphology type (quad, hex, octo)", True),
            SkillParam("payload_drop", "boolean", "Allow emergency payload jettison", False, False),
        ],
        outputs=[
            SkillParam("recovery_maneuver", "string", "Recovery procedure executed"),
            SkillParam("controllable", "boolean", "Whether drone remains controllable"),
            SkillParam("recommended_action", "string", "Recommended next action: land|continue"),
        ],
        model="claude-opus-4",
        phase="fly",
        tags=["motor", "failure", "recovery", "safety"],
        version="1.2.0",
        author="andino",
        dependencies=["land"],
    ),
    SkillDefinition(
        name="collision_avoidance",
        description="Detect and avoid obstacles using sensor fusion",
        category="safety",
        inputs=[
            SkillParam("sensor_data", "string", "Sensor data (lidar, ultrasonic, vision)", True),
            SkillParam("avoidance_strategy", "string", "Strategy: stop|climb|turn|corkscrew", False, "turn"),
            SkillParam("minimum_distance_m", "number", "Minimum distance to obstacle in meters", False, 3.0),
        ],
        outputs=[
            SkillParam("avoidance_action", "string", "Action taken to avoid collision"),
            SkillParam("collision_risk_level", "string", "Risk level: none|low|medium|high"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["collision", "avoidance", "safety", "sensor"],
        version="1.1.0",
        author="andino",
        dependencies=["navigate"],
    ),
    SkillDefinition(
        name="emergency_land",
        description="Execute emergency landing with minimal damage",
        category="safety",
        inputs=[
            SkillParam("trigger_reason", "string", "Reason for emergency landing", True),
            SkillParam("terrain_type", "string", "Terrain type (flat, sloped, water, forest)", False, "flat"),
            SkillParam("time_to_impact_s", "number", "Time available before impact in seconds", False, 10),
        ],
        outputs=[
            SkillParam("landing_outcome", "string", "Emergency landing outcome"),
            SkillParam("impact_velocity_ms", "number", "Estimated impact velocity in m/s"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["emergency", "landing", "safety", "critical"],
        version="1.0.0",
        author="andino",
        dependencies=["land"],
    ),
    SkillDefinition(
        name="parachute_deploy",
        description="Deploy emergency parachute system",
        category="safety",
        inputs=[
            SkillParam("altitude_agl_m", "number", "Altitude above ground in meters", True),
            SkillParam("descent_rate_ms", "number", "Current descent rate in m/s", True),
            SkillParam("parachute_type", "string", "Parachute type: ballistic|pyro|spring", False, "ballistic"),
        ],
        outputs=[
            SkillParam("deploy_status", "string", "Parachute deployment status"),
            SkillParam("expected_descent_rate_ms", "number", "Expected descent rate under parachute"),
        ],
        model="claude-sonnet-4",
        phase="fly",
        tags=["parachute", "emergency", "safety", "critical"],
        version="1.0.0",
        author="andino",
        dependencies=[],
    ),
    # ── Analysis ──────────────────────────────────────────────────────────
    SkillDefinition(
        name="flight_log_analysis",
        description="Analyze flight logs to extract metrics and detect anomalies",
        category="analysis",
        inputs=[
            SkillParam("flight_logs", "file", "Flight log files (ULog, BIN, CSV)", True),
            SkillParam("analysis_depth", "string", "Depth: quick|standard|deep", False, "standard"),
        ],
        outputs=[
            SkillParam("flight_report", "file", "Comprehensive flight analysis report"),
            SkillParam("anomalies", "string", "Detected anomalies and warnings"),
            SkillParam("key_metrics", "string", "Key performance metrics from the flight"),
        ],
        model="claude-sonnet-4",
        phase="verify",
        tags=["analysis", "logs", "post-flight"],
        version="1.2.0",
        author="andino",
        dependencies=[],
    ),
    SkillDefinition(
        name="performance_comparison",
        description="Compare actual flight performance against design predictions",
        category="analysis",
        inputs=[
            SkillParam("flight_data", "string", "Actual flight performance data", True),
            SkillParam("design_predictions", "string", "Predicted design performance", True),
            SkillParam("metrics", "string", "Metrics to compare (flight_time, efficiency, etc)", False, "all"),
        ],
        outputs=[
            SkillParam("comparison_report", "file", "Actual vs predicted comparison report"),
            SkillParam("variance_pct", "number", "Overall variance percentage"),
            SkillParam("improvement_suggestions", "string", "Suggestions to close the gap"),
        ],
        model="claude-opus-4",
        phase="verify",
        tags=["comparison", "performance", "analysis"],
        version="1.0.0",
        author="andino",
        dependencies=["flight_log_analysis"],
    ),
    SkillDefinition(
        name="failure_diagnosis",
        description="Diagnose root cause of flight failures and incidents",
        category="analysis",
        inputs=[
            SkillParam("incident_report", "string", "Description of the failure incident", True),
            SkillParam("flight_logs", "file", "Flight logs preceding the failure", True),
            SkillParam("design_spec", "string", "Drone design specification", False),
        ],
        outputs=[
            SkillParam("root_cause", "string", "Identified root cause of failure"),
            SkillParam("contributing_factors", "string", "Contributing factors identified"),
            SkillParam("prevention_recommendations", "string", "Recommendations to prevent recurrence"),
        ],
        model="claude-opus-4",
        phase="verify",
        tags=["failure", "diagnosis", "analysis", "root-cause"],
        version="1.1.0",
        author="andino",
        dependencies=["flight_log_analysis"],
    ),
    SkillDefinition(
        name="design_iteration",
        description="Generate design improvement suggestions from flight analysis",
        category="analysis",
        inputs=[
            SkillParam("flight_analysis", "string", "Results from flight log analysis", True),
            SkillParam("current_design", "string", "Current drone design configuration", True),
            SkillParam("improvement_goals", "string", "Goals for the next iteration", False, "maximize flight time"),
        ],
        outputs=[
            SkillParam("design_changes", "string", "Recommended design changes"),
            SkillParam("expected_improvement", "string", "Expected performance improvement"),
            SkillParam("trade_off_analysis", "string", "Trade-offs introduced by changes"),
        ],
        model="claude-opus-4",
        phase="archive",
        tags=["iteration", "improvement", "design"],
        version="1.0.0",
        author="andino",
        dependencies=["flight_log_analysis", "performance_comparison"],
    ),
]


# ── Phase metadata for the SDD lifecycle ─────────────────────────────
CATEGORY_PHASES = {
    "engineering": ["explore", "propose", "spec", "design", "simulate"],
    "flight": ["fly"],
    "safety": ["fly", "verify"],
    "analysis": ["verify", "archive"],
}

PHASE_CATEGORIES = {
    "explore": "engineering",
    "propose": "engineering",
    "spec": "engineering",
    "design": "engineering",
    "simulate": "engineering",
    "build": "engineering",
    "fly": "flight",
    "verify": "analysis",
    "archive": "analysis",
}


class SkillRegistry:
    """Unified skill registry shared between design-time and flight-time.

    Skills are categorized:
    - engineering: used during drone design (morphology, sizing, simulation)
    - flight: used during drone operation (navigation, inspection, delivery)
    - safety: used during emergencies (failsafe, recovery, parachute)
    - analysis: used post-flight (verification, learning, archiving)

    Can load from JSON files, a remote registry endpoint, or use built-in skills.
    """

    def __init__(self, paths: Optional[list[str | Path]] = None):
        self._skills: dict[str, SkillDefinition] = {}
        self._tags_index: dict[str, set[str]] = {}
        self._phase_index: dict[str, set[str]] = {}
        self._category_index: dict[str, set[str]] = {}
        self._path_sources: dict[str, Path] = {}

        for builtin in BUILTIN_SKILLS:
            self.register(builtin)

        if paths:
            for path in paths:
                self._load_from_path(Path(path))

    def _load_from_path(self, path: Path) -> None:
        path = path.expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Skills path not found: {path}")
        if path.is_dir():
            for fpath in sorted(path.glob("*.json")):
                self._load_json_file(fpath)
        elif path.suffix == ".json":
            self._load_json_file(path)

    def _load_json_file(self, fpath: Path) -> None:
        try:
            with open(fpath) as f:
                data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    self._ingest_from_dict(item, fpath)
            elif isinstance(data, dict):
                if "name" in data:
                    self._ingest_from_dict(data, fpath)
                else:
                    for name, item in data.items():
                        item["name"] = item.get("name", name)
                        self._ingest_from_dict(item, fpath)
        except (json.JSONDecodeError, KeyError) as e:
            import warnings
            warnings.warn(f"Skipping invalid skill file {fpath}: {e}")

    def _ingest_from_dict(self, data: dict, source: Path) -> None:
        skill = SkillDefinition.from_dict(data)
        self.register(skill)
        self._path_sources[skill.name] = source

    def _rebuild_indices(self) -> None:
        self._tags_index.clear()
        self._phase_index.clear()
        self._category_index.clear()
        for name, skill in self._skills.items():
            for tag in skill.tags:
                self._tags_index.setdefault(tag, set()).add(name)
            phase = skill.phase
            self._phase_index.setdefault(phase, set()).add(name)
            cat = skill.category
            self._category_index.setdefault(cat, set()).add(name)

    def register(self, skill_def: SkillDefinition) -> None:
        if not skill_def.name or not skill_def.name.strip():
            raise ValueError("Skill name must be non-empty")
        if not re.match(r"^[a-z][a-z0-9_]*$", skill_def.name):
            raise ValueError(f"Skill name '{skill_def.name}' must be snake_case starting with a letter")
        self._skills[skill_def.name] = skill_def
        for tag in skill_def.tags:
            self._tags_index.setdefault(tag, set()).add(skill_def.name)
        self._phase_index.setdefault(skill_def.phase, set()).add(skill_def.name)
        self._category_index.setdefault(skill_def.category, set()).add(skill_def.name)

    def unregister(self, name: str) -> None:
        if name not in self._skills:
            raise KeyError(f"Unknown skill: {name}")
        skill = self._skills.pop(name)
        for tag in skill.tags:
            self._tags_index.get(tag, set()).discard(name)
            if not self._tags_index[tag]:
                del self._tags_index[tag]
        self._phase_index.get(skill.phase, set()).discard(name)
        self._category_index.get(skill.category, set()).discard(name)
        self._path_sources.pop(name, None)

    def get(self, name: str) -> SkillDefinition:
        skill = self._skills.get(name)
        if skill is None:
            raise KeyError(f"Unknown skill: {name}")
        return skill.clone()

    def list(self, category: Optional[str] = None, phase: Optional[str] = None, tags: Optional[list[str]] = None) -> list[SkillDefinition]:
        names: set[str] | None = None

        if category is not None:
            cat_names = self._category_index.get(category, set())
            if names is None:
                names = cat_names.copy()
            else:
                names &= cat_names

        if phase is not None:
            phase_names = self._phase_index.get(phase, set())
            if names is None:
                names = phase_names.copy()
            else:
                names &= phase_names

        if tags:
            tag_names: set[str] | None = None
            for tag in tags:
                matched = self._tags_index.get(tag, set())
                if tag_names is None:
                    tag_names = matched.copy()
                else:
                    tag_names &= matched
            if tag_names is not None:
                if names is None:
                    names = tag_names.copy()
                else:
                    names &= tag_names

        if names is None:
            names = set(self._skills.keys())

        return sorted((self._skills[n] for n in names), key=lambda s: s.name)

    def search(self, query: str) -> list[SkillDefinition]:
        q = query.lower()
        results: list[tuple[SkillDefinition, int]] = []
        for skill in self._skills.values():
            score = 0
            if q in skill.name.lower():
                score += 10
            if q in skill.description.lower():
                score += 5
            for tag in skill.tags:
                if q in tag.lower():
                    score += 3
            if any(q in dep.lower() for dep in skill.dependencies):
                score += 1
            if score > 0:
                results.append((skill, score))
        results.sort(key=lambda x: (-x[1], x[0].name))
        return [r[0] for r in results]

    def export_skill(self, name: str, path: str | Path) -> Path:
        skill = self.get(name)
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(skill.to_json())
        return target

    def import_skill(self, path: str | Path) -> SkillDefinition:
        source = Path(path)
        if not source.exists():
            raise FileNotFoundError(f"Skill file not found: {source}")
        with open(source) as f:
            data = json.load(f)
        if isinstance(data, list):
            if not data:
                raise ValueError("Empty skill list in file")
            skill = SkillDefinition.from_dict(data[0])
        else:
            skill = SkillDefinition.from_dict(data)
        self.register(skill)
        self._path_sources[skill.name] = source
        return skill

    def count(self) -> int:
        return len(self._skills)

    def get_categories(self) -> dict[str, int]:
        return {cat: len(names) for cat, names in sorted(self._category_index.items())}

    def get_phases(self) -> dict[str, int]:
        return {phase: len(names) for phase, names in sorted(self._phase_index.items())}

    def get_tags(self) -> dict[str, int]:
        return {tag: len(names) for tag, names in sorted(self._tags_index.items(), key=lambda x: -len(x[1]))}

    def resolve_chain(self, skill_name: str) -> list[str]:
        """Return ordered list of skills needed, including transitive dependencies."""
        ordered: list[str] = []
        visited: set[str] = set()

        def _visit(name: str) -> None:
            if name in visited:
                return
            visited.add(name)
            try:
                skill = self._skills[name]
            except KeyError:
                raise KeyError(f"Unknown dependency: '{name}' referenced by skill chain")
            for dep in skill.dependencies:
                _visit(dep)
            ordered.append(name)

        _visit(skill_name)
        return ordered

    def to_dict(self) -> dict[str, dict[str, Any]]:
        return {name: skill.to_dict() for name, skill in sorted(self._skills.items())}

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def load_from_dir(cls, skills_dir: str | Path) -> "SkillRegistry":
        return cls(paths=[skills_dir])

    @classmethod
    def from_builtins(cls) -> "SkillRegistry":
        return cls()
