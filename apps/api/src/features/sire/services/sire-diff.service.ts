import { randomUUID } from "node:crypto";
import type { Currency } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte } from "@drenyra/persistence/query";
import { bills, invoices } from "@drenyra/persistence/schema";
import { SireService } from "../sire.service";
import { SirePersistedProposalService } from "./sire-persisted-proposal.service";

export type SireDiffStatus =
	| "MATCH"
	| "MISMATCH"
	| "MISSING_LOCAL"
	| "MISSING_SUNAT";

export interface SireDocumentRecord {
	documentType: string;
	series: string;
	number: string;
	issueDate: string;
	total: number;
	currency: Currency;
	ruc?: string;
	reasonSocial?: string;
}

export interface SireDiffRow {
	id: string;
	status: SireDiffStatus;
	reason: string;
	difference: number;
	localRecord?: SireDocumentRecord;
	sunatRecord?: SireDocumentRecord;
	cpeRecord?: SireDocumentRecord;
	resolution?: "ACCEPTED_SUNAT" | "KEPT_LOCAL" | "PENDING";
}

/** How row-level SUNAT data was sourced for the diff. */
export type SireDiffSunatSource = "upload" | "persisted" | "unavailable";

export interface SireDiffArtifactPayload {
	period: string;
	currency: Currency;
	summary: {
		matched: number;
		mismatched: number;
		missingOnLedger: number;
		missingOnSunat: number;
		critical: number;
		totalDifference: number;
	};
	rows: SireDiffRow[];
	sunatSource: SireDiffSunatSource;
	sunatMessage?: string;
	approvable: boolean;
	submitBlocked: boolean;
	submitBlockReason?: string;
}

interface NormalizedRecord {
	key: string;
	record: SireDocumentRecord;
}

function recordKey(series: string, number: string): string {
	return `${series}-${number}`;
}

function parsePeriod(period: string): { year: number; month: number } {
	const [yearStr, monthStr] = period.split("-");
	return { year: Number(yearStr), month: Number(monthStr) };
}

function toMoney(value: number): number {
	return Number(value.toFixed(2));
}

async function loadInternalRecords(
	companyId: string,
	year: number,
	month: number,
): Promise<NormalizedRecord[]> {
	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0);

	const [sales, purchases] = await Promise.all([
		db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				gte(invoices.issueDate, startDate),
				lte(invoices.issueDate, endDate),
			),
		}),
		db.query.bills.findMany({
			where: and(
				eq(bills.companyId, companyId),
				gte(bills.issueDate, startDate),
				lte(bills.issueDate, endDate),
			),
		}),
	]);

	const rows: NormalizedRecord[] = [];
	for (const invoice of sales) {
		const parts = String(invoice.invoiceNumber ?? "").split("-");
		const series = parts[0] ?? "F001";
		const number = parts[1] ?? "0";
		rows.push({
			key: recordKey(series, number),
			record: {
				documentType: "01",
				series,
				number,
				issueDate: new Date(invoice.issueDate).toISOString().slice(0, 10),
				total: toMoney(Number(invoice.totalAmount ?? 0)),
				currency: (invoice.currency as Currency) ?? "PEN",
			},
		});
	}

	for (const bill of purchases) {
		const parts = String(bill.billNumber ?? "").split("-");
		const series = parts[0] ?? "E001";
		const number = parts[1] ?? "0";
		rows.push({
			key: recordKey(series, number),
			record: {
				documentType: "01",
				series,
				number,
				issueDate: new Date(bill.issueDate).toISOString().slice(0, 10),
				total: toMoney(Number(bill.totalAmount ?? 0)),
				currency: (bill.currency as Currency) ?? "PEN",
			},
		});
	}

	return rows;
}

function normalizeFromAnalyzeResult(
	result: Record<string, unknown>,
): NormalizedRecord[] {
	const records = Array.isArray(result.records)
		? (result.records as Array<Record<string, unknown>>)
		: Array.isArray(result.rows)
			? (result.rows as Array<Record<string, unknown>>)
			: [];

	return records.map((row, index) => {
		const series = String(row.serie ?? row.series ?? "UNK");
		const number = String(row.numero ?? row.number ?? index + 1);
		return {
			key: recordKey(series, number),
			record: {
				documentType: String(row.tipo ?? row.documentType ?? "01"),
				series,
				number,
				issueDate: String(row.fecha ?? row.issueDate ?? ""),
				total: toMoney(Number(row.total ?? row.monto ?? 0)),
				currency: "PEN",
				ruc: row.ruc ? String(row.ruc) : undefined,
				reasonSocial: row.razonSocial ? String(row.razonSocial) : undefined,
			},
		};
	});
}

/**
 * Builds three-way diff rows from normalized local, SUNAT, and optional CPE records.
 */
export function buildDiffRows(input: {
	local: NormalizedRecord[];
	sunat: NormalizedRecord[];
	cpe: NormalizedRecord[];
}): SireDiffRow[] {
	const localMap = new Map(
		input.local.map((entry) => [entry.key, entry.record]),
	);
	const sunatMap = new Map(
		input.sunat.map((entry) => [entry.key, entry.record]),
	);
	const cpeMap = new Map(input.cpe.map((entry) => [entry.key, entry.record]));
	const keys = new Set([
		...localMap.keys(),
		...sunatMap.keys(),
		...cpeMap.keys(),
	]);

	const rows: SireDiffRow[] = [];
	for (const key of keys) {
		const localRecord = localMap.get(key);
		const sunatRecord = sunatMap.get(key);
		const cpeRecord = cpeMap.get(key);

		let status: SireDiffStatus = "MATCH";
		let reason = "Consistente entre fuentes";
		let difference = 0;

		if (!localRecord && sunatRecord) {
			status = "MISSING_LOCAL";
			reason = "Presente en propuesta SUNAT, ausente en libros internos";
			difference = sunatRecord.total;
		} else if (localRecord && !sunatRecord) {
			status = "MISSING_SUNAT";
			reason = "Presente en libros internos, ausente en propuesta SUNAT";
			difference = localRecord.total;
		} else if (localRecord && sunatRecord) {
			difference = toMoney(localRecord.total - sunatRecord.total);
			if (Math.abs(difference) > 0.01) {
				status = "MISMATCH";
				reason = "Diferencia de monto entre libros internos y SUNAT";
			}
		}

		if (
			cpeRecord &&
			localRecord &&
			Math.abs(cpeRecord.total - localRecord.total) > 0.01
		) {
			status = "MISMATCH";
			reason = "CPE cargado difiere del ledger interno";
			difference = toMoney(cpeRecord.total - (localRecord?.total ?? 0));
		}

		rows.push({
			id: randomUUID(),
			status,
			reason,
			difference,
			localRecord,
			sunatRecord,
			cpeRecord,
			resolution: status === "MATCH" ? "KEPT_LOCAL" : "PENDING",
		});
	}

	return rows.sort((a, b) => {
		const order = { MISMATCH: 0, MISSING_LOCAL: 1, MISSING_SUNAT: 2, MATCH: 3 };
		return order[a.status] - order[b.status];
	});
}

/**
 * Aggregates diff row statuses into summary counters for the artifact payload.
 */
export function buildSummary(
	rows: SireDiffRow[],
): SireDiffArtifactPayload["summary"] {
	const matched = rows.filter((row) => row.status === "MATCH").length;
	const mismatched = rows.filter((row) => row.status === "MISMATCH").length;
	const missingOnLedger = rows.filter(
		(row) => row.status === "MISSING_LOCAL",
	).length;
	const missingOnSunat = rows.filter(
		(row) => row.status === "MISSING_SUNAT",
	).length;
	const critical = mismatched + missingOnLedger + missingOnSunat;
	const totalDifference = toMoney(
		rows.reduce((acc, row) => acc + Math.abs(row.difference), 0),
	);

	return {
		matched,
		mismatched,
		missingOnLedger,
		missingOnSunat,
		critical,
		totalDifference,
	};
}

/**
 * Determines whether SUNAT submission must stay blocked for this diff artifact.
 */
export function computeSubmitBlocked(input: {
	summary: SireDiffArtifactPayload["summary"];
	sunatSource: SireDiffSunatSource;
}): { submitBlocked: boolean; submitBlockReason?: string } {
	if (input.sunatSource === "unavailable") {
		return {
			submitBlocked: true,
			submitBlockReason:
				"Row-level SUNAT proposal data is unavailable. Upload the SIRE file and resolve discrepancies before submit.",
		};
	}

	if (input.summary.critical > 0) {
		return {
			submitBlocked: true,
			submitBlockReason: `${input.summary.critical} critical discrepancy(ies) require accountant review before SUNAT submit.`,
		};
	}

	return { submitBlocked: false };
}

export type SireDiffRowDecision = "ACCEPT_SUNAT" | "KEEP_LOCAL" | "PENDING";

export interface SireDiffCommitRow {
	rowId: string;
	status: SireDiffStatus;
	decision: SireDiffRowDecision;
	localRecord?: SireDocumentRecord;
	sunatRecord?: SireDocumentRecord;
}

export interface SireDiffCommitInput {
	companyId: string;
	period: string;
	artifactId: string;
	traceId: string;
	sunatSource: SireDiffSunatSource;
	summary: SireDiffArtifactPayload["summary"];
	rows: SireDiffCommitRow[];
	actorUserId: string;
}

export interface SireDiffCommitResult {
	committed: true;
	eventId: string;
	storedAt: string;
	submitBlocked: boolean;
	submitBlockReason?: string;
	ledgerMutation?: {
		updatedInvoices: number;
		updatedBills: number;
		createdInvoices: number;
		createdBills: number;
	};
}

/**
 * Validates accountant resolutions before persisting a SIRE diff commit.
 */
export function validateDiffCommit(input: {
	sunatSource: SireDiffSunatSource;
	rows: SireDiffCommitRow[];
}):
	| { ok: true }
	| { ok: false; reason: string; code: "SIRE_DIFF_COMMIT_BLOCKED" } {
	if (input.sunatSource === "unavailable") {
		return {
			ok: false,
			reason:
				"Cannot commit resolutions without row-level SUNAT proposal data. Upload the SIRE file first.",
			code: "SIRE_DIFF_COMMIT_BLOCKED",
		};
	}

	const unresolved = input.rows.filter(
		(row) => row.status !== "MATCH" && row.decision === "PENDING",
	);
	if (unresolved.length > 0) {
		return {
			ok: false,
			reason: `${unresolved.length} critical row(s) still pending accountant decision.`,
			code: "SIRE_DIFF_COMMIT_BLOCKED",
		};
	}

	return { ok: true };
}

/**
 * Computes submit gate after accountant resolutions are committed.
 */
export function computeSubmitBlockedAfterCommit(input: {
	sunatSource: SireDiffSunatSource;
	rows: SireDiffCommitRow[];
}): { submitBlocked: boolean; submitBlockReason?: string } {
	if (input.sunatSource === "unavailable") {
		return {
			submitBlocked: true,
			submitBlockReason:
				"Row-level SUNAT proposal data is unavailable. Upload the SIRE file before submit.",
		};
	}

	const unresolved = input.rows.filter(
		(row) => row.status !== "MATCH" && row.decision === "PENDING",
	);
	if (unresolved.length > 0) {
		return {
			submitBlocked: true,
			submitBlockReason: `${unresolved.length} row decision(s) still pending.`,
		};
	}

	return { submitBlocked: false };
}

/**
 * Resolves row-level SUNAT records for the diff.
 *
 * Order: uploaded file → persisted submission proposal → unavailable (never copy local ledger).
 */
async function resolveSunatRecords(input: {
	companyId: string;
	period: string;
	sireFile?: File;
}): Promise<{
	sunat: NormalizedRecord[];
	sunatSource: SireDiffSunatSource;
	sunatMessage?: string;
}> {
	if (input.sireFile) {
		const analyzed = await SireService.analyzeMassive(
			input.companyId,
			input.sireFile,
		);
		return {
			sunat: normalizeFromAnalyzeResult(analyzed as Record<string, unknown>),
			sunatSource: "upload",
		};
	}

	const persisted = await SirePersistedProposalService.loadPersistedRecords({
		companyId: input.companyId,
		period: input.period,
	});
	if (persisted) {
		return {
			sunat: persisted.records.map((record) => ({
				key: recordKey(record.series, record.number),
				record,
			})),
			sunatSource: "persisted",
		};
	}

	const live = await SireService.getSunatLiveSummary({
		companyId: input.companyId,
		period: input.period,
	});

	const sunatMessage =
		live.status === "available"
			? "SUNAT API is reachable but exposes aggregate totals only, not row-level proposal data. Upload the SIRE proposal file to run an honest three-way diff."
			: `SUNAT proposal unavailable (${live.reason}): ${live.message} Upload the SIRE proposal file to compare row-by-row.`;

	return {
		sunat: [],
		sunatSource: "unavailable",
		sunatMessage,
	};
}

export class SireDiffService {
	/** Builds a three-way diff artifact: local ledger vs SUNAT proposal vs optional CPE. */
	static async buildThreeWayDiff(input: {
		companyId: string;
		period: string;
		sireFile?: File;
		cpeFile?: File;
	}): Promise<SireDiffArtifactPayload> {
		const { year, month } = parsePeriod(input.period);

		const local = await loadInternalRecords(input.companyId, year, month);
		const { sunat, sunatSource, sunatMessage } = await resolveSunatRecords({
			companyId: input.companyId,
			period: input.period,
			sireFile: input.sireFile,
		});

		let cpe: NormalizedRecord[] = [];
		if (input.cpeFile) {
			const analyzed = await SireService.analyzeMassive(
				input.companyId,
				input.cpeFile,
			);
			cpe = normalizeFromAnalyzeResult(analyzed as Record<string, unknown>);
		}

		const rows = buildDiffRows({ local, sunat, cpe });
		const summary = buildSummary(rows);
		const { submitBlocked, submitBlockReason } = computeSubmitBlocked({
			summary,
			sunatSource,
		});

		return {
			period: input.period,
			currency: "PEN",
			summary,
			rows,
			sunatSource,
			sunatMessage,
			approvable: !submitBlocked,
			submitBlocked,
			submitBlockReason,
		};
	}
}
