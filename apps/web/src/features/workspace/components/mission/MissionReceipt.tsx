import { CheckCircle2, Copy } from "lucide-react";

interface MissionReceiptProps {
	receiptId: string;
	/** SHA-256 of the signed decision; empty when the server did not send one. */
	receiptHash: string;
	onCopy: (value: string) => void;
}

interface ReceiptRowProps {
	label: string;
	value: string;
	testId: string;
	copyLabel: string;
	onCopy: (value: string) => void;
}

function ReceiptRow({
	label,
	value,
	testId,
	copyLabel,
	onCopy,
}: ReceiptRowProps) {
	return (
		<div className="space-y-1">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="flex items-start gap-2">
				<code
					data-testid={testId}
					className="min-w-0 flex-1 break-all font-mono text-xs text-foreground"
				>
					{value}
				</code>
				<button
					type="button"
					onClick={() => onCopy(value)}
					aria-label={copyLabel}
					className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<Copy aria-hidden="true" className="size-3.5" />
					Copiar
				</button>
			</dd>
		</div>
	);
}

/** Proof of the approval decision: its id and the hash anyone can recompute. */
export function MissionReceipt({
	receiptId,
	receiptHash,
	onCopy,
}: MissionReceiptProps) {
	return (
		<section className="w-full max-w-xl space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
			<h3 className="flex items-center gap-2 text-sm font-medium">
				<CheckCircle2 aria-hidden="true" className="size-4 text-success" />
				Recibo de aprobación
			</h3>
			<dl className="space-y-3">
				<ReceiptRow
					label="ID del recibo"
					value={receiptId}
					testId="receipt-id"
					copyLabel="Copiar ID del recibo"
					onCopy={onCopy}
				/>
				{receiptHash ? (
					<ReceiptRow
						label="Hash SHA-256"
						value={receiptHash}
						testId="receipt-hash"
						copyLabel="Copiar hash del recibo"
						onCopy={onCopy}
					/>
				) : null}
			</dl>
		</section>
	);
}
