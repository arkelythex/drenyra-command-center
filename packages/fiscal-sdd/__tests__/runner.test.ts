/**
 * Tests for FiscalSDDRunner
 */

import { describe, expect, it } from "vitest";
import { FiscalSDDRunner } from "../src/runner";
import type {
	FiscalSDDPipeline,
	PhaseContext,
	PhaseResult,
} from "../src/types";

describe("FiscalSDDRunner", () => {
	const runner = new FiscalSDDRunner();
	const ctx: Partial<PhaseContext> = {
		runId: "test-run-001",
		scope: {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "20123456789",
			period: "2026-07",
		},
		metadata: {},
	};

	describe("runPipeline", () => {
		it("executes phases sequentially and passes output between them", async () => {
			const pipeline: FiscalSDDPipeline = {
				id: "test-pipeline",
				name: "Test Pipeline",
				onGateBlocked: "STOP",
				phases: [
					{
						name: "double",
						description: "Doubles input value",
						version: "1.0.0",
						execute: async (
							input: unknown,
							_ctx: PhaseContext,
						): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { value: (input as { value: number }).value * 2 },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
					},
					{
						name: "add-ten",
						description: "Adds 10 to input value",
						version: "1.0.0",
						execute: async (
							input: unknown,
							_ctx: PhaseContext,
						): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { value: (input as { value: number }).value + 10 },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
					},
				],
			};

			const result = await runner.runPipeline(pipeline, { value: 5 }, ctx);

			expect(result.status).toBe("COMPLETED");
			expect(result.phaseResults).toHaveLength(2);
			// Phase 1: 5 * 2 = 10
			// Phase 2: 10 + 10 = 20
			expect((result.phaseResults[1].output as { value: number }).value).toBe(
				20,
			);
		});

		it("blocks on gate failure with STOP mode", async () => {
			const pipeline: FiscalSDDPipeline = {
				id: "test-blocked",
				name: "Blocked Pipeline",
				onGateBlocked: "STOP",
				phases: [
					{
						name: "risky-phase",
						description: "Phase with blocking gate",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { result: "done" },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
						gate: {
							name: "BlockingGate",
							description: "Always blocks",
							validate: async () => ({
								passed: false,
								reasons: ["Intentional block"],
								severity: "BLOCKING" as const,
								details: {},
							}),
						},
					},
					{
						name: "never-reached",
						description: "Should not execute",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { result: "impossible" },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
					},
				],
			};

			const result = await runner.runPipeline(pipeline, {}, ctx);

			expect(result.status).toBe("BLOCKED");
			expect(result.blockedAtPhase).toBe("risky-phase");
			expect(result.phaseResults).toHaveLength(1);
		});

		it("continues on gate failure with WARN_CONTINUE mode", async () => {
			const pipeline: FiscalSDDPipeline = {
				id: "test-warn",
				name: "Warn Pipeline",
				onGateBlocked: "WARN_CONTINUE",
				phases: [
					{
						name: "warning-phase",
						description: "Phase with warning gate",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { result: "done" },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
						gate: {
							name: "WarningGate",
							description: "Warns but continues",
							validate: async () => ({
								passed: false,
								reasons: ["Non-critical warning"],
								severity: "BLOCKING" as const,
								details: {},
							}),
						},
					},
					{
						name: "follow-up",
						description: "Should execute after warning",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { result: "follow-up-done" },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
					},
				],
			};

			const result = await runner.runPipeline(pipeline, {}, ctx);

			expect(result.status).toBe("COMPLETED");
			expect(result.phaseResults).toHaveLength(2);
			expect(result.phaseResults[1].output).toEqual({
				result: "follow-up-done",
			});
		});

		it("fails on phase execution error", async () => {
			const pipeline: FiscalSDDPipeline = {
				id: "test-fail",
				name: "Failing Pipeline",
				onGateBlocked: "STOP",
				phases: [
					{
						name: "crash-phase",
						description: "Phase that throws",
						version: "1.0.0",
						execute: async () => {
							throw new Error("Phase crashed");
						},
					},
				],
			};

			const result = await runner.runPipeline(pipeline, {}, ctx);

			expect(result.status).toBe("FAILED");
			expect(result.blockedAtPhase).toBe("crash-phase");
			expect(result.phaseResults[0].errors[0]).toContain("Phase crashed");
		});

		it("produces evidence artifacts for each phase", async () => {
			const pipeline: FiscalSDDPipeline = {
				id: "test-evidence",
				name: "Evidence Pipeline",
				onGateBlocked: "STOP",
				phases: [
					{
						name: "phase-a",
						description: "First phase",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { result: "a" },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
					},
					{
						name: "phase-b",
						description: "Second phase",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { result: "b" },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
					},
				],
			};

			const result = await runner.runPipeline(pipeline, { start: true }, ctx);

			expect(result.allEvidenceArtifacts.length).toBeGreaterThanOrEqual(4);
			const kinds = result.allEvidenceArtifacts.map((a) => a.evidenceKind);
			expect(kinds.filter((k) => k === "PHASE_INPUT").length).toBe(2);
			expect(kinds.filter((k) => k === "PHASE_OUTPUT").length).toBe(2);
		});
	});

	describe("single phase with gate", () => {
		it("includes gate results in phase result", async () => {
			const pipeline: FiscalSDDPipeline = {
				id: "gate-test",
				name: "Gate Test",
				onGateBlocked: "STOP",
				phases: [
					{
						name: "gated-phase",
						description: "Phase with passing gate",
						version: "1.0.0",
						execute: async (): Promise<PhaseResult> => ({
							status: "SUCCESS",
							output: { ok: true },
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 1,
						}),
						gate: {
							name: "PassingGate",
							description: "Always passes",
							validate: async () => ({
								passed: true,
								reasons: ["All good"],
								severity: "INFO" as const,
								details: {},
							}),
						},
					},
				],
			};

			const result = await runner.runPipeline(pipeline, {}, ctx);
			expect(result.status).toBe("COMPLETED");
			expect(result.phaseResults[0].gatesPassed[0].passed).toBe(true);
		});
	});
});
