import { describe, expect, it } from "vitest";
import { runComplianceAssessment } from "../compliance-assessment";
import type { Task } from "../../types";

describe("runComplianceAssessment", () => {
	it("runs agents in a compatible advisory pipeline", async () => {
		const task: Task = {
			id: "assessment",
			type: "compliance",
			payload: {
				data: { email: "persona@example.com", ruc: "20123456789" },
				context: { tenantId: "tenant-1", companyId: "company-1", ruc: "20123456789" },
				lawfulBasis: "contract",
				purposes: ["billing"],
				requestedRights: ["access"],
				breachNotificationReady: true,
				consents: [{ subjectId: "u1", purposes: ["billing"], lawfulBasis: "contract", dataCategories: ["pii"] }],
				records: [{ id: "cdr-1", dataType: "cdr", createdAt: "2026-01-01T00:00:00.000Z", fiscalEvidence: true }],
				profile: { country: "PE", operationType: "invoice", evidenceRefs: ["ev-1"] },
				events: [{
					id: "evt-1",
					actor: "user-1",
					action: "invoice.create",
					timestamp: "2026-05-31T00:00:00.000Z",
					traceId: "trace-1",
					evidenceRefs: ["ev-1"],
					approvalId: "approval-1",
				}],
			},
		};

		const result = await runComplianceAssessment(task);

		expect(result.advisoryOnly).toBe(true);
		expect(result.classifier.data.classifications.length).toBeGreaterThan(0);
		expect(result.privacy.data.classifications.length).toBeGreaterThan(0);
		expect(result.findings.every((finding) => finding.id.startsWith("finding-"))).toBe(true);
	});

	it("fails closed when scope is missing", async () => {
		const task: Task = {
			id: "assessment-missing-scope",
			type: "compliance",
			payload: { data: { title: "Public product update" } },
		};

		await expect(runComplianceAssessment(task)).rejects.toThrow("Compliance context requires");
	});

	it("keeps well-scoped compliant pipeline free of high and critical findings", async () => {
		const task: Task = {
			id: "assessment-compliant",
			type: "compliance",
			payload: {
				context: { tenantId: "tenant-1", companyId: "company-1", ruc: "20123456789" },
				data: { title: "Public product update" },
				lawfulBasis: "contract",
				purposes: ["billing"],
				requestedRights: ["access"],
				breachNotificationReady: true,
				consents: [{ subjectId: "u1", purposes: ["billing"], lawfulBasis: "contract", dataCategories: [] }],
				records: [{ id: "log-1", dataType: "operational_log", createdAt: "2026-05-01T00:00:00.000Z" }],
				profile: { country: "PE", operationType: "invoice", evidenceRefs: ["ev-1"], reports: ["SIRE"], configured: ["SPOT"] },
				events: [{
					id: "evt-1",
					actor: "user-1",
					action: "invoice.create",
					timestamp: "2026-05-31T00:00:00.000Z",
					traceId: "trace-1",
					evidenceRefs: ["ev-1"],
					approvalId: "approval-1",
				}],
			},
		};

		const result = await runComplianceAssessment(task);
		expect(result.findings.some((finding) => finding.severity === "high" || finding.severity === "critical")).toBe(false);
	});
});
