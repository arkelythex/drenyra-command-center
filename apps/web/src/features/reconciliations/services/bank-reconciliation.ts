import { api } from "@/lib/api-client";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import type {
	ReconciliationCandidate,
	ReconciliationTransaction,
} from "../reconciliation.types";

/** Row of `GET /api/reconciliations/pending|reconciled` (DB decimal as string). */
export interface BankTransactionDto {
	id: string;
	/** Eden Treaty turns ISO date strings into `Date`; accept both. */
	transactionDate: string | Date;
	description: string;
	reference: string | null;
	type: string;
	amount: string;
	isReconciled: boolean | null;
}

/** Body of `GET /api/reconciliations/:id/matches`. */
export interface MatchesDto {
	transactionId: string;
	amountCents: number;
	confidence: number;
	matches: Array<{
		documentId: string;
		kind: "INVOICE" | "BILL";
		number: string;
		partnerName: string;
		amountCents: number;
		score: number;
		reasons: string[];
		dayDistance: number;
	}>;
}

const DECIMAL = /^(-?)(\d{1,15})(?:\.(\d{1,4}))?$/;
const MONTHS = [
	"ENE",
	"FEB",
	"MAR",
	"ABR",
	"MAY",
	"JUN",
	"JUL",
	"AGO",
	"SET",
	"OCT",
	"NOV",
	"DIC",
];
const SUGGESTED_SCORE = 90;

/** API decimal (scale ≤ 4) → signed integer cents; positive = money in. */
export function bankAmountCents(raw: string, type: string): number {
	const match = DECIMAL.exec(String(raw).trim());
	if (!match) throw new Error(`Monto bancario inválido: "${raw}"`);
	const [, , units, decimals = ""] = match;
	const padded = decimals.padEnd(4, "0");
	if (padded.slice(2) !== "00") {
		throw new Error(`Monto bancario con fracción de céntimo: "${raw}"`);
	}
	const magnitude = Number(units) * 100 + Number(padded.slice(0, 2));
	return type === "DEBIT" ? -magnitude : magnitude;
}

function isoDay(value: string | Date): string {
	return value instanceof Date
		? value.toISOString().slice(0, 10)
		: String(value).slice(0, 10);
}

/** `2025-01-14` (or its `Date`) → `14 ENE`. */
function shortDate(value: string | Date): string {
	const iso = isoDay(value);
	const [, month, day] = iso.split("-");
	const name = MONTHS[Number(month) - 1];
	return name && day ? `${Number(day)} ${name}` : iso;
}

function toCandidate(
	tx: BankTransactionDto,
	match: MatchesDto["matches"][number],
): ReconciliationCandidate {
	const isInvoice = match.kind === "INVOICE";
	const label = isInvoice ? "Factura" : "Compra";
	const column = isInvoice ? "invoice_id" : "bill_id";
	return {
		id: match.documentId,
		documentKind: match.kind,
		ledgerEntryId: match.number,
		vendor: match.partnerName,
		amount: match.amountCents / 100,
		amountCents: match.amountCents,
		score: match.score,
		rationale: `${match.reasons.join(". ")}.`,
		sourceRecords: [
			`Movimiento bancario ${shortDate(tx.transactionDate)} · ${tx.reference ?? tx.description}`,
			`${label} ${match.number} · ${match.partnerName}`,
		],
		impact: `Marca el movimiento como conciliado con la ${label.toLowerCase()} ${match.number}.`,
		proposedDiff: [
			`bank_transactions.${column} → ${match.number}`,
			"bank_transactions.is_reconciled → true",
		],
	};
}

function pendingStatus(
	matches: MatchesDto | undefined,
): ReconciliationTransaction["status"] {
	if (!matches) return "needs_review";
	const best = matches.matches[0]?.score ?? 0;
	if (best >= SUGGESTED_SCORE) return "suggested";
	if (best > 0) return "needs_review";
	return "unmatched";
}

/** API row (+ its proposals once loaded) → the workspace's transaction model. */
export function toTransaction(
	tx: BankTransactionDto,
	matches?: MatchesDto,
): ReconciliationTransaction {
	const amountCents = bankAmountCents(tx.amount, tx.type);
	const reconciled = tx.isReconciled === true;
	return {
		id: tx.id,
		date: shortDate(tx.transactionDate),
		description: tx.description,
		amount: amountCents / 100,
		amountCents,
		status: reconciled ? "matched" : pendingStatus(matches),
		confidence: reconciled ? 100 : (matches?.matches[0]?.score ?? 0),
		notes: reconciled
			? "Conciliado."
			: matches
				? `${matches.matches.length} sugerencia(s) con el mismo monto.`
				: "Selecciona el movimiento para buscar coincidencias.",
		candidates: reconciled
			? []
			: (matches?.matches ?? []).map((m) => toCandidate(tx, m)),
	};
}

export function summarize(transactions: readonly ReconciliationTransaction[]) {
	const unresolved = transactions.filter((tx) => tx.status !== "matched");
	return {
		unresolvedCount: unresolved.length,
		unresolvedExposureCents: unresolved.reduce(
			(total, tx) => total + Math.abs(tx.amountCents),
			0,
		),
		// No movements means nothing was reconciled: not applicable (null), never "100%".
		reconciledRate:
			transactions.length === 0
				? null
				: Math.round(
						((transactions.length - unresolved.length) / transactions.length) *
							100,
					),
		requiresHumanDecision: unresolved.length > 0,
	};
}

const LIST_LIMIT = 100;

/** Pending first, then reconciled, for the active company. */
export async function fetchBankTransactions(
	companyId: string,
): Promise<BankTransactionDto[]> {
	const query = { query: { companyId, limit: LIST_LIMIT } };
	const [pending, reconciled] = await Promise.all([
		unwrap(api.api.reconciliations.pending.get(query)),
		unwrap(api.api.reconciliations.reconciled.get(query)),
	]);
	return [
		...extractOkData<BankTransactionDto[]>(
			pending,
			"No se pudieron cargar los movimientos pendientes",
		),
		...extractOkData<BankTransactionDto[]>(
			reconciled,
			"No se pudieron cargar los movimientos conciliados",
		),
	];
}

export async function fetchMatches(
	companyId: string,
	transactionId: string,
): Promise<MatchesDto> {
	const envelope = await unwrap(
		api.api.reconciliations({ id: transactionId }).matches.get({
			query: { companyId },
		}),
	);
	return extractOkData<MatchesDto>(
		envelope,
		"No se pudieron cargar las sugerencias",
	);
}

/** Confirms a proposal; the API re-checks it is still a valid match. */
export async function confirmMatch(
	companyId: string,
	transactionId: string,
	candidate: Pick<ReconciliationCandidate, "id" | "documentKind">,
): Promise<void> {
	const link =
		candidate.documentKind === "INVOICE"
			? { invoiceId: candidate.id }
			: { billId: candidate.id };
	const envelope = await unwrap(
		api.api
			.reconciliations({ id: transactionId })
			.reconcile.post({ companyId, ...link }),
	);
	extractOkData(envelope, "No se pudo confirmar la conciliación");
}
