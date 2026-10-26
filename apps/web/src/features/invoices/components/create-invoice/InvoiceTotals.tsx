import type { Currency } from "@drenyra/domain";
import { getActiveTaxRate } from "@/lib/latam-country-packs";
import { n } from "@/lib/utils";

interface Props {
	totals: {
		subtotal: number;
		igvAmount: number;
		totalAmount: number;
	};
	currency: Currency;
}

export const InvoiceTotals = ({ totals, currency }: Props) => {
	// PE's IGV rule is always populated (`PERU_TAX_RULES`); a static fallback
	// keeps this label total-safe if that ever changed.
	const igvRatePercent = getActiveTaxRate("pe", "IGV") ?? 18;

	return (
		<section
			aria-label="Totales"
			className="rounded-lg border border-border bg-card p-4"
		>
			<dl className="space-y-2 text-sm">
				<div className="flex justify-between gap-4">
					<dt className="text-muted-foreground">Subtotal</dt>
					<dd className="tabular-nums">{n(totals.subtotal, currency)}</dd>
				</div>
				<div className="flex justify-between gap-4">
					<dt className="text-muted-foreground">IGV ({igvRatePercent}%)</dt>
					<dd className="tabular-nums">{n(totals.igvAmount, currency)}</dd>
				</div>
				<div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
					<dt className="font-medium">Total a pagar</dt>
					<dd className="text-xl font-semibold tabular-nums">
						{n(totals.totalAmount, currency)}
					</dd>
				</div>
			</dl>
		</section>
	);
};
