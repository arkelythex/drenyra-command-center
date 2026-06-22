export const intelligenceKeys = {
	all: ["intelligence"] as const,
	dashboard: (companyId: string) =>
		[...intelligenceKeys.all, "dashboard", companyId] as const,
	anomalies: (companyId: string) =>
		[...intelligenceKeys.all, "anomalies", companyId] as const,
	cashflow: (companyId: string) =>
		[...intelligenceKeys.all, "cashflow", companyId] as const,
	compliance: (companyId: string) =>
		[...intelligenceKeys.all, "compliance", companyId] as const,
	supplier: (companyId: string) =>
		[...intelligenceKeys.all, "supplier", companyId] as const,
	documents: (companyId: string) =>
		[...intelligenceKeys.all, "documents", companyId] as const,
};
