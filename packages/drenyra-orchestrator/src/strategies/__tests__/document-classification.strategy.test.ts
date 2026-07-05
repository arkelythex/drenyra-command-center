import { describe, expect, it } from "vitest";
import {
	classifyDocument,
	classifyDocuments,
	createDocumentClassificationStrategy,
	DOCUMENT_TYPE_KEYWORDS,
	MIN_UNREADABLE_CHARS,
} from "../document-classification.strategy";

// ─── Test helpers ──────────────────────────────────────────────────

function makeDoc(
	overrides: Partial<{
		id: string;
		filename: string;
		text: string;
		declaredType: string;
		serie: string;
	}> = {},
) {
	return {
		id: overrides.id ?? "doc-1",
		filename: overrides.filename,
		text: overrides.text ?? "",
		declaredType: overrides.declaredType as any,
		serie: overrides.serie,
	};
}

// ─── Format detection ──────────────────────────────────────────────

describe("DocumentClassification — format detection", () => {
	it("should detect IMAGE from common image extensions", () => {
		for (const ext of ["png", "jpg", "jpeg", "tiff", "bmp", "webp"]) {
			const { result } = classifyDocument(makeDoc({ filename: `doc.${ext}` }));
			expect(result.detectedFormat).toBe("IMAGE");
		}
	});

	it("should detect XML format", () => {
		const { result } = classifyDocument(makeDoc({ filename: "invoice.xml" }));
		expect(result.detectedFormat).toBe("XML");
	});

	it("should detect PDF format", () => {
		const { result } = classifyDocument(makeDoc({ filename: "statement.pdf" }));
		expect(result.detectedFormat).toBe("PDF");
	});

	it("should return UNKNOWN for no filename", () => {
		const { result } = classifyDocument(makeDoc({}));
		expect(result.detectedFormat).toBe("UNKNOWN");
	});

	it("should return UNKNOWN for unknown extension", () => {
		const { result } = classifyDocument(makeDoc({ filename: "data.csv" }));
		expect(result.detectedFormat).toBe("UNKNOWN");
	});
});

// ─── SUNAT series detection ────────────────────────────────────────

describe("DocumentClassification — SUNAT series detection", () => {
	it("should detect FACTURA from F-series", () => {
		const { result } = classifyDocument(
			makeDoc({ serie: "F001", text: "some content" }),
		);
		expect(result.sunatType).toBe("FACTURA");
	});

	it("should detect BOLETA from B-series", () => {
		const { result } = classifyDocument(makeDoc({ serie: "B001-123" }));
		expect(result.sunatType).toBe("BOLETA");
	});

	it("should detect NOTA_CREDITO from E-series", () => {
		const { result } = classifyDocument(makeDoc({ serie: "E001" }));
		expect(result.sunatType).toBe("NOTA_CREDITO_FACTURA");
	});

	it("should fallback to text content without a serie", () => {
		const { result } = classifyDocument(
			makeDoc({ text: "FACTURA ELECTRÓNICA RUC 20123456789" }),
		);
		expect(result.sunatType).toBe("FACTURA");
	});
});

// ─── Content-based classification ──────────────────────────────────

describe("DocumentClassification — content classification", () => {
	it("should classify as invoice with invoice keywords", () => {
		const { result } = classifyDocument(
			makeDoc({
				text: "FACTURA ELECTRÓNICA\nRUC: 20123456789\nSUBTOTAL: 1000\nIGV: 180\nTOTAL: 1180",
			}),
		);
		expect(result.detectedType).toBe("invoice");
		expect(result.confidence).toBeGreaterThanOrEqual(0.5);
	});

	it("should classify as bank_statement with bank keywords", () => {
		const text =
			"EXTRACTO BANCARIO\nBANCO DE CRÉDITO\nCUENTA: 191-1234567\nSALDO: 50000";
		const { result } = classifyDocument(makeDoc({ text }));
		expect(result.detectedType).toBe("bank_statement");
		expect(result.confidence).toBeGreaterThan(0);
	});

	it("should classify as receipt with receipt keywords", () => {
		const text =
			"TICKET DE VENTA\nCAJA: 001\nGRACIAS POR SU COMPRA\nVUELTO: S/ 20.00";
		const { result } = classifyDocument(makeDoc({ text }));
		expect(result.detectedType).toBe("receipt");
	});

	it("should classify as identity with DNI keywords", () => {
		const text =
			"DOCUMENTO NACIONAL DE IDENTIDAD\nNOMBRE: JUAN\nAPELLIDOS: PEREZ\nLUGAR DE NACIMIENTO: LIMA";
		const { result } = classifyDocument(makeDoc({ text }));
		expect(result.detectedType).toBe("identity");
	});

	it("should classify as contract with contract keywords", () => {
		const text =
			"CONTRATO DE SERVICIOS\nCLAUSULA PRIMERA: OBJETO\nPARTES: EMPRESA Y PROVEEDOR\n";
		const { result } = classifyDocument(makeDoc({ text }));
		expect(result.detectedType).toBe("contract");
	});

	it("should return unknown for empty text", () => {
		const { result } = classifyDocument(makeDoc({ text: "" }));
		expect(result.detectedType).toBe("unknown");
		expect(result.confidence).toBe(0);
	});

	it("should classify XML with UBL as sunat_xml", () => {
		const { result } = classifyDocument(
			makeDoc({
				filename: "invoice.xml",
				text: "UBL 2.1 SUNAT Invoice cbc:InvoiceIssueDate",
			}),
		);
		expect(result.detectedType).toBe("sunat_xml");
		expect(result.confidence).toBeGreaterThan(0.8);
	});

	it("should classify XML with serie as sunat_xml", () => {
		const { result } = classifyDocument(
			makeDoc({
				filename: "204123.xml",
				serie: "F001",
				text: "some xml content here",
			}),
		);
		// Even without UBL in text, serie + XML format should classify
		expect(result.detectedType).toBe("sunat_xml");
	});
});

// ─── Anomaly detection ─────────────────────────────────────────────

describe("DocumentClassification — anomalies", () => {
	it("should detect unreadable document with short text", () => {
		const { anomalies } = classifyDocument(
			makeDoc({
				text: "short",
			}),
		);
		const unreadable = anomalies.find((a) => a.metric === "text_length");
		expect(unreadable).toBeDefined();
		expect(unreadable!.severity).toBe("medium");
	});

	it("should detect not_classified for text with no keyword matches", () => {
		const { anomalies } = classifyDocument(
			makeDoc({
				text: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt",
			}),
		);
		const notClassified = anomalies.find(
			(a) => a.metric === "classification_confidence",
		);
		expect(notClassified).toBeDefined();
		expect(notClassified!.severity).toBe("high");
	});

	it("should detect type mismatch when declared type differs", () => {
		const { anomalies } = classifyDocument(
			makeDoc({
				text: "FACTURA ELECTRÓNICA\nRUC: 20123456789\nSUBTOTAL: 1000\nIGV: 180\nTOTAL: 1180",
				declaredType: "receipt",
			}),
		);
		const mismatch = anomalies.find((a) => a.metric === "type_match");
		expect(mismatch).toBeDefined();
		expect(mismatch!.severity).toBe("medium");
	});

	it("should detect missing fields for incomplete invoice", () => {
		const { result, anomalies } = classifyDocument(
			makeDoc({
				text: "FACTURA\nRUC: 20123456789\n",
			}),
		);
		expect(result.detectedType).toBe("invoice");
		const missingAnomaly = anomalies.find(
			(a) => a.metric === "completeness_score",
		);
		expect(missingAnomaly).toBeDefined();
		expect(result.missingFields.length).toBeGreaterThan(0);
	});

	it("should NOT emit type mismatch when types agree", () => {
		const { anomalies } = classifyDocument(
			makeDoc({
				text: "FACTURA ELECTRÓNICA\nRUC: 20123456789\nSUBTOTAL: 1000\nIGV: 180\nTOTAL: 1180",
				declaredType: "invoice",
			}),
		);
		const mismatch = anomalies.find((a) => a.metric === "type_match");
		expect(mismatch).toBeUndefined();
	});
});

// ─── Batch classification ──────────────────────────────────────────

describe("DocumentClassification — batch", () => {
	it("should classify multiple documents", () => {
		const docs = [
			makeDoc({
				id: "doc-1",
				text: "FACTURA\nRUC: 20123456789\nIGV: 180\nTOTAL: 1180",
			}),
			makeDoc({
				id: "doc-2",
				text: "EXTRACTO BANCARIO\nBANCO: BCP\nSALDO: 50000",
			}),
			makeDoc({
				id: "doc-3",
				text: "CONTRATO DE ARRENDAMIENTO\nCLAUSULA PRIMERA",
			}),
		];
		const { results, anomalies } = classifyDocuments(docs);
		expect(results).toHaveLength(3);
		expect(results[0].detectedType).toBe("invoice");
		expect(results[1].detectedType).toBe("bank_statement");
		expect(results[2].detectedType).toBe("contract");
		expect(anomalies.length).toBeGreaterThanOrEqual(0);
	});

	it("should handle empty document array", () => {
		const { results, anomalies } = classifyDocuments([]);
		expect(results).toHaveLength(0);
		expect(anomalies).toHaveLength(0);
	});
});

// ─── Strategy factory ──────────────────────────────────────────────

describe("DocumentClassification — strategy factory", () => {
	it("should return an AnomalyStrategy with correct id", () => {
		const strategy = createDocumentClassificationStrategy();
		expect(strategy.id).toBe("document-classification");
		expect(strategy.name).toBe("Document Classification");
		expect(strategy.minSeverity).toBe("low");
	});

	it("should return empty anomalies for empty data", async () => {
		const strategy = createDocumentClassificationStrategy();
		const anomalies = await strategy.execute([], {} as any);
		expect(anomalies).toHaveLength(0);
	});

	it("should detect anomalies via strategy.execute()", async () => {
		const strategy = createDocumentClassificationStrategy();
		const docs = [
			{
				id: "bad-doc",
				text: "unclassified gibberish text with no fiscal keywords here at all",
			},
		];
		const anomalies = await strategy.execute(docs, {} as any);
		const notClassified = anomalies.find(
			(a) => a.metric === "classification_confidence",
		);
		expect(notClassified).toBeDefined();
	});
});

// ─── Constants ─────────────────────────────────────────────────────

describe("DocumentClassification — constants", () => {
	it("should have keyword patterns defined for all types except unknown", () => {
		const definedTypes = Object.keys(DOCUMENT_TYPE_KEYWORDS).filter(
			(t) => t !== "unknown",
		);
		expect(definedTypes.length).toBeGreaterThanOrEqual(5);
		for (const type of definedTypes) {
			expect(
				DOCUMENT_TYPE_KEYWORDS[type as keyof typeof DOCUMENT_TYPE_KEYWORDS]
					.length,
			).toBeGreaterThan(0);
		}
	});

	it("should have MIN_UNREADABLE_CHARS defined", () => {
		expect(MIN_UNREADABLE_CHARS).toBeGreaterThan(0);
	});
});
