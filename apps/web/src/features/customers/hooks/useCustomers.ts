/**
 * Customers Hooks - MIGRATED TO EDEN TREATY
 * All hooks now use type-safe API client
 */

import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import { createCrudHooks } from "@/lib/crud-api";
import { useEntitySearch } from "@/lib/hooks/useEntitySearch";
import type {
	CreateCustomerDTO,
	UpdateCustomerDTO,
} from "../../../lib/schemas/customer.schema";
import { useActiveCompanyContext } from "../../../lib/use-active-company-context";
import { customerTreatyClient } from "../api/customer-treaty-client";
import { type CustomerRecord, customersApi } from "../api/customers.api";
import { customerKeys } from "../api/query-keys";

interface CustomerTransaction {
	id: string;
	date: string;
	description: string;
	status: string;
	amount: number;
}

interface CustomerApiRecord extends CustomerRecord {
	transactions?: CustomerTransaction[] | null;
}

export interface Customer {
	id: string;
	companyId?: string;
	taxId: string;
	legalName: string;
	tradeName: string;
	address?: string;
	email?: string;
	phone?: string;
	creditLimit?: number;
	creditDays?: number;
	status: "active" | "inactive";
	currentBalance: number;
	name: string;
	initials: string;
	logo?: string;
	pendingBalance: number;
	hasRetention: boolean;
	totalRevenue: number;
	transactions: CustomerTransaction[];
}

interface CustomerStats {
	total: number;
	active: number;
	debt: number;
	totalRevenue: number;
	totalPending: number;
	retentionTotal: number;
}

interface UseCustomersResult {
	customers: Customer[];
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	expandedCustomers: string[];
	toggleCustomer: (id: string) => void;
	activeTab: "summary" | "cobranza";
	setActiveTab: (tab: "summary" | "cobranza") => void;
	stats: CustomerStats;
	data: Customer[] | undefined;
	isSuccess: boolean;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => Promise<unknown>;
}

function parseNumericValue(value: number | string | null | undefined): number {
	return Number.parseFloat(String(value ?? 0)) || 0;
}

function getCustomerDisplayName(customer: CustomerApiRecord): string {
	return customer.legalName ?? customer.tradeName ?? customer.name ?? "";
}

function getCustomerInitials(name: string): string {
	const [first = "", second = ""] = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2);

	return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || "CL";
}

function normalizeCustomerTransaction(
	transaction: CustomerTransaction,
): CustomerTransaction {
	return {
		id: transaction.id,
		date: transaction.date,
		description: transaction.description,
		status: transaction.status,
		amount: parseNumericValue(transaction.amount),
	};
}

function normalizeCustomer(customer: CustomerApiRecord): Customer {
	const name = getCustomerDisplayName(customer);
	const pendingBalance = parseNumericValue(
		customer.pendingBalance ?? customer.currentBalance,
	);

	return {
		id: customer.id ?? "",
		companyId: customer.companyId,
		taxId: customer.taxId ?? "",
		legalName: customer.legalName ?? name,
		tradeName: customer.tradeName ?? "",
		address: customer.address,
		email: customer.email,
		phone: customer.phone,
		creditLimit: customer.creditLimit ?? undefined,
		creditDays: customer.creditDays ?? undefined,
		status: customer.status === "inactive" ? "inactive" : "active",
		currentBalance: parseNumericValue(customer.currentBalance),
		name,
		initials: customer.initials ?? getCustomerInitials(name),
		logo: customer.logo,
		pendingBalance,
		hasRetention: Boolean(customer.hasRetention),
		totalRevenue: parseNumericValue(customer.totalRevenue),
		transactions: Array.isArray(customer.transactions)
			? customer.transactions.map(normalizeCustomerTransaction)
			: [],
	};
}

export function useCustomers(): UseCustomersResult {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	const entity = useEntitySearch<Customer, CustomerStats>(
		{
			queryKey: customerKeys.list(companyId),
			fetcher: async () => {
				const list = await customersApi.list({ companyId });
				return list.map(normalizeCustomer);
			},
			searchFields: (c) => [c.name, c.taxId, c.tradeName],
			tabs: ["summary", "cobranza"] as const,
			calculateStats: (items) => ({
				total: items.length,
				active: items.filter((c) => c.status === "active").length,
				debt: items.reduce((sum, c) => sum + c.currentBalance, 0),
				totalRevenue: items.reduce((sum, c) => sum + c.totalRevenue, 0),
				totalPending: items.reduce((sum, c) => sum + c.pendingBalance, 0),
				retentionTotal: items.filter((c) => c.hasRetention).length,
			}),
		},
		companyId,
	);

	return {
		data: entity.raw,
		isLoading: entity.isLoading,
		isError: entity.isError,
		isSuccess: !entity.isError && !entity.isLoading,
		error: null,
		refetch: entity.refetch,
		customers: entity.filtered,
		searchQuery: entity.searchQuery,
		setSearchQuery: entity.setSearchQuery,
		expandedCustomers: entity.expandedIds,
		toggleCustomer: entity.toggleItem,
		activeTab: entity.activeTab as "summary" | "cobranza",
		setActiveTab: entity.setActiveTab as (tab: "summary" | "cobranza") => void,
		stats: entity.stats,
	};
}

const customerCrudHooks = createCrudHooks<
	Customer,
	CreateCustomerDTO,
	UpdateCustomerDTO
>({
	key: "customers",
	list: async (companyId) => {
		const customerList = await customersApi.list({ companyId });
		return customerList.map(normalizeCustomer);
	},
	getById: async (id) => {
		const body = await unwrap(customerTreatyClient({ id }).get({ query: {} }));
		return normalizeCustomer(
			extractOkDataOrPassthrough(
				body,
				"customers.getById",
			) as CustomerApiRecord,
		);
	},
	create: async (companyId, data) => {
		const body = await unwrap(
			customerTreatyClient.post({ ...data, companyId }),
		);
		return extractOkDataOrPassthrough(body, "customers.create") as Customer;
	},
	update: async (id, data) => {
		const body = await unwrap(customerTreatyClient({ id }).patch(data));
		return extractOkDataOrPassthrough(body, "customers.update") as Customer;
	},
	delete: async (id) => {
		const body = await unwrap(customerTreatyClient({ id }).delete());
		extractOkDataOrPassthrough(body, "customers.delete");
	},
});

export const useCreateCustomer = customerCrudHooks.useCreate;
export const useUpdateCustomer = customerCrudHooks.useUpdate;
export const useDeleteCustomer = customerCrudHooks.useDelete;
