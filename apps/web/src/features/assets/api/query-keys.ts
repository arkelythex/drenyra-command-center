export const assetKeys = {
	all: ["assets"] as const,
	list: (companyId: string) => [...assetKeys.all, companyId] as const,
	depreciation: (assetId: string) =>
		[...assetKeys.all, "depreciation", assetId] as const,
	valuation: (companyId: string) =>
		[...assetKeys.all, "valuation", companyId] as const,
} as const;
