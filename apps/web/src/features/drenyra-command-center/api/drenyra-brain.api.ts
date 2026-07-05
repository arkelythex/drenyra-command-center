import type {
	DrenyraBrainItem,
	DrenyraBrainSourceSurface,
	DrenyraBrainThread,
	DrenyraBrainTurn,
} from "@drenyra/domain/drenyra";
import { api, getGovernanceAuditHeaders, getOrganizationId } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";

export interface CreateBrainThreadRequest {
	title: string;
	sourceSurface: DrenyraBrainSourceSurface;
	linkedCaseId?: string;
	linkedMissionId?: string;
}

export interface StartBrainTurnRequest {
	prompt: string;
	sourceSurface: DrenyraBrainSourceSurface;
}

function brainHeaders() {
	const companyContext = getCompanyContext();
	const organizationId = getOrganizationId();
	if (!organizationId) {
		throw new Error("Drenyra requires an explicit organization id");
	}
	return {
		headers: {
			...getGovernanceAuditHeaders(),
			"x-organization-id": organizationId,
			"x-company-id": companyContext.companyId,
			"x-company-ruc": companyContext.ruc,
			"x-fiscal-period": getActiveFiscalPeriod(),
		},
	};
}

export async function listBrainThreads(): Promise<DrenyraBrainThread[]> {
	const body = await unwrap(api.api.drenyra.brain.threads.get(brainHeaders()));
	return extractOkData(body, "No se pudieron cargar los threads del cerebro");
}

export async function createBrainThread(
	input: CreateBrainThreadRequest,
): Promise<DrenyraBrainThread> {
	const body = await unwrap(api.api.drenyra.brain.threads.post(input, brainHeaders()));
	return extractOkData(body, "No se pudo crear el thread del cerebro");
}

export async function startBrainTurn(
	threadId: string,
	input: StartBrainTurnRequest,
): Promise<DrenyraBrainTurn> {
	const body = await unwrap(
		api.api.drenyra.brain.threads({ id: threadId }).turns.post(input, brainHeaders()),
	);
	return extractOkData(body, "No se pudo iniciar el turno");
}

export async function listBrainItems(
	threadId: string,
): Promise<DrenyraBrainItem[]> {
	const body = await unwrap(
		api.api.drenyra.brain.threads({ id: threadId }).items.get(brainHeaders()),
	);
	return extractOkData(body, "No se pudieron cargar los items del thread");
}
