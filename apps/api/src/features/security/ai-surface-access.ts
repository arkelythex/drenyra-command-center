import { resolveOrganizationIdFromCompanyId } from "../documents/handlers/tenant-scope";
import { authorizeOperation } from "./rbac-guard";
import type { SecurityOperation } from "./rbac-policy";

export interface AiSurfaceAccessContext {
	authUserId: string;
	companyId: string;
	legacyUserId: string | null;
	operation: SecurityOperation;
	organizationId: number;
	role: string;
	userId: string;
}

export type AiSurfaceAccessResult =
	| {
			ok: true;
			context: AiSurfaceAccessContext;
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

export interface AuthorizeAiSurfaceInput {
	headers: Record<string, unknown>;
	operation: SecurityOperation;
	resource: string;
	requestedCompanyId?: string;
	requireSession?: boolean;
}

export async function authorizeAiSurface(
	input: AuthorizeAiSurfaceInput,
): Promise<AiSurfaceAccessResult> {
	const authz = await authorizeOperation({
		headers: input.headers,
		operation: input.operation,
		resource: input.resource,
		...(input.requestedCompanyId !== undefined
			? { requestedCompanyId: input.requestedCompanyId }
			: {}),
		...(input.requireSession !== undefined
			? { requireSession: input.requireSession }
			: {}),
		allowMachineCaller: true,
	});

	if (authz.ok === false) {
		return {
			ok: false,
			status: authz.status,
			code: authz.code,
			error: authz.error,
		};
	}

	const organizationId = await resolveOrganizationIdFromCompanyId(
		authz.actor.companyId,
	);
	if (organizationId === null) {
		return {
			ok: false,
			status: 403,
			code: "TENANT_ORGANIZATION_UNRESOLVED",
			error:
				"Authenticated tenant is not linked to a legacy organization scope",
		};
	}

	return {
		ok: true,
		context: {
			authUserId: authz.actor.authUserId,
			companyId: authz.actor.companyId,
			legacyUserId: authz.actor.legacyUserId,
			operation: input.operation,
			organizationId,
			role: authz.actor.role,
			userId: authz.actor.userId,
		},
	};
}
