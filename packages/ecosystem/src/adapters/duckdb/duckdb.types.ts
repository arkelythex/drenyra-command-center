/**
 * DuckDB-specific types for the Drenyra ecosystem connector.
 */

export type DuckdbOperation =
	| { type: "query"; sql: string; params?: unknown[] }
	| {
			type: "view.cashflow";
			companyRuc?: string;
			fromDate?: string;
			toDate?: string;
	  }
	| { type: "view.sire"; period?: string; docType?: string }
	| { type: "view.igv"; fromDate?: string; toDate?: string }
	| { type: "health" };

export interface DuckdbQueryResult {
	columns: string[];
	rows: Array<Record<string, unknown>>;
	rowCount: number;
}

export interface DuckdbRefreshEvent {
	view: "cashflow_daily" | "sire_summary" | "igv_trends";
	companyRuc: string;
	period?: string;
}
