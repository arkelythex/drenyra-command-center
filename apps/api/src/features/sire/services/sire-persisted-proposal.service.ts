import type { Currency } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { and, desc, eq } from "@arkelythex/persistence/query";
import { sireSubmissions } from "@arkelythex/persistence/schema";
import { parseRecords } from "../../../../../../packages/infrastructure/src/sunat/sire/parser";
import type { SireRegisterType } from "../../../../../../packages/infrastructure/src/sunat/sire/types";
import type { SireDocumentRecord } from "./sire-diff.service";

/** Persisted proposal payload stored under sire_submissions.warnings.proposalRecords. */
export interface PersistedProposalPayload {
	payloadBase64: string;
	ledgerType: "ventas" | "compras";
	payloadFormat: "txt" | "csv" | "json" | "xml";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses base64-encoded SIRE proposal bytes into normalized document records.
 */
export function parseProposalRecordsFromPayloadBase64(
	payloadBase64: string,
	ledgerType: SireRegisterType,
): SireDocumentRecord[] {
	const buffer = Buffer.from(payloadBase64, "base64");
	const parsed = parseRecords(buffer, ledgerType);

	return parsed.map((row) => ({
		documentType: row.tipoComprobante,
		series: row.serie,
		number: row.numero,
		issueDate: row.fechaEmision.toISOString().slice(0, 10),
		total: Number(row.total.toFixed(2)),
		currency: row.moneda as Currency,
		ruc: row.numeroDocIdentidad || undefined,
		reasonSocial: row.razonSocial || undefined,
	}));
}

/**
 * Loads row-level SUNAT proposal records from prior sire_submissions audit rows.
 */
export class SirePersistedProposalService {
	static async loadPersistedRecords(input: {
		companyId: string;
		period: string;
	}): Promise<{
		records: SireDocumentRecord[];
		ledgerType: "ventas" | "compras";
	} | null> {
		const submissions = await db
			.select()
			.from(sireSubmissions)
			.where(
				and(
					eq(sireSubmissions.companyId, input.companyId),
					eq(sireSubmissions.period, input.period),
				),
			)
			.orderBy(desc(sireSubmissions.createdAt))
			.limit(10);

		for (const submission of submissions) {
			if (!isRecord(submission.warnings)) continue;
			const proposal = submission.warnings.proposalRecords;
			if (!isRecord(proposal)) continue;

			const payloadBase64 = proposal.payloadBase64;
			const ledgerType = proposal.ledgerType;
			if (
				typeof payloadBase64 !== "string" ||
				(ledgerType !== "ventas" && ledgerType !== "compras")
			) {
				continue;
			}

			const registerType: SireRegisterType =
				ledgerType === "compras" ? "COMPRAS" : "VENTAS";
			const records = parseProposalRecordsFromPayloadBase64(
				payloadBase64,
				registerType,
			);
			if (records.length > 0) {
				return { records, ledgerType };
			}
		}

		return null;
	}
}
