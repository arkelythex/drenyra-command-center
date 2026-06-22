import { ok } from "../../../shared/api-response";

export async function getUit() {
	return ok({
		year: 2026,
		value: 5350,
	});
}
