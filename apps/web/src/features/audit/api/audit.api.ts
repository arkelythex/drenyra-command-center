import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";

export interface AuditEvent {
	id: number;
	action: string;
	user: string;
	document: string;
	timestamp: string;
	type: "create" | "update" | "delete" | "system";
}

export interface AuditEventsQuery {
	period?: string;
	search?: string;
}

function headers() {
	const companyContext = getCompanyContext();
	return {
		headers: {
			...getGovernanceAuditHeaders(),
			"x-company-ruc": companyContext.ruc,
			"x-fiscal-period": getActiveFiscalPeriod(),
		},
	};
}

export const auditApi = {
	getEvents: async (params?: AuditEventsQuery): Promise<AuditEvent[]> => {
		const body = await unwrap(
			api.api.audit.events.get({
				query: params,
				...headers(),
			}),
		);
		return extractOkData(body, "No se pudieron cargar eventos de auditoría");
	},
};
