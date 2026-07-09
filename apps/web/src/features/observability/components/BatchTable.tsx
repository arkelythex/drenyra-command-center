/**
 * BatchTable — list of batch runs with progress, status, and actions.
 *
 * Features:
 * - Table with truncated ID, colored status badge, visual progress bar
 * - Skeleton loading state
 * - Empty state with submit prompt
 * - "New Batch" action button
 */

"use client";

import { motion } from "framer-motion";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronRight,
	Clock,
	Layers,
	Plus,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BatchRun, BatchStatus } from "../types";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE_COLORS: Record<BatchStatus, string> = {
	pending:
		"bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
	running:
		"bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
	completed:
		"bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
	failed:
		"bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
	partial:
		"bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25",
};

const STATUS_BADGE_LABEL: Record<BatchStatus, string> = {
	pending: "Pending",
	running: "Running",
	completed: "Completed",
	failed: "Failed",
	partial: "Partial",
};

const PROGRESS_BAR_COLORS: Record<BatchStatus, string> = {
	pending: "bg-[var(--color-info)]",
	running: "bg-[var(--color-info)]",
	completed: "bg-[var(--color-success)]",
	failed: "bg-[var(--color-danger)]",
	partial: "bg-[var(--color-warning)]",
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

function StatusBadge({ status }: { status: BatchStatus }) {
	const colorClass = STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS.pending;
	const label = STATUS_BADGE_LABEL[status] ?? status;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider",
				colorClass,
			)}
		>
			{STATUS_ICONS[status]}
			<span className="ml-1">{label}</span>
		</span>
	);
}

const STATUS_ICONS: Record<BatchStatus, React.ReactNode> = {
	pending: <Clock className="h-3 w-3" />,
	running: <Clock className="h-3 w-3" />,
	completed: <CheckCircle2 className="h-3 w-3" />,
	failed: <XCircle className="h-3 w-3" />,
	partial: <AlertTriangle className="h-3 w-3" />,
};

function ProgressBar({
	completed,
	total,
	status,
}: {
	completed: number;
	total: number;
	status: BatchStatus;
}) {
	const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
	const barColor = PROGRESS_BAR_COLORS[status] ?? "bg-[var(--color-info)]";

	return (
		<div className="flex items-center gap-2">
			<div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-[var(--surface-3)]">
				<motion.div
					className={cn("h-full rounded-full", barColor)}
					initial={{ width: 0 }}
					animate={{ width: `${pct}%` }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				/>
			</div>
			<span className="font-mono tabular-nums text-2xs text-[var(--text-tertiary)]">
				{pct}%
			</span>
		</div>
	);
}

// ─── Batch Table Skeleton ────────────────────────────────────────────────────

function BatchTableSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} className="h-12 w-full rounded-lg" />
			))}
		</div>
	);
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BatchTableProps {
	batches: BatchRun[];
	isLoading: boolean;
	onBatchClick: (batchId: string) => void;
	onSubmitBatch: () => void;
	onCancelBatch?: (batchId: string) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BatchTable({
	batches,
	isLoading,
	onBatchClick,
	onSubmitBatch,
	onCancelBatch,
}: BatchTableProps) {
	// Loading state
	if (isLoading) {
		return <BatchTableSkeleton />;
	}

	// Empty state
	if (!batches || batches.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
				<Layers className="h-10 w-10 text-[var(--text-tertiary)]" />
				<p className="text-sm font-medium text-[var(--text-secondary)]">
					No batches yet
				</p>
				<p className="max-w-xs text-2xs text-[var(--text-tertiary)]">
					Submit a batch of invoices for AI processing. Batches allow you to
					process multiple invoices with controlled concurrency.
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={onSubmitBatch}
					className="mt-2 gap-1.5"
				>
					<Plus className="h-3.5 w-3.5" />
					New Batch
				</Button>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-[var(--border-subtle)]">
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Batch ID
						</th>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Status
						</th>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Progress
						</th>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Items
						</th>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Created
						</th>
						<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Actions
						</th>
						<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"></th>
					</tr>
				</thead>
				<tbody>
					{batches.map((batch) => (
						<motion.tr
							key={batch.id}
							layout
							className={cn(
								"cursor-pointer border-b border-[var(--border-subtle)] transition-colors",
								"hover:bg-[var(--surface-2)]/50",
							)}
							onClick={() => onBatchClick(batch.id)}
						>
							<td className="px-4 py-3">
								<span className="font-mono text-xs text-[var(--text-primary)]">
									{truncateId(batch.id)}
								</span>
							</td>
							<td className="px-4 py-3">
								<StatusBadge status={batch.status} />
							</td>
							<td className="px-4 py-3">
								<ProgressBar
									completed={batch.completed}
									total={batch.total}
									status={batch.status}
								/>
							</td>
							<td className="px-4 py-3">
								<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
									{batch.completed}/{batch.total}
								</span>
								{batch.failed > 0 && (
									<span className="ml-1.5 text-2xs text-[var(--color-danger)]">
										({batch.failed} failed)
									</span>
								)}
							</td>
							<td className="px-4 py-3">
								<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
									{timeAgo(batch.createdAt)}
								</span>
							</td>
							<td className="px-4 py-3 text-right">
								{(batch.status === "running" || batch.status === "pending") &&
									onCancelBatch && (
										<Button
											variant="ghost"
											size="sm"
											className="h-7 gap-1 text-2xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
											onClick={(e) => {
												e.stopPropagation();
												onCancelBatch(batch.id);
											}}
										>
											<XCircle className="h-3 w-3" />
											Cancel
										</Button>
									)}
							</td>
							<td className="px-4 py-3 text-right">
								<ChevronRight className="inline h-4 w-4 text-[var(--text-tertiary)]" />
							</td>
						</motion.tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
