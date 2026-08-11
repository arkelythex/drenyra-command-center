import { Elysia, t } from "elysia";
import { firmTenantContext } from "../../middleware/tenant-context";
import {
	createOrganization,
	reactivateOrganization,
	suspendOrganization,
	updateClientSettings,
	validateSettings,
} from "../organization-lifecycle/application/organization-lifecycle.controller";
import { fail, ok } from "../shared/api-response";
import {
	getAlerts,
	getClient,
	getClients,
	getDashboard,
	getErrorMessage,
} from "./firm.controller";

const ClientStatus = t.Union([
	t.Literal("ACTIVE"),
	t.Literal("SUSPENDED"),
	t.Literal("INACTIVE"),
]);

export const firmRoutes = new Elysia({ prefix: "/api/firm" })
	.use(firmTenantContext)
	.get(
		"/dashboard",
		async ({ firmTenant, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				return ok(await getDashboard(firmTenant.organizationId));
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "DASHBOARD_ERROR");
			}
		},
		{
			detail: {
				tags: ["Firm"],
				summary: "Firm dashboard KPIs",
				description:
					"Returns firm-level metrics: total/active clients, pending reviews, compliance score, alerts",
			},
		},
	)
	.get(
		"/clients",
		async ({ firmTenant, query, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				return ok(
					await getClients(firmTenant.organizationId, {
						...(query.search !== undefined ? { search: query.search } : {}),
						...(query.status !== undefined ? { status: query.status } : {}),
						...(query.limit ? { limit: Number(query.limit) } : {}),
						...(query.offset ? { offset: Number(query.offset) } : {}),
					}),
				);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "CLIENTS_ERROR");
			}
		},
		{
			query: t.Object({
				search: t.Optional(t.String()),
				status: t.Optional(ClientStatus),
				limit: t.Optional(t.String()),
				offset: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Firm"],
				summary: "List firm clients",
				description:
					"Paginated list of organizations with health scores. Filter by name/RUC.",
			},
		},
	)
	.get(
		"/clients/:id",
		async ({ firmTenant, params: { id }, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				return ok(await getClient(firmTenant.organizationId, id));
			} catch (error) {
				const message = getErrorMessage(error);
				if (message === "Client not found") {
					set.status = 404;
					return fail(message, "CLIENT_NOT_FOUND");
				}
				set.status = 500;
				return fail(message, "CLIENT_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Firm"],
				summary: "Get client detail",
				description:
					"Returns company info, health metrics, and recent activity.",
			},
		},
	)
	.patch(
		"/clients/:id",
		async ({ firmTenant, params: { id }, body, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			// Settings body is required for PATCH — formalized per spec
			if (!body.settings || Object.keys(body.settings).length === 0) {
				set.status = 400;
				return fail("Settings object is required", "SETTINGS_REQUIRED");
			}

			const validation = validateSettings(
				body.settings as Record<string, unknown>,
			);
			if (!validation.valid) {
				set.status = 400;
				return fail(validation.error, "INVALID_SETTINGS");
			}

			try {
				const result = await updateClientSettings(
					firmTenant,
					id,
					validation.data,
				);
				if (!result.success) {
					const err = result;
					if (err.code === "CLIENT_NOT_FOUND") set.status = 404;
					else if (err.code === "TENANT_SCOPE_VIOLATION") set.status = 403;
					else set.status = 500;
					return err;
				}
				return result;
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "CLIENT_UPDATE_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				settings: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
			detail: {
				tags: ["Firm"],
				summary: "Update client settings",
				description:
					"Update organization settings (not name/RUC). Only known settings keys accepted.",
			},
		},
	)
	// ─── Organization Lifecycle Routes ────────────────────────────
	.post(
		"/clients",
		async ({ firmTenant, body, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				const result = await createOrganization(firmTenant, {
					name: body.name,
					ruc: body.ruc,
					slug: body.slug,
					...(body.settings !== undefined
						? { settings: body.settings as Record<string, unknown> }
						: {}),
				});
				if (!result.success) {
					const err = result;
					if (
						err.code === "RUC_ALREADY_EXISTS" ||
						err.code === "SLUG_ALREADY_EXISTS"
					)
						set.status = 409;
					else if (err.code === "TENANT_SCOPE_VIOLATION") set.status = 403;
					else set.status = 400;
					return err;
				}
				set.status = 201;
				return result;
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: t.Object({
				name: t.String(),
				ruc: t.String(),
				slug: t.String(),
				settings: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
			detail: {
				tags: ["Firm"],
				summary: "Create organization client",
				description: "Create a new organization under the firm's tenant scope.",
			},
		},
	)
	.post(
		"/clients/:id/suspend",
		async ({ firmTenant, params: { id }, body, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				const result = await suspendOrganization(firmTenant, id, {
					...(body.reason !== undefined ? { reason: body.reason } : {}),
				});
				if (!result.success) {
					const err = result;
					if (err.code === "CLIENT_NOT_FOUND") set.status = 404;
					else if (err.code === "TENANT_SCOPE_VIOLATION") set.status = 403;
					else if (err.code === "INVALID_TRANSITION") set.status = 409;
					else set.status = 500;
					return err;
				}
				return result;
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				reason: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Firm"],
				summary: "Suspend organization",
				description:
					"Suspend an active organization under the firm's tenant scope.",
			},
		},
	)
	.post(
		"/clients/:id/reactivate",
		async ({ firmTenant, params: { id }, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				const result = await reactivateOrganization(firmTenant, id);
				if (!result.success) {
					const err = result;
					if (err.code === "CLIENT_NOT_FOUND") set.status = 404;
					else if (err.code === "TENANT_SCOPE_VIOLATION") set.status = 403;
					else if (err.code === "INVALID_TRANSITION") set.status = 409;
					else set.status = 500;
					return err;
				}
				return result;
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Firm"],
				summary: "Reactivate organization",
				description:
					"Reactivate a suspended organization under the firm's tenant scope.",
			},
		},
	)
	.get(
		"/alerts",
		async ({ firmTenant, query, set }) => {
			if (!firmTenant?.organizationId) {
				set.status = 403;
				return fail("Tenant context required", "TENANT_REQUIRED");
			}

			try {
				return ok(
					await getAlerts(
						firmTenant.organizationId,
						query.limit ? Number(query.limit) : undefined,
						query.offset ? Number(query.offset) : undefined,
					),
				);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "ALERTS_ERROR");
			}
		},
		{
			query: t.Object({
				limit: t.Optional(t.String()),
				offset: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Firm"],
				summary: "Firm alert feed",
				description: "Returns alerts across all companies under the firm.",
			},
		},
	);
