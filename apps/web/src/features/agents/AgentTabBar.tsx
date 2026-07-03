import type { AgentSessionStatusDTO } from "./agents.types";
import { useAgentsWindowStore } from "./agents.store";

const statusLabels: Record<string, string> = {
	running: "Ejecutando",
	paused: "Pausado",
	completed: "Completado",
	failed: "Falló",
	awaiting_approval: "Requiere aprobación",
};

const dotColors: Record<string, string> = {
	running: "bg-[var(--color-primary)]",
	paused: "bg-gray-400",
	completed: "bg-emerald-500",
	failed: "bg-red-500",
	awaiting_approval: "bg-amber-500",
};

export interface AgentTabBarProps {
	sessions: AgentSessionStatusDTO[];
}

export function AgentTabBar({ sessions }: AgentTabBarProps) {
	const selectedSessionId = useAgentsWindowStore((s) => s.selectedSessionId);
	const selectSession = useAgentsWindowStore((s) => s.selectSession);

	return (
		<div className="flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] pb-1">
			{sessions.map((session) => {
				const isSelected = selectedSessionId === session.id;
				return (
					<button
						key={session.id}
						type="button"
						onClick={() => selectSession(session.id)}
						className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2 text-xs font-medium transition-colors ${
							isSelected
								? "border border-b-0 border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)]"
								: "text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
						}`}
					>
						<span
							className={`h-1.5 w-1.5 rounded-full ${
								dotColors[session.status] ?? dotColors.running
							}`}
						/>
						<span className="truncate max-w-[120px]">{session.agentName}</span>
						<span className="text-2xs text-[var(--text-tertiary)]">
							{statusLabels[session.status] ?? session.status}
						</span>
					</button>
				);
			})}
		</div>
	);
}
