import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	PauseCircle,
	XCircle,
} from "lucide-react";
import { AgentCostDisplay } from "./AgentCostDisplay";
import { AgentProgressBar } from "./AgentProgressBar";
import { AgentRiskBadge } from "./AgentRiskBadge";
import type { AgentSessionStatus } from "./agents.types";

interface AgentCardProps {
	session: AgentSessionStatus;
	onSelect: () => void;
	isSelected: boolean;
}

const STATUS_CONFIG: Record<
	AgentSessionStatus["status"],
	{ icon: React.ElementType; label: string; borderClass: string }
> = {
	running: {
		icon: Loader2,
		label: "En ejecución",
		borderClass: "border-[var(--color-primary)]/30",
	},
	paused: {
		icon: PauseCircle,
		label: "Pausado",
		borderClass: "border-[var(--color-muted)]",
	},
	completed: {
		icon: CheckCircle2,
		label: "Completado",
		borderClass: "border-[var(--color-success)]/30",
	},
	failed: {
		icon: XCircle,
		label: "Fallido",
		borderClass: "border-[var(--color-danger)]/30",
	},
	awaiting_approval: {
		icon: AlertCircle,
		label: "Requiere revisión",
		borderClass: "border-[var(--color-warning)]/40",
	},
};

export function AgentCard({ session, onSelect, isSelected }: AgentCardProps) {
	const StatusIcon = STATUS_CONFIG[session.status].icon;
	const { borderClass } = STATUS_CONFIG[session.status];

	const isCriticalAction =
		session.requiresAction && session.risk === "critical";

	return (
		<button
			type="button"
			onClick={onSelect}
			className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
				isSelected
					? `border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20`
					: `${borderClass} border-[var(--border-subtle)]`
			} ${
				isCriticalAction ? "animate-pulse border-[var(--color-danger)]/50" : ""
			}`}
		>
			{/* Header */}
			<div className="mb-3 flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="truncate text-sm font-medium text-[var(--text-primary)]">
							{session.agentName}
						</h3>
						<StatusIcon
							className={`size-3.5 shrink-0 ${
								session.status === "running"
									? "animate-spin text-[var(--color-primary)]"
									: session.status === "awaiting_approval"
										? "text-[var(--color-warning)]"
										: session.status === "completed"
											? "text-[var(--color-success)]"
											: session.status === "failed"
												? "text-[var(--color-danger)]"
												: "text-[var(--text-secondary)]"
							}`}
							aria-hidden="true"
						/>
					</div>
					<p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
						{session.clientName} · {session.period}
					</p>
				</div>
				{session.requiresAction && (
					<span className="shrink-0 rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
						Acción
					</span>
				)}
			</div>

			{/* Progress */}
			<div className="mb-3">
				<AgentProgressBar
					progress={session.progress}
					status={session.status}
					phase={session.phase}
				/>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between gap-2">
				<AgentRiskBadge risk={session.risk} />
				<AgentCostDisplay
					elapsedMs={session.elapsedMs}
					tokensUsed={session.tokensUsed}
				/>
			</div>

			{/* Changes summary */}
			{(session.changesProposed > 0 || session.evidenceCollected > 0) && (
				<div className="mt-2 flex gap-3 text-[11px] text-[var(--text-secondary)]">
					{session.changesProposed > 0 && (
						<span>+{session.changesProposed} cambios</span>
					)}
					{session.evidenceCollected > 0 && (
						<span>{session.evidenceCollected} evidencias</span>
					)}
				</div>
			)}
		</button>
	);
}
