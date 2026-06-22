import type { ControlPlaneRunSnapshot } from "../../../hooks/cognitive-stream-types";

interface TimelineControlPlaneProps {
	controlPlane: ControlPlaneRunSnapshot;
}

export function TimelineControlPlane({ controlPlane }: TimelineControlPlaneProps) {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-black/5 p-3 text-label text-muted-foreground dark:bg-white/5">
			<div className="flex flex-wrap gap-2">
				<span className="rounded-full border border-border/50 px-2 py-1">
					{controlPlane.surface?.title ?? controlPlane.surfaceId}
				</span>
				<span className="rounded-full border border-border/50 px-2 py-1">
					{controlPlane.approvalState}
				</span>
				<span className="rounded-full border border-border/50 px-2 py-1">
					{controlPlane.retrievalMode ?? "memory-and-tools"}
				</span>
			</div>
			<p className="mt-2">
				Eval: {controlPlane.evaluationSummary?.state ?? "pending"} · fuentes
				documentales {controlPlane.documentarySources.length}
			</p>
			{controlPlane.trace.length > 0 ? (
				<div className="mt-2 space-y-1">
					{controlPlane.trace.slice(-3).map((traceEntry) => (
						<div
							key={`${traceEntry.traceId}-${traceEntry.eventType}-${traceEntry.occurredAt}`}
							className="rounded-lg border border-border/40 px-2 py-1.5"
						>
							<p className="font-medium text-foreground">
								{traceEntry.summary}
							</p>
							<p className="text-2xs opacity-80">
								{traceEntry.eventType} ·{" "}
								{new Date(traceEntry.occurredAt).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					))}
				</div>
			) : (
				<p className="mt-2">
					La traza todavía no está disponible; se mantiene la visibilidad mínima
					con el snapshot persistido.
				</p>
			)}
		</div>
	);
}
