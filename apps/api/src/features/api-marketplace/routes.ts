import { db } from "@arkelythex/persistence/client";
import { and, eq } from "@arkelythex/persistence/query";
import {
	integrationConnections,
	integrationWebhooks,
	marketplaceIntegrations,
} from "@arkelythex/persistence/schema";
import { Elysia } from "elysia";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	ConnectionIdParams,
	ConnectionStatusSchema,
	CreateConnectionBody,
	CreateWebhookBody,
	InstallIntegrationBody,
	IntegrationCategorySchema,
	IntegrationProviderSchema,
	ListConnectionsQuery,
	ListMarketplaceQuery,
	ListWebhooksQuery,
	MarketplaceIdParams,
	TestConnectionBody,
	UninstallIntegrationBody,
	UpdateConnectionBody,
	WebhookIdParams,
} from "./types";

export const apiMarketplaceRoutes = new Elysia({
	prefix: "/api/v1/marketplace",
})

	.get(
		"/",
		async ({ query, set }) => {
			try {
				const conditions = [];
				if (query.category) {
					conditions.push(eq(marketplaceIntegrations.category, query.category));
				}
				if (query.isInstalled !== undefined) {
					const isInstalled = query.isInstalled === "true";
					conditions.push(eq(marketplaceIntegrations.isInstalled, isInstalled));
				}
				const where = conditions.length > 0 ? and(...conditions) : undefined;

				const integrations = await db.query.marketplaceIntegrations.findMany({
					where,
					orderBy: marketplaceIntegrations.name,
				});

				return ok({ integrations });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "MARKETPLACE_LIST_ERROR");
			}
		},
		{
			query: ListMarketplaceQuery,
			detail: {
				tags: ["API Marketplace"],
				summary: "List available integrations",
				description:
					"Returns all marketplace integrations, optionally filtered by category or install status.",
			},
		},
	)

	.get(
		"/:id",
		async ({ params, set }) => {
			try {
				const integration = await db.query.marketplaceIntegrations.findFirst({
					where: eq(marketplaceIntegrations.id, params.id),
				});

				if (!integration) {
					set.status = 404;
					return fail("Integration not found", "INTEGRATION_NOT_FOUND");
				}

				return ok({ integration });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "MARKETPLACE_DETAIL_ERROR");
			}
		},
		{
			params: MarketplaceIdParams,
			detail: {
				tags: ["API Marketplace"],
				summary: "Get integration details",
				description:
					"Returns full integration details including config schema and install instructions.",
			},
		},
	)

	.post(
		"/:id/install",
		async ({ params, body, set }) => {
			try {
				const integration = await db.query.marketplaceIntegrations.findFirst({
					where: eq(marketplaceIntegrations.id, params.id),
				});

				if (!integration) {
					set.status = 404;
					return fail("Integration not found", "INTEGRATION_NOT_FOUND");
				}

				if (integration.isInstalled) {
					set.status = 409;
					return fail("Integration is already installed", "ALREADY_INSTALLED");
				}

				await db
					.update(marketplaceIntegrations)
					.set({
						isInstalled: true,
						installedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(marketplaceIntegrations.id, params.id));

				const updated = await db.query.marketplaceIntegrations.findFirst({
					where: eq(marketplaceIntegrations.id, params.id),
				});

				return ok({ integration: updated });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INSTALL_ERROR");
			}
		},
		{
			params: MarketplaceIdParams,
			body: InstallIntegrationBody,
			detail: {
				tags: ["API Marketplace"],
				summary: "Install an integration",
				description:
					"Marks an integration as installed for the tenant. Creates the catalog entry if needed.",
			},
		},
	)

	.post(
		"/:id/uninstall",
		async ({ params, set }) => {
			try {
				const integration = await db.query.marketplaceIntegrations.findFirst({
					where: eq(marketplaceIntegrations.id, params.id),
				});

				if (!integration) {
					set.status = 404;
					return fail("Integration not found", "INTEGRATION_NOT_FOUND");
				}

				await db
					.update(marketplaceIntegrations)
					.set({
						isInstalled: false,
						installedAt: null,
						updatedAt: new Date(),
					})
					.where(eq(marketplaceIntegrations.id, params.id));

				return ok({ uninstalled: true });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "UNINSTALL_ERROR");
			}
		},
		{
			params: MarketplaceIdParams,
			detail: {
				tags: ["API Marketplace"],
				summary: "Uninstall an integration",
				description:
					"Marks an integration as not installed. Does not delete existing connections.",
			},
		},
	)

	.get(
		"/connections",
		async ({ query, set }) => {
			try {
				const conditions = [
					eq(integrationConnections.companyId, query.companyId),
				];
				if (query.integrationId) {
					conditions.push(
						eq(integrationConnections.integrationId, query.integrationId),
					);
				}
				if (query.status) {
					conditions.push(eq(integrationConnections.status, query.status));
				}

				const connections = await db.query.integrationConnections.findMany({
					where: and(...conditions),
					with: {
						integration: true,
					},
					orderBy: integrationConnections.createdAt,
				});

				return ok({ connections });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CONNECTIONS_LIST_ERROR");
			}
		},
		{
			query: ListConnectionsQuery,
			detail: {
				tags: ["API Marketplace"],
				summary: "List company connections",
				description:
					"Returns all connections for a company, optionally filtered by integration or status.",
			},
		},
	)

	.post(
		"/connections",
		async ({ body, set }) => {
			try {
				const existing = await db.query.integrationConnections.findFirst({
					where: and(
						eq(integrationConnections.companyId, body.companyId),
						eq(integrationConnections.integrationId, body.integrationId),
					),
				});

				if (existing) {
					set.status = 409;
					return fail(
						"Connection already exists for this integration and company",
						"CONNECTION_EXISTS",
					);
				}

				const [connection] = await db
					.insert(integrationConnections)
					.values({
						companyId: body.companyId,
						integrationId: body.integrationId,
						config: (body.config ?? {}) as Record<string, unknown>,
					})
					.returning();

				return ok({ connection });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CONNECTION_CREATE_ERROR");
			}
		},
		{
			body: CreateConnectionBody,
			detail: {
				tags: ["API Marketplace"],
				summary: "Create a new connection",
				description:
					"Creates a new integration connection with provider-specific configuration.",
			},
		},
	)

	.patch(
		"/connections/:id",
		async ({ params, body, set }) => {
			try {
				const existing = await db.query.integrationConnections.findFirst({
					where: eq(integrationConnections.id, params.id),
				});

				if (!existing) {
					set.status = 404;
					return fail("Connection not found", "CONNECTION_NOT_FOUND");
				}

				const [connection] = await db
					.update(integrationConnections)
					.set({
						config: body.config as Record<string, unknown>,
						updatedAt: new Date(),
					})
					.where(eq(integrationConnections.id, params.id))
					.returning();

				return ok({ connection });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CONNECTION_UPDATE_ERROR");
			}
		},
		{
			params: ConnectionIdParams,
			body: UpdateConnectionBody,
			detail: {
				tags: ["API Marketplace"],
				summary: "Update connection config",
				description:
					"Updates the configuration for an existing integration connection.",
			},
		},
	)

	.delete(
		"/connections/:id",
		async ({ params, set }) => {
			try {
				const existing = await db.query.integrationConnections.findFirst({
					where: eq(integrationConnections.id, params.id),
				});

				if (!existing) {
					set.status = 404;
					return fail("Connection not found", "CONNECTION_NOT_FOUND");
				}

				await db
					.delete(integrationConnections)
					.where(eq(integrationConnections.id, params.id));

				return ok({ deleted: true });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CONNECTION_DELETE_ERROR");
			}
		},
		{
			params: ConnectionIdParams,
			detail: {
				tags: ["API Marketplace"],
				summary: "Remove a connection",
				description:
					"Permanently removes an integration connection and its webhooks.",
			},
		},
	)

	.post(
		"/connections/:id/test",
		async ({ params, set }) => {
			try {
				const connection = await db.query.integrationConnections.findFirst({
					where: eq(integrationConnections.id, params.id),
				});

				if (!connection) {
					set.status = 404;
					return fail("Connection not found", "CONNECTION_NOT_FOUND");
				}

				const now = new Date();
				const [updated] = await db
					.update(integrationConnections)
					.set({
						lastTestedAt: now,
						status: "active",
						lastError: null,
						updatedAt: now,
					})
					.where(eq(integrationConnections.id, params.id))
					.returning();

				return ok({
					connection: updated,
					testedAt: now.toISOString(),
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CONNECTION_TEST_ERROR");
			}
		},
		{
			params: ConnectionIdParams,
			detail: {
				tags: ["API Marketplace"],
				summary: "Test a connection",
				description:
					"Validates the connection by testing the configured API credentials.",
			},
		},
	)

	.get(
		"/webhooks",
		async ({ query, set }) => {
			try {
				const webhooks = await db.query.integrationWebhooks.findMany({
					where: eq(integrationWebhooks.connectionId, query.connectionId),
					with: {
						connection: true,
					},
					orderBy: integrationWebhooks.createdAt,
				});

				return ok({ webhooks });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "WEBHOOKS_LIST_ERROR");
			}
		},
		{
			query: ListWebhooksQuery,
			detail: {
				tags: ["API Marketplace"],
				summary: "List webhooks for a connection",
				description:
					"Returns all registered webhooks for an integration connection.",
			},
		},
	)

	.post(
		"/webhooks",
		async ({ body, set }) => {
			try {
				const connection = await db.query.integrationConnections.findFirst({
					where: eq(integrationConnections.id, body.connectionId),
				});

				if (!connection) {
					set.status = 404;
					return fail("Connection not found", "CONNECTION_NOT_FOUND");
				}

				const [webhook] = await db
					.insert(integrationWebhooks)
					.values({
						connectionId: body.connectionId,
						eventType: body.eventType,
						endpointUrl: body.endpointUrl,
						secret: body.secret ?? null,
					})
					.returning();

				return ok({ webhook });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "WEBHOOK_CREATE_ERROR");
			}
		},
		{
			body: CreateWebhookBody,
			detail: {
				tags: ["API Marketplace"],
				summary: "Register a webhook",
				description:
					"Registers a webhook endpoint for receiving integration events.",
			},
		},
	)

	.delete(
		"/webhooks/:id",
		async ({ params, set }) => {
			try {
				const existing = await db.query.integrationWebhooks.findFirst({
					where: eq(integrationWebhooks.id, params.id),
				});

				if (!existing) {
					set.status = 404;
					return fail("Webhook not found", "WEBHOOK_NOT_FOUND");
				}

				await db
					.delete(integrationWebhooks)
					.where(eq(integrationWebhooks.id, params.id));

				return ok({ deleted: true });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "WEBHOOK_DELETE_ERROR");
			}
		},
		{
			params: WebhookIdParams,
			detail: {
				tags: ["API Marketplace"],
				summary: "Remove a webhook",
				description: "Permanently removes a webhook registration.",
			},
		},
	);
