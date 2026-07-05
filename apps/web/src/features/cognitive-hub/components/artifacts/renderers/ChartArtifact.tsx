import type React from "react";

/**
 * Chart Artifact - Bar chart visualization
 *
 * Renders financial data as animated bar chart with hover tooltips.
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@drenyra/shared/artifacts";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type ChartArt = Extract<HubArtifact, { type: "chart" }>;

export const ChartArtifact: React.FC<{ artifact: ChartArt }> = ({
	artifact,
}) => (
	<div
		className={cn(
			tokensToClasses.borderRadius("modal"),
			"group relative mt-6 overflow-hidden border border-border/20 bg-foreground/[0.03] p-8 shadow-xl ",
		)}
	>
		{/* Subtle scanline effect */}
		<div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(255,255,255,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />

		<div className="flex items-center justify-between mb-8 relative z-10">
			<div>
				<h4 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/60 antialiased">
					{artifact.title}
				</h4>
				<p className="text-2xs font-mono text-foreground mt-1 uppercase tracking-widest font-black flex items-center gap-2">
					<span className="h-1 w-1 rounded-full bg-[var(--premium-success)] animate-pulse inline-block" />
					Real-time Analysis Δ
				</p>
			</div>
			<div className="h-10 w-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center shadow-inner">
				<TrendingUp size={18} className="text-foreground" />
			</div>
		</div>

		<div className="h-48 flex items-end gap-4 px-4 relative z-10">
			{artifact.payload.data.map((val: number, i: number) => {
				const isMax = val === Math.max(...artifact.payload.data);
				return (
					<div
						key={i}
						className="flex-1 group/bar relative"
						style={{ height: `${val}%` }}
					>
						<motion.div
							initial={{ height: 0 }}
							animate={{ height: "100%" }}
							transition={{
								delay: i * 0.05,
								duration: 1.5,
								ease: [0.2, 0.8, 0.2, 1],
							}}
							className={cn(
								"w-full rounded-t-xl transition-[background-color,box-shadow,transform] duration-300",
								isMax
									? "bg-foreground shadow-glow"
									: "bg-foreground/20 group-hover/bar:bg-foreground/40",
							)}
						/>
						<div className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-2xs font-black text-background opacity-0 shadow-xl transition-[opacity,transform,box-shadow] group-hover/bar:translate-y-0 group-hover/bar:opacity-100">
							S/ {val.toLocaleString()}k
						</div>
					</div>
				);
			})}
		</div>

		<div className="mt-8 pt-6 border-t border-border/10 flex justify-between items-center text-3xs font-black uppercase tracking-[0.4em] text-muted-foreground/40 relative z-10">
			<span>Historical</span>
			<span>Current Period</span>
			<span className="text-foreground/60 font-bold">Projection (AI)</span>
		</div>
	</div>
);

// Auto-register
registerArtifact("chart", ChartArtifact);
