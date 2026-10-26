import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";
import { getActiveTaxRate } from "@/lib/latam-country-packs";
import type { InvoiceItem } from "./hooks/useInvoiceCalculations";
import { InvoiceLineItem } from "./InvoiceLineItem";

interface Props {
	items: InvoiceItem[];
	onUpdate: (
		id: string,
		field: keyof InvoiceItem,
		value: InvoiceItem[keyof InvoiceItem],
	) => void;
	onAdd: () => void;
	onRemove: (id: string) => void;
	currency: string;
}

export const InvoiceLineItems = ({
	items,
	onUpdate,
	onAdd,
	onRemove,
	currency,
}: Props) => {
	const { trigger } = useHaptics();

	// `getActiveTaxRate` returns a whole-number percentage (18, not 0.18); PE's
	// IGV rule is always populated (`PERU_TAX_RULES`), but a static fallback
	// keeps this total-safe if that ever changed.
	const igvRatePercent = getActiveTaxRate("pe", "IGV") ?? 18;

	const handleAdd = () => {
		trigger("light");
		onAdd();
	};

	const handleRemove = (id: string) => {
		trigger("error");
		onRemove(id);
	};

	return (
		<section aria-labelledby="invoice-items-title" className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<h3 id="invoice-items-title" className="text-base font-semibold">
					Conceptos
				</h3>
				<Button
					type="button"
					variant="outline"
					onClick={handleAdd}
					className="h-11 gap-1.5 px-4"
				>
					<Plus aria-hidden="true" className="size-4" />
					Agregar concepto
				</Button>
			</div>

			{items.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
					Aún no hay conceptos. Agrega el primer bien o servicio a facturar.
				</p>
			) : (
				<ul className="space-y-3">
					{items.map((item, index) => (
						<InvoiceLineItem
							key={item.id}
							item={item}
							index={index}
							currency={currency}
							igvRatePercent={igvRatePercent}
							onUpdate={onUpdate}
							onRemove={handleRemove}
							onFocusField={() => trigger("light")}
						/>
					))}
				</ul>
			)}
		</section>
	);
};
