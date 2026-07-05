/**
 * SimulationEngine — Tipos internos del motor de simulación.
 *
 * @since Jun 2026
 */

export type SimulationCategory =
	| "salary"
	| "revenue"
	| "expense"
	| "tax"
	| "investment";

export interface SimulationParam {
	category: SimulationCategory;
	label: string;
	changePercent: number;
	direction: "increase" | "decrease";
	parameter: string;
	summaryLine: string;
}

export interface SimulatedAccount {
	account: string;
	name: string;
	debit: number;
	credit: number;
}
