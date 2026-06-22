import { FiscalIndicatorsService } from "../services/fiscal-indicators.service";

export async function getSireStatus(companyId: string, period?: string) {
	return FiscalIndicatorsService.getSireStatus(companyId, period);
}
