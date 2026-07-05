import type React from "react";

/**
 * Action Card Artifact - Decision card with approve/reject
 *
 * Shows financial impact preview and requires human approval
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@drenyra/shared/artifacts";
import { ShieldCheck } from "lucide-react";
import { registerArtifact } from "../artifact-registry";

type ActionCardArt = Extract<HubArtifact, { type: "action_card" }>;

export const ActionCardArtifact: React.FC<{ artifact: ActionCardArt }> = ({
	artifact,
}) => {
	return (
		<div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-card/92 shadow-xl animate-entrance">
			<div className="space-y-5 p-5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-info shadow-sm">
							<ShieldCheck size={24} strokeWidth={1.5} />
						</div>
						<div>
							<h4 className="text-base font-black uppercase tracking-tight antialiased text-foreground">
								{artifact.title}
							</h4>
							<div className="flex items-center gap-2 mt-0.5">
								<div className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
								<p className="text-3xs text-muted-foreground font-black uppercase tracking-widest">
									Validación de decisión
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4 rounded-lg border border-border/70 bg-background/50 p-4 font-mono text-2xs">
					<div className="space-y-2">
						<span className="text-muted-foreground uppercase tracking-widest">
							Estado actual
						</span>
						<div className="flex justify-between items-baseline border-b border-border/40 pb-1">
							<span className="text-muted-foreground">Liquidez</span>
							<span className="text-foreground">S/ 45,200</span>
						</div>
						<div className="flex justify-between items-baseline">
							<span className="text-muted-foreground">Pasivos</span>
							<span className="text-foreground">S/ 12,100</span>
						</div>
					</div>
					<div className="space-y-2 border-l border-border/40 pl-4">
						<span className="font-black uppercase tracking-widest text-foreground/70">
							Proyectado
						</span>
						<div className="flex justify-between items-baseline border-b border-border/40 pb-1">
							<span className="text-muted-foreground">Liquidez</span>
							<span className="font-bold text-success">S/ 45,700</span>
						</div>
						<div className="flex justify-between items-baseline">
							<span className="text-muted-foreground">Pasivos</span>
							<span className="font-bold text-success">S/ 11,600</span>
						</div>
					</div>
				</div>

				<p className="rounded-lg border border-border/70 bg-background/45 p-3 text-xs font-medium leading-relaxed text-muted-foreground">
					"{artifact.payload.message || "Decisión pendiente de aprobación"}"
				</p>

				<div className="flex gap-3 pt-2">
					<button className="flex-1 rounded-lg bg-foreground py-3 text-2xs font-black uppercase tracking-widest text-background transition-[background-color,box-shadow,transform,opacity] duration-200 hover:opacity-92 active:scale-95">
						Confirmar ajuste
					</button>
					<button className="rounded-lg border border-border/70 bg-background/45 px-6 py-3 text-2xs font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,transform] duration-200 hover:bg-muted/60 hover:text-foreground">
						Rechazar
					</button>
				</div>
			</div>
		</div>
	);
};

// Auto-register
registerArtifact("action_card", ActionCardArtifact);
