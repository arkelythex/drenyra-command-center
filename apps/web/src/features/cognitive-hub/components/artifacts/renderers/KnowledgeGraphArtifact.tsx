import type React from "react";

/**
 * Knowledge Graph Artifact - Traceability web visualization
 *
 * Renders an abstract graph of linked entities (rules → docs → ledger → verification).
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@arkelythex/shared/artifacts";
import {
	BookMarked,
	Database,
	FileText,
	GitBranch,
	ShieldCheck,
} from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type KnowledgeGraphArt = Extract<HubArtifact, { type: "knowledge_graph" }>;

export const KnowledgeGraphArtifact: React.FC<{
	artifact: KnowledgeGraphArt;
}> = ({ artifact }) => (
	<div
		className={cn(
			tokensToClasses.borderRadius("modal"),
			"mt-6 overflow-hidden border border-border/40 bg-foreground/10 p-1 shadow-xl ",
		)}
	>
		<div className="p-8 bg-background/40 rounded-[2.3rem] border border-border/20 space-y-8 relative min-h-[400px]">
			<header className="flex items-center justify-between relative z-10">
				<div className="flex items-center gap-4">
					<div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-glow border border-foreground/50">
						<GitBranch size={24} strokeWidth={2.5} />
					</div>
					<div>
						<h4 className="text-base font-black uppercase tracking-tight text-foreground">
							{artifact.title}
						</h4>
						<p className="text-3xs text-muted-foreground font-black uppercase tracking-widest mt-0.5">
							Mapa de trazabilidad
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<div className="px-2 py-1 rounded bg-[rgba(var(--premium-success-rgb),0.10)] border border-[rgba(var(--premium-success-rgb),0.20)] text-[var(--premium-success)] text-[8px] font-black uppercase tracking-widest">
						Conectado
					</div>
				</div>
			</header>

			{/* Abstract graph visualization */}
			<div className="relative h-64 flex items-center justify-center overflow-hidden rounded-3xl bg-foreground/[0.02] border border-border/10">
				<svg
					className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
					aria-hidden="true"
				>
					<line
						x1="50%"
						y1="20%"
						x2="20%"
						y2="50%"
						stroke="currentColor"
						strokeWidth="1"
					/>
					<line
						x1="50%"
						y1="20%"
						x2="80%"
						y2="50%"
						stroke="currentColor"
						strokeWidth="1"
					/>
					<line
						x1="20%"
						y1="50%"
						x2="50%"
						y2="80%"
						stroke="currentColor"
						strokeWidth="1"
					/>
					<line
						x1="80%"
						y1="50%"
						x2="50%"
						y2="80%"
						stroke="currentColor"
						strokeWidth="1"
					/>
				</svg>

				<div className="relative w-full h-full p-10 flex flex-col justify-between items-center">
					{/* Node: Business Rule */}
					<div className="flex flex-col items-center gap-2">
						<div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-glow">
							<BookMarked size={24} strokeWidth={2} />
						</div>
						<span className="text-[8px] font-black uppercase tracking-widest text-foreground/60">
							Regla de negocio
						</span>
					</div>

					<div className="w-full flex justify-between px-10">
						{/* Node: Document */}
						<div className="flex flex-col items-center gap-2">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-foreground/5 text-foreground ">
								<FileText size={20} />
							</div>
							<span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">
								Entidad / PDF
							</span>
						</div>

						{/* Node: Ledger */}
						<div className="flex flex-col items-center gap-2">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-foreground/5 text-foreground ">
								<Database size={20} />
							</div>
							<span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">
								Asiento contable
							</span>
						</div>
					</div>

					{/* Node: Verification */}
					<div className="flex flex-col items-center gap-2">
						<div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-foreground/10 text-foreground shadow-glow ">
							<ShieldCheck size={28} />
						</div>
						<span className="text-3xs font-black uppercase tracking-widest text-foreground">
							Trazabilidad verificada
						</span>
					</div>
				</div>
			</div>

			<footer className="pt-6 border-t border-border/10 flex items-center justify-between">
				<div className="flex gap-8">
					<div className="flex flex-col">
						<span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">
							Relationships
						</span>
						<span className="text-label font-mono text-foreground font-bold tabular-nums">
							{artifact.payload.linkCount ?? 0} Links
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">
							Confidence
						</span>
						<span className="text-label font-mono text-foreground/60 font-bold tabular-nums">
							{artifact.payload.confidence?.toFixed(1) ?? "-"}%
						</span>
					</div>
				</div>
				<button
					type="button"
					className="rounded-xl bg-foreground px-6 py-2.5 text-3xs font-black uppercase tracking-[0.2em] text-background shadow-glow transition-[background-color,box-shadow,opacity] duration-200 hover:bg-foreground/90"
				>
					Explorar trazas
				</button>
			</footer>
		</div>
	</div>
);

// Auto-register
registerArtifact("knowledge_graph", KnowledgeGraphArtifact);
