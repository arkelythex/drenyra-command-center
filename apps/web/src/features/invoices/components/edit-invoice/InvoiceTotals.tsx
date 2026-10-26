import { getActiveTaxRate } from "@/lib/latam-country-packs";

interface InvoiceTotalsProps {
	totals: {
		subtotal: number;
		igv: number;
		total: number;
	};
	currency: "PEN" | "USD";
}

export const InvoiceTotals = ({ totals, currency }: InvoiceTotalsProps) => {
	// PE's IGV rule is always populated (`PERU_TAX_RULES`); a static fallback
	// keeps this label total-safe if that ever changed.
	const igvRatePercent = getActiveTaxRate("pe", "IGV") ?? 18;

	return (
		<dl className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm tabular-nums">
			<div className="flex justify-between gap-4">
				<dt className="text-muted-foreground">Subtotal</dt>
				<dd>
					{currency} {totals.subtotal.toFixed(2)}
				</dd>
			</div>
			<div className="flex justify-between gap-4">
				<dt className="text-muted-foreground">IGV ({igvRatePercent}%)</dt>
				<dd>
					{currency} {totals.igv.toFixed(2)}
				</dd>
			</div>
			<div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
				<dt className="font-medium">Total</dt>
				<dd className="text-lg font-semibold">
					{currency} {totals.total.toFixed(2)}
				</dd>
			</div>
		</dl>
	);
};
