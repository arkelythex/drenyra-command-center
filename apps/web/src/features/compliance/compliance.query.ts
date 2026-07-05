import { queryOptions } from "@tanstack/react-query";

export interface ComplianceSyncStats {
	rucCoverage: string;
	cpeIntegrity: string;
	sireMatches: number;
	pendingDetractions: number;
	totalDocuments: number;
	complianceScore: number;
	riskAlerts: number;
	lastAudit: string;
	nextScheduled: string;
	activeContributors: number;
	inactiveContributors: number;
	noHabidoContributors: number;
	totalContributors: number;
}

export interface ComplianceOverviewData {
	lastSync: string;
	syncStats: ComplianceSyncStats;
}

export function buildComplianceOverviewData(): ComplianceOverviewData {
	return {
		lastSync: new Date().toISOString(),
		syncStats: {
			rucCoverage: "98.2%",
			cpeIntegrity: "99.8%",
			sireMatches: 148,
			pendingDetractions: 6,
			totalDocuments: 2341,
			complianceScore: 94.7,
			riskAlerts: 12,
			lastAudit: "2025-01-18",
			nextScheduled: "2025-02-15",
			activeContributors: 15,
			inactiveContributors: 2,
			noHabidoContributors: 4,
			totalContributors: 21,
		},
	};
}

export const complianceKeys = {
	all: ["compliance"] as const,
	overview: (companyId: string) =>
		[...complianceKeys.all, "overview", companyId] as const,
};

export function complianceOverviewQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: complianceKeys.overview(companyId),
		queryFn: async () => buildComplianceOverviewData(),
		staleTime: 60_000,
	});
}
