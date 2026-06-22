import { FiscalIndicatorsService } from "../services/fiscal-indicators.service";

export async function getTaxCalendar(
	companyId: string,
	month?: number,
	year?: number,
) {
	return FiscalIndicatorsService.getTaxCalendar(companyId, month, year);
}
