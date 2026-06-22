/**
 * AI Indicator Atom - AI Feedback System 2026
 *
 * Visual feedback for AI agent states.
 * Addresses the "lack of AI feedback" issue identified.
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import type * as React from "react";
import type { AIState } from "@/lib/design-tokens/semantic-tokens";
import {
	getAITokens,
	getConfidenceLevel,
	semanticTokens,
} from "@/lib/design-tokens/semantic-tokens";
import { cn } from "@/lib/utils";

export interface AIIndicatorProps {
	state: AIState;
	confidence?: number;
	label?: string;
	showReason?: string;
	size?: "sm" | "md" | "lg";
	compact?: boolean;
	className?: string;
}

const iconMap: Record<AIState, React.ElementType> = {
	thinking: Loader2,
	confident: CheckCircle,
	uncertain: AlertTriangle,
	error: XCircle,
};

const statusMap: Record<AIState, "info" | "success" | "warning" | "danger"> = {
	thinking: "info",
	confident: "success",
	uncertain: "warning",
	error: "danger",
};

const labelMap: Record<AIState, string> = {
	thinking: "Processing...",
	confident: "High confidence",
	uncertain: "Needs review",
	error: "Manual approval required",
};

function AIIndicator({
	state,
	confidence,
	label,
	showReason,
	size = "md",
	compact,
	className,
}: AIIndicatorProps) {
	const tokens = getAITokens(state);
	const Icon = iconMap[state];
	const defaultLabel = labelMap[state];

	return (
		<motion.div
			className={cn(
				"inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border",
				tokens.bg,
				tokens.border,
				tokens.text,
				state === "thinking" && tokens.pulse,
				className,
			)}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.2 }}
		>
			<Icon
				size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
				className={cn(state === "thinking" && "animate-spin")}
				strokeWidth={2}
			/>

			{!compact && (
				<div className="flex flex-col">
					<span className="text-xs font-medium">
						{label || defaultLabel}
						{confidence !== undefined && (
							<span className="ml-1 font-bold">{confidence}%</span>
						)}
					</span>

					<AnimatePresence>
						{showReason && (
							<motion.span
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="text-2xs text-muted"
							>
								{showReason}
							</motion.span>
						)}
					</AnimatePresence>
				</div>
			)}

			{compact && confidence !== undefined && (
				<span className="text-xs font-bold">{confidence}%</span>
			)}
		</motion.div>
	);
}

export interface AIConfidenceBarProps {
	score: number;
	showLabel?: boolean;
	animated?: boolean;
	className?: string;
}

function AIConfidenceBar({
	score,
	showLabel = true,
	animated = true,
	className,
}: AIConfidenceBarProps) {
	const level = getConfidenceLevel(score);
	const status = statusMap[confidenceToState(score)];
	const tokens = semanticTokens.status[status];

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{showLabel && (
				<span className={cn("text-xs font-medium", tokens.text)}>
					{level.label}
				</span>
			)}
			<div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
				<motion.div
					className={cn("h-full rounded-full", colorMap[status])}
					initial={animated ? { width: 0 } : { width: `${score}%` }}
					animate={{ width: `${score}%` }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				/>
			</div>
			<span className="text-xs font-bold tabular-nums text-primary">
				{score}%
			</span>
		</div>
	);
}

function confidenceToState(score: number): AIState {
	if (score >= 85) return "confident";
	if (score >= 70) return "thinking";
	if (score >= 50) return "uncertain";
	return "error";
}

const colorMap: Record<"info" | "success" | "warning" | "danger", string> = {
	info: "bg-[rgb(var(--premium-info-rgb))]",
	success: "bg-[rgb(var(--premium-success-rgb))]",
	warning: "bg-[rgb(var(--premium-warning-rgb))]",
	danger: "bg-[rgb(var(--premium-danger-rgb))]",
};

export { AIIndicator, AIConfidenceBar };
