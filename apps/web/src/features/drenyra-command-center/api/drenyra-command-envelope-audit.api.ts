import { api, getGovernanceAuditHeaders, getOrganizationId } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";

export type CommandEnvelopeAuditDecision = "allowed" | "denied" | "all";

export interface CommandEnvelopeAuditEvent {
	id: string;
	caseId?: string;
	eventType: "CAPABILITY_ALLOWED" | "CAPABILITY_DENIED";
	actorId: string;
	message: string;
	occurredAt: string;
	metadata: Record<string, unknown>;
}

export interface CommandEnvelopeAuditResponse {
	decision: CommandEnvelopeAuditDecision;
	events: CommandEnvelopeAuditEvent[];
	count: number;
}

export interface ListCommandEnvelopeAuditInput {
	decision?: CommandEnvelopeAuditDecision;
	caseId?: string;
	limit?: number;
}

function auditHeaders(): Record<string, string> {
	const organizationId = getOrganizationId();
	if (!organizationId) {
		throw new Error("Drenyra requires an explicit organization id");
	}
	const companyContext = getCompanyContext();
	return {
		...getGovernanceAuditHeaders(),
		"x-organization-id": organizationId,
		"x-company-id": companyContext.companyId,
		"x-company-ruc": companyContext.ruc,
		"x-fiscal-period": getActiveFiscalPeriod(),
	};
}

export async function listCommandEnvelopeAudit(
	input: ListCommandEnvelopeAuditInput = {},
): Promise<CommandEnvelopeAuditResponse> {
	const query: Record<string, string | undefined> = {};
	if (input.decision) query.decision = input.decision;
	if (input.caseId) query.caseId = input.caseId;
	if (input.limit) query.limit = String(input.limit);

	const body = await unwrap(
		api.api.drenyra["command-envelope"].audit.get({
			headers: auditHeaders(),
			query,
		}),
	);
	return extractOkData(body, "No se pudo obtener el audit del command envelope");
}
