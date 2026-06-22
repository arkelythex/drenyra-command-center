import { describe, expect, it, vi } from "vitest";
import { Ruc } from "../domain/value-objects/ruc.vo";
import { CpeNumber } from "../domain/value-objects/cpe-number.vo";
import { SunatFallbackOrchestrator } from "../application/fallback/sunat-fallback-orchestrator";

describe("SunatFallbackOrchestrator", () => {
	const request = {
		ruc: Ruc.create("20100070970"),
		cpeNumber: CpeNumber.create("F001-00001234"),
		issueDate: "2026-02-19",
		totalAmount: 1500,
	};

	it("uses primary SUNAT API when available", async () => {
		const primary = {
			validate: vi.fn().mockResolvedValue({
				success: true,
				estado: "ACEPTADO",
				mensaje: "ok",
			}),
		};

		const orchestrator = new SunatFallbackOrchestrator(primary);
		const result = await orchestrator.validate(request);

		expect(result.source).toBe("sunat_api");
		expect(result.fallbackActivated).toBe(false);
		expect(primary.validate).toHaveBeenCalledTimes(1);
	});

	it("activates visual fallback on timeout-like errors", async () => {
		const primary = {
			validate: vi.fn().mockRejectedValue(new Error("SUNAT_API_TIMEOUT")),
		};

		const orchestrator = new SunatFallbackOrchestrator(primary);
		const result = await orchestrator.validate(request);

		expect(result.source).toBe("visual_subagent");
		expect(result.fallbackActivated).toBe(true);
		expect(result.traceSteps.some((step) => step.startsWith("visual_subagent:"))).toBe(
			true,
		);
	});

	it("rethrows non-retryable errors", async () => {
		const primary = {
			validate: vi.fn().mockRejectedValue(new Error("INVALID_REQUEST_SIGNATURE")),
		};

		const orchestrator = new SunatFallbackOrchestrator(primary);
		await expect(orchestrator.validate(request)).rejects.toThrow(
			"INVALID_REQUEST_SIGNATURE",
		);
	});
});
