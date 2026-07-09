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

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Gauge,
	RefreshCw,
	RotateCcw,
	Terminal,
	XCircle,
} from "lucide-react";
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
	useRunEvents,
	useRunSummary,
	useRuns,
	useSubmitBatch,
} from "../hooks/useObservability";
import type {
	AgentRunState,
	BatchRun,
	BatchRunDetail,
	RunStatus,
	RunSummary,
} from "../types";
import { BatchDetail as BatchDetailView } from "./BatchDetail";
import { BatchTable } from "./BatchTable";
import { LatencyDashboard } from "./LatencyDashboard";
import { SubmitBatchDialog } from "./SubmitBatchDialog";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE_COLORS: Record<RunStatus, string> = {
	running:
		"bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
	completed:
		"bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
	failed:
		"bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
	manual_review:
		"bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25",
	degraded:
		"bg-[var(--surface-3)]/50 text-[var(--text-tertiary)] border-[var(--border-subtle)]",
};

const STATUS_BADGE_LABEL: Record<RunStatus, string> = {
	running: "Running",
	completed: "Completed",
	failed: "Failed",
	manual_review: "Review",
	degraded: "Degraded",
};

const DONUT_COLORS: Record<string, string> = {
	running: "var(--info, #3b82f6)",
	completed: "var(--success, #22c55e)",
	failed: "var(--danger, #ef4444)",
	manual_review: "var(--warning, #f59e0b)",
};

const DONUT_SEGMENT_ORDER: Array<{
	key: keyof RunSummary;
	label: string;
	color: string;
}> = [
	{ key: "completed", label: "Completed", color: DONUT_COLORS.completed },
	{ key: "running", label: "Running", color: DONUT_COLORS.running },
	{ key: "failed", label: "Failed", color: DONUT_COLORS.failed },
	{
		key: "manualReview",
		label: "Manual Review",
		color: DONUT_COLORS.manual_review,
	},
];

const DONUT_SIZE = 180;
const DONUT_STROKE = 20;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

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

function summaryCardItems(summary: RunSummary | undefined) {
	if (!summary) return [];
	return [
		{
			label: "Total Runs",
			value: summary.total,
			color: "text-[var(--text-primary)]",
			icon: BarChart3,
		},
		{
			label: "Running",
			value: summary.running,
			color: "text-[var(--color-info)]",
			icon: Clock,
		},
		{
			label: "Completed",
			value: summary.completed,
			color: "text-[var(--color-success)]",
			icon: CheckCircle2,
		},
		{
			label: "Failed",
			value: summary.failed,
			color: "text-[var(--color-danger)]",
			icon: XCircle,
		},
		{
			label: "Manual Review",
			value: summary.manualReview,
			color: "text-[var(--color-warning)]",
			icon: AlertTriangle,
		},
		{
			label: "Degraded",
			value: summary.degraded,
			color: "text-[var(--text-tertiary)]",
			icon: Activity,
		},
	];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCardSkeleton() {
	return (
		<Card variant="glass" padding="md">
			<CardContent className="flex flex-col items-center gap-2 p-0">
				<Skeleton className="h-8 w-16 rounded-md" />
				<Skeleton className="h-4 w-24" />
			</CardContent>
		</Card>
	);
}

function StatusCard({
	label,
	value,
	color,
	icon: Icon,
	index,
}: {
	label: string;
	value: number;
	color: string;
	icon: React.FC<{ className?: string }>;
	index: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
		>
			<Card variant="glass" padding="md" animateOnHover>
				<CardContent className="flex flex-col items-center gap-2 p-0">
					<Icon className={cn("h-5 w-5", color)} />
					<span className="font-mono tabular-nums text-2xl font-bold text-[var(--text-primary)]">
						{value}
					</span>
					<span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
						{label}
					</span>
				</CardContent>
			</Card>
		</motion.div>
	);
}

function DonutChart({ summary }: { summary: RunSummary }) {
	const total = summary.total || 1;

	// Compute stroke-dashoffset for each segment via reduce
	const segments = DONUT_SEGMENT_ORDER.reduce<
		Array<
			(typeof DONUT_SEGMENT_ORDER)[number] & {
				value: number;
				fraction: number;
				length: number;
				offset: number;
			}
		>
	>((acc, seg) => {
		const raw = (summary[seg.key] as number) || 0;
		const fraction = raw / total;
		const length = fraction * DONUT_CIRCUMFERENCE;
		const prevOffset =
			acc.length > 0
				? acc[acc.length - 1].offset + acc[acc.length - 1].length
				: 0;
		acc.push({ ...seg, value: raw, fraction, length, offset: prevOffset });
		return acc;
	}, []);

	return (
		<div className="flex flex-col items-center gap-4">
			<svg
				width={DONUT_SIZE}
				height={DONUT_SIZE}
				viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
				className="rotate-[-90deg]"
			>
				{/* Background ring */}
				<circle
					cx={DONUT_SIZE / 2}
					cy={DONUT_SIZE / 2}
					r={DONUT_RADIUS}
					fill="none"
					stroke="var(--border-subtle)"
					strokeWidth={DONUT_STROKE}
				/>
				{/* Data segments */}
				{segments.map((seg) =>
					seg.fraction > 0 ? (
						<circle
							key={seg.key}
							cx={DONUT_SIZE / 2}
							cy={DONUT_SIZE / 2}
							r={DONUT_RADIUS}
							fill="none"
							stroke={seg.color}
							strokeWidth={DONUT_STROKE}
							strokeDasharray={`${seg.length} ${DONUT_CIRCUMFERENCE - seg.length}`}
							strokeDashoffset={-seg.offset}
							strokeLinecap="round"
							className="transition-all duration-500"
						/>
					) : null,
				)}
			</svg>

			{/* Center total */}
			<div className="relative mt-[-148px] mb-8 flex flex-col items-center justify-center">
				<span className="font-mono tabular-nums text-3xl font-bold text-[var(--text-primary)]">
					{summary.total}
				</span>
				<span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
					Total
				</span>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap justify-center gap-4">
				{segments.map((seg) => (
					<div key={seg.key} className="flex items-center gap-1.5 text-xs">
						<span
							className="inline-block h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: seg.color }}
						/>
						<span className="text-[var(--text-secondary)]">{seg.label}</span>
						<span className="font-mono tabular-nums text-[var(--text-primary)]">
							{seg.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: RunStatus }) {
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

function WorkflowBadge({ state }: { state: string | null | undefined }) {
	if (!state)
		return <span className="text-2xs text-[var(--text-tertiary)]">—</span>;
	return (
		<span className="inline-flex items-center rounded-md bg-[var(--surface-3)] px-2 py-0.5 text-2xs font-mono text-[var(--text-secondary)]">
			{state}
		</span>
	);
}

// ─── Recover Dialog ──────────────────────────────────────────────────────────

function RecoverDialog({
	runId,
	open,
	onOpenChange,
}: {
	runId: string;
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const [inputType, setInputType] = useState("image");
	const [inputData, setInputData] = useState("");
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [resultMsg, setResultMsg] = useState("");

	const handleRecover = useCallback(async () => {
		if (!inputData.trim()) return;
		setStatus("loading");
		try {
			const { api } = await import("@/lib/api");
			const { unwrap } = await import("@/lib/api-helpers");
			const body = { inputData: inputData.trim(), inputType };
			const _res = await unwrap(
				api.api.ai.swarm["cognitive-stream"].runs[":runId"].recover.post({
					params: { runId },
					body,
				}),
			);
			setStatus("success");
			setResultMsg("Recovery triggered successfully.");
		} catch (err) {
			setStatus("error");
			setResultMsg(err instanceof Error ? err.message : "Unknown error");
		}
	}, [runId, inputType, inputData]);

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				onOpenChange(v);
				if (!v) setTimeout(() => setStatus("idle"), 200);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Recover Run</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div>
						<Label className="text-xs text-[var(--text-secondary)]">
							Input Type
						</Label>
						<Select value={inputType} onValueChange={setInputType}>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="image">Image (base64)</SelectItem>
								<SelectItem value="pdf">PDF (base64)</SelectItem>
								<SelectItem value="xml">XML (text)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label className="text-xs text-[var(--text-secondary)]">
							Input Data
						</Label>
						<textarea
							className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
							rows={6}
							placeholder="Paste the original input data (base64 or text)..."
							value={inputData}
							onChange={(e) => setInputData(e.target.value)}
						/>
					</div>
					{status === "success" && (
						<p className="text-xs font-medium text-[var(--color-success)]">
							{resultMsg}
						</p>
					)}
					{status === "error" && (
						<p className="text-xs font-medium text-[var(--color-danger)]">
							{resultMsg}
						</p>
					)}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleRecover}
							disabled={status === "loading" || !inputData.trim()}
							className="gap-1.5"
						>
							{status === "loading" ? "Recovering…" : <>Recover</>}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function RunRow({
	run,
	isExpanded,
	onToggle,
}: {
	run: AgentRunState;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const [showRecover, setShowRecover] = useState(false);

	return (
		<>
			<motion.tr
				layout
				className={cn(
					"cursor-pointer border-b border-[var(--border-subtle)] transition-colors",
					"hover:bg-[var(--surface-2)]/50",
					isExpanded && "bg-[var(--surface-2)]/30",
				)}
				onClick={onToggle}
			>
				<td className="px-4 py-3">
					<span className="font-mono text-xs text-[var(--text-primary)]">
						{truncateId(run.runId)}
					</span>
				</td>
				<td className="px-4 py-3">
					<StatusBadge status={run.status} />
				</td>
				<td className="px-4 py-3">
					<WorkflowBadge state={run.workflowState} />
				</td>
				<td className="px-4 py-3">
					<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
						{timeAgo(run.startedAt ?? run.createdAt)}
					</span>
				</td>
				<td className="max-w-[180px] truncate px-4 py-3">
					{run.error ? (
						<span className="text-xs text-red-400/80">
							{truncateId(run.error, 40)}
						</span>
					) : (
						<span className="text-2xs text-[var(--text-tertiary)]">—</span>
					)}
				</td>
				<td className="px-2 py-3">
					{run.status === "failed" && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setShowRecover(true);
							}}
							className="inline-flex items-center justify-center rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--color-primary)]"
							title="Recover this run"
						>
							<RotateCcw className="h-4 w-4" />
						</button>
					)}
				</td>
				<td className="px-4 py-3 text-right">
					{isExpanded ? (
						<ChevronDown className="inline h-4 w-4 text-[var(--text-tertiary)]" />
					) : (
						<ChevronRight className="inline h-4 w-4 text-[var(--text-tertiary)]" />
					)}
				</td>
			</motion.tr>

			{/* Expanded events panel */}
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.tr
						key={`${run.runId}-events`}
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
					>
						<td colSpan={7} className="bg-[var(--surface-2)]/20 p-0">
							<RunEventsPanel runId={run.runId} />
						</td>
					</motion.tr>
				)}
			</AnimatePresence>

			{showRecover && (
				<RecoverDialog
					runId={run.runId}
					onClose={() => setShowRecover(false)}
				/>
			)}
		</>
	);
}

function RunEventsPanel({ runId }: { runId: string }) {
	const { data: events, isLoading, isError } = useRunEvents(runId);

	if (isLoading) {
		return (
			<div className="space-y-2 p-4">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-4 text-xs text-red-400">
				Failed to load events for this run.
			</div>
		);
	}

	if (!events || events.length === 0) {
		return (
			<div className="p-4 text-xs text-[var(--text-tertiary)]">
				No events recorded for this run.
			</div>
		);
	}

	return (
		<div className="border-t border-[var(--border-subtle)] p-4">
			<div className="mb-2 flex items-center gap-2">
				<Terminal className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
				<span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
					Event Feed ({events.length})
				</span>
			</div>
			<div className="max-h-[320px] overflow-y-auto space-y-1">
				{events.map((event, idx) => (
					<div
						key={event.id}
						className={cn(
							"flex items-start gap-3 rounded-lg px-3 py-2 text-xs",
							idx % 2 === 0 ? "bg-[var(--surface-1)]/40" : "bg-transparent",
						)}
					>
						<span className="font-mono tabular-nums shrink-0 text-2xs text-[var(--text-tertiary)]">
							{timeAgo(event.createdAt)}
						</span>
						<span className="inline-flex shrink-0 items-center rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-2xs text-[var(--text-secondary)]">
							{event.eventType}
						</span>
						<span className="truncate text-[var(--text-secondary)]">
							{event.payload
								? JSON.stringify(event.payload).slice(0, 120)
								: "—"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function RunsTableSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-12 w-full rounded-lg" />
			))}
		</div>
	);
}

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
	const [activeTab, setActiveTab] = useState<"runs" | "batches" | "latencia">(
		"runs",
	);
	const { data: batches, isLoading: batchesLoading } = useBatches();
	const { data: batchDetail, isLoading: batchDetailLoading } =
		useBatchDetail(selectedBatchId);
	const _submitBatch = useSubmitBatch();
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
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => setActiveTab("runs")}
					className={cn(
						"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
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
						"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
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
						"inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
						activeTab === "latencia"
							? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
							: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
					)}
				>
					<Gauge className="h-4 w-4" />
					Latencia
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
														<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"></th>
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
