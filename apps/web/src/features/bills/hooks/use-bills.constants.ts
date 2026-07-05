import type { Bill, BillStatus } from "./use-bills.types";

export const BILLS_STALE_TIME_MS = 60_000;

export const FALLBACK_APPROVER: Bill["approvers"] = [
	{
		initials: "IA",
		color: "bg-muted text-foreground",
		name: "Sistema",
	},
];

export const STATUS_TRANSITIONS: Record<BillStatus, BillStatus[]> = {
	review: ["approval"],
	approval: ["payment", "paid"],
	payment: ["paid"],
	paid: [],
};

export const SUCCESS_MESSAGES: Partial<Record<BillStatus, string>> = {
	approval: "Factura enviada a aprobación",
	payment: "Factura marcada para pago",
	paid: "Factura pagada correctamente",
};
