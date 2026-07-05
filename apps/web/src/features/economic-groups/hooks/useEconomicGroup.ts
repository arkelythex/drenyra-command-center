/**
 * useEconomicGroup Hook
 * Manage multi-RUC economic groups
 */

import { toast } from "sonner";
import { create } from "zustand";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import { captureError, trackEvent } from "@/lib/monitoring";
import { economicGroupsTreatyClient } from "../api/economic-group-treaty-client";

interface EconomicGroup {
	id: string;
	groupName: string;
	groupCode: string;
	subscriptionTier: string;
	monthlyFee: string;
	maxCompanies: number;
	isActive: boolean;
	createdAt: Date;
}

interface Company {
	id: string;
	ruc: string;
	businessName: string;
	tradeName?: string | null;
	isPrimary: boolean;
	isActive: boolean;
	economicGroupId?: string | null;
}

interface ApiCompany {
	id: string;
	ruc: string;
	businessName: string;
	tradeName?: string | null;
	isPrimary: boolean;
	isActive?: boolean;
	economicGroupId?: string | null;
}

interface EconomicGroupDetailResponse {
	group: EconomicGroup;
	companies?: ApiCompany[];
	pricing?: EconomicGroupState["pricing"];
	savings?: EconomicGroupState["savings"];
}

interface CreateEconomicGroupResponse {
	group: EconomicGroup;
}

interface AddCompanyResponse {
	message?: string;
}

interface EconomicGroupCompaniesResponse {
	companies?: ApiCompany[];
}

function normalizeCompany(company: ApiCompany): Company {
	return {
		...company,
		isActive: company.isActive ?? true,
	};
}

interface EconomicGroupState {
	currentGroup: EconomicGroup | null;
	companies: Company[];
	pricing: {
		drenyra: number;
		concar: number;
		dora: number;
	} | null;
	savings: {
		vsConcar: number;
		vsDora: number;
		percentConcar: number;
	} | null;
	isLoading: boolean;
}

interface EconomicGroupActions {
	fetchGroup: (groupId: string) => Promise<void>;
	createGroup: (data: {
		groupName: string;
		ownerId: string;
	}) => Promise<EconomicGroup | null>;
	addCompany: (
		groupId: string,
		data: { ruc: string; businessName: string; tradeName?: string },
	) => Promise<void>;
	getCompanies: (groupId: string) => Promise<void>;
}

export const useEconomicGroupStore = create<
	EconomicGroupState & EconomicGroupActions
>((set, get) => ({
	currentGroup: null,
	companies: [],
	pricing: null,
	savings: null,
	isLoading: false,

	fetchGroup: async (groupId: string) => {
		set({ isLoading: true });

		try {
			const body = await unwrap(
				economicGroupsTreatyClient({
					id: groupId,
				}).get(),
			);
			const groupData =
				extractOkDataOrPassthrough<EconomicGroupDetailResponse | null>(
					body,
					"Failed to fetch group",
				);

			if (groupData) {
				set({
					currentGroup: groupData.group,
					companies: (groupData.companies || []).map(normalizeCompany),
					pricing: groupData.pricing || null,
					savings: groupData.savings || null,
				});
				trackEvent("economic_group_loaded", {
					companyCount: (groupData.companies || []).length,
					groupId,
				});
			}
		} catch (error) {
			captureError(
				error instanceof Error
					? error
					: new Error("Failed to fetch economic group"),
				{
					groupId,
					source: "features/economic-groups/useEconomicGroup.fetchGroup",
				},
			);
			toast.error("Error al cargar el grupo económico");
		} finally {
			set({ isLoading: false });
		}
	},

	createGroup: async (data) => {
		set({ isLoading: true });

		try {
			const body = await unwrap(economicGroupsTreatyClient.post(data));
			const createdGroup =
				extractOkDataOrPassthrough<CreateEconomicGroupResponse | null>(
					body,
					"Failed to create group",
				);

			if (createdGroup) {
				trackEvent("economic_group_created", {
					groupId: createdGroup.group.id,
					ownerId: data.ownerId,
				});
				toast.success("✅ Grupo económico creado");
				return createdGroup.group;
			}

			return null;
		} catch (error) {
			captureError(
				error instanceof Error
					? error
					: new Error("Failed to create economic group"),
				{
					ownerId: data.ownerId,
					source: "features/economic-groups/useEconomicGroup.createGroup",
				},
			);
			toast.error("Error al crear el grupo económico");
			return null;
		} finally {
			set({ isLoading: false });
		}
	},

	addCompany: async (groupId, companyData) => {
		set({ isLoading: true });

		try {
			const body = await unwrap(
				economicGroupsTreatyClient({
					id: groupId,
				}).companies.post(companyData),
			);
			const addCompanyResponse =
				extractOkDataOrPassthrough<AddCompanyResponse | null>(
					body,
					"Failed to add company",
				);

			// Refresh companies list
			await get().getCompanies(groupId);

			trackEvent("economic_group_company_added", {
				groupId,
				hasTradeName: Boolean(companyData.tradeName),
			});
			toast.success(`✅ ${addCompanyResponse?.message || "Empresa agregada"}`);
		} catch (error) {
			captureError(
				error instanceof Error
					? error
					: new Error("Failed to add company to economic group"),
				{
					groupId,
					hasTradeName: Boolean(companyData.tradeName),
					source: "features/economic-groups/useEconomicGroup.addCompany",
				},
			);
			toast.error("Error al agregar la empresa");
		} finally {
			set({ isLoading: false });
		}
	},

	getCompanies: async (groupId: string) => {
		try {
			const body = await unwrap(
				economicGroupsTreatyClient({
					id: groupId,
				}).companies.get(),
			);
			const companiesResponse =
				extractOkDataOrPassthrough<EconomicGroupCompaniesResponse | null>(
					body,
					"Failed to fetch companies",
				);

			if (companiesResponse) {
				set({
					companies: (companiesResponse.companies || []).map(normalizeCompany),
				});
			}
		} catch (error) {
			captureError(
				error instanceof Error
					? error
					: new Error("Failed to fetch economic group companies"),
				{
					groupId,
					source: "features/economic-groups/useEconomicGroup.getCompanies",
				},
			);
		}
	},
}));

export const useEconomicGroup = () => {
	const store = useEconomicGroupStore();
	return store;
};
