/**
 * Reconciliation Engine Types — PCGE reconciliation interfaces.
 */

export interface BankMovement {
	id: number;
	bankAccountId: number;
	date: Date;
	description: string;
	reference?: string;
	amount: number;
	type: "CREDIT" | "DEBIT";
	isReconciled: boolean;
}

export interface AccountingEntry {
	id: string;
	date: Date;
	description: string;
	reference?: string;
	debit: number;
	credit: number;
	documentType?: string;
	documentNumber?: string;
	thirdPartyRuc?: string;
	thirdPartyName?: string;
}

export interface ReconciliationMatch {
	bankMovement: BankMovement;
	accountingEntry: AccountingEntry;
	confidence: number;
	matchDetails: MatchDetails;
}

export interface MatchDetails {
	amountScore: number;
	dateScore: number;
	descriptionScore: number;
	documentScore: number;
	extractedData?: ExtractedData;
}

export interface ExtractedData {
	invoiceSeries?: string;
	invoiceNumber?: string;
	ruc?: string;
	amounts?: number[];
}

export interface ReconciliationConfig {
	amountWeight: number;
	dateWeight: number;
	descriptionWeight: number;
	documentWeight: number;
	minConfidence: number;
	dateToleranceDays: number;
	amountTolerance: number;
	autoReconcileThreshold: number;
}

export interface ReconciliationResult {
	matches: ReconciliationMatch[];
	unmatchedBank: BankMovement[];
	unmatchedAccounting: AccountingEntry[];
	stats: ReconciliationStats;
}

export interface ReconciliationStats {
	totalBankMovements: number;
	totalAccountingEntries: number;
	matchedCount: number;
	autoReconciledCount: number;
	averageConfidence: number;
	processingTimeMs: number;
}

export const DEFAULT_CONFIG: ReconciliationConfig = {
	amountWeight: 40,
	dateWeight: 25,
	descriptionWeight: 20,
	documentWeight: 15,
	minConfidence: 60,
	dateToleranceDays: 7,
	amountTolerance: 0.01,
	autoReconcileThreshold: 95,
};

export function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function extractDataFromDescription(description: string): ExtractedData {
	const extracted: ExtractedData = {};
	const invoiceMatch = description.match(/([FBET]\d{3})-(\d{5,8})/i);
	if (invoiceMatch?.[1] && invoiceMatch[2]) {
		extracted.invoiceSeries = invoiceMatch[1].toUpperCase();
		extracted.invoiceNumber = invoiceMatch[2];
	}
	const rucMatch = description.match(/\b(10|20)\d{9}\b/);
	if (rucMatch?.[0]) extracted.ruc = rucMatch[0];
	const amountMatches = description.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
	if (amountMatches) {
		extracted.amounts = amountMatches
			.map((s) => parseFloat(s.replace(/,/g, "")))
			.filter((n) => !isNaN(n) && n > 0);
	}
	return extracted;
}
