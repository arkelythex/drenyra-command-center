import { afterEach, describe, expect, it } from "vitest";
import { validateCpe } from "../application/commands/validate-cpe.command";
import { VALID_CPE_XML } from "./support/valid-cpe-xml";

describe("validateCpe command target SLA", () => {
	afterEach(() => {
		delete process.env.SUNAT_CPE_VALIDATION_MODE;
		delete process.env.SUNAT_CPE_REPLAY_FIXTURE_PATH;
		delete process.env.CPE_BREACH_TARGET_MS;
	});

	it("returns target metadata for SLA tracking", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "simulation";
		process.env.CPE_BREACH_TARGET_MS = "5000";

		const result = await validateCpe({
			companyRuc: "20100070970",
			cpeNumber: "F001-00001234",
			xmlContent: VALID_CPE_XML,
			issueDate: "2026-02-15",
			totalAmount: 1000,
			skipCache: true,
		});

		expect(result.targetMs).toBe(5000);
		expect(typeof result.withinTarget).toBe("boolean");
		expect(result.incident).toMatchObject({
			isIncident: false,
			category: "NONE",
		});
	});

	it("reports replay mode explicitly for offline validation", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "replay";

		const result = await validateCpe({
			companyRuc: "20100070970",
			cpeNumber: "F001-00007777",
			xmlContent: VALID_CPE_XML,
			issueDate: "2026-02-15",
			totalAmount: 1000,
			skipCache: true,
		});

		expect(result.validationSource).toBe("sunat_replay");
		expect(result.fallbackActivated).toBe(false);
		expect(result.breachDetected).toBe(true);
		expect(result.breachType).toBe("SUNAT_REJECTED");
		expect(result.traceSteps).toContain("sunat_replay:request");
		expect(result.incident).toMatchObject({
			isIncident: true,
			category: "SUNAT_OBSERVED",
			supportMessage:
				"Revisar tributos, totales y datos del comprobante antes de reenviar.",
			runbook: {
				id: "RB-CPE-INCIDENT-2026-02",
			},
		});
	});
});
