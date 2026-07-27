import type { PleBookType, PleValidationResult } from "../../domain/ple.types";

export function validateStructural(
	content: string,
	bookType: PleBookType,
): PleValidationResult {
	const errors: Array<{ field: string; message: string; line?: number }> = [];

	if (!content || content.trim().length === 0) {
		return { valid: false, errors: [{ field: "content", message: "PLE content is empty" }] };
	}

	const lines = content.split("\n").filter((l) => l.trim().length > 0);
	if (lines.length === 0) {
		return { valid: false, errors: [{ field: "content", message: "PLE content has no data lines" }] };
	}

	const dataLines = lines.filter((l) => !l.startsWith("|") && !l.startsWith("TOTAL"));
	const expectedFields = getExpectedFieldCount(bookType);

	for (let i = 0; i < dataLines.length; i++) {
		const fields = dataLines[i].split("|");

		if (fields.length !== expectedFields) {
			errors.push({
				field: "record",
				message: `Line ${i + 1}: expected ${expectedFields} fields, got ${fields.length}`,
				line: i + 1,
			});
		}

		// Check required fields (position-based: period, fiscalYear, ruc)
		const requiredFields = [0, 1, 2]; // period, year, ruc
		for (const idx of requiredFields) {
			if (fields[idx]?.trim().length === 0) {
				errors.push({
					field: `field_${idx + 1}`,
					message: `Line ${i + 1}, required field ${idx + 1} is empty`,
					line: i + 1,
				});
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

export function validateAccounting(
	content: string,
	bookType: PleBookType,
): PleValidationResult {
	const errors: Array<{ field: string; message: string; line?: number }> = [];

	if (bookType !== "LE-DIARIO") {
		return { valid: true, errors: [] };
	}

	const lines = content.split("\n").filter((l) => l.trim().length > 0);
	const dataLines = lines.filter((l) => !l.startsWith("|") && !l.startsWith("TOTAL"));

	for (let i = 0; i < dataLines.length; i++) {
		const fields = dataLines[i].split("|");
		if (fields.length >= 12) {
			const debit = parseInt(fields[10]?.replace(/\D/g, "") || "0", 10);
			const credit = parseInt(fields[11]?.replace(/\D/g, "") || "0", 10);
			if (debit > 0 && credit > 0) {
				errors.push({
					field: "debit_credit",
					message: `Line ${i + 1}: both debit (${debit}) and credit (${credit}) cannot be positive`,
					line: i + 1,
				});
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

function getExpectedFieldCount(bookType: PleBookType): number {
	switch (bookType) {
		case "LE-DIARIO": return 21;
		case "LE-MAYOR": return 12;
		case "LE-COMPRAS": return 23;
		case "LE-VENTAS": return 22;
	}
}
