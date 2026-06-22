import { SunatService } from "../../../../services/sunat.service";
import { ok } from "../../../shared/api-response";

export async function validateRucOnline(ruc: string) {
	const result = await SunatService.validateRucOnline(ruc);
	return ok(result);
}
