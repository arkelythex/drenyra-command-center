import { unwrap } from '@/lib/api-helpers';
import { api } from '@/lib/api';
import { buildApiUrl } from '@/lib/http-client';
import type { InboxQueryFilters, InboxTransactionRecord } from '../inbox.types';

/**
 * Inbox API client
 *
 * Temporary adapter while the inbox feature is migrated to typed Eden Treaty endpoints.
 */
export const inboxApi = {
	async listTransactions(
		filters: Omit<InboxQueryFilters, 'companyId'> | InboxQueryFilters,
	): Promise<InboxTransactionRecord[]> {
		const { companyId: _companyId, status: _status, ...query } =
			filters as InboxQueryFilters;

		const response = await unwrap(
			api.transactions.get(
				Object.keys(query).length > 0
					? {
							query,
						}
					: undefined,
			),
		);

		return Array.isArray(response)
			? response as InboxTransactionRecord[]
			: [];
	},

	async uploadDocument(file: File): Promise<void> {
		const formData = new FormData();
		formData.append("file", file);

		// Multipart upload remains on the legacy endpoint until the typed contract is available.
		await fetch(buildApiUrl('/inbox/upload'), {
			method: "POST",
			body: formData,
		});
	},
};
