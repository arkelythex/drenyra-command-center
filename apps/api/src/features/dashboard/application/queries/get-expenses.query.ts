import { ExpenseAnalyticsService } from "../services/expense-analytics.service";

export async function getExpenses(
	companyId: string,
	startDate?: Date,
	endDate?: Date,
) {
	return ExpenseAnalyticsService.getExpenses(companyId, startDate, endDate);
}
