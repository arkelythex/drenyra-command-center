import type { FC } from "react";
import type { Entity } from "../types/entity.types";
import { useEntitiesMetrics } from "../hooks/use-entities-metrics";
import { EntitiesGovernanceStrip } from "./entities-table/governance-strip";
import { EntitiesTableHeader } from "./entities-table/header";
import { EntitiesList } from "./entities-table/entities-list";

interface EntitiesTableProps {
	entities: Entity[];
	search: string;
	onSearch: (value: string) => void;
	onSelect: (id: string) => void;
}

export const EntitiesTable: FC<EntitiesTableProps> = ({
	entities,
	search,
	onSearch,
	onSelect,
}) => {
	const { highRiskCount, pendingComplianceCount, avgCompliance } =
		useEntitiesMetrics(entities);

	return (
		<div className="flex flex-col h-full bg-background/50 overflow-hidden font-sans text-foreground backdrop-blur-sm">
			<EntitiesTableHeader search={search} onSearch={onSearch} />

			<EntitiesGovernanceStrip
				entitiesCount={entities.length}
				highRiskCount={highRiskCount}
				pendingComplianceCount={pendingComplianceCount}
				avgCompliance={avgCompliance}
			/>

			<div className="flex-1 overflow-auto p-6 md:p-10 lg:p-14 custom-scrollbar pb-40 animate-entrance relative">
				<EntitiesList entities={entities} onSelect={onSelect} />
			</div>
		</div>
	);
};
