import { describe, expect, it } from "vitest";
import { dataRetentionAgent } from "../data-retention.agent";
import type { Task } from "../../types";

const now = "2026-05-31T00:00:00.000Z";
function task(records: unknown[]): Task {
	return { id: "retention", type: "retention", payload: { context: { tenantId: "tenant-1" }, records } };
}

describe("dataRetentionAgent", () => {
	it("does not mark fiscal evidence for deletion", async () => {
		const result = await dataRetentionAgent.execute(task([{ id: "cdr-1", dataType: "cdr", createdAt: "2010-01-01T00:00:00.000Z", fiscalEvidence: true }]), { now });
		expect(result.data.policies[0].action).toBe("retain_fiscal_evidence");
	});

	it("warns for expired personal data", async () => {
		const result = await dataRetentionAgent.execute(task([{ id: "p-1", dataType: "personal_data", createdAt: "2024-01-01T00:00:00.000Z", purposeActive: false }]), { now });
		expect(result.data.findings.some((finding) => finding.category === "retention_expired")).toBe(true);
	});

	it("recommends action for expired operational logs", async () => {
		const result = await dataRetentionAgent.execute(task([{ id: "log-1", dataType: "operational_log", createdAt: "2025-01-01T00:00:00.000Z" }]), { now });
		expect(result.data.policies[0].action).toBe("archive");
		expect(result.data.recommendations).toHaveLength(1);
	});

	it("creates finding when date is missing", async () => {
		const result = await dataRetentionAgent.execute(task([{ id: "x-1", dataType: "personal_data" }]), { now });
		expect(result.data.findings[0].category).toBe("missing_retention_date");
	});
});
