/**
 * SIRE demo summary API methods
 *
 * @module compliance/sire
 */

import { extractOkData, unwrap } from "@/lib/api-helpers";
import type { SireDemoSummaryData } from "../compliance-client";
import { SIRE_DEMO_EXPORT_PERIOD } from "../../lib/sire-demo-export";
import { getComplianceClient } from "../compliance-client";

const complianceClient = getComplianceClient();

export const sireApi = {
	/**
	 * GET /compliance/sire-demo-summary
	 * Returns the demo SIRE summary for the selected period.
	 */
	getSireDemoSummary: async (
		companyId: string,
		period = SIRE_DEMO_EXPORT_PERIOD,
	): Promise<SireDemoSummaryData> => {
		const body = await unwrap(
			complianceClient["sire-demo-summary"].get({
				query: { companyId, period },
			}),
		);
		return extractOkData(
			body,
			"No se pudo cargar el resumen SIRE demo",
		) as SireDemoSummaryData;
	},
};
