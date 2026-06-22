import { OverviewService } from "../services/overview.service";

export async function getOverview(companyId: string) {
	const [systemStatus, processedDocs, liquidity] = await Promise.all([
		OverviewService.getSystemStatus(),
		OverviewService.getProcessedDocuments(companyId),
		OverviewService.getLiquidity(companyId, 6),
	]);
	return { systemStatus, processedDocs, liquidity };
}
