import { beforeEach, describe, expect, it } from "vitest";
import { PhaseGateEngine } from "../phase-gate-engine";
import type { FiscalPeriodState } from "../types";

function createMockPeriodState(): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "captura",
		status: "in_progress",
		phaseHistory: [],
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

describe("PhaseGateEngine", () => {
	let engine: PhaseGateEngine;

	beforeEach(() => {
		engine = new PhaseGateEngine();
	});

	describe("registerGate / getGate", () => {
		it("registers and retrieves a gate", () => {
			engine.registerGate({
				id: "test-gate",
				name: "Test Gate",
				description: "A test gate",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => ({
					gateId: "test-gate",
					gateName: "Test Gate",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});

			const gate = engine.getGate("test-gate");
			expect(gate).toBeDefined();
			expect(gate?.id).toBe("test-gate");
			expect(gate?.phaseId).toBe("captura");
		});

		it("returns undefined for unknown gate", () => {
			expect(engine.getGate("nonexistent")).toBeUndefined();
		});
	});

	describe("evaluateGate", () => {
		it("evaluates a registered gate and returns the result", async () => {
			engine.registerGate({
				id: "pass-gate",
				name: "Pass Gate",
				description: "Always passes",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => ({
					gateId: "pass-gate",
					gateName: "Pass Gate",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});

			const result = await engine.evaluateGate(
				"pass-gate",
				createMockPeriodState(),
				{
					ruc: "20123456789",
					periodo: "2026-06",
					currentPhase: "captura",
					targetPhase: "clasificacion",
					phaseState: {
						phaseId: "captura",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				},
			);

			expect(result.passed).toBe(true);
			expect(result.gateId).toBe("pass-gate");
		});

		it("returns a failed result for unregistered gates", async () => {
			const result = await engine.evaluateGate(
				"unknown",
				createMockPeriodState(),
				{
					ruc: "",
					periodo: "",
					currentPhase: "captura",
					targetPhase: "clasificacion",
					phaseState: {
						phaseId: "captura",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				},
			);

			expect(result.passed).toBe(false);
			expect(result.severity).toBe("error");
			expect(result.reason).toContain("not registered");
		});

		it("handles gate evaluation errors gracefully", async () => {
			engine.registerGate({
				id: "error-gate",
				name: "Error Gate",
				description: "Throws error",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => {
					throw new Error("Something went wrong");
				},
			});

			const result = await engine.evaluateGate(
				"error-gate",
				createMockPeriodState(),
				{
					ruc: "",
					periodo: "",
					currentPhase: "captura",
					targetPhase: "clasificacion",
					phaseState: {
						phaseId: "captura",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				},
			);

			expect(result.passed).toBe(false);
			expect(result.severity).toBe("critical");
		});
	});

	describe("evaluateTransition", () => {
		it("evaluates exit gates of source and entry gates of target", async () => {
			engine.registerGate({
				id: "gate-1",
				name: "Exit Gate",
				description: "Source phase exit gate",
				phaseId: "captura",
				position: "exit",
				evaluate: async () => ({
					gateId: "gate-1",
					gateName: "Exit Gate",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});

			engine.registerGate({
				id: "gate-2",
				name: "Entry Gate",
				description: "Target phase entry gate",
				phaseId: "clasificacion",
				position: "entry",
				evaluate: async () => ({
					gateId: "gate-2",
					gateName: "Entry Gate",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});

			const result = await engine.evaluateTransition(
				"captura",
				"clasificacion",
				createMockPeriodState(),
			);
			expect(result.allPassed).toBe(true);
			expect(result.gates).toHaveLength(2);
		});

		it("detects gate failures", async () => {
			engine.registerGate({
				id: "fail-gate",
				name: "Fail Gate",
				description: "Always fails",
				phaseId: "captura",
				position: "exit",
				evaluate: async () => ({
					gateId: "fail-gate",
					gateName: "Fail Gate",
					passed: false,
					severity: "error",
					reason: "Not ready yet",
					evaluatedAt: new Date(),
				}),
			});

			const result = await engine.evaluateTransition(
				"captura",
				"clasificacion",
				createMockPeriodState(),
			);
			expect(result.allPassed).toBe(false);
			expect(result.blockers).toHaveLength(1);
			expect(result.blockers[0].reason).toBe("Not ready yet");
		});
	});

	describe("static factory methods", () => {
		describe("completenessGate", () => {
			it("creates a passing completeness gate", async () => {
				const gate = PhaseGateEngine.completenessGate(
					"all-present",
					"All Required Present",
					"captura",
					"exit",
					() => ({ complete: true }),
				);

				const result = await gate.evaluate(createMockPeriodState(), {
					ruc: "",
					periodo: "",
					currentPhase: "captura",
					targetPhase: "clasificacion",
					phaseState: {
						phaseId: "captura",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				});

				expect(result.passed).toBe(true);
				expect(result.severity).toBe("info");
			});

			it("creates a failing completeness gate with missing items", async () => {
				const gate = PhaseGateEngine.completenessGate(
					"missing-items",
					"Missing Items Check",
					"captura",
					"exit",
					() => ({ complete: false, missing: ["item-1", "item-2"] }),
				);

				const result = await gate.evaluate(createMockPeriodState(), {
					ruc: "",
					periodo: "",
					currentPhase: "captura",
					targetPhase: "clasificacion",
					phaseState: {
						phaseId: "captura",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				});

				expect(result.passed).toBe(false);
				expect(result.reason).toContain("item-1");
				expect(result.reason).toContain("item-2");
			});
		});

		describe("consistencyGate", () => {
			it("passes when values are within threshold", async () => {
				const gate = PhaseGateEngine.consistencyGate(
					"consistent",
					"Consistent Values",
					"conciliacion",
					"exit",
					0.05, // 5% threshold
					() => ({ actual: 100, expected: 102 }), // ~2% diff
				);

				const result = await gate.evaluate(createMockPeriodState(), {
					ruc: "",
					periodo: "",
					currentPhase: "conciliacion",
					targetPhase: "cierre",
					phaseState: {
						phaseId: "conciliacion",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				});

				expect(result.passed).toBe(true);
			});

			it("fails when values exceed threshold", async () => {
				const gate = PhaseGateEngine.consistencyGate(
					"inconsistent",
					"Inconsistent Values",
					"conciliacion",
					"exit",
					0.05, // 5% threshold
					() => ({ actual: 100, expected: 200 }), // 50% diff
				);

				const result = await gate.evaluate(createMockPeriodState(), {
					ruc: "",
					periodo: "",
					currentPhase: "conciliacion",
					targetPhase: "cierre",
					phaseState: {
						phaseId: "conciliacion",
						status: "in_progress",
						gateResults: [],
					},
					periodState: createMockPeriodState(),
				});

				expect(result.passed).toBe(false);
				expect(result.severity).toBe("error");
			});
		});
	});

	describe("getGatesForPhase", () => {
		it("returns only gates matching phase and position", () => {
			engine.registerGate({
				id: "entry-1",
				name: "Entry 1",
				description: "",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => ({
					gateId: "",
					gateName: "",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});
			engine.registerGate({
				id: "exit-1",
				name: "Exit 1",
				description: "",
				phaseId: "captura",
				position: "exit",
				evaluate: async () => ({
					gateId: "",
					gateName: "",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});
			engine.registerGate({
				id: "entry-2",
				name: "Entry 2",
				description: "",
				phaseId: "clasificacion",
				position: "entry",
				evaluate: async () => ({
					gateId: "",
					gateName: "",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});

			const entryGates = engine.getGatesForPhase("captura", "entry");
			expect(entryGates).toHaveLength(1);
			expect(entryGates[0].id).toBe("entry-1");

			const exitGates = engine.getGatesForPhase("captura", "exit");
			expect(exitGates).toHaveLength(1);
			expect(exitGates[0].id).toBe("exit-1");
		});
	});

	describe("removeGate / listGates", () => {
		it("removes a gate by ID", () => {
			engine.registerGate({
				id: "removable",
				name: "Removable",
				description: "",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => ({
					gateId: "",
					gateName: "",
					passed: true,
					severity: "info",
					evaluatedAt: new Date(),
				}),
			});

			expect(engine.listGates()).toContain("removable");
			expect(engine.removeGate("removable")).toBe(true);
			expect(engine.listGates()).not.toContain("removable");
		});

		it("returns false when removing non-existent gate", () => {
			expect(engine.removeGate("does-not-exist")).toBe(false);
		});
	});
});
