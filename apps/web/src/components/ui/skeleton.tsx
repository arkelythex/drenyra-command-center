"use client";

import { cn } from "@/lib/utils";

export { Skeleton, type SkeletonProps } from "@drenyra/ui";

// Local-only higher-level skeleton variants that compose the shared Skeleton
import { Skeleton as SkeletonBase } from "@drenyra/ui";

export function DashboardCardSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl",
				className,
			)}
		>
			<div className="flex items-center gap-4 mb-6">
				<SkeletonBase className="h-12 w-12 rounded-lg" />
				<div className="space-y-2 flex-1">
					<SkeletonBase className="h-4 w-32" />
					<SkeletonBase className="h-3 w-24" />
				</div>
			</div>
			<div className="space-y-3">
				<SkeletonBase className="h-8 w-20 rounded-md" />
				<SkeletonBase className="h-4 w-full" />
				<SkeletonBase className="h-4 w-4/5" />
			</div>
		</div>
	);
}

export function ChartSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl h-[400px]",
				className,
			)}
		>
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<SkeletonBase className="h-10 w-10 rounded-lg" />
					<div className="space-y-2">
						<SkeletonBase className="h-4 w-32" />
						<SkeletonBase className="h-3 w-24" />
					</div>
				</div>
				<SkeletonBase className="h-8 w-24 rounded-full" />
			</div>
			<div className="flex items-end gap-3 h-[200px]">
				<SkeletonBase className="h-full flex-1 rounded-t-md opacity-30" />
				<SkeletonBase className="h-[70%] flex-1 rounded-t-md opacity-40" />
				<SkeletonBase className="h-[90%] flex-1 rounded-t-md opacity-30" />
				<SkeletonBase className="h-[50%] flex-1 rounded-t-md opacity-50" />
				<SkeletonBase className="h-[80%] flex-1 rounded-t-md opacity-30" />
				<SkeletonBase className="h-[60%] flex-1 rounded-t-md opacity-40" />
			</div>
		</div>
	);
}
