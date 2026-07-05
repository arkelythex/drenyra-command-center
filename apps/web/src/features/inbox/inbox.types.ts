export interface InboxQueryFilters {
	companyId: string;
	type?: "INCOME" | "EXPENSE";
	partnerId?: string;
	status?: "DRAFT";
}

export interface InboxPartnerSummary {
	legalName?: string | null;
}

export interface InboxTransactionRecord {
	id: string;
	partner?: InboxPartnerSummary | null;
	notes?: string | null;
	totalAmount?: string | number | null;
	issueDate?: string | null;
	xmlUrl?: string | null;
	series?: string | number | null;
	number?: string | number | null;
	currency?: string | null;
}

export interface InboxTransaction {
	id: string;
	vendor: string;
	amount: number;
	date: string;
	suggestedCategory: string;
	suggestedCode: string;
	isAiSuggestion: boolean;
	status: "pending" | "confirmed" | "watching" | "closed";
	assignee?: string;
	documentName?: string;
}

export interface InboxTimelineMonth {
	name: string;
	count: number;
	active?: boolean;
}
