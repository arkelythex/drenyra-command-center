import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { useInvoicesBoardController } from "../hooks/useInvoicesBoardController";
import {
	loadCreateInvoiceDialogModule,
	preloadCreateInvoiceDialog,
} from "./create-invoice/create-invoice-dialog-loader";
import { InvoicesBoardDesktopHeader } from "./invoices-board/desktop-header";
import { InvoicesBoardMobileToolbar } from "./invoices-board/mobile-toolbar";
import { BOARD_TABS } from "./invoices-board.constants";

const CreateInvoiceDialog = lazy(async () => {
	const mod = await loadCreateInvoiceDialogModule();
	return { default: mod.CreateInvoiceDialog };
});

const InvoicesSummaryBoard = lazy(async () => {
	const mod = await import("./InvoicesSummaryBoard");
	return { default: mod.InvoicesSummaryBoard };
});

const InvoicesAgingTab = lazy(async () => {
	const mod = await import("./tabs/InvoicesAgingTab");
	return { default: mod.InvoicesAgingTab };
});

function LazyInvoiceDialogStatus() {
	return (
		<div className="sr-only" role="status">
			Cargando diálogo de factura
		</div>
	);
}

const InvoicesBoardContent = () => {
	const {
		activeView,
		showCreateModal,
		searchQuery,
		normalizedQuery,
		companyId,
		isLoading,
		error,
		hasSearchResults,
		filteredInvoicesByStatus,
		filteredColumnTotals,
		allInvoices,
		createInvoice,
		updateInvoiceStatus,
		formatMoney,
		handleViewChange,
		handleMobileTabChange,
		setShowCreateModal,
		setSearchQuery,
	} = useInvoicesBoardController();

	const summaryMetrics = {
		draftCount: filteredInvoicesByStatus.draft.length,
		openCount:
			filteredInvoicesByStatus.sent.length +
			filteredInvoicesByStatus.overdue.length,
		overdueCount: filteredInvoicesByStatus.overdue.length,
		openTotal: filteredColumnTotals.sent + filteredColumnTotals.overdue,
	};

	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
			<MobileTabNavigation
				tabs={BOARD_TABS}
				activeTab={activeView}
				onTabChange={handleMobileTabChange}
				className="left-auto right-4 top-4"
			/>

			<InvoicesBoardMobileToolbar
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
				onCreateInvoice={() => setShowCreateModal(true)}
				onCreateInvoiceIntent={preloadCreateInvoiceDialog}
			/>

			<InvoicesBoardDesktopHeader
				activeView={activeView}
				searchQuery={searchQuery}
				draftCount={summaryMetrics.draftCount}
				openCount={summaryMetrics.openCount}
				overdueCount={summaryMetrics.overdueCount}
				openTotal={formatMoney(summaryMetrics.openTotal)}
				onSearchQueryChange={setSearchQuery}
				onCreateInvoice={() => setShowCreateModal(true)}
				onCreateInvoiceIntent={preloadCreateInvoiceDialog}
				onViewChange={handleViewChange}
			/>

			<div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto bg-background px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
				<div className="h-full w-full">
					{activeView === "summary" ? (
						<Suspense
							fallback={
								<div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-border bg-card">
									<div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
										Cargando tablero de facturas...
									</div>
								</div>
							}
						>
							<InvoicesSummaryBoard
								isLoading={isLoading}
								error={error}
								normalizedQuery={normalizedQuery}
								hasSearchResults={hasSearchResults}
								searchQuery={searchQuery}
								filteredInvoicesByStatus={filteredInvoicesByStatus}
								filteredColumnTotals={filteredColumnTotals}
								allInvoices={allInvoices}
								onUpdateInvoiceStatus={updateInvoiceStatus}
								onCreateInvoice={() => setShowCreateModal(true)}
								onCreateInvoiceIntent={preloadCreateInvoiceDialog}
								formatMoney={formatMoney}
							/>
						</Suspense>
					) : (
						<Suspense
							fallback={
								<div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-border bg-card">
									<div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
										Cargando antigüedad de saldos...
									</div>
								</div>
							}
						>
							<InvoicesAgingTab />
						</Suspense>
					)}
				</div>
			</div>

			{showCreateModal ? (
				<Suspense fallback={<LazyInvoiceDialogStatus />}>
					<CreateInvoiceDialog
						open={showCreateModal}
						onOpenChange={setShowCreateModal}
						onSubmit={createInvoice}
						companyId={companyId}
					/>
				</Suspense>
			) : null}
		</div>
	);
};

export const InvoicesBoard = () => (
	<Suspense
		fallback={
			<div className="flex h-full items-center justify-center bg-background">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
			</div>
		}
	>
		<InvoicesBoardContent />
	</Suspense>
);
