import { describe, expect, it } from "vitest";
import { privacyAssessorAgent } from "../privacy-assessor.agent";
import type { Task } from "../../types";

function task(payload: Record<string, unknown>): Task {
	return { id: "privacy", type: "privacy", payload: { context: { tenantId: "tenant-1" }, ...payload } };
}

describe("privacyAssessorAgent", () => {
	it("returns low risk for public data", async () => {
		const result = await privacyAssessorAgent.execute(task({ data: { title: "Public product update" }, purpose: "marketing" }));
		expect(result.data.privacyRiskScore).toBe(0);
	});

	it("returns high risk for PII plus financial data", async () => {
		const result = await privacyAssessorAgent.execute(task({ data: { email: "persona@example.com", accountNumber: "001122334455667788" }, purpose: "billing" }));
		expect(result.data.privacyRiskScore).toBeGreaterThanOrEqual(75);
	});

	it("returns critical risk for secrets", async () => {
		const result = await privacyAssessorAgent.execute(task({ data: { token: "token=supersecret123" }, purpose: "support" }));
		expect(result.success).toBe(false);
		expect(result.data.privacyRiskScore).toBe(100);
	});

	it("recommends expected controls", async () => {
		const result = await privacyAssessorAgent.execute(task({ data: { email: "persona@example.com" }, purpose: "billing" }));
		expect(result.data.recommendations).toContain("redaction");
		expect(result.data.recommendations).toContain("access restriction");
	});
});
