import { cn } from "@/lib/utils";

export type ClosePhaseState = "completed" | "active" | "blocked" | "pending";

interface ClosePipelinePhase {
	name: string;
	state: ClosePhaseState;
	count?: number;
}

interface ClosePipelineProps {
	phases: ClosePipelinePhase[];
	activeIndex: number;
}

const STEP_CONFIG = {
	completed: {
		dot: "bg-[var(--color-success)]",
		line: "bg-[var(--color-success)]",
		label: "text-[var(--color-success)]",
	},
	active: {
		dot: "bg-[var(--color-info)] ring-4 ring-[var(--color-info)]/20",
		line: "bg-[var(--color-info)]",
		label: "text-[var(--color-info)] font-semibold",
	},
	blocked: {
		dot: "bg-[var(--color-danger)] ring-4 ring-[var(--color-danger)]/20",
		line: "bg-[var(--color-danger)]",
		label: "text-[var(--color-danger)] font-semibold",
	},
	pending: {
		dot: "bg-[var(--text-quaternary)]",
		line: "bg-[var(--border-subtle)]",
		label: "text-[var(--text-tertiary)]",
	},
} as const;

export function ClosePipeline({ phases, activeIndex }: ClosePipelineProps) {
	if (phases.length === 0) {
		return (
			<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-center">
				<p className="text-xs text-[var(--text-tertiary)]">
					No hay fases de cierre definidas para este período.
				</p>
			</div>
		);
	}

	const activePhase = phases[activeIndex];

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
			<div className="flex items-center gap-3 overflow-x-auto">
				{phases.map((phase, index) => {
					const cfg = STEP_CONFIG[phase.state];
					const isLast = index === phases.length - 1;
					return (
						<div key={phase.name} className="flex items-center gap-1 shrink-0">
							<div
								className={cn(
									"relative flex size-4 shrink-0 items-center justify-center rounded-full",
									cfg.dot,
								)}
							>
								{phase.state === "blocked" ? (
									<span className="text-[8px] font-bold text-white">!</span>
								) : phase.state === "completed" ? (
									<span className="text-[8px] text-white">✓</span>
								) : (
									<span className="text-[8px] font-bold text-white">
										{index + 1}
									</span>
								)}
							</div>
							<span className={cn("text-[10px] whitespace-nowrap", cfg.label)}>
								{phase.name}
								{typeof phase.count === "number" && (
									<span className="ml-0.5 text-[9px] text-[var(--text-quaternary)]">
										({phase.count})
									</span>
								)}
							</span>
							{!isLast && (
								<div
									className={cn("mx-1 h-[1.5px] w-3 rounded-full", cfg.line)}
								/>
							)}
						</div>
					);
				})}
			</div>
			{activePhase && (
				<p className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">
					{activePhase.state === "active" && `Ejecutando: ${activePhase.name}`}
					{activePhase.state === "blocked" &&
						`${activePhase.name} — requiere atención`}
					{activePhase.state === "completed" &&
						`${activePhase.name} completado`}
					{activePhase.state === "pending" && `${activePhase.name} — pendiente`}
				</p>
			)}
		</div>
	);
}
