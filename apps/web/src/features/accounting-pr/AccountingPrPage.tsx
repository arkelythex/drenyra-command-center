import { GitPullRequest } from "lucide-react";
import { useAccountingProposals } from "./hooks/useAccountingProposals";

export function AccountingPrPage() {
	const {
		data: proposals = [],
		isLoading,
		isError,
		approve,
		reject,
	} = useAccountingProposals();

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10 space-y-8">
				<header className="space-y-2">
					<div className="flex items-center gap-2">
						<GitPullRequest size={22} className="text-[var(--color-info)]" />
						<h1 className="text-2xl font-bold tracking-tight">Accounting PR</h1>
					</div>
					<p className="text-xs text-[var(--text-tertiary)] max-w-2xl">
						Revisá propuestas de asientos como pull requests: diff, aprobá o
						rechazá, y recién después se mayoriza al ledger.
					</p>
				</header>

				{isLoading ? (
					<p className="text-xs text-[var(--text-tertiary)]">
						Cargando propuestas…
					</p>
				) : isError ? (
					<p className="text-xs text-[var(--color-danger)]">
						No se pudieron cargar las propuestas contables.
					</p>
				) : proposals.length === 0 ? (
					<p className="text-xs text-[var(--text-tertiary)]">
						No hay asientos en borrador pendientes de revisión.
					</p>
				) : (
					<div className="space-y-4">
						{proposals.map((proposal) => {
							const totalDebit = proposal.lines.reduce(
								(sum, line) => sum + line.debit,
								0,
							);
							const totalCredit = proposal.lines.reduce(
								(sum, line) => sum + line.credit,
								0,
							);

							return (
								<article
									key={proposal.id}
									className="rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<h2 className="text-sm font-bold">{proposal.gloss}</h2>
											<p className="text-2xs text-[var(--text-tertiary)]">
												#{proposal.entryNumber} · {proposal.date.slice(0, 10)} ·{" "}
												{proposal.status}
											</p>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-2xs font-semibold"
												disabled={reject.isPending}
												onClick={() => reject.mutate(proposal.id)}
											>
												Rechazar
											</button>
											<button
												type="button"
												className="rounded-lg bg-[var(--color-info)] px-3 py-1.5 text-2xs font-semibold text-white"
												disabled={approve.isPending}
												onClick={() => approve.mutate(proposal.id)}
											>
												Aprobar y mayorizar
											</button>
										</div>
									</div>

									<div className="rounded-xl bg-[var(--surface-2)] p-3 text-2xs space-y-2">
										<p className="font-semibold text-[var(--text-secondary)]">
											Diff propuesto
										</p>
										<p>
											Debe S/ {totalDebit.toFixed(2)} → Haber S/{" "}
											{totalCredit.toFixed(2)}
										</p>
										<ul className="space-y-1">
											{proposal.lines.map((line, index) => (
												<li
													key={`${proposal.id}-${index}`}
													className="text-[var(--text-tertiary)]"
												>
													{line.description ?? line.accountId}: D{" "}
													{line.debit.toFixed(2)} / C {line.credit.toFixed(2)}
												</li>
											))}
										</ul>
									</div>
								</article>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
