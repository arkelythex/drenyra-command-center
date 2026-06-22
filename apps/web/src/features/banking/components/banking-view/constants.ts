export type BankingTab = "movimientos" | "cuentas" | "tasas";

export const BANKING_TABS = [
	{ id: "movimientos", label: "Extracto" },
	{ id: "cuentas", label: "Bóvedas" },
	{ id: "tasas", label: "Cambio" },
] as const;
