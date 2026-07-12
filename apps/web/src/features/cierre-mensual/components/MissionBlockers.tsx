import type { FC } from "react";

interface MissionBlocker {
	id: string;
	title: string;
	description: string;
	resolved: boolean;
	category: string;
}

interface MissionBlockersProps {
	blockers: MissionBlocker[];
}

export const MissionBlockers: FC<MissionBlockersProps> = ({ blockers }) => {
	const unresolved = blockers.filter((b) => !b.resolved);
	const resolved = blockers.filter((b) => b.resolved);

	if (blockers.length === 0) return null;

	return (
		<section>
			<h2 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
				Bloqueos ({unresolved.length} sin resolver)
			</h2>
			<div className="space-y-2">
				{unresolved.map((blocker) => (
					<div
						key={blocker.id}
						className="rounded-lg border border-[var(--border-danger)] bg-[var(--danger-bg)] p-3 text-sm"
					>
						<div className="font-medium text-[var(--text-danger)]">
							{blocker.title}
						</div>
						<div className="mt-1 text-xs text-[var(--text-tertiary)]">
							{blocker.description}
						</div>
					</div>
				))}
				{resolved.length > 0 && (
					<details className="mt-2">
						<summary className="cursor-pointer text-xs text-[var(--text-tertiary)]">
							{resolved.length} resueltos
						</summary>
						<div className="mt-2 space-y-1">
							{resolved.map((blocker) => (
								<div
									key={blocker.id}
									className="rounded p-2 text-xs text-[var(--text-tertiary)] line-through"
								>
									{blocker.title}
								</div>
							))}
						</div>
					</details>
				)}
			</div>
		</section>
	);
};
