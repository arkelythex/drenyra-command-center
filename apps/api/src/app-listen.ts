import { getApiRootMetadata } from "./api-root-metadata";
import { baseApp } from "./app-core";
import { bootstrapTaxationEventSubscriptions } from "./features/taxation/application/handlers/bootstrap-taxation-event-subscriptions";
import { createLogger } from "./lib/logger";
import { attachOptionalOpenTelemetry } from "./observability/opentelemetry";
import {
	CANONICAL_SWAGGER_PATH,
	registerLegacySwaggerRedirects,
} from "./swagger-docs-routes";

const logger = createLogger({ module: "app-listen" });

const app = await attachOptionalOpenTelemetry(baseApp);

await bootstrapTaxationEventSubscriptions();

app.get("/", () => getApiRootMetadata());

registerLegacySwaggerRedirects(app);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
	logger.info({ port }, "Arkelythex API listening");
	logger.info(
		{ docsUrl: `http://localhost:${port}${CANONICAL_SWAGGER_PATH}` },
		"Swagger docs available",
	);
});
