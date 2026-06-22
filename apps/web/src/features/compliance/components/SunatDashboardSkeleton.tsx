/**
 * SunatDashboardSkeleton — loading placeholder for SUNAT Compliance Command Center
 */

import { Skeleton } from "@/components/ui/skeleton";

export function SunatDashboardSkeleton() {
	return (
		<div className="mx-auto flex h-full max-w-7xl flex-col gap-8 px-6 py-8">
			{/* Header skeleton */}
			<div className="flex items-center gap-5">
				<Skeleton className="h-14 w-14 rounded-2xl" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-52" />
					<Skeleton className="h-4 w-36" />
				</div>
			</div>

			{/* RUC card skeleton */}
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-8 w-8 rounded-lg" />
					<Skeleton className="h-3 w-28" />
				</div>
				<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-6">
					<div className="flex items-center justify-between">
						<div className="space-y-3">
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-7 w-44" />
							<Skeleton className="h-4 w-32" />
						</div>
						<Skeleton className="h-16 w-40 rounded-lg" />
					</div>
				</div>
			</div>

			{/* SIRE grid skeleton */}
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-8 w-8 rounded-lg" />
					<Skeleton className="h-3 w-36" />
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-5"
						>
							<div className="mb-3 flex items-center justify-between">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-4 rounded-full" />
							</div>
							<Skeleton className="h-5 w-24 rounded-full" />
							<Skeleton className="mt-3 h-3 w-20" />
						</div>
					))}
				</div>
			</div>

			{/* Calendar + Notifications skeleton */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-4 lg:col-span-2">
					<div className="flex items-center gap-3">
						<Skeleton className="h-8 w-8 rounded-lg" />
						<Skeleton className="h-3 w-32" />
					</div>
					<div className="rounded-xl border border-[var(--border-subtle)]">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-5 py-4"
							>
								<Skeleton className="h-4 w-16" />
								<div className="flex-1 space-y-1">
									<Skeleton className="h-4 w-36" />
									<Skeleton className="h-3 w-24" />
								</div>
								<Skeleton className="h-4 w-16 rounded-full" />
							</div>
						))}
					</div>
				</div>
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<Skeleton className="h-8 w-8 rounded-lg" />
						<Skeleton className="h-3 w-24" />
					</div>
					<div className="rounded-xl border border-[var(--border-subtle)]">
						{Array.from({ length: 2 }).map((_, i) => (
							<div
								key={i}
								className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-5 py-4"
							>
								<Skeleton className="h-8 w-8 rounded-lg" />
								<div className="flex-1 space-y-1">
									<Skeleton className="h-4 w-40" />
									<Skeleton className="h-3 w-20" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
