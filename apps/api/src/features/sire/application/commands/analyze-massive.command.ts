import { DataEngineClient } from "../../../../shared/clients/data-engine.client";
import { fail } from "../../../shared/api-response";
import { SireService } from "../../sire.service";

export async function analyzeMassive(body: any, query: any, set: any) {
	const dataEngineHealth = await DataEngineClient.healthCheck();
	if (dataEngineHealth?.status !== "online") {
		set.status = 503;
		return fail(
			"Data Engine is unavailable. Start apps/data-engine before processing SIRE files.",
			"DATA_ENGINE_UNAVAILABLE",
		);
	}

	return SireService.analyzeMassive(query.companyId, body.file);
}
