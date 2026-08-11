/**
 * Intelligence Service — wraps all 5 pillars of Phase 2 strategies
 * as consumable functions for the API layer.
 *
 * @module intelligence/service
 */

import type { AgentContext } from "@drenyra/pi";

import type {
	Anomaly,
	AnomalySeverity,
	CashflowPredictorOptions,
	CashflowTransaction,
	ClassificationResult,
	DetraccionInvoice,
	DocumentToClassify,
	DuplicateInvoiceCheck,
	IgvMismatchInvoice,
	RucBreachTransaction,
	SireFilingRecord,
	SupplierRecord,
	TaxCalendarInput,
	TransactionRecord,
} from "@drenyra/pi/strategies";
import {
	classifyDocuments,
	createCashflowPredictorStrategy,
	createDetraccionesStrategy,
	createDuplicateInvoiceStrategy,
	createIgvMismatchStrategy,
	createSireFilingStrategy,
	createSupplierIntelligenceStrategy,
	createTaxCalendarStrategy,
	detectRucBreachAnomalies,
	FiscalAnomalyEngine,
	RUC_BREACH_THRESHOLD_PEN,
} from "@drenyra/pi/strategies";

// ─── Helpers ─────────────────────────────────────────────────────────

function buildAgentContext(): AgentContext {
	return {
		tenantId: "api",
		userId: "api",
		organizationId: "api",
		companyId: "api",
		ruc: "api",
		traceId:
			crypto.randomUUID?.() ??
			`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
	};
}

function summarizeAnomalies(anomalies: Anomaly[]): Record<string, number> {
	const summary: Record<string, number> = {};
	for (const a of anomalies) {
		summary[a.severity] = (summary[a.severity] ?? 0) + 1;
	}
	return summary;
}

function summarizeByStrategy(anomalies: Anomaly[]): Record<string, number> {
	const summary: Record<string, number> = {};
	for (const a of anomalies) {
		const method = a.detectionMethod ?? "unknown";
		summary[method] = (summary[method] ?? 0) + 1;
	}
	return summary;
}

// ─── Anomaly Detection ──────────────────────────────────────────────

export interface AnomalyDetectionInput {
	transactions?: RucBreachTransaction[];
	invoices?: IgvMismatchInvoice[];
	duplicateInvoices?: DuplicateInvoiceCheck[];
	minSeverity?: AnomalySeverity;
}

export interface AnomalyDetectionOutput {
	anomalies: Anomaly[];
	summary: {
		total: number;
		bySeverity: Record<string, number>;
		byStrategy: Record<string, number>;
		executionTimeMs: number;
	};
}

export async function runAnomalyDetection(
	input: AnomalyDetectionInput,
): Promise<AnomalyDetectionOutput> {
	const start = performance.now();
	const engine = new FiscalAnomalyEngine([], undefined, {
		...(input.minSeverity !== undefined
			? { publishThreshold: input.minSeverity }
			: {}),
	});
	const context = buildAgentContext();

	engine.addStrategy(createIgvMismatchStrategy());
	engine.addStrategy(createDuplicateInvoiceStrategy());

	const allAnomalies: Anomaly[] = [];

	// RUC breach runs separately (it's a function, not a strategy)
	if (input.transactions?.length) {
		const breachAnomalies = detectRucBreachAnomalies(
			input.transactions,
			RUC_BREACH_THRESHOLD_PEN,
		);
		allAnomalies.push(...breachAnomalies);
	}

	// IGV + duplicate via engine
	if (input.invoices?.length || input.duplicateInvoices?.length) {
		const engineResults = await engine.runAllFlat(
			{
				invoices: input.invoices ?? [],
				duplicateInvoices: input.duplicateInvoices ?? [],
			},
			context,
		);
		allAnomalies.push(...engineResults);
	}

	const executionTimeMs = Math.round(performance.now() - start);

	return {
		anomalies: allAnomalies,
		summary: {
			total: allAnomalies.length,
			bySeverity: summarizeAnomalies(allAnomalies),
			byStrategy: summarizeByStrategy(allAnomalies),
			executionTimeMs,
		},
	};
}

// ─── Cashflow Analysis ──────────────────────────────────────────────

export interface CashflowAnalysisInput {
	transactions: CashflowTransaction[];
	options?: CashflowPredictorOptions;
}

export interface CashflowAnalysisOutput {
	anomalies: Anomaly[];
	summary: {
		total: number;
		methods: string[];
	};
}

export async function runCashflowAnalysis(
	input: CashflowAnalysisInput,
): Promise<CashflowAnalysisOutput> {
	const context = buildAgentContext();
	const strategy = createCashflowPredictorStrategy(input.options);

	const result = await strategy.execute(
		{ transactions: input.transactions },
		context,
	);
	const anomalies = result as Anomaly[];
	const methods = [...new Set(anomalies.map((a) => a.detectionMethod))];

	return {
		anomalies,
		summary: {
			total: anomalies.length,
			methods,
		},
	};
}

// ─── Compliance Check ───────────────────────────────────────────────

export interface ComplianceCheckInput {
	sireRecords?: SireFilingRecord[];
	detraccionInvoices?: DetraccionInvoice[];
	taxObligations?: TaxCalendarInput;
}

export interface ComplianceCheckOutput {
	anomalies: Anomaly[];
	summary: {
		total: number;
		byType: Record<string, number>;
	};
}

export async function runComplianceCheck(
	input: ComplianceCheckInput,
): Promise<ComplianceCheckOutput> {
	const context = buildAgentContext();
	const allAnomalies: Anomaly[] = [];

	// SIRE filing strategy
	if (input.sireRecords?.length) {
		const sireStrategy = createSireFilingStrategy();
		const result = await sireStrategy.execute(
			{ records: input.sireRecords },
			context,
		);
		allAnomalies.push(...(result as Anomaly[]));
	}

	// Detracciones strategy
	if (input.detraccionInvoices?.length) {
		const detraccionStrategy = createDetraccionesStrategy();
		const result = await detraccionStrategy.execute(
			{ invoices: input.detraccionInvoices },
			context,
		);
		allAnomalies.push(...(result as Anomaly[]));
	}

	// Tax calendar strategy
	if (input.taxObligations) {
		const taxCalendarStrategy = createTaxCalendarStrategy();
		const result = await taxCalendarStrategy.execute(
			input.taxObligations,
			context,
		);
		allAnomalies.push(...(result as Anomaly[]));
	}

	const byType = summarizeByStrategy(allAnomalies);

	return {
		anomalies: allAnomalies,
		summary: {
			total: allAnomalies.length,
			byType,
		},
	};
}

// ─── Supplier Analysis ──────────────────────────────────────────────

export interface SupplierAnalysisInput {
	suppliers: SupplierRecord[];
	transactions: TransactionRecord[];
}

export interface SupplierAnalysisOutput {
	anomalies: Anomaly[];
	summary: {
		total: number;
	};
}

export async function runSupplierAnalysis(
	input: SupplierAnalysisInput,
): Promise<SupplierAnalysisOutput> {
	const context = buildAgentContext();
	const strategy = createSupplierIntelligenceStrategy();

	const result = await strategy.execute(
		{ suppliers: input.suppliers, transactions: input.transactions },
		context,
	);
	const anomalies = result as Anomaly[];

	return {
		anomalies,
		summary: { total: anomalies.length },
	};
}

// ─── Document Classification ────────────────────────────────────────

export interface DocumentClassificationInput {
	documents: DocumentToClassify[];
}

export interface DocumentClassificationOutput {
	results: ClassificationResult[];
	summary: {
		total: number;
	};
}

export async function runDocumentClassification(
	input: DocumentClassificationInput,
): Promise<DocumentClassificationOutput> {
	const { results } = classifyDocuments(
		input.documents,
	);

	return {
		results,
		summary: { total: results.length },
	};
}
