/**
 * Bank statement import — pure planning, in integer cents.
 *
 * A statement is what the bank says happened, so it is recorded as is: no
 * "insufficient balance" check (a fee can be the first movement of a new
 * account). Rows already stored for the account are skipped, so importing
 * the same statement twice adds nothing; a movement that genuinely repeats
 * (two equal fees on one day) is kept as many times as it appears.
 */

export type StatementDirection = "CREDIT" | "DEBIT";

export interface StatementRow {
	/** Booking date, YYYY-MM-DD. */
	date: string;
	description: string;
	reference?: string | null;
	type: StatementDirection;
	/** Positive whole cents; the direction is in `type`. */
	amountCents: number;
}

export interface PlannedRow extends StatementRow {
	/** Running account balance after this row, in cents. */
	balanceCents: number;
}

export interface StatementImportPlan {
	rows: PlannedRow[];
	skipped: number;
	closingBalanceCents: number;
}

const DECIMAL = /^(-?)(\d{1,15})(?:\.(\d{1,4}))?$/;

/** A numeric(19,4) value as integer cents; refuses fractions of a cent. */
export function decimalToCents(raw: string): number {
	const match = DECIMAL.exec(raw.trim());
	if (!match) throw new Error(`monto inválido: "${raw}"`);
	const [, sign, units = "0", decimals = ""] = match;
	const padded = decimals.padEnd(4, "0");
	if (padded.slice(2) !== "00") {
		throw new Error(`monto con fracción de céntimo: "${raw}"`);
	}
	const cents = Number(units) * 100 + Number(padded.slice(0, 2));
	return sign === "-" ? -cents : cents;
}

/** Integer cents as a decimal string for numeric columns ("1180.10"). */
export function centsToDecimal(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	const abs = Math.abs(cents);
	const units = Math.trunc(abs / 100);
	const rest = String(abs % 100).padStart(2, "0");
	return `${sign}${units}.${rest}`;
}

function assertWholeCents(row: StatementRow): void {
	if (!Number.isSafeInteger(row.amountCents) || row.amountCents <= 0) {
		throw new Error(
			`el monto debe ser un entero positivo de céntimos: ${row.amountCents}`,
		);
	}
}

function movementKey(row: StatementRow): string {
	return [
		row.date,
		row.type,
		row.amountCents,
		(row.reference ?? "").trim(),
		row.description.trim(),
	].join("|");
}

/**
 * Decide which statement rows to insert and the balance after each.
 *
 * @param openingBalanceCents the account balance before this import
 * @param stored movements already recorded for the account
 * @param statement the rows to import, in statement order
 */
export function planStatementImport(
	openingBalanceCents: number,
	stored: readonly StatementRow[],
	statement: readonly StatementRow[],
): StatementImportPlan {
	for (const row of statement) assertWholeCents(row);

	const alreadyStored = new Map<string, number>();
	for (const row of stored) {
		const key = movementKey(row);
		alreadyStored.set(key, (alreadyStored.get(key) ?? 0) + 1);
	}

	const rows: PlannedRow[] = [];
	let skipped = 0;
	let balance = openingBalanceCents;
	for (const row of statement) {
		const key = movementKey(row);
		const remaining = alreadyStored.get(key) ?? 0;
		if (remaining > 0) {
			alreadyStored.set(key, remaining - 1);
			skipped += 1;
			continue;
		}
		balance += row.type === "CREDIT" ? row.amountCents : -row.amountCents;
		rows.push({ ...row, balanceCents: balance });
	}

	return { rows, skipped, closingBalanceCents: balance };
}
