import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { useDesignTokens } from "@/lib/design-tokens";
import { n } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { useLedgerViewModel } from "../hooks/useLedgerViewModel";
import { LedgerAccountsSidebar } from "./ledger-view/accounts-sidebar";
import { LedgerGovernanceStrip } from "./ledger-view/governance-strip";
import { LedgerHeader } from "./ledger-view/ledger-header";
import { LedgerTransactionsTable } from "./ledger-view/transactions-table";

export const LedgerView = () => {
	const { setIsMobileOpen } = useSidebarLayout();
	const { borderRadius, zIndex } = useDesignTokens();
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();

	const vm = useLedgerViewModel();

	const handleAccountSelect = (id: string) => {
		trigger("light");
		vm.selectAccount(id);
	};

	const showMainContent =
		!vm.fatalError &&
		vm.hasAccounts &&
		!vm.isChartLoading &&
		!vm.isGlLoading &&
		!vm.glOnlyError;

	return (
		<div className="flex flex-col lg:flex-row h-full bg-background overflow-hidden font-sans text-foreground">
			<LedgerAccountsSidebar
				accounts={vm.sidebarAccounts}
				selectedAccountId={vm.selectedAccountId}
				onSearchFocus={() => trigger("light")}
				onSelectAccount={handleAccountSelect}
			/>

			<main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
				<LedgerHeader
					periodLabel={vm.periodLabel}
					stickyZIndex={zIndex.sticky}
					iconBorderRadius={borderRadius.icon}
					onOpenMobileSidebar={() => {
						trigger("light");
						setIsMobileOpen(true);
					}}
					onExport={() => trigger("light")}
					onCreateEntry={() => financialHaptics.approval()}
				/>

				<LedgerGovernanceStrip
					entriesCount={vm.transactions.length}
					selectedAccountId={
						vm.selectedAccountId.length > 0 ? vm.selectedAccountId : "—"
					}
				/>

				<div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
					<MotionDiv
						variants={entranceVariants}
						initial="hidden"
						animate="visible"
						className="max-w-[1920px] mx-auto space-y-6"
					>
						{vm.fatalError && vm.chartErrorText ? (
							<div
								className="rounded-2xl border border-danger-subtle bg-danger-subtle px-4 py-3 text-sm text-danger"
								role="alert"
							>
								{vm.chartErrorText}
							</div>
						) : null}

						{vm.glOnlyError && vm.glErrorText ? (
							<div
								className="rounded-2xl border border-warning-subtle bg-warning-subtle/30 px-4 py-3 text-sm text-warning"
								role="alert"
							>
								{vm.glErrorText}
							</div>
						) : null}

						{vm.isChartLoading && !vm.fatalError ? (
							<div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
								Cargando plan contable…
							</div>
						) : null}

						{!vm.isChartLoading && !vm.fatalError && !vm.hasAccounts ? (
							<div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
								No hay cuentas para esta empresa.
							</div>
						) : null}

						{vm.hasAccounts && !vm.fatalError && vm.isGlLoading ? (
							<div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
								Cargando movimientos del periodo ({vm.periodLabel})…
							</div>
						) : null}

						{showMainContent ? (
							<LedgerTransactionsTable
								transactions={vm.transactions}
								formatMoney={n}
							/>
						) : null}
					</MotionDiv>
				</div>
			</main>
		</div>
	);
};
