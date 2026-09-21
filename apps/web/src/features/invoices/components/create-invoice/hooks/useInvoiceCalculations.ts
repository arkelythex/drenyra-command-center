import { useMemo } from "react";
import { isTaxable, type TaxType } from "@/features/invoices/lib/tax-type";
import { getActiveTaxRate } from "@/lib/latam-country-packs";

export interface InvoiceItem {
	id: string;
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: number;
	taxType: TaxType;
}

export const useInvoiceCalculations = (items: InvoiceItem[]) => {
	const totals = useMemo(() => {
		// `getActiveTaxRate` returns a whole-number percentage (18, not 0.18);
		// PE's IGV rule is always populated (`PERU_TAX_RULES`), but a static
		// fallback keeps this total-safe if that ever changed.
		const igvRateFraction = (getActiveTaxRate("pe", "IGV") ?? 18) / 100;

		let subtotal = 0;
		let igvAmount = 0;

		items.forEach((item) => {
			const itemSubtotal = item.quantity * item.unitPrice;
			const itemIgv = isTaxable(item.taxType)
				? itemSubtotal * igvRateFraction
				: 0;

			subtotal += itemSubtotal;
			igvAmount += itemIgv;
		});

		return {
			subtotal,
			igvAmount,
			totalAmount: subtotal + igvAmount,
		};
	}, [items]);

	return totals;
};
