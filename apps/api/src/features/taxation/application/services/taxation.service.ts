import { Money } from "@drenyra/domain";
import type { IGVSummary, TaxCalendar } from "@drenyra/domain";
import {
	type DetractionInvoiceRow,
	type TaxationRepository,
	taxationRepository,
} from "../../infrastructure/taxation.repository";

type TaxationRepoContract = Pick<
	TaxationRepository,
	"getSalesSummary" | "getPaidRevenue" | "findInvoicesAboveAmount"
>;

/**
 * TaxationService class.
 *
 * @example
 * ```ts
 * const value = new TaxationService();
 * console.log(value);
 * ```
 */
export class TaxationService {
	constructor(
		private readonly repository: TaxationRepoContract = taxationRepository,
	) {}

	async getIGVSummary(
		companyId: string,
		year: number,
		month: number,
	): Promise<IGVSummary> {
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const salesSummary = await this.repository.getSalesSummary(
			companyId,
			startDate,
			endDate,
		);
		const sales = this.toMoney(salesSummary.subtotal, "PEN");
		const { money: igvSalesAbs, negative: igvIsNegative } = this.toMoneyAbs(
			salesSummary.igv,
			"PEN",
		);

		return {
			period: `${year}-${month.toString().padStart(2, "0")}`,
			sales: sales.toString(),
			purchases: "0",
			igvSales: igvIsNegative ? "0" : igvSalesAbs.toString(),
			igvPurchases: "0",
			igvToPay: igvIsNegative ? "0" : igvSalesAbs.toString(),
			igvToRefund: igvIsNegative ? igvSalesAbs.toString() : "0",
		};
	}

	async getIncomeTaxProjection(companyId: string, year: number) {
		const revenueSummary = await this.repository.getPaidRevenue(
			companyId,
			year,
		);
		const revenue = this.toMoney(revenueSummary.total, "PEN");
		const taxRate = 0.295;
		const estimatedTax = revenue.multiply(taxRate);

		return {
			year,
			revenue: revenue.toString(),
			taxableIncome: revenue.toString(),
			taxRate,
			estimatedTax: estimatedTax.toString(),
		};
	}

	async getDetractions(companyId: string) {
		const threshold = Money.fromAmount(700, "PEN");
		const detractionRate = 0.1;
		const invoices = await this.repository.findInvoicesAboveAmount(
			companyId,
			threshold.toString(),
		);

		return invoices.map((invoice) =>
			this.mapInvoiceToDetraction(companyId, invoice, detractionRate),
		);
	}

	async getTaxCalendar(
		companyId: string,
		year: number,
	): Promise<TaxCalendar[]> {
		void companyId;

		const calendar: TaxCalendar[] = [];
		for (let month = 1; month <= 12; month++) {
			const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
			const igvDueDate = new Date(year, month, 12);

			calendar.push({
				month: monthStr,
				declarations: [{ type: "IGV", dueDate: igvDueDate, status: "DRAFT" }],
			});
		}

		return calendar;
	}

	private mapInvoiceToDetraction(
		companyId: string,
		invoice: DetractionInvoiceRow,
		detractionRate: number,
	) {
		const currency = invoice.currency === "USD" ? "USD" : "PEN";
		const total = this.toMoney(invoice.totalAmount, currency);
		const detractionAmount = total.multiply(detractionRate);

		return {
			id: invoice.id,
			companyId,
			invoiceId: invoice.id,
			amount: detractionAmount.toString(),
			percentage: detractionRate * 100,
			status: "PENDING" as const,
			dueDate: invoice.dueDate,
		};
	}

	/**
	 * Parse a raw DB amount string to a Money VO.
	 * Clamps to zero when the value is negative — callers that need the sign
	 * (e.g. IGV refund logic) use `toMoneyAbs` + a separate sign check.
	 */
	private toMoney(rawAmount: string, currency: "PEN" | "USD") {
		const amount = Number.parseFloat(rawAmount);
		const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
		return Money.fromAmount(safe, currency);
	}

	/** Returns the absolute Money value and whether the original was negative. */
	private toMoneyAbs(
		rawAmount: string,
		currency: "PEN" | "USD",
	): { money: Money; negative: boolean } {
		const amount = Number.parseFloat(rawAmount);
		const safe = Number.isFinite(amount) ? amount : 0;
		return {
			money: Money.fromAmount(Math.abs(safe), currency),
			negative: safe < 0,
		};
	}
}
