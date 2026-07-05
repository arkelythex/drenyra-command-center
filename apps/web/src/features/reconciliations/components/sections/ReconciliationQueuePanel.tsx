import { ArrowRightLeft, CheckCircle2, Search } from "lucide-react";
import { ConfidenceBadge } from "@/components/agentic";
import { cn } from "@/lib/utils";
import type { ReconciliationTransaction } from "../../reconciliation.types";

interface ReconciliationQueuePanelProps {
	formatMoney: (value: number) => string;
	selectedTransactionId: string;
	transactions: readonly ReconciliationTransaction[];
	onSelect: (transactionId: string) => void;
}

function statusLabel(status: ReconciliationTransaction["status"]) {
	switch (status) {
		case "matched":
			return "Matched";
		case "suggested":
			return "Suggested";
		case "needs_review":
			return "Needs review";
		default:
			return "Unmatched";
	}
}

function statusClasses(status: ReconciliationTransaction["status"]) {
	switch (status) {
		case "matched":
			return "border-success-muted bg-success-subtle";
		case "suggested":
			return "border-info-muted bg-info-subtle";
		case "needs_review":
			return "border-warning-muted bg-warning-subtle";
		default:
			return "border-danger-subtle bg-danger-subtle";
	}
}

export function ReconciliationQueuePanel({
	formatMoney,
	selectedTransactionId,
	transactions,
	onSelect,
}: ReconciliationQueuePanelProps) {
	return (
		<aside className="flex min-h-0 flex-col border-r border-border/50 bg-[var(--surface-1)]">
			<div className="border-b border-border/50 px-4 py-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-label font-black uppercase tracking-[0.18em] text-muted-foreground">
							Queue
						</p>
						<h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
							Movimientos por resolver
						</h2>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-[var(--surface-2)] text-info">
						<ArrowRightLeft className="h-4 w-4" />
					</div>
				</div>

				<div className="relative mt-4">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value=""
						readOnly
						placeholder="Buscar movimiento..."
						aria-label="Buscar conciliación"
						className="h-10 w-full rounded-xl border border-border/60 bg-[var(--surface-2)] pl-10 pr-3 text-sm text-muted-foreground outline-none"
					/>
				</div>
			</div>

			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
				{transactions.map((transaction) => {
					const isSelected = transaction.id === selectedTransactionId;

					return (
						<button
							key={transaction.id}
							type="button"
							onClick={() => onSelect(transaction.id)}
							className={cn(
								"w-full rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-[var(--border-default)]",
								statusClasses(transaction.status),
								isSelected &&
									"ring-1 ring-[rgba(var(--premium-info-rgb),0.35)] shadow-[0_12px_24px_rgba(0,0,0,0.12)]",
							)}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-foreground">
										{transaction.description}
									</p>
									<p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
										{transaction.date}
									</p>
								</div>
								{transaction.status === "matched" ? (
									<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
								) : null}
							</div>

							<div className="mt-4 flex items-center justify-between gap-3">
								<p className="font-mono text-sm font-semibold tabular-nums text-foreground">
									{formatMoney(transaction.amount)}
								</p>
								<ConfidenceBadge score={transaction.confidence} />
							</div>

							<div className="mt-3 flex items-center justify-between gap-3 text-xs">
								<span className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
									{statusLabel(transaction.status)}
								</span>
								<span className="line-clamp-1 text-right text-muted-foreground">
									{transaction.notes}
								</span>
							</div>
						</button>
					);
				})}
			</div>
		</aside>
	);
}
