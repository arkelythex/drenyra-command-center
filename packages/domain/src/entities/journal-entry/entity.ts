import { Money } from "../../value-objects/Money";
import type {
	JournalEntryProps,
	JournalEntryStatus,
	JournalLineProps,
} from "./types";
import { validateJournalEntry, validateJournalLine } from "./validators";

export class JournalLine {
	private constructor(private props: JournalLineProps) {
		validateJournalLine(this.props);
	}

	static create(props: JournalLineProps): JournalLine {
		return new JournalLine(props);
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

export class JournalEntry {
	private constructor(private props: JournalEntryProps) {
		validateJournalEntry(this.props);
		Object.freeze(this);
	}

	static create(props: JournalEntryProps): JournalEntry {
		return new JournalEntry(props);
	}

	isBalanced(): boolean {
		const totalDebit = this.getTotalDebit();
		const totalCredit = this.getTotalCredit();
		return totalDebit.equals(totalCredit);
	}

	getTotalDebit(): Money {
		return this.props.lines.reduce(
			(acc, line) => acc.add(line.debit),
			Money.zero("PEN"),
		);
	}

	getTotalCredit(): Money {
		return this.props.lines.reduce(
			(acc, line) => acc.add(line.credit),
			Money.zero("PEN"),
		);
	}

	canBeModified(): boolean {
		return this.props.status === "borrador";
	}

	canBeDeleted(): boolean {
		return this.props.status === "borrador";
	}

	canBePosted(): boolean {
		return this.props.status === "borrador" && this.isBalanced();
	}

	canBeDeclared(): boolean {
		return this.props.status === "mayorizado";
	}

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

	equals(other: JournalEntry | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

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
