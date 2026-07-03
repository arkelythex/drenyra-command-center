/**
 * Fiscal Agent 24/7 — Types for the autonomous recurring fiscal worker.
 *
 * @module use-cases/fiscal-agent/types
 */

import type { Money } from "@arkelythex/domain";
import type { CountryCode } from "@arkelythex/domain";

// ─── Step Pipeline ───────────────────────────────────────────────────

export interface FiscalAgentStepContext {
	organizationId: number;
	companyId: string;
	countryCode: CountryCode;
	period: string; // YYYYMM
	runId: string;
	userId: string;
}

export interface StepMetrics {
	startedAt: Date;
	completedAt: Date;
	itemsProcessed: number;
	itemsFailed: number;
}

export interface StepError {
	code: string;
	message: string;
	itemId?: string;
	retryable: boolean;
}

export interface StepResult<T> {
	success: boolean;
	data?: T;
	errors: StepError[];
	warnings: string[];
	metrics: StepMetrics;
}

export interface FiscalAgentStep<TInput, TOutput> {
	readonly name: string;
	execute(input: TInput, context: FiscalAgentStepContext): Promise<StepResult<TOutput>>;
}

// ─── Pipeline Data ───────────────────────────────────────────────────

export interface CollectOutput {
	transactions: ProcessableTransaction[];
	sireRecords: SireSummary[];
}

export interface ProcessableTransaction {
	id: string;
	date: Date;
	description: string;
	amount: Money;
	currency: string;
	vendorName?: string;
	vendorTaxId?: string;
	documentType?: string;
	documentNumber?: string;
}

export interface SireSummary {
	period: string;
	totalRecords: number;
	discrepancies: number;
}

export interface CategorizeOutput {
	categorizations: TransactionCategorization[];
}

export interface TransactionCategorization {
	transactionId: string;
	suggestedAccount: string;
	suggestedAccountName: string;
	confidence: number;
	isException: boolean;
}

export interface CalculateOutput {
	calculations: TaxCalculation[];
}

export interface TaxCalculation {
	transactionId: string;
	taxType: string;
	taxRate: number;
	taxAmount: Money;
	baseAmount: Money;
	totalAmount: Money;
	anomalies: string[];
}

export interface ReconcileOutput {
	discrepancies: FiscalDiscrepancy[];
	matchedCount: number;
	unmatchedLocalCount: number;
	unmatchedSunatCount: number;
}

export interface FiscalDiscrepancy {
	type: "MISSING_LOCAL" | "MISSING_SUNAT" | "AMOUNT_MISMATCH" | "IGV_MISMATCH";
	documentKey: string;
	localValue?: string;
	authorityValue?: string;
	severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface ReportOutput {
	summary: RunSummary;
	exceptions: FiscalAgentException[];
	suggestedJournalEntries: SuggestedEntry[];
}

export interface RunSummary {
	totalTransactions: number;
	categorized: number;
	exceptions: number;
	discrepancies: number;
	completedSteps: string[];
	failedSteps: string[];
	durationMs: number;
}

export interface FiscalAgentException {
	type:
		| "LOW_CONFIDENCE_CATEGORIZATION"
		| "SUNAT_DISCREPANCY"
		| "AMOUNT_MISMATCH"
		| "IGV_CALCULATION_ANOMALY"
		| "MISSING_DOCUMENT";
	severity: "LOW" | "MEDIUM" | "HIGH";
	transactionId: string;
	suggestedAction: string;
	confidence?: number;
	details: Record<string, unknown>;
}

export interface SuggestedEntry {
	transactionId: string;
	debitAccount: string;
	debitAmount: Money;
	creditAccount: string;
	creditAmount: Money;
	description: string;
	confidence: number;
}

// ─── Learning ────────────────────────────────────────────────────────

export interface CorrectionInput {
	transactionId: string;
	originalCategory: string;
	correctedCategory: string;
	userId: string;
	reason?: string;
}

export interface CorrectionRecord extends CorrectionInput {
	timestamp: Date;
	applied: boolean;
}

// ─── Run Report ──────────────────────────────────────────────────────

export interface FiscalNightlyRunReport {
	runId: string;
	organizationId: number;
	companyId: string;
	period: string;
	status: "SUCCESS" | "PARTIAL" | "FAILED";
	steps: Array<{
		name: string;
		success: boolean;
		metrics: StepMetrics;
		errors: StepError[];
	}>;
	summary: RunSummary;
	createdAt: Date;
}
