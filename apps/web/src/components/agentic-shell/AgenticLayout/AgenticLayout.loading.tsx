export function AgenticLayoutLoading() {
	return (
		<div className="flex h-full animate-pulse">
			{/* Sidebar skeleton */}
			<div className="w-[240px] border-r border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
				<div className="mb-6 h-4 w-20 rounded bg-[var(--surface-2)]" />
				{[...Array(6)].map((_, i) => (
					<div key={i} className="mb-3 flex items-center gap-2">
						<div className="h-4 w-4 rounded bg-[var(--surface-2)]" />
						<div className="h-3 flex-1 rounded bg-[var(--surface-2)]" />
					</div>
				))}
			</div>

			{/* Content skeleton */}
			<div className="flex-1 p-6">
				<div className="mb-4 h-6 w-48 rounded bg-[var(--surface-2)]" />
				<div className="mb-3 h-3 w-96 rounded bg-[var(--surface-2)]" />
				<div className="mb-3 h-3 w-80 rounded bg-[var(--surface-2)]" />
				<div className="mb-3 h-3 w-72 rounded bg-[var(--surface-2)]" />
			</div>
		</div>
	);
}
