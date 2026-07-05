import type {
	AgentRun,
	AgentRunOutput,
	ApprovalRequest,
	AuditEvent,
	AutonomyLevel,
	DrenyraAgentType,
	EvidenceItem,
	EvidenceType,
	FiscalCase,
	FiscalCaseDetails,
	FiscalCaseStatus,
	FiscalCaseType,
	FiscalRiskLevel,
	FiscalScope,
} from "@drenyra/domain/drenyra";
import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";

export type {
	AgentRun,
	AgentRunOutput,
	ApprovalRequest,
	AuditEvent,
	AutonomyLevel,
	DrenyraAgentType,
	EvidenceItem,
	EvidenceType,
	FiscalCase,
	FiscalCaseDetails,
	FiscalCaseStatus,
	FiscalCaseType,
	FiscalRiskLevel,
	FiscalScope,
};

export interface CreateFiscalCaseRequest {
	type: FiscalCaseType;
	title: string;
	description: string;
	riskLevel?: FiscalRiskLevel;
	riskScore?: number;
	autonomyLevel?: AutonomyLevel;
}

export interface AddEvidenceRequest {
	type: EvidenceType;
	title: string;
	summary: string;
	source: string;
	sourceRef?: string;
}

export interface UpdateFiscalCaseStatusRequest {
	status: FiscalCaseStatus;
	reason?: string;
}

export interface ApprovalDecisionRequest {
	decisionReason: string;
}

const headers = () => {
	const companyContext = getCompanyContext();
	return {
		headers: {
			...getGovernanceAuditHeaders(),
			"x-company-ruc": companyContext.ruc,
			"x-fiscal-period": getActiveFiscalPeriod(),
		},
	};
};

export const drenyraCommandCenterApi = {
	listCases: async (): Promise<FiscalCase[]> => {
		const body = await unwrap(api.api.drenyra.cases.get(headers()));
		return extractOkData(body, "No se pudieron cargar los casos fiscales");
	},
	createCase: async (request: CreateFiscalCaseRequest): Promise<FiscalCase> => {
		const body = await unwrap(api.api.drenyra.cases.post(request, headers()));
		return extractOkData(body, "No se pudo crear el caso fiscal");
	},
	getCaseDetails: async (caseId: string): Promise<FiscalCaseDetails> => {
		const body = await unwrap(
			api.api.drenyra.cases({ id: caseId }).get(headers()),
		);
		return extractOkData(body, "No se pudo cargar el caso fiscal");
	},
	addEvidence: async (
		caseId: string,
		request: AddEvidenceRequest,
	): Promise<EvidenceItem> => {
		const body = await unwrap(
			api.api.drenyra.cases({ id: caseId }).evidence.post(request, headers()),
		);
		return extractOkData(body, "No se pudo adjuntar evidencia");
	},
	updateCaseStatus: async (
		caseId: string,
		request: UpdateFiscalCaseStatusRequest,
	): Promise<FiscalCase> => {
		const body = await unwrap(
			api.api.drenyra.cases({ id: caseId }).status.patch(request, headers()),
		);
		return extractOkData(
			body,
			"No se pudo actualizar el estado del caso fiscal",
		);
	},
	startAgentRun: async (
		caseId: string,
		agentType: DrenyraAgentType,
	): Promise<AgentRun> => {
		const body = await unwrap(
			api.api.drenyra
				.cases({ id: caseId })
				["agent-runs"].post({ agentType }, headers()),
		);
		return extractOkData(body, "No se pudo iniciar el agente");
	},
	requestApproval: async (
		caseId: string,
		title: string,
	): Promise<ApprovalRequest> => {
		const body = await unwrap(
			api.api.drenyra.cases({ id: caseId }).approvals.post(
				{
					title,
					description:
						"Solicitud preparada desde Drenyra Command Center. No ejecuta acciones fiscales reales.",
					diff: {
						before: { state: "draft" },
						after: { state: "prepared" },
						summary: title,
					},
				},
				headers(),
			),
		);
		return extractOkData(body, "No se pudo solicitar aprobación");
	},
	approve: async (
		approvalId: string,
		request: ApprovalDecisionRequest,
	): Promise<ApprovalRequest> => {
		const body = await unwrap(
			api.api.drenyra
				.approvals({ id: approvalId })
				.approve.post(request, headers()),
		);
		return extractOkData(body, "No se pudo aprobar");
	},
	reject: async (
		approvalId: string,
		request: ApprovalDecisionRequest,
	): Promise<ApprovalRequest> => {
		const body = await unwrap(
			api.api.drenyra
				.approvals({ id: approvalId })
				.reject.post(request, headers()),
		);
		return extractOkData(body, "No se pudo rechazar");
	},
};
