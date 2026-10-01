// ─── Captura Phase Agent ───────────────────────────────────────────
// Handles the Captura phase: CPE/document intake from SUNAT SOL, OCR,
// file uploads, and tracking of received/pending/errored documents.
//
// PR1: Stub implementation. Real wiring in PR3.

import type { CapturaReport } from "../types";

/**
 * CapturaAgentInput — what the agent needs to run.
 */
export interface CapturaAgentInput {
	ruc: string;
	periodo: string;
	sources?: {
		sunatSol?: boolean;
		ocr?: boolean;
		uploads?: boolean;
	};
}

/**
 * CapturaAgent — currently a stub that returns a placeholder report.
 * In PR3, this will:
 * - Poll SUNAT SOL for emitted/received CPEs
 * - Trigger OCR batch processing for scanned documents
 * - Track upload progress
 * - Return detailed CapturaReport
 */
export class CapturaAgent {
	async execute(input: CapturaAgentInput): Promise<CapturaReport> {
		// Stub implementation — returns mock data
		const report: CapturaReport = {
			phaseId: "captura",
			ruc: input.ruc,
			periodo: input.periodo,
			success: true,
			summary: `Captura phase completed for ${input.ruc} periodo ${input.periodo}`,
			data: {
				totalRecibidos: 50,
				totalPendientes: 0,
				totalErrores: 0,
				comprobantes: [],
			},
		};

		return report;
	}
}
