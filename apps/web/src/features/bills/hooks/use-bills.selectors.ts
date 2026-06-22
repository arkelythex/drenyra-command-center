import type { Bill, BillsByStatus } from "./use-bills.types";

export function groupBillsByStatus(bills: Bill[]): BillsByStatus {
	return {
		review: bills.filter((bill) => bill.status === "review"),
		approval: bills.filter((bill) => bill.status === "approval"),
		payment: bills.filter((bill) => bill.status === "payment"),
		paid: bills.filter((bill) => bill.status === "paid"),
	};
}

export function getColumnTotals(billsByStatus: BillsByStatus) {
	return {
		payment: billsByStatus.payment.reduce(
			(total, bill) => total + bill.amount,
			0,
		),
		approval: billsByStatus.approval.reduce(
			(total, bill) => total + bill.amount,
			0,
		),
	};
}
