import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import type { Entity } from "../types/entity.types";
import { EntityAuditPanel } from "./entity-detail-view/audit-panel";
import { EntityDetailHeader } from "./entity-detail-view/header";
import { EntityInfoCard } from "./entity-detail-view/info-card";
import { EntityRiskCard } from "./entity-detail-view/risk-card";

interface EntityDetailViewProps {
	entity: Entity;
	onBack: () => void;
}

export const EntityDetailView = ({ entity, onBack }: EntityDetailViewProps) => {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();

	return (
		<div className="flex flex-col h-full bg-background overflow-hidden">
			<EntityDetailHeader
				entity={entity}
				onBack={() => {
					trigger("light");
					onBack();
				}}
				onExportReport={() => trigger("light")}
				onRefreshSunat={() => financialHaptics.onImportComplete()}
			/>

			<div className="flex-1 overflow-auto p-8 custom-scrollbar">
				<div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 pb-20">
					<div className="col-span-12 lg:col-span-4 space-y-8">
						<EntityRiskCard
							complianceScore={entity.complianceScore}
							riskLevel={entity.riskLevel}
						/>
						<EntityInfoCard onOpenRucSheet={() => trigger("light")} />
					</div>

					<div className="col-span-12 lg:col-span-8">
						<EntityAuditPanel
							entityId={entity.id}
							onTabSelect={() => trigger("light")}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
