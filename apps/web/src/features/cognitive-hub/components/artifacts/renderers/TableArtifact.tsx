import type React from "react";

/**
 * Table Artifact - Audit trail / event timeline
 *
 * Renders an immutable audit log with decision tree visualization.
 * Despite the type name "table", this is a timeline view.
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@drenyra/shared/artifacts";
import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type TableArt = Extract<HubArtifact, { type: "table" }>;

export const TableArtifact: React.FC<{ artifact: TableArt }> = ({
	artifact,
}) => (
	<div className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-xl animate-entrance">
		<div className="absolute top-0 left-0 w-1 h-full bg-foreground/20" />
		<header className="mb-8 pl-4">
			<h4 className="text-sm font-black uppercase tracking-widest text-foreground">
				{artifact.title}
			</h4>
			<p className="text-3xs font-mono text-muted-foreground mt-1 uppercase">
				Sustento Legal Inmutable · Secure Audit Log
			</p>
		</header>

		<div className="space-y-8 relative pl-4">
			<div className="absolute left-[23px] top-2 bottom-2 w-[1px] bg-border/20" />

			{artifact.payload.events.map((event, i) => (
				<div key={i} className="relative flex gap-6 group">
					<div
						className={cn(
							"z-10 mt-1 h-5 w-5 rounded-full border-2 bg-background transition-[border-color,box-shadow,transform,background-color] duration-300",
							event.type === "decision"
								? "border-foreground scale-110 shadow-glow"
								: "border-border",
						)}
					/>

					<div className="flex-1 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-2xs font-black uppercase text-foreground/80 tracking-wider">
								{event.agent}
							</span>
							<span className="text-[8px] font-mono text-muted-foreground">
								{event.time}
							</span>
						</div>
						<div className="rounded-2xl border border-border/20 bg-foreground/[0.02] p-4 transition-[background-color,border-color,box-shadow] duration-200 group-hover:border-border/40">
							<p className="text-xs text-muted-foreground leading-relaxed italic">
								{event.description}
							</p>
							<div className="mt-3 pt-3 border-t border-border/10 flex flex-wrap items-center gap-3">
								{event.impact && (
									<div className="flex items-center gap-2">
										<div className="h-1 w-1 rounded-full bg-foreground" />
										<span className="text-3xs font-black uppercase text-foreground tracking-widest antialiased">
											Impact: {event.impact}
										</span>
									</div>
								)}
								{event.rule && (
									<div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
										<BookMarked size={10} className="text-primary" />
										<span className="text-[8px] font-black text-primary uppercase tracking-tighter antialiased">
											Ref: {event.rule}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	</div>
);

// Auto-register
registerArtifact("table", TableArtifact);
