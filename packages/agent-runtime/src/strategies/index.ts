/**
 * Strategies — fiscal detection strategies ported from agent-swarm
 *
 * Exports:
 *   - AnomalyStrategy interface + shared Anomaly types
 *   - FiscalAnomalyEngine orchestrator
 *   - All strategy implementations (ruc-breach, igv-mismatch, duplicate-invoice)
 */

// ─── FiscalAnomalyEngine ───────────────────────────────────
export { FiscalAnomalyEngine } from "./anomaly-engine";
export type {
	CashflowPredictorOptions,
	CashflowTransaction,
} from "./cashflow-predictor.strategy";
// ─── Cashflow Predictor Strategy ───────────────────────────
export {
	createCashflowPredictorStrategy,
	DEFAULT_ZSCORE_THRESHOLD,
	EXPENSE_SPIKE_RATIO,
	INCOME_DROP_RATIO,
	MIN_DATA_POINTS,
	ROLLING_WINDOW_DAYS,
	TREND_WINDOW_DAYS,
} from "./cashflow-predictor.strategy";
export type { DetraccionInvoice } from "./detracciones.strategy";
// ─── Detracciones Strategy ─────────────────────────────────
export {
	createDetraccionesStrategy,
	SPOT_RATES,
} from "./detracciones.strategy";
export type {
	ClassificationResult,
	DetectedDocType,
	DetectedFormat,
	DocumentClassificationOptions,
	DocumentToClassify,
} from "./document-classification.strategy";
// ─── Document Classification Strategy ──────────────────────
export {
	classifyDocument,
	classifyDocuments,
	createDocumentClassificationStrategy,
	DOCUMENT_TYPE_KEYWORDS,
	MIN_UNREADABLE_CHARS,
	SUNAT_SERIES_PATTERNS,
} from "./document-classification.strategy";
export type { DuplicateInvoiceCheck } from "./duplicate-invoice.strategy";
// ─── Duplicate Invoice Strategy ────────────────────────────
export { createDuplicateInvoiceStrategy } from "./duplicate-invoice.strategy";
export type { IgvMismatchInvoice } from "./igv-mismatch.strategy";
// ─── IGV Mismatch Strategy ─────────────────────────────────
export {
	createIgvMismatchStrategy,
	EXONERATED_TIPOS,
	IGV_RATE,
	IGV_TOLERANCE_PEN,
} from "./igv-mismatch.strategy";
export type { RucBreachTransaction } from "./ruc-breach.strategy";
// ─── RUC Breach Strategy ───────────────────────────────────
export {
	detectRucBreachAnomalies,
	RUC_BREACH_THRESHOLD_PEN,
} from "./ruc-breach.strategy";
export type { SireFilingRecord } from "./sire-filing.strategy";
// ─── SIRE Filing Strategy ──────────────────────────────────
export {
	CRITICAL_OVERDUE_DAYS,
	createSireFilingStrategy,
	SIRE_DEADLINE_DAYS,
} from "./sire-filing.strategy";
export type {
	SupplierIntelligenceInput,
	SupplierRecord,
	TransactionRecord,
} from "./supplier-intelligence.strategy";
// ─── Supplier Intelligence Strategy ────────────────────────
export {
	CONCENTRATION_THRESHOLD_PCT,
	createSupplierIntelligenceStrategy,
	DEBT_AGING_BUCKETS,
	NEW_SUPPLIER_HIGH_VALUE_THRESHOLD,
	NEW_SUPPLIER_LOOKBACK_DAYS,
	PAYMENT_DELAY_DAYS_THRESHOLD,
} from "./supplier-intelligence.strategy";
export type { TaxCalendarInput, TaxObligation } from "./tax-calendar.strategy";
// ─── Tax Calendar Strategy ─────────────────────────────────
export { createTaxCalendarStrategy } from "./tax-calendar.strategy";
// ─── Shared types ──────────────────────────────────────────
export type {
	Anomaly,
	AnomalySeverity,
	AnomalyStrategy,
	FiscalAnomalyEngineOptions,
	StrategyRunResult,
} from "./types";
export { compareSeverity, meetsThreshold } from "./types";
