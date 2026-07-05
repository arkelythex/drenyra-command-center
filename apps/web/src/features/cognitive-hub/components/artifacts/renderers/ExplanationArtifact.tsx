import type React from "react";

/**
 * Explanation Artifact - Cognitive analysis display
 *
 * Shows AI reasoning with decision logic metadata.
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@drenyra/shared/artifacts";
import { BookMarked, BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import { registerArtifact } from "../artifact-registry";

type ExplanationArt = Extract<HubArtifact, { type: "explanation" }>;

export const ExplanationArtifact: React.FC<{ artifact: ExplanationArt }> = ({
	artifact,
}) => (
	<div className="relative mt-6 overflow-hidden hub-panel-inset p-5 animate-entrance border-success-subtle">
		<div className="absolute right-5 top-5">
			<div className="flex h-11 w-11 items-center justify-center rounded-lg border border-success/20 bg-success-subtle text-success">
				<BrainCircuit size={24} strokeWidth={2.5} />
			</div>
		</div>

		<div className="space-y-6 relative z-10">
			<header>
				<h4 className="text-base font-black uppercase tracking-tight text-foreground mb-1">
					{artifact.title}
				</h4>
				<div className="flex items-center gap-3">
					<span className="text-2xs font-mono font-black text-success uppercase tracking-widest">
						Análisis del agente auditor
					</span>
					<span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
					<span className="text-2xs font-mono font-black text-muted-foreground uppercase tracking-widest">
						{artifact.metadata?.agent}
					</span>
				</div>
			</header>

			<div className="relative overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] p-5">
				<div className="absolute left-0 top-0 h-full w-1 bg-success/50" />
				<p className="text-sm text-foreground/90 leading-relaxed font-medium antialiased">
					"{artifact.content}"
				</p>
			</div>

			<div className="space-y-4">
				<span className="px-1 text-3xs font-black uppercase tracking-[0.22em] text-muted-foreground">
					Lógica de decisión
				</span>
				<div className="grid grid-cols-1 gap-3">
					{[
						{ label: "Confianza de Acción", value: "99.9%", icon: ShieldCheck },
						{
							label: "Ref. Legislativa",
							value: "Resolución 2026-SUNAT",
							icon: BookMarked,
						},
						{ label: "Impacto Fiscal", value: "Ajuste de Céntimos", icon: Zap },
					].map((stat, i) => (
						<div
							key={i}
							className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] p-4"
						>
							<div className="flex items-center gap-3">
								<stat.icon size={14} className="text-success" />
								<span className="text-2xs font-bold text-muted-foreground uppercase">
									{stat.label}
								</span>
							</div>
							<span className="text-2xs font-mono font-black text-foreground">
								{stat.value}
							</span>
						</div>
					))}
				</div>
			</div>

			<button className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] py-3 text-2xs font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,transform] duration-200 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground active:scale-95">
				Cerrar Análisis
			</button>
		</div>
	</div>
);

// Auto-register
registerArtifact("explanation", ExplanationArtifact);
