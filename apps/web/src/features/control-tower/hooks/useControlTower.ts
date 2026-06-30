import { useQuery } from "@tanstack/react-query";
import { extractOkData } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

export interface ControlTowerCompanyRow {
	companyId: string;
	ruc: string;
	businessName: string;
	healthScore: number;
	globalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	pendingDocuments: number;
	pendingExpedientes: number;
	nextDeadline: string | null;
	obligationsDue: number;
	period: string;
}

export interface BuzonSolSnapshot {
	status: "UNAVAILABLE" | "AUTH_READY" | "SYNC_PENDING";
	message: string;
	checkedAt: string;
}

export interface ControlTowerPortfolio {
	period: string;
	companies: ControlTowerCompanyRow[];
	buzonSol: BuzonSolSnapshot;
}

async function fetchControlTower(
	companyId: string,
	period?: string,
): Promise<ControlTowerPortfolio> {
	const params = new URLSearchParams({ companyId });
	if (period) params.set("period", period);
	const response = await fetch(
		`/api/dashboard/control-tower?${params.toString()}`,
		{
			credentials: "include",
			headers: { "X-Company-Id": companyId },
		},
	);
	return extractOkData(await response.json(), "Failed to load control tower");
}

export function useControlTower(period?: string) {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";

	return useQuery({
		queryKey: ["control-tower", companyId, period],
		queryFn: () => fetchControlTower(companyId, period),
		enabled: Boolean(companyId),
	});
}
