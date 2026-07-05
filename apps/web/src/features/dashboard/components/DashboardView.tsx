import { type FC, lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { n } from "@/lib/utils";
import { useDashboardActions } from "../hooks/useDashboardActions";
import { useDashboardData } from "../hooks/useDashboardData";
import { useDashboardNavigation } from "../hooks/useDashboardNavigation";
import { DashboardHeader } from "./layout/DashboardHeader";
import { SummaryTabContent } from "./sections/SummaryTabContent";

const DASHBOARD_MOBILE_QUERY = "(max-width: 639px)";

function getIsMobileDashboardViewport() {
	if (typeof window === "undefined") return false;
	if (typeof window.matchMedia !== "function") return false;
	return window.matchMedia(DASHBOARD_MOBILE_QUERY).matches;
}

const InviteMemberModal = lazy(async () => {
	const mod = await import("./InviteMemberModal");
	return { default: mod.InviteMemberModal };
});

const MobileFinancialSummary = lazy(async () => {
	const mod = await import("./MobileFinancialSummary");
	return { default: mod.MobileFinancialSummary };
});

const MobileInvoiceScanner = lazy(async () => {
	const mod = await import("../../invoices/components/MobileInvoiceScanner");
	return { default: mod.MobileInvoiceScanner };
});

function LazyDialogStatus({ label }: { label: string }) {
	return (
		<div className="sr-only" role="status">
			{label}
		</div>
	);
}

const ExpensesTab = lazy(() =>
	import("./tabs/ExpensesTab").then((module) => ({
		default: module.ExpensesTab,
	})),
);
const IncomeTab = lazy(() =>
	import("./tabs/IncomeTab").then((module) => ({ default: module.IncomeTab })),
);

export type DashboardTab = "resumen" | "gastos" | "ingresos";

export const DashboardView: FC = () => {
	// ... existing hooks ...
	const {
		selectedDate,
		handlePreviousMonth,
		handleNextMonth,
		handleMonthSelect,
		availableMonths,
		isNextMonthDisabled,
	} = useDashboardNavigation();

	const {
		showScanner,
		setShowScanner,
		isInviteModalOpen,
		setIsInviteModalOpen,
		handleAction,
	} = useDashboardActions();

	const { financials, health } = useDashboardData();

	// Component State
	const [activeTab, setActiveTab] = useState<DashboardTab>("resumen");
	const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
	const [showDecisionGate, setShowDecisionGate] = useState(true);
	const [isMobileViewport, setIsMobileViewport] = useState(
		getIsMobileDashboardViewport,
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (typeof window.matchMedia !== "function") return;

		const mediaQuery = window.matchMedia(DASHBOARD_MOBILE_QUERY);
		const handleViewportChange = (event: MediaQueryListEvent) => {
			setIsMobileViewport(event.matches);
		};

		setIsMobileViewport(mediaQuery.matches);
		if (typeof mediaQuery.addEventListener === "function") {
			mediaQuery.addEventListener("change", handleViewportChange);

			return () => {
				mediaQuery.removeEventListener("change", handleViewportChange);
			};
		}

		mediaQuery.addListener(handleViewportChange);

		return () => {
			mediaQuery.removeListener(handleViewportChange);
		};
	}, []);

	// Derived Values
	const riskExposure = Number(financials.outstanding) || 0;
	const complianceScore = Number(health.complianceScore) || 0;
	const growthDelta = Number(financials.growth) || 0;
	const decisionStatusLabel =
		complianceScore < 80
			? "Aprobación humana obligatoria"
			: "Autonomía condicionada";

	return (
		<div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[var(--surface-1)]">
			{isInviteModalOpen && (
				<Suspense fallback={<LazyDialogStatus label="Cargando invitación" />}>
					<InviteMemberModal
						isOpen={isInviteModalOpen}
						onOpenChange={setIsInviteModalOpen}
					/>
				</Suspense>
			)}

			{/* 📱 MOBILE ONLY VIEW (Matches mobile.jpeg) */}
			{isMobileViewport && (
				<div className="sm:hidden flex-1 overflow-y-auto">
					<Suspense fallback={<ChartSkeleton className="min-h-screen" />}>
						<MobileFinancialSummary
							onTabChange={(id) => setActiveTab(id as DashboardTab)}
							onViewDetails={(action) =>
								handleAction(
									action === "new-transaction" ? "scan-invoice" : action,
								)
							}
						/>
					</Suspense>
				</div>
			)}

			{/* 💻 DESKTOP ONLY VIEW */}
			{!isMobileViewport && (
				<div className="hidden sm:flex flex-1 flex-col overflow-hidden">
					<DashboardHeader
						activeTab={activeTab}
						setActiveTab={setActiveTab}
						selectedDate={selectedDate}
						handlePreviousMonth={handlePreviousMonth}
						handleNextMonth={handleNextMonth}
						handleMonthSelect={handleMonthSelect}
						availableMonths={availableMonths}
						isNextMonthDisabled={isNextMonthDisabled}
						setIsInviteModalOpen={setIsInviteModalOpen}
					/>

					<main
						id="dashboard-main-content"
						className="flex-1 overflow-y-auto p-4 custom-scrollbar touch-pan-y sm:p-4 lg:p-5 2xl:p-6"
					>
						<div className="mx-auto max-w-[1680px] space-y-5 pb-20">
							{/* Tab Content Orchestrator */}
							<div className="tab-content-container">
								{activeTab === "resumen" && (
									<section
										id="dashboard-panel-resumen"
										role="tabpanel"
										className="space-y-5 sm:space-y-6 pb-12 fade-in-up"
									>
										<SummaryTabContent
											riskExposure={riskExposure}
											complianceScore={complianceScore}
											growthDelta={growthDelta}
											decisionStatusLabel={decisionStatusLabel}
											showDecisionGate={showDecisionGate}
											setShowDecisionGate={setShowDecisionGate}
											showAdvancedPanel={showAdvancedPanel}
											setShowAdvancedPanel={setShowAdvancedPanel}
										/>
									</section>
								)}

								{activeTab === "gastos" && (
									<section
										id="dashboard-panel-gastos"
										role="tabpanel"
										className="space-y-5 fade-in-up"
									>
										<div>
											<Suspense fallback={<ChartSkeleton />}>
												<ExpensesTab />
											</Suspense>
										</div>
									</section>
								)}

								{activeTab === "ingresos" && (
									<section
										id="dashboard-panel-ingresos"
										role="tabpanel"
										className="space-y-5 fade-in-up"
									>
										<div>
											<Suspense fallback={<ChartSkeleton />}>
												<IncomeTab />
											</Suspense>
										</div>
									</section>
								)}
							</div>
						</div>
						<FloatingActionButton onAction={handleAction} />
					</main>
				</div>
			)}

			{/* Mobile Scanner Overlay */}
			{showScanner && (
				<div className="fixed inset-0 z-[100] bg-[var(--surface-1)]">
					<Suspense fallback={<ChartSkeleton className="min-h-screen" />}>
						<MobileInvoiceScanner
							onClose={() => setShowScanner(false)}
							onScanComplete={(data) => {
								setShowScanner(false);
								toast.success(`Factura ${data.invoiceNumber} escaneada`, {
									description: `${data.vendor} - ${n(data.amount)}`,
									duration: 5000,
								});
							}}
						/>
					</Suspense>
				</div>
			)}
		</div>
	);
};
