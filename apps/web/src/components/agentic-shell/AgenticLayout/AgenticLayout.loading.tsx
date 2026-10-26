export function AgenticLayoutLoading() {
	return (
		<div className="flex h-screen bg-card">
			{/* Sidebar skeleton */}
			<aside className="w-[260px] animate-pulse border-r border-border-subtle bg-muted p-4">
				<div className="mb-6 h-8 w-24 rounded bg-strong" />
				<div className="space-y-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="h-5 w-full rounded bg-strong"
							style={{ opacity: 1 - i * 0.12 }}
						/>
					))}
				</div>
			</aside>

			{/* Main content skeleton */}
			<main className="flex flex-1 flex-col">
				<div className="h-14 animate-pulse border-b border-border-subtle bg-muted" />
				<div className="flex-1 p-6">
					<div className="h-8 w-48 animate-pulse rounded bg-strong" />
					<div className="mt-4 space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={`content-${i}`}
								className="h-4 w-full animate-pulse rounded bg-muted"
							/>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
