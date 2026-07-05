import { useMemo } from "react";
import type { Entity } from "../types/entity.types";

interface EntitiesMetrics {
	highRiskCount: number;
	pendingComplianceCount: number;
	avgCompliance: number;
}

export function useEntitiesMetrics(entities: Entity[]): EntitiesMetrics {
	return useMemo(() => {
		const highRiskCount = entities.filter(
			(entity) => entity.riskLevel === "HIGH",
		).length;
		const pendingComplianceCount = entities.filter(
			(entity) => entity.complianceScore < 80,
		).length;
		const avgCompliance =
			entities.length > 0
				? Math.round(
						entities.reduce((acc, entity) => acc + entity.complianceScore, 0) /
							entities.length,
					)
				: 0;

		return {
			highRiskCount,
			pendingComplianceCount,
			avgCompliance,
		};
	}, [entities]);
}
