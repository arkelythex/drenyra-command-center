/**
 * JournalEntry (Asiento Contable) Entity.
 *
 * @description Central domain entity representing an accounting journal entry in
 * double-entry bookkeeping. It ensures mathematical integrity (Balanced Entry)
 * and maintains the immutable audit trail required for financial compliance.
 *
 * @business_rules
 * - Balanced Invariant: Total Debit MUST equal Total Credit (to the cent).
 * - Minimum Lines: Must have at least two lines (one debit, one credit).
 * - Exclusivity: A single line cannot contain both debit and credit amounts.
 * - Immutability: Once posted (mayorizado) or declared, modifications are restricted.
 * - Temporal Rule: Entry date cannot be set in the future.
 *
 * @lifecycle
 * borrador (Draft) -> mayorizado (Posted) -> declarado (Declared/Finalized)
 *
 * @example
 * ```typescript
 * const entry = JournalEntry.create({
 *   id: 'uuid-1',
 *   organizationId: 1,
 *   entryNumber: '001-2025',
 *   date: new Date(),
 *   gloss: 'Pago de servicios básicos',
 *   status: 'borrador',
 *   lines: [
 *     JournalLine.create({ accountCode: '6311', debit: Money.create(100), ... }),
 *     JournalLine.create({ accountCode: '1041', credit: Money.create(100), ... })
 *   ],
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * });
 * ```
 *
 * @domain Accounting
 * @since 1.0.0
 */

import { Money } from "../value-objects/Money";

/**
 * Journal entry lifecycle status.
 *
 * @example
 * ```ts
 * const s: JournalEntryStatus = "borrador";
 * ```
 */
export type JournalEntryStatus = "borrador" | "mayorizado" | "declarado";

/**
 * Properties used to construct a {@link JournalLine}.
 *
 * @example
 * ```ts
 * const props: JournalLineProps = {
 *   id: "line_1",
 *   accountId: "acc_1",
 *   accountCode: "1011",
 *   accountName: "Caja",
 *   description: "Pago",
 *   debit: Money.zero("PEN"),
 *   credit: Money.fromAmount(10, "PEN"),
 * };
 * ```
 */
export interface JournalLineProps {
	id: string;
	accountId: string;
	accountCode: string;
	accountName: string;
	description: string;
	debit: Money;
	credit: Money;
	documentType?: string;
	documentNumber?: string;
	dueDate?: Date;
}

/**
 * Represents a single debit or credit line within a Journal Entry.
 *
 * @description In double-entry accounting, each transaction is recorded across
 * two or more accounts. A JournalLine captures the impact on a specific account,
 * strictly adhering to the "Debe" (Debit) or "Haber" (Credit) dichotomy.
 *
 * @example
 * ```ts
 * const line = JournalLine.create({
 *   id: "line_1",
 *   accountId: "acc_1",
 *   accountCode: "1011",
 *   accountName: "Caja",
 *   description: "Pago",
 *   debit: Money.fromAmount(10, "PEN"),
 *   credit: Money.zero("PEN"),
 * });
 * ```
 */
export class JournalLine {
	private constructor(private props: JournalLineProps) {
		this.validate();
	}

	static create(props: JournalLineProps): JournalLine {
		return new JournalLine(props);
	}

	private validate(): void {
		// Rule: A line cannot have both debit and credit
		if (!this.props.debit.isZero() && !this.props.credit.isZero()) {
			throw new Error("Una línea no puede tener tanto Debe como Haber");
		}

		// Rule: A line must have either debit or credit
		if (this.props.debit.isZero() && this.props.credit.isZero()) {
			throw new Error("Una línea debe tener Debe o Haber");
		}

		// Rule: Description is required
		if (!this.props.description || this.props.description.trim().length === 0) {
			throw new Error("La descripción de la línea es requerida");
		}
	}

	isDebit(): boolean {
		return !this.props.debit.isZero();
	}

	isCredit(): boolean {
		return !this.props.credit.isZero();
	}

	getAmount(): Money {
		return this.isDebit() ? this.props.debit : this.props.credit;
	}

	// Getters
	get id(): string {
		return this.props.id;
	}
	get accountId(): string {
		return this.props.accountId;
	}
	get accountCode(): string {
		return this.props.accountCode;
	}
	get accountName(): string {
		return this.props.accountName;
	}
	get description(): string {
		return this.props.description;
	}
	get debit(): Money {
		return this.props.debit;
	}
	get credit(): Money {
		return this.props.credit;
	}
	get documentType(): string | undefined {
		return this.props.documentType;
	}
	get documentNumber(): string | undefined {
		return this.props.documentNumber;
	}
	get dueDate(): Date | undefined {
		return this.props.dueDate;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			accountId: this.props.accountId,
			accountCode: this.props.accountCode,
			accountName: this.props.accountName,
			description: this.props.description,
			debit: this.props.debit.getAmount(),
			credit: this.props.credit.getAmount(),
			documentType: this.props.documentType,
			documentNumber: this.props.documentNumber,
			dueDate: this.props.dueDate?.toISOString(),
		};
	}
}

/**
 * Properties used to construct a {@link JournalEntry}.
 *
 * @example
 * ```ts
 * const entry = { id: "je_1", organizationId: 1, entryNumber: "001-2026", date: new Date(), gloss: "Pago", status: "borrador", lines: [], createdAt: new Date(), updatedAt: new Date() } as JournalEntryProps;
 * ```
 */
export interface JournalEntryProps {
	id: string;
	organizationId: number;
	entryNumber: string;
	date: Date;
	gloss: string;
	status: JournalEntryStatus;
	lines: JournalLine[];
	postedBy?: string;
	postedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Accounting journal entry aggregate (double-entry bookkeeping).
 *
 * @example
 * ```ts
 * const entry = JournalEntry.create({} as JournalEntryProps);
 * entry.isBalanced();
 * ```
 */
export class JournalEntry {
	private constructor(private props: JournalEntryProps) {
		this.validateBusinessRules();
		Object.freeze(this);
	}

	/**
	 * Create a new JournalEntry
	 */
	static create(props: JournalEntryProps): JournalEntry {
		return new JournalEntry(props);
	}

	/**
	 * Validate all business rules
	 */
	private validateBusinessRules(): void {
		// Rule 1: Must have at least 2 lines (double-entry accounting)
		if (this.props.lines.length < 2) {
			throw new Error(
				"El asiento debe tener al menos 2 líneas (partida doble)",
			);
		}

		// Rule 2: Must be balanced (total debit = total credit)
		if (!this.isBalanced()) {
			const totalDebit = this.getTotalDebit();
			const totalCredit = this.getTotalCredit();
			throw new Error(
				`El asiento debe estar balanceado. Debe: ${totalDebit.getAmount()}, Haber: ${totalCredit.getAmount()}`,
			);
		}

		// Rule 3: Entry number is required
		if (!this.props.entryNumber || this.props.entryNumber.trim().length === 0) {
			throw new Error("El número de asiento es requerido");
		}

		// Rule 4: Gloss is required
		if (!this.props.gloss || this.props.gloss.trim().length === 0) {
			throw new Error("La glosa es requerida");
		}

		// Rule 5: Date cannot be in the future
		if (this.props.date > new Date()) {
			throw new Error("La fecha del asiento no puede ser futura");
		}
	}

	/**
	 * Check if entry is balanced (total debit = total credit)
	 */
	isBalanced(): boolean {
		const totalDebit = this.getTotalDebit();
		const totalCredit = this.getTotalCredit();
		return totalDebit.equals(totalCredit);
	}

	/**
	 * Calculate total debit
	 */
	getTotalDebit(): Money {
		return this.props.lines.reduce(
			(acc, line) => acc.add(line.debit),
			Money.zero("PEN"),
		);
	}

	/**
	 * Calculate total credit
	 */
	getTotalCredit(): Money {
		return this.props.lines.reduce(
			(acc, line) => acc.add(line.credit),
			Money.zero("PEN"),
		);
	}

	/**
	 * Check if entry can be modified
	 */
	canBeModified(): boolean {
		return this.props.status === "borrador";
	}

	/**
	 * Check if entry can be deleted
	 */
	canBeDeleted(): boolean {
		return this.props.status === "borrador";
	}

	/**
	 * Check if entry can be posted (mayorizado)
	 */
	canBePosted(): boolean {
		return this.props.status === "borrador" && this.isBalanced();
	}

	/**
	 * Check if entry can be declared
	 */
	canBeDeclared(): boolean {
		return this.props.status === "mayorizado";
	}

	/**
	 * Mark as posted (mayorizado)
	 */
	markAsPosted(userId: string): JournalEntry {
		if (!this.canBePosted()) {
			throw new Error(
				"Solo se pueden mayorizar asientos en borrador y balanceados",
			);
		}

		return new JournalEntry({
			...this.props,
			status: "mayorizado",
			postedBy: userId,
			postedAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Mark as declared (declarado)
	 */
	markAsDeclared(): JournalEntry {
		if (!this.canBeDeclared()) {
			throw new Error("Solo se pueden declarar asientos mayorizados");
		}

		return new JournalEntry({
			...this.props,
			status: "declarado",
			updatedAt: new Date(),
		});
	}

	/**
	 * Update entry (only if draft)
	 */
	update(data: {
		date?: Date;
		gloss?: string;
		lines?: JournalLine[];
	}): JournalEntry {
		if (!this.canBeModified()) {
			throw new Error("Solo se pueden editar asientos en borrador");
		}

		return new JournalEntry({
			...this.props,
			date: data.date ?? this.props.date,
			gloss: data.gloss ?? this.props.gloss,
			lines: data.lines ?? this.props.lines,
			updatedAt: new Date(),
		});
	}

	/**
	 * Check equality by ID
	 */
	equals(other: JournalEntry | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	// Getters
	get id(): string {
		return this.props.id;
	}
	get organizationId(): number {
		return this.props.organizationId;
	}
	get entryNumber(): string {
		return this.props.entryNumber;
	}
	get date(): Date {
		return this.props.date;
	}
	get gloss(): string {
		return this.props.gloss;
	}
	get status(): JournalEntryStatus {
		return this.props.status;
	}
	get lines(): readonly JournalLine[] {
		return this.props.lines;
	}
	get postedBy(): string | undefined {
		return this.props.postedBy;
	}
	get postedAt(): Date | undefined {
		return this.props.postedAt;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serialize to JSON (for persistence)
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			organizationId: this.props.organizationId,
			entryNumber: this.props.entryNumber,
			date: this.props.date.toISOString(),
			gloss: this.props.gloss,
			status: this.props.status,
			totalDebit: this.getTotalDebit().getAmount(),
			totalCredit: this.getTotalCredit().getAmount(),
			lines: this.props.lines.map((line) => line.toJSON()),
			postedBy: this.props.postedBy,
			postedAt: this.props.postedAt?.toISOString(),
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
