import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import type { ThreadSummary } from "../threads.api";
import { ThreadCard } from "./ThreadCard";

interface ThreadListProps {
	threads: ThreadSummary[];
	emptyMessage?: string;
	showCreateButton?: boolean;
}

export function ThreadList({
	threads,
	emptyMessage = "No hay threads activos",
	showCreateButton = true,
}: ThreadListProps) {
	const navigate = useNavigate();

	const grouped = useMemo(() => {
		const now = new Date();
		const today = now.toDateString();
		const weekAgo = new Date(now);
		weekAgo.setDate(weekAgo.getDate() - 7);

		const groups: { label: string; items: ThreadSummary[] }[] = [
			{ label: "Hoy", items: [] },
			{ label: "Esta semana", items: [] },
			{ label: "Este mes", items: [] },
			{ label: "Anteriores", items: [] },
		];

		for (const t of threads) {
			const d = new Date(t.lastActivityAt);
			const dayDiff = Math.floor(
				(now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (d.toDateString() === today) {
				groups[0].items.push(t);
			} else if (dayDiff <= 7) {
				groups[1].items.push(t);
			} else if (dayDiff <= 30) {
				groups[2].items.push(t);
			} else {
				groups[3].items.push(t);
			}
		}

		return groups.filter((g) => g.items.length > 0);
	}, [threads]);

	if (threads.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 px-4 py-8">
				<p className="text-xs text-[var(--text-muted)]">{emptyMessage}</p>
				{showCreateButton && (
					<button
						type="button"
						onClick={() => navigate({ to: "/drenyra" })}
						className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white"
					>
						<Plus size={14} />
						New Thread
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4 px-3 py-3">
			{grouped.map((group) => (
				<div key={group.label}>
					<p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						{group.label}
					</p>
					<div className="space-y-0.5">
						{group.items.map((thread) => (
							<ThreadCard
								key={thread.id}
								thread={thread}
								onClick={() =>
									navigate({
										to: "/drenyra/case/$threadId",
										params: { threadId: thread.id },
									})
								}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
