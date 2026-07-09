/**
 * BatchDetail — detail panel for a single batch run with items table.
 *
 * Features:
 * - Back navigation
 * - Header with batch ID, status badge, progress bar
 * - Stats row: completed/total, failed count, duration
 * - Items table with individual status, run links, errors
 */

"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BatchItemStatus, BatchRunDetail } from "../types";

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEM_STATUS_BADGE: Record<
	BatchItemStatus,
	{ color: string; label: string }
> = {
	pending: {
		color:
			"bg-[var(--surface-3)]/50 text-[var(--text-tertiary)] border-[var(--border-subtle)]",
		label: "Pending",
	},
	running: {
		color:
			"bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
		label: "Running",
	},
	completed: {
		color:
			"bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
		label: "Completed",
	},
	failed: {
		color:
			"bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
		label: "Failed",
	},
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string | null): string {
	if (!date) return "-";
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function truncateId(id: string, len = 12): string {
	if (id.length <= len) return id;
	return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function ItemStatusBadge({ status }: { status: BatchItemStatus }) {
	const style = ITEM_STATUS_BADGE[status] ?? ITEM_STATUS_BADGE.pending;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
				style.color,
			)}
		>
			{style.label}
		</span>
	);
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BatchDetailProps {
	batch: BatchRunDetail;
	isLoading: boolean;
	onBack: () => void;
	onCancelBatch?: (batchId: string) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BatchDetail({
	batch,
	isLoading,
	onBack,
	onCancelBatch,
}: BatchDetailProps) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-20 w-full rounded-lg" />
				<Skeleton className="h-40 w-full rounded-lg" />
			</div>
		);
	}

	const progressPct =
		batch.total > 0 ? Math.round((batch.completed / batch.total) * 100) : 0;

	return (
		<div className="space-y-4">
			{/* Back button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={onBack}
				className="gap-1.5 text-xs text-[var(--text-secondary)]"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Back to Batches
			</Button>

			{/* Header card */}
			<Card variant="glass" padding="lg">
				<CardContent className="space-y-4 p-0">
					{/* Batch ID + Status */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="font-mono text-sm text-[var(--text-primary)]">
								{truncateId(batch.id, 20)}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<ItemStatusBadge
								status={batch.status as unknown as BatchItemStatus}
							/>
							{(batch.status === "running" || batch.status === "pending") &&
								onCancelBatch && (
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5 border-[var(--color-danger)]/30 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
										onClick={() => onCancelBatch(batch.id)}
									>
										<XCircle className="h-3.5 w-3.5" />
										Cancel Batch
									</Button>
								)}
						</div>
					</div>

					{/* Progress bar */}
					<div>
						<div className="mb-1.5 flex items-center justify-between text-2xs text-[var(--text-tertiary)]">
							<span>Progress</span>
							<span className="font-mono tabular-nums">{progressPct}%</span>
						</div>
						<div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
							<motion.div
								className={cn(
									"h-full rounded-full",
									batch.status === "completed" && "bg-[var(--color-success)]",
									batch.status === "failed" && "bg-[var(--color-danger)]",
									batch.status === "partial" && "bg-[var(--color-warning)]",
									(batch.status === "running" || batch.status === "pending") &&
										"bg-[var(--color-info)]",
								)}
								initial={{ width: 0 }}
								animate={{ width: `${progressPct}%` }}
								transition={{ duration: 0.5, ease: "easeOut" }}
							/>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 gap-4 pt-2">
						<div className="flex flex-col items-center rounded-lg bg-[var(--surface-2)]/50 p-3">
							<span className="font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
								{batch.completed}/{batch.total}
							</span>
							<span className="text-2xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
								Completed
							</span>
						</div>
						<div className="flex flex-col items-center rounded-lg bg-[var(--surface-2)]/50 p-3">
							<span className="font-mono tabular-nums text-lg font-bold text-[var(--color-danger)]">
								{batch.failed}
							</span>
							<span className="text-2xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
								Failed
							</span>
						</div>
						<div className="flex flex-col items-center rounded-lg bg-[var(--surface-2)]/50 p-3">
							<span className="font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
								{timeAgo(batch.createdAt)}
							</span>
							<span className="text-2xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
								Created
							</span>
						</div>
					</div>

					{/* Error message */}
					{batch.error && (
						<div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3">
							<p className="text-xs font-medium text-[var(--color-danger)]">
								{batch.error}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Items table */}
			<Card variant="glass" padding="none">
				<CardHeader className="px-4 pt-4 pb-2">
					<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
						Batch Items ({batch.items.length})
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{batch.items.length === 0 ? (
						<div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
							<Clock className="h-6 w-6 text-[var(--text-tertiary)]" />
							<p className="text-xs text-[var(--text-secondary)]">
								No items recorded yet.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-[var(--border-subtle)]">
										<th className="px-4 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
											#
										</th>
										<th className="px-4 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
											Status
										</th>
										<th className="px-4 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
											Run ID
										</th>
										<th className="px-4 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
											Error
										</th>
										<th className="px-4 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
											Created
										</th>
									</tr>
								</thead>
								<tbody>
									{batch.items.map((item, idx) => (
										<tr
											key={item.id}
											className={cn(
												"border-b border-[var(--border-subtle)] transition-colors",
												"hover:bg-[var(--surface-2)]/30",
											)}
										>
											<td className="px-4 py-2.5">
												<span className="text-xs text-[var(--text-tertiary)]">
													{idx + 1}
												</span>
											</td>
											<td className="px-4 py-2.5">
												<ItemStatusBadge status={item.status} />
											</td>
											<td className="px-4 py-2.5">
												{item.runId ? (
													<span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--color-primary)]">
														{truncateId(item.runId)}
														<ExternalLink className="h-3 w-3" />
													</span>
												) : (
													<span className="text-2xs text-[var(--text-tertiary)]">
														—
													</span>
												)}
											</td>
											<td className="max-w-[200px] truncate px-4 py-2.5">
												{item.error ? (
													<span className="text-xs text-[var(--color-danger)]">
														{item.error}
													</span>
												) : (
													<span className="text-2xs text-[var(--text-tertiary)]">
														—
													</span>
												)}
											</td>
											<td className="px-4 py-2.5">
												<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
													{timeAgo(item.createdAt)}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
