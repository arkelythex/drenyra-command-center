import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, User } from "lucide-react";
import type { ThreadTaskDTO } from "../threads.api";

interface ThreadDetailPageProps {
	title: string;
	description?: string;
	status: string;
	period?: string;
	environment: string;
	tasks: ThreadTaskDTO[];
	onClose?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Borrador",
	ACTIVE: "Activo",
	BLOCKED: "Bloqueado",
	PENDING_REVIEW: "En revisión",
	AWAITING_INFO: "Esperando info",
	REVIEWED: "Revisado",
	CLOSED: "Cerrado",
};

/**
 * ThreadDetailPage — individual thread workspace view.
 */
export function ThreadDetailPage({
	title,
	description,
	status,
	period,
	tasks,
	onClose,
}: ThreadDetailPageProps) {
	const navigate = useNavigate();

	const taskProgress =
		tasks.length > 0
			? Math.round(
					(tasks.filter((t) => t.status === "COMPLETED").length /
						tasks.length) *
						100,
				)
			: 0;

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
				<button
					type="button"
					onClick={() => {
						if (onClose) onClose();
						else navigate({ to: "/drenyra" });
					}}
					className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
				>
					<ArrowLeft size={16} />
				</button>
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
						{title}
					</h2>
					{period && (
						<p className="text-[10px] text-[var(--text-muted)]">
							{period} · {STATUS_LABELS[status] ?? status}
						</p>
					)}
				</div>
			</div>

			{/* Description */}
			{description && (
				<div className="border-b border-[var(--border-subtle)] px-4 py-3">
					<p className="text-xs text-[var(--text-secondary)]">{description}</p>
				</div>
			)}

			{/* Progress */}
			<div className="border-b border-[var(--border-subtle)] px-4 py-3">
				<div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
					<span>Progress</span>
					<span>
						{taskProgress}% (
						{tasks.filter((t) => t.status === "COMPLETED").length}/
						{tasks.length})
					</span>
				</div>
				<div className="h-1.5 w-full rounded-full bg-[var(--surface-3)]">
					<div
						className="h-full rounded-full bg-[var(--color-primary)] transition-all"
						style={{ width: `${taskProgress}%` }}
					/>
				</div>
			</div>

			{/* Task list */}
			<div className="flex-1 overflow-y-auto px-4 py-3">
				<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
					Tareas
				</p>
				<div className="space-y-1.5">
					{tasks.map((task) => {
						const IconComponent =
							task.status === "COMPLETED" ? CheckCircle2 : Clock;
						return (
							<div
								key={task.id}
								className="flex items-start gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2"
							>
								<IconComponent
									size={14}
									className={`mt-0.5 flex-shrink-0 ${
										task.status === "COMPLETED"
											? "text-[var(--color-success)]"
											: task.status === "IN_PROGRESS"
												? "text-[var(--color-primary)]"
												: "text-[var(--text-muted)]"
									}`}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-xs font-medium text-[var(--text-primary)]">
										{task.title}
									</p>
									{task.agentId && (
										<p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
											<User size={10} />
											{task.agentId}
										</p>
									)}
									{task.resultSummary && (
										<p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
											{task.resultSummary}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{tasks.length === 0 && (
					<p className="py-8 text-center text-xs text-[var(--text-muted)]">
						No hay tareas asignadas aún
					</p>
				)}
			</div>
		</div>
	);
}
