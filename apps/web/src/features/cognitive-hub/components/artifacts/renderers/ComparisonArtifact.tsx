import type React from "react";

/**
 * Comparison Artifact - Scenario comparison optimizer
 *
 * Renders 2+ scenarios side by side with metrics and recommended action.
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@arkelythex/shared/artifacts";
import { Zap } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type ComparisonArt = Extract<HubArtifact, { type: "comparison" }>;

export const ComparisonArtifact: React.FC<{ artifact: ComparisonArt }> = ({
	artifact,
}) => (
	<div
		className={cn(
			tokensToClasses.borderRadius("modal"),
			"mt-6 border border-border/40 bg-foreground/[0.03] p-8 shadow-xl ",
		)}
	>
		<header className="flex items-center gap-4 mb-10">
			<div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-glow">
				<Zap size={24} strokeWidth={2.5} />
			</div>
			<div>
				<h4 className="text-base font-black uppercase tracking-tight text-foreground">
					{artifact.title}
				</h4>
				<p className="text-3xs text-muted-foreground font-black uppercase tracking-widest mt-0.5 italic">
					Cross-Mission Optimization Engine
				</p>
			</div>
		</header>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
			<div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/10 hidden md:block" />

			{artifact.payload.scenarios.map((sc, idx) => (
				<div key={idx} className="space-y-6">
					<div className="flex items-center justify-between border-b border-border/20 pb-4">
						<span className="text-2xs font-black uppercase tracking-widest text-foreground/40 italic">
							Escenario {idx + 1}
						</span>
						<span className="text-xs font-black uppercase text-foreground">
							{sc.name}
						</span>
					</div>

					<div className="space-y-4">
						{sc.metrics.map((m, mIdx) => (
							<div
								key={mIdx}
								className="flex justify-between items-center group"
							>
								<span className="text-2xs font-bold text-muted-foreground uppercase">
									{m.label}
								</span>
								<div className="flex flex-col items-end">
									<span
										className={cn(
											"text-sm font-mono font-black tabular-nums",
											m.highlight
												? "text-[var(--premium-success)]"
												: "text-foreground",
										)}
									>
										{m.value}
									</span>
									{m.delta && (
										<span
											className={cn(
												"text-[8px] font-black",
												m.delta > 0
													? "text-[var(--premium-success)]"
													: "text-red-500",
											)}
										>
											{m.delta > 0 ? "+" : ""}
											{m.delta}%
										</span>
									)}
								</div>
							</div>
						))}
					</div>

					<button
						type="button"
						className={cn(
							"w-full rounded-xl py-3 text-3xs font-black uppercase tracking-widest transition-[background-color,border-color,color,box-shadow,transform]",
							sc.recommended
								? "bg-foreground text-background shadow-glow"
								: "bg-foreground/5 text-muted-foreground border border-border/50",
						)}
					>
						{sc.recommended ? "Aplicar Recomendación" : "Seleccionar Ruta"}
					</button>
				</div>
			))}
		</div>
	</div>
);

// Auto-register
registerArtifact("comparison", ComparisonArtifact);
