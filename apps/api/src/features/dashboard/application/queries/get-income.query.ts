import { IncomeAnalyticsService } from "../services/income-analytics.service";

export async function getIncome(
	companyId: string,
	startDate?: Date,
	endDate?: Date,
) {
	return IncomeAnalyticsService.getIncome(companyId, startDate, endDate);
}
