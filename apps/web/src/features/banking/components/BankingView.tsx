import { Suspense, lazy } from "react";
import { Download, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/ui/motion-primitives";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";

import { BANKING_TABS } from "./banking-view/constants";
import { BankingMobileToolbar } from "./banking-view/mobile-toolbar";
import { BankingSidebar } from "./banking-view/sidebar";
import { BankingDesktopHeader } from "./banking-view/desktop-header";
import { BankingGovernanceStrip } from "./banking-view/governance-strip";
import { useBankingViewController } from "../hooks/useBankingViewController";

const ImportTransactionsModal = lazy(async () => {
	const mod = await import("./transactions/ImportTransactionsModal");
	return { default: mod.ImportTransactionsModal };
});

const TransactionFilters = lazy(async () => {
	const mod = await import("./transactions/TransactionFilters");
	return { default: mod.TransactionFilters };
});

const TransactionsTable = lazy(async () => {
	const mod = await import("./transactions/TransactionsTable");
	return { default: mod.TransactionsTable };
});

const ReconciliationPanel = lazy(async () => {
	const mod = await import("./ReconciliationPanel");
	return { default: mod.ReconciliationPanel };
});

function BankingInlineSkeleton({
	className,
	lines = 3,
}: {
	className?: string;
	lines?: number;
}) {
	return (
		<div
			className={cn(
				"ui-deferred-section rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5",
				className,
			)}
		>
			<div className="space-y-3">
				{Array.from({ length: lines }).map((_, index) => (
					<div
						key={index}
						className="h-4 animate-pulse rounded-full bg-[var(--surface-3)]/72"
						style={{ width: `${92 - index * 9}%` }}
					/>
				))}
			</div>
		</div>
	);
}

export const BankingView = () => {
	const {
		activeTab,
		searchQuery,
		filters,
		trigger,
		accounts,
		selectedAccountId,
		transactions,
		unreconciledCount,
		isLoading,
		balanceValue,
		balanceFormatter,
		manualReviewRequired,
		evidenceHash,
		handleTabChange,
		handleAccountSelect,
		handleApplyFilters,
		handleManualReconcile,
		handleRegisterFunds,
		setSearchQuery,
		setFilters,
	} = useBankingViewController();

	return (
		<div className="flex flex-col lg:flex-row h-full bg-[var(--surface-1)] overflow-hidden font-sans text-[var(--text-primary)] relative">
			<MobileTabNavigation
				tabs={BANKING_TABS}
				activeTab={activeTab}
				onTabChange={handleTabChange}
				className="left-auto right-4 top-4 z-[60]"
			/>

			<BankingMobileToolbar
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
			/>

			<BankingSidebar
				activeTab={activeTab}
				accounts={accounts}
				selectedAccountId={selectedAccountId}
				unreconciledCount={unreconciledCount}
				onSelectAccount={handleAccountSelect}
			/>

			<main
				className={cn(
					"relative flex min-w-0 flex-1 flex-col overflow-hidden transition-[opacity,transform,width] duration-300",
					activeTab === "movimientos" ? "flex" : "hidden lg:flex",
				)}
			>
				<BankingDesktopHeader
					isLoading={isLoading}
					balanceValue={balanceValue}
					balanceFormatter={balanceFormatter}
					onRegisterFunds={handleRegisterFunds}
					importAction={
						<Suspense
							fallback={
								<Button variant="outline" className="h-10 rounded-xl px-5">
									Importando...
								</Button>
							}
						>
							<ImportTransactionsModal accountId={selectedAccountId} />
						</Suspense>
					}
				/>

				<BankingGovernanceStrip
					unreconciledCount={unreconciledCount}
					balanceValue={balanceValue}
					balanceFormatter={balanceFormatter}
					transactionsCount={transactions.length}
					manualReviewRequired={manualReviewRequired}
					evidenceHash={evidenceHash}
				/>

				<MotionDiv
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
					className="custom-scrollbar flex-1 overflow-auto bg-transparent p-5 pb-28 sm:p-6 sm:pb-32 lg:p-8"
				>
					<div className="mx-auto max-w-[1600px] space-y-6 2xl:max-w-[1920px]">
						<div className="hidden sm:flex justify-between items-center px-2">
							<div className="relative group w-full sm:w-[480px]">
								<Search className="absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]/60 transition-colors duration-200 group-focus-within:text-[var(--accent)]" />
								<input
									aria-label="Buscar movimiento"
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									onFocus={() => trigger("light")}
									placeholder="Rastreo por descripción, monto o token de operación..."
									className="ui-search-input h-12 w-full rounded-2xl pl-12 pr-5 text-sm font-semibold tracking-tight"
								/>
							</div>
							<Button
								variant="outline"
								className="h-12 rounded-2xl border-[var(--border-subtle)] px-6 text-2xs font-bold uppercase tracking-[0.18em] text-[var(--text-primary)] shadow-sm hover:bg-[var(--surface-hover)]"
							>
								<Download size={16} className="mr-2.5" /> Descargar Historial
							</Button>
						</div>

						<div className="flex flex-col gap-5">
							<Suspense fallback={<BankingInlineSkeleton lines={2} />}>
								<TransactionFilters
									value={filters}
									onChange={setFilters}
									onApply={handleApplyFilters}
								/>
							</Suspense>
							<Suspense fallback={<BankingInlineSkeleton lines={2} />}>
								<ReconciliationPanel
									accountId={selectedAccountId}
									unreconciledCount={unreconciledCount}
								/>
							</Suspense>
						</div>

						<Suspense
							fallback={
								<BankingInlineSkeleton className="min-h-[420px]" lines={6} />
							}
						>
							<div className="ui-deferred-section overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
								<TransactionsTable
									transactions={transactions}
									searchQuery={searchQuery}
									onManualReconcile={handleManualReconcile}
								/>
							</div>
						</Suspense>
					</div>
				</MotionDiv>
			</main>
		</div>
	);
};
