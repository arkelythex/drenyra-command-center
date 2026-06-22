import { cn } from "@/lib/utils";
import { ExchangeRateWidget } from "../widgets/ExchangeRateWidget";
import { BankAccountsPanel } from "../BankAccountsPanel";
import type { BankingTab } from "./constants";
import type { BankAccount } from "../../stores/banking.store.types";

interface BankingSidebarProps {
	activeTab: BankingTab;
	accounts: BankAccount[];
	selectedAccountId: string | null;
	unreconciledCount: number;
	onSelectAccount: (id: string) => void;
}

export function BankingSidebar({
	activeTab,
	accounts,
	selectedAccountId,
	unreconciledCount,
	onSelectAccount,
}: BankingSidebarProps) {
	return (
		<aside
			className={cn(
				"z-[50] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm transition-[width,transform,background-color,box-shadow] duration-300 ease-out lg:flex",
				activeTab === "cuentas" || activeTab === "tasas"
					? "flex w-full"
					: "hidden lg:flex w-[360px]",
			)}
		>
			<div
				className={cn(
					"border-b border-[var(--border-subtle)] px-7 py-7",
					activeTab === "cuentas" ? "block" : "hidden lg:block",
				)}
			>
				<h2 className="text-2xs font-bold text-[var(--accent)] uppercase tracking-[0.4em] leading-none mb-2">
					Bóvedas de Activos
				</h2>
				<p className="text-xl font-bold uppercase tracking-tight text-[var(--text-primary)]">
					Tesorería Central
				</p>
			</div>
			<div
				className={cn(
					"px-5 py-5",
					activeTab === "tasas" ? "block" : "hidden lg:block",
				)}
			>
				<ExchangeRateWidget />
			</div>
			<div
				className={cn(
					"custom-scrollbar flex-1 overflow-y-auto px-5 py-5",
					activeTab === "cuentas" ? "block" : "hidden lg:block",
				)}
			>
				<BankAccountsPanel
					accounts={accounts}
					selectedAccountId={selectedAccountId}
					unreconciledCount={unreconciledCount}
					onSelect={onSelectAccount}
				/>
			</div>
		</aside>
	);
}
