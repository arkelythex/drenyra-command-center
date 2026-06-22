import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("@/features/compliance/api/compliance-client", () => ({
	getCpeValidatorClient: () => ({
		fallback: {
			probe: {
				post: (...args: unknown[]) => postMock(...args),
			},
		},
	}),
}));

import { postSunatFallbackProbe } from "./sunat-fallback-probe.api";

describe("sunat-fallback-probe.api (Eden)", () => {
	beforeEach(() => {
		postMock.mockReset();
	});

	it("posts probe body and parses success envelope", async () => {
		postMock.mockResolvedValue({
			data: {
				success: true,
				data: {
					source: "visual_subagent",
					fallbackActivated: true,
					response: { ok: true },
					trace: {
						source: "visual_subagent",
						mode: "simulation",
						steps: ["a", "b"],
						txtPreview: "x",
						durationMs: 42,
					},
				},
			},
			error: null,
		});

		const out = await postSunatFallbackProbe({
			mode: "normal",
			companyRuc: "20100070970",
			cpeNumber: "F001-00001234",
			issueDate: "2026-04-19",
			totalAmount: 1180,
		});

		expect(postMock).toHaveBeenCalledWith({
			mode: "normal",
			companyRuc: "20100070970",
			cpeNumber: "F001-00001234",
			issueDate: "2026-04-19",
			totalAmount: 1180,
		});
		expect(out.trace.steps).toEqual(["a", "b"]);
		expect(out.trace.durationMs).toBe(42);
	});

	it("throws on treaty error", async () => {
		postMock.mockResolvedValue({
			data: undefined,
			error: { value: "upstream down" },
		});

		await expect(
			postSunatFallbackProbe({
				mode: "hitl",
				companyRuc: "20100070970",
				cpeNumber: "F001-00001234",
				issueDate: "2026-04-19",
				totalAmount: 1,
			}),
		).rejects.toThrow(/upstream down/);
	});
});
