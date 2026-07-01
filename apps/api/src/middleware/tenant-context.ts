import { Elysia } from "elysia";
import { resolveAuthenticatedCaller } from "../features/security/authenticated-caller";

export type FirmTenantContext = {
	organizationId: string;
	userId: string;
	role: string;
};

const PUBLIC_PATH_PREFIXES = [
	"/health",
	"/api/v2/health",
	"/swagger",
	"/api/auth",
] as const;

function isPublicPath(path: string): boolean {
	return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const firmTenantContext = new Elysia({ name: "firm-tenant" })
	.derive(async ({ request, set }) => {
		const url = new URL(request.url);

		if (isPublicPath(url.pathname)) {
			return { firmTenant: null as FirmTenantContext | null };
		}

		const headers: Record<string, string> = {};
		request.headers.forEach((value, key) => {
			headers[key] = value;
		});

		const result = await resolveAuthenticatedCaller({
			headers,
			requireSession: false,
			requireTenant: true,
			requireRole: true,
			allowHeaderFallback: true,
		});

		if (!result.ok) {
			set.status = result.status;
			return { firmTenant: null as FirmTenantContext | null };
		}

		return {
			firmTenant: {
				organizationId: result.caller.companyId ?? "",
				userId: result.caller.userId,
				role: result.caller.role,
			} satisfies FirmTenantContext,
		};
	})
	.as("scoped");
