import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	classifyDocument,
	type DocumentClassificationOptions,
	type DocumentToClassify,
} from "../document-classification.strategy";

const long = (s: string) => `${s} ${"x".repeat(40)}`;

const docs: Record<string, DocumentToClassify> = {
	"xml + serie": {
		id: "d1",
		filename: "a.xml",
		serie: "F001",
		text: long("<xml>"),
	},
	"xml + UBL without serie": {
		id: "d2",
		filename: "a.xml",
		text: long("<UBL>"),
	},
	"xml plain": { id: "d3", filename: "a.xml", text: long("<root>") },
	"invoice complete": {
		id: "d4",
		filename: "f.pdf",
		text: "FACTURA ELECTRÓNICA RUC 20123456789 serie F001 correlativo 1 total 118 igv 18 SUBTOTAL",
	},
	"invoice incomplete (1 missing)": {
		id: "d5",
		text: "FACTURA RUC IGV TOTAL serie correlativo",
	},
	"invoice incomplete (3+ missing)": {
		id: "d6",
		text: "FACTURA ELECTRÓNICA de venta registrada en el sistema",
	},
	"bank statement": {
		id: "d7",
		text: "ESTADO DE CUENTA BANCO cuenta saldo movimientos del mes",
	},
	identity: {
		id: "d8",
		text: "DOCUMENTO NACIONAL DE IDENTIDAD DNI nombres apellidos documento",
	},
	"contract mismatch declared": {
		id: "d9",
		declaredType: "invoice",
		text: "CONTRATO CLAUSULA PARTES FIRMA fecha firmado entre las partes",
	},
	"declared matches": {
		id: "d10",
		declaredType: "receipt",
		text: "TICKET VOUCHER total fecha VUELTO CAJA gracias por su compra",
	},
	"unreadable short text": { id: "d11", text: "abc" },
	"empty text": { id: "d12", text: "" },
	"unknown long text": {
		id: "d13",
		filename: "x.png",
		text: "lorem ipsum dolor sit amet consectetur adipiscing elit",
	},
	"serie only (boleta)": {
		id: "d14",
		serie: "B001",
		text: "venta general de productos varios al cliente final hoy",
	},
	"declared but unknown": {
		id: "d15",
		declaredType: "invoice",
		text: "lorem ipsum dolor sit amet consectetur adipiscing",
	},
	"threshold-length text (20 chars)": {
		id: "d16",
		text: "12345678901234567890",
	},
	"21 chars": { id: "d17", text: "123456789012345678901" },
};

const optionSets: Record<string, DocumentClassificationOptions | undefined> = {
	defaults: undefined,
	"no content, no completeness": {
		classifyByContent: false,
		checkCompleteness: false,
	},
	"no format, no mismatch": { checkFormat: false, checkTypeMismatch: false },
	"high min confidence": { minConfidence: 0.99 },
};

describe("classifyDocument (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
	});
	afterEach(() => vi.useRealTimers());

	for (const [optName, opts] of Object.entries(optionSets)) {
		it(`pins results and anomalies for every document — ${optName}`, () => {
			const out = Object.fromEntries(
				Object.entries(docs).map(([n, d]) => [n, classifyDocument(d, opts)]),
			);
			expect(out).toMatchSnapshot();
		});
	}

	it("covers all four classification branches", () => {
		const methods = new Set(
			Object.values(docs).map(
				(d) => classifyDocument(d).result.classificationMethod,
			),
		);
		expect(methods.has("xml_format_with_sunat_type")).toBe(true);
		expect(methods.has("xml_format_with_ubl")).toBe(true);
		expect(methods.has("unreadable")).toBe(true);
		expect(methods.size).toBeGreaterThanOrEqual(5);
	});
});
