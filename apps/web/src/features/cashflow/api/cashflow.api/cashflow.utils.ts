// ─── Cashflow API Internal Types & Helpers ──────────────────────
// NOT exported publicly — used internally by the cashflowApi service

import type {
	ActualCashflowData,
	CashflowProjectionData,
	CashflowProjectionItem,
	CashflowVarianceData,
} from "./cashflow.types";

// ── Internal API response types ─────────────────────────────────

type DateLike = Date | string;

interface CashflowProjectionApiData {
	companyId: string;
	period: {
		startDate: DateLike;
		endDate: DateLike;
	};
	currency: CashflowProjectionData["currency"];
	summary: CashflowProjectionData["summary"];
	inflows: Array<{
		id: string;
		type: CashflowProjectionItem["type"];
		documentType: CashflowProjectionItem["documentType"] | "retention";
		reference: string;
		amount: number;
		dueDate: DateLike;
		status: CashflowProjectionItem["status"];
		customerOrVendor: string;
	}>;
	outflows: Array<{
		id: string;
		type: CashflowProjectionItem["type"];
		documentType: CashflowProjectionItem["documentType"] | "retention";
		reference: string;
		amount: number;
		dueDate: DateLike;
		status: CashflowProjectionItem["status"];
		customerOrVendor: string;
	}>;
	overdueItems: number;
	weeklyBreakdown: Array<{
		weekStart: DateLike;
		weekEnd: DateLike;
		inflows: number;
		outflows: number;
		netCashflow: number;
	}>;
}

interface ActualCashflowApiData {
	companyId: string;
	period: {
		startDate: DateLike;
		endDate: DateLike;
	};
	currency: ActualCashflowData["currency"];
	actualInflows: number;
	actualOutflows: number;
	netCashflow: number;
	transactionCount: ActualCashflowData["transactionCount"];
}

interface CashflowVarianceApiData {
	companyId: string;
	period: {
		startDate: DateLike;
		endDate: DateLike;
	};
	currency: CashflowVarianceData["currency"];
	projected: CashflowVarianceData["projected"];
	actual: CashflowVarianceData["actual"];
	variance: CashflowVarianceData["variance"];
	alerts: string[];
}

// ── Helpers ─────────────────────────────────────────────────────

function serializeDate(value: DateLike): string {
	if (typeof value === "string") {
		return value;
	}
	return value.toISOString().slice(0, 10);
}

function mapProjectionData(
	data: CashflowProjectionApiData,
): CashflowProjectionData {
	const mapProjectionItem = (
		item: CashflowProjectionApiData["inflows"][number],
	): CashflowProjectionItem => ({
		id: item.id,
		type: item.type,
		documentType: item.documentType,
		reference: item.reference,
		amount: item.amount,
		dueDate: serializeDate(item.dueDate),
		status: item.status,
		customerOrVendor: item.customerOrVendor,
	});

	return {
		companyId: data.companyId,
		period: {
			startDate: serializeDate(data.period.startDate),
			endDate: serializeDate(data.period.endDate),
		},
		currency: data.currency,
		summary: data.summary,
		inflows: data.inflows.map(mapProjectionItem),
		outflows: data.outflows.map(mapProjectionItem),
		overdueItems: data.overdueItems,
		weeklyBreakdown: data.weeklyBreakdown.map((week) => ({
			weekStart: serializeDate(week.weekStart),
			weekEnd: serializeDate(week.weekEnd),
			inflows: week.inflows,
			outflows: week.outflows,
			netCashflow: week.netCashflow,
		})),
	};
}

function mapActualData(data: ActualCashflowApiData): ActualCashflowData {
	return {
		companyId: data.companyId,
		period: {
			startDate: serializeDate(data.period.startDate),
			endDate: serializeDate(data.period.endDate),
		},
		currency: data.currency,
		actualInflows: data.actualInflows,
		actualOutflows: data.actualOutflows,
		netCashflow: data.netCashflow,
		transactionCount: data.transactionCount,
	};
}

function mapVarianceData(data: CashflowVarianceApiData): CashflowVarianceData {
	return {
		companyId: data.companyId,
		period: {
			startDate: serializeDate(data.period.startDate),
			endDate: serializeDate(data.period.endDate),
		},
		currency: data.currency,
		projected: data.projected,
		actual: data.actual,
		variance: data.variance,
		alerts: data.alerts,
	};
}

export type {
	ActualCashflowApiData,
	CashflowProjectionApiData,
	CashflowVarianceApiData,
};
export { mapActualData, mapProjectionData, mapVarianceData, serializeDate };
