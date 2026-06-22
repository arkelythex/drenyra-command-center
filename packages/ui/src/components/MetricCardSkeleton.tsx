import { cn } from "../lib/utils";

export interface MetricCardSkeletonProps {
	className?: string;
}

export function MetricCardSkeleton({ className }: MetricCardSkeletonProps) {
	return (
		<div
			className={cn(
				"rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-[var(--n-pad-lg)] animate-pulse",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<div className="h-10 w-10 rounded-lg bg-[var(--color-surface-3)]" />
			</div>
			<div className="mt-[var(--n-gap-sm)] space-y-2">
				<div className="h-8 w-24 rounded bg-[var(--color-surface-3)]" />
				<div className="h-3 w-16 rounded bg-[var(--color-surface-3)]" />
			</div>
		</div>
	);
}
