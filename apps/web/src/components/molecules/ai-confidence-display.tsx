/**
 * AIConfidenceDisplay Molecule - AI Feedback Component 2026
 *
 * Comprehensive AI confidence display for review queue and approval workflows.
 * Addresses the "lack of AI feedback" issue with clear visual indicators.
 *
 * @example
 * ```tsx
 * <AIConfidenceDisplay
 *   score={87}
 *   label="Classification confidence"
 *   factors={['Matched RUC', 'Amount verified', 'Date aligned']}
 *   requiresReview={score < 80}
 * />
 * ```
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";
import { AIConfidenceBar, AIIndicator } from "@/components/atoms/ai-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/atoms/text";
import type { AIState } from "@/lib/design-tokens/semantic-tokens";
import { getConfidenceLevel } from "@/lib/design-tokens/semantic-tokens";
import { cn } from "@/lib/utils";

export interface AIConfidenceDisplayProps {
	score: number;
	label?: string;
	state?: AIState;
	factors?: string[];
	warnings?: string[];
	requiresReview?: boolean;
	onApprove?: () => void;
	onReject?: () => void;
	onEdit?: () => void;
	expanded?: boolean;
	className?: string;
}

function AIConfidenceDisplay({
	score,
	label = "AI Confidence",
	state,
	factors,
	warnings,
	requiresReview,
	onApprove,
	onReject,
	onEdit,
	expanded = false,
	className,
}: AIConfidenceDisplayProps) {
	const level = getConfidenceLevel(score);
	const [isExpanded, setIsExpanded] = useState(expanded);

	const inferredState: AIState =
		state ??
		(score >= 85
			? "confident"
			: score >= 70
				? "thinking"
				: score >= 50
					? "uncertain"
					: "error");

	const showActions = requiresReview !== false && score < 85;

	return (
		<motion.div
			className={cn(
				"rounded-xl p-4 border bg-surface-1",
				inferredState === "confident" && "border-success-subtle",
				inferredState === "uncertain" && "border-warning-subtle",
				inferredState === "error" && "border-danger-subtle",
				inferredState === "thinking" && "border-info-subtle",
				className,
			)}
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="flex items-center gap-2">
					<AIIndicator state={inferredState} confidence={score} compact />
					<Text variant="label" className="text-primary">
						{label}
					</Text>
				</div>

				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						size="xs"
						status={
							inferredState === "confident"
								? "success"
								: inferredState === "uncertain"
									? "warning"
									: inferredState === "error"
										? "danger"
										: "info"
						}
					>
						{level.label}
					</Badge>

					{(factors || warnings) && (
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="text-muted hover:text-primary transition-colors"
							aria-label={isExpanded ? "Collapse details" : "Expand details"}
						>
							<Info size={16} />
						</button>
					)}
				</div>
			</div>

			<AIConfidenceBar score={score} showLabel={false} />

			<AnimatePresence>
				{isExpanded && (factors || warnings) && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
						className="mt-4 pt-3 border-t border-[var(--color-stroke-1)]"
					>
						{factors && factors.length > 0 && (
							<div className="mb-3">
								<Text variant="caption" muted className="mb-2 block">
									Matching factors
								</Text>
								<div className="flex flex-wrap gap-1.5">
									{factors.map((factor, i) => (
										<span
											key={i}
											className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-medium rounded-md bg-success-subtle text-[rgb(var(--premium-success-rgb))]"
										>
											<CheckCircle size={10} />
											{factor}
										</span>
									))}
								</div>
							</div>
						)}

						{warnings && warnings.length > 0 && (
							<div>
								<Text variant="caption" muted className="mb-2 block">
									Attention required
								</Text>
								<div className="flex flex-col gap-1.5">
									{warnings.map((warning, i) => (
										<span
											key={i}
											className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-warning-subtle text-[rgb(var(--premium-warning-rgb))]"
										>
											<AlertTriangle size={12} />
											{warning}
										</span>
									))}
								</div>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{showActions && (onApprove || onReject || onEdit) && (
				<div className="mt-4 pt-3 border-t border-[var(--color-stroke-1)] flex items-center gap-2">
					{onApprove && (
						<Button size="sm" variant="primary" onClick={onApprove}>
							Approve
						</Button>
					)}
					{onEdit && (
						<Button size="sm" variant="secondary" onClick={onEdit}>
							Edit
						</Button>
					)}
					{onReject && (
						<Button
							size="sm"
							variant="ghost"
							status="danger"
							onClick={onReject}
						>
							Reject
						</Button>
					)}
				</div>
			)}
		</motion.div>
	);
}

export { AIConfidenceDisplay };
