export function AgentSkeleton() {
	return (
		<div className="animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5">
			<div className="mb-3 flex items-center gap-2">
				<div className="h-4 w-24 rounded bg-[var(--surface-3)]" />
				<div className="h-5 w-16 rounded-full bg-[var(--surface-3)]" />
			</div>
			<div className="mb-2 h-3 w-40 rounded bg-[var(--surface-3)]" />
			<div className="mb-3 h-1.5 rounded-full bg-[var(--surface-3)]" />
			<div className="flex items-center justify-between">
				<div className="h-3 w-16 rounded bg-[var(--surface-3)]" />
				<div className="h-3 w-20 rounded bg-[var(--surface-3)]" />
			</div>
		</div>
	);
}
