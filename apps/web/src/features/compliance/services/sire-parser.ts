/**
 * Reader for SIRE files (SUNAT proposal or replacement), as plain .txt or the
 * .zip downloaded from SUNAT Operaciones en Línea.
 *
 * Layouts follow the structures published by SUNAT at
 * https://cpe.sunat.gob.pe/estructura-de-archivos:
 * - RVIE (ventas): Anexo 3, RS 112-2021/SUNAT.
 * - RCE (compras): Anexo 11, RS 40-2022/SUNAT.
 * Fields are separated by "|"; amounts have up to 2 decimals and no thousands
 * separators; dates are DD/MM/AAAA. Field numbers below are 1-based, as in
 * the annexes.
 */
import { unzipSync } from "fflate";
import type { SireRecord } from "../types/sire.types";

export type SireKind = "RVIE" | "RCE";

export class SireParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SireParseError";
	}
}

interface Layout {
	minFields: number;
	/** Counterpart shown to the user (customer for RVIE, supplier for RCE). */
	counterpartName: number;
	/** RUC of the document issuer: the company itself in RVIE, the supplier in RCE. */
	issuerRuc: number;
	numero: number;
	base: readonly number[];
	igv: readonly number[];
	total: number;
	moneda: number;
}

const LAYOUTS: Record<SireKind, Layout> = {
	RVIE: {
		minFields: 27,
		issuerRuc: 1,
		counterpartName: 13,
		numero: 9,
		base: [15, 16], // BI gravada + descuento BI
		igv: [17, 18], // IGV/IPM + descuento IGV/IPM
		total: 26,
		moneda: 27,
	},
	RCE: {
		minFields: 26,
		issuerRuc: 13,
		counterpartName: 14,
		numero: 10,
		base: [15, 17, 19], // BI gravado DG, DGNG, DNG
		igv: [16, 18, 20], // IGV/IPM DG, DGNG, DNG
		total: 25,
		moneda: 26,
	},
};

const AMOUNT = /^-?\d{1,12}(\.\d{1,2})?$/;
const RUC = /^\d{11}$/;
const PERIOD = /^\d{4}(0[1-9]|1[0-2])$/;
const DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function fail(line: number, message: string): never {
	throw new SireParseError(`Archivo SIRE, línea ${line}: ${message}`);
}

function amountCents(raw: string, line: number, label: string): number {
	const value = raw.trim() === "" ? "0" : raw.trim();
	if (!AMOUNT.test(value)) fail(line, `importe inválido en ${label}: "${raw}"`);
	const [int = "0", dec = ""] = value.replace("-", "").split(".");
	const cents = Number(int) * 100 + Number(dec.padEnd(2, "0"));
	return value.startsWith("-") ? -cents : cents;
}

function isoDate(raw: string, line: number): string {
	const match = DATE.exec(raw.trim());
	if (!match) fail(line, `fecha de emisión inválida: "${raw}"`);
	const [, dd, mm, yyyy] = match;
	const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
	if (
		date.getUTCFullYear() !== Number(yyyy) ||
		date.getUTCMonth() !== Number(mm) - 1 ||
		date.getUTCDate() !== Number(dd)
	) {
		fail(line, `fecha de emisión inexistente: "${raw}"`);
	}
	return `${yyyy}-${mm}-${dd}`;
}

/** Header rows (column titles) start with a non-numeric first field. */
const isHeader = (line: string) => !/^\d/.test(line.trim());

function parseLine(raw: string, line: number, kind: SireKind): SireRecord {
	const layout = LAYOUTS[kind];
	const fields = raw.split("|");
	if (fields.length < layout.minFields) {
		fail(
			line,
			`se esperaban al menos ${layout.minFields} campos y hay ${fields.length}`,
		);
	}
	const at = (n: number) => (fields[n - 1] ?? "").trim();
	const sum = (ns: readonly number[], label: string) =>
		ns.reduce(
			(acc, n) => acc + amountCents(at(n), line, `${label} (campo ${n})`),
			0,
		);

	const generatorRuc = at(1);
	if (!RUC.test(generatorRuc)) fail(line, `RUC inválido: "${generatorRuc}"`);
	const periodo = at(3);
	if (!PERIOD.test(periodo)) fail(line, `periodo inválido: "${periodo}"`);

	return {
		periodo,
		caratula: kind,
		rucEmisor: at(layout.issuerRuc),
		razonSocial: at(layout.counterpartName),
		tipoComprobante: at(7),
		serie: at(8),
		numero: at(layout.numero),
		fechaEmision: isoDate(at(5), line),
		moneda: at(layout.moneda).toUpperCase(),
		baseImponible: sum(layout.base, "base imponible") / 100,
		igv: sum(layout.igv, "IGV") / 100,
		total:
			amountCents(at(layout.total), line, `total (campo ${layout.total})`) /
			100,
		// The layouts carry no status column: annulled documents appear with zero amounts.
		estado: "ACTIVO",
		origen: "SUNAT",
	};
}

export function parseSireText(text: string, kind: SireKind): SireRecord[] {
	const records: SireRecord[] = [];
	text.split(/\r?\n/).forEach((raw, index) => {
		if (raw.trim() === "" || isHeader(raw)) return;
		records.push(parseLine(raw, index + 1, kind));
	});
	return records;
}

/**
 * Detects the register from the header row (RCE has an "Año" column in
 * position 9) or from the file name. Returns null rather than guessing.
 */
export function detectSireKind(
	fileName: string,
	firstLine: string,
): SireKind | null {
	if (isHeader(firstLine)) {
		const ninth = (firstLine.split("|")[8] ?? "").trim().toLowerCase();
		return ninth === "año" || ninth === "ano" ? "RCE" : "RVIE";
	}
	const name = fileName.toUpperCase();
	if (/RCE/.test(name)) return "RCE";
	if (/RVIE/.test(name)) return "RVIE";
	// PLE-style names: LE + RUC + AAAAMM + 00 + libro 140400 (ventas) / 080400 (compras).
	if (/^LE\d{11}\d{6}\d{2}140\d{3}/.test(name)) return "RVIE";
	if (/^LE\d{11}\d{6}\d{2}080\d{3}/.test(name)) return "RCE";
	return null;
}

/** SUNAT files are usually UTF-8, but older exports use Latin-1. */
function decode(bytes: Uint8Array): string {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return new TextDecoder("windows-1252").decode(bytes);
	}
}

const isZip = (bytes: Uint8Array) => bytes[0] === 0x50 && bytes[1] === 0x4b;

function parseEntry(name: string, bytes: Uint8Array): SireRecord[] {
	const text = decode(bytes);
	const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
	const kind = detectSireKind(name, firstLine);
	if (!kind) {
		throw new SireParseError(
			`No se pudo identificar si "${name}" es un registro RVIE o RCE. Usa el archivo descargado de SUNAT (con su fila de títulos) o su nombre original.`,
		);
	}
	return parseSireText(text, kind);
}

async function readBytes(file: File): Promise<Uint8Array> {
	if (typeof file.arrayBuffer === "function") {
		return new Uint8Array(await file.arrayBuffer());
	}
	return new Uint8Array(await new Response(file).arrayBuffer());
}

export async function parseSireFile(file: File): Promise<SireRecord[]> {
	const bytes = await readBytes(file);
	if (!isZip(bytes)) return parseEntry(file.name, bytes);

	const entries = Object.entries(unzipSync(bytes)).filter(([name]) =>
		name.toLowerCase().endsWith(".txt"),
	);
	if (entries.length === 0) {
		throw new SireParseError("El .zip no contiene archivos .txt de SIRE.");
	}
	return entries.flatMap(([name, content]) => parseEntry(name, content));
}
