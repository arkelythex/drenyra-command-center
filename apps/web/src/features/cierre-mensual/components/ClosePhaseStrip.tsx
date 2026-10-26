import { cn } from "@/lib/utils";

export type ClosePhaseState = "completed" | "active" | "blocked" | "pending";

interface ClosePhase {
	name: string;
	state: ClosePhaseState;
	/** Evidence items for the phase, when the mission reports them. */
	evidenceCount?: number;
	blocker?: string;
	nextAction?: string;
}

interface ClosePhaseStripProps {
	phases: ClosePhase[];
	activeIndex: number;
}

/** Segment color and label per state; the label makes the state readable without color. */
const STATE = {
	completed: {
		label: "Completada",
		segment: "bg-success",
		text: "text-muted-foreground",
	},
	active: { label: "En curso", segment: "bg-brand", text: "text-foreground" },
	blocked: {
		label: "Bloqueada",
		segment: "bg-destructive",
		text: "text-destructive",
	},
	pending: {
		label: "Pendiente",
		segment: "bg-border",
		text: "text-muted-foreground",
	},
} as const;

/** Close plan as a segmented stepper: one segment per phase, the current one marked. */
export function ClosePhaseStrip({ phases, activeIndex }: ClosePhaseStripProps) {
	if (phases.length === 0) {
		return (
			<p className="rounded-xl border border-border px-4 py-6 text-center text-sm text-muted-foreground">
				No hay fases de cierre definidas para este período.
			</p>
		);
	}

	return (
		<section className="space-y-3">
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="text-base font-medium tracking-tight">
					Fases del cierre
				</h2>
				<p className="text-sm text-muted-foreground">
					Fase activa: {phases[activeIndex]?.name ?? "—"}
				</p>
			</div>

			<ol
				aria-label="Fases del cierre"
				className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:grid-cols-8"
			>
				{phases.map((phase, index) => {
					const state = STATE[phase.state];
					return (
						<li
							key={phase.name}
							aria-current={index === activeIndex ? "step" : undefined}
							className="space-y-2"
						>
							<div
								aria-hidden="true"
								className={cn("h-1 rounded-full", state.segment)}
							/>
							<div className="space-y-0.5">
								<p
									className={cn(
										"text-sm",
										index === activeIndex
											? "font-medium text-foreground"
											: "text-foreground",
									)}
								>
									<span className="mr-1 font-mono tabular-nums text-muted-foreground">
										{index + 1}
									</span>
									{phase.name}
								</p>
								<p className={cn("text-xs", state.text)}>{state.label}</p>
								{phase.evidenceCount !== undefined ? (
									<p className="text-xs text-muted-foreground">
										{phase.evidenceCount} ev.
									</p>
								) : null}
								{phase.blocker ? (
									<p className="text-xs text-destructive">{phase.blocker}</p>
								) : null}
								{phase.nextAction ? (
									<p className="text-xs text-muted-foreground">
										Siguiente: {phase.nextAction}
									</p>
								) : null}
							</div>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
