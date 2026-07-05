import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AgentRunState } from "../../types";
import { StatusBadge, WorkflowBadge } from "./Badges";
import { timeAgo, truncateId } from "./constants";
import { RecoverDialog } from "./RecoverDialog";
import { RunEventsPanel } from "./RunEventsPanel";

export function RunRow({
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
