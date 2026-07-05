/** PostgreSQL implementation of JournalEntryRepository over current accounting schema. */

import {
	JournalEntry,
	JournalLine,
} from "@drenyra/domain/entities/JournalEntry";
import type {
	JournalEntryFilters,
	JournalEntryRepository,
} from "@drenyra/domain/repositories/journal-entry.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import {
	and,
	between,
	count,
	desc,
	eq,
	gte,
	lte,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "../client";
import { journalEntries, journalEntryLines, pcgeAccounts } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";

type JournalEntryRow = typeof journalEntries.$inferSelect;
type JournalLineRow = typeof journalEntryLines.$inferSelect;

const periodKey = (date: Date): string => date.toISOString().slice(0, 7);
const centsToMoney = (cents: number): Money => Money.fromCents(cents, "PEN");
const moneyToCents = (money: Money): number => money.getCents();

export class PostgresJournalEntryRepository implements JournalEntryRepository {
	async save(entry: JournalEntry): Promise<void> {
		const companyId = await resolveCompanyIdFromOrganization(
			entry.organizationId,
		);
		await db.transaction(async (tx) => {
			await tx
				.insert(journalEntries)
				.values({
					id: entry.id,
					companyId,
					entryNumber: entry.entryNumber,
					periodKey: periodKey(entry.date),
					date: entry.date,
					gloss: entry.gloss,
					status: entry.status,
					createdAt: entry.createdAt,
					updatedAt: entry.updatedAt,
				})
				.onConflictDoUpdate({
					target: journalEntries.id,
					set: {
						entryNumber: entry.entryNumber,
						periodKey: periodKey(entry.date),
						date: entry.date,
						gloss: entry.gloss,
						status: entry.status,
						updatedAt: entry.updatedAt,
					},
				});

			await tx
				.delete(journalEntryLines)
				.where(eq(journalEntryLines.journalEntryId, entry.id));
			if (entry.lines.length > 0) {
				await tx.insert(journalEntryLines).values(
					entry.lines.map((line) => ({
						id: line.id,
						journalEntryId: entry.id,
						accountCode: line.accountCode,
						description: line.description,
						debitCents: moneyToCents(line.debit),
						creditCents: moneyToCents(line.credit),
						createdAt: new Date(),
					})),
				);
			}
		});
	}

	async findById(id: string): Promise<JournalEntry | null> {
		const row = await db.query.journalEntries.findFirst({
			where: eq(journalEntries.id, id),
		});
		if (!row) return null;
		return this.mapToDomain(row, await this.getLines(id, row.companyId));
	}

	async findAll(organizationId: number): Promise<JournalEntry[]> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const rows = await db.query.journalEntries.findMany({
			where: eq(journalEntries.companyId, companyId),
			orderBy: [desc(journalEntries.date), desc(journalEntries.entryNumber)],
		});
		return Promise.all(
			rows.map(async (row) =>
				this.mapToDomain(
					row,
					await this.getLines(row.id, companyId),
					organizationId,
				),
			),
		);
	}

	async findWithFilters(filters: JournalEntryFilters): Promise<JournalEntry[]> {
		const companyId = await resolveCompanyIdFromOrganization(
			filters.organizationId,
		);
		const rows = await db.query.journalEntries.findMany({
			where: and(...this.buildConditions(companyId, filters)),
			orderBy: [desc(journalEntries.date), desc(journalEntries.entryNumber)],
		});
		let entries = await Promise.all(
			rows.map(async (row) =>
				this.mapToDomain(
					row,
					await this.getLines(row.id, companyId),
					filters.organizationId,
				),
			),
		);

		if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
			entries = entries.filter((entry) => {
				const totalAmount = entry.getTotalDebit().getAmount();
				return (
					(filters.minAmount === undefined ||
						totalAmount >= filters.minAmount) &&
					(filters.maxAmount === undefined || totalAmount <= filters.maxAmount)
				);
			});
		}
		if (filters.documentNumber) return [];
		return entries;
	}

	async delete(id: string): Promise<void> {
		await db.transaction(async (tx) => {
			await tx
				.delete(journalEntryLines)
				.where(eq(journalEntryLines.journalEntryId, id));
			await tx.delete(journalEntries).where(eq(journalEntries.id, id));
		});
	}

	async getNextEntryNumber(
		organizationId: number,
		year: number,
	): Promise<string> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const [last] = await db
			.select({ entryNumber: journalEntries.entryNumber })
			.from(journalEntries)
			.where(
				and(
					eq(journalEntries.companyId, companyId),
					sql`EXTRACT(YEAR FROM ${journalEntries.date}) = ${year}`,
				),
			)
			.orderBy(desc(journalEntries.entryNumber))
			.limit(1);
		const match = last?.entryNumber.match(/AS-\d{4}-(\d+)/);
		const nextNumber = match?.[1] ? Number.parseInt(match[1], 10) + 1 : 1;
		return `AS-${year}-${nextNumber.toString().padStart(4, "0")}`;
	}

	async count(filters?: JournalEntryFilters): Promise<number> {
		if (!filters) {
			const [result] = await db.select({ value: count() }).from(journalEntries);
			return result?.value ?? 0;
		}
		const companyId = await resolveCompanyIdFromOrganization(
			filters.organizationId,
		);
		const [result] = await db
			.select({ value: count() })
			.from(journalEntries)
			.where(and(...this.buildConditions(companyId, filters)));
		return result?.value ?? 0;
	}

	async countByAccountId(accountId: string): Promise<number> {
		const [result] = await db
			.select({ value: count() })
			.from(journalEntryLines)
			.where(eq(journalEntryLines.accountCode, accountId));
		return result?.value ?? 0;
	}

	private buildConditions(
		companyId: string,
		filters: JournalEntryFilters,
	): SQL<unknown>[] {
		const conditions: SQL<unknown>[] = [
			eq(journalEntries.companyId, companyId),
		];
		if (filters.status && filters.status !== "all")
			conditions.push(eq(journalEntries.status, filters.status));
		if (filters.dateFrom && filters.dateTo)
			conditions.push(
				between(journalEntries.date, filters.dateFrom, filters.dateTo),
			);
		else if (filters.dateFrom)
			conditions.push(gte(journalEntries.date, filters.dateFrom));
		else if (filters.dateTo)
			conditions.push(lte(journalEntries.date, filters.dateTo));
		return conditions;
	}

	private async getLines(
		journalEntryId: string,
		companyId: string,
	): Promise<JournalLine[]> {
		const rows = await db
			.select({ line: journalEntryLines, accountName: pcgeAccounts.name })
			.from(journalEntryLines)
			.leftJoin(
				pcgeAccounts,
				and(
					eq(journalEntryLines.accountCode, pcgeAccounts.code),
					eq(pcgeAccounts.companyId, companyId),
				),
			)
			.where(eq(journalEntryLines.journalEntryId, journalEntryId));
		return rows.map(({ line, accountName }) =>
			this.mapLine(line, accountName ?? line.accountCode),
		);
	}

	private mapLine(line: JournalLineRow, accountName: string): JournalLine {
		return JournalLine.create({
			id: line.id,
			accountId: line.accountCode,
			accountCode: line.accountCode,
			accountName,
			description: line.description,
			debit: centsToMoney(line.debitCents),
			credit: centsToMoney(line.creditCents),
		});
	}

	private async mapToDomain(
		raw: JournalEntryRow,
		lines: JournalLine[],
		organizationId?: number,
	): Promise<JournalEntry> {
		return JournalEntry.create({
			id: raw.id,
			organizationId:
				organizationId ??
				(await resolveOrganizationIdFromCompany(raw.companyId)),
			entryNumber: raw.entryNumber,
			date: raw.date,
			gloss: raw.gloss,
			status: raw.status,
			lines,
			createdAt: raw.createdAt,
			updatedAt: raw.updatedAt,
		});
	}
}
