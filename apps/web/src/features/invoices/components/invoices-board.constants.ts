import type { InvoiceStatus } from "../hooks/useInvoicesBoard";

export const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
	draft: ["sent"],
	sent: ["paid"],
	overdue: ["paid"],
	paid: [],
};

export const BOARD_TABS = [
	{ id: "summary", label: "Tablero" },
	{ id: "aging", label: "Antigüedad" },
] as const;

export type InvoicesBoardTabId = (typeof BOARD_TABS)[number]["id"];
