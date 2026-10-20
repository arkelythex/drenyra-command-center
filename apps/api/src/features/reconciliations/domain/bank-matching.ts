/**
 * Proposes which open invoice (money in) or bill (money out) a bank movement
 * pays. Pure and DB-free; amounts are integer cents.
 *
 * Score: exact open amount 60 (required), document number found in the
 * reference or description +30, date within 3 days of issue/due +10
 * (within 15 days +5).
 */

export type BankDirection = "DEBIT" | "CREDIT";

export interface BankMovement {
	id: string;
	description: string;
	reference: string | null;
	/** `YYYY-MM-DD` */
	transactionDate: string;
	/** Signed: positive = money in. */
	amountCents: number;
}

export interface OpenDocument {
	kind: "INVOICE" | "BILL";
	id: string;
	/** `SERIE-NUMERO` */
	number: string;
	partnerName: string;
	/** `YYYY-MM-DD` */
	issueDate: string;
	/** `YYYY-MM-DD` */
	dueDate: string;
	/** Amount still open, positive cents. */
	openCents: number;
}

export interface MatchProposal {
	documentId: string;
	kind: OpenDocument["kind"];
	number: string;
	partnerName: string;
	amountCents: number;
	score: number;
	reasons: string[];
	/** Days to the closer of issue or due date. */
	dayDistance: number;
}

const MAX_PROPOSALS = 5;
const DECIMAL = /^(-?)(\d{1,15})(?:\.(\d{1,4}))?$/;
const DAY_MS = 86_400_000;

/** DB decimal (scale ≤ 4) → signed integer cents; sub-cent values are rejected, not rounded. */
export function bankAmountToCents(raw: string, type: BankDirection): number {
	const match = DECIMAL.exec(raw.trim());
	if (!match) throw new Error(`monto bancario inválido: "${raw}"`);
	const [, , units, decimals = ""] = match;
	const padded = decimals.padEnd(4, "0");
	if (padded.slice(2) !== "00") {
		throw new Error(`monto bancario con fracción de céntimo: "${raw}"`);
	}
	const magnitude = Number(units) * 100 + Number(padded.slice(0, 2));
	return type === "DEBIT" ? -magnitude : magnitude;
}

function formatSoles(cents: number): string {
	const abs = Math.abs(cents);
	return `S/ ${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when `F001-1234` appears as e.g. "F001-1234", "F001 00001234" or "F0011234". */
function mentionsNumber(haystack: string, number: string): boolean {
	const separator = number.indexOf("-");
	if (separator < 0) return false;
	const series = number.slice(0, separator).trim().toUpperCase();
	const correlative = number.slice(separator + 1).replace(/^0+/, "");
	if (!series || !correlative) return false;
	const pattern = new RegExp(
		`(^|[^A-Z0-9])${escapeRegex(series)}[\\s\\-_/]*0*${escapeRegex(correlative)}(?!\\d)`,
	);
	return pattern.test(haystack.toUpperCase());
}

function daysBetween(a: string, b: string): number {
	return Math.round(Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS);
}

function scoreDocument(
	movement: BankMovement,
	doc: OpenDocument,
): MatchProposal | null {
	const wantsKind = movement.amountCents > 0 ? "INVOICE" : "BILL";
	if (doc.kind !== wantsKind) return null;
	if (Math.abs(movement.amountCents) !== doc.openCents) return null;

	let score = 60;
	const reasons = [`Monto exacto: ${formatSoles(doc.openCents)}`];

	const haystack = `${movement.reference ?? ""} ${movement.description}`;
	if (mentionsNumber(haystack, doc.number)) {
		score += 30;
		reasons.push(`La referencia menciona ${doc.number}`);
	}

	const toDue = daysBetween(movement.transactionDate, doc.dueDate);
	const toIssue = daysBetween(movement.transactionDate, doc.issueDate);
	const dayDistance = Math.min(toDue, toIssue);
	const label = toDue <= toIssue ? "del vencimiento" : "de la emisión";
	if (dayDistance <= 3) {
		score += 10;
		reasons.push(`Fecha a ${dayDistance} días ${label}`);
	} else if (dayDistance <= 15) {
		score += 5;
		reasons.push(`Fecha a ${dayDistance} días ${label}`);
	}

	return {
		documentId: doc.id,
		kind: doc.kind,
		number: doc.number,
		partnerName: doc.partnerName,
		amountCents: doc.openCents,
		score,
		reasons,
		dayDistance,
	};
}

/** Best candidates first (score, then date closeness), at most five. */
export function rankMatches(
	movement: BankMovement,
	documents: readonly OpenDocument[],
): MatchProposal[] {
	return documents
		.map((doc) => scoreDocument(movement, doc))
		.filter((proposal): proposal is MatchProposal => proposal !== null)
		.sort((a, b) => b.score - a.score || a.dayDistance - b.dayDistance)
		.slice(0, MAX_PROPOSALS);
}
