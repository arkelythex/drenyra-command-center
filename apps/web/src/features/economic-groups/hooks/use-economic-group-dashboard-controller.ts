import { useEffect, useState } from "react";
import { useEconomicGroup } from "./useEconomicGroup";

interface AddCompanyPayload {
	ruc: string;
	businessName: string;
	tradeName?: string;
	address?: string;
}

export function useEconomicGroupDashboardController(groupId: string) {
	const {
		currentGroup,
		companies,
		pricing,
		savings,
		isLoading,
		fetchGroup,
		addCompany,
	} = useEconomicGroup();

	const [showAddModal, setShowAddModal] = useState(false);

	useEffect(() => {
		if (!groupId) return;
		void fetchGroup(groupId);
	}, [groupId, fetchGroup]);

	const handleAddCompany = async (payload: AddCompanyPayload) => {
		if (!payload.ruc || !payload.businessName) {
			return;
		}

		await addCompany(groupId, {
			ruc: payload.ruc,
			businessName: payload.businessName,
			tradeName: payload.tradeName,
		});
		setShowAddModal(false);
	};

	return {
		currentGroup,
		companies,
		pricing,
		savings,
		isLoading,
		showAddModal,
		setShowAddModal,
		handleAddCompany,
	};
}
