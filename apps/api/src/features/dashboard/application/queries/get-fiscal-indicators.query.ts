import { FiscalIndicatorsService } from "../services/fiscal-indicators.service";

export async function getFiscalIndicators() {
	return FiscalIndicatorsService.getIndicators();
}
