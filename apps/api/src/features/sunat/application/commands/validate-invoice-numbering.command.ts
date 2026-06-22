import { SunatService } from "../../../../services/sunat.service";
import { ok } from "../../../shared/api-response";

export async function validateInvoiceNumbering(
	series: string,
	correlative: number,
) {
	const result = SunatService.validateInvoiceNumbering(series, correlative);
	return ok(result);
}
