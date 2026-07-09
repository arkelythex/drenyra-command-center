import { api } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import { registerClient } from "@/lib/treaty-route-client";

/** Eden treaty client for /api/bills routes */
const billsTreatyClient = registerClient("bills", api.api.bills);

/**
 * Bills API client (Type-safe)
 *
 * Leverages Eden Treaty + unwrap() pattern for full type inference.
 * Mirror pattern of vendors.api.ts.
 */
export const billsApi = {
	/**
	 * List bills for a company
	 */
	list: async (params: {
		companyId: string;
		status?: string;
		vendorId?: string;
		limit?: number;
		offset?: number;
	}) => {
		return unwrap(
			billsTreatyClient.get({
				query: params,
			}),
		);
	},

	/**
	 * Get bill by ID
	 */
	getById: async (id: string) => {
		return unwrap(billsTreatyClient({ id }).get());
	},

	/**
	 * Update bill status
	 */
	updateStatus: async (
		id: string,
		status: string,
		actorName?: string,
		reason?: string,
	) => {
		return unwrap(
			billsTreatyClient({ id }).patch({
				status,
				actorName,
				reason,
			}),
		);
	},

	/**
	 * Apply payment to a bill
	 */
	pay: async (
		id: string,
		amount: number,
		currency: string,
		actorName?: string,
	) => {
		return unwrap(
			billsTreatyClient({ id }).pay.post({
				amount: String(amount),
				currency,
				actorName,
			}),
		);
	},

	/**
	 * Delete a draft bill
	 */
	delete: async (id: string) => {
		return unwrap(billsTreatyClient({ id }).delete());
	},

	/**
	 * List vendors (delegates to vendors API)
	 * Used by bills board to resolve vendor names
	 */
	listVendors: async (companyId: string) => {
		const vendorClient = registerClient("vendors", api.api.vendors);
		return unwrap(
			vendorClient.get({
				query: { companyId },
			}),
		);
	},
};
