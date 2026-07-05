export interface ReviewConflictValue {
	original: string | number | boolean | null;
	extracted: string | number | boolean | null;
	isDifferent: boolean;
	label: string;
	confidence: number;
}

export interface ReviewItem {
	id: string;
	filename: string;
	date: string;
	amount: number;
	confidence: number;
	status: "pending" | "conflict";
	conflicts: Record<string, ReviewConflictValue>;
}
