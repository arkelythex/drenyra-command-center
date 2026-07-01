import { FileCheck, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LedgerTransaction } from "./ledger-data";

interface LedgerTransactionsTableProps {
	transactions: LedgerTransaction[];
	formatMoney: (value: number) => string;
}

export function LedgerTransactionsTable({
	transactions,
	formatMoney,
}: LedgerTransactionsTableProps) {
	return (
		<Card className="overflow-hidden rounded-2xl border-border/60 bg-card/80 shadow-sm">
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse min-w-[1000px]">
					<thead>
						<tr className="border-b border-border/50 bg-muted/20">
							<th className="px-8 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground w-48">
								Fecha / Voucher
							</th>
							<th className="px-6 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
								Glosa Operativa
							</th>
							<th className="px-6 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground text-center w-32">
								Ref. Doc
							</th>
							<th className="px-8 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground text-right w-40">
								Debe
							</th>
							<th className="px-8 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground text-right w-40">
								Haber
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/30">
						{transactions.map((transaction) => (
							<tr
								key={transaction.id}
								className="group hover:bg-info-subtle transition-colors duration-300"
							>
								<td className="px-8 py-5 align-top">
									<div className="flex flex-col gap-1">
										<span className="text-label font-black font-mono text-foreground tracking-tight">
											{transaction.date}
										</span>
										<span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest font-mono group-hover:text-info transition-colors">
											{transaction.voucher}
										</span>
									</div>
								</td>
								<td className="px-6 py-5 align-top">
									<div className="flex flex-col gap-2">
										<p className="text-xs font-bold text-foreground/90 uppercase tracking-tight leading-relaxed max-w-md">
											{transaction.glosa}
										</p>
										<div className="flex items-center gap-3">
											<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/30 border border-border/50 text-xs font-mono font-bold text-muted-foreground group-hover:border-info-subtle transition-colors">
												<span className="w-1 h-1 rounded-full bg-info" />
												CTA {transaction.cuenta}
											</span>
											{transaction.bancarizado ? (
												<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-success-soft text-success border border-success-subtle text-xs font-black uppercase tracking-wider shadow-sm">
													<FileCheck size={10} /> Bancarizado
												</span>
											) : null}
										</div>
									</div>
								</td>
								<td className="px-6 py-5 align-top text-center">
									<div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1 text-label font-bold uppercase text-muted-foreground shadow-sm  transition-[background-color,border-color,box-shadow,color] duration-200 group-hover:border-info-subtle group-hover:shadow-md">
										<FileText size={10} className="opacity-50" />
										{transaction.doc}
									</div>
								</td>
								<td className="px-8 py-5 align-top text-right">
									<span
										className={cn(
											"font-mono font-black text-sm tracking-tighter tabular-nums block py-1 px-2 rounded-lg transition-colors",
											transaction.debe > 0
												? "text-foreground bg-muted/50"
												: "text-muted-foreground/30",
										)}
									>
										{formatMoney(transaction.debe)}
									</span>
								</td>
								<td className="px-8 py-5 align-top text-right">
									<span
										className={cn(
											"font-mono font-black text-sm tracking-tighter tabular-nums block py-1 px-2 rounded-lg transition-colors",
											transaction.haber > 0
												? "text-foreground bg-muted/50"
												: "text-muted-foreground/30",
										)}
									>
										{formatMoney(transaction.haber)}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
