from __future__ import annotations

import json
import statistics
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .store import MemoryStore


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class FlightRecord:
    """A single flight record with telemetry, events, decisions, and analysis."""

    def __init__(self, flight_id: str, mission_id: str, design_id: str):
        self.flight_id = flight_id
        self.mission_id = mission_id
        self.design_id = design_id
        self.start_time: str = _iso_now()
        self.end_time: Optional[str] = None
        self.status: str = "in_flight"  # planned | in_flight | completed | aborted | crashed
        self.telemetry: list[dict[str, Any]] = []
        self.events: list[dict[str, Any]] = []
        self.decisions: list[dict[str, Any]] = []
        self.analysis: Optional[dict[str, Any]] = None

    def log_telemetry(self, timestamp: str, position: dict[str, float], attitude: dict[str, float],
                      battery_voltage: float, battery_current: float, groundspeed_ms: float,
                      altitude_m: float) -> None:
        self.telemetry.append({
            "timestamp": timestamp,
            "position": position,
            "attitude": attitude,
            "battery_voltage": battery_voltage,
            "battery_current": battery_current,
            "groundspeed_ms": groundspeed_ms,
            "altitude_m": altitude_m,
        })

    def log_event(self, timestamp: str, event_type: str, description: str,
                  severity: str = "info", data: Optional[dict[str, Any]] = None) -> None:
        self.events.append({
            "timestamp": timestamp,
            "type": event_type,
            "description": description,
            "severity": severity,
            "data": data or {},
        })

    def log_decision(self, timestamp: str, decision: str, reasoning: str,
                     alternatives: Optional[list[str]] = None,
                     outcome: Optional[str] = None) -> None:
        self.decisions.append({
            "timestamp": timestamp,
            "decision": decision,
            "reasoning": reasoning,
            "alternatives": alternatives or [],
        })

    def finish(self, status: str = "completed") -> None:
        self.end_time = _iso_now()
        self.status = status

    def to_dict(self) -> dict[str, Any]:
        return {
            "flight_id": self.flight_id,
            "mission_id": self.mission_id,
            "design_id": self.design_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "status": self.status,
            "telemetry": self.telemetry,
            "events": self.events,
            "decisions": self.decisions,
            "analysis": self.analysis,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FlightRecord:
        record = cls(
            flight_id=data["flight_id"],
            mission_id=data.get("mission_id", ""),
            design_id=data.get("design_id", ""),
        )
        record.start_time = data.get("start_time", record.start_time)
        record.end_time = data.get("end_time")
        record.status = data.get("status", "in_flight")
        record.telemetry = list(data.get("telemetry", []))
        record.events = list(data.get("events", []))
        record.decisions = list(data.get("decisions", []))
        record.analysis = data.get("analysis")
        return record


class FlightHistory:
    """Record, query, and analyze flight history.

    Each flight record includes:
    - mission: mission description and ID
    - design: drone design used
    - telemetry: time-series of position, attitude, battery, etc.
    - events: significant events (waypoint reached, anomaly detected, etc.)
    - decisions: agent's decisions and reasoning
    - performance: actual vs predicted metrics
    - analysis: post-flight analysis results

    Uses MemoryStore for persistence.
    """

    def __init__(self, memory_store: MemoryStore):
        self._store = memory_store
        self._active_flights: dict[str, FlightRecord] = {}

    # ── Recording ────────────────────────────────────────────────────────

    def record_flight(self, mission_id: str, design_id: str) -> str:
        flight_id = str(uuid.uuid4())
        record = FlightRecord(flight_id, mission_id, design_id)
        self._active_flights[flight_id] = record
        return flight_id

    def log_telemetry(self, flight_id: str, **kwargs) -> None:
        record = self._get_active(flight_id)
        record.log_telemetry(
            timestamp=kwargs.get("timestamp", _iso_now()),
            position=kwargs.get("position", {"lat": 0, "lon": 0, "alt": 0}),
            attitude=kwargs.get("attitude", {"roll": 0, "pitch": 0, "yaw": 0}),
            battery_voltage=kwargs.get("battery_voltage", 0.0),
            battery_current=kwargs.get("battery_current", 0.0),
            groundspeed_ms=kwargs.get("groundspeed_ms", 0.0),
            altitude_m=kwargs.get("altitude_m", 0.0),
        )

    def log_event(self, flight_id: str, event_type: str, description: str,
                  severity: str = "info", data: Optional[dict[str, Any]] = None) -> None:
        record = self._get_active(flight_id)
        record.log_event(_iso_now(), event_type, description, severity, data)

    def log_decision(self, flight_id: str, decision: str, reasoning: str,
                     alternatives: Optional[list[str]] = None) -> None:
        record = self._get_active(flight_id)
        record.log_decision(_iso_now(), decision, reasoning, alternatives)

    def finish_flight(self, flight_id: str, status: str = "completed") -> Optional[dict[str, Any]]:
        record = self._active_flights.pop(flight_id, None)
        if record is None:
            return None
        record.finish(status)
        data = record.to_dict()

        tags = {
            "project": "default",
            "type": "flight",
            "phase": "fly",
            "platform": "custom",
        }

        self._store.store(
            key=f"flight:{flight_id}",
            data=data,
            tags=tags,
        )
        return data

    # ── Query ────────────────────────────────────────────────────────────

    def get_flight(self, flight_id: str) -> Optional[FlightRecord]:
        results = self._store.load(key=f"flight:{flight_id}", limit=1)
        if not results:
            return None
        return FlightRecord.from_dict(results[0]["data"])

    def get_active_flight(self, flight_id: str) -> Optional[FlightRecord]:
        return self._active_flights.get(flight_id)

    def list_flights(self, limit: int = 20) -> list[dict[str, Any]]:
        return self._store.search(
            query="flight:",
            tags={"type": "flight"},
            limit=limit,
        )

    def list_flights_by_design(self, design_id: str, limit: int = 20) -> list[dict[str, Any]]:
        all_flights = self.list_flights(limit=limit)
        return [
            f for f in all_flights
            if f.get("data", {}).get("design_id") == design_id
        ]

    def list_flights_by_mission(self, mission_id: str, limit: int = 20) -> list[dict[str, Any]]:
        all_flights = self.list_flights(limit=limit)
        return [
            f for f in all_flights
            if f.get("data", {}).get("mission_id") == mission_id
        ]

    # ── Analysis ─────────────────────────────────────────────────────────

    def compare_flights(self, flight_ids: list[str]) -> dict[str, Any]:
        records = []
        for fid in flight_ids:
            rec = self.get_flight(fid)
            if rec is not None:
                records.append(rec)

        if not records:
            return {"error": "No flights found", "flight_ids": flight_ids}

        telemetry_summary = self._compare_telemetry(records)
        event_summary = self._compare_events(records)
        duration_summary = self._compare_durations(records)

        return {
            "flight_ids": flight_ids,
            "count": len(records),
            "durations": duration_summary,
            "telemetry": telemetry_summary,
            "events": event_summary,
        }

    def analyze_fleet(self, project: str = "default") -> dict[str, Any]:
        all_flights = self._store.search(
            query="flight:",
            tags={"type": "flight", "project": project},
            limit=1000,
        )

        if not all_flights:
            return {"project": project, "total_flights": 0}

        statuses = defaultdict(int)
        designs = defaultdict(int)
        durations: list[float] = []
        events_by_type = defaultdict(int)

        for entry in all_flights:
            data = entry.get("data", {})
            statuses[data.get("status", "unknown")] += 1
            designs[data.get("design_id", "unknown")] += 1

            start = data.get("start_time")
            end = data.get("end_time")
            if start and end:
                try:
                    s = datetime.fromisoformat(start)
                    e = datetime.fromisoformat(end)
                    durations.append((e - s).total_seconds())
                except (ValueError, TypeError):
                    pass

            for event in data.get("events", []):
                events_by_type[event.get("type", "unknown")] += 1

        return {
            "project": project,
            "total_flights": len(all_flights),
            "unique_designs": len(designs),
            "status_breakdown": dict(statuses),
            "design_usage": dict(designs),
            "duration_stats": self._stats(durations) if durations else {},
            "events_by_type": dict(events_by_type),
        }

    # ── Analysis helpers ─────────────────────────────────────────────────

    def _compare_telemetry(self, records: list[FlightRecord]) -> dict[str, Any]:
        if not records:
            return {}

        summary = {}
        for key in ("battery_voltage", "groundspeed_ms", "altitude_m"):
            values = []
            for rec in records:
                for tp in rec.telemetry:
                    if key in tp:
                        values.append(tp[key])
            if values:
                summary[key] = {
                    "min": min(values),
                    "max": max(values),
                    "avg": statistics.mean(values),
                }
        return summary

    def _compare_events(self, records: list[FlightRecord]) -> dict[str, Any]:
        type_counts: dict[str, int] = defaultdict(int)
        severity_counts: dict[str, int] = defaultdict(int)
        for rec in records:
            for ev in rec.events:
                type_counts[ev.get("type", "unknown")] += 1
                severity_counts[ev.get("severity", "info")] += 1
        return {
            "by_type": dict(type_counts),
            "by_severity": dict(severity_counts),
        }

    def _compare_durations(self, records: list[FlightRecord]) -> dict[str, Any]:
        durations: list[float] = []
        for rec in records:
            if rec.start_time and rec.end_time:
                try:
                    s = datetime.fromisoformat(rec.start_time)
                    e = datetime.fromisoformat(rec.end_time)
                    durations.append((e - s).total_seconds())
                except (ValueError, TypeError):
                    pass
        return self._stats(durations) if durations else {}

    @staticmethod
    def _stats(values: list[float]) -> dict[str, float]:
        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "avg": statistics.mean(values),
            "median": statistics.median(values),
            "total": sum(values),
        }

    def _get_active(self, flight_id: str) -> FlightRecord:
        record = self._active_flights.get(flight_id)
        if record is None:
            raise KeyError(f"No active flight with id: {flight_id}")
        return record
