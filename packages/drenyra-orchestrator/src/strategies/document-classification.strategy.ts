/**
 * Document Classification Strategy — Pillar 2.3
 *
 * Classifies fiscal documents by type, format, and SUNAT document series.
 * Detects anomalies: unclassifiable documents, missing fields, type mismatches,
 * unreadable content.
 *
 * Ported from @drenyra/data-engine OCR classify_document() heuristic,
 * extended with SUNAT document series detection and completeness checks.
 */

import type { Anomaly, AnomalyStrategy } from "./types";

// ─── Types ─────────────────────────────────────────────────────────

export type DetectedDocType =
	| "invoice"
	| "receipt"
	| "identity"
	| "contract"
	| "bank_statement"
	| "sunat_xml"
	| "unknown";

export type DetectedFormat = "IMAGE" | "XML" | "PDF" | "UNKNOWN";

export interface DocumentToClassify {
	/** Unique document identifier */
	id: string;
	/** Optional filename (used for format + series hint) */
	filename?: string;
	/** Extracted text content (OCR or raw text) */
	text: string;
	/** Declared type (optional — if user/uploader specified one) */
	declaredType?: DetectedDocType;
	/** Declared SUNAT series (optional, e.g. "F001") */
	serie?: string;
}

export interface ClassificationResult {
	documentId: string;
	detectedType: DetectedDocType;
	detectedFormat: DetectedFormat;
	sunatType?: string;
	confidence: number;
	completenessScore: number;
	missingFields: string[];
	classificationMethod: string;
}

export interface DocumentClassificationOptions {
	/** Minimum confidence to consider a classification valid (default: 0.5) */
	minConfidence?: number;
	/** Enable format detection (default: true) */
	checkFormat?: boolean;
	/** Enable content-based type classification (default: true) */
	classifyByContent?: boolean;
	/** Enable completeness check (default: true) */
	checkCompleteness?: boolean;
	/** Enable type mismatch detection (default: true) */
	checkTypeMismatch?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────

export const DEFAULT_MIN_CONFIDENCE = 0.5;
export const MIN_UNREADABLE_CHARS = 20;

/** Content pattern groups for document type classification */
export const DOCUMENT_TYPE_KEYWORDS: Record<
	DetectedDocType,
	{ keywords: string[]; weight: number }[]
> = {
	invoice: [
		{ keywords: ["FACTURA", "FACTURA ELECTRÓNICA", "BOLETA DE VENTA"], weight: 1.0 },
		{ keywords: ["RUC", "IGV", "SUBTOTAL", "TOTAL"], weight: 0.8 },
		{ keywords: ["SERIE", "CORRELATIVO", "CPE"], weight: 0.6 },
	],
	receipt: [
		{ keywords: ["TICKET", "VOUCHER", "BOLETA"], weight: 1.0 },
		{ keywords: ["VUELTO", "CAJA", "GRACIAS POR SU COMPRA"], weight: 0.8 },
	],
	identity: [
		{ keywords: ["DNI", "DOCUMENTO NACIONAL DE IDENTIDAD"], weight: 1.0 },
		{ keywords: ["NOMBRE", "APELLIDOS", "LUGAR DE NACIMIENTO"], weight: 0.7 },
	],
	contract: [
		{ keywords: ["CONTRATO", "CLAUSULA", "PARTES", "FIRMA"], weight: 1.0 },
	],
	bank_statement: [
		{ keywords: ["EXTRACTO", "MOVIMIENTOS", "ESTADO DE CUENTA"], weight: 1.0 },
		{ keywords: ["BANCO", "CUENTA", "SALDO"], weight: 0.8 },
	],
	sunat_xml: [
		{ keywords: ["UBL", "SUNAT", "cbc:Invoice", "cac:InvoiceLine"], weight: 1.0 },
		{ keywords: ["IssueDate", "InvoiceTypeCode", "cbc:ID"], weight: 0.8 },
	],
	unknown: [],
};

/** SUNAT document series prefixes */
export const SUNAT_SERIES_PATTERNS: Record<string, string> = {
	F: "FACTURA",
	B: "BOLETA",
	FC: "FACTURA (Comercial)",
	BC: "BOLETA (Comercial)",
	E: "NOTA_CREDITO_FACTURA",
	EB: "NOTA_CREDITO_BOLETA",
	FD: "NOTA_DEBITO_FACTURA",
	BD: "NOTA_DEBITO_BOLETA",
	P: "PROFORMA",
	R: "RECIBO",
};

/** Required fields by document type for completeness scoring */
export const REQUIRED_FIELDS: Record<DetectedDocType, string[]> = {
	invoice: ["RUC", "serie", "correlativo", "total", "igv"],
	receipt: ["total", "fecha"],
	identity: ["nombres", "apellidos", "documento"],
	contract: ["partes", "clausula", "fecha"],
	bank_statement: ["banco", "cuenta", "saldo", "movimientos"],
	sunat_xml: ["UBL", "emisor", "receptor", "tipo", "monto"],
	unknown: [],
};

// ─── Helpers ───────────────────────────────────────────────────────

function detectFormat(filename?: string): DetectedFormat {
	if (!filename) return "UNKNOWN";
	const ext = filename.toLowerCase().split(".").pop() ?? "";
	switch (ext) {
		case "xml":
			return "XML";
		case "pdf":
			return "PDF";
		case "png":
		case "jpg":
		case "jpeg":
		case "tiff":
		case "bmp":
		case "webp":
			return "IMAGE";
		default:
			return "UNKNOWN";
	}
}

function detectSunatType(
	serie?: string,
	text?: string,
): { type: string; confidence: number } | undefined {
	// Try from serie first
	if (serie) {
		const prefix = serie.match(/^([A-Z]+)/)?.[1];
		if (prefix) {
			// Try longest match first (e.g. FC before F)
			const matches = Object.entries(SUNAT_SERIES_PATTERNS)
				.filter(([key]) => prefix.startsWith(key))
				.sort(([a], [b]) => b.length - a.length);
			if (matches.length > 0) {
				return { type: matches[0][1], confidence: 0.9 };
			}
		}
	}

	// Fallback: try from text content
	if (text) {
		const upper = text.toUpperCase();
		if (upper.includes("FACTURA")) return { type: "FACTURA", confidence: 0.6 };
		if (upper.includes("BOLETA")) return { type: "BOLETA", confidence: 0.6 };
	}

	return undefined;
}

function classifyByContent(
	text: string,
): { type: DetectedDocType; confidence: number; method: string } {
	const upper = text.toUpperCase();
	const scores: { type: DetectedDocType; score: number; matchedKeywords: number }[] = [];

	for (const [type, groups] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
		if (type === "unknown") continue;
		let totalScore = 0;
		let totalWeight = 0;
		let matchedKeywords = 0;

		for (const group of groups) {
			totalWeight += group.weight;
			const matchCount = group.keywords.filter((kw) => upper.includes(kw)).length;
			if (matchCount > 0) {
				totalScore += (matchCount / group.keywords.length) * group.weight;
				matchedKeywords += matchCount;
			}
		}

		if (totalWeight > 0) {
			const normalizedScore = totalScore / totalWeight;
			scores.push({
				type: type as DetectedDocType,
				score: normalizedScore,
				matchedKeywords,
			});
		}
	}

	if (scores.length === 0) {
		return { type: "unknown", confidence: 0, method: "no_keywords_matched" };
	}

	// Sort by score descending
	scores.sort((a, b) => b.score - a.score);

	// If top score is 0, unknown
	if (scores[0].score === 0) {
		return { type: "unknown", confidence: 0, method: "no_keywords_matched" };
	}

	// Check if top score clearly beats second
	if (scores.length > 1 && scores[0].score > scores[1].score * 1.5) {
		return { type: scores[0].type, confidence: scores[0].score, method: "keyword_match" };
	}

	// Close race — return top but lower confidence
	return { type: scores[0].type, confidence: scores[0].score * 0.7, method: "keyword_match_low_confidence" };
}

function checkCompleteness(
	type: DetectedDocType,
	text: string,
): { score: number; missing: string[] } {
	const fields = REQUIRED_FIELDS[type];
	if (fields.length === 0) return { score: 1, missing: [] };

	const upper = text.toUpperCase();
	const missing = fields.filter(
		(field) => !upper.includes(field.toUpperCase()),
	);

	const score = (fields.length - missing.length) / fields.length;
	return { score, missing };
}

function generateDocAnomalyId(type: string, idx: number): string {
	return `doc-cls-${type}-${Date.now()}-${idx}`;
}

// ─── Main classification function ──────────────────────────────────

/**
 * Classify a single document by format, content type, SUNAT series.
 * Returns classification result + anomalies.
 */
export function classifyDocument(
	doc: DocumentToClassify,
	options?: DocumentClassificationOptions,
): { result: ClassificationResult; anomalies: Anomaly[] } {
	const opts = {
		minConfidence: options?.minConfidence ?? DEFAULT_MIN_CONFIDENCE,
		checkFormat: options?.checkFormat ?? true,
		classifyByContent: options?.classifyByContent ?? true,
		checkCompleteness: options?.checkCompleteness ?? true,
		checkTypeMismatch: options?.checkTypeMismatch ?? true,
	};

	const anomalies: Anomaly[] = [];
	const timestamp = new Date().toISOString();

	// 1. Format detection
	const format = opts.checkFormat ? detectFormat(doc.filename) : "UNKNOWN";

	// 2. SUNAT type from serie
	const sunatInfo = detectSunatType(doc.serie, doc.text);

	// 3. Content-based classification
	let detectedType: DetectedDocType = "unknown";
	let confidence = 0;
	let classificationMethod = "format_only";

	if (format === "XML" && sunatInfo) {
		// XML with SUNAT content → sunat_xml
		detectedType = "sunat_xml";
		confidence = 0.95;
		classificationMethod = "xml_format_with_sunat_type";
	} else if (format === "XML" && doc.text.includes("UBL")) {
		detectedType = "sunat_xml";
		confidence = 0.85;
		classificationMethod = "xml_format_with_ubl";
	} else if (opts.classifyByContent && doc.text.length > MIN_UNREADABLE_CHARS) {
		const contentResult = classifyByContent(doc.text);
		detectedType = contentResult.type;
		confidence = contentResult.confidence;
		classificationMethod = contentResult.method;
	} else if (doc.text.length <= MIN_UNREADABLE_CHARS && doc.text.length > 0) {
		// Text too short — low confidence
		detectedType = "unknown";
		confidence = 0.1;
		classificationMethod = "unreadable";
	}

	// 4. Anomaly: unreadable document
	if (doc.text.length <= MIN_UNREADABLE_CHARS && doc.text.length > 0) {
		anomalies.push({
			id: generateDocAnomalyId("unreadable", anomalies.length),
			timestamp,
			entityType: "document",
			entityId: doc.id,
			metric: "text_length",
			expectedValue: MIN_UNREADABLE_CHARS,
			actualValue: doc.text.length,
			deviation: MIN_UNREADABLE_CHARS - doc.text.length,
			severity: "medium",
			confidence: 0.8,
			reasoning: `Document text has only ${doc.text.length} characters (minimum ${MIN_UNREADABLE_CHARS} for reliable classification)`,
			detectionMethod: "content_length_check",
			context: { filename: doc.filename, textLength: doc.text.length },
		});
	}

	// 5. Anomaly: not classifiable
	if (detectedType === "unknown" && confidence < opts.minConfidence) {
		anomalies.push({
			id: generateDocAnomalyId("not_classified", anomalies.length),
			timestamp,
			entityType: "document",
			entityId: doc.id,
			metric: "classification_confidence",
			expectedValue: opts.minConfidence,
			actualValue: confidence,
			deviation: opts.minConfidence - confidence,
			severity: "high",
			confidence: 0.9,
			reasoning: `Document could not be classified (confidence ${(confidence * 100).toFixed(0)}%, minimum ${(opts.minConfidence * 100).toFixed(0)}%)`,
			detectionMethod: "content_classification",
			context: { filename: doc.filename, format, textPreview: doc.text.slice(0, 100) },
		});
	}

	// 6. Completeness check
	let completenessScore = 0;
	let missingFields: string[] = [];

	if (opts.checkCompleteness && detectedType !== "unknown") {
		const completeness = checkCompleteness(detectedType, doc.text);
		completenessScore = completeness.score;
		missingFields = completeness.missing;

		if (completeness.missing.length > 0) {
			const severity = completeness.missing.length >= 3 ? "high" : completeness.missing.length >= 2 ? "medium" : "low";
			anomalies.push({
				id: generateDocAnomalyId("missing_fields", anomalies.length),
				timestamp,
				entityType: "document",
				entityId: doc.id,
				metric: "completeness_score",
				expectedValue: 1,
				actualValue: completenessScore,
				deviation: 1 - completenessScore,
				severity,
				confidence: 0.75,
				reasoning: `Document classified as ${detectedType} but missing fields: ${completeness.missing.join(", ")}`,
				detectionMethod: "completeness_check",
				context: {
					filename: doc.filename,
					detectedType,
					missingFields: completeness.missing,
				},
			});
		}
	}

	// 7. Type mismatch anomaly
	if (opts.checkTypeMismatch && doc.declaredType && detectedType !== "unknown") {
		if (doc.declaredType !== detectedType) {
			anomalies.push({
				id: generateDocAnomalyId("type_mismatch", anomalies.length),
				timestamp,
				entityType: "document",
				entityId: doc.id,
				metric: "type_match",
				expectedValue: 1,
				actualValue: 0,
				deviation: 1,
				severity: "medium",
				confidence: 0.85,
				reasoning: `Declared type "${doc.declaredType}" does not match detected type "${detectedType}"`,
				detectionMethod: "type_mismatch_check",
				context: {
					filename: doc.filename,
					declaredType: doc.declaredType,
					detectedType,
				},
			});
		}
	}

	const result: ClassificationResult = {
		documentId: doc.id,
		detectedType,
		detectedFormat: format,
		sunatType: sunatInfo?.type,
		confidence,
		completenessScore,
		missingFields,
		classificationMethod,
	};

	return { result, anomalies };
}

// ─── Batch classification ──────────────────────────────────────────

/**
 * Classify multiple documents in batch.
 * Returns per-document results and aggregated anomalies.
 */
export function classifyDocuments(
	documents: DocumentToClassify[],
	options?: DocumentClassificationOptions,
): { results: ClassificationResult[]; anomalies: Anomaly[] } {
	const allAnomalies: Anomaly[] = [];
	const results: ClassificationResult[] = [];

	for (const doc of documents) {
		const { result, anomalies } = classifyDocument(doc, options);
		results.push(result);
		allAnomalies.push(...anomalies);
	}

	return { results, anomalies: allAnomalies };
}

// ─── Strategy factory ──────────────────────────────────────────────

/**
 * Creates an AnomalyStrategy for document classification.
 */
export function createDocumentClassificationStrategy(
	options?: DocumentClassificationOptions,
): AnomalyStrategy {
	return {
		id: "document-classification",
		name: "Document Classification",
		description:
			"Classifies fiscal documents by type, format, and SUNAT series. " +
			"Detects: unclassifiable documents, missing required fields, type mismatches, unreadable content.",
		minSeverity: "low",

		execute(data: unknown): Anomaly[] {
			const documents = data as DocumentToClassify[];
			if (!Array.isArray(documents) || documents.length === 0) {
				return [];
			}

			const { anomalies } = classifyDocuments(documents, options);
			return anomalies;
		},
	};
}
