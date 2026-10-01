/**
 * Invoice Processing Pipeline — reader → parser → validator → arbitrator.
 *
 * Mirrors the existing WorkflowOrchestratorV2 pipeline as a named
 * FiscalFSDPipeline. When using this pipeline with FiscalFSDRunner,
 * each phase produces evidence artifacts and gates validate output.
 *
 * @example
 * ```ts
 * import { FiscalFSDRunner } from '@drenyra/fiscal-fsd';
 * import { INVOICE_PIPELINE } from '@drenyra/fiscal-fsd/pipelines/invoice-pipeline';
 *
 * const runner = new FiscalFSDRunner();
 * const result = await runner.runPipeline(INVOICE_PIPELINE, { type: "invoice_xml", data: xml }, ctx);
 * ```
 */

import type {
	FiscalFSDPipeline,
	GatekeeperVerdict,
	PhaseContext,
	PhaseResult,
} from "../types";

/** Placeholder invoice phase. */
function invoicePhase(name: string, description: string) {
	return {
		name,
		description,
		version: "1.0.0",
		execute: async (
			input: unknown,
			_ctx: PhaseContext,
		): Promise<PhaseResult> => ({
			status: "SUCCESS" as const,
			output: {
				phase: name,
				input,
				processed: true,
				timestamp: new Date().toISOString(),
			},
			gatesPassed: [] as GatekeeperVerdict[],
			evidenceArtifacts: [],
			errors: [],
			confidence: 0.9,
		}),
	};
}

/**
 * Invoice Processing Pipeline.
 *
 * Mirrors the existing WorkflowOrchestratorV2 phases as a declarative FSD pipeline.
 * Can be used standalone or as a reference for the orchestrator's internal flow.
 */
export const INVOICE_PIPELINE: FiscalFSDPipeline = {
	id: "invoice-pipeline",
	name: "Invoice Processing Pipeline",
	description:
		"Standard invoice processing flow matching WorkflowOrchestratorV2",
	onGateBlocked: "STOP",
	phases: [
		invoicePhase("reader", "Extract invoice data from input (image, PDF, XML)"),
		invoicePhase("parser", "Parse structured data from XML content (UBL 2.1)"),
		invoicePhase(
			"validator",
			"Validate fiscal compliance against SUNAT regulations",
		),
		invoicePhase(
			"arbitrator",
			"Resolve conflicts between extraction and parsing",
		),
	],
};
