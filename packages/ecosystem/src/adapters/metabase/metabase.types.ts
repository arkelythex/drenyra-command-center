export type MetabaseOperation =
	| { type: "dashboard.list"; page?: number }
	| { type: "dashboard.get"; dashboardId: number }
	| {
			type: "question.run";
			questionId: number;
			parameters?: Record<string, unknown>;
	  }
	| { type: "database.sync"; databaseId: number }
	| { type: "health" };

export interface MetabaseDashboard {
	id: number;
	name: string;
	description?: string;
	collection_id?: number;
	created_at: string;
	updated_at?: string;
}

export interface MetabaseDashboardDetail extends MetabaseDashboard {
	ordered_cards: MetabaseCard[];
}

export interface MetabaseCard {
	id: number;
	card_id: number;
	row: number;
	col: number;
	size_x: number;
	size_y: number;
	card: {
		id: number;
		name: string;
		description?: string;
		dataset_query: Record<string, unknown>;
		display: string;
	};
}

export interface MetabaseQuestionResult {
	json_query: Record<string, unknown>;
	data: {
		rows: unknown[][];
		columns: string[];
		cols: Array<{ name: string; display_name: string; base_type: string }>;
		rows_truncated: number;
	};
	status: string;
}

export interface MetabaseApiResponse<T> {
	data: T;
}
