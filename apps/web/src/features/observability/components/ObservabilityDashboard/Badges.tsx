import { cn } from "@/lib/utils";
import type { RunStatus } from "../../types";
import { STATUS_BADGE_COLORS, STATUS_BADGE_LABEL } from "./constants";

export function StatusBadge({ status }: { status: RunStatus }) {
	const colorClass =
		STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS.degraded;
	const label = STATUS_BADGE_LABEL[status] ?? status;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider",
				colorClass,
			)}
		>
			{label}
		</span>
	);
}

export function WorkflowBadge({ state }: { state: string | null | undefined }) {
	if (!state)
		return <span className="text-2xs text-[var(--text-tertiary)]">—</span>;
	return (
		<span className="inline-flex items-center rounded-md bg-[var(--surface-3)] px-2 py-0.5 text-2xs font-mono text-[var(--text-secondary)]">
			{state}
		</span>
	);
}
