import { cn } from "@/lib/utils";
import {
	FISCAL_ACTION_STATUS_ORDER,
	FISCAL_ACTION_STATUS_LABELS,
} from "@arkelythex/domain";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { PipelineProps } from "../FiscalInspector.types";

/**
 * Visual pipeline showing the 7-step fiscal action workflow.
 * Highlights completed, current, and rejected statuses.
 */
export function FiscalInspectorPipeline({ status }: PipelineProps) {
	return (
		<div className="space-y-1.5">
			{FISCAL_ACTION_STATUS_ORDER.map((step, idx) => {
				const currentIdx = FISCAL_ACTION_STATUS_ORDER.indexOf(
					status as (typeof FISCAL_ACTION_STATUS_ORDER)[number],
				);
				const isCompleted = idx <= currentIdx && status !== "REJECTED";
				const isCurrent = idx === currentIdx;
				const isRejected = status === "REJECTED" && isCurrent;
				const StatusIcon = isRejected
					? XCircle
					: isCompleted
						? CheckCircle2
						: Clock;

				return (
					<div
						key={step}
						className={cn(
							"flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all",
							isCurrent && "bg-[var(--color-surface-2)]",
						)}
					>
						<StatusIcon
							size={12}
							style={{
								color: isRejected
									? "var(--color-danger)"
									: isCompleted
										? "var(--color-success)"
										: "var(--color-text-disabled)",
							}}
						/>
						<span
							className={cn(
								"text-2xs font-bold",
								isCurrent
									? "text-[var(--color-text-primary)]"
									: isCompleted
										? "text-[var(--color-text-secondary)]"
										: "text-[var(--color-text-disabled)]",
							)}
						>
							{FISCAL_ACTION_STATUS_LABELS[step]}
						</span>
					</div>
				);
			})}
		</div>
	);
}
