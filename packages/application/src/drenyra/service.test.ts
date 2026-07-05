import {
	DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
	DRENYRA_FISCAL_WORK_INSPECT_REASON_CODES,
	DRENYRA_FISCAL_WORK_INSPECT_STATUSES,
} from "@drenyra/domain/drenyra";
import { describe, expect, it } from "vitest";
import { InMemoryDrenyraRepository } from "./in-memory-repository";
import {
	type DrenyraActorContext,
	DrenyraFiscalCommandCenterService,
} from "./service";

const context: DrenyraActorContext = {
	companyId: "company-001",
	companyRuc: "20123456789",
	organizationId: "org-001",
	period: "2026-05",
	userId: "user-001",
};

function makeService() {
	const repository = new InMemoryDrenyraRepository();
	return {
		repository,
		service: new DrenyraFiscalCommandCenterService(repository),
	};
}

describe("DrenyraFiscalCommandCenterService", () => {
	it("exposes stable inspect envelope discriminants and reason codes", () => {
		expect(DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY).toBe(
			"drenyra.fiscal-work.inspect",
		);
		expect(DRENYRA_FISCAL_WORK_INSPECT_STATUSES).toEqual([
			"success",
			"denied",
			"not_found",
			"validation_failed",
		]);
		expect(DRENYRA_FISCAL_WORK_INSPECT_REASON_CODES).toEqual([
			"OK",
			"TENANT_CONTEXT_REQUIRED",
			"DRENYRA_CAPABILITY_DENIED",
			"SCOPE_MISMATCH",
			"NOT_FOUND",
			"VALIDATION_FAILED",
		]);
	});

	it("creates a fiscal case and writes an audit event", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "MONTHLY_CLOSE",
			title: "Cierre mayo 2026",
			description: "Preparar cierre mensual fiscal",
			riskLevel: "MEDIUM",
			riskScore: 42,
		});

		const details = await service.getFiscalCaseDetails(context, fiscalCase.id);
		expect(fiscalCase.scope.companyRuc).toBe("20123456789");
		expect(details?.auditEvents).toHaveLength(1);
		expect(details?.auditEvents[0]?.eventType).toBe("FISCAL_CASE_CREATED");
	});

	it("isolates fiscal cases by company RUC, organization and fiscal period", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "MONTHLY_CLOSE",
			title: "Cierre mayo aislado",
			description: "Caso fiscal con scope completo",
		});

		await expect(
			service.getFiscalCaseDetails(
				{ ...context, period: "2026-06" },
				fiscalCase.id,
			),
		).resolves.toBeNull();
		await expect(
			service.getFiscalCaseDetails(
				{ ...context, organizationId: "org-002" },
				fiscalCase.id,
			),
		).resolves.toBeNull();
		await expect(
			service.getFiscalCaseDetails(
				{ ...context, companyRuc: "20999999999" },
				fiscalCase.id,
			),
		).resolves.toBeNull();
	});

	it("updates fiscal case status and audits the transition", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "MONTHLY_CLOSE",
			title: "Cierre con revisión",
			description: "Preparar cambio de estado auditado",
		});

		const updated = await service.updateFiscalCaseStatus(
			context,
			fiscalCase.id,
			{
				status: "IN_REVIEW",
				reason: "Revisión humana iniciada",
			},
		);
		const details = await service.getFiscalCaseDetails(context, fiscalCase.id);
		const statusEvent = details?.auditEvents.find(
			(event) => event.eventType === "FISCAL_CASE_STATUS_CHANGED",
		);

		expect(updated.status).toBe("IN_REVIEW");
		expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(
			Date.parse(fiscalCase.updatedAt),
		);
		expect(statusEvent?.metadata).toMatchObject({
			previousStatus: "OPEN",
			nextStatus: "IN_REVIEW",
			reason: "Revisión humana iniciada",
		});
	});

	it("does not update fiscal case status outside the scoped period", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "SIRE_REVIEW",
			title: "SIRE scoped",
			description: "Debe respetar periodo fiscal",
		});

		await expect(
			service.updateFiscalCaseStatus(
				{ ...context, period: "2026-06" },
				fiscalCase.id,
				{ status: "IN_REVIEW" },
			),
		).rejects.toThrow("FISCAL_CASE_NOT_FOUND");
		const details = await service.getFiscalCaseDetails(context, fiscalCase.id);

		expect(details?.case.status).toBe("OPEN");
		expect(details?.auditEvents.map((event) => event.eventType)).not.toContain(
			"FISCAL_CASE_STATUS_CHANGED",
		);
	});

	it("rejects manual approval-pending status updates", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "MONTHLY_CLOSE",
			title: "Approval pending guarded",
			description: "Debe usar solicitud de aprobación",
		});

		await expect(
			service.updateFiscalCaseStatus(context, fiscalCase.id, {
				status: "APPROVAL_PENDING",
			}),
		).rejects.toThrow("FISCAL_CASE_STATUS_REQUIRES_APPROVAL_REQUEST");
	});

	it("rejects unchanged fiscal case status updates", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "LEDGER_REVIEW",
			title: "Ledger unchanged",
			description: "Evitar auditoría redundante",
		});

		await expect(
			service.updateFiscalCaseStatus(context, fiscalCase.id, {
				status: "OPEN",
			}),
		).rejects.toThrow("FISCAL_CASE_STATUS_UNCHANGED");
	});

	it("adds evidence to a fiscal case and audits it", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "SIRE_REVIEW",
			title: "SIRE compras",
			description: "Revisión de propuesta SIRE",
		});

		const evidence = await service.addEvidenceItem(context, fiscalCase.id, {
			type: "SUNAT_RECORD",
			title: "Propuesta SIRE",
			summary: "SUNAT propuesta descargada para revisión",
			source: "SUNAT Portal",
			sourceRef: "sire-2026-05",
		});
		const details = await service.getFiscalCaseDetails(context, fiscalCase.id);

		expect(evidence.contentHash).toHaveLength(64);
		expect(details?.evidence).toHaveLength(1);
		expect(details?.auditEvents.map((event) => event.eventType)).toContain(
			"EVIDENCE_ADDED",
		);
	});

	it("bootstraps a document mission with case, evidence and agent run", async () => {
		const { service } = makeService();
		const mission = await service.bootstrapDocumentMission(context, {
			documentId: "doc_test_001",
			filename: "F001-00001234.xml",
			mimeType: "text/xml",
		});
		const details = await service.getFiscalCaseDetails(
			context,
			mission.fiscalCase.id,
		);

		expect(mission.fiscalCase.type).toBe("CPE_REVIEW");
		expect(mission.fiscalCase.metadata.documentId).toBe("doc_test_001");
		expect(mission.agentRun.agentType).toBe("CPE_AGENT");
		expect(
			details?.evidence.some((item) => item.sourceRef === "doc_test_001"),
		).toBe(true);
	});

	it("starts and completes a deterministic mock agent run", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "CPE_REVIEW",
			title: "Validar CPE F001-100",
			description: "Revisar evidencia del comprobante",
			riskLevel: "HIGH",
			riskScore: 76,
		});

		const run = await service.startAndCompleteMockAgentRun(
			context,
			fiscalCase.id,
			"CPE_AGENT",
		);
		const details = await service.getFiscalCaseDetails(context, fiscalCase.id);

		expect(run.status).toBe("COMPLETED");
		expect(run.output?.approvalRequired).toBe(true);
		expect(run.output?.requiredEvidence).toContain("CDR SUNAT");
		expect(details?.evidence.some((item) => item.type === "AGENT_OUTPUT")).toBe(
			true,
		);
		expect(details?.auditEvents.map((event) => event.eventType)).toContain(
			"AGENT_RUN_COMPLETED",
		);
	});

	it("requests approval and writes an audit event", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "LEDGER_REVIEW",
			title: "Ajuste libro mayor",
			description: "Preparar ajuste contable sujeto a revisión",
		});

		const approval = await service.requestApproval(context, fiscalCase.id, {
			title: "Aprobar ajuste contable",
			description: "El ajuste queda preparado pero no ejecutado",
			diff: {
				before: { status: "draft" },
				after: { status: "prepared" },
				summary: "Preparar ajuste",
			},
		});
		const details = await service.getFiscalCaseDetails(context, fiscalCase.id);

		expect(approval.status).toBe("PENDING");
		expect(details?.case.status).toBe("APPROVAL_PENDING");
		expect(details?.auditEvents.map((event) => event.eventType)).toContain(
			"APPROVAL_REQUESTED",
		);
	});

	it("approves and rejects approval requests with audit trail", async () => {
		const { service } = makeService();
		const firstCase = await service.createFiscalCase(context, {
			type: "CONCILIATION",
			title: "Conciliación BCP",
			description: "Preparar match bancario",
		});
		const secondCase = await service.createFiscalCase(context, {
			type: "EVIDENCE_REVIEW",
			title: "Evidencia incompleta",
			description: "Completar evidencia para cierre",
		});
		const approval = await service.requestApproval(context, firstCase.id, {
			title: "Aprobar match",
			description: "Match preparado por mock agent",
			diff: { before: {}, after: { matched: true }, summary: "Match bancario" },
		});
		const rejection = await service.requestApproval(context, secondCase.id, {
			title: "Aprobar evidencia",
			description: "Evidencia aún incompleta",
			diff: {
				before: {},
				after: { ready: false },
				summary: "Evidencia insuficiente",
			},
		});

		const approved = await service.approveApprovalRequest(
			context,
			approval.id,
			{ decisionReason: "Evidencia suficiente" },
		);
		const rejected = await service.rejectApprovalRequest(
			context,
			rejection.id,
			{ decisionReason: "Falta CDR" },
		);
		const approvedDetails = await service.getFiscalCaseDetails(
			context,
			firstCase.id,
		);
		const rejectedDetails = await service.getFiscalCaseDetails(
			context,
			secondCase.id,
		);

		expect(approved.status).toBe("APPROVED");
		expect(rejected.status).toBe("REJECTED");
		expect(
			approvedDetails?.auditEvents.map((event) => event.eventType),
		).toContain("APPROVAL_APPROVED");
		expect(
			rejectedDetails?.auditEvents.map((event) => event.eventType),
		).toContain("APPROVAL_REJECTED");
	});

	it("inspects a scoped fiscal work item with shared envelope metadata", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "SIRE_REVIEW",
			title: "Inspect SIRE work item",
			description: "Read-only inspect contract",
		});
		const evidence = await service.addEvidenceItem(context, fiscalCase.id, {
			type: "SUNAT_RECORD",
			title: "SIRE evidence",
			summary: "Scoped SIRE evidence",
			source: "SUNAT",
		});

		const envelope = await service.inspectFiscalWorkItem(context, {
			workItemId: fiscalCase.id,
			capabilityGranted: true,
			traceId: "trace-test-001",
			sourceSurface: "web",
		});

		expect(envelope).toMatchObject({
			status: "success",
			reasonCode: "OK",
			traceId: "trace-test-001",
			capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
			sourceSurface: "web",
		});
		expect(envelope.data?.case.id).toBe(fiscalCase.id);
		expect(envelope.evidenceRefs).toContain(evidence.id);
		expect(envelope.summary).toContain("Inspect SIRE work item");
	});

	it("returns safe not-found envelopes for scoped fiscal work mismatches", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "MONTHLY_CLOSE",
			title: "Scoped inspect mismatch",
			description: "Should not leak across scope",
		});

		const envelopes = await Promise.all([
			service.inspectFiscalWorkItem(
				{ ...context, period: "2026-06" },
				{
					workItemId: fiscalCase.id,
					capabilityGranted: true,
					traceId: "trace-period",
				},
			),
			service.inspectFiscalWorkItem(
				{ ...context, companyRuc: "20999999999" },
				{
					workItemId: fiscalCase.id,
					capabilityGranted: true,
					traceId: "trace-ruc",
				},
			),
			service.inspectFiscalWorkItem(
				{ ...context, companyId: "company-002" },
				{
					workItemId: fiscalCase.id,
					capabilityGranted: true,
					traceId: "trace-company",
				},
			),
			service.inspectFiscalWorkItem(
				{ ...context, organizationId: "org-002" },
				{
					workItemId: fiscalCase.id,
					capabilityGranted: true,
					traceId: "trace-org",
				},
			),
		]);

		for (const envelope of envelopes) {
			expect(envelope.status).toBe("not_found");
			expect(envelope.reasonCode).toBe("NOT_FOUND");
			expect(envelope.data).toBeUndefined();
			expect(envelope.evidenceRefs).toBeUndefined();
		}
	});

	it("denies fiscal work inspect when required scope or capability is missing", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "EVIDENCE_REVIEW",
			title: "Inspect denied",
			description: "Missing grant and missing scope should fail closed",
		});

		const missingScope = await service.inspectFiscalWorkItem(
			{ ...context, companyRuc: "" },
			{
				workItemId: fiscalCase.id,
				capabilityGranted: true,
				traceId: "trace-missing",
			},
		);
		const deniedCapability = await service.inspectFiscalWorkItem(context, {
			workItemId: fiscalCase.id,
			capabilityGranted: false,
			traceId: "trace-denied",
		});

		expect(missingScope).toMatchObject({
			status: "validation_failed",
			reasonCode: "TENANT_CONTEXT_REQUIRED",
			traceId: "trace-missing",
		});
		expect(missingScope.data).toBeUndefined();
		expect(deniedCapability).toMatchObject({
			status: "denied",
			reasonCode: "DRENYRA_CAPABILITY_DENIED",
			traceId: "trace-denied",
		});
		expect(deniedCapability.data).toBeUndefined();
		expect(deniedCapability.evidenceRefs).toBeUndefined();
	});

	it("does not mutate fiscal work state during allowed or denied inspect", async () => {
		const { service } = makeService();
		const fiscalCase = await service.createFiscalCase(context, {
			type: "LEDGER_REVIEW",
			title: "Inspect no side effects",
			description: "Read-only inspect should not mutate state",
		});
		const before = await service.getFiscalCaseDetails(context, fiscalCase.id);

		await service.inspectFiscalWorkItem(context, {
			workItemId: fiscalCase.id,
			capabilityGranted: true,
		});
		await service.inspectFiscalWorkItem(context, {
			workItemId: fiscalCase.id,
			capabilityGranted: false,
		});

		const after = await service.getFiscalCaseDetails(context, fiscalCase.id);
		expect(after?.case.status).toBe(before?.case.status);
		expect(after?.evidence).toHaveLength(before?.evidence.length ?? 0);
		expect(after?.approvals).toHaveLength(before?.approvals.length ?? 0);
		expect(after?.agentRuns).toHaveLength(before?.agentRuns.length ?? 0);
		expect(after?.auditEvents).toHaveLength(before?.auditEvents.length ?? 0);
	});

	it("lists scoped command capability audit events including case-less events", async () => {
		const { repository, service } = makeService();
		const scope = {
			companyId: context.companyId,
			companyRuc: context.companyRuc,
			countryCode: "PE",
			organizationId: context.organizationId,
			period: context.period,
		};
		await repository.createAuditEvent({
			id: "audit-allowed",
			scope,
			eventType: "CAPABILITY_ALLOWED",
			actorId: context.userId,
			message: "Allowed command",
			occurredAt: "2026-05-27T00:02:00.000Z",
			metadata: { commandId: "review-sunat" },
		});
		await repository.createAuditEvent({
			id: "audit-denied",
			caseId: "case-1",
			scope,
			eventType: "CAPABILITY_DENIED",
			actorId: context.userId,
			message: "Denied command",
			occurredAt: "2026-05-27T00:01:00.000Z",
			metadata: { commandId: "prepare-evidence" },
		});
		await repository.createAuditEvent({
			id: "audit-other-scope",
			scope: { ...scope, period: "2026-06" },
			eventType: "CAPABILITY_ALLOWED",
			actorId: context.userId,
			message: "Other period",
			occurredAt: "2026-05-27T00:03:00.000Z",
			metadata: { commandId: "review-sunat" },
		});

		const allEvents = await service.listCommandAuditEvents(context);
		const reviewEvents = await service.listCommandAuditEvents(context, {
			commandId: "review-sunat",
			eventType: "CAPABILITY_ALLOWED",
		});

		expect(allEvents.map((event) => event.id)).toEqual([
			"audit-allowed",
			"audit-denied",
		]);
		expect(reviewEvents.map((event) => event.id)).toEqual(["audit-allowed"]);
		expect(reviewEvents[0]?.caseId).toBeUndefined();
	});
});
