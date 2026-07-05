/**
 * Builder pattern for JournalEntry (Asiento Contable) test data.
 *
 * Creates valid double-entry accounting journal entries with balanced
 * debit and credit enforcement, following PCGE account codes.
 *
 * @example
 * ```ts
 * const entry = new JournalEntryBuilder()
 *   .withDebit("1041", 1000)
 *   .withCredit("7011", 1000)
 *   .build();
 * ```
 */
import {
	JournalEntry,
	type JournalEntryProps,
	type JournalEntryStatus,
	JournalLine,
} from "@drenyra/domain/entities/JournalEntry";
import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";

const DEFAULT_ENTRY_ID = "je_test_001";
const DEFAULT_ORGANIZATION_ID = 1;
const DEFAULT_ENTRY_NUMBER = "001-2026";
const DEFAULT_GLOSS = "Asiento contable de prueba";
const DEFAULT_STATUS: JournalEntryStatus = "borrador";
const DEFAULT_CURRENCY: Currency = "PEN";

export interface JournalEntryLineData {
	accountCode: string;
	accountName?: string;
	description?: string;
	amount: number;
	currency: Currency;
	type: "debit" | "credit";
}

export class JournalEntryBuilder extends BaseBuilder<
	Partial<JournalEntryProps>,
	JournalEntry
> {
	private linesData: JournalEntryLineData[] = [];
	private lineCounter = 0;

	constructor() {
		const today = new Date();
		// Ensure date is not in the future for validation rules
		today.setHours(today.getHours() - 1);

		super({
			id: DEFAULT_ENTRY_ID,
			organizationId: DEFAULT_ORGANIZATION_ID,
			entryNumber: DEFAULT_ENTRY_NUMBER,
			date: today,
			gloss: DEFAULT_GLOSS,
			status: DEFAULT_STATUS,
			lines: [],
			createdAt: today,
			updatedAt: today,
		});
	}

	/**
	 * Add a debit line to the journal entry.
	 *
	 * @param accountCode - PCGE account code (e.g., "1041", "6311")
	 * @param amount - Amount in the account's currency
	 * @param currency - Currency for the amount (defaults to PEN)
	 */
	withDebit(
		accountCode: string,
		amount: number,
		currency: Currency = DEFAULT_CURRENCY,
	): this {
		this.lineCounter++;
		this.linesData.push({
			accountCode,
			accountName: `Cuenta ${accountCode}`,
			description: `Cargo ${this.lineCounter}`,
			amount,
			currency,
			type: "debit",
		});
		return this;
	}

	/**
	 * Add a credit line to the journal entry.
	 *
	 * @param accountCode - PCGE account code (e.g., "7011", "4011")
	 * @param amount - Amount in the account's currency
	 * @param currency - Currency for the amount (defaults to PEN)
	 */
	withCredit(
		accountCode: string,
		amount: number,
		currency: Currency = DEFAULT_CURRENCY,
	): this {
		this.lineCounter++;
		this.linesData.push({
			accountCode,
			accountName: `Cuenta ${accountCode}`,
			description: `Abono ${this.lineCounter}`,
			amount,
			currency,
			type: "credit",
		});
		return this;
	}

	/**
	 * Set the entry date.
	 */
	withDate(date: Date): this {
		return this.set({ date });
	}

	/**
	 * Set the gloss / description for the journal entry.
	 */
	withDescription(description: string): this {
		return this.set({ gloss: description });
	}

	/**
	 * Set a reference number for the journal entry.
	 */
	withReference(reference: string): this {
		return this.set({ entryNumber: reference });
	}

	/**
	 * Set the organization ID.
	 */
	withOrganizationId(orgId: number): this {
		return this.set({ organizationId: orgId });
	}

	/**
	 * Set the entry status.
	 */
	withStatus(status: JournalEntryStatus): this {
		return this.set({ status });
	}

	/**
	 * Set a custom account name for the next added lines.
	 *
	 * @param accountCode - The account code to match
	 * @param name - The display name for the account
	 */
	withAccountName(accountCode: string, name: string): this {
		const line = this.linesData.find((l) => l.accountCode === accountCode);
		if (line) {
			line.accountName = name;
		}
		return this;
	}

	/**
	 * Build the JournalEntry domain entity.
	 *
	 * Validates that total debits equal total credits.
	 * If no lines were added, provides a default balanced pair.
	 *
	 * @throws Error if the entry is not balanced
	 */
	build(): JournalEntry {
		if (this.linesData.length === 0) {
			this.withDebit("1041", 1000);
			this.withCredit("7011", 1000);
		}

		// Validate balance before creating domain entity
		const totalDebits = this.linesData
			.filter((l) => l.type === "debit")
			.reduce((sum, l) => sum + l.amount, 0);
		const totalCredits = this.linesData
			.filter((l) => l.type === "credit")
			.reduce((sum, l) => sum + l.amount, 0);

		if (Math.abs(totalDebits - totalCredits) > 0.001) {
			throw new Error(
				`El asiento debe estar balanceado. Debe: ${totalDebits}, Haber: ${totalCredits}`,
			);
		}

		// Ensure all lines use the same currency for JournalEntry domain rules
		const currencies = [...new Set(this.linesData.map((l) => l.currency))];
		if (currencies.length > 1) {
			throw new Error(
				`Todos los asientos deben usar la misma moneda. Encontradas: ${currencies.join(", ")}`,
			);
		}

		const today = new Date();
		const lines = this.linesData.map((ld, index) =>
			JournalLine.create({
				id: `je_line_${index + 1}`,
				accountId: ld.accountCode,
				accountCode: ld.accountCode,
				accountName: ld.accountName ?? `Cuenta ${ld.accountCode}`,
				description: ld.description ?? `Línea ${index + 1}`,
				debit:
					ld.type === "debit"
						? Money.fromAmount(ld.amount, ld.currency)
						: Money.zero(ld.currency),
				credit:
					ld.type === "credit"
						? Money.fromAmount(ld.amount, ld.currency)
						: Money.zero(ld.currency),
			}),
		);

		// Validate date is not in the future
		const entryDate = this.data.date ?? today;
		if (entryDate > new Date()) {
			// Adjust date to be valid for the domain rule
			const adjustedDate = new Date();
			adjustedDate.setHours(adjustedDate.getHours() - 1);
			return this.set({ date: adjustedDate }).build();
		}

		const props = {
			id: this.data.id ?? DEFAULT_ENTRY_ID,
			organizationId: this.data.organizationId ?? DEFAULT_ORGANIZATION_ID,
			entryNumber: this.data.entryNumber ?? DEFAULT_ENTRY_NUMBER,
			date: entryDate,
			gloss: this.data.gloss ?? DEFAULT_GLOSS,
			status: this.data.status ?? DEFAULT_STATUS,
			lines,
			postedBy: this.data.postedBy,
			postedAt: this.data.postedAt,
			createdAt: this.data.createdAt ?? today,
			updatedAt: this.data.updatedAt ?? today,
		} as JournalEntryProps;

		return JournalEntry.create(props);
	}
}
