import { describe, expect, it } from "vitest";
import { runComplianceAssessment } from "../compliance-assessment.agent";

describe("runComplianceAssessment", () => {
	it("runs agents in a compatible advisory pipeline", async () => {
		const task = {
			id: "assessment",
			type: "compliance",
			payload: {
				context: {
					tenantId: "tenant-1",
					companyId: "company-1",
					ruc: "20123456789",
				},
				fields: ["ruc", "dni", "email", "monto", "factura"],
				lawfulBasis: "contract",
				purposes: ["billing"],
				requestedRights: ["access"],
				breachProcedure: "notify-within-24h",
				accessMechanism: "api-portal",
				consentRecords: [
					{
						subjectId: "u1",
						purposes: ["billing"],
						lawfulBasis: "contract",
						dataCategories: [],
					},
				],
				records: [
					{
						id: "cdr-1",
						type: "cdr",
						createdAt: "2026-01-01T00:00:00.000Z",
					},
				],
				profile: {
					country: "PE",
					operationType: "invoice",
					evidenceRefs: ["ev-1"],
				},
				events: [
					{
						id: "evt-1",
						actor: "user-1",
						action: "invoice.create",
						timestamp: "2026-05-31T00:00:00.000Z",
						traceId: "trace-1",
						evidenceRefs: ["ev-1"],
						approvalId: "approval-1",
					},
				],
			},
		};

		const result = await runComplianceAssessment(task);

		expect(result.advisoryOnly).toBe(true);
		expect(result.classifier.classifications.length).toBeGreaterThan(0);
		expect(result.privacy.classifications.length).toBeGreaterThan(0);
		expect(
			result.findings.every((finding) => finding.id.startsWith("finding-")),
		).toBe(true);
	});

	it("fails closed when scope is missing", async () => {
		const task = {
			id: "assessment-missing-scope",
			type: "compliance",
			payload: { data: { title: "Public product update" } },
		};

		await expect(runComplianceAssessment(task)).rejects.toThrow(
			"Compliance context requires",
		);
	});

	it("keeps well-scoped compliant pipeline free of high and critical findings", async () => {
		const task = {
			id: "assessment-compliant",
			type: "compliance",
			payload: {
				context: {
					tenantId: "tenant-1",
					companyId: "company-1",
					ruc: "20123456789",
					period: "2026-05",
				},
				fields: ["title", "description"],
				lawfulBasis: "contract",
				purposes: ["billing"],
				requestedRights: ["access"],
				breachProcedure: "notify-within-24h",
				accessMechanism: "api-portal",
				consentRecords: [
					{
						subjectId: "u1",
						purposes: ["billing"],
						lawfulBasis: "contract",
						dataCategories: [],
					},
				],
				records: [
					{
						id: "log-1",
						type: "operational_log",
						createdAt: "2026-05-01T00:00:00.000Z",
					},
				],
				profile: {
					country: "PE",
					operationType: "invoice",
					evidenceRefs: ["ev-1"],
					reports: ["SIRE"],
					configured: ["SPOT"],
				},
				events: [
					{
						id: "evt-1",
						actor: "user-1",
						action: "invoice.create",
						timestamp: "2026-05-31T00:00:00.000Z",
						traceId: "trace-1",
						evidenceRefs: ["ev-1"],
						approvalId: "approval-1",
					},
				],
			},
		};

		const result = await runComplianceAssessment(task);
		expect(
			result.findings.some(
				(finding) =>
					finding.severity === "high" || finding.severity === "critical",
			),
		).toBe(false);
	});
});
