import { AgentProgressBar } from "./AgentProgressBar";

export interface CaseProgressProps {
	completed: number;
	total: number;
	status: "running" | "paused" | "completed" | "failed" | "awaiting_approval";
}

const STATUS_LABELS: Record<CaseProgressProps["status"], string> = {
	running: "Revisando...",
	paused: "En pausa",
	completed: "Completado",
	failed: "Falló",
	awaiting_approval: "Listo para tu revisión",
};

export function CaseProgress({ completed, total, status }: CaseProgressProps) {
	const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

	return (
		<div className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2.5 min-w-[200px]">
			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-center justify-between">
					<span className="text-2xs font-semibold text-[var(--text-secondary)]">
						{completed} de {total} verificaciones
					</span>
					<span className="text-2xs font-medium text-[var(--text-tertiary)]">
						{STATUS_LABELS[status]}
					</span>
				</div>
				<AgentProgressBar progress={progress} status={status} />
			</div>
		</div>
	);
}
