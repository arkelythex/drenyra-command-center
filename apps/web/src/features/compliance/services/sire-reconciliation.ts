/**
 * SIRE reconciliation: compares the SUNAT proposal with the local books.
 *
 * All arithmetic runs on integer cents, never on floating-point amounts, so a
 * one-cent difference is detected exactly and totals do not drift. The Money
 * value object is not used because credit notes carry negative amounts, which
 * `Money` rejects. Amounts are converted back to decimals only at the boundary.
 */
import type {
	ReconciliationStats,
	SireDiscrepancy,
	SireRecord,
} from "../types/sire.types";

export interface ReconcileOptions {
	/** Largest per-document total/IGV difference, in cents, still considered a match. Default 0. */
	toleranceCents?: number;
}

export function toCents(amount: number): number {
	if (!Number.isFinite(amount)) {
		throw new RangeError(`Amount must be finite, received ${amount}`);
	}
	// Rounding the scaled value avoids drift such as 0.1 + 0.2 = 0.30000000000000004.
	// The epsilon nudges exact half-cents (1.005) upwards like decimal rounding does.
	const cents = Math.sign(amount) * Math.round(Math.abs(amount) * 100 + 1e-9);
	return cents || 0; // normalises -0
}

const fromCents = (cents: number): number => cents / 100;

const BASE_CURRENCY = "PEN";

const currencyOf = (record: SireRecord): string =>
	record.moneda.trim().toUpperCase();

function documentKey(record: SireRecord): string {
	const number = record.numero.trim().replace(/^0+(?=\d)/, "");
	return [
		record.rucEmisor.trim(),
		record.tipoComprobante.trim().padStart(2, "0"),
		record.serie.trim().toUpperCase(),
		number,
	].join("|");
}

interface DocumentIndex {
	unique: Map<string, SireRecord>;
	duplicates: Map<string, SireRecord>;
}

/** Keeps the first record per document and reports every repeated one. */
function indexByDocument(records: SireRecord[]): DocumentIndex {
	const unique = new Map<string, SireRecord>();
	const duplicates = new Map<string, SireRecord>();
	for (const record of records) {
		const key = documentKey(record);
		if (unique.has(key)) duplicates.set(key, record);
		else unique.set(key, record);
	}
	return { unique, duplicates };
}

/** Annulled documents carry no amounts for the period, so they never add to totals. */
function sumCents(
	records: Iterable<SireRecord>,
	pick: (record: SireRecord) => number,
): number {
	let sum = 0;
	for (const record of records) {
		if (record.estado === "ANULADO" || currencyOf(record) !== BASE_CURRENCY) {
			continue;
		}
		sum += toCents(pick(record));
	}
	return sum;
}

function assertTolerance(toleranceCents: number): void {
	if (!Number.isSafeInteger(toleranceCents) || toleranceCents < 0) {
		throw new RangeError(
			`toleranceCents must be a non-negative integer, received ${toleranceCents}`,
		);
	}
}

type PairDiscrepancy = Omit<SireDiscrepancy, "id">;

/**
 * SIRE files have no status column; SUNAT reports an annulled document with
 * zero amounts. Read such a row as ANULADO when the books say it was cancelled.
 */
function sunatEstado(
	sunat: SireRecord,
	local: SireRecord,
): SireRecord["estado"] {
	const zeroed =
		toCents(sunat.baseImponible) === 0 &&
		toCents(sunat.igv) === 0 &&
		toCents(sunat.total) === 0;
	return local.estado === "ANULADO" && zeroed ? "ANULADO" : sunat.estado;
}

/** Compares one document present on both sides; null means they agree. */
function comparePair(
	sunat: SireRecord,
	local: SireRecord,
	toleranceCents: number,
): PairDiscrepancy | null {
	const pair = { recordSunat: sunat, recordLocal: local };

	if (currencyOf(sunat) !== currencyOf(local)) {
		return { type: "CURRENCY_MISMATCH", severity: "HIGH", ...pair };
	}
	if (sunatEstado(sunat, local) !== local.estado) {
		return { type: "STATUS_MISMATCH", severity: "HIGH", ...pair };
	}
	// Both annulled: amounts no longer apply (SUNAT zeroes them, the books may not).
	if (local.estado === "ANULADO") return null;

	const totalGap = Math.abs(toCents(sunat.total) - toCents(local.total));
	if (totalGap > toleranceCents) {
		return {
			type: "AMOUNT_MISMATCH",
			severity: "MEDIUM",
			...pair,
			diffAmount: fromCents(totalGap),
		};
	}

	// Totals agree but the tax split does not: exactly what a SIRE check must catch.
	const igvGap = Math.abs(toCents(sunat.igv) - toCents(local.igv));
	if (igvGap > toleranceCents) {
		return {
			type: "IGV_MISMATCH",
			severity: "HIGH",
			...pair,
			diffAmount: fromCents(igvGap),
		};
	}
	return null;
}

export function reconcileSire(
	sunatRecords: SireRecord[],
	localRecords: SireRecord[],
	options: ReconcileOptions = {},
): { discrepancies: SireDiscrepancy[]; stats: ReconciliationStats } {
	const toleranceCents = options.toleranceCents ?? 0;
	assertTolerance(toleranceCents);

	const sunat = indexByDocument(sunatRecords);
	const local = indexByDocument(localRecords);
	const discrepancies: SireDiscrepancy[] = [];
	let matchCount = 0;

	for (const [key, record] of sunat.duplicates) {
		discrepancies.push({
			id: `dup_sunat_${key}`,
			type: "DUPLICATE_DOCUMENT",
			severity: "HIGH",
			recordSunat: record,
		});
	}
	for (const [key, record] of local.duplicates) {
		discrepancies.push({
			id: `dup_local_${key}`,
			type: "DUPLICATE_DOCUMENT",
			severity: "HIGH",
			recordLocal: record,
		});
	}

	for (const [key, sunatRecord] of sunat.unique) {
		const localRecord = local.unique.get(key);
		const id = `diff_${key}`;

		if (!localRecord) {
			discrepancies.push({
				id,
				type: "MISSING_IN_ARKELYTHEX",
				severity: "HIGH",
				recordSunat: sunatRecord,
			});
			continue;
		}

		const found = comparePair(sunatRecord, localRecord, toleranceCents);
		if (found) discrepancies.push({ id, ...found });
		else matchCount += 1;
	}

	if (sunat.unique.size > 0) {
		for (const [key, localRecord] of local.unique) {
			if (sunat.unique.has(key)) continue;
			discrepancies.push({
				id: `diff_${key}`,
				type: "MISSING_IN_SUNAT",
				severity: "MEDIUM",
				recordLocal: localRecord,
			});
		}
	}

	const stats: ReconciliationStats = {
		totalSunat: fromCents(sumCents(sunat.unique.values(), (r) => r.total)),
		totalLocal: fromCents(sumCents(local.unique.values(), (r) => r.total)),
		matchCount,
		discrepancyCount: discrepancies.length,
		igvGap: fromCents(
			sumCents(sunat.unique.values(), (r) => r.igv) -
				sumCents(local.unique.values(), (r) => r.igv),
		),
	};

	return { discrepancies, stats };
}
