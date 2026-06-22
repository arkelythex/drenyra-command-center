import { SunatService } from "../../../../services/sunat.service";
import { fail, getErrorMessage, ok } from "../../../shared/api-response";

export async function getExchangeRate() {
	try {
		const data = await SunatService.getExchangeRate();
		return ok(data);
	} catch (error: unknown) {
		return fail(
			getErrorMessage(error, "Error al obtener tipo de cambio"),
			"INTERNAL_ERROR",
		);
	}
}
