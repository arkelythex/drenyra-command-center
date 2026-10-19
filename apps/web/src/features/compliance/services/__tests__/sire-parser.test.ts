import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
	detectSireKind,
	parseSireFile,
	parseSireText,
	SireParseError,
} from "../sire-parser";

/**
 * Lines follow the official layouts published by SUNAT (cpe.sunat.gob.pe,
 * "Estructura de archivos"): RVIE = Anexo 3 of RS 112-2021/SUNAT,
 * RCE = Anexo 11 of RS 40-2022/SUNAT. Fields are separated by "|".
 */
const RVIE_FIELDS = (o: Partial<Record<number, string>> = {}): string => {
	const f: Record<number, string> = {
		1: "20100000001",
		2: "MI EMPRESA S.A.C.",
		3: "202501",
		4: "",
		5: "10/01/2025",
		6: "",
		7: "01",
		8: "F001",
		9: "00001234",
		10: "",
		11: "6",
		12: "20200000002",
		13: "CLIENTE B S.A.",
		14: "0.00",
		15: "1000.00",
		16: "0.00",
		17: "180.00",
		18: "0.00",
		19: "0.00",
		20: "0.00",
		21: "0.00",
		22: "0.00",
		23: "0.00",
		24: "0.00",
		25: "0.00",
		26: "1180.00",
		27: "PEN",
		28: "",
		29: "",
		30: "",
		31: "",
		32: "",
		33: "",
		...o,
	};
	return Array.from({ length: 33 }, (_, i) => f[i + 1] ?? "").join("|");
};

const RCE_FIELDS = (o: Partial<Record<number, string>> = {}): string => {
	const f: Record<number, string> = {
		1: "20100000001",
		2: "MI EMPRESA S.A.C.",
		3: "202501",
		4: "",
		5: "15/01/2025",
		6: "",
		7: "01",
		8: "F001",
		9: "",
		10: "00000567",
		11: "",
		12: "6",
		13: "20300000003",
		14: "PROVEEDOR C S.A.",
		15: "500.00",
		16: "90.00",
		17: "100.00",
		18: "18.00",
		19: "0.00",
		20: "0.00",
		21: "0.00",
		22: "0.00",
		23: "0.00",
		24: "0.00",
		25: "708.00",
		26: "PEN",
		27: "",
		...o,
	};
	return Array.from({ length: 41 }, (_, i) => f[i + 1] ?? "").join("|");
};

const RVIE_HEADER =
	"RUC|Apellidos y Nombres o Razón social|Periodo|CAR SUNAT|Fecha de emisión|Fecha Vcto/Pago|Tipo CP/Doc.|Serie del CDP|Nro CP o Doc. Nro Inicial (Rango)|Nro Final (Rango)";
const RCE_HEADER =
	"RUC|Apellidos y Nombres o Razón social|Periodo|CAR SUNAT|Fecha de emisión|Fecha Vcto/Pago|Tipo CP/Doc.|Serie del CDP|Año|Nro CP o Doc. Nro Inicial (Rango)";

describe("parseSireText — RVIE (ventas)", () => {
	it("maps the official RVIE columns", () => {
		const [record] = parseSireText(RVIE_FIELDS(), "RVIE");
		expect(record).toEqual({
			periodo: "202501",
			caratula: "RVIE",
			rucEmisor: "20100000001",
			razonSocial: "CLIENTE B S.A.",
			tipoComprobante: "01",
			serie: "F001",
			numero: "00001234",
			fechaEmision: "2025-01-10",
			moneda: "PEN",
			baseImponible: 1000,
			igv: 180,
			total: 1180,
			estado: "ACTIVO",
			origen: "SUNAT",
		});
	});

	it("nets discounts into the taxable base and IGV", () => {
		const [record] = parseSireText(
			RVIE_FIELDS({
				15: "1000.00",
				16: "-100.00",
				17: "180.00",
				18: "-18.00",
				26: "1062.00",
			}),
			"RVIE",
		);
		expect(record).toMatchObject({ baseImponible: 900, igv: 162, total: 1062 });
	});

	it("keeps negative amounts of credit notes", () => {
		const [record] = parseSireText(
			RVIE_FIELDS({
				7: "07",
				8: "FC01",
				15: "-100.00",
				17: "-18.00",
				26: "-118.00",
			}),
			"RVIE",
		);
		expect(record).toMatchObject({
			tipoComprobante: "07",
			total: -118,
			igv: -18,
		});
	});
});

describe("parseSireText — RCE (compras)", () => {
	it("maps the official RCE columns and sums the three IGV buckets", () => {
		const [record] = parseSireText(RCE_FIELDS(), "RCE");
		expect(record).toEqual({
			periodo: "202501",
			caratula: "RCE",
			rucEmisor: "20300000003",
			razonSocial: "PROVEEDOR C S.A.",
			tipoComprobante: "01",
			serie: "F001",
			numero: "00000567",
			fechaEmision: "2025-01-15",
			moneda: "PEN",
			baseImponible: 600,
			igv: 108,
			total: 708,
			estado: "ACTIVO",
			origen: "SUNAT",
		});
	});
});

describe("parseSireText — file hygiene", () => {
	it("skips header rows, blank lines and handles CRLF", () => {
		const text = [
			RVIE_HEADER,
			RVIE_FIELDS(),
			"",
			RVIE_FIELDS({ 9: "00001235" }),
			"",
		].join("\r\n");
		expect(parseSireText(text, "RVIE").map((r) => r.numero)).toEqual([
			"00001234",
			"00001235",
		]);
	});

	it("tolerates a trailing pipe at the end of each line", () => {
		expect(parseSireText(`${RVIE_FIELDS()}|`, "RVIE")).toHaveLength(1);
	});

	it("reports the line number of a malformed amount", () => {
		const text = [
			RVIE_HEADER,
			RVIE_FIELDS(),
			RVIE_FIELDS({ 26: "1,180.00" }),
		].join("\n");
		expect(() => parseSireText(text, "RVIE")).toThrow(/línea 3/);
		expect(() => parseSireText(text, "RVIE")).toThrow(SireParseError);
	});

	it("rejects a row with too few columns", () => {
		expect(() => parseSireText("20100000001|X|202501", "RVIE")).toThrow(
			/línea 1/,
		);
	});

	it("rejects an invalid RUC or period", () => {
		expect(() => parseSireText(RVIE_FIELDS({ 1: "123" }), "RVIE")).toThrow(
			SireParseError,
		);
		expect(() => parseSireText(RVIE_FIELDS({ 3: "202513" }), "RVIE")).toThrow(
			SireParseError,
		);
	});

	it("rejects an invalid issue date", () => {
		expect(() =>
			parseSireText(RVIE_FIELDS({ 5: "2025-01-10" }), "RVIE"),
		).toThrow(SireParseError);
		expect(() =>
			parseSireText(RVIE_FIELDS({ 5: "31/02/2025" }), "RVIE"),
		).toThrow(SireParseError);
	});
});

describe("detectSireKind", () => {
	it("uses the header when present", () => {
		expect(detectSireKind("propuesta.txt", RCE_HEADER)).toBe("RCE");
		expect(detectSireKind("propuesta.txt", RVIE_HEADER)).toBe("RVIE");
	});

	it("falls back to the file name", () => {
		expect(detectSireKind("20100000001-RCE-202501-1.txt", RCE_FIELDS())).toBe(
			"RCE",
		);
		expect(
			detectSireKind("LE2010000000120250100140400.txt", RVIE_FIELDS()),
		).toBe("RVIE");
		expect(detectSireKind("20100000001-RVIE-202501.txt", RVIE_FIELDS())).toBe(
			"RVIE",
		);
	});

	it("refuses to guess when neither header nor name tells", () => {
		expect(detectSireKind("datos.txt", RVIE_FIELDS())).toBeNull();
	});
});

describe("parseSireFile", () => {
	it("reads a plain .txt file", async () => {
		const file = new File(
			[[RVIE_HEADER, RVIE_FIELDS()].join("\n")],
			"propuesta.txt",
		);
		expect(await parseSireFile(file)).toHaveLength(1);
	});

	it("reads every .txt inside a .zip downloaded from SUNAT", async () => {
		const enc = new TextEncoder();
		const zip = zipSync({
			"a.txt": enc.encode([RCE_HEADER, RCE_FIELDS()].join("\n")),
			"b.txt": enc.encode(
				[RCE_HEADER, RCE_FIELDS({ 10: "00000568" })].join("\n"),
			),
			"leeme.pdf": new Uint8Array([1, 2, 3]),
		});
		const file = new File([zip], "propuesta-rce.zip");
		const records = await parseSireFile(file);
		expect(records.map((r) => r.numero).sort()).toEqual([
			"00000567",
			"00000568",
		]);
	});

	it("decodes Latin-1 files without mangling accents", async () => {
		const line = RVIE_FIELDS({ 13: "CAMPAÑA S.A." });
		const bytes = Uint8Array.from(
			[...`${RVIE_HEADER}\n${line}`].map((c) => c.charCodeAt(0)),
		);
		const [record] = await parseSireFile(new File([bytes], "propuesta.txt"));
		expect(record?.razonSocial).toBe("CAMPAÑA S.A.");
	});

	it("asks for the register type when it cannot be detected", async () => {
		const file = new File([RVIE_FIELDS()], "datos.txt");
		await expect(parseSireFile(file)).rejects.toThrow(/RVIE o RCE/);
	});
});
