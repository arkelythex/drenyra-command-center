"use client";

import { BrainCircuit } from "lucide-react";
import type { ReactElement } from "react";

export function ReviewEmptyState(): ReactElement {
	return (
		<div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
			<div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5">
				<BrainCircuit size={48} className="text-muted-foreground/20" />
			</div>
			<h3 className="text-lg font-black uppercase tracking-tighter text-muted-foreground">
				Cockpit en espera
			</h3>
			<p className="mt-2 max-w-xs text-xs uppercase tracking-widest text-muted-foreground/40 leading-relaxed">
				Selecciona una misión de la cola de trabajo para iniciar el proceso de
				arbitraje agéntico.
			</p>
		</div>
	);
}
