import type React from "react";

/**
 * Simulation Artifact - Ledger preview with impact analysis
 *
 * Shows accounting entries before committing to ledger
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@arkelythex/shared/artifacts";
import { Database, ShieldCheck } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useAgentActions } from "../../../hooks/useAgentActions";
import { registerArtifact } from "../artifact-registry";

type SimulationArt = Extract<HubArtifact, { type: "simulation" }>;

export const SimulationArtifact: React.FC<{ artifact: SimulationArt }> = ({
	artifact,
}) => {
	const { commitToLedger } = useAgentActions();

	return (
		<div
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 overflow-hidden border border-border/40 bg-foreground/10 p-1 shadow-xl ",
			)}
		>
			<div className="p-6 bg-background/40 rounded-[1.8rem] border border-border/20 space-y-6">
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground border border-border shadow-glow">
							<Database size={24} strokeWidth={1.5} />
						</div>
						<div>
							<h4 className="text-base font-black uppercase tracking-tight text-foreground">
								{artifact.title}
							</h4>
							<div className="flex items-center gap-2 mt-0.5">
								<div className="h-1 w-1 rounded-full bg-foreground animate-pulse" />
								<p className="text-3xs text-muted-foreground font-black uppercase tracking-widest">
									Simulación contable
								</p>
							</div>
						</div>
					</div>
					<div className="px-2 py-1 rounded bg-foreground text-background text-[8px] font-black uppercase tracking-widest">
						Vista previa
					</div>
				</header>

				{/* LEDGER TABLE */}
				<div className="rounded-2xl border border-border/20 bg-foreground/[0.02] overflow-hidden">
					<table className="w-full text-label font-mono">
						<thead className="bg-foreground/5 border-b border-border/20">
							<tr className="text-muted-foreground uppercase text-3xs font-black tracking-widest">
								<th className="px-4 py-2 text-left">Cuenta PCGE</th>
								<th className="px-4 py-2 text-right">Debe</th>
								<th className="px-4 py-2 text-right">Haber</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/10">
							{artifact.payload.entries?.map((row, i) => (
								<tr
									key={i}
									className="hover:bg-foreground/[0.02] transition-colors text-foreground/80"
								>
									<td className="px-4 py-3">{row.account}</td>
									<td className="px-4 py-3 text-right tabular-nums">
										{row.debit > 0 ? row.debit.toLocaleString() : "-"}
									</td>
									<td className="px-4 py-3 text-right tabular-nums">
										{row.credit > 0 ? row.credit.toLocaleString() : "-"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* IMPACT PREVIEW */}
				<div className="p-4 rounded-xl bg-foreground/[0.03] border border-border/10 space-y-3">
					<span className="text-3xs font-black uppercase text-muted-foreground tracking-widest">
						Análisis de impacto
					</span>
					<div className="grid grid-cols-2 gap-6">
						<div className="flex flex-col gap-1">
							<span className="text-[8px] font-bold text-muted-foreground uppercase">
								Resultado Neto
							</span>
							<span className="text-xs font-black text-[var(--premium-success)]">
								+ S/ 1,200.00
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-[8px] font-bold text-muted-foreground uppercase">
								Carga Impositiva
							</span>
							<span className="text-xs font-black text-foreground">
								S/ 450.00
							</span>
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={() => commitToLedger(artifact.payload)}
						className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-foreground/50 bg-foreground py-3.5 text-2xs font-black uppercase tracking-[0.2em] text-background shadow-glow transition-[background-color,box-shadow,transform,opacity] duration-200 hover:scale-[1.01] active:scale-95"
					>
						<ShieldCheck size={14} strokeWidth={3} /> Aplicar al libro mayor
					</button>
					<button
						type="button"
						className="rounded-2xl border border-border/20 bg-foreground/5 px-8 py-3.5 text-2xs font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,transform] duration-200 hover:bg-foreground/10 hover:text-foreground"
					>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	);
};

// Auto-register
registerArtifact("simulation", SimulationArtifact);
