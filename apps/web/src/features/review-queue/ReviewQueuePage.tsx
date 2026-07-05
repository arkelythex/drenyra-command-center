import { useQuery } from "@tanstack/react-query";
import { getQueueStats, listQueue } from "./review-queue.api";
import type { ReviewQueueItemDTO } from "./review-queue.types";

const PRIORITY_ORDER: Record<string, number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
};
const PRIORITY_LABELS: Record<string, string> = {
	critical: "CRÍTICA",
	high: "ALTA",
	medium: "MEDIA",
	low: "BAJA",
};

function ReviewQueueItem({ item }: { item: ReviewQueueItemDTO }) {
	return (
		<div className="flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--color-primary)]/30">
			<div className="flex-1 min-w-0">
				<div className="mb-1 flex items-center gap-2">
					<span className="text-sm font-medium text-[var(--text-primary)] truncate">
						{item.title}
					</span>
					{item.riskScore > 70 && (
						<span className="shrink-0 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-danger)]">
							{item.riskScore}% riesgo
						</span>
					)}
				</div>
				<p className="text-xs text-[var(--text-secondary)]">
					{item.clientName} · {item.period} · {item.agentName ?? "—"}
				</p>
			</div>
			<a
				href={`/diffs/?id=${item.diffId}`}
				className="shrink-0 rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
			>
				Revisar
			</a>
		</div>
	);
}

export function ReviewQueuePage() {
	const { data: queueData, isLoading: queueLoading } = useQuery({
		queryKey: ["review-queue"],
		queryFn: () => listQueue(),
		refetchInterval: 10_000,
	});

	const { data: stats } = useQuery({
		queryKey: ["review-queue", "stats"],
		queryFn: () => getQueueStats(),
		refetchInterval: 10_000,
	});

	const items = queueData?.data ?? [];
	const grouped: Record<string, ReviewQueueItemDTO[]> = {};
	for (const item of items) {
		const key = item.priority;
		if (!grouped[key]) grouped[key] = [];
		grouped[key].push(item);
	}
	const sortedGroups = Object.entries(grouped).sort(
		([a], [b]) => (PRIORITY_ORDER[a] ?? 99) - (PRIORITY_ORDER[b] ?? 99),
	);

	return (
		<div className="flex h-full flex-col overflow-auto p-4 sm:p-6 lg:p-8">
			{/* Header + Stats */}
			<div className="mb-6">
				<h1 className="text-xl font-bold text-[var(--text-primary)]">
					Cola de Revisión
				</h1>
				{stats && (
					<div className="mt-3 flex gap-3 text-xs">
						<span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[var(--text-secondary)]">
							Pendientes: {stats.pending}
						</span>
						{stats.critical > 0 && (
							<span className="rounded-lg bg-[var(--color-danger)]/10 px-2.5 py-1 text-[var(--color-danger)]">
								Críticas: {stats.critical}
							</span>
						)}
						<span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[var(--text-secondary)]">
							Altas: {stats.high}
						</span>
						<span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[var(--text-secondary)]">
							Medias: {stats.medium}
						</span>
					</div>
				)}
			</div>

			{/* Queue */}
			{queueLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-sm text-[var(--text-tertiary)]">
					<p>No hay items pendientes de revisión</p>
				</div>
			) : (
				<div className="space-y-6">
					{sortedGroups.map(([priority, groupItems]) => (
						<div key={priority}>
							<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
								{PRIORITY_LABELS[priority] ?? priority} · {groupItems.length}
							</h2>
							<div className="space-y-2">
								{groupItems.map((item) => (
									<ReviewQueueItem key={item.id} item={item} />
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
