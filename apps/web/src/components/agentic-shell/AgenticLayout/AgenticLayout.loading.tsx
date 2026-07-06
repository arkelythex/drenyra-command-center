export function AgenticLayoutLoading() {
	return (
		<div className="flex h-screen bg-[var(--surface-1)]">
			{/* Sidebar skeleton */}
			<aside className="w-[260px] animate-pulse border-r border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
				<div className="mb-6 h-8 w-24 rounded bg-[var(--surface-3)]" />
				<div className="space-y-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="h-5 w-full rounded bg-[var(--surface-3)]"
							style={{ opacity: 1 - i * 0.12 }}
						/>
					))}
				</div>
			</aside>

			{/* Main content skeleton */}
			<main className="flex flex-1 flex-col">
				<div className="h-14 animate-pulse border-b border-[var(--border-subtle)] bg-[var(--surface-2)]" />
				<div className="flex-1 p-6">
					<div className="h-8 w-48 animate-pulse rounded bg-[var(--surface-3)]" />
					<div className="mt-4 space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={`content-${i}`}
								className="h-4 w-full animate-pulse rounded bg-[var(--surface-2)]"
							/>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
