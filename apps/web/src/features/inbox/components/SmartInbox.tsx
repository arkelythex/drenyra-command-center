import { Check, Filter, Inbox, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type InboxTab, useInbox } from "../hooks/useInbox";
import type { InboxTimelineMonth } from "../inbox.types";
import { TransactionCard } from "./TransactionCard";

export const SmartInbox = () => {
	const {
		activeTab,
		setActiveTab,
		filteredTransactions,
		searchQuery,
		setSearchQuery,
		handleConfirm,
		totalCount,
	} = useInbox();
	const inboxTabs: InboxTab[] = [
		"Por Validar",
		"Observados",
		"Inconsistentes",
		"Conciliados",
	];

	return (
		<div className="flex flex-col lg:flex-row h-full bg-background overflow-hidden font-sans">
			<aside className="w-64 border-r border-border/50 bg-muted/10 flex flex-col shrink-0 hidden lg:flex">
				<div className="p-8 border-b border-border/50 bg-background">
					<h2 className="text-label font-black uppercase tracking-[0.3em] text-muted-foreground">
						Bandeja Digital
					</h2>
				</div>
				<div className="flex-1 p-6 space-y-10">
					<TimelineYear
						year={2026}
						months={[{ name: "Enero", count: totalCount, active: true }]}
					/>
					<TimelineYear
						year={2025}
						months={[{ name: "Diciembre", count: 0 }]}
					/>
				</div>
			</aside>

			<main className="flex-1 flex flex-col min-w-0">
				{/* Header - CommandDeck Style */}
				<header className="px-4 py-3 sm:px-6 sm:py-5 border-b border-border bg-background flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shrink-0 z-50 shadow-sm relative overflow-hidden">
					{/* Ambient Glow */}
					<div className="absolute inset-0 bg-gradient-to-r from-[var(--premium-action-cyan)] via-transparent to-[var(--premium-action-blue)] pointer-events-none" />

					<div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto group">
						<div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)] flex items-center justify-center border border-[rgba(var(--premium-info-rgb),0.20)] shadow-lg shadow-[0_0_24px_rgba(var(--premium-info-rgb),0.20)]">
							<Inbox
								size={20}
								className="text-[var(--premium-action-cyan)] sm:w-6 sm:h-6 opacity-80 group-hover:opacity-100 transition-opacity"
								strokeWidth={1.5}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground leading-none truncate">
								Bandeja Digital
							</h1>
							<div className="flex items-center gap-3 mt-1 sm:mt-1.5">
								<div className="flex bg-muted/50 p-0.5 rounded-lg border border-border shadow-sm overflow-x-auto no-scrollbar max-w-[200px] xs:max-w-none">
									{inboxTabs.map((tab) => (
										<button
											key={tab}
											onClick={() => setActiveTab(tab)}
											className={cn(
												"px-4 sm:px-6 h-6 text-2xs sm:text-xs font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
												activeTab === tab
													? "bg-foreground text-background shadow-sm"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											{tab}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-row items-center gap-2 sm:gap-4 w-full md:w-auto relative z-10 justify-end">
						<div className="relative group flex-1 md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
							<input
								aria-label="Buscar en bandeja de entrada"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="BUSCAR COMPROBANTE..."
								className="ui-search-input w-full h-9 rounded-lg pl-9 pr-4 text-label font-bold uppercase transition-all shadow-inner sm:h-10 sm:rounded-xl sm:text-sm"
							/>
						</div>
						<Button
							variant="outline"
							size="icon"
							aria-label="Filtrar"
							className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg sm:rounded-xl border-border/50 bg-background hover:bg-muted/50 transition-all"
						>
							<Filter size={14} />
						</Button>
					</div>
				</header>

				<div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-muted/5 custom-scrollbar pb-32 animate-entrance">
					<div className="max-w-4xl mx-auto space-y-8">
						<div className="flex items-end justify-between px-2">
							<div>
								<h2 className="text-xl font-black text-foreground uppercase tracking-tight">
									Recepción Digital
								</h2>
								<p className="text-label font-bold text-muted-foreground uppercase tracking-widest mt-1">
									Sincronización con Portal SUNAT v4.2
								</p>
							</div>
							<div className="flex items-center gap-4 bg-muted p-1 rounded-lg border border-border">
								<span className="px-3 py-1 text-xs font-black uppercase text-foreground">
									{filteredTransactions.length} Pendientes
								</span>
							</div>
						</div>

						{filteredTransactions.length === 0 ? (
							<div className="py-32 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 opacity-40">
								<Check size={32} className="mx-auto mb-4" />
								<p className="text-xs font-black uppercase tracking-widest">
									Bandeja Despejada
								</p>
							</div>
						) : (
							<div className="grid gap-6">
								{filteredTransactions.map((t) => (
									<TransactionCard
										key={t.id}
										transaction={t}
										onConfirm={handleConfirm}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

function TimelineYear({
	year,
	months,
}: {
	year: number;
	months: InboxTimelineMonth[];
}): JSX.Element {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-black text-foreground tracking-tighter px-2">
				{year}
			</h3>
			<ul className="space-y-1">
				{months.map((m) => (
					<li
						key={m.name}
						className={cn(
							"flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer group btn-soft",
							m.active
								? "bg-[rgba(var(--premium-info-rgb),0.10)] text-[var(--premium-action-cyan)] border border-[rgba(var(--premium-info-rgb),0.20)] shadow-lg shadow-[0_0_24px_rgba(var(--premium-info-rgb),0.05)]"
								: "text-muted-foreground hover:bg-muted",
						)}
					>
						<span className="uppercase tracking-widest">{m.name}</span>
						{m.count > 0 && (
							<span className="text-xs font-mono font-black">{m.count}</span>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
