/**
 * Intelligence API Routes
 *
 * Endpoints exposing all 5 Phase 2 intelligence pillars:
 *   1. Anomaly Detection (RUC breach, IGV mismatch, duplicate invoice)
 *   2. Cashflow Analysis (z-score, trend reversal, income drop, expense spike)
 *   3. Compliance Check (SIRE filing, detracciones, tax calendar)
 *   4. Supplier Analysis (concentration, payment delay, debt aging)
 *   5. Document Classification (format, content type, SUNAT series)
 *
 * @module intelligence/api
 */

import { Elysia } from "elysia";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import type { DocumentClassificationInput } from "../application/services/intelligence.service";
import {
	runAnomalyDetection,
	runCashflowAnalysis,
	runComplianceCheck,
	runDocumentClassification,
	runSupplierAnalysis,
} from "../application/services/intelligence.service";
import {
	AnomalyDetectionRequestSchema,
	CashflowAnalysisRequestSchema,
	ComplianceCheckRequestSchema,
	DocumentClassificationRequestSchema,
	SupplierAnalysisRequestSchema,
} from "../schemas";

/**
 * intelligenceModule const.
 *
 * All endpoints return structured JSON with anomalies, results, and summary stats.
 *
 * @example
 * ```ts
 * app.use(intelligenceModule);
 * ```
 */
export const intelligenceModule = new Elysia({ prefix: "/api/intelligence" })
	/**
	 * POST /api/intelligence/anomalies/detect
	 *
	 * Detect fiscal anomalies: RUC breaches, IGV mismatches, and duplicate invoices.
	 */
	.post(
		"/anomalies/detect",
		async ({ body, set }) => {
			try {
				const result = await runAnomalyDetection(body);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "ANOMALY_DETECTION_ERROR");
			}
		},
		{
			body: AnomalyDetectionRequestSchema,
			detail: {
				tags: ["Intelligence"],
				summary: "Fiscal anomaly detection",
				description:
					"Run all fiscal anomaly detection strategies (RUC breach, IGV mismatch, duplicate invoice) against the provided data.",
			},
		},
	)
	/**
	 * POST /api/intelligence/cashflow/analyze
	 *
	 * Detect cashflow anomalies: z-score outliers, trend reversals, income drops, expense spikes.
	 */
	.post(
		"/cashflow/analyze",
		async ({ body, set }) => {
			try {
				const result = await runCashflowAnalysis(body);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CASHFLOW_ANALYSIS_ERROR");
			}
		},
		{
			body: CashflowAnalysisRequestSchema,
			detail: {
				tags: ["Intelligence"],
				summary: "Cashflow anomaly analysis",
				description:
					"Analyze cashflow transaction data for statistical outliers, trend reversals, income drops, and expense spikes.",
			},
		},
	)
	/**
	 * POST /api/intelligence/compliance/check
	 *
	 * Run compliance checks: SIRE filing deadlines, SPOT detracciones validation, tax calendar obligations.
	 */
	.post(
		"/compliance/check",
		async ({ body, set }) => {
			try {
				const result = await runComplianceCheck(body);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "COMPLIANCE_CHECK_ERROR");
			}
		},
		{
			body: ComplianceCheckRequestSchema,
			detail: {
				tags: ["Intelligence"],
				summary: "Fiscal compliance check",
				description:
					"Validate compliance across SIRE filing deadlines, SPOT detracción rates, and tax calendar obligations.",
			},
		},
	)
	/**
	 * POST /api/intelligence/suppliers/analyze
	 *
	 * Analyze supplier risk: concentration, payment delay trends, new supplier high-value, debt aging, duplicates.
	 */
	.post(
		"/suppliers/analyze",
		async ({ body, set }) => {
			try {
				const result = await runSupplierAnalysis(body);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "SUPPLIER_ANALYSIS_ERROR");
			}
		},
		{
			body: SupplierAnalysisRequestSchema,
			detail: {
				tags: ["Intelligence"],
				summary: "Supplier risk analysis",
				description:
					"Assess supplier risk using concentration, payment delays, new supplier vetting, debt aging, and duplicate detection.",
			},
		},
	)
	/**
	 * POST /api/intelligence/documents/classify
	 *
	 * Classify documents by format (IMAGE/XML/PDF), content type (invoice/receipt/identity/etc.), and SUNAT series.
	 */
	.post(
		"/documents/classify",
		async ({ body, set }) => {
			try {
				const result = await runDocumentClassification(
					body as DocumentClassificationInput,
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "DOCUMENT_CLASSIFICATION_ERROR");
			}
		},
		{
			body: DocumentClassificationRequestSchema,
			detail: {
				tags: ["Intelligence"],
				summary: "Document classification",
				description:
					"Classify documents by format (IMAGE/XML/PDF), content type (invoice/receipt/identity/contract/bank_statement/sunat_xml), and SUNAT document series.",
			},
		},
	);
