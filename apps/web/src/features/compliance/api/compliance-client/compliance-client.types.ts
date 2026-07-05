/**
 * Compliance API client types
 *
 * @module compliance-client/types
 */

import type { CountryCode, CountryPack } from "@/lib/latam-country-packs";
import type {
	RoadmapActionId,
	RoadmapDecisionType,
} from "../../components/shared/types";

export interface ApiEnvelope<T> {
	success: boolean;
	data: T;
	error?: string;
	code?: string;
	supportMessage?: string;
	runbook?: { id: string; title?: string };
}

/* ── Roadmap --------------------------------------------------------------- */

export interface ComplianceRoadmapRunPayload {
	companyId: string;
	year: number;
	month: number;
	traceId: string;
	countryCode?: string;
}

export interface ComplianceRoadmapDecisionPayload {
	companyId: string;
	year: number;
	month: number;
	actionId: RoadmapActionId;
	traceId: string;
	decision: RoadmapDecisionType;
	reason: string;
	decidedBy?: string;
}

export interface ComplianceRoadmapTimelineQuery {
	companyId: string;
	year: number;
	month: number;
	traceId: string;
}

/* ── SIRE demo ------------------------------------------------------------- */

export interface SireDemoSummaryQuery {
	companyId: string;
	period: string;
}

/* ── Accounting jobs ------------------------------------------------------- */

export type AccountingJobRunStatus =
	| "QUEUED"
	| "RUNNING"
	| "AWAITING_APPROVAL"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

export interface AssistantAccountingJob {
	id: string;
	title: string;
	description: string;
	prompt: string;
	category:
		| "reconciliation"
		| "compliance"
		| "closing"
		| "collections"
		| "payables";
	cadence: "daily" | "weekly" | "monthly" | "on-demand";
	approvalRequired: boolean;
}

export interface AccountingJobsCatalogResponse {
	countryCode: CountryCode;
	jobs: AssistantAccountingJob[];
}

export interface CountryPackCatalogResponse {
	defaultCountryCode: CountryCode;
	supportedCountries: CountryCode[];
	packs: CountryPack[];
}

export interface AccountingJobRunView {
	id: string;
	companyId: string;
	countryCode: string;
	jobId: string;
	jobTitle: string;
	jobCategory: string;
	status: AccountingJobRunStatus;
	approvalRequired: boolean;
	requestedBy: string | null;
	approvedBy: string | null;
	prompt: string;
	summary: string | null;
	inputPayload: Record<string, unknown>;
	resultPayload: Record<string, unknown> | null;
	evidencePayload: Record<string, unknown> | null;
	startedAt: string | Date;
	completedAt: string | Date | null;
	createdAt: string | Date;
	updatedAt: string | Date;
}

export interface AccountingJobRunsListQuery {
	companyId: string;
	countryCode?: string;
	status?: AccountingJobRunStatus;
	limit?: number;
}

export interface AccountingJobRunsListResponse {
	companyId: string;
	count: number;
	runs: AccountingJobRunView[];
}

export interface CreateAccountingJobRunPayload {
	companyId: string;
	countryCode?: string;
	jobId: string;
	requestedBy?: string;
	prompt?: string;
	summary?: string;
	inputPayload?: Record<string, unknown>;
}

export interface UpdateAccountingJobRunStatusPayload {
	companyId: string;
	status: AccountingJobRunStatus;
	summary?: string;
	approvedBy?: string;
	resultPayload?: Record<string, unknown>;
	evidencePayload?: Record<string, unknown>;
}

export interface ExecuteAccountingJobRunPayload {
	companyId: string;
	period?: string;
}

/* ── CPE validator --------------------------------------------------------- */

export interface CpeValidationRequestPayload {
	companyRuc: string;
	cpeNumber: string;
	xmlContent: string;
	issueDate: string;
	totalAmount: number;
	skipCache?: boolean;
}

export interface CpeValidationIncident {
	isIncident: boolean;
	category: string;
	severity: string;
	summary: string;
	supportMessage?: string;
}

export interface CpeValidationData {
	isValid: boolean;
	status: string;
	durationMs: number;
	validationSource: string;
	incident: CpeValidationIncident;
}

export interface CpeValidationEnvelope extends ApiEnvelope<CpeValidationData> {}

export interface CpeErrorCatalogItem {
	state: "OBSERVADO" | "RECHAZADO" | "ANULADO" | "NO_EXISTE";
	code: string;
	incidentCategory:
		| "SUNAT_OBSERVED"
		| "SUNAT_REJECTED"
		| "SUNAT_NOT_FOUND"
		| "SUNAT_ANNULLED";
	severity: "medium" | "high";
	summary: string;
	defaultErrorMessage: string;
	supportMessage: string;
	recommendedActions: readonly string[];
}

export interface CpeFallbackProbeBody {
	mode?: "normal" | "hitl";
	companyRuc: string;
	cpeNumber: string;
	issueDate: string;
	totalAmount: number;
}

export interface CpeFallbackProbeData {
	source: "visual_subagent";
	fallbackActivated: boolean;
	response: unknown;
	trace: {
		source: "visual_subagent";
		mode: "simulation";
		steps: string[];
		txtPreview: string;
		durationMs: number;
	};
	hitl?: {
		required: true;
		challengeType: "captcha" | "unexpected_popup";
		channel: "whatsapp";
		message: string;
		screenshotRef: string;
	};
}

/* ── SIRE demo data -------------------------------------------------------- */

export interface SireDemoSummaryData {
	source: "demo-seed";
	period: string;
	generatedAt: string;
	sales: {
		recordCount: number;
		warningCount: number;
		isValid: boolean;
	};
	purchases: {
		recordCount: number;
		warningCount: number;
		isValid: boolean;
	};
	matches: number;
	differences: number;
	previewRows: Array<{
		icon: "alert" | "clock" | "file";
		id: string;
		provider: string;
		sunatStatus:
			| "Propuesta"
			| "En Proceso"
			| "No Registrado"
			| "No Existe"
			| "Registrado"
			| "Sincronizado"
			| "Observado"
			| "Rechazado"
			| "Anulado";
		internalStatus:
			| "Propuesta"
			| "En Proceso"
			| "No Registrado"
			| "No Existe"
			| "Registrado"
			| "Sincronizado"
			| "Observado"
			| "Rechazado"
			| "Anulado";
		amount: string;
		date: string;
		isCritical?: boolean;
	}>;
}
