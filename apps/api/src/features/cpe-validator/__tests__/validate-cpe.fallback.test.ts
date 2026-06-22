import { afterEach, describe, expect, it } from "vitest";
import { validateCpe } from "../application/commands/validate-cpe.command";
import { VALID_CPE_XML } from "./support/valid-cpe-xml";

describe("validateCpe fallback", () => {
	afterEach(() => {
		delete process.env.SUNAT_CPE_FORCE_TIMEOUT;
		delete process.env.SUNAT_AGENTIC_FALLBACK_MODE;
		delete process.env.SUNAT_CPE_VALIDATION_MODE;
		delete process.env.SUNAT_AGENTIC_REQUIRE_HITL;
	});

	it("falls back to visual subagent on SUNAT timeout", async () => {
		process.env.SUNAT_CPE_FORCE_TIMEOUT = "true";
		process.env.SUNAT_AGENTIC_FALLBACK_MODE = "simulation";
		process.env.SUNAT_CPE_VALIDATION_MODE = "api";

		const result = await validateCpe({
			companyRuc: "20100070970",
			cpeNumber: "F001-00001234",
			xmlContent: VALID_CPE_XML,
			issueDate: "2026-02-19",
			totalAmount: 1000,
			skipCache: true,
		});

		expect(result.validationSource).toBe("visual_subagent");
		expect(result.fallbackActivated).toBe(true);
		expect(result.traceSteps.some((step) => step.includes("visual_subagent"))).toBe(
			true,
		);
		expect(result.incident).toMatchObject({
			isIncident: true,
			category: "MANUAL_REVIEW",
		});
	});

	it("emits HITL request when fallback finds captcha challenge", async () => {
		process.env.SUNAT_CPE_FORCE_TIMEOUT = "true";
		process.env.SUNAT_AGENTIC_FALLBACK_MODE = "simulation";
		process.env.SUNAT_CPE_VALIDATION_MODE = "api";
		process.env.SUNAT_AGENTIC_REQUIRE_HITL = "true";

		const result = await validateCpe({
			companyRuc: "20100070970",
			cpeNumber: "F001-00007777",
			xmlContent: VALID_CPE_XML,
			issueDate: "2026-02-19",
			totalAmount: 1000,
			skipCache: true,
		});

		expect(result.validationSource).toBe("visual_subagent");
		expect(result.fallbackActivated).toBe(true);
		expect(result.hitlRequired).toBe(true);
		expect(result.hitl?.channel).toBe("whatsapp");
		expect(result.traceSteps).toContain("visual_subagent:hitl-pause");
		expect(result.incident).toMatchObject({
			isIncident: true,
			category: "MANUAL_REVIEW",
			severity: "high",
		});
	});
});
