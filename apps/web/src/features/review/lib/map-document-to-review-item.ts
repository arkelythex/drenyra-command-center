import type { ReviewConflictValue, ReviewItem } from "../types/review.types";

/** Shape returned by `DocumentResponseDTO` (documents vertical slice). */
export interface DocumentListEntryDTO {
	id: string;
	fileName: string;
	status: string;
	confidenceLevel?: string | null;
	extractedData?: unknown;
	uploadedAt?: string;
	processedAt?: string;
	clientName?: string;
}

function confidenceFromLevel(level: string | null | undefined): number {
	if (!level) return 0.72;
	const n = Number(level);
	if (!Number.isNaN(n) && n >= 0 && n <= 1) return n;
	const l = level.toLowerCase();
	if (l === "high") return 0.92;
	if (l === "medium") return 0.78;
	if (l === "low") return 0.55;
	return 0.72;
}

function pickDate(dto: DocumentListEntryDTO): string {
	const raw = dto.processedAt ?? dto.uploadedAt ?? "";
	if (raw.length >= 10) return raw.slice(0, 10);
	return new Date().toISOString().slice(0, 10);
}

function pickAmount(extracted: Record<string, unknown> | null): number {
	if (!extracted) return 0;
	const total = extracted.total ?? extracted.montoTotal ?? extracted.amount;
	if (typeof total === "number") return total;
	if (typeof total === "string") return Number.parseFloat(total) || 0;
	return 0;
}

/**
 * Build conflict rows from OCR/extraction payload for the auditor UI.
 * When only extracted values exist, `original` stays null and `isDifferent` is true if extracted is present.
 */
export function conflictsFromExtracted(
	extracted: unknown,
	baseConfidence: number,
): Record<string, ReviewConflictValue> {
	if (!extracted || typeof extracted !== "object") {
		return {
			extraction: {
				original: null,
				extracted: "(sin payload estructurado)",
				isDifferent: false,
				label: "Datos extraídos",
				confidence: baseConfidence * 0.9,
			},
		};
	}

	const o = extracted as Record<string, unknown>;
	const out: Record<string, ReviewConflictValue> = {};

	const push = (
		key: string,
		label: string,
		raw: unknown,
		confidence: number,
	) => {
		if (raw === undefined) return;
		out[key] = {
			original: null,
			extracted: raw as string | number | boolean | null,
			isDifferent: raw !== null && raw !== "",
			label,
			confidence,
		};
	};

	push("taxId", "RUC Emisor", o.issuerRUC ?? o.ruc, baseConfidence);
	push(
		"issuerName",
		"Razón social",
		o.issuerName ?? o.razonSocial,
		baseConfidence,
	);
	push("total", "Monto total", o.total ?? o.montoTotal, baseConfidence);
	push("igv", "IGV", o.igv, baseConfidence * 0.95);
	push(
		"documentDate",
		"Fecha documento",
		o.documentDate ?? o.fecha,
		baseConfidence,
	);
	push(
		"pcgeAccount",
		"Cuenta PCGE",
		o.pcgeAccount ?? o.cuentaPcge,
		baseConfidence,
	);

	if (Object.keys(out).length === 0) {
		return {
			raw: {
				original: null,
				extracted: JSON.stringify(o, null, 2),
				isDifferent: true,
				label: "Payload OCR",
				confidence: baseConfidence * 0.85,
			},
		};
	}

	return out;
}

export function mapDocumentDtoToReviewItem(dto: DocumentListEntryDTO): ReviewItem {
	const baseConfidence = confidenceFromLevel(dto.confidenceLevel ?? undefined);
	const extracted =
		dto.extractedData && typeof dto.extractedData === "object"
			? (dto.extractedData as Record<string, unknown>)
			: null;
	const conflicts = conflictsFromExtracted(dto.extractedData, baseConfidence);
	const hasDiff = Object.values(conflicts).some((c) => c.isDifferent);

	return {
		id: dto.id,
		filename: dto.fileName,
		date: pickDate(dto),
		amount: pickAmount(extracted),
		confidence: baseConfidence,
		status: hasDiff ? "conflict" : "pending",
		conflicts,
	};
}
