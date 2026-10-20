/**
 * Banking Repository
 * Data access layer for bank accounts and transactions
 */

import { db } from "@drenyra/persistence/client";
import { and, desc, eq, gte, lte } from "@drenyra/persistence/query";
import { bankAccounts, bankTransactions } from "@drenyra/persistence/schema";
import { withCompanyRlsTransaction } from "../../security/rls-db-context";
import {
	centsToDecimal,
	decimalToCents,
	planStatementImport,
	type StatementRow,
} from "../application/statement-import";
import type { IBankingRepository } from "../domain/ports/banking-repository.port";

/**
 * Database record shape for `bank_accounts`.
 *
 * @example
 * ```ts
 * const row = { id: "acc_1", companyId: "cmp_1" } as BankAccountRecord;
 * ```
 */
export interface BankAccountRecord {
	id: string;
	companyId: string;
	accountName: string;
	accountNumber: string;
	accountType: string;
	bankName: string;
	bankCode: string | null;
	branch: string | null;
	currency: string;
	currentBalance: string;
	availableBalance: string | null;
	isActive: boolean | null;
	isDefault: boolean | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}

/**
 * Database record shape for `bank_transactions`.
 *
 * @example
 * ```ts
 * const row = { id: "tx_1", companyId: "cmp_1", amount: "10.00" } as BankTransactionRecord;
 * ```
 */
export interface BankTransactionRecord {
	id: string;
	companyId: string;
	accountId: string;
	transactionDate: string;
	description: string;
	reference: string | null;
	type: string;
	amount: string;
	balance: string | null;
	category: string | null;
	tags: string | null;
	isReconciled: boolean | null;
	reconciledAt: Date | null;
	reconciledBy: string | null;
	invoiceId: string | null;
	billId: string | null;
	createdAt: Date | null;
	importedFrom: string | null;
}

/**
 * Persistence adapter for Banking (accounts + transactions).
 *
 * @example
 * ```ts
 * const repo = new BankingRepository();
 * const accounts = await repo.findAllAccounts("cmp_1");
 * ```
 */
export class BankingRepository implements IBankingRepository {
	async findAllAccounts(companyId: string): Promise<BankAccountRecord[]> {
		return await withCompanyRlsTransaction(companyId, async (tx) => {
			return (await tx.query.bankAccounts.findMany({
				where: eq(bankAccounts.companyId, companyId),
				orderBy: [desc(bankAccounts.isDefault), bankAccounts.accountName],
			})) as BankAccountRecord[];
		});
	}

	async findAccountById(id: string): Promise<BankAccountRecord | null> {
		const companyId = await this.resolveCompanyIdByAccountId(id);

		if (!companyId) {
			return null;
		}

		return await withCompanyRlsTransaction(companyId, async (tx) => {
			const result = await tx.query.bankAccounts.findFirst({
				where: eq(bankAccounts.id, id),
			});
			return result as BankAccountRecord | null;
		});
	}

	async findAccountByNumber(
		companyId: string,
		accountNumber: string,
	): Promise<BankAccountRecord | null> {
		return await withCompanyRlsTransaction(companyId, async (tx) => {
			const result = await tx.query.bankAccounts.findFirst({
				where: and(
					eq(bankAccounts.companyId, companyId),
					eq(bankAccounts.accountNumber, accountNumber),
				),
			});
			return result as BankAccountRecord | null;
		});
	}

	async createAccount(
		data: Omit<BankAccountRecord, "id" | "createdAt" | "updatedAt">,
	): Promise<BankAccountRecord> {
		return await withCompanyRlsTransaction(data.companyId, async (tx) => {
			const [account] = await tx
				.insert(bankAccounts)
				.values({
					companyId: data.companyId,
					accountName: data.accountName,
					accountNumber: data.accountNumber,
					accountType: data.accountType,
					bankName: data.bankName,
					bankCode: data.bankCode,
					branch: data.branch,
					currency: data.currency,
					currentBalance: data.currentBalance,
					availableBalance: data.availableBalance,
					isActive: data.isActive ?? true,
					isDefault: data.isDefault ?? false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return account as BankAccountRecord;
		});
	}

	async updateAccount(
		id: string,
		data: Partial<BankAccountRecord>,
	): Promise<void> {
		const companyId = await this.resolveCompanyIdByAccountId(id);

		if (!companyId) {
			return;
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			await tx
				.update(bankAccounts)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(bankAccounts.id, id));
		});
	}

	async softDeleteAccount(id: string): Promise<void> {
		const companyId = await this.resolveCompanyIdByAccountId(id);

		if (!companyId) {
			return;
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			await tx
				.update(bankAccounts)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(bankAccounts.id, id));
		});
	}

	async findTransactions(
		accountId: string,
		options?: {
			startDate?: Date;
			endDate?: Date;
			isReconciled?: boolean;
			limit?: number;
			offset?: number;
		},
	): Promise<BankTransactionRecord[]> {
		const companyId = await this.resolveCompanyIdByAccountId(accountId);

		if (!companyId) {
			return [];
		}

		const conditions = [eq(bankTransactions.accountId, accountId)];

		if (options?.startDate) {
			conditions.push(
				gte(
					bankTransactions.transactionDate,
					this.formatDate(options.startDate),
				),
			);
		}
		if (options?.endDate) {
			conditions.push(
				lte(bankTransactions.transactionDate, this.formatDate(options.endDate)),
			);
		}
		if (options?.isReconciled !== undefined) {
			conditions.push(eq(bankTransactions.isReconciled, options.isReconciled));
		}

		return await withCompanyRlsTransaction(companyId, async (tx) => {
			return (await tx.query.bankTransactions.findMany({
				where: and(...conditions),
				orderBy: [desc(bankTransactions.transactionDate)],
				limit: options?.limit ?? 100,
				offset: options?.offset ?? 0,
			})) as unknown as BankTransactionRecord[];
		});
	}

	async findTransactionById(id: string): Promise<BankTransactionRecord | null> {
		const companyId = await this.resolveCompanyIdByTransactionId(id);

		if (!companyId) {
			return null;
		}

		return await withCompanyRlsTransaction(companyId, async (tx) => {
			const result = await tx.query.bankTransactions.findFirst({
				where: eq(bankTransactions.id, id),
			});
			return result as unknown as BankTransactionRecord | null;
		});
	}

	async findUnreconciledTransactions(
		companyId: string,
		accountId: string,
	): Promise<BankTransactionRecord[]> {
		return await withCompanyRlsTransaction(companyId, async (tx) => {
			return (await tx.query.bankTransactions.findMany({
				where: and(
					eq(bankTransactions.companyId, companyId),
					eq(bankTransactions.accountId, accountId),
					eq(bankTransactions.isReconciled, false),
				),
				orderBy: [desc(bankTransactions.transactionDate)],
			})) as unknown as BankTransactionRecord[];
		});
	}

	async createTransaction(
		data: Omit<BankTransactionRecord, "id" | "createdAt">,
	): Promise<BankTransactionRecord> {
		return await withCompanyRlsTransaction(data.companyId, async (tx) => {
			const values: typeof bankTransactions.$inferInsert = {
				companyId: data.companyId,
				accountId: data.accountId,
				transactionDate: data.transactionDate,
				description: data.description,
				reference: data.reference,
				type: data.type,
				amount: data.amount,
				balance: data.balance,
				category: data.category,
				tags: data.tags,
				isReconciled: false,
				importedFrom: data.importedFrom ?? "MANUAL",
			};
			const [transaction] = await tx
				.insert(bankTransactions)
				.values(values)
				.returning();

			return transaction as unknown as BankTransactionRecord;
		});
	}

	async countUnreconciled(companyId: string): Promise<number> {
		return await withCompanyRlsTransaction(companyId, async (tx) => {
			const result = await tx.query.bankTransactions.findMany({
				where: and(
					eq(bankTransactions.companyId, companyId),
					eq(bankTransactions.isReconciled, false),
				),
			});
			return result.length;
		});
	}

	private formatDate(date: Date): string {
		return date.toISOString().split("T")[0];
	}

	private async resolveCompanyIdByAccountId(
		id: string,
	): Promise<string | null> {
		const account = await db.query.bankAccounts.findFirst({
			columns: {
				companyId: true,
			},
			where: eq(bankAccounts.id, id),
		});

		return account?.companyId ?? null;
	}

	private async resolveCompanyIdByTransactionId(
		id: string,
	): Promise<string | null> {
		const transaction = await db.query.bankTransactions.findFirst({
			columns: {
				companyId: true,
			},
			where: eq(bankTransactions.id, id),
		});

		return transaction?.companyId ?? null;
	}

	/**
	 * Import a bank statement into an account of this company, all or nothing.
	 * The account row is locked so concurrent imports keep a consistent
	 * running balance. Returns null when the account is not this company's.
	 */
	async importStatement(
		companyId: string,
		accountId: string,
		statement: readonly StatementRow[],
		source: "CSV" | "BANK_API" | "MT940",
	): Promise<{ imported: number; skipped: number } | null> {
		return await withCompanyRlsTransaction(companyId, async (tx) => {
			const [account] = await tx
				.select({ currentBalance: bankAccounts.currentBalance })
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.id, accountId),
						eq(bankAccounts.companyId, companyId),
					),
				)
				.for("update");
			if (!account) return null;
			if (statement.length === 0) return { imported: 0, skipped: 0 };

			const dates = statement.map((row) => row.date).sort();
			const storedRows = await tx
				.select({
					date: bankTransactions.transactionDate,
					description: bankTransactions.description,
					reference: bankTransactions.reference,
					type: bankTransactions.type,
					amount: bankTransactions.amount,
				})
				.from(bankTransactions)
				.where(
					and(
						eq(bankTransactions.accountId, accountId),
						eq(bankTransactions.companyId, companyId),
						gte(bankTransactions.transactionDate, dates[0] ?? ""),
						lte(bankTransactions.transactionDate, dates.at(-1) ?? ""),
					),
				);
			const stored = storedRows.flatMap((row): StatementRow[] => {
				try {
					return [
						{
							date: String(row.date),
							description: row.description,
							reference: row.reference,
							type: row.type === "DEBIT" ? "DEBIT" : "CREDIT",
							amountCents: Math.abs(decimalToCents(String(row.amount))),
						},
					];
				} catch {
					// A legacy row with a sub-cent amount matches no statement row.
					return [];
				}
			});

			const plan = planStatementImport(
				decimalToCents(String(account.currentBalance ?? "0")),
				stored,
				statement,
			);

			if (plan.rows.length > 0) {
				await tx.insert(bankTransactions).values(
					plan.rows.map((row) => ({
						companyId,
						accountId,
						transactionDate: row.date,
						description: row.description,
						reference: row.reference ?? null,
						type: row.type,
						amount: centsToDecimal(row.amountCents),
						balance: centsToDecimal(row.balanceCents),
						isReconciled: false,
						importedFrom: source,
						source: "CSV_IMPORT",
					})),
				);
				await tx
					.update(bankAccounts)
					.set({
						currentBalance: centsToDecimal(plan.closingBalanceCents),
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(bankAccounts.id, accountId),
							eq(bankAccounts.companyId, companyId),
						),
					);
			}

			return { imported: plan.rows.length, skipped: plan.skipped };
		});
	}
}

/**
 * Default repository instance used by Banking application services.
 *
 * @example
 * ```ts
 * const accounts = await bankingRepository.findAllAccounts("cmp_1");
 * ```
 */
export const bankingRepository = new BankingRepository();
