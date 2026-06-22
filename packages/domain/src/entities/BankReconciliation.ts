/**
 * BankReconciliation Entity
 *
 * Represents a bank reconciliation session/batch.
 * Links bank transactions with accounting entries.
 * Lifecycle status for a reconciliation session.
 *
 * @example
 * ```ts
 * const status: ReconciliationStatus = "DRAFT";
 * ```
 */

export type ReconciliationStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

/**
 * Properties used to construct a {@link BankReconciliation}.
 *
 * @example
 * ```ts
 * const props: BankReconciliationProps = {
 *   id: 0,
 *   bankAccountId: 1,
 *   organizationId: 1,
 *   periodStart: new Date("2026-01-01"),
 *   periodEnd: new Date("2026-01-31"),
 *   openingBalance: 0,
 *   closingBalanceStatement: 0,
 *   closingBalanceBooks: 0,
 *   difference: 0,
 *   status: "DRAFT",
 *   reconciledTransactionIds: [],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface BankReconciliationProps {
	id: number;
	bankAccountId: number;
	organizationId: number;
	periodStart: Date;
	periodEnd: Date;
	openingBalance: number;
	closingBalanceStatement: number; // As per bank statement
	closingBalanceBooks: number; // As per accounting books
	difference: number;
	status: ReconciliationStatus;
	reconciledTransactionIds: number[];
	reconciledByUserId?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
}

/**
 * Bank reconciliation session/batch aggregate.
 *
 * @deprecated Use the Banking bounded context entity under `apps/api/src/features/banking/domain/entities`.
 *
 * @example
 * ```ts
 * const rec = BankReconciliation.createNew({
 *   bankAccountId: 1,
 *   organizationId: 1,
 *   periodStart: new Date("2026-01-01"),
 *   periodEnd: new Date("2026-01-31"),
 *   openingBalance: 0,
 *   closingBalanceStatement: 0,
 * });
 * ```
 */
export class BankReconciliation {
	private constructor(private readonly props: BankReconciliationProps) {
		this.validateBusinessRules();
	}

	/**
	 * Create from existing data
	 */
	static create(props: BankReconciliationProps): BankReconciliation {
		return new BankReconciliation(props);
	}

	/**
	 * Create a new reconciliation session
	 */
	static createNew(params: {
		bankAccountId: number;
		organizationId: number;
		periodStart: Date;
		periodEnd: Date;
		openingBalance: number;
		closingBalanceStatement: number;
	}): BankReconciliation {
		const now = new Date();

		return new BankReconciliation({
			id: 0,
			bankAccountId: params.bankAccountId,
			organizationId: params.organizationId,
			periodStart: params.periodStart,
			periodEnd: params.periodEnd,
			openingBalance: params.openingBalance,
			closingBalanceStatement: params.closingBalanceStatement,
			closingBalanceBooks: 0,
			difference: 0,
			status: "DRAFT",
			reconciledTransactionIds: [],
			createdAt: now,
			updatedAt: now,
		});
	}

	/**
	 * Validate business rules
	 */
	private validateBusinessRules(): void {
		if (this.props.periodEnd < this.props.periodStart) {
			throw new Error(
				"La fecha de fin debe ser posterior a la fecha de inicio",
			);
		}
	}

	/**
	 * Add a transaction to the reconciliation
	 */
	addTransaction(transactionId: number): BankReconciliation {
		if (this.props.status !== "DRAFT") {
			throw new Error(
				"Solo se pueden agregar transacciones a conciliaciones en borrador",
			);
		}

		if (this.props.reconciledTransactionIds.includes(transactionId)) {
			return this; // Already added
		}

		return new BankReconciliation({
			...this.props,
			reconciledTransactionIds: [
				...this.props.reconciledTransactionIds,
				transactionId,
			],
			updatedAt: new Date(),
		});
	}

	/**
	 * Remove a transaction from the reconciliation
	 */
	removeTransaction(transactionId: number): BankReconciliation {
		if (this.props.status !== "DRAFT") {
			throw new Error(
				"Solo se pueden remover transacciones de conciliaciones en borrador",
			);
		}

		return new BankReconciliation({
			...this.props,
			reconciledTransactionIds: this.props.reconciledTransactionIds.filter(
				(id) => id !== transactionId,
			),
			updatedAt: new Date(),
		});
	}

	/**
	 * Update books balance and calculate difference
	 */
	updateBooksBalance(closingBalanceBooks: number): BankReconciliation {
		if (this.props.status !== "DRAFT") {
			throw new Error("Solo se pueden actualizar conciliaciones en borrador");
		}

		const difference =
			Math.round(
				(this.props.closingBalanceStatement - closingBalanceBooks) * 100,
			) / 100;

		return new BankReconciliation({
			...this.props,
			closingBalanceBooks,
			difference,
			updatedAt: new Date(),
		});
	}

	/**
	 * Complete the reconciliation
	 */
	complete(userId: string): BankReconciliation {
		if (this.props.status !== "DRAFT") {
			throw new Error("La conciliación ya fue completada o cancelada");
		}

		// Business rule: difference should be zero or explained
		if (Math.abs(this.props.difference) > 0.01 && !this.props.notes) {
			throw new Error(
				"Debe explicar la diferencia en las notas antes de completar",
			);
		}

		return new BankReconciliation({
			...this.props,
			status: "COMPLETED",
			reconciledByUserId: userId,
			completedAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Cancel the reconciliation
	 */
	cancel(): BankReconciliation {
		if (this.props.status === "CANCELLED") {
			throw new Error("La conciliación ya está cancelada");
		}

		return new BankReconciliation({
			...this.props,
			status: "CANCELLED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Add notes
	 */
	addNotes(notes: string): BankReconciliation {
		return new BankReconciliation({
			...this.props,
			notes: this.props.notes ? `${this.props.notes}\n${notes}` : notes,
			updatedAt: new Date(),
		});
	}

	/**
	 * Check if balanced (no difference)
	 */
	isBalanced(): boolean {
		return Math.abs(this.props.difference) < 0.01;
	}

	// Getters
	get id(): number {
		return this.props.id;
	}
	get bankAccountId(): number {
		return this.props.bankAccountId;
	}
	get organizationId(): number {
		return this.props.organizationId;
	}
	get periodStart(): Date {
		return this.props.periodStart;
	}
	get periodEnd(): Date {
		return this.props.periodEnd;
	}
	get openingBalance(): number {
		return this.props.openingBalance;
	}
	get closingBalanceStatement(): number {
		return this.props.closingBalanceStatement;
	}
	get closingBalanceBooks(): number {
		return this.props.closingBalanceBooks;
	}
	get difference(): number {
		return this.props.difference;
	}
	get status(): ReconciliationStatus {
		return this.props.status;
	}
	get reconciledTransactionIds(): number[] {
		return [...this.props.reconciledTransactionIds];
	}
	get reconciledByUserId(): string | undefined {
		return this.props.reconciledByUserId;
	}
	get notes(): string | undefined {
		return this.props.notes;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get completedAt(): Date | undefined {
		return this.props.completedAt;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			bankAccountId: this.props.bankAccountId,
			organizationId: this.props.organizationId,
			periodStart: this.props.periodStart.toISOString(),
			periodEnd: this.props.periodEnd.toISOString(),
			openingBalance: this.props.openingBalance,
			closingBalanceStatement: this.props.closingBalanceStatement,
			closingBalanceBooks: this.props.closingBalanceBooks,
			difference: this.props.difference,
			status: this.props.status,
			reconciledTransactionIds: this.props.reconciledTransactionIds,
			reconciledByUserId: this.props.reconciledByUserId,
			notes: this.props.notes,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
			completedAt: this.props.completedAt?.toISOString(),
		};
	}
}
