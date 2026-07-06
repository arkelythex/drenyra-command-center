/**
 * Intelligence API — Zod schemas for request/response validation.
 *
 * These schemas define the wire format for each intelligence endpoint.
 * They are intentionally lenient to accept the same data the strategies consume.
 *
 * @module intelligence/schemas
 */

import { z } from "zod";

// ─── Common ──────────────────────────────────────────────────────────

export const AnomalySeverityEnum = z.enum([
	"low",
	"medium",
	"high",
	"critical",
]);
export type AnomalySeverity = z.infer<typeof AnomalySeverityEnum>;

// ─── Anomaly Detection ───────────────────────────────────────────────
// POST /api/intelligence/anomalies/detect

export const RucBreachTransactionSchema = z.object({
	id: z.string(),
	amount: z.number(),
	declaredRuc: z.string(),
	paymentRuc: z.string(),
	serie: z.string(),
	numero: z.string(),
	emisionDate: z.string(),
});

export const IgvMismatchInvoiceSchema = z.object({
	id: z.string(),
	serie: z.string(),
	numero: z.string(),
	tipoOperacion: z.string(),
	baseImponible: z.number(),
	igvCalculado: z.number(),
	emisorRuc: z.string(),
	emisionDate: z.string(),
});

export const DuplicateInvoiceCheckSchema = z.object({
	id: z.string(),
	serie: z.string(),
	numero: z.string(),
	total: z.number(),
	emisorRuc: z.string(),
	emisionDate: z.string(),
	tipoNota: z.string().optional(),
	moneda: z.string().optional(),
});

export const AnomalyDetectionRequestSchema = z.object({
	transactions: z.array(RucBreachTransactionSchema).optional(),
	invoices: z.array(IgvMismatchInvoiceSchema).optional(),
	duplicateInvoices: z.array(DuplicateInvoiceCheckSchema).optional(),
	minSeverity: AnomalySeverityEnum.optional(),
});

// ─── Cashflow Analysis ───────────────────────────────────────────────
// POST /api/intelligence/cashflow/analyze

export const CashflowTransactionSchema = z.object({
	id: z.string(),
	date: z.string(),
	amount: z.number(),
	type: z.enum(["INCOME", "EXPENSE"]),
	category: z.string(),
	description: z.string().optional(),
});

export const CashflowPredictorOptionsSchema = z
	.object({
		zscoreThreshold: z.number().min(0.5).max(5).optional(),
		detectTrendReversal: z.boolean().optional(),
		detectIncomeDrop: z.boolean().optional(),
		detectExpenseSpike: z.boolean().optional(),
		detectZscore: z.boolean().optional(),
	})
	.optional();

export const CashflowAnalysisRequestSchema = z.object({
	transactions: z
		.array(CashflowTransactionSchema)
		.min(1, "At least one transaction required"),
	options: CashflowPredictorOptionsSchema,
});

// ─── Compliance Check ────────────────────────────────────────────────
// POST /api/intelligence/compliance/check

export const SireFilingRecordSchema = z.object({
	id: z.string(),
	serie: z.string(),
	numero: z.string(),
	tipoDocumento: z.string(),
	emisorRuc: z.string(),
	receptorRuc: z.string().optional(),
	emisionDate: z.string(),
	filingDate: z.string().nullable(),
	total: z.number(),
	cdrReceived: z.boolean(),
	cdrDate: z.string().nullable().optional(),
});

export const DetraccionInvoiceSchema = z.object({
	id: z.string(),
	serie: z.string(),
	numero: z.string(),
	tipoDocumento: z.string(),
	emisorRuc: z.string(),
	receptorRuc: z.string(),
	operationCode: z.string(),
	totalAmount: z.number(),
	detraccionAmount: z.number().nullable(),
	detraccionPercentage: z.number().nullable(),
	detraccionDeposited: z.boolean(),
	depositDate: z.string().nullable(),
	paymentType: z.string(),
	emisionDate: z.string(),
});

export const TaxObligationSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	description: z.string(),
	dueDate: z.string(),
	status: z.enum(["pending", "filed", "exempt"]),
	filingDate: z.string().nullable(),
	amount: z.number().optional(),
	period: z.string().optional(),
	legalReference: z.string(),
});

export const ComplianceCheckRequestSchema = z.object({
	sireRecords: z.array(SireFilingRecordSchema).optional(),
	detraccionInvoices: z.array(DetraccionInvoiceSchema).optional(),
	taxObligations: z
		.object({
			tenantRuc: z.string(),
			rucType: z.enum(["persona_natural", "persona_juridica", "profesional"]),
			taxRegime: z.enum(["general", "mype", "ruta", "especial"]),
			obligations: z.array(TaxObligationSchema),
		})
		.optional(),
});

// ─── Supplier Analysis ───────────────────────────────────────────────
// POST /api/intelligence/suppliers/analyze

export const SupplierRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	ruc: z.string(),
	bankAccount: z.string().optional(),
	createdAt: z.string(),
});

export const TransactionRecordSchema = z.object({
	id: z.string(),
	supplierId: z.string(),
	supplierName: z.string(),
	supplierRuc: z.string(),
	documentType: z.string(),
	serie: z.string(),
	numero: z.string(),
	amount: z.number(),
	currency: z.string(),
	issueDate: z.string(),
	dueDate: z.string(),
	paymentDate: z.string().nullable(),
	paid: z.boolean(),
});

export const SupplierAnalysisRequestSchema = z.object({
	suppliers: z
		.array(SupplierRecordSchema)
		.min(1, "At least one supplier required"),
	transactions: z
		.array(TransactionRecordSchema)
		.min(1, "At least one transaction required"),
});

// ─── Document Classification ─────────────────────────────────────────
// POST /api/intelligence/documents/classify

export const DocumentToClassifySchema = z.object({
	id: z.string(),
	filename: z.string().optional(),
	text: z.string(),
	declaredType: z.string().optional(),
	serie: z.string().optional(),
});

export const DocumentClassificationRequestSchema = z.object({
	documents: z
		.array(DocumentToClassifySchema)
		.min(1, "At least one document required"),
});

// ─── Response Schemas ────────────────────────────────────────────────

export const AnomalyResponseSchema = z.object({
	id: z.string(),
	timestamp: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	metric: z.string(),
	expectedValue: z.number(),
	actualValue: z.number(),
	deviation: z.number(),
	severity: AnomalySeverityEnum,
	confidence: z.number(),
	reasoning: z.string(),
	detectionMethod: z.string(),
	context: z.record(z.string(), z.unknown()),
});

export const AnomalyDetectionResponseSchema = z.object({
	anomalies: z.array(AnomalyResponseSchema),
	summary: z.object({
		total: z.number(),
		bySeverity: z.record(z.string(), z.number()),
		byStrategy: z.record(z.string(), z.number()),
		executionTimeMs: z.number(),
	}),
});

export const CashflowAnalysisResponseSchema = z.object({
	anomalies: z.array(AnomalyResponseSchema),
	summary: z.object({
		total: z.number(),
		methods: z.array(z.string()),
	}),
});

export const ComplianceCheckResponseSchema = z.object({
	anomalies: z.array(AnomalyResponseSchema),
	summary: z.object({
		total: z.number(),
		byType: z.record(z.string(), z.number()),
	}),
});

export const SupplierAnalysisResponseSchema = z.object({
	anomalies: z.array(AnomalyResponseSchema),
	summary: z.object({
		total: z.number(),
	}),
});

export const DocumentClassificationResponseSchema = z.object({
	results: z.array(
		z.object({
			documentId: z.string(),
			detectedType: z.string(),
			detectedFormat: z.string(),
			sunatType: z.string().optional(),
			confidence: z.number(),
			completenessScore: z.number(),
			missingFields: z.array(z.string()),
			classificationMethod: z.string(),
		}),
	),
	summary: z.object({
		total: z.number(),
	}),
});
