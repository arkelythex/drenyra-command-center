import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { AddCompanyModal } from "./AddCompanyModal";
import { CompaniesGrid } from "./economic-group-dashboard/companies-grid";
import { GroupHeaderCard } from "./economic-group-dashboard/header-card";
import { PricingInsights } from "./economic-group-dashboard/pricing-insights";
import { useEconomicGroupDashboardController } from "../hooks/use-economic-group-dashboard-controller";

export const EconomicGroupDashboard = ({ groupId }: { groupId: string }) => {
	const { setIsMobileOpen } = useSidebarLayout();
	const {
		currentGroup,
		companies,
		pricing,
		savings,
		isLoading,
		showAddModal,
		setShowAddModal,
		handleAddCompany,
	} = useEconomicGroupDashboardController(groupId);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-muted-foreground">Cargando...</div>
			</div>
		);
	}

	if (!currentGroup) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-muted-foreground">Grupo economico no encontrado</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<GroupHeaderCard
				groupName={currentGroup.groupName}
				groupCode={currentGroup.groupCode}
				subscriptionTier={currentGroup.subscriptionTier}
				monthlyFee={currentGroup.monthlyFee}
				companiesCount={companies.length}
				onOpenSidebar={() => setIsMobileOpen(true)}
			/>

			{pricing && savings ? (
				<PricingInsights
					companiesCount={companies.length}
					pricing={pricing}
					savings={savings}
				/>
			) : null}

			<CompaniesGrid
				companies={companies}
				onOpenAddModal={() => setShowAddModal(true)}
			/>

			<AddCompanyModal
				isOpen={showAddModal}
				onClose={() => setShowAddModal(false)}
				onSubmit={handleAddCompany}
				isSubmitting={isLoading}
				error={null}
			/>
		</div>
	);
};
