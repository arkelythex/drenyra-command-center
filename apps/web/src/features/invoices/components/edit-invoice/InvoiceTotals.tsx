interface InvoiceTotalsProps {
	totals: {
		subtotal: number;
		igv: number;
		total: number;
	};
	currency: "PEN" | "USD";
}

export const InvoiceTotals = ({ totals, currency }: InvoiceTotalsProps) => {
	return (
		<div className="bg-background border-2 border-border rounded-lg p-6 space-y-3">
			<div className="flex justify-between items-center font-mono text-sm">
				<span className="text-muted-foreground">SUBTOTAL:</span>
				<span className="text-foreground font-bold">
					{currency} {totals.subtotal.toFixed(2)}
				</span>
			</div>
			<div className="flex justify-between items-center font-mono text-sm">
				<span className="text-muted-foreground">IGV (18%):</span>
				<span className="text-foreground font-bold">
					{currency} {totals.igv.toFixed(2)}
				</span>
			</div>
			<div className="h-px bg-border" />
			<div className="flex justify-between items-center font-mono text-lg">
				<span className="text-foreground font-black">TOTAL:</span>
				<span className="text-foreground font-black">
					{currency} {totals.total.toFixed(2)}
				</span>
			</div>
		</div>
	);
};
