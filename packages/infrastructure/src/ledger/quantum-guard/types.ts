export interface LedgerGuardResult {
	allowed: boolean;
	reason?: string;
}

export interface PeriodStatus {
	isClosed: boolean;
	closedAt?: Date;
	entriesCount: number;
}
