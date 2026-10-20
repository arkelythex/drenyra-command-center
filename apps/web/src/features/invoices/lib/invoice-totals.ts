/**
 * Invoice line and document totals in integer cents.
 *
 * Mirrors the API's `calculateItems` (create and update invoice commands):
 * the unit price a user types INCLUDES IGV for GRAVADO lines, so
 * total = round(price × quantity), base = round(total / (1 + rate)) and
 * IGV = total − base. Using the same rule keeps the preview equal to what
 * the API stores and sends to SUNAT.
 *
 * @module features/invoices/lib/invoice-totals
 */

import { isTaxable, type TaxType } from "./tax-type";

export interface LineInput {
	quantity: number | string;
	unitPrice: number | string;
	taxType: TaxType;
}

export interface TotalsCents {
	subtotalCents: number;
	igvCents: number;
	totalCents: number;
}

function toNumber(value: number | string | null | undefined): number {
	const parsed =
		typeof value === "number" ? value : Number.parseFloat(value ?? "");
	return Number.isFinite(parsed) ? parsed : 0;
}

/** Decimal amount (API string or form number) → integer cents, rounded like `Money.fromAmount`. */
export function decimalToCents(
	value: number | string | null | undefined,
): number {
	return Math.round(toNumber(value) * 100);
}

/** Integer cents → `"1180.00"`, the decimal string the API expects. */
export function centsToDecimal(cents: number): string {
	const abs = Math.abs(Math.round(cents));
	const sign = cents < 0 ? "-" : "";
	return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** One line, IGV-inclusive price, rounded to the cent once per step like the API. */
export function lineTotalsCents(line: LineInput, rate: number): TotalsCents {
	const totalCents = Math.round(
		decimalToCents(line.unitPrice) * toNumber(line.quantity),
	);
	if (!isTaxable(line.taxType)) {
		return { subtotalCents: totalCents, igvCents: 0, totalCents };
	}
	const subtotalCents = Math.round(totalCents / (1 + rate));
	return { subtotalCents, igvCents: totalCents - subtotalCents, totalCents };
}

/** Sum of the already-rounded lines, as the API sums its line `Money`s. */
export function invoiceTotalsCents(
	lines: readonly LineInput[],
	rate: number,
): TotalsCents {
	return lines.reduce<TotalsCents>(
		(sum, line) => {
			const t = lineTotalsCents(line, rate);
			return {
				subtotalCents: sum.subtotalCents + t.subtotalCents,
				igvCents: sum.igvCents + t.igvCents,
				totalCents: sum.totalCents + t.totalCents,
			};
		},
		{ subtotalCents: 0, igvCents: 0, totalCents: 0 },
	);
}
