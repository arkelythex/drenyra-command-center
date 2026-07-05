/**
 * InvoiceListItem — single row in the draft invoice list.
 */

import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DraftInvoice } from "../SubmitBatchDialog.types";

export interface InvoiceListItemProps {
	invoice: DraftInvoice;
	onRemove: (id: string) => void;
}

export function InvoiceListItem({ invoice, onRemove }: InvoiceListItemProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-lg",
				"bg-[var(--surface-2)]/50 px-3 py-2",
			)}
		>
			<div className="flex items-center gap-2">
				<FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
				<span className="text-xs text-[var(--text-primary)]">
					{invoice.label}
				</span>
				<span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-2xs font-mono uppercase text-[var(--text-tertiary)]">
					{invoice.type}
				</span>
			</div>
			<button
				type="button"
				onClick={() => onRemove(invoice.id)}
				className="rounded p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--color-danger)]"
			>
				<X className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}
