import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	type InvoiceItem,
	InvoiceItemRow,
	type InvoiceItemUpdate,
} from "./InvoiceItemRow";

interface InvoiceItemsListProps {
	items: InvoiceItem[];
	currency: "PEN" | "USD";
	onUpdate: InvoiceItemUpdate;
	onAddItem: () => void;
	onRemoveItem: (index: number) => void;
}

export const InvoiceItemsList = ({
	items,
	currency,
	onUpdate,
	onAddItem,
	onRemoveItem,
}: InvoiceItemsListProps) => {
	return (
		<section aria-labelledby="edit-invoice-items" className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<h3 id="edit-invoice-items" className="text-base font-semibold">
					Conceptos
				</h3>
				<Button
					type="button"
					variant="outline"
					onClick={onAddItem}
					className="h-11 gap-1.5 px-4"
				>
					<Plus aria-hidden="true" className="size-4" />
					Agregar concepto
				</Button>
			</div>
			<ul className="space-y-3">
				{items.map((item, index) => (
					<InvoiceItemRow
						key={item.id}
						item={item}
						index={index}
						currency={currency}
						onUpdate={onUpdate}
						onRemove={onRemoveItem}
						canRemove={items.length > 1}
					/>
				))}
			</ul>
		</section>
	);
};
