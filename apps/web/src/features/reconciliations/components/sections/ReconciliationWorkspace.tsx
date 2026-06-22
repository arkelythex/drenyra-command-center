import {
	AlertCircle,
	ArrowRightLeft,
	CheckCircle2,
	FileText,
	Plus,
	Search,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";

interface BankTransaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	matchedId?: string;
	matchScore: number;
}
interface LedgerEntry {
	id: string;
	date: string;
	vendor: string;
	amount: number;
}

interface ReconciliationWorkspaceProps {
	bankTxs: BankTransaction[];
	ledgerEntries: LedgerEntry[];
	formatMoney: (v: number) => string;
	triggerHaptic: (style: "light" | "medium" | "heavy") => void;
}

export const ReconciliationWorkspace: React.FC<
	ReconciliationWorkspaceProps
> = ({ bankTxs, ledgerEntries, formatMoney, triggerHaptic }) => {
	return (
		<div className="flex-1 flex overflow-hidden bg-background">
			{/* BANK SIDE */}
			<div className="flex-1 flex flex-col border-r border-border/50">
				<div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-[var(--bg-1)] p-4">
					<h2 className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground">
						Extracto Bancario
					</h2>
					<div className="relative group w-48">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
						<input
							type="text"
							placeholder="BUSCAR MOVIMIENTO..."
							aria-label="Buscar en espacio de trabajo"
							className="h-7 w-full rounded-lg border border-border/50 bg-muted/30 pl-8 pr-3 text-xs font-bold uppercase tracking-wider transition-[background-color,border-color,box-shadow,color] focus:bg-background focus:outline-none focus-visible:border-primary"
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
					<div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 pl-2 opacity-50">
						15 de Enero
					</div>
					{bankTxs.map((tx) => (
						<button
							key={tx.id}
							type="button"
							onClick={() => triggerHaptic("light")}
							className="block w-full text-left"
						>
							<div
								className={cn(
									"group relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-lg)] transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.99]",
									tx.matchScore === 0 &&
										"z-10 scale-[1.02] border-danger-subtle",
								)}
							>
								<div className="relative z-10 flex min-w-0 items-center gap-4">
									<div
										className={cn(
											"w-1 h-8 rounded-full",
											tx.matchScore === 0
												? "ui-dot-danger shadow-danger-glow"
												: "ui-dot-success",
										)}
									/>
									<div className="min-w-0">
										<p
											className={cn(
												"font-bold text-xs uppercase truncate leading-tight tracking-tight",
												LEGIBILITY.textShadow.light,
											)}
										>
											{tx.description}
										</p>
										<div
											className={cn(
												"flex items-center gap-1.5 mt-1 text-xs font-black uppercase tracking-widest",
												tx.matchScore === 0
													? "text-danger"
													: "text-muted-foreground",
											)}
										>
											{tx.matchedId ? (
												<span className="flex items-center gap-1 text-success">
													<CheckCircle2 size={10} /> Auto-Match {tx.matchScore}%
												</span>
											) : (
												<span className="flex items-center gap-1 text-danger">
													<AlertCircle size={10} /> Sin Registro
												</span>
											)}
										</div>
									</div>
								</div>
								<p
									className={cn(
										"relative z-10 font-mono text-sm font-bold tracking-tighter tabular-nums",
										LEGIBILITY.textShadow.medium,
									)}
								>
									{formatMoney(tx.amount)}
								</p>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* SYNC AXIS - CENTER */}
			<div className="relative z-10 flex w-12 flex-col items-center justify-center border-r border-border/50 bg-[var(--bg-1)]">
				<div className="h-full w-px bg-border/50 absolute inset-y-0 left-1/2 -translate-x-1/2" />
				<div
					onClick={() => triggerHaptic("medium")}
					className="group relative z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-[background-color,border-color,box-shadow,color,transform] hover:scale-[1.05] hover:border-info-muted hover:text-info hover:shadow-info-glow active:scale-95"
				>
					<ArrowRightLeft
						size={16}
						className="group-hover:rotate-180 transition-transform duration-500"
					/>
				</div>
			</div>

			{/* LEDGER SIDE */}
			<div className="flex-1 flex flex-col bg-muted/5">
				<div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-[var(--bg-1)] p-4">
					<h2 className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground">
						Libro Auxiliar
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => triggerHaptic("light")}
						className="h-7 text-xs font-black uppercase transition-colors hover:bg-info-muted hover:text-info"
					>
						<Plus size={12} className="mr-1" /> Nuevo Asiento
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
					<div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 pl-2 opacity-50">
						Sugerencias (IA)
					</div>
					{ledgerEntries.map((entry) => (
						<div
							key={entry.id}
							onClick={() => triggerHaptic("light")}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerHaptic("light"); } }}
							className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-4 transition-[background-color,border-color,box-shadow,transform] hover:border-info-muted hover:bg-info-subtle"
						>
							<div className="flex items-center gap-4 min-w-0">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-muted text-info">
									<FileText size={16} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<p className="font-bold text-xs uppercase truncate leading-tight tracking-tight text-foreground/80 transition-colors group-hover:text-info">
										{entry.vendor}
									</p>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-info">
											AST-{entry.id}
										</span>
									</div>
								</div>
							</div>
							<p className="font-mono font-medium text-sm tracking-tighter tabular-nums text-muted-foreground group-hover:text-foreground transition-colors">
								{formatMoney(entry.amount)}
							</p>
						</div>
					))}

					{/* Empty State / Ghost Placeholder */}
					<div className="p-8 border-2 border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center text-center opacity-40 hover:opacity-70 transition-opacity">
						<Search className="h-6 w-6 mb-2 text-muted-foreground" />
						<p className="text-label font-bold uppercase tracking-widest text-muted-foreground">
							No hay más coincidencias
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
