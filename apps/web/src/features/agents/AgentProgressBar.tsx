interface AgentProgressBarProps {
	progress: number;
	status?: "running" | "paused" | "completed" | "failed" | "awaiting_approval";
	phase?: string;
}

const STATUS_COLORS: Record<
	NonNullable<AgentProgressBarProps["status"]>,
	string
> = {
	running: "var(--color-primary)",
	paused: "var(--color-muted)",
	completed: "var(--color-success)",
	failed: "var(--color-danger)",
	awaiting_approval: "var(--color-warning)",
};

export function AgentProgressBar({
	progress,
	status = "running",
	phase,
}: AgentProgressBarProps) {
	const clamped = Math.min(100, Math.max(0, progress));
	const color = STATUS_COLORS[status];

	return (
		<div className="space-y-1">
			{phase && <p className="text-xs text-[var(--text-secondary)]">{phase}</p>}
			<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${clamped}%`, backgroundColor: color }}
				/>
			</div>
		</div>
	);
}

