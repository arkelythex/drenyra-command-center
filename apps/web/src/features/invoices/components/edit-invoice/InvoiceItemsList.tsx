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
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<label className="text-label font-black uppercase tracking-widest text-muted-foreground">
					Detalle de Items
				</label>
				<Button
					size="sm"
					variant="outline"
					onClick={onAddItem}
					className="h-8 text-label font-black"
				>
					<Plus size={14} /> AGREGAR ITEM
				</Button>
			</div>

			<div className="space-y-3">
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
			</div>
		</div>
	);
};
