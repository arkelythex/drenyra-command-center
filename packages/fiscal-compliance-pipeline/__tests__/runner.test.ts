/**
 * Tests for CompliancePipelineRunner
 */

import { describe, expect, it } from "vitest";
import { IGV_CHANGE_CHAIN } from "../src/chains/igv-change.chain";
import { CompliancePipelineRunner } from "../src/runner";
import type { ComplianceContext, FiscalRuleChange } from "../src/types";

const igvRateChange: FiscalRuleChange = {
	changeId: "igv-2026-07",
	ruleType: "RATE",
	affectedRegulation: "Ley N° 12345 - Artículo 7°",
	oldValue: 0.18,
	newValue: 0.19,
	effectiveDate: "2026-08-01",
	description: "IGV rate change from 18% to 19%",
};

describe("CompliancePipelineRunner", () => {
	const runner = new CompliancePipelineRunner();
	const ctx: Partial<ComplianceContext> = {};

	describe("runChain", () => {
		it("executes IGV change chain with all stages passing", async () => {
			const result = await runner.runChain(
				IGV_CHANGE_CHAIN,
				igvRateChange,
				ctx,
			);

			expect(result.chainId).toBe("igv-rate-change");
			expect(result.stageResults).toHaveLength(3);
			// All stages should pass
			expect(result.stageResults[0].status).toBe("PASSED");
			expect(result.stageResults[1].status).toBe("PASSED");
			expect(result.stageResults[2].status).toBe("PASSED");
		});

		it("produces findings for each stage", async () => {
			const result = await runner.runChain(
				IGV_CHANGE_CHAIN,
				igvRateChange,
				ctx,
			);

			expect(result.allFindings).toHaveLength(3);
			expect(result.allFindings[0].code).toBe("DET-001");
			expect(result.allFindings[1].code).toBe("PLE-002");
			expect(result.allFindings[2].code).toBe("SIR-002");
		});

		it("reports approval pending for required-approval stages", async () => {
			// IGV_CHANGE_CHAIN's stages all have requiredApproval: true
			// but the status is PASSED because the default execution returns PASSED
			// approvalPending is set when a stage returns REVIEW_NEEDED
			const reviewStage = {
				...IGV_CHANGE_CHAIN.stages[0],
				execute: async () => ({
					status: "REVIEW_NEEDED" as const,
					evidenceId: "review-needed",
					findings: [],
					confidence: 0.5,
				}),
			};

			const chainWithReview = {
				...IGV_CHANGE_CHAIN,
				stages: [reviewStage],
			};

			const result = await runner.runChain(chainWithReview, igvRateChange, ctx);
			expect(result.status).toBe("REVIEW_NEEDED");
			expect(result.approvalPending).toBe(true);
		});

		it("respects dependency order", async () => {
			const stagesInOrder = IGV_CHANGE_CHAIN.stages.map((s) => s.stageId);
			expect(stagesInOrder).toEqual(["detracciones", "ple", "sire"]);
		});

		it("completes quickly", async () => {
			const start = Date.now();
			await runner.runChain(IGV_CHANGE_CHAIN, igvRateChange, ctx);
			const duration = Date.now() - start;
			expect(duration).toBeLessThan(1000);
		});
	});

	describe("dependency resolution", () => {
		it("blocks when dependency is not met", async () => {
			const dependentOnly = {
				...IGV_CHANGE_CHAIN,
				stages: [IGV_CHANGE_CHAIN.stages[1]], // Only PLE stage (depends on detracciones)
			};

			const result = await runner.runChain(dependentOnly, igvRateChange, ctx);
			// Should block because detracciones hasn't run
			expect(result.status).toBe("BLOCKED");
			expect(result.blockedAtStage).toBe("ple");
		});
	});
});
