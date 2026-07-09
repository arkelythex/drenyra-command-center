/**
 * Tests for RegulatoryChangeLens
 */

import { describe, expect, it } from "vitest";
import type {
	EvidenceInput,
	LensContext,
	RegulationSnapshot,
} from "../lens.interface";
import { RegulatoryChangeLens } from "../regulatory-change.lens";

function makeEvidence(overrides: Partial<EvidenceInput> = {}): EvidenceInput {
	return {
		operationId: "op-001",
		phase: "validate",
		input: {},
		output: { invoiceNumber: "F001-123" },
		reasoning: "Valid invoice",
		actor: "ai",
		metadata: {
			regulationSnapshotHash: "268ca880",
			createdAt: "2026-07-01T10:00:00.000Z",
		},
		...overrides,
	};
}

// simpleHash("a1b2c3d4") = "1f5ed8a6" — the evidence snapshot hash must match this
const currentRegs: RegulationSnapshot[] = [
	{
		snapshotId: "reg-igv-2026",
		capturedAt: "2026-07-09T00:00:00.000Z",
		applicableRules: [
			{
				ruleId: "igv-rate",
				name: "IGV Rate",
				version: "2026.1",
				content: "18%",
			},
		],
		hash: "a1b2c3d4",
	},
];

const changedRegs: RegulationSnapshot[] = [
	{
		snapshotId: "reg-igv-2026",
		capturedAt: "2026-07-10T00:00:00.000Z",
		applicableRules: [
			{
				ruleId: "igv-rate",
				name: "IGV Rate",
				version: "2026.2",
				content: "19%",
			},
		],
		hash: "e5f6g7h8",
	},
];

describe("RegulatoryChangeLens", () => {
	const lens = new RegulatoryChangeLens();

	it("passes when regulations haven't changed", async () => {
		const ctx: LensContext = { applicableRegulations: currentRegs };
		const result = await lens.review(makeEvidence(), ctx);
		expect(result.passed).toBe(true);
	});

	it("warns when evidence has no regulation snapshot", async () => {
		const evidence = makeEvidence({
			metadata: { createdAt: "2026-07-01T10:00:00.000Z" },
		});
		const ctx: LensContext = { applicableRegulations: currentRegs };
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "REG-001")).toBe(true);
	});

	it("warns when no current regulations available", async () => {
		const ctx: LensContext = { applicableRegulations: [] };
		const result = await lens.review(makeEvidence(), ctx);
		expect(result.findings.some((f) => f.code === "REG-002")).toBe(true);
	});

	it("fails when regulations have changed", async () => {
		const ctx: LensContext = { applicableRegulations: changedRegs };
		const result = await lens.review(makeEvidence(), ctx);
		expect(result.findings.some((f) => f.code === "REG-003")).toBe(true);
	});

	it("warns on fiscal year mismatch", async () => {
		const evidence = makeEvidence({
			metadata: {
				regulationSnapshotHash: "268ca880",
				fiscalYear: 2025,
				createdAt: "2026-07-01T10:00:00.000Z",
			},
		});
		const ctx: LensContext = {
			applicableRegulations: currentRegs,
			fiscalCalendar: { year: 2026, period: "07" },
		};
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "REG-004")).toBe(true);
	});
});
