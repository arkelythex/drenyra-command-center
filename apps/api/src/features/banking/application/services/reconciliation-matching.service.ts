/**
 * Reconciliation Matching Engine — finds best document matches for bank transactions.
 */

import {
	bankTransactions,
	businessPartners,
} from "@arkelythex/persistence/schema";
import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, lte } from "@arkelythex/persistence/query";
import { BillQueryService } from "../../../billing/bill/application/services/bill.query-service";
import { InvoiceQueryService } from "../../../billing/invoice/application/services/invoice.query-service";
import type {
	BankTransactionLike,
	MatchCandidate,
	MatchContext,
} from "../../domain/services/matching-strategy";
import {
	AmountDateMatchingStrategy,
	AmountEntityMatchingStrategy,
	FuzzyEntityMatchingStrategy,
	type MatchingStrategy,
	PartialPaymentMatchingStrategy,
	ReferenceMatchingStrategy,
} from "../../domain/services/matching-strategy";
import type { RawBankTransaction } from "./reconciliation.types";

const DATE_WINDOW_DAYS = 3;

export class MatchingEngine {
	private readonly strategies: MatchingStrategy[];
	private readonly invoiceQueryService: InvoiceQueryService;
	private readonly billQueryService: BillQueryService;

	constructor(
		strategies?: MatchingStrategy[],
		invoiceQueryService?: InvoiceQueryService,
		billQueryService?: BillQueryService,
	) {
		this.strategies = strategies ?? [
			new ReferenceMatchingStrategy(),
			new AmountDateMatchingStrategy(),
			new AmountEntityMatchingStrategy(),
			new FuzzyEntityMatchingStrategy(),
			new PartialPaymentMatchingStrategy(),
		];
		this.invoiceQueryService = invoiceQueryService ?? new InvoiceQueryService();
		this.billQueryService = billQueryService ?? new BillQueryService();
	}

	async findBestMatch(
		tx: RawBankTransaction,
		companyId: string,
		accountId: string,
	): Promise<MatchCandidate | null> {
		const context = this.buildContext(companyId, accountId);
		const candidates: MatchCandidate[] = [];

		for (const strategy of this.strategies.sort(
			(a, b) => b.priority - a.priority,
		)) {
			const candidate = await strategy.match(tx, context);
			if (candidate) candidates.push(candidate);
		}

		if (candidates.length === 0) return null;
		return candidates.reduce((best, current) =>
			current.score > best.score ? current : best,
		);
	}

	private buildContext(companyId: string, accountId: string): MatchContext {
		return {
			companyId,
			dateWindowDays: DATE_WINDOW_DAYS,
			normalizeReference: this.normalizeReference,
			findInvoiceByReference: async (cid, reference) => {
				return this.invoiceQueryService.findByNumber(cid, reference);
			},
			findBillByReference: async (cid, reference) => {
				return this.billQueryService.findByNumber(cid, reference);
			},
			findInvoicesByAmountAndDate: async (cid, amount, start, end) => {
				return this.invoiceQueryService.findByAmountAndDateRange(cid, amount, {
					start,
					end,
				});
			},
			findBillsByAmountAndDate: async (cid, amount, start, end) => {
				return this.billQueryService.findByAmountAndDateRange(cid, amount, {
					start,
					end,
				});
			},
			findPartners: async (cid) => {
				return db.query.businessPartners.findMany({
					where: eq(businessPartners.companyId, cid),
				});
			},
			findInvoicesByAmountAndCustomer: async (cid, customerId, amount) => {
				return this.invoiceQueryService.findByCustomer(cid, customerId, amount);
			},
			findBillsByAmountAndVendor: async (cid, vendorId, amount) => {
				return this.billQueryService.findByVendor(cid, vendorId, amount);
			},
			findPartialPaymentMatch: async (tx) => {
				return this.detectPartialPayments(tx, companyId, accountId);
			},
		};
	}

	private normalizeReference(ref: string): string {
		return ref
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	private async detectPartialPayments(
		tx: BankTransactionLike,
		companyId: string,
		accountId: string,
	): Promise<MatchCandidate | null> {
		const dateWindow = this.calculateDateWindow(
			new Date(tx.transactionDate),
			DATE_WINDOW_DAYS,
		);

		const unreconciled = await db.query.bankTransactions.findMany({
			where: and(
				eq(bankTransactions.companyId, companyId),
				eq(bankTransactions.accountId, accountId),
				eq(bankTransactions.isReconciled, false),
				gte(bankTransactions.transactionDate, dateWindow.start),
				lte(bankTransactions.transactionDate, dateWindow.end),
			),
		});

		const pool = (unreconciled as unknown as RawBankTransaction[]).filter(
			(item) => item.type === tx.type,
		);

		if (pool.length < 2) return null;

		const sum = this.sumAmounts(pool.map((item) => item.amount));

		if (tx.type === "CREDIT") {
			const invoicesOpen = await this.invoiceQueryService.findPendingByAmount(
				companyId,
				sum,
			);
			const invoice = invoicesOpen.find((item) =>
				this.amountEquals(item.balanceDue, sum),
			);
			if (invoice) {
				return {
					documentId: invoice.id,
					documentType: "INVOICE",
					score: 60,
					criteria: "PARTIAL",
					relatedTransactionIds: pool.map((item) => item.id),
				};
			}
			return null;
		}

		const billsOpen = await this.billQueryService.findAll(companyId);
		const bill = billsOpen.find((item) =>
			this.amountEquals(item.totalAmount, sum),
		);
		if (bill) {
			return {
				documentId: bill.id,
				documentType: "BILL",
				score: 60,
				criteria: "PARTIAL",
				relatedTransactionIds: pool.map((item) => item.id),
			};
		}

		return null;
	}

	private calculateDateWindow(
		date: Date,
		days: number,
	): { start: string; end: string } {
		const start = new Date(date);
		const end = new Date(date);
		start.setDate(start.getDate() - days);
		end.setDate(end.getDate() + days);
		return { start: this.formatDate(start), end: this.formatDate(end) };
	}

	private formatDate(date: Date): string {
		return date.toISOString().split("T")[0] ?? "";
	}

	private sumAmounts(values: string[]): string {
		const cents = values.reduce((acc, value) => {
			const parsed = parseFloat(value);
			return acc + Math.round(parsed * 100);
		}, 0);
		return (cents / 100).toFixed(2);
	}

	private amountEquals(a: string | null | undefined, b: string): boolean {
		if (!a) return false;
		const centsA = Math.round(parseFloat(a) * 100);
		const centsB = Math.round(parseFloat(b) * 100);
		return centsA === centsB;
	}

	static amountToCents(amount: string): number {
		const parsed = Number.parseFloat(amount);
		if (!Number.isFinite(parsed)) return 0;
		return Math.round(parsed * 100);
	}
}
