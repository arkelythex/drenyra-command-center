import { ChevronRight, Database, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LedgerAccount } from "./ledger-data";

interface LedgerAccountsSidebarProps {
	accounts: LedgerAccount[];
	selectedAccountId: string;
	onSearchFocus: () => void;
	onSelectAccount: (id: string) => void;
}

export function LedgerAccountsSidebar({
	accounts,
	selectedAccountId,
	onSearchFocus,
	onSelectAccount,
}: LedgerAccountsSidebarProps) {
	return (
		<aside className="w-full lg:w-80 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-border/50 bg-muted/5 flex flex-col shrink-0 order-first relative z-20">
			<div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent lg:block hidden" />

			<div className="p-4 sm:p-6 border-b border-[var(--border-default)] bg-[var(--bg-1)] sticky top-0 z-10">
				<h2 className="text-label font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 mb-4">
					<Database size={12} className="text-info" /> Plan Contable
				</h2>
				<div className="relative group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
					<Input
						onFocus={onSearchFocus}
						placeholder="BUSCAR CUENTA..."
						className="h-10 rounded-xl border-border/50 bg-muted/30 pl-10 text-label font-bold uppercase tracking-wide shadow-sm transition-[background-color,border-color,box-shadow,color] duration-200 focus:bg-background focus:border-info-subtle"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
				{accounts.map((account) => (
					<button
						key={account.id}
						onClick={() => onSelectAccount(account.id)}
						className={cn(
							"relative group flex w-full items-center justify-between overflow-hidden rounded-xl px-4 py-3 transition-[background-color,border-color,box-shadow,color,transform,padding] duration-200",
							selectedAccountId === account.id
								? "translate-x-0.5 bg-info text-[var(--color-text-inverse)] shadow-lg shadow-info-glow"
								: "hover:bg-muted/10 text-muted-foreground hover:text-foreground hover:pl-5",
						)}
					>
						{selectedAccountId === account.id ? (
							<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/15 to-transparent" />
						) : null}

						<div className="flex items-center gap-3 relative z-10 min-w-0">
							<span
								className={cn(
									"font-mono text-2xs font-bold px-1.5 py-0.5 rounded border border-current opacity-80",
									selectedAccountId === account.id
										? "border-background/30"
										: "border-border",
								)}
							>
								{account.code}
							</span>
							<span className="text-label font-bold uppercase tracking-tight truncate w-full text-left leading-tight">
								{account.name}
							</span>
						</div>
						{selectedAccountId === account.id ? (
							<ChevronRight
								size={14}
								className="text-background/80 animate-in slide-in-from-left-2 fade-in duration-300"
							/>
						) : null}
					</button>
				))}
			</div>
		</aside>
	);
}
