import { describe, expect, it } from "vitest";
import { resolveSubmitGate } from "../submit-gate";

describe("resolveSubmitGate", () => {
	it("inherits server submitBlocked", () => {
		const gate = resolveSubmitGate({
			artifact: {
				submitBlocked: true,
				submitBlockReason: "server blocked",
				summary: {
					matched: 0,
					mismatched: 1,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 1,
					totalDifference: 10,
				},
				sunatSource: "upload",
			},
			pendingDecisions: 0,
		});
		expect(gate.submitBlocked).toBe(true);
		expect(gate.submitBlockReason).toBe("server blocked");
	});

	it("blocks when pending row decisions remain", () => {
		const gate = resolveSubmitGate({
			artifact: {
				submitBlocked: false,
				summary: {
					matched: 1,
					mismatched: 0,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 0,
					totalDifference: 0,
				},
				sunatSource: "upload",
			},
			pendingDecisions: 2,
		});
		expect(gate.submitBlocked).toBe(true);
		expect(gate.submitBlockReason).toContain("pending");
	});

	it("clears gate when server and client checks pass", () => {
		const gate = resolveSubmitGate({
			artifact: {
				submitBlocked: false,
				summary: {
					matched: 2,
					mismatched: 0,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 0,
					totalDifference: 0,
				},
				sunatSource: "upload",
			},
			pendingDecisions: 0,
		});
		expect(gate.submitBlocked).toBe(false);
	});
});
