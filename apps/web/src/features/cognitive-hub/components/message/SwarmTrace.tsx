/**
 * @fileoverview Timeline visual del flujo de agentes (Neural Trace Elite Binary)
 * @module features/cognitive-hub/components/message/SwarmTrace
 */

import { motion } from "framer-motion";
import { Check, Circle, Loader2, ShieldCheck } from "lucide-react";
import type { AgentStatus } from "@/features/agent-swarm";
import { cn } from "@/lib/utils";

interface TraceStep {
	agentId: string;
	agentName: string;
	status: AgentStatus | "running" | "failed";
	message: string;
	timestamp: string;
	latency?: number;
}

interface SwarmTraceProps {
	steps: TraceStep[];
	className?: string;
}

/**
 * SwarmTrace - High Fidelity Binary Instrumentation
 */
export function SwarmTrace({ steps, className }: SwarmTraceProps) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-xl border border-border/70 bg-card/90 p-4 shadow-xl  sm:p-6",
				className,
			)}
		>
			<header className="relative z-10 mb-5 flex items-center justify-between px-1 sm:mb-6">
				<div className="flex items-center gap-2 sm:gap-3">
					<div className="h-2 w-2 rounded-full bg-info animate-pulse shadow-info-glow" />
					<span className="text-[8px] sm:text-2xs font-black uppercase tracking-[0.2em] sm:tracking-[0.28em] text-muted-foreground">
						Traza Drenyra
					</span>
				</div>
				<span className="text-[7px] sm:text-3xs font-mono uppercase tracking-widest text-muted-foreground/70">
					Fiscal Trace v1
				</span>
			</header>

			<div className="relative z-10 mb-6 overflow-x-auto no-scrollbar pb-2 sm:mb-8">
				<div className="absolute left-0 right-0 top-[19px] h-[1px] min-w-full bg-border/80 sm:top-[23px]" />
				<ProgressLine steps={steps} />
				<div className="flex justify-between gap-4 min-w-max px-2">
					{steps.map((step, index) => (
						<TraceNode key={step.agentId} step={step} index={index} />
					))}
				</div>
			</div>

			<div className="relative z-10 space-y-2 border-t border-border/80 pt-4 sm:space-y-3 sm:pt-5">
				{steps.map((step) => (
					<TraceMessage key={step.agentId} step={step} />
				))}
			</div>
		</div>
	);
}

// ==================== SUB-COMPONENTES BINARY ====================

function ProgressLine({ steps }: { steps: TraceStep[] }) {
	const completedCount = steps.filter((s) => s.status === "completed").length;
	const progress =
		steps.length > 1 ? (completedCount / (steps.length - 1)) * 100 : 0;

	return (
		<motion.div
			className="absolute left-0 top-[19px] h-[2px] bg-info shadow-info-glow sm:top-[23px]"
			initial={{ width: "0%" }}
			animate={{ width: `${Math.min(progress, 100)}%` }}
			transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
		/>
	);
}

function TraceNode({ step, index }: { step: TraceStep; index: number }) {
	const { status } = step;
	const isReviewing =
		step.message.toLowerCase().includes("validando") ||
		step.message.toLowerCase().includes("revisando");

	const nodeConfig: Record<
		string,
		{
			icon: typeof Check;
			className: string;
			size: number;
			labelClassName: string;
		}
	> = {
		completed: {
			icon: Check,
			className: "bg-success-subtle border-success/30 text-success",
			size: 12,
			labelClassName: "text-foreground",
		},
		active: {
			icon: isReviewing ? ShieldCheck : Loader2,
			className: cn(
				"bg-info-subtle border-info/30 text-info",
				!isReviewing && "animate-spin",
			),
			size: 12,
			labelClassName: "text-foreground",
		},
		running: {
			icon: Loader2,
			className: "bg-info-subtle border-info/30 text-info animate-spin",
			size: 12,
			labelClassName: "text-foreground",
		},
		failed: {
			icon: Circle,
			className: "bg-danger-subtle border-danger/25 text-danger",
			size: 6,
			labelClassName: "text-danger",
		},
		ready: {
			icon: Circle,
			className: "bg-muted/70 border-border text-muted-foreground",
			size: 6,
			labelClassName: "text-muted-foreground",
		},
		idle: {
			icon: Circle,
			className: "bg-muted/50 border-border/80 text-muted-foreground/70",
			size: 6,
			labelClassName: "text-muted-foreground/80",
		},
	};

	const config = nodeConfig[status] || nodeConfig.idle;
	const Icon = config.icon;

	return (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ delay: index * 0.12 }}
			className="flex flex-col items-center gap-2 sm:gap-4"
		>
			<div
				className={cn(
					"flex h-8 w-8 items-center justify-center rounded-lg border transition-[background-color,border-color,color,box-shadow,transform] duration-300 sm:h-12 sm:w-12 sm:rounded-xl",
					config.className,
				)}
			>
				<Icon size={config.size} strokeWidth={3} className="sm:w-4 sm:h-4" />
			</div>
			<span
				className={cn(
					"text-[8px] sm:text-2xs font-black uppercase tracking-wider sm:tracking-[0.16em] transition-colors",
					config.labelClassName,
				)}
			>
				{step.agentName}
			</span>
		</motion.div>
	);
}

function TraceMessage({ step }: { step: TraceStep }) {
	return (
		<div className="group/item flex items-start gap-3 text-2xs sm:gap-4 sm:text-[12px]">
			<div
				className={cn(
					"mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-[background-color,box-shadow,opacity] duration-200 sm:h-2 sm:w-2",
					step.status === "completed"
						? "bg-success shadow-success-glow"
						: step.status === "active" || step.status === "running"
							? "bg-info animate-pulse"
							: step.status === "failed"
								? "bg-danger"
								: "bg-muted-foreground/60",
				)}
			/>
			<div className="flex-1 min-w-0">
				<span
					className={cn(
						"font-black uppercase tracking-widest",
						step.status === "completed" ||
							step.status === "active" ||
							step.status === "running"
							? "text-foreground"
							: step.status === "failed"
								? "text-danger"
								: "text-muted-foreground",
					)}
				>
					{step.agentName}
				</span>
				<span className="ml-2 font-medium text-muted-foreground antialiased sm:ml-3">
					{step.message}
				</span>
			</div>
			<span className="font-mono text-[8px] tabular-nums text-muted-foreground/70 sm:text-2xs">
				{step.timestamp}
			</span>
		</div>
	);
}

export default SwarmTrace;
