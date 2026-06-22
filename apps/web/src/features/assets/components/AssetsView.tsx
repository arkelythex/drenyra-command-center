import React from 'react';
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { ASSETS } from "./assets-view/assets-data";
import { AssetsTable } from "./assets-view/assets-table";
import { AssetsHeader } from "./assets-view/header";
import { AssetsInsightBanner } from "./assets-view/insight-banner";
import { AssetsKpiGrid } from "./assets-view/kpi-grid";

export const AssetsView: React.FC = () => {
	const { setIsMobileOpen } = useSidebarLayout();

	return (
		<div className="h-full flex flex-col overflow-hidden bg-background animate-in fade-in duration-300">
			<AssetsHeader onOpenSidebar={() => setIsMobileOpen(true)} />
			<AssetsInsightBanner />
			<AssetsKpiGrid />
			<AssetsTable assets={ASSETS} />
		</div>
	);
};
