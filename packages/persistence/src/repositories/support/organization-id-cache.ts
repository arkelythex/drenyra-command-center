import { tryResolveOrganizationIdFromCompany } from "./organization-resolver";

type ResolveOrganizationId = (companyId: string) => Promise<number | null>;

export const createOrganizationIdResolver = (
	resolveOrganizationId: ResolveOrganizationId = tryResolveOrganizationIdFromCompany,
) => {
	const cache = new Map<string, Promise<number | null>>();

	return async (companyId: string): Promise<number | null> => {
		const cached = cache.get(companyId);
		if (cached) {
			return cached;
		}

		const pending = Promise.resolve(resolveOrganizationId(companyId)).catch(
			(error) => {
				cache.delete(companyId);
				throw error;
			},
		);

		cache.set(companyId, pending);
		return pending;
	};
};
