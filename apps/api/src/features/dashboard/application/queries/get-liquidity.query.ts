import { OverviewService } from "../services/overview.service";

export async function getLiquidity(companyId: string, months: number = 12) {
	return OverviewService.getLiquidity(companyId, months);
}
