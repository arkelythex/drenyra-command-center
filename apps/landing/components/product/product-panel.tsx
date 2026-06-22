/**
 * ProductPanel — Terminal-style data panel for product hero sections.
 * Renders a monospace trace/list with label, status badge, and numbered entries.
 *
 * @example
 * <ProductPanel
 *   label="drenyra trace"
 *   status="review ready"
 *   entries={["journal.entry.validated", "evidence.hash.attached"]}
 * />
 */

"use client";

import type { ReactElement } from "react";

export interface ProductPanelProps {
	label: string;
	status: string;
	entries: readonly string[];
}

export function ProductPanel({
	label,
	status,
	entries,
}: ProductPanelProps): ReactElement {
	return (
		<div className="rounded-3xl border border-foreground/10 bg-background/75 p-5 font-mono text-xs shadow-2xl shadow-black/30">
			<div className="mb-5 flex items-center justify-between border-b border-foreground/10 pb-4">
				<span className="text-2xs uppercase tracking-widest text-muted-foreground/50">
					{label}
				</span>
				<span className="rounded-full border border-foreground/15 px-2.5 py-1 text-2xs font-medium uppercase tracking-widest text-foreground/80">
					{status}
				</span>
			</div>
			<div className="space-y-3">
				{entries.map((row, index) => (
					<div
						key={row}
						className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/5 bg-foreground/5 px-4 py-3"
					>
						<span className="text-muted-foreground">{row}</span>
						<span className="text-product-accent">0{index + 1}</span>
					</div>
				))}
			</div>
		</div>
	);
}
