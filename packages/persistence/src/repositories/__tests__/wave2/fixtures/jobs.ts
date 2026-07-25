/**
 * Jobs fixtures — deterministas, inmutables.
 *
 * Proporciona jobs para cada policy:
 *   - PERMANENT (SUNAT submission)
 *   - ACTIVE_ONLY (CSV batch)
 *   - WINDOWED (fiscal nightly)
 *   - REPLACEABLE (report generation)
 *   - EXTERNAL (email, UNKNOWN scenario)
 */

import type { FiscalOperationFixture } from "./fiscal-operations";
import type { TenantScope } from "./tenants";

export type PolicyUnderTest =
	| "PERMANENT"
	| "PERMANENT_BY_INPUT"
	| "ACTIVE_ONLY"
	| "WINDOWED"
	| "REPLACEABLE";

export interface JobFixtureInput {
	organizationId: string;
	companyId: string | null;
	queueName: string;
	jobType: string;
	logicalKey: string;
	executionWindow: string | null;
	uniquenessPolicy: PolicyUnderTest;
	payload: Record<string, unknown>;
	inputHash: string;
}

export interface JobsFixture {
	sunatSubmit: JobFixtureInput;
	sunatSubmitSameIdentity: JobFixtureInput;
	csvBatch: JobFixtureInput;
	fiscalNightly: JobFixtureInput;
	reportGenerate: JobFixtureInput;
	emailSend: JobFixtureInput;
	ocrProcess: JobFixtureInput;
}

function sha256(input: string): string {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = (h << 5) - h + input.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h).toString(16).padStart(16, "0");
}

export function createJobFixture(
	tenantA: TenantScope,
	_tenantB: TenantScope,
	invoice: FiscalOperationFixture,
	overrides?: Partial<JobsFixture>,
): JobsFixture {
	const invoiceId = `inv-${invoice.invoiceNumber.replace(/\D/g, "")}`;
	const sunatPayload = { invoiceId, companyId: invoice.companyId };
	const sunatHash = sha256(JSON.stringify(sunatPayload));

	const base: JobsFixture = {
		// PERMANENT — SUNAT submission, una por invoice
		sunatSubmit: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "sunat-submission",
			jobType: "submit",
			logicalKey: `company:${tenantA.companyId}:invoice:${invoiceId}`,
			executionWindow: null,
			uniquenessPolicy: "PERMANENT",
			payload: sunatPayload,
			inputHash: sunatHash,
		},
		// Misma identidad para escenarios de colisión
		sunatSubmitSameIdentity: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "sunat-submission",
			jobType: "submit",
			logicalKey: `company:${tenantA.companyId}:invoice:${invoiceId}`,
			executionWindow: null,
			uniquenessPolicy: "PERMANENT",
			payload: sunatPayload,
			inputHash: sunatHash,
		},
		// ACTIVE_ONLY — CSV batch processing
		csvBatch: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "csv-batch-agent",
			jobType: "csv-batch-001",
			logicalKey: `batch:batch-${invoiceId}`,
			executionWindow: null,
			uniquenessPolicy: "ACTIVE_ONLY",
			payload: { batchId: `batch-${invoiceId}`, companyId: tenantA.companyId },
			inputHash: "csv-batch-001-hash",
		},
		// WINDOWED — fiscal nightly
		fiscalNightly: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "fiscal-agent",
			jobType: "fiscal-nightly",
			logicalKey: `company:${tenantA.companyId}`,
			executionWindow: "2026-07",
			uniquenessPolicy: "WINDOWED",
			payload: { period: "2026-07", companyId: tenantA.companyId },
			inputHash: "nightly-202607-hash",
		},
		// REPLACEABLE — report generation
		reportGenerate: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "report-generation",
			jobType: "generate",
			logicalKey: `org:${tenantA.organizationId}:report:daily:2026-07-13:pdf`,
			executionWindow: null,
			uniquenessPolicy: "REPLACEABLE",
			payload: { type: "daily", date: "2026-07-13", format: "pdf" },
			inputHash: "report-20260713-pdf-hash",
		},
		// EXTERNAL — email (UNKNOWN scenario)
		emailSend: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "email-notification",
			jobType: "send",
			logicalKey: `invoice-sent:user@test.com:${invoiceId}`,
			executionWindow: null,
			uniquenessPolicy: "PERMANENT_BY_INPUT",
			payload: { to: "user@test.com", template: "invoice-sent", invoiceId },
			inputHash: "email-send-hash",
		},
		// OCR (PERMANENT_BY_INPUT)
		ocrProcess: {
			organizationId: tenantA.organizationId,
			companyId: tenantA.companyId,
			queueName: "document-processing",
			jobType: "process-document",
			logicalKey: `doc:doc-${invoiceId}:hash:abc123:v1`,
			executionWindow: null,
			uniquenessPolicy: "PERMANENT_BY_INPUT",
			payload: { documentId: `doc-${invoiceId}`, contentHash: "abc123" },
			inputHash: "ocr-abc123-v1-hash",
		},
	};
	return { ...base, ...overrides };
}
