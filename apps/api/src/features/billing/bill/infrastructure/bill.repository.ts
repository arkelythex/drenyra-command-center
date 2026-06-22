/**
 * Bill Repository - Infrastructure Layer
 * Implements IBillRepository using Drizzle ORM
 *
 * Clean Architecture:
 * - Infrastructure implements domain interfaces
 * - Uses database schema and client from infrastructure package
 * - Maps between domain entities and database records
 */

import { Money } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import {
	and,
	desc,
	eq,
	gte,
	like,
	lt,
	lte,
	sql,
} from "@arkelythex/persistence/query";
import { billItems, bills } from "@arkelythex/persistence/schema";
import type { SQL } from "drizzle-orm";
import {
	withCompanyRlsTransaction,
	withTenantRlsTransaction,
} from "../../../security/rls-db-context";
import {
	Bill,
	type BillItem,
	type BillStatus,
	type Currency,
} from "../domain/bill.entity";
import type {
	BillListFilters,
	BillListResult,
	IBillRepository,
} from "../domain/bill.repository.interface";

type BillRow = typeof bills.$inferSelect;
type BillItemRow = typeof billItems.$inferSelect;

/**
 * BillRepository Implementation
 * Uses PostgreSQL via Drizzle ORM for persistence
 *
 * @example
 * ```ts
 * const repo = new BillRepository();
 * await repo.findById('bill_123');
 * ```
 */
export class BillRepository implements IBillRepository {
	/**
	 * Create a new bill with its items
	 */
	async create(bill: Bill): Promise<Bill> {
		return withCompanyRlsTransaction(bill.companyId, async (tx) => {
			const [savedBill] = await tx
				.insert(bills)
				.values({
					id: bill.id,
					companyId: bill.companyId,
					vendorId: bill.vendorId,
					billNumber: bill.billNumber,
					issueDate: bill.issueDate,
					dueDate: bill.dueDate,
					currency: bill.currency,
					exchangeRate: String(bill.exchangeRate),
					subtotalAmount: bill.subtotal.toString(),
					igvAmount: bill.igvAmount.toString(),
					totalAmount: bill.totalAmount.toString(),
					status: bill.status,
					notes: bill.notes,
					tags: bill.tags,
					createdAt: bill.createdAt,
					updatedAt: bill.updatedAt,
				})
				.returning();

			if (bill.items.length > 0) {
				await tx.insert(billItems).values(
					bill.items.map((item) => ({
						id: item.id,
						billId: bill.id,
						productId: item.productId,
						description: item.description,
						quantity: String(item.quantity),
						unitPrice: item.unitPrice.toString(),
						total: item.total.toString(),
						createdAt: new Date(),
					})),
				);
			}

			const items = await tx
				.select()
				.from(billItems)
				.where(eq(billItems.billId, bill.id));

			return this.mapToDomain(savedBill, items);
		});
	}

	/**
	 * Find bill by ID
	 * Uses Drizzle relational queries to avoid N+1 problem
	 */
	async findById(id: string): Promise<Bill | null> {
		const companyId = await this.resolveCompanyIdByBillId(id);

		if (!companyId) {
			return null;
		}

		const result = await withCompanyRlsTransaction(companyId, async (tx) => {
			return await tx.query.bills.findFirst({
				where: eq(bills.id, id),
				with: {
					items: true,
				},
			});
		});

		if (!result) {
			return null;
		}

		return this.mapToDomain(result, result.items);
	}

	/**
	 * Find bill by bill number
	 * Uses Drizzle relational queries to avoid N+1 problem
	 */
	async findByNumber(
		billNumber: string,
		companyId: string,
	): Promise<Bill | null> {
		const result = await db.query.bills.findFirst({
			where: and(
				eq(bills.billNumber, billNumber),
				eq(bills.companyId, companyId),
			),
			with: {
				items: true,
			},
		});

		if (!result) {
			return null;
		}

		return this.mapToDomain(result, result.items);
	}

	/**
	 * List bills with filters and pagination
	 */
	async list(filters: BillListFilters): Promise<BillListResult> {
		const {
			companyId,
			status,
			vendorId,
			startDate,
			endDate,
			minAmount,
			maxAmount,
			search,
			limit = 20,
			offset = 0,
		} = filters;

		// Build where conditions dynamically
		const conditions: SQL<unknown>[] = [eq(bills.companyId, companyId)];

		if (status) {
			conditions.push(eq(bills.status, status));
		}

		if (vendorId) {
			conditions.push(eq(bills.vendorId, vendorId));
		}

		if (startDate) {
			conditions.push(gte(bills.issueDate, startDate));
		}

		if (endDate) {
			conditions.push(lte(bills.issueDate, endDate));
		}

		if (minAmount !== undefined) {
			conditions.push(gte(bills.totalAmount, String(minAmount)));
		}

		if (maxAmount !== undefined) {
			conditions.push(lte(bills.totalAmount, String(maxAmount)));
		}

		if (search) {
			conditions.push(like(bills.billNumber, `%${search}%`));
		}

		const whereClause =
			conditions.length > 1 ? and(...conditions) : conditions[0];

		// Get total count
		const countResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(bills)
			.where(whereClause);

		const total = countResult[0]?.count || 0;

		// Get bills with items (Single JOIN - no N+1)
		const results = await db.query.bills.findMany({
			where: whereClause,
			orderBy: [desc(bills.createdAt)],
			limit,
			offset,
			with: {
				items: true,
			},
		});

		// Map to domain (items already loaded)
		const domainBills = results.map((bill) =>
			this.mapToDomain(bill, bill.items),
		);

		return {
			bills: domainBills,
			total,
			limit,
			offset,
		};
	}

	/**
	 * Update bill
	 */
	async update(bill: Bill): Promise<Bill> {
		return withCompanyRlsTransaction(bill.companyId, async (tx) => {
			const [updated] = await tx
				.update(bills)
				.set({
					vendorId: bill.vendorId,
					billNumber: bill.billNumber,
					issueDate: bill.issueDate,
					dueDate: bill.dueDate,
					currency: bill.currency,
					exchangeRate: String(bill.exchangeRate),
					subtotalAmount: bill.subtotal.toString(),
					igvAmount: bill.igvAmount.toString(),
					totalAmount: bill.totalAmount.toString(),
					status: bill.status,
					notes: bill.notes,
					tags: bill.tags,
					updatedAt: new Date(),
				})
				.where(eq(bills.id, bill.id))
				.returning();

			const persistedItems = await tx
				.select()
				.from(billItems)
				.where(eq(billItems.billId, bill.id));

			return this.mapToDomain(updated, persistedItems);
		});
	}

	/**
	 * Update bill status
	 */
	async updateStatus(
		id: string,
		status: BillStatus,
		notes?: string,
		legacyUserId?: string,
	): Promise<void> {
		const payload: {
			status: BillStatus;
			updatedAt: Date;
			notes?: string;
		} = {
			status,
			updatedAt: new Date(),
		};

		if (typeof notes === "string") {
			payload.notes = notes;
		}

		const companyId = await this.resolveCompanyIdByBillId(id);

		if (!companyId) {
			return;
		}

		const runInTenantContext = legacyUserId
			? <T>(work: Parameters<typeof withTenantRlsTransaction<T>>[1]) =>
					withTenantRlsTransaction({ companyId, userId: legacyUserId }, work)
			: <T>(work: Parameters<typeof withCompanyRlsTransaction<T>>[1]) =>
					withCompanyRlsTransaction(companyId, work);

		await runInTenantContext(async (tx) => {
			await tx.update(bills).set(payload).where(eq(bills.id, id));
		});
	}

	/**
	 * Apply payment to bill
	 */
	async applyPayment(id: string, amount: string): Promise<void> {
		const companyId = await this.resolveCompanyIdByBillId(id);

		if (!companyId) {
			throw new Error("Bill not found");
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			const bill = await tx.query.bills.findFirst({
				where: eq(bills.id, id),
			});

			if (!bill) {
				throw new Error("Bill not found");
			}

			// Note: In a full implementation, you'd track paid amount separately
			// For now, we just update the status if fully paid
			const currentBalance = Number(bill.totalAmount) - Number(amount);

			await tx
				.update(bills)
				.set({
					status: currentBalance <= 0 ? "PAID" : bill.status,
					updatedAt: new Date(),
				})
				.where(eq(bills.id, id));
		});
	}

	/**
	 * Delete bill
	 */
	async delete(id: string): Promise<void> {
		const companyId = await this.resolveCompanyIdByBillId(id);

		if (!companyId) {
			return;
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			// Delete items first
			await tx.delete(billItems).where(eq(billItems.billId, id));

			// Delete bill
			await tx.delete(bills).where(eq(bills.id, id));
		});
	}

	/**
	 * Check if bill number exists
	 */
	async exists(billNumber: string, companyId: string): Promise<boolean> {
		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(bills)
			.where(
				and(eq(bills.billNumber, billNumber), eq(bills.companyId, companyId)),
			);

		return (result[0]?.count || 0) > 0;
	}

	/**
	 * Get overdue bills
	 */
	async getOverdue(
		companyId: string,
		asOfDate: Date = new Date(),
	): Promise<Bill[]> {
		const results = await db.query.bills.findMany({
			where: and(
				eq(bills.companyId, companyId),
				lt(bills.dueDate, asOfDate),
				eq(bills.status, "DRAFT"),
			),
			orderBy: [bills.dueDate],
		});

		// Fetch items for each bill
		return await Promise.all(
			results.map(async (bill) => {
				const items = await db
					.select()
					.from(billItems)
					.where(eq(billItems.billId, bill.id));
				return this.mapToDomain(bill, items);
			}),
		);
	}

	/**
	 * Get bills by vendor
	 */
	async getByVendor(vendorId: string, limit: number = 50): Promise<Bill[]> {
		const results = await db.query.bills.findMany({
			where: eq(bills.vendorId, vendorId),
			orderBy: [desc(bills.createdAt)],
			limit,
		});

		// Fetch items for each bill
		return await Promise.all(
			results.map(async (bill) => {
				const items = await db
					.select()
					.from(billItems)
					.where(eq(billItems.billId, bill.id));
				return this.mapToDomain(bill, items);
			}),
		);
	}

	private async resolveCompanyIdByBillId(id: string): Promise<string | null> {
		const record = await db.query.bills.findFirst({
			columns: {
				companyId: true,
			},
			where: eq(bills.id, id),
		});

		return record?.companyId ?? null;
	}

	/**
	 * Map database record to domain entity
	 */
	private mapToDomain(record: BillRow, items: BillItemRow[]): Bill {
		const currency = record.currency as Currency;

		const domainItems: BillItem[] = items.map((item) => ({
			id: item.id,
			productId: item.productId ?? undefined,
			description: item.description,
			quantity: Number(item.quantity),
			unitPrice: Money.fromAmount(Number(item.unitPrice), currency),
			total: Money.fromAmount(Number(item.total), currency),
		}));

		const totalAmount = Money.fromAmount(Number(record.totalAmount), currency);
		const balanceDue =
			record.status === "PAID" ? Money.zero(currency) : totalAmount;
		const tags = Array.isArray(record.tags)
			? record.tags.filter((tag): tag is string => typeof tag === "string")
			: undefined;

		return new Bill(
			record.id,
			record.companyId,
			record.vendorId,
			record.billNumber,
			new Date(record.issueDate),
			new Date(record.dueDate),
			currency,
			Number(record.exchangeRate),
			domainItems,
			Money.fromAmount(Number(record.subtotalAmount), currency),
			Money.fromAmount(Number(record.igvAmount), currency),
			totalAmount,
			balanceDue,
			record.status,
			record.notes ?? undefined,
			tags,
			new Date(record.createdAt),
			new Date(record.updatedAt),
		);
	}
}
