import { SunatService } from "../../../../services/sunat.service";
import { ok } from "../../../shared/api-response";

export async function validateRuc(ruc: string) {
	const result = SunatService.validateRuc(ruc);
	return ok(result);
}
