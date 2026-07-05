import { Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRunEvents } from "../../hooks/useObservability";
import { timeAgo } from "./constants";

export function RunEventsPanel({ runId }: { runId: string }) {
	const { data: events, isLoading, isError } = useRunEvents(runId);

	if (isLoading) {
		return (
			<div className="space-y-2 p-4">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-4 text-xs text-red-400">
				Failed to load events for this run.
			</div>
		);
	}

	if (!events || events.length === 0) {
		return (
			<div className="p-4 text-xs text-[var(--text-tertiary)]">
				No events recorded for this run.
			</div>
		);
	}

	return (
		<div className="border-t border-[var(--border-subtle)] p-4">
			<div className="mb-2 flex items-center gap-2">
				<Terminal className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
				<span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
					Event Feed ({events.length})
				</span>
			</div>
			<div className="max-h-[320px] overflow-y-auto space-y-1">
				{events.map((event, idx) => (
					<div
						key={event.id}
						className={cn(
							"flex items-start gap-3 rounded-lg px-3 py-2 text-xs",
							idx % 2 === 0 ? "bg-[var(--surface-1)]/40" : "bg-transparent",
						)}
					>
						<span className="font-mono tabular-nums shrink-0 text-2xs text-[var(--text-tertiary)]">
							{timeAgo(event.createdAt)}
						</span>
						<span className="inline-flex shrink-0 items-center rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-2xs text-[var(--text-secondary)]">
							{event.eventType}
						</span>
						<span className="truncate text-[var(--text-secondary)]">
							{event.payload
								? JSON.stringify(event.payload).slice(0, 120)
								: "—"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
