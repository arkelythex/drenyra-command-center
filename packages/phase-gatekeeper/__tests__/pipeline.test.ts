/**
 * Tests for GatedPhasePipeline
 */

import { describe, expect, it } from "vitest";
import type { ConfidenceCheckInput } from "../src/gates/confidence-threshold.gate";
import { CONFIDENCE_THRESHOLD_GATE } from "../src/gates/confidence-threshold.gate";
import type { ConflictCheckInput } from "../src/gates/conflict-free.gate";
import { CONFLICT_FREE_GATE } from "../src/gates/conflict-free.gate";
import type { MinimalDataCheckInput } from "../src/gates/minimal-data.gate";
import { MINIMAL_READER_GATE } from "../src/gates/minimal-data.gate";
import type { XmlValidityInput } from "../src/gates/xml-validity.gate";
import { XML_VALIDITY_GATE } from "../src/gates/xml-validity.gate";
import { GatedPhasePipeline } from "../src/pipeline";

// ============================================================================
// GatedPhasePipeline
// ============================================================================

describe("GatedPhasePipeline", () => {
	describe("runPhase", () => {
		it("passes pre-gates, executes phase, passes post-gates", async () => {
			const pipeline = new GatedPhasePipeline();

			const result = await pipeline.runPhase(
				"test-phase",
				{ value: 42 },
				async (input: { value: number }) => ({ result: input.value * 2 }),
				{
					preGates: [
						{
							name: "PositiveValueGate",
							description: "Value must be positive",
							check: (data: { value: number }) => ({
								passed: data.value > 0,
								reasons:
									data.value > 0
										? ["Value is positive"]
										: ["Value is not positive"],
								severity: "BLOCKING" as const,
								details: { value: data.value },
							}),
						},
					],
					postGates: [
						{
							name: "EvenResultGate",
							description: "Result must be even",
							check: (data: { result: number }) => ({
								passed: data.result % 2 === 0,
								reasons:
									data.result % 2 === 0
										? ["Result is even"]
										: ["Result is odd"],
								severity: "BLOCKING" as const,
								details: { result: data.result },
							}),
						},
					],
				},
			);

			expect(result.status).toBe("SUCCESS");
			expect(result.output).toEqual({ result: 84 });
			expect(result.preGateResults).toHaveLength(1);
			expect(result.preGateResults[0].passed).toBe(true);
			expect(result.postGateResults).toHaveLength(1);
			expect(result.postGateResults[0].passed).toBe(true);
		});

		it("blocks when pre-gate fails with BLOCKING severity", async () => {
			const pipeline = new GatedPhasePipeline();

			const result = await pipeline.runPhase(
				"test-phase",
				{ value: -1 },
				async () => ({ result: "never reached" }),
				{
					preGates: [
						{
							name: "PositiveValueGate",
							description: "Value must be positive",
							check: () => ({
								passed: false,
								reasons: ["Value is not positive"],
								severity: "BLOCKING" as const,
								details: {},
							}),
						},
					],
					postGates: [],
				},
			);

			expect(result.status).toBe("BLOCKED");
			expect(result.output).toBeNull();
			expect(result.preGateResults[0].passed).toBe(false);
		});

		it("continues on WARNING severity when configured", async () => {
			const pipeline = new GatedPhasePipeline({
				onGateBlocked: "WARN_CONTINUE",
			});

			const result = await pipeline.runPhase(
				"test-phase",
				{ value: 1 },
				async (input: { value: number }) => ({ result: input.value }),
				{
					preGates: [
						{
							name: "WarningGate",
							description: "Warns but continues",
							check: () => ({
								passed: false,
								reasons: ["This is a warning"],
								severity: "BLOCKING" as const,
								details: {},
							}),
						},
					],
					postGates: [],
				},
			);

			expect(result.status).toBe("SUCCESS");
			expect(result.output).toEqual({ result: 1 });
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain("warning");
		});

		it("handles phase execution failure", async () => {
			const pipeline = new GatedPhasePipeline();

			const result = await pipeline.runPhase(
				"failing-phase",
				{},
				async () => {
					throw new Error("Phase crashed");
				},
				{ preGates: [], postGates: [] },
			);

			expect(result.status).toBe("FAILED");
			expect(result.errors[0]).toContain("Phase crashed");
		});
	});

	describe("runPipeline", () => {
		it("runs multiple phases sequentially, passing output between them", async () => {
			const pipeline = new GatedPhasePipeline();

			const result = await pipeline.runPipeline([
				{
					name: "phase-1",
					execute: async (input: unknown) => ({
						value: (input as { start: number }).start + 1,
					}),
					input: { start: 10 },
					gates: { preGates: [], postGates: [] },
				},
				{
					name: "phase-2",
					execute: async (input: unknown) => ({
						value: (input as { value: number }).value * 2,
					}),
					input: {},
					gates: { preGates: [], postGates: [] },
				},
			]);

			expect(result.status).toBe("COMPLETED");
			expect(result.phaseResults).toHaveLength(2);
			expect(result.phaseResults[0].output).toEqual({ value: 11 });
			expect(result.phaseResults[1].output).toEqual({ value: 22 });
		});

		it("stops at blocked phase", async () => {
			const pipeline = new GatedPhasePipeline();

			const blockGate = {
				name: "BlockGate",
				description: "Blocks always",
				check: () => ({
					passed: false,
					reasons: ["Blocked intentionally"],
					severity: "BLOCKING" as const,
					details: {},
				}),
			};

			const result = await pipeline.runPipeline([
				{
					name: "phase-1",
					execute: async () => ({ ok: true }),
					input: {},
					gates: { preGates: [blockGate], postGates: [] },
				},
				{
					name: "phase-2",
					execute: async () => ({ shouldNotReach: true }),
					input: {},
					gates: { preGates: [], postGates: [] },
				},
			]);

			expect(result.status).toBe("BLOCKED");
			expect(result.blockedAtPhase).toBe("phase-1");
			expect(result.phaseResults).toHaveLength(1);
		});
	});
});

// ============================================================================
// MINIMAL_READER_GATE
// ============================================================================

describe("MINIMAL_READER_GATE", () => {
	const validCtx = { previousGates: new Map() };

	it("passes when all required fields are present", async () => {
		const data: MinimalDataCheckInput = {
			extractedData: {
				issuerRuc: "20123456789",
				invoiceNumber: "F001-123",
				total: 1000,
				issueDate: "2026-07-09",
				customerRuc: "20234567890",
				subtotal: 847.46,
				igv: 152.54,
				invoiceType: "01",
			},
		};

		const result = await MINIMAL_READER_GATE.check(data, validCtx);
		expect(result.passed).toBe(true);
	});

	it("blocks on missing required fields", async () => {
		const data: MinimalDataCheckInput = {
			extractedData: {
				issuerRuc: "20123456789",
				// Missing: invoiceNumber, total, issueDate
			},
		};

		const result = await MINIMAL_READER_GATE.check(data, validCtx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("BLOCKING");
		expect(result.details.missingRequired).toContain("invoiceNumber");
		expect(result.details.missingRequired).toContain("total");
	});

	it("warns on missing fiscal fields", async () => {
		const data: MinimalDataCheckInput = {
			extractedData: {
				issuerRuc: "20123456789",
				invoiceNumber: "F001-123",
				total: 1000,
				issueDate: "2026-07-09",
				// Missing: customerRuc, subtotal, igv, invoiceType
			},
		};

		const result = await MINIMAL_READER_GATE.check(data, validCtx);
		expect(result.passed).toBe(true); // Not blocking
		expect(result.severity).toBe("WARNING");
	});
});

// ============================================================================
// XML_VALIDITY_GATE
// ============================================================================

describe("XML_VALIDITY_GATE", () => {
	const validCtx = { previousGates: new Map() };

	it("passes on valid XML with declaration", async () => {
		const data: XmlValidityInput = {
			generatedXML: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-123</cbc:ID>
</Invoice>`,
		};

		const result = await XML_VALIDITY_GATE.check(data, validCtx);
		expect(result.passed).toBe(true);
	});

	it("blocks on empty XML", async () => {
		const data: XmlValidityInput = { generatedXML: "" };
		const result = await XML_VALIDITY_GATE.check(data, validCtx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("BLOCKING");
	});

	it("blocks on missing XML declaration", async () => {
		const data: XmlValidityInput = {
			generatedXML: `<Invoice><cbc:ID>F001-123</cbc:ID></Invoice>`,
		};

		const result = await XML_VALIDITY_GATE.check(data, validCtx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("BLOCKING");
	});
});

// ============================================================================
// CONFLICT_FREE_GATE
// ============================================================================

describe("CONFLICT_FREE_GATE", () => {
	const validCtx = { previousGates: new Map() };

	it("passes on no conflicts", async () => {
		const data: ConflictCheckInput = { conflicts: [] };
		const result = await CONFLICT_FREE_GATE.check(data, validCtx);
		expect(result.passed).toBe(true);
	});

	it("passes on resolved high conflicts with arbitration", async () => {
		const data: ConflictCheckInput = {
			conflicts: [
				{
					field: "total",
					severity: "high",
					sources: { reader: 100, parser: 101 },
				},
			],
			arbitrationDecision: { decision: "APPROVED", confidence: 0.95 },
		};

		const result = await CONFLICT_FREE_GATE.check(data, validCtx);
		expect(result.passed).toBe(true);
	});

	it("blocks on unresolved high conflicts", async () => {
		const data: ConflictCheckInput = {
			conflicts: [
				{
					field: "total",
					severity: "high",
					sources: { reader: 100, parser: 101 },
				},
			],
		};

		const result = await CONFLICT_FREE_GATE.check(data, validCtx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("BLOCKING");
	});
});

// ============================================================================
// CONFIDENCE_THRESHOLD_GATE
// ============================================================================

describe("CONFIDENCE_THRESHOLD_GATE", () => {
	const validCtx = { previousGates: new Map() };

	it("passes on high confidence", async () => {
		const data: ConfidenceCheckInput = {
			arbitrationDecision: { confidence: 0.95, decision: "APPROVED" },
		};

		const result = await CONFIDENCE_THRESHOLD_GATE.check(data, validCtx);
		expect(result.passed).toBe(true);
		expect(result.severity).toBe("INFO");
	});

	it("warns on medium confidence (between thresholds)", async () => {
		const data: ConfidenceCheckInput = {
			arbitrationDecision: { confidence: 0.6, decision: "APPROVED" },
		};

		const result = await CONFIDENCE_THRESHOLD_GATE.check(data, validCtx);
		expect(result.passed).toBe(true);
		expect(result.severity).toBe("WARNING");
	});

	it("blocks on low confidence", async () => {
		const data: ConfidenceCheckInput = {
			arbitrationDecision: { confidence: 0.3, decision: "APPROVED" },
		};

		const result = await CONFIDENCE_THRESHOLD_GATE.check(data, validCtx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("BLOCKING");
	});
});
