import { useEffect, useState } from "react";
import { AgentPulse } from "./AgentPulse";

interface SwarmEvent {
	agent?: string;
	status: "active" | "success" | "error";
	message: string;
}

export const AgentHeartbeat = ({ runId }: { runId: string }) => {
	const [events, setEvents] = useState<SwarmEvent[]>([]);
	const [activeAgent, setActiveAgent] = useState<string | null>(null);

	useEffect(() => {
		if (!runId) return;

		// Conexión real al SSE Gateway de la API
		const eventSource = new EventSource(
			`http://localhost:3000/swarm/stream/${runId}`,
		);

		eventSource.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.agent) {
				setActiveAgent(data.agent);
				setEvents((prev) => [...prev, data]);
			}
			if (data.event === "complete") {
				eventSource.close();
				setActiveAgent(null);
			}
		};

		return () => eventSource.close();
	}, [runId]);

	return (
		<div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
			<AgentPulse status={activeAgent ? "active" : "success"} size="md" />
			<div className="flex-1 min-w-0">
				<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
					Enjambre Activo
				</p>
				<p className="text-xs font-semibold truncate text-foreground">
					{events[events.length - 1]?.message || "Sincronizando agentes..."}
				</p>
			</div>
		</div>
	);
};
