import type React from "react";
import { useState } from "react";
import { useDesignTokens } from "@/lib/design-tokens";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { PayrollHeader } from "./payroll-view/header";
import { PayrollRosterPanel } from "./payroll-view/roster-panel";
import { PayrollSimulatorPanel } from "./payroll-view/simulator-panel";
import { STAFF } from "./payroll-view/staff-data";

export const PayrollView: React.FC = () => {
	const [projectedTax, setProjectedTax] = useState(14500);
	const { gradients, borderRadius, shadows, zIndex, backdropBlur } =
		useDesignTokens();
	const { setIsMobileOpen } = useSidebarLayout();

	return (
		<div className="h-full flex flex-col bg-background font-sans text-foreground overflow-hidden animate-in fade-in duration-700">
			<PayrollHeader
				ambientGradientClassName={gradients.ambient}
				iconGradientClassName={gradients.iconBlue}
				iconBorderRadius={borderRadius.icon}
				iconShadow={shadows.blue}
				stickyZIndex={zIndex.sticky}
				onOpenSidebar={() => setIsMobileOpen(true)}
			/>

			<div className="flex-1 px-4 sm:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 sm:gap-8 overflow-y-auto lg:overflow-hidden bg-background custom-scrollbar">
				<PayrollRosterPanel
					backdropClassName={backdropBlur.glass}
					cardRadius={borderRadius.card}
					staff={STAFF}
				/>
				<PayrollSimulatorPanel
					backdropClassName={backdropBlur.glass}
					cardRadius={borderRadius.card}
					projectedTax={projectedTax}
					onProjectedTaxChange={setProjectedTax}
				/>
			</div>
		</div>
	);
};
