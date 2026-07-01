import { Elysia, t } from "elysia";
import { firmTenantContext } from "../../middleware/tenant-context";
import { fail, ok } from "../shared/api-response";
import {
	getAlerts,
	getClient,
	getClients,
	getDashboard,
	getErrorMessage,
	updateClient,
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
						search: query.search,
						status: query.status,
						limit: query.limit ? Number(query.limit) : undefined,
						offset: query.offset ? Number(query.offset) : undefined,
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

			try {
				return ok(
					await updateClient(firmTenant.organizationId, id, {
						settings: body.settings,
					}),
				);
			} catch (error) {
				const message = getErrorMessage(error);
				if (message === "Client not found") {
					set.status = 404;
					return fail(message, "CLIENT_NOT_FOUND");
				}
				set.status = 500;
				return fail(message, "CLIENT_UPDATE_ERROR");
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
				description: "Update organization settings (not name/RUC).",
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
