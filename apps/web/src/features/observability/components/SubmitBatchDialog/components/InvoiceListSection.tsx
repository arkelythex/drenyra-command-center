/**
 * InvoiceListSection — list of draft invoices with a clear-all button.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DraftInvoice } from "../SubmitBatchDialog.types";
import { InvoiceListItem } from "./InvoiceListItem";

export interface InvoiceListSectionProps {
	invoices: DraftInvoice[];
	onRemove: (id: string) => void;
	onClear: () => void;
}

export function InvoiceListSection({
	invoices,
	onRemove,
	onClear,
}: InvoiceListSectionProps) {
	return (
		<div className="space-y-2">
			<Label className="text-xs text-[var(--text-secondary)]">
				Invoices to Submit ({invoices.length})
			</Label>
			<div className="max-h-[200px] space-y-1.5 overflow-y-auto">
				{invoices.map((inv) => (
					<InvoiceListItem key={inv.id} invoice={inv} onRemove={onRemove} />
				))}
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={onClear}
					className="text-xs"
				>
					Clear All
				</Button>
			</div>
		</div>
	);
}
