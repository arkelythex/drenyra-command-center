/** UBL TaxTotal entry as parsed from raw XML */
export interface UblTaxTotalEntry {
	readonly TaxAmount?: { readonly "#text"?: string } | string;
	readonly TaxSubtotal?: {
		readonly TaxCategory?: {
			readonly TaxScheme?: {
				readonly ID?: string;
			};
		};
	};
}

/**
 * Extracts the IGV amount from a UBL invoice's TaxTotal structure.
 *
 * Handles both array and single-object TaxTotal variants. Falls back to
 * mathematical calculation (total - total / 1.18) when the XML amount is
 * unavailable or zero, as most Peruvian invoices are gravadas (taxed).
 *
 * @param taxTotal - The UBL TaxTotal field (array, single object, or undefined)
 * @param totalAmount - The invoice total amount for fallback calculation
 * @returns The IGV amount as a float, or 0 if neither extraction nor fallback is possible
 */
export function extractIgvFromUbl(
	taxTotal: UblTaxTotalEntry | UblTaxTotalEntry[] | undefined,
	totalAmount: number,
): number {
	let igvAmount = 0;

	if (Array.isArray(taxTotal)) {
		const igvTax = taxTotal.find(
			(t: UblTaxTotalEntry) =>
				t.TaxSubtotal?.TaxCategory?.TaxScheme?.ID === "1000" || t.TaxAmount,
		);
		const taxAmount = igvTax?.TaxAmount;
		igvAmount = parseFloat(
			(taxAmount && typeof taxAmount === "object"
				? taxAmount["#text"]
				: taxAmount) || "0",
		);
	} else if (taxTotal) {
		const taxAmount = taxTotal.TaxAmount;
		igvAmount = parseFloat(
			(taxAmount && typeof taxAmount === "object"
				? taxAmount["#text"]
				: taxAmount) || "0",
		);
	}

	if (igvAmount === 0 && totalAmount > 0) {
		igvAmount = totalAmount - totalAmount / 1.18;
	}

	return igvAmount;
}
