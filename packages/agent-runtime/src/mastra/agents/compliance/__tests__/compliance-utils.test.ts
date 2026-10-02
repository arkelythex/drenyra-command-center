import { describe, expect, it } from "vitest";
import { redactSensitiveFields } from "../compliance-redaction";
import {
	assertScopedContext,
	createFinding,
	riskScoreFromFindings,
} from "../compliance-utils";

describe("compliance utilities", () => {
	it("redacts RUC, DNI, email, token, and account numbers", () => {
		const redacted = redactSensitiveFields({
			ruc: "20123456789",
			dni: "12345678",
			email: "persona@example.com",
			token: "supersecret123",
			apiKey: "anothersecret123",
			"api-key": "sk_test_1234567890",
			clientSecret: "clientsecret123",
			accountNumber: "001122334455667788",
		});

		expect(JSON.stringify(redacted)).not.toContain("20123456789");
		expect(JSON.stringify(redacted)).not.toContain("12345678");
		expect(JSON.stringify(redacted)).not.toContain("persona@example.com");
		expect(JSON.stringify(redacted)).not.toContain("supersecret123");
		expect(JSON.stringify(redacted)).not.toContain("anothersecret123");
		expect(JSON.stringify(redacted)).not.toContain("sk_test_1234567890");
		expect(JSON.stringify(redacted)).not.toContain("clientsecret123");
		expect(JSON.stringify(redacted)).not.toContain("001122334455667788");
	});

	it("fails without minimum scope", () => {
		expect(() => assertScopedContext({ traceId: "trace-1" })).toThrow(
			"Compliance context requires",
		);
	});

	it("calculates risk score by severity", () => {
		const findings = [
			createFinding({
				severity: "low",
				category: "scope",
				message: "Low",
				recommendedAction: "Review",
			}),
			createFinding({
				severity: "critical",
				category: "approval",
				message: "Critical",
				recommendedAction: "Block",
			}),
		];

		expect(riskScoreFromFindings(findings)).toBe(55);
	});

	it("creates deterministic findings", () => {
		const first = createFinding({
			severity: "high",
			category: "trace",
			message: "Missing trace",
			evidenceRefs: ["b", "a"],
			recommendedAction: "Attach trace",
		});
		const second = createFinding({
			severity: "high",
			category: "trace",
			message: "Missing trace",
			evidenceRefs: ["a", "b"],
			recommendedAction: "Attach trace",
		});

		expect(first).toEqual(second);
	});
});
