/**
 * ObservabilityDashboard — AI Control Plane agent run observability panel.
 *
 * Sections:
 *  A. Status Overview Cards (6 cards + framer-motion stagger)
 *  B. Status Donut Chart (inline SVG)
 *  C. Recent Runs Table (with expandable rows)
 *  D. Run Events Panel (inline per row)
 */

"use client";

import { Activity, Brain, Gauge, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	useBatchDetail,
	useBatches,
	useCancelBatch,
	useRunSummary,
	useRuns,
	useSubmitBatch,
} from "../../hooks/useObservability";
import type { BatchRun, BatchRunDetail } from "../../types";
import { AgentMemoryTab } from "../AgentMemoryTab";
import { BatchDetail as BatchDetailView } from "../BatchDetail";
import { BatchTable } from "../BatchTable";
import { LatencyDashboard } from "../LatencyDashboard";
import { SubmitBatchDialog } from "../SubmitBatchDialog";
import { DonutChart } from "./DonutChart";
import { RunRow } from "./RunRow";
import { RunsTableSkeleton } from "./RunsTableSkeleton";
import {
	StatusCard,
	SummaryCardSkeleton,
	summaryCardItems,
} from "./StatusCards";

// ─── Main Component ──────────────────────────────────────────────────────────

export function ObservabilityDashboard() {
	const {
		data: summary,
		isLoading: summaryLoading,
		isError: summaryError,
	} = useRunSummary();
	const {
		data: runs,
		isLoading: runsLoading,
		isError: runsError,
		refetch: refetchRuns,
	} = useRuns(25);
	const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

	const toggleRun = useCallback((runId: string) => {
		setExpandedRunId((prev) => (prev === runId ? null : runId));
	}, []);

	const cardItems = useMemo(() => summaryCardItems(summary), [summary]);

	const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
	const [submitOpen, setSubmitOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"runs" | "batches" | "latencia" | "memoria"
	>("runs");
	const { data: batches, isLoading: batchesLoading } = useBatches();
	const { data: batchDetail, isLoading: batchDetailLoading } =
		useBatchDetail(selectedBatchId);
	const submitBatch = useSubmitBatch();
	const cancelBatchMutation = useCancelBatch();

	const handleCancelBatch = useCallback(
		(batchId: string) => {
			if (
				confirm(
					"Are you sure you want to cancel this batch? Running items will be interrupted.",
				)
			) {
				cancelBatchMutation.mutate({ batchId });
			}
		},
		[cancelBatchMutation],
	);

	return (
		<PageShell variant="board">
			<PageHeader
				title="AI Observability"
				description="Live monitoring of AI Control Plane agent runs, workflow states, and execution events."
				icon={<Activity className="h-5 w-5" />}
				badge={
					<Badge variant="outline" size="xs">
						LIVE
					</Badge>
				}
				actions={
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetchRuns()}
						className="gap-1.5 text-2xs"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						Refresh
					</Button>
				}
			/>

			{/* Tab buttons */}
			<div className="mb-6 flex items-center gap-4">
				<button
					onClick={() => setActiveTab("runs")}
					className={cn(
						"rounded-lg px-4 py-2 text-sm font-medium transition-colors",
						activeTab === "runs"
							? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
							: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
					)}
				>
					Runs
				</button>
				<button
					onClick={() => setActiveTab("batches")}
					className={cn(
						"rounded-lg px-4 py-2 text-sm font-medium transition-colors",
						activeTab === "batches"
							? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
							: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
					)}
				>
					Batches
				</button>
				<button
					onClick={() => setActiveTab("latencia")}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
						activeTab === "latencia"
							? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
							: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
					)}
				>
					<Gauge className="h-4 w-4" />
					Latencia
				</button>
				<button
					onClick={() => setActiveTab("memoria")}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
						activeTab === "memoria"
							? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
							: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
					)}
				>
					<Brain className="h-4 w-4" />
					Memoria
				</button>
			</div>

			{activeTab === "batches" ? (
				selectedBatchId ? (
					<BatchDetailView
						batch={(batchDetail ?? {}) as BatchRunDetail}
						isLoading={batchDetailLoading}
						onBack={() => setSelectedBatchId(null)}
						onCancelBatch={handleCancelBatch}
					/>
				) : (
					<>
						<div className="mb-4">
							<Button onClick={() => setSubmitOpen(true)} variant="primary">
								Submit Batch
							</Button>
						</div>
						<BatchTable
							batches={(batches ?? []) as BatchRun[]}
							isLoading={batchesLoading}
							onBatchClick={(id) => setSelectedBatchId(id)}
							onSubmitBatch={() => setSubmitOpen(true)}
							onCancelBatch={handleCancelBatch}
						/>
					</>
				)
			) : activeTab === "latencia" ? (
				<LatencyDashboard />
			) : activeTab === "memoria" ? (
				<AgentMemoryTab />
			) : (
				<>
					{/* A. Status Overview Cards */}
					<section aria-label="Status Overview">
						{summaryLoading ? (
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
								{Array.from({ length: 6 }).map((_, i) => (
									<SummaryCardSkeleton key={i} />
								))}
							</div>
						) : summaryError || !summary ? (
							<div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-6 text-center">
								<p className="text-sm text-red-400">
									Failed to load observability summary. Ensure the API is
									reachable.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
								{cardItems.map((item, idx) => (
									<StatusCard key={item.label} {...item} index={idx} />
								))}
							</div>
						)}
					</section>

					{/* B. Status Donut Chart + Runs Table */}
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Donut Chart */}
						<section aria-label="Run Status Distribution">
							<Card variant="glass" padding="lg" className="h-full">
								<CardHeader className="mb-2">
									<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
										Run Distribution
									</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									{summaryLoading ? (
										<div className="flex items-center justify-center py-8">
											<Skeleton className="h-[180px] w-[180px] rounded-full" />
										</div>
									) : summaryError || !summary ? (
										<p className="py-6 text-center text-xs text-red-400">
											Unavailable
										</p>
									) : (
										<DonutChart summary={summary} />
									)}
								</CardContent>
							</Card>
						</section>

						{/* Recent Runs Table */}
						<section aria-label="Recent Runs" className="lg:col-span-2">
							<Card variant="glass" padding="none">
								<CardHeader className="px-4 pt-4 pb-2">
									<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
										Recent Runs
									</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									{runsLoading ? (
										<div className="p-4">
											<RunsTableSkeleton />
										</div>
									) : runsError ? (
										<div className="p-4 text-center text-xs text-red-400">
											Failed to load runs.
										</div>
									) : !runs || runs.length === 0 ? (
										<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
											<Activity className="h-8 w-8 text-[var(--text-tertiary)]" />
											<p className="text-sm text-[var(--text-secondary)]">
												No runs recorded yet.
											</p>
											<p className="text-2xs text-[var(--text-tertiary)]">
												Agent runs will appear here once the AI Control Plane
												starts processing.
											</p>
										</div>
									) : (
										<div className="overflow-x-auto">
											<table className="w-full">
												<thead>
													<tr className="border-b border-[var(--border-subtle)]">
														<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
															Run ID
														</th>
														<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
															Status
														</th>
														<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
															Workflow
														</th>
														<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
															Started
														</th>
														<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
															Error
														</th>
														<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
															Events
														</th>
														<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]" />
													</tr>
												</thead>
												<tbody>
													{runs.map((run) => (
														<RunRow
															key={run.runId}
															run={run}
															isExpanded={expandedRunId === run.runId}
															onToggle={() => toggleRun(run.runId)}
														/>
													))}
												</tbody>
											</table>
										</div>
									)}
								</CardContent>
							</Card>
						</section>
					</div>
				</>
			)}

			<SubmitBatchDialog
				open={submitOpen}
				onOpenChange={setSubmitOpen}
				companyId="00000000-0000-0000-0000-000000000000"
			/>
		</PageShell>
	);
}
