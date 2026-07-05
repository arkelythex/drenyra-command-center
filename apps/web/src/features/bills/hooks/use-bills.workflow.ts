import { runtimeConfig } from "@/lib/runtime-config";
import { billsApi } from "../api/bills.api";
import type { Bill, BillStatus } from "./use-bills.types";

export async function persistBillStatusTransition(params: {
	billId: string;
	nextStatus: BillStatus;
	currentBill: Bill;
}): Promise<void> {
	const { billId, nextStatus, currentBill } = params;

	if (runtimeConfig.mockMode) return;

	if (nextStatus === "approval") {
		await billsApi.updateStatus(billId, "SENT");
		return;
	}

	if (nextStatus === "payment") {
		await billsApi.updateStatus(billId, "OVERDUE");
		return;
	}

	if (nextStatus === "paid") {
		await billsApi.pay(billId, currentBill.amount, currentBill.currency);
	}
}
