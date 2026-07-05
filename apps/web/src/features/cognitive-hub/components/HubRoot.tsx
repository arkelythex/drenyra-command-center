import { lazy, Suspense } from "react";

const HubLayout = lazy(() =>
	import("./HubLayout").then((m) => ({ default: m.HubLayout })),
);

const HubChatSkeleton = () => (
	<div className="space-y-6 p-8">
		<div className="h-16 rounded-xl bg-[var(--surface-hover)]" />
		<div className="h-24 rounded-xl bg-[var(--surface-hover)]" />
		<div className="h-20 rounded-xl bg-[var(--surface-hover)]" />
	</div>
);

/**
 * HubRoot: Página completa del Cognitive Hub (sin modal overlay).
 * Se renderiza directamente en la ruta /drenyra/hub.
 */
export const HubRoot = () => {
	return (
		<div className="flex h-full w-full overflow-hidden bg-[var(--surface-1)] text-[var(--text-primary)]">
			<Suspense fallback={<HubChatSkeleton />}>
				<HubLayout />
			</Suspense>
		</div>
	);
};
