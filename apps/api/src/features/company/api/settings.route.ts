import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { resolveSessionContext } from "../../security/session-context";
import { updateCompanySettings } from "../application/commands/update-company-settings.command";
import { getCompanySettings } from "../application/queries/get-company-settings.query";

const settingsBody = t.Object({
	language: t.Optional(t.String()),
	timezone: t.Optional(t.String()),
	currency: t.Optional(t.String()),
	companyName: t.Optional(t.String()),
	companyRuc: t.Optional(t.String()),
	autoClosePeriod: t.Optional(t.Boolean()),
	showAmountsInWords: t.Optional(t.Boolean()),
});

interface CompanySettingsAuthFailure {
	readonly error: string;
	readonly code: string;
}

type CompanySettingsSet = { status?: number | string };

async function authorizeCompanySettingsAccess(
	headers: Record<string, unknown>,
	companyId: string,
	set: CompanySettingsSet,
): Promise<CompanySettingsAuthFailure | null> {
	const context = await resolveSessionContext({
		headers,
		requestedCompanyId: companyId,
		securityProfile: "sensitive-write",
	});

	if (context.ok) return null;

	set.status = context.status;
	return {
		error: context.error,
		code: context.code,
	};
}

/**
 * Company settings API route module.
 *
 * @param headers - Session headers used to resolve the authenticated company context.
 * @returns Elysia plugin that binds path companyId to the caller tenant before DB access.
 * @throws Returns fail-closed API errors when session or tenant assertions fail.
 * @example
 * ```ts
 * const app = new Elysia().use(companySettingsRoute);
 * ```
 */
export const companySettingsRoute = new Elysia({
	prefix: "/api/company/:companyId",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get("/settings", async ({ params, headers, set }) => {
		const authFailure = await authorizeCompanySettingsAccess(
			headers as Record<string, unknown>,
			params.companyId,
			set,
		);
		if (authFailure) return authFailure;

		const settings = await getCompanySettings(params.companyId);
		if (!settings) {
			set.status = 404;
			return { error: "Company not found" };
		}
		return settings;
	})
	.patch(
		"/settings",
		async ({ params, body, headers, set }) => {
			const authFailure = await authorizeCompanySettingsAccess(
				headers as Record<string, unknown>,
				params.companyId,
				set,
			);
			if (authFailure) return authFailure;

			const updated = await updateCompanySettings({
				companyId: params.companyId,
				...body,
			});
			if (!updated) {
				set.status = 404;
				return { error: "Company not found" };
			}
			return updated;
		},
		{
			body: settingsBody,
		},
	);
