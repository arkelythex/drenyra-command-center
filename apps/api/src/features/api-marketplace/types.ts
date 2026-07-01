import { t } from "elysia";

export const IntegrationProviderSchema = t.Union([
	t.Literal("stripe"),
	t.Literal("sunat"),
	t.Literal("banco"),
	t.Literal("tributar"),
]);

export const IntegrationCategorySchema = t.Union([
	t.Literal("payments"),
	t.Literal("tax"),
	t.Literal("banking"),
	t.Literal("accounting"),
	t.Literal("other"),
]);

export const ConnectionStatusSchema = t.Union([
	t.Literal("active"),
	t.Literal("error"),
	t.Literal("expired"),
]);

export const MarketplaceIdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

export const ConnectionIdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

export const WebhookIdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

export const ListMarketplaceQuery = t.Object({
	category: t.Optional(IntegrationCategorySchema),
	isInstalled: t.Optional(t.String()),
});

export const InstallIntegrationBody = t.Object({
	companyId: t.String({ minLength: 1 }),
});

export const UninstallIntegrationBody = t.Object({
	companyId: t.String({ minLength: 1 }),
});

export const ListConnectionsQuery = t.Object({
	companyId: t.String({ minLength: 1 }),
	integrationId: t.Optional(t.String()),
	status: t.Optional(ConnectionStatusSchema),
});

export const CreateConnectionBody = t.Object({
	companyId: t.String({ minLength: 1 }),
	integrationId: t.String({ minLength: 1 }),
	config: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const UpdateConnectionBody = t.Object({
	config: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const TestConnectionBody = t.Object({
	companyId: t.String({ minLength: 1 }),
});

export const ListWebhooksQuery = t.Object({
	connectionId: t.String({ minLength: 1 }),
});

export const CreateWebhookBody = t.Object({
	connectionId: t.String({ minLength: 1 }),
	eventType: t.String({ minLength: 1 }),
	endpointUrl: t.String({ minLength: 1 }),
	secret: t.Optional(t.String()),
});
