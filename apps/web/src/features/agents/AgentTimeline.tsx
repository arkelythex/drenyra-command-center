import { useEffect, useRef } from "react";
import type { AgentStepDTO } from "./agents.types";

export interface AgentTimelineProps {
	steps: AgentStepDTO[];
}

export function AgentTimeline({ steps }: AgentTimelineProps) {
	const timelineRef = useRef<HTMLDivElement>(null);
	const currentStepRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (currentStepRef.current) {
			currentStepRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [steps]);

	if (steps.length === 0) {
		return (
			<p className="text-xs text-[var(--text-tertiary)]">
				Sin pasos registrados
			</p>
		);
	}

	return (
		<div ref={timelineRef} className="space-y-0">
			{steps.map((step, idx) => {
				const isLast = idx === steps.length - 1;
				const isCurrent = step.status === "running";
				const isDone = step.status === "completed";
				const isFailed = step.status === "failed";
				const isPending = step.status === "pending";

				return (
					<div
						key={step.id}
						ref={isCurrent ? currentStepRef : undefined}
						className="relative flex gap-3"
					>
						{/* Connector */}
						<div className="flex flex-col items-center">
							<div
								className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
									isCurrent
										? "border-[var(--color-primary)]"
										: isDone
											? "border-[var(--color-success)] bg-[var(--color-success)]"
											: isFailed
												? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]0"
												: "border-[var(--border-subtle)] bg-[var(--surface-2)]"
								}`}
							>
								{isDone && (
									<span className="text-2xs text-[var(--text-inverse)]">✓</span>
								)}
								{isFailed && (
									<span className="text-2xs text-[var(--text-inverse)]">✕</span>
								)}
								{isCurrent && (
									<span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]" />
								)}
								{isPending && (
									<span className="h-1.5 w-1.5 rounded-full bg-[var(--border-subtle)]" />
								)}
							</div>
							{!isLast && (
								<div className="h-full w-px bg-[var(--border-subtle)]" />
							)}
						</div>

						{/* Content */}
						<div className="pb-6 pt-0.5">
							<p
								className={`text-xs font-medium ${
									isCurrent
										? "text-[var(--color-primary)]"
										: isDone
											? "text-[var(--text-primary)]"
											: isFailed
												? "text-[var(--color-danger)]"
												: "text-[var(--text-tertiary)]"
								}`}
							>
								{step.label}
							</p>
							{step.duration !== undefined && step.duration > 0 && (
								<p className="text-2xs text-[var(--text-tertiary)]">
									{Math.round(step.duration / 1000)}s
								</p>
							)}
							{isCurrent && (
								<p className="text-2xs text-[var(--text-tertiary)]">
									en progreso
								</p>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
