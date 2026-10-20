import { useMemo } from "react";
import { invoiceTotalsCents } from "@/features/invoices/lib/invoice-totals";
import type { TaxType } from "@/features/invoices/lib/tax-type";
import { getActiveTaxRate } from "@/lib/latam-country-packs";

export interface InvoiceItem {
	id: string;
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: number;
	taxType: TaxType;
}

/**
 * Preview totals with the API's rule (unit price includes IGV), computed in
 * cents and returned in currency units for display.
 */
export const useInvoiceCalculations = (items: InvoiceItem[]) => {
	const totals = useMemo(() => {
		// `getActiveTaxRate` returns a whole-number percentage (18, not 0.18);
		// PE's IGV rule is always populated (`PERU_TAX_RULES`), but a static
		// fallback keeps this total-safe if that ever changed.
		const igvRateFraction = (getActiveTaxRate("pe", "IGV") ?? 18) / 100;
		const cents = invoiceTotalsCents(items, igvRateFraction);

		return {
			subtotal: cents.subtotalCents / 100,
			igvAmount: cents.igvCents / 100,
			totalAmount: cents.totalCents / 100,
		};
	}, [items]);

	return totals;
};
