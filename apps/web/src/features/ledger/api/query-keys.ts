export const ledgerKeys = {
	all: ["ledger"] as const,
	accounts: (companyId: string) =>
		[...ledgerKeys.all, "accounts", companyId] as const,
	general: (companyId: string, startKey: string, endKey: string) =>
		[...ledgerKeys.all, "general", companyId, startKey, endKey] as const,
	trialBalance: (companyId: string, asOfKey: string) =>
		[...ledgerKeys.all, "trial-balance", companyId, asOfKey] as const,
} as const;
