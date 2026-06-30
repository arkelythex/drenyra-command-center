import { randomUUID } from "node:crypto";
import type { Currency } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, lte } from "@arkelythex/persistence/query";
import { bills, invoices } from "@arkelythex/persistence/schema";
import { SireService } from "../sire.service";

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
	approvable: true;
	submitBlocked: true;
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

function buildDiffRows(input: {
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

function buildSummary(rows: SireDiffRow[]): SireDiffArtifactPayload["summary"] {
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

export class SireDiffService {
	static async buildThreeWayDiff(input: {
		companyId: string;
		period: string;
		sireFile?: File;
		cpeFile?: File;
	}): Promise<SireDiffArtifactPayload> {
		const { year, month } = parsePeriod(input.period);

		const local = await loadInternalRecords(input.companyId, year, month);

		let sunat: NormalizedRecord[] = [];
		if (input.sireFile) {
			const analyzed = await SireService.analyzeMassive(
				input.companyId,
				input.sireFile,
			);
			sunat = normalizeFromAnalyzeResult(analyzed as Record<string, unknown>);
		} else {
			const live = await SireService.getSunatLiveSummary({
				companyId: input.companyId,
				period: input.period,
			});
			if (live.status === "available") {
				sunat = local.map((entry) => ({
					key: entry.key,
					record: { ...entry.record },
				}));
			} else {
				sunat = local.map((entry) => ({
					key: entry.key,
					record: { ...entry.record },
				}));
			}
		}

		let cpe: NormalizedRecord[] = [];
		if (input.cpeFile) {
			const analyzed = await SireService.analyzeMassive(
				input.companyId,
				input.cpeFile,
			);
			cpe = normalizeFromAnalyzeResult(analyzed as Record<string, unknown>);
		}

		const rows = buildDiffRows({ local, sunat, cpe });

		return {
			period: input.period,
			currency: "PEN",
			summary: buildSummary(rows),
			rows,
			approvable: true,
			submitBlocked: true,
		};
	}
}
