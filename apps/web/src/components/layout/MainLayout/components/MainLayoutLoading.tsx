/**
 * Loading fallback for the notification sidebar (lazy-loaded).
 */
export function NotificationSidebarLoadingFallback() {
	return (
		<div
			className="fixed inset-y-0 right-0 z-[120] w-full border-l border-[var(--border-default)] bg-[var(--surface-1)] p-6 shadow-2xl sm:w-[420px]"
			role="status"
			aria-live="polite"
		>
			<div className="mb-6 h-5 w-32 animate-pulse rounded bg-[var(--surface-3)]" />
			<div className="space-y-4">
				<div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
				<div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
			</div>
			<span className="sr-only">Cargando actividad y notificaciones</span>
		</div>
	);
}

/**
 * Loading fallback for the artifact registry (lazy-loaded).
 */
export function ArtifactRegistryLoadingFallback() {
	return (
		<div
			className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4"
			role="status"
			aria-live="polite"
		>
			<div className="mb-3 h-4 w-40 animate-pulse rounded bg-[var(--surface-3)]" />
			<div className="space-y-2">
				<div className="h-3 w-full animate-pulse rounded bg-[var(--surface-3)]" />
				<div className="h-3 w-2/3 animate-pulse rounded bg-[var(--surface-3)]" />
			</div>
			<span className="sr-only">Cargando evidencia del artefacto</span>
		</div>
	);
}
