/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import {
	type AgentRun,
	type ApprovalDiffPayload,
	type ApprovalRequest,
	type AuditEvent,
	type AuditEventType,
	type AutonomyLevel,
	DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
	type DrenyraAgentType,
	type DrenyraFiscalWorkInspectEnvelope,
	type DrenyraFiscalWorkInspectSourceSurface,
	type EvidenceItem,
	type EvidenceType,
	type FiscalCase,
	type FiscalCaseDetails,
	type FiscalCaseStatus,
	type FiscalCaseType,
	type FiscalRiskLevel,
	type FiscalScope,
} from "@drenyra/domain/drenyra";
import { runDeterministicMockAgent } from "./mock-agents";
import type {
	DrenyraAuditEventFilter,
	DrenyraAuditEventFilters,
	DrenyraRepository,
	DrenyraScopeGuard,
} from "./repository";
import { verifyAgentRunOutput } from "./verification";

export interface DrenyraActorContext {
	companyId: string;
	companyRuc: string;
	organizationId: string;
	period: string;
	userId: string;
}

export interface CreateFiscalCaseInput {
	type: FiscalCaseType;
	title: string;
	description: string;
	riskLevel?: FiscalRiskLevel;
	riskScore?: number;
	autonomyLevel?: AutonomyLevel;
	metadata?: Record<string, unknown>;
	idempotencyKey?: string;
}

export interface BootstrapDocumentMissionInput {
	documentId: string;
	filename: string;
	mimeType?: string;
}

export interface BootstrapDocumentMissionResult {
	fiscalCase: FiscalCase;
	agentRun: AgentRun;
	agentStreamQuery: {
		documentId: string;
		filename: string;
		mimeType: string;
	};
}

export interface AddEvidenceInput {
	type: EvidenceType;
	title: string;
	summary: string;
	source: string;
	sourceRef?: string;
	contentHash?: string;
	metadata?: Record<string, unknown>;
	idempotencyKey?: string;
}

/**
 * Input for an audited manual fiscal case status transition.
 *
 * @example
 * const input: UpdateFiscalCaseStatusInput = { status: "IN_REVIEW", reason: "Human review started" };
 */
export interface UpdateFiscalCaseStatusInput {
	status: FiscalCaseStatus;
	reason?: string;
}

export interface RequestApprovalInput {
	title: string;
	description: string;
	autonomyLevel?: AutonomyLevel;
	diff: ApprovalDiffPayload;
	metadata?: Record<string, unknown>;
	idempotencyKey?: string;
}

export interface DecideApprovalInput {
	decisionReason?: string;
}

export type ListAuditEventsInput = DrenyraAuditEventFilters;

export interface InspectFiscalWorkItemInput {
	workItemId: string;
	capabilityGranted: boolean;
	traceId?: string;
	sourceSurface?: DrenyraFiscalWorkInspectSourceSurface;
}

export interface RecordCapabilityDecisionInput {
	caseId?: string;
	commandId: string;
	toolId: string;
	agentType: DrenyraAgentType;
	decision: "allowed" | "denied";
	reason: string;
	traceId: string;
}

function nowIso(): string {
	return new Date().toISOString();
}

function newId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}

function newTraceId(): string {
	return newId("trace");
}

function makeScope(
	context: DrenyraActorContext,
): FiscalScope & DrenyraScopeGuard {
	return {
		companyId: context.companyId,
		companyRuc: context.companyRuc,
		organizationId: context.organizationId,
		period: context.period,
		countryCode: "PE",
	};
}

async function digestText(value: string): Promise<string> {
	const data = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

function assertRiskScore(score: number): void {
	if (!Number.isInteger(score) || score < 0 || score > 100) {
		throw new Error("riskScore must be an integer between 0 and 100");
	}
}

function metadataWithIdempotency(
	metadata: Record<string, unknown> | undefined,
	idempotencyKey: string | undefined,
): Record<string, unknown> {
	return idempotencyKey
		? { ...(metadata ?? {}), idempotencyKey }
		: (metadata ?? {});
}

function hasIdempotencyKey(
	record: { metadata: Record<string, unknown> },
	idempotencyKey: string | undefined,
): boolean {
	return (
		Boolean(idempotencyKey) && record.metadata.idempotencyKey === idempotencyKey
	);
}

function hasCompleteInspectContext(context: DrenyraActorContext): boolean {
	return Boolean(
		context.companyId.trim() &&
			context.companyRuc.trim() &&
			context.organizationId.trim() &&
			context.period.trim() &&
			context.userId.trim(),
	);
}

/**
 * Application service for scoped Drenyra fiscal cases, evidence, mock agents and approvals.
 *
 * @example
 * const service = new DrenyraFiscalCommandCenterService(repository);
 */
export class DrenyraFiscalCommandCenterService {
	constructor(private readonly repository: DrenyraRepository) {}

	async createFiscalCase(
		context: DrenyraActorContext,
		input: CreateFiscalCaseInput,
	): Promise<FiscalCase> {
		if (input.idempotencyKey) {
			const existing = (
				await this.repository.listFiscalCases(makeScope(context))
			).find((item) => hasIdempotencyKey(item, input.idempotencyKey));
			if (existing) return existing;
		}
		const riskScore = input.riskScore ?? 35;
		assertRiskScore(riskScore);
		const timestamp = nowIso();
		const fiscalCase: FiscalCase = {
			id: newId("case"),
			scope: makeScope(context),
			type: input.type,
			status: "OPEN",
			title: input.title,
			description: input.description,
			riskLevel: input.riskLevel ?? "MEDIUM",
			riskScore,
			autonomyLevel: input.autonomyLevel ?? "PREPARE_WITH_APPROVAL",
			createdBy: context.userId,
			createdAt: timestamp,
			updatedAt: timestamp,
			metadata: metadataWithIdempotency(input.metadata, input.idempotencyKey),
		};

		await this.repository.createFiscalCase(fiscalCase);
		await this.writeAuditEvent(context, {
			caseId: fiscalCase.id,
			eventType: "FISCAL_CASE_CREATED",
			message: `Fiscal case created: ${fiscalCase.title}`,
			metadata: { type: fiscalCase.type, riskLevel: fiscalCase.riskLevel },
		});
		return fiscalCase;
	}

	/**
	 * Opens a CPE review mission from an uploaded document and kicks off the first agent run.
	 * Product hook: upload → fiscal case + evidence → live swarm stream params.
	 */
	async bootstrapDocumentMission(
		context: DrenyraActorContext,
		input: BootstrapDocumentMissionInput,
	): Promise<BootstrapDocumentMissionResult> {
		const mimeType = input.mimeType ?? "application/pdf";
		const fiscalCase = await this.createFiscalCase(context, {
			type: "CPE_REVIEW",
			title: `Revisión CPE · ${input.filename}`,
			description:
				"Misión iniciada desde carga de comprobante. Los agentes leen, debaten y validan SUNAT.",
			riskLevel: "MEDIUM",
			riskScore: 42,
			autonomyLevel: "PREPARE_WITH_APPROVAL",
			metadata: {
				documentId: input.documentId,
				filename: input.filename,
				mimeType,
				missionSource: "document_upload",
			},
		});

		await this.addEvidenceItem(context, fiscalCase.id, {
			type: "DOCUMENT",
			title: input.filename,
			summary:
				"Comprobante cargado por el contador para procesamiento multi-agente.",
			source: "DOCUMENT_UPLOAD",
			sourceRef: input.documentId,
			contentHash: input.documentId,
			metadata: { mimeType },
		});

		const agentRun = await this.startAndCompleteMockAgentRun(
			context,
			fiscalCase.id,
			"CPE_AGENT",
		);

		return {
			fiscalCase,
			agentRun,
			agentStreamQuery: {
				documentId: input.documentId,
				filename: input.filename,
				mimeType,
			},
		};
	}

	async listFiscalCases(context: DrenyraActorContext): Promise<FiscalCase[]> {
		return this.repository.listFiscalCases(makeScope(context));
	}

	async getFiscalCaseDetails(
		context: DrenyraActorContext,
		caseId: string,
	): Promise<FiscalCaseDetails | null> {
		const scope = makeScope(context);
		const fiscalCase = await this.repository.getFiscalCaseById(caseId, scope);
		if (!fiscalCase) return null;
		const [evidence, agentRuns, approvals, auditEvents] = await Promise.all([
			this.repository.listEvidence(caseId, scope),
			this.repository.listAgentRuns(caseId, scope),
			this.repository.listApprovalRequests(caseId, scope),
			this.repository.listAuditEvents(caseId, scope),
		]);
		return { case: fiscalCase, evidence, agentRuns, approvals, auditEvents };
	}

	async listAuditEvents(
		context: DrenyraActorContext,
		input: ListAuditEventsInput = {},
	): Promise<AuditEvent[]> {
		return this.repository.listScopedAuditEvents(makeScope(context), input);
	}

	async inspectFiscalWorkItem(
		context: DrenyraActorContext,
		input: InspectFiscalWorkItemInput,
	): Promise<DrenyraFiscalWorkInspectEnvelope> {
		const traceId = input.traceId ?? newTraceId();
		const baseEnvelope = {
			traceId,
			capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
			sourceSurface: input.sourceSurface,
		};

		if (!hasCompleteInspectContext(context) || !input.workItemId.trim()) {
			return {
				...baseEnvelope,
				status: "validation_failed",
				reasonCode: "TENANT_CONTEXT_REQUIRED",
				redactedDetail:
					"Drenyra fiscal work inspect requires complete fiscal scope and work item id",
			};
		}

		if (!input.capabilityGranted) {
			return {
				...baseEnvelope,
				status: "denied",
				reasonCode: "DRENYRA_CAPABILITY_DENIED",
				redactedDetail:
					"Capability grant denied for Drenyra fiscal work inspect",
			};
		}

		const details = await this.getFiscalCaseDetails(context, input.workItemId);
		if (!details) {
			return {
				...baseEnvelope,
				status: "not_found",
				reasonCode: "NOT_FOUND",
				redactedDetail: "Fiscal work item was not found in the requested scope",
			};
		}

		const evidenceRefs = details.evidence.map((item) => item.id);
		return {
			...baseEnvelope,
			status: "success",
			reasonCode: "OK",
			data: details,
			evidenceRefs,
			summary: `${details.case.title} · ${details.case.status} · ${details.case.scope.period}`,
		};
	}

	/**
	 * Updates a fiscal case status after scoped lookup and writes an audit event.
	 *
	 * @param context - Trusted company, RUC, organization, period and user context.
	 * @param caseId - Fiscal case identifier to update within the trusted scope.
	 * @param input - New manual status and optional reviewer reason.
	 * @returns Updated fiscal case persisted by the repository.
	 * @throws FISCAL_CASE_NOT_FOUND when the case is missing or outside scope.
	 * @throws FISCAL_CASE_STATUS_REQUIRES_APPROVAL_REQUEST when attempting manual APPROVAL_PENDING.
	 * @throws FISCAL_CASE_STATUS_UNCHANGED when the requested status matches current status.
	 * @example
	 * await service.updateFiscalCaseStatus(context, caseId, { status: "RESOLVED", reason: "Evidence reviewed" });
	 */
	async updateFiscalCaseStatus(
		context: DrenyraActorContext,
		caseId: string,
		input: UpdateFiscalCaseStatusInput,
	): Promise<FiscalCase> {
		const scope = makeScope(context);
		const fiscalCase = await this.repository.getFiscalCaseById(caseId, scope);
		if (!fiscalCase) throw new Error("FISCAL_CASE_NOT_FOUND");
		if (input.status === "APPROVAL_PENDING")
			throw new Error("FISCAL_CASE_STATUS_REQUIRES_APPROVAL_REQUEST");
		if (fiscalCase.status === input.status)
			throw new Error("FISCAL_CASE_STATUS_UNCHANGED");

		const updated = await this.repository.updateFiscalCase({
			...fiscalCase,
			status: input.status,
			updatedAt: nowIso(),
		});
		await this.writeAuditEvent(context, {
			caseId,
			eventType: "FISCAL_CASE_STATUS_CHANGED",
			message: `Fiscal case status changed from ${fiscalCase.status} to ${input.status}`,
			metadata: {
				previousStatus: fiscalCase.status,
				nextStatus: input.status,
				reason: input.reason ?? "Manual status update",
			},
		});
		return updated;
	}

	async addEvidenceItem(
		context: DrenyraActorContext,
		caseId: string,
		input: AddEvidenceInput,
	): Promise<EvidenceItem> {
		const scope = makeScope(context);
		const fiscalCase = await this.repository.getFiscalCaseById(caseId, scope);
		if (!fiscalCase) throw new Error("FISCAL_CASE_NOT_FOUND");
		if (input.idempotencyKey) {
			const existing = (await this.repository.listEvidence(caseId, scope)).find(
				(item) => hasIdempotencyKey(item, input.idempotencyKey),
			);
			if (existing) return existing;
		}
		const contentHash =
			input.contentHash ??
			(await digestText(
				`${caseId}:${input.source}:${input.sourceRef ?? ""}:${input.summary}`,
			));
		const item: EvidenceItem = {
			id: newId("evidence"),
			caseId,
			scope,
			type: input.type,
			title: input.title,
			summary: input.summary,
			source: input.source,
			sourceRef: input.sourceRef,
			contentHash,
			addedBy: context.userId,
			createdAt: nowIso(),
			metadata: metadataWithIdempotency(input.metadata, input.idempotencyKey),
		};

		await this.repository.addEvidenceItem(item);
		await this.writeAuditEvent(context, {
			caseId,
			eventType: "EVIDENCE_ADDED",
			message: `Evidence added: ${item.title}`,
			metadata: {
				evidenceId: item.id,
				evidenceType: item.type,
				source: item.source,
			},
		});
		return item;
	}

	async startAndCompleteMockAgentRun(
		context: DrenyraActorContext,
		caseId: string,
		agentType: DrenyraAgentType,
		idempotencyKey?: string,
	): Promise<AgentRun> {
		const scope = makeScope(context);
		const fiscalCase = await this.repository.getFiscalCaseById(caseId, scope);
		if (!fiscalCase) throw new Error("FISCAL_CASE_NOT_FOUND");
		if (idempotencyKey) {
			const existing = (
				await this.repository.listAgentRuns(caseId, scope)
			).find((run) => hasIdempotencyKey(run, idempotencyKey));
			if (existing) return existing;
		}
		const startedAt = nowIso();
		const started: AgentRun = {
			id: newId("run"),
			caseId,
			scope,
			agentType,
			status: "STARTED",
			startedBy: context.userId,
			startedAt,
			metadata: metadataWithIdempotency(
				{ deterministic: true, provider: "mock" },
				idempotencyKey,
			),
		};
		await this.repository.createAgentRun(started);
		await this.writeAuditEvent(context, {
			caseId,
			eventType: "AGENT_RUN_STARTED",
			message: `${agentType} started a deterministic mock run`,
			metadata: { agentRunId: started.id, agentType },
		});

		const output = runDeterministicMockAgent(agentType, fiscalCase);

		// Intención↔acción verification: validar findings contra motor determinístico
		const verificationReport = verifyAgentRunOutput(output, {
			companyRuc: context.companyRuc,
			period: context.period,
		});

		const completed: AgentRun = {
			...started,
			status: "COMPLETED",
			completedAt: nowIso(),
			output: {
				...output,
				confidence: verificationReport.adjustedConfidence / 100,
				verificationReport,
			},
		};
		await this.repository.updateAgentRun(completed);
		await this.repository.addEvidenceItem({
			id: newId("evidence"),
			caseId,
			scope,
			type: "AGENT_OUTPUT",
			title: `${agentType} output`,
			summary: output.summary,
			source: agentType,
			sourceRef: completed.id,
			contentHash: await digestText(JSON.stringify(output)),
			addedBy: context.userId,
			createdAt: nowIso(),
			metadata: { agentRunId: completed.id },
		});
		await this.writeAuditEvent(context, {
			caseId,
			eventType: "AGENT_RUN_COMPLETED",
			message: `${agentType} completed deterministic output`,
			metadata: {
				agentRunId: completed.id,
				riskLevel: output.riskLevel,
				approvalRequired: output.approvalRequired,
			},
		});
		return completed;
	}

	async listAgentRuns(
		context: DrenyraActorContext,
		caseId: string,
	): Promise<AgentRun[]> {
		const scope = makeScope(context);
		const fiscalCase = await this.repository.getFiscalCaseById(caseId, scope);
		if (!fiscalCase) throw new Error("FISCAL_CASE_NOT_FOUND");
		return this.repository.listAgentRuns(caseId, scope);
	}

	async requestApproval(
		context: DrenyraActorContext,
		caseId: string,
		input: RequestApprovalInput,
	): Promise<ApprovalRequest> {
		const scope = makeScope(context);
		const fiscalCase = await this.repository.getFiscalCaseById(caseId, scope);
		if (!fiscalCase) throw new Error("FISCAL_CASE_NOT_FOUND");
		if (input.idempotencyKey) {
			const existing = (
				await this.repository.listApprovalRequests(caseId, scope)
			).find((approval) => hasIdempotencyKey(approval, input.idempotencyKey));
			if (existing) return existing;
		}
		const request: ApprovalRequest = {
			id: newId("approval"),
			caseId,
			scope,
			status: "PENDING",
			title: input.title,
			description: input.description,
			autonomyLevel: input.autonomyLevel ?? fiscalCase.autonomyLevel,
			requestedBy: context.userId,
			requestedAt: nowIso(),
			diff: input.diff,
			metadata: metadataWithIdempotency(input.metadata, input.idempotencyKey),
		};
		await this.repository.createApprovalRequest(request);
		await this.repository.updateFiscalCase({
			...fiscalCase,
			status: "APPROVAL_PENDING",
			updatedAt: nowIso(),
		});
		await this.writeAuditEvent(context, {
			caseId,
			eventType: "APPROVAL_REQUESTED",
			message: `Approval requested: ${request.title}`,
			metadata: {
				approvalId: request.id,
				autonomyLevel: request.autonomyLevel,
			},
		});
		return request;
	}

	async approveApprovalRequest(
		context: DrenyraActorContext,
		approvalId: string,
		input: DecideApprovalInput = {},
	): Promise<ApprovalRequest> {
		return this.decideApproval(
			context,
			approvalId,
			"APPROVED",
			input.decisionReason ?? "Approved by fiscal reviewer",
		);
	}

	async rejectApprovalRequest(
		context: DrenyraActorContext,
		approvalId: string,
		input: DecideApprovalInput = {},
	): Promise<ApprovalRequest> {
		return this.decideApproval(
			context,
			approvalId,
			"REJECTED",
			input.decisionReason ?? "Rejected by fiscal reviewer",
		);
	}

	private async decideApproval(
		context: DrenyraActorContext,
		approvalId: string,
		status: "APPROVED" | "REJECTED",
		decisionReason: string,
	): Promise<ApprovalRequest> {
		const scope = makeScope(context);
		const request = await this.repository.getApprovalRequestById(
			approvalId,
			scope,
		);
		if (!request) throw new Error("APPROVAL_NOT_FOUND");
		if (request.status !== "PENDING")
			throw new Error("APPROVAL_ALREADY_DECIDED");
		const decided: ApprovalRequest = {
			...request,
			status,
			decidedBy: context.userId,
			decidedAt: nowIso(),
			decisionReason,
		};
		await this.repository.updateApprovalRequest(decided);
		await this.writeAuditEvent(context, {
			caseId: request.caseId,
			eventType:
				status === "APPROVED" ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
			message: `${status === "APPROVED" ? "Approved" : "Rejected"}: ${request.title}`,
			metadata: { approvalId, decisionReason },
		});
		return decided;
	}

	async recordCapabilityDecision(
		context: DrenyraActorContext,
		input: RecordCapabilityDecisionInput,
	): Promise<AuditEvent> {
		return this.writeAuditEvent(context, {
			caseId: input.caseId,
			eventType:
				input.decision === "allowed"
					? "CAPABILITY_ALLOWED"
					: "CAPABILITY_DENIED",
			message: `Drenyra command capability ${input.decision}: ${input.commandId}`,
			metadata: {
				agentType: input.agentType,
				commandId: input.commandId,
				reason: input.reason,
				toolId: input.toolId,
				traceId: input.traceId,
			},
		});
	}

	async listCommandAuditEvents(
		context: DrenyraActorContext,
		filter: DrenyraAuditEventFilter = {},
	): Promise<AuditEvent[]> {
		return this.repository.listCommandAuditEvents(makeScope(context), filter);
	}

	private async writeAuditEvent(
		context: DrenyraActorContext,
		input: {
			caseId?: string;
			eventType: AuditEventType;
			message: string;
			metadata?: Record<string, unknown>;
		},
	): Promise<AuditEvent> {
		const event: AuditEvent = {
			id: newId("audit"),
			caseId: input.caseId,
			scope: makeScope(context),
			eventType: input.eventType,
			actorId: context.userId,
			message: input.message,
			occurredAt: nowIso(),
			metadata: input.metadata ?? {},
		};
		return this.repository.createAuditEvent(event);
	}
}
