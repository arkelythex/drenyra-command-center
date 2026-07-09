import { tryResolveOrganizationIdFromCompany } from "./organization-resolver";
export const createOrganizationIdResolver = (
	resolveOrganizationId = tryResolveOrganizationIdFromCompany,
) => {
	const cache = new Map();
	return async (companyId) => {
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

