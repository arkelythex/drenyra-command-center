"use client";

import type { ReactElement } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { BatchCompleteEvent } from "../inbox.schema";

type InboxResultSummaryProps = {
	batch: BatchCompleteEvent;
	onReset?: () => void;
};

export function InboxResultSummary({
	batch,
	onReset,
}: InboxResultSummaryProps): ReactElement {
	return (
		<section className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4">
			<h3 className="text-sm font-bold">Batch completado</h3>
			<p className="mt-2 text-xs text-[var(--text-secondary)]">{batch.summary}</p>
			<ul className="mt-4 grid gap-2 sm:grid-cols-3">
				<li className="flex items-center gap-2 rounded-lg bg-[var(--surface-1)]/80 px-3 py-2 text-xs">
					<CheckCircle2 size={16} className="text-[var(--color-success)]" />
					{batch.ready} listas
				</li>
				<li className="flex items-center gap-2 rounded-lg bg-[var(--surface-1)]/80 px-3 py-2 text-xs">
					<AlertTriangle size={16} className="text-[var(--color-warning)]" />
					{batch.needsReview} revisión
				</li>
				<li className="flex items-center gap-2 rounded-lg bg-[var(--surface-1)]/80 px-3 py-2 text-xs">
					<XCircle size={16} className="text-[var(--color-danger)]" />
					{batch.errors} error
				</li>
			</ul>
			<div className="mt-4 flex flex-wrap gap-2">
				<button
					type="button"
					className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5 text-2xs font-semibold"
					onClick={onReset}
				>
					Subir otro batch
				</button>
				<button
					type="button"
					className="rounded-lg bg-[var(--color-info)] px-3 py-1.5 text-2xs font-semibold text-white"
				>
					Ir a declarar →
				</button>
			</div>
		</section>
	);
}
