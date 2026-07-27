/**
 * ReconciliationBatch Entity — Aggregate Root
 *
 * Groups reconciliation matching operations for a bank account within a date period.
 * Enforces a strict status lifecycle and immutability after closure.
 *
 * Lifecycle: OPEN → IN_PROGRESS → PARTIALLY_MATCHED | MATCHED → CLOSED | CLOSED_WITH_DISCREPANCY
 *
 * @example
 * ```ts
 * const batch = ReconciliationBatch.createNew({
 *   organizationId: 1,
 *   bankAccountId: "ba-abc123",
 *   periodStart: new Date("2026-07-01"),
 *   periodEnd: new Date("2026-07-31"),
 *   openingBalance: Money.fromAmount(10000, "PEN"),
 *   mode: "MANUAL",
 * });
 * ```
 */

import { Money } from "../value-objects/Money";
import type { Currency } from "../types/currency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Reconciliation batch status lifecycle. */
export type ReconciliationBatchStatus =
	| "OPEN"
	| "IN_PROGRESS"
	| "PARTIALLY_MATCHED"
	| "MATCHED"
	| "CLOSED_WITH_DISCREPANCY"
	| "CLOSED";

/** Reconciliation mode. */
export type ReconciliationMode = "MANUAL" | "AUTO";

/** Immutable closure statuses — batches in these states reject mutations. */
const CLOSED_STATUSES: ReadonlySet<ReconciliationBatchStatus> = new Set([
	"CLOSED",
	"CLOSED_WITH_DISCREPANCY",
]);

/** Statuses that can transition to IN_PROGRESS. */
const OPEN_STATUSES: ReadonlySet<ReconciliationBatchStatus> = new Set(["OPEN"]);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReconciliationBatchProps {
	id: string;
	companyId: string;
	bankAccountId: string;
	periodStart: Date;
	periodEnd: Date;
	status: ReconciliationBatchStatus;
	openingBalance: Money;
	closingBalance: Money | null;
	matchedCount: number;
	unmatchedCount: number;
	discrepancyAmount: Money | null;
	mode: ReconciliationMode;
	createdAt: Date;
	closedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

export class ReconciliationBatch {
	private constructor(private readonly props: ReconciliationBatchProps) {
		this.validateInvariants();
	}

	// -----------------------------------------------------------------------
	// Factory methods
	// -----------------------------------------------------------------------

	/** Create a new reconciliation batch. */
	static createNew(params: {
		companyId: string;
		bankAccountId: string;
		periodStart: Date;
		periodEnd: Date;
		openingBalance: Money;
		mode?: ReconciliationMode;
	}): ReconciliationBatch {
		const now = new Date();

		return new ReconciliationBatch({
			id: crypto.randomUUID(),
			companyId: params.companyId,
			bankAccountId: params.bankAccountId,
			periodStart: params.periodStart,
			periodEnd: params.periodEnd,
			status: "OPEN",
			openingBalance: params.openingBalance,
			closingBalance: null,
			matchedCount: 0,
			unmatchedCount: 0,
			discrepancyAmount: null,
			mode: params.mode ?? "MANUAL",
			createdAt: now,
			closedAt: null,
		});
	}

	/** Reconstitute from persisted data. */
	static create(props: ReconciliationBatchProps): ReconciliationBatch {
		return new ReconciliationBatch(props);
	}

	// -----------------------------------------------------------------------
	// Invariants
	// -----------------------------------------------------------------------

	private validateInvariants(): void {
		if (!this.props.companyId || this.props.companyId.trim() === "") {
			throw new Error("El ID de compañía es requerido");
		}
		if (!this.props.bankAccountId || this.props.bankAccountId.trim() === "") {
			throw new Error("El ID de cuenta bancaria es requerido");
		}
		if (this.props.periodEnd < this.props.periodStart) {
			throw new Error(
				"La fecha de fin del período debe ser posterior a la fecha de inicio",
			);
		}
		if (this.props.matchedCount < 0) {
			throw new Error("El contador de coincidencias no puede ser negativo");
		}
		if (this.props.unmatchedCount < 0) {
			throw new Error("El contador de no coincidencias no puede ser negativo");
		}
	}

	// -----------------------------------------------------------------------
	// Guards
	// -----------------------------------------------------------------------

	private assertOpen(message?: string): void {
		if (CLOSED_STATUSES.has(this.props.status)) {
			throw new Error(
				message ?? "No se puede modificar un lote de conciliación cerrado",
			);
		}
	}

	private assertNotOpen(message?: string): void {
		if (this.props.status === "OPEN") {
			throw new Error(
				message ?? "El lote debe estar en procesamiento para esta operación",
			);
		}
	}

	private computeStatus(
		totalMatched: number,
		totalUnmatched: number,
	): ReconciliationBatchStatus {
		if (totalMatched === 0 && totalUnmatched === 0) return "IN_PROGRESS";
		if (totalUnmatched > 0) return "PARTIALLY_MATCHED";
		return "MATCHED";
	}

	// -----------------------------------------------------------------------
	// Commands
	// -----------------------------------------------------------------------

	/** Transition from OPEN → IN_PROGRESS. */
	startProcessing(): ReconciliationBatch {
		if (!OPEN_STATUSES.has(this.props.status)) {
			throw new Error(
				`No se puede iniciar procesamiento desde estado "${this.props.status}"`,
			);
		}
		return new ReconciliationBatch({
			...this.props,
			status: "IN_PROGRESS",
		});
	}

	/** Add matched transactions to the batch. */
	addMatch(count: number): ReconciliationBatch {
		this.assertOpen("No se puede agregar coincidencias a un lote cerrado");
		this.assertNotOpen(
			"El lote debe iniciar procesamiento antes de agregar coincidencias",
		);
		if (count <= 0) {
			throw new Error("El conteo de coincidencias debe ser positivo");
		}

		const newMatched = this.props.matchedCount + count;
		return new ReconciliationBatch({
			...this.props,
			matchedCount: newMatched,
			status: this.computeStatus(newMatched, this.props.unmatchedCount),
		});
	}

	/** Add unmatched transactions to the batch. */
	addUnmatched(count: number): ReconciliationBatch {
		this.assertOpen("No se puede agregar no-coincidencias a un lote cerrado");
		this.assertNotOpen(
			"El lote debe iniciar procesamiento antes de agregar no-coincidencias",
		);
		if (count <= 0) {
			throw new Error("El conteo de no-coincidencias debe ser positivo");
		}

		const newUnmatched = this.props.unmatchedCount + count;
		return new ReconciliationBatch({
			...this.props,
			unmatchedCount: newUnmatched,
			status: this.computeStatus(this.props.matchedCount, newUnmatched),
		});
	}

	/** Close the batch — transitions to CLOSED or CLOSED_WITH_DISCREPANCY. */
	close(closingBalance: Money): ReconciliationBatch {
		if (CLOSED_STATUSES.has(this.props.status)) {
			throw new Error("El lote ya está cerrado");
		}
		if (this.props.status === "OPEN" || this.props.status === "IN_PROGRESS") {
			// Allow closing even without matches; zero matches means CLOSED_WITH_DISCREPANCY
		}

		const discrepancy = this.calculateDiscrepancyInternal(closingBalance);

		const finalStatus: ReconciliationBatchStatus =
			this.props.unmatchedCount > 0 ||
			(discrepancy !== null && !discrepancy.isZero())
				? "CLOSED_WITH_DISCREPANCY"
				: "CLOSED";

		return new ReconciliationBatch({
			...this.props,
			status: finalStatus,
			closingBalance,
			discrepancyAmount: discrepancy,
			closedAt: new Date(),
		});
	}

	// -----------------------------------------------------------------------
	// Queries
	// -----------------------------------------------------------------------

	/**
	 * Calculate the discrepancy between expected and actual closing balance.
	 *
	 * Formula: closingBalance - openingBalance - (totalCredits - totalDebits)
	 * A non-zero result means the books don't match the bank statement.
	 *
	 * @param closingBalance - The actual closing balance per bank statement
	 * @param totalCredits - Total credit (inflow) transactions in period
	 * @param totalDebits - Total debit (outflow) transactions in period
	 * @returns The discrepancy amount (0 means perfectly balanced)
	 */
	calculateDiscrepancy(
		closingBalance: Money,
		totalCredits: Money,
		totalDebits: Money,
	): Money {
		const currency = this.props.openingBalance.getCurrency();

		if (closingBalance.getCurrency() !== currency) {
			throw new Error(`El balance de cierre debe estar en ${currency}`);
		}
		if (totalCredits.getCurrency() !== currency) {
			throw new Error(`Los créditos totales deben estar en ${currency}`);
		}
		if (totalDebits.getCurrency() !== currency) {
			throw new Error(`Los débitos totales deben estar en ${currency}`);
		}

		const netMovement = totalCredits.subtract(totalDebits);
		const expectedClosing = this.props.openingBalance.add(netMovement);

		// discrepancy = closingBalance - openingBalance - netMovement
		const closingCents = closingBalance.getCents();
		const expectedCents = expectedClosing.getCents();
		const discrepancyCents = closingCents - expectedCents;

		return Money.fromCents(discrepancyCents, currency as Currency);
	}

	/** Internal: calculate discrepancy from closingBalance only (for close()). */
	private calculateDiscrepancyInternal(closingBalance: Money): Money | null {
		if (
			closingBalance.getCurrency() !== this.props.openingBalance.getCurrency()
		) {
			throw new Error(
				`El balance de cierre debe estar en ${this.props.openingBalance.getCurrency()}`,
			);
		}
		// Simplified: discrepancy = closing - opening (detailed calc uses totalCredits/totalDebits)
		try {
			return closingBalance.subtract(this.props.openingBalance);
		} catch {
			// Negative => closing < opening
			const openingCents = this.props.openingBalance.getCents();
			const closingCents = closingBalance.getCents();
			return Money.fromCents(
				closingCents - openingCents,
				this.props.openingBalance.getCurrency() as Currency,
			);
		}
	}

	// -----------------------------------------------------------------------
	// Getters
	// -----------------------------------------------------------------------

	get id(): string {
		return this.props.id;
	}
	get companyId(): string {
		return this.props.companyId;
	}
	get bankAccountId(): string {
		return this.props.bankAccountId;
	}
	get periodStart(): Date {
		return this.props.periodStart;
	}
	get periodEnd(): Date {
		return this.props.periodEnd;
	}
	get status(): ReconciliationBatchStatus {
		return this.props.status;
	}
	get openingBalance(): Money {
		return this.props.openingBalance;
	}
	get closingBalance(): Money | null {
		return this.props.closingBalance;
	}
	get matchedCount(): number {
		return this.props.matchedCount;
	}
	get unmatchedCount(): number {
		return this.props.unmatchedCount;
	}
	get discrepancyAmount(): Money | null {
		return this.props.discrepancyAmount;
	}
	get mode(): ReconciliationMode {
		return this.props.mode;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get closedAt(): Date | null {
		return this.props.closedAt;
	}

	// -----------------------------------------------------------------------
	// Serialization
	// -----------------------------------------------------------------------

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			companyId: this.props.companyId,
			bankAccountId: this.props.bankAccountId,
			periodStart: this.props.periodStart.toISOString(),
			periodEnd: this.props.periodEnd.toISOString(),
			status: this.props.status,
			openingBalance: this.props.openingBalance.toJSON(),
			closingBalance: this.props.closingBalance?.toJSON() ?? null,
			matchedCount: this.props.matchedCount,
			unmatchedCount: this.props.unmatchedCount,
			discrepancyAmount: this.props.discrepancyAmount?.toJSON() ?? null,
			mode: this.props.mode,
			createdAt: this.props.createdAt.toISOString(),
			closedAt: this.props.closedAt?.toISOString() ?? null,
		};
	}
}
