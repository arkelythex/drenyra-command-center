import { authorizeOperation } from "../../security/rbac-guard";
import type { SecurityOperation } from "../../security/rbac-policy";
import {
	type ResolveOrganizationIdFromCompanyId,
	readTenantScopeFromHeaders,
	type TenantScopeInput,
} from "./tenant-scope";
import type { HeaderContainer } from "./types";

export const DOCUMENTS_SECURITY_OPERATION = {
	QUERY_READ: "documents:query:read",
	REVIEW_UPDATE: "documents:review:update",
	UPLOAD_CREATE: "documents:upload:create",
} as const;

export type DocumentsSecurityOperation =
	(typeof DOCUMENTS_SECURITY_OPERATION)[keyof typeof DOCUMENTS_SECURITY_OPERATION];

export interface AuthorizeDocumentAccessInput {
	headers: HeaderContainer;
	operation: DocumentsSecurityOperation;
	resource: string;
	resolveOrganizationIdFromCompanyId: ResolveOrganizationIdFromCompanyId;
	assertedCompanyId?: string;
	assertedOrganizationId?: number;
	requireSession?: boolean;
	allowMachineCaller?: boolean;
}

export interface AuthorizedDocumentAccess {
	actorId: string;
	authUserId: string;
	role: string;
	tenantScope: TenantScopeInput;
}

export type AuthorizeDocumentAccessResult =
	| {
			ok: true;
			access: AuthorizedDocumentAccess;
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

function resolveAssertedOrganizationId(
	headers: HeaderContainer,
	assertedOrganizationId?: number,
):
	| { ok: true; organizationId?: number | undefined }
	| { ok: false; status: 403; code: string; error: string } {
	const headerScope = readTenantScopeFromHeaders(headers);
	const headerOrganizationId = headerScope.organizationId;

	if (
		typeof assertedOrganizationId === "number" &&
		typeof headerOrganizationId === "number" &&
		assertedOrganizationId !== headerOrganizationId
	) {
		return {
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
			error:
				"Requested organizationId does not match x-organization-id header assertion",
		};
	}

	return {
		ok: true,
		organizationId: assertedOrganizationId ?? headerOrganizationId,
	};
}

export async function authorizeDocumentAccess(
	input: AuthorizeDocumentAccessInput,
): Promise<AuthorizeDocumentAccessResult> {
	const assertedOrganization = resolveAssertedOrganizationId(
		input.headers,
		input.assertedOrganizationId,
	);
	if (!assertedOrganization.ok) {
		return assertedOrganization;
	}

	const authz = await authorizeOperation({
		headers: (input.headers ?? {}) as Record<string, unknown>,
		operation: input.operation as SecurityOperation,
		resource: input.resource,
		...(input.assertedCompanyId !== undefined
			? { requestedCompanyId: input.assertedCompanyId }
			: {}),
		...(input.requireSession !== undefined
			? { requireSession: input.requireSession }
			: {}),
		...(input.allowMachineCaller !== undefined
			? { allowMachineCaller: input.allowMachineCaller }
			: {}),
	});

	if (!authz.ok) {
		return authz;
	}

	const companyId = authz.actor.companyId;
	const organizationId =
		(await input.resolveOrganizationIdFromCompanyId(companyId)) ?? undefined;

	if (
		typeof assertedOrganization.organizationId === "number" &&
		organizationId !== assertedOrganization.organizationId
	) {
		return {
			ok: false,
			status: 403,
			code: "TENANT_SCOPE_VIOLATION",
			error: "Requested organizationId does not match caller tenant scope",
		};
	}

	return {
		ok: true,
		access: {
			actorId: authz.actor.authUserId,
			authUserId: authz.actor.authUserId,
			role: authz.actor.role,
			tenantScope: {
				companyId,
				...(organizationId !== undefined ? { organizationId } : {}),
			},
		},
	};
}
