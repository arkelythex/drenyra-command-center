import type { ThreadSummary } from "../threads.api";

interface ThreadCardProps {
	thread: ThreadSummary;
	onClick?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
	DRAFT: "text-[var(--text-muted)]",
	ACTIVE: "text-[var(--color-primary)]",
	BLOCKED: "text-[var(--color-warning)]",
	PENDING_REVIEW: "text-[var(--color-accent)]",
	AWAITING_INFO: "text-[var(--color-warning)]",
	REVIEWED: "text-[var(--color-success)]",
	CLOSED: "text-[var(--text-muted)]",
};

const STATUS_DOTS: Record<string, string> = {
	DRAFT: "bg-[var(--text-muted)]",
	ACTIVE: "bg-[var(--color-primary)]",
	BLOCKED: "bg-[var(--color-warning)]",
	PENDING_REVIEW: "bg-[var(--color-accent)]",
	AWAITING_INFO: "bg-[var(--color-warning)]",
	REVIEWED: "bg-[var(--color-success)]",
	CLOSED: "bg-[var(--text-muted)]",
};

export function ThreadCard({ thread, onClick }: ThreadCardProps) {
	const progress =
		thread.taskCount > 0
			? Math.round((thread.completedTaskCount / thread.taskCount) * 100)
			: 0;

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-[var(--surface-2)]"
		>
			{/* Status dot */}
			<span
				className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOTS[thread.status] ?? "bg-[var(--text-muted)]"}`}
			/>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<p
						className={`truncate text-xs font-medium ${STATUS_STYLES[thread.status] ?? "text-[var(--text-primary)]"}`}
					>
						{thread.title}
					</p>
					{thread.priority === "URGENT" && (
						<span className="flex-shrink-0 rounded bg-[var(--color-error)]/10 px-1 py-0.5 text-[8px] font-bold text-[var(--color-error)]">
							URG
						</span>
					)}
				</div>

				{/* Progress bar */}
				{thread.taskCount > 0 && (
					<div className="mt-1.5 h-1 w-full rounded-full bg-[var(--surface-3)]">
						<div
							className="h-full rounded-full bg-[var(--color-primary)] transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}

				<div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
					<span>{progress}%</span>
					{thread.agentCount > 0 && <span>· {thread.agentCount} agentes</span>}
					{thread.period && <span>· {thread.period}</span>}
				</div>
			</div>
		</button>
	);
}
