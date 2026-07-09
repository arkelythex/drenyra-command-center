import { describe, expect, it } from "vitest";
import type { PhaseResult } from "../../types";
import { DecisionGate } from "../decision-gate";

function makeResult(overrides: Partial<PhaseResult> = {}): PhaseResult {
	return {
		status: "SUCCESS",
		output: {},
		gatesPassed: [],
		evidenceArtifacts: [],
		errors: [],
		confidence: 0.9,
		...overrides,
	};
}

describe("DecisionGate", () => {
	describe("auto mode", () => {
		it("approves when confidence is high and no errors", async () => {
			const gate = new DecisionGate("auto");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ confidence: 0.9 }),
			);

			expect(result.requiresApproval).toBe(false);
			expect(result.mode).toBe("auto");
		});

		it("requires approval when confidence is low", async () => {
			const gate = new DecisionGate("auto");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ confidence: 0.3 }),
			);

			expect(result.requiresApproval).toBe(true);
		});

		it("requires approval when there are errors", async () => {
			const gate = new DecisionGate("auto");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ errors: ["Something went wrong"] }),
			);

			expect(result.requiresApproval).toBe(true);
		});

		it("uses custom threshold", async () => {
			const gate = new DecisionGate("auto", { autoThreshold: 0.95 });
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ confidence: 0.9 }),
			);

			expect(result.requiresApproval).toBe(true);
			expect(result.autoThreshold).toBe(0.95);
		});

		it("requires approval on FAILED status", async () => {
			const gate = new DecisionGate("auto");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ status: "FAILED" }),
			);

			expect(result.requiresApproval).toBe(true);
		});

		it("requires approval on BLOCKED status", async () => {
			const gate = new DecisionGate("auto");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ status: "BLOCKED" }),
			);

			expect(result.requiresApproval).toBe(true);
		});

		it("requires approval on MANUAL_REVIEW status", async () => {
			const gate = new DecisionGate("auto");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ status: "MANUAL_REVIEW" }),
			);

			expect(result.requiresApproval).toBe(true);
		});
	});

	describe("interactive mode", () => {
		it("always requires approval", async () => {
			const gate = new DecisionGate("interactive");
			const result = await gate.evaluate(
				"solicitud",
				makeResult({ confidence: 0.99 }),
			);

			expect(result.requiresApproval).toBe(true);
			expect(result.mode).toBe("interactive");
		});
	});

	describe("supervised mode", () => {
		it("requires approval for migracion phase", async () => {
			const gate = new DecisionGate("supervised");
			const result = await gate.evaluate("migracion", makeResult());

			expect(result.requiresApproval).toBe(true);
			expect(result.mode).toBe("supervised");
		});

		it("requires approval for auditoria phase", async () => {
			const gate = new DecisionGate("supervised");
			const result = await gate.evaluate("auditoria", makeResult());

			expect(result.requiresApproval).toBe(true);
		});

		it("auto-approves non-supervised phases", async () => {
			const gate = new DecisionGate("supervised");
			const result = await gate.evaluate("solicitud", makeResult());

			expect(result.requiresApproval).toBe(false);
		});

		it("uses custom supervised phases list", async () => {
			const gate = new DecisionGate("supervised", {
				supervisedPhases: ["diseno", "plan"],
			});

			const diseno = await gate.evaluate("diseno", makeResult());
			expect(diseno.requiresApproval).toBe(true);

			const solicitud = await gate.evaluate("solicitud", makeResult());
			expect(solicitud.requiresApproval).toBe(false);
		});
	});
});
