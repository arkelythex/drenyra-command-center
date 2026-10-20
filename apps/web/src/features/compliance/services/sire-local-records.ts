import { api } from "@/lib/api-client";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { readActiveCompanyState } from "@/lib/company-context";
import type { SireRecord } from "../types/sire.types";

export interface SirePeriod {
	/** `YYYY-MM`, as the API expects it. */
	period: string;
	kind: "RVIE" | "RCE";
}

/** Register and period of a parsed SUNAT file; a file must cover exactly one of each. */
export function sirePeriodOf(records: SireRecord[]): SirePeriod | null {
	const [first] = records;
	if (!first) return null;
	if (records.some((r) => r.periodo !== first.periodo)) {
		throw new Error("El archivo SIRE debe cubrir un solo periodo.");
	}
	if (records.some((r) => r.caratula !== first.caratula)) {
		throw new Error(
			"El archivo SIRE debe cubrir un solo registro (RVIE o RCE).",
		);
	}
	return {
		period: `${first.periodo.slice(0, 4)}-${first.periodo.slice(4, 6)}`,
		kind: first.caratula as SirePeriod["kind"],
	};
}

/**
 * Loads the active company's books (sales for RVIE, purchases for RCE) for the
 * SUNAT file's period. Fails rather than returning `[]`, so a missing session
 * or an API error never shows up as "everything is missing in Drenyra".
 */
export async function loadLocalSireRecords(
	sunatRecords: SireRecord[],
): Promise<SireRecord[]> {
	const target = sirePeriodOf(sunatRecords);
	if (!target) return [];

	const companyId = readActiveCompanyState()?.active.companyId;
	if (!companyId) {
		throw new Error(
			"No hay una empresa activa: inicia sesión para comparar con tus libros.",
		);
	}

	const envelope = await unwrap(
		api.api.sire.comparison({ period: target.period })["local-records"].get({
			query: { companyId, kind: target.kind },
		}),
	);
	const records = extractOkData<SireRecord[]>(
		envelope,
		"No se pudieron cargar los comprobantes de la empresa.",
	);
	return records.map(fromApiCents);
}

function centsToSoles(cents: number): number {
	if (!Number.isSafeInteger(cents)) {
		throw new Error(`Monto de la API fuera de centavos enteros: ${cents}`);
	}
	return cents / 100;
}

/** The API sends integer cents; `SireRecord` (like the SUNAT parser) holds soles. */
function fromApiCents(record: SireRecord): SireRecord {
	// Eden Treaty turns ISO date strings into `Date`; keep `SireRecord` on strings.
	const fecha: unknown = record.fechaEmision;
	return {
		...record,
		fechaEmision:
			fecha instanceof Date
				? fecha.toISOString().slice(0, 10)
				: record.fechaEmision,
		baseImponible: centsToSoles(record.baseImponible),
		igv: centsToSoles(record.igv),
		total: centsToSoles(record.total),
	};
}
