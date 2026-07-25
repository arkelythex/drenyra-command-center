"use client";

import { useCallback, useState } from "react";
import { mockAgentEvents, mockTelemetry } from "@/lib/mock-data";
import type { AgentEvent, Telemetry } from "@/types/drone";
import AgentLog from "./AgentLog";
import EmergencyControls from "./EmergencyControls";
import HUD from "./HUD";
import TelemetryPanel from "./TelemetryPanel";

export default function FlightDashboard() {
	const [telemetry] = useState<Telemetry>(mockTelemetry);
	const [events] = useState<AgentEvent[]>(mockAgentEvents);

	const handleAction = useCallback((_action: string) => {}, []);

	return (
		<div className="max-w-7xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-52px)]">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-text-primary">
					Flight Dashboard
				</h1>
				<span className="px-3 py-1 rounded-lg bg-success/20 text-success text-sm font-bold font-mono">
					● ARMED
				</span>
			</div>

			{/* Main Layout */}
			<div className="flex flex-1 border border-border-subtle rounded-[10px] overflow-hidden bg-bg-void">
				<TelemetryPanel telemetry={telemetry} />
				<HUD telemetry={telemetry} />
			</div>

			{/* Bottom Row */}
			<div className="mt-3 grid grid-cols-[1fr_340px] gap-3 h-[160px]">
				<AgentLog events={events} />
				<EmergencyControls onAction={handleAction} />
			</div>
		</div>
	);
}
