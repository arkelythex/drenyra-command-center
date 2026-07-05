/**
 * Vendors Hooks - MIGRATED TO EDEN TREATY with UI Logic
 */

import { extractOkDataOrPassthrough } from "@/lib/api-helpers";
import { createCrudHooks } from "@/lib/crud-api";
import { useEntitySearch } from "@/lib/hooks/useEntitySearch";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { vendorKeys } from "../api/query-keys";
import {
	type CreateVendorPayload,
	type UpdateVendorPayload,
	type VendorRecord,
	vendorsApi,
} from "../api/vendors.api";

interface VendorTransaction {
	id: string;
	date: string;
	description: string;
	category?: string;
	amount: number;
}

export interface Vendor {
	id: string;
	taxId: string;
	legalName?: string;
	name?: string;
	tradeName?: string;
	condition?: "HABIDO" | "NO HABIDO";
	totalSpend: number;
	isRetentionAgent?: boolean;
	isGoodTaxpayer?: boolean;
	logo?: string;
	initials?: string;
	transactions: VendorTransaction[];
}

interface VendorStats {
	totalSpend: number;
	criticalCount: number;
	retentionAgents: number;
}

interface UseVendorsResult {
	vendors: Vendor[];
	expandedVendors: string[];
	toggleVendor: (id: string) => void;
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	activeTab: "summary" | "taxes";
	setActiveTab: (tab: "summary" | "taxes") => void;
	stats: VendorStats;
}

function toVendorName(vendor: VendorRecord): string {
	return vendor.name ?? vendor.legalName ?? vendor.tradeName ?? "";
}

function normalizeVendor(vendor: VendorRecord): Vendor {
	return {
		...vendor,
		taxId: vendor.taxId,
		name: toVendorName(vendor),
		totalSpend: Number(vendor.totalSpend ?? 0),
		transactions: Array.isArray(vendor.transactions) ? vendor.transactions : [],
	};
}

export function useVendors(): UseVendorsResult {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	const entity = useEntitySearch<Vendor, VendorStats>(
		{
			queryKey: vendorKeys.list(companyId),
			fetcher: async () => {
				const list = await vendorsApi.list({ companyId });
				return list.map(normalizeVendor);
			},
			searchFields: (v) => [toVendorName(v as VendorRecord), v.taxId],
			tabs: ["summary", "taxes"] as const,
			calculateStats: (items) => ({
				totalSpend: items.reduce((sum, v) => sum + v.totalSpend, 0),
				criticalCount: items.filter((v) => v.condition === "NO HABIDO").length,
				retentionAgents: items.filter((v) => v.isRetentionAgent).length,
			}),
		},
		companyId,
	);

	return {
		vendors: entity.filtered,
		expandedVendors: entity.expandedIds,
		toggleVendor: entity.toggleItem,
		searchQuery: entity.searchQuery,
		setSearchQuery: entity.setSearchQuery,
		activeTab: entity.activeTab as "summary" | "taxes",
		setActiveTab: entity.setActiveTab as (tab: "summary" | "taxes") => void,
		stats: entity.stats,
	};
}

type CreateVendorInput = Partial<CreateVendorPayload>;

const vendorCrud = createCrudHooks<
	Vendor,
	CreateVendorInput,
	UpdateVendorPayload
>({
	key: "vendors",
	list: async (companyId) => {
		const list = await vendorsApi.list({ companyId });
		return list.map(normalizeVendor);
	},
	getById: async (id) => {
		const body = await vendorsApi.getById(id);
		const data = extractOkDataOrPassthrough(body, "vendors.getById");
		return normalizeVendor(data as VendorRecord);
	},
	create: async (companyId, data) => {
		const body = await vendorsApi.create({
			...data,
			companyId,
		} as CreateVendorPayload);
		return extractOkDataOrPassthrough(body, "vendors.create");
	},
	update: async (id, data) => {
		const body = await vendorsApi.update(id, data as UpdateVendorPayload);
		return extractOkDataOrPassthrough(body, "vendors.update");
	},
	delete: async (id) => {
		await vendorsApi.delete(id);
	},
});

export const useCreateVendor = vendorCrud.useCreate;
export const useUpdateVendor = vendorCrud.useUpdate;
export const useDeleteVendor = vendorCrud.useDelete;
