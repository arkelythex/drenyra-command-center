import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";

export type CommandAuditEventType = "CAPABILITY_ALLOWED" | "CAPABILITY_DENIED";

export interface CommandAuditEvent {
	id: string;
	caseId?: string;
	eventType: CommandAuditEventType;
	actorId: string;
	message: string;
	occurredAt: string;
	metadata: Record<string, unknown>;
}

export interface CommandAuditFilter {
	caseId?: string;
	commandId?: string;
	eventType?: CommandAuditEventType;
}

const commandAuditHeaders = () => {
	const companyContext = getCompanyContext();
	return {
		headers: {
			...getGovernanceAuditHeaders(),
			"x-company-ruc": companyContext.ruc,
			"x-drenyra-capability-grant": "scoped",
			"x-drenyra-redaction-ok": "true",
			"x-fiscal-period": new Date().toISOString().slice(0, 7),
		},
	};
};

export async function listCommandAuditEvents(
	filter: CommandAuditFilter = {},
): Promise<CommandAuditEvent[]> {
	const body = await unwrap(
		api.api.drenyra.commands["audit-events"].get({
			query: filter,
			...commandAuditHeaders(),
		}),
	);
	return extractOkData(body, "No se pudo cargar el audit trail de comandos");
}
