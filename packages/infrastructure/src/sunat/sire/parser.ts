import { type SireRecord, type SireRegisterType } from "./types";

function parseDate(dateStr: string): Date {
	if (!dateStr) return new Date();

	const parts = dateStr.split("/");
	if (parts.length !== 3) return new Date();

	const day = parseInt(parts[0] || "1", 10);
	const month = parseInt(parts[1] || "1", 10) - 1;
	const year = parseInt(parts[2] || "2025", 10);

	return new Date(year, month, day);
}

export function parseRecords(
	content: Buffer,
	_tipo: SireRegisterType,
): SireRecord[] {
	const records: SireRecord[] = [];

	try {
		const text = content.toString("utf-8");
		const lines = text.split("\n").filter((line) => line.trim());

		for (const line of lines) {
			const fields = line.split("|");

			if (fields.length < 15) continue;

			const record: SireRecord = {
				periodo: fields[0] || "",
				correlativo: fields[1] || "",
				fechaEmision: parseDate(fields[2] || ""),
				tipoComprobante: fields[3] || "",
				serie: fields[4] || "",
				numero: fields[5] || "",
				tipoDocIdentidad: fields[6] || "",
				numeroDocIdentidad: fields[7] || "",
				razonSocial: fields[8] || "",
				baseImponible: parseFloat(fields[9] || "0"),
				igv: parseFloat(fields[10] || "0"),
				total: parseFloat(fields[11] || "0"),
				moneda: (fields[12] || "PEN") as import("@drenyra/domain").Currency,
				tipoCambio: fields[13] ? parseFloat(fields[13]) : undefined,
				estado: fields[14],
			};

			records.push(record);
		}
	} catch (error) {
		console.error("Error parsing SIRE records:", error);
	}

	return records;
}
