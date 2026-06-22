import { describe, expect, it } from "vitest";
import { consentManagerAgent } from "../consent-manager.agent";
import type { Task } from "../../types";

const now = "2026-05-31T00:00:00.000Z";
function task(consents: unknown[]): Task {
	return { id: "consent", type: "consent", payload: { context: { tenantId: "tenant-1" }, consents } };
}

describe("consentManagerAgent", () => {
	it("passes valid consent", async () => {
		const result = await consentManagerAgent.execute(task([{ subjectId: "u1", purposes: ["billing"], consentGiven: true, expiresAt: "2027-01-01T00:00:00.000Z", dataCategories: ["pii"] }]), { now });
		expect(result.data.validCount).toBe(1);
		expect(result.data.findings).toHaveLength(0);
	});

	it("fails expired consent", async () => {
		const result = await consentManagerAgent.execute(task([{ subjectId: "u1", purposes: ["billing"], consentGiven: true, expiresAt: "2025-01-01T00:00:00.000Z", dataCategories: ["pii"] }]), { now });
		expect(result.data.findings.some((finding) => finding.category === "expired_consent")).toBe(true);
	});

	it("fails revoked consent", async () => {
		const result = await consentManagerAgent.execute(task([{ subjectId: "u1", purposes: ["billing"], consentGiven: true, revokedAt: now, dataCategories: ["pii"] }]), { now });
		expect(result.data.findings.some((finding) => finding.category === "revoked_consent")).toBe(true);
	});

	it("reports high or critical for PII without legal basis", async () => {
		const result = await consentManagerAgent.execute(task([{ subjectId: "u1", purposes: [], dataCategories: ["pii"] }]), { now });
		expect(result.success).toBe(false);
		expect(result.data.findings.some((finding) => finding.severity === "critical")).toBe(true);
	});

	it("redacts PII from the full report", async () => {
		const result = await consentManagerAgent.execute(task([{ subjectId: "persona@example.com", purposes: ["billing"], consentGiven: true, dataCategories: ["pii"] }]), { now });
		expect(JSON.stringify(result.data)).not.toContain("persona@example.com");
	});
});
