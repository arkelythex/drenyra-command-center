import type { ListQuery } from "../handlers/types";

/**
 * ensureDocumentListScope operation.
 *
 * @returns Result of ensureDocumentListScope.
 * @example
 * ```ts
 * const result = ensureDocumentListScope(undefined);
 * console.log(result);
 * ```
 */
export function ensureDocumentListScope({
	query,
	set,
}: {
	query: ListQuery;
	set: { status?: number | string };
}) {
	if (!query.companyId && query.organizationId === undefined) {
		set.status = 400;
		return {
			success: false,
			error: "companyId or organizationId is required",
			code: "DOCUMENTS_BAD_REQUEST",
		};
	}

	return undefined;
}
