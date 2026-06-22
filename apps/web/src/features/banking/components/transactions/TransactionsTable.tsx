import { CheckCircle2, Circle } from "lucide-react";

import { cn, n } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BankTransaction } from "../../stores/banking.store.types";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";

interface TransactionsTableProps {
	transactions: BankTransaction[];
	searchQuery: string;
	onManualReconcile: (txId: string) => void;
}

export const TransactionsTable = ({
	transactions,
	searchQuery,
	onManualReconcile,
}: TransactionsTableProps) => {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();

	const q = searchQuery.trim().toLowerCase();
	const filtered = !q
		? transactions
		: transactions.filter((transaction) => {
				return (
					transaction.description.toLowerCase().includes(q) ||
					transaction.id.toLowerCase().includes(q) ||
					(transaction.reference ?? "").toLowerCase().includes(q)
				);
			});

	const formatMoney = (amount: string, currency: "PEN" | "USD") =>
		n(parseFloat(amount), currency);

	return (
		<div className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
			<div className="overflow-x-auto custom-scrollbar">
				<table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
					<thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
						<tr>
							<th className="border-b border-[var(--border-subtle)] px-8 py-4 text-2xs font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] whitespace-nowrap">
								Fecha
							</th>
							<th className="border-b border-[var(--border-subtle)] px-6 py-4 text-2xs font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] whitespace-nowrap">
								Detalle
							</th>
							<th className="border-b border-[var(--border-subtle)] px-6 py-4 text-2xs font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] text-right whitespace-nowrap">
								Monto
							</th>
							<th className="border-b border-[var(--border-subtle)] px-8 py-4 text-2xs font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] text-right whitespace-nowrap">
								Conciliación
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface-1)]">
						{filtered.map((tx) => (
							<tr
								key={tx.id}
								className="group transition-colors hover:bg-[var(--surface-hover)]"
							>
								<td className="px-8 py-4 font-mono text-label font-bold text-[var(--text-tertiary)] uppercase whitespace-nowrap tracking-[0.14em]">
									{tx.transactionDate}
								</td>
								<td className="px-6 py-4">
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
											{tx.isReconciled ? (
												<CheckCircle2
													size={14}
													className="text-[var(--text-success)]"
												/>
											) : (
												<Circle
													size={14}
													className="text-[var(--text-tertiary)]"
												/>
											)}
										</div>
										<div className="min-w-0">
											<p className="max-w-[520px] truncate text-xs font-bold uppercase tracking-tight text-[var(--text-primary)]">
												{tx.description}
											</p>
											<p className="mt-1 text-2xs font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]/80">
												REF: {(tx.reference ?? tx.id).slice(0, 16)}
											</p>
										</div>
									</div>
								</td>
								<td className="px-6 py-4 text-right">
									<span
										className={cn(
											"inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold font-mono tracking-tight tabular-nums whitespace-nowrap",
											tx.type === "CREDIT"
												? "border border-success-subtle bg-success-subtle text-success"
												: "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]",
										)}
									>
										{tx.type === "CREDIT" ? "+" : "-"}
										{formatMoney(tx.amount, "PEN")}
									</span>
								</td>
								<td className="px-8 py-4 text-right whitespace-nowrap">
									{tx.isReconciled ? (
										<span className="inline-flex items-center gap-2 rounded-xl border border-success-subtle bg-success-subtle px-3 py-1.5 text-2xs font-bold uppercase tracking-[0.18em] text-[var(--text-success)]">
											<CheckCircle2 size={12} />
											Conciliado
										</span>
									) : (
										<div className="flex justify-end">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													trigger("light");
													financialHaptics.onSave();
													onManualReconcile(tx.id);
												}}
												className="h-8 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 text-2xs font-bold uppercase tracking-[0.18em] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
											>
												Manual
											</Button>
										</div>
									)}
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={4} className="px-8 py-12 text-center">
									<div className="mx-auto max-w-sm rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-6 py-5">
										<p className="text-sm font-semibold text-[var(--text-primary)]">
											No hay transacciones para mostrar
										</p>
										<p className="mt-1 text-sm text-[var(--text-tertiary)]">
											Ajusta la búsqueda o importa un nuevo lote para continuar
											conciliando.
										</p>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
