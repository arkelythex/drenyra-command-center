import { Plus, Search } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { Input } from "@/components/ui/input";
import { n } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import type { Bill, BillsView } from "../hooks/use-bills.types";
import { useBills } from "../hooks/useBills";

// Sections
import { BillsBoardHeader } from "./sections/BillsBoardHeader";
import { BillsKanbanView } from "./sections/BillsKanbanView";

const BillsAgingTab = lazy(() =>
	import("./tabs/BillsAgingTab").then((module) => ({
		default: module.BillsAgingTab,
	})),
);

const BOARD_TABS: ReadonlyArray<{ id: BillsView; label: string }> = [
	{ id: "summary", label: "Tablero" },
	{ id: "aging", label: "Antigüedad" },
];

export const BillsBoard = () => {
	const {
		billsByStatus,
		activeView,
		setActiveView,
		updateBillStatus,
		pendingBillId,
		isLoading,
		error,
	} = useBills();

	const { setIsMobileOpen } = useSidebarLayout();
	const [searchQuery, setSearchQuery] = useState("");

	const handleMobileTabChange = (id: string) => {
		if (id === "summary" || id === "aging") {
			setActiveView(id);
		}
	};

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filteredBills = useMemo(() => {
		if (!normalizedQuery) return billsByStatus;

		const include = (bill: Bill) =>
			bill.vendor.name.toLowerCase().includes(normalizedQuery) ||
			bill.invoiceNumber.toLowerCase().includes(normalizedQuery);

		return {
			review: billsByStatus.review.filter(include),
			approval: billsByStatus.approval.filter(include),
			payment: billsByStatus.payment.filter(include),
			paid: billsByStatus.paid.filter(include),
		};
	}, [billsByStatus, normalizedQuery]);

	const hasResults =
		filteredBills.review.length +
			filteredBills.approval.length +
			filteredBills.payment.length +
			filteredBills.paid.length >
		0;

	const formatStatusTotal = (items: Bill[]) => {
		const totals = items.reduce(
			(acc, bill) => {
				const currency = bill.currency === "USD" ? "USD" : "PEN";
				acc[currency] += bill.amount;
				return acc;
			},
			{ PEN: 0, USD: 0 },
		);

		const parts: string[] = [];
		if (totals.PEN > 0) {
			parts.push(n(totals.PEN));
		}
		if (totals.USD > 0) {
			parts.push(n(totals.USD, "USD"));
		}

		return parts.join(" + ") || "—";
	};

	const summaryMetrics = useMemo(() => {
		const allOpenBills = [
			...filteredBills.review,
			...filteredBills.approval,
			...filteredBills.payment,
		];
		const overdueBills = filteredBills.payment.filter(
			(bill: Bill) => new Date(bill.dueDate) < new Date(),
		);

		return {
			reviewCount: filteredBills.review.length,
			approvalCount: filteredBills.approval.length,
			overdueCount: overdueBills.length,
			openTotal: formatStatusTotal(allOpenBills),
		};
	}, [filteredBills]);

	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
			<MobileTabNavigation
				tabs={BOARD_TABS}
				activeTab={activeView}
				onTabChange={handleMobileTabChange}
				className="left-auto right-4 top-4"
			/>

			<div className="relative z-40 mt-14 flex flex-col gap-4 border-b border-border/50 bg-background px-4 py-4 sm:hidden">
				<div className="space-y-1">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
						CxP
					</p>
					<div className="flex items-center justify-between gap-3">
						<div>
							<h1 className="text-lg font-semibold tracking-tight text-foreground">
								Facturas de compra
							</h1>
							<p className="text-xs text-muted-foreground">
								Controla aprobaciones y pagos sin salir del flujo.
							</p>
						</div>
						<button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--text-on-accent)] transition-colors hover:opacity-95">
							<Plus size={14} strokeWidth={2.25} />
							Nueva
						</button>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Buscar por proveedor o comprobante"
							className="h-10 rounded-xl border-border/60 bg-card pl-10 text-sm placeholder:text-muted-foreground"
						/>
					</div>
				</div>
			</div>

			<BillsBoardHeader
				activeView={activeView}
				setActiveView={setActiveView}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				setIsMobileOpen={setIsMobileOpen}
				tabs={BOARD_TABS}
				reviewCount={summaryMetrics.reviewCount}
				approvalCount={summaryMetrics.approvalCount}
				overdueCount={summaryMetrics.overdueCount}
				openTotal={summaryMetrics.openTotal}
			/>

			<div className="custom-scrollbar relative flex-1 overflow-x-auto overflow-y-auto bg-background px-5 py-5 md:px-8 md:py-7">
				<div className="h-full w-full">
					{activeView === "summary" ? (
						<BillsKanbanView
							isLoading={isLoading}
							error={error}
							searchQuery={searchQuery}
							hasResults={hasResults}
							filteredBills={filteredBills}
							pendingBillId={pendingBillId}
							updateBillStatus={updateBillStatus}
							formatStatusTotal={formatStatusTotal}
						/>
					) : (
						<Suspense
							fallback={
								<div className="rounded-2xl border border-border/60 bg-card px-6 py-5 text-sm text-muted-foreground">
									Cargando antigüedad de pasivos...
								</div>
							}
						>
							<BillsAgingTab />
						</Suspense>
					)}
				</div>
			</div>
		</div>
	);
};
