import { useAgentsWindowStore } from "./agents.store";
import { AgentCard } from "./AgentCard";
import { AgentSkeleton } from "./AgentSkeleton";
import type { AgentSessionStatus } from "./agents.types";
import { Bot, RefreshCw } from "lucide-react";

interface AgentGridProps {
	sessions: AgentSessionStatus[];
	isLoading: boolean;
	isError: boolean;
	error?: Error | null;
	refetch: () => void;
}

export function AgentGrid({
	sessions,
	isLoading,
	isError,
	error,
	refetch,
}: AgentGridProps) {
	const selectedSessionId = useAgentsWindowStore((s) => s.selectedSessionId);
	const selectSession = useAgentsWindowStore((s) => s.selectSession);

	// Loading state
	if (isLoading) {
		return <AgentSkeleton />;
	}

	// Error state
	if (isError) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-danger-bg)]/20 bg-[var(--color-danger-bg)]/5 p-8 text-center">
				<p className="text-sm text-[var(--color-danger)]">
					{error?.message ?? "Error al cargar sesiones de agentes"}
				</p>
				<button
					type="button"
					onClick={refetch}
					className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
				>
					<RefreshCw className="size-3.5" aria-hidden="true" />
					Reintentar
				</button>
			</div>
		);
	}

	// Empty state
	if (sessions.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 text-center">
				<Bot className="size-8 text-[var(--text-secondary)]" aria-hidden="true" />
				<p className="text-sm text-[var(--text-secondary)]">
					No hay agentes activos
				</p>
			</div>
		);
	}

	// Data state
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{sessions.map((session) => (
				<AgentCard
					key={session.id}
					session={session}
					onSelect={() => selectSession(session.id)}
					isSelected={selectedSessionId === session.id}
				/>
			))}
		</div>
	);
}
