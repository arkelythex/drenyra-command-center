import { getApiRootMetadata } from "./api-root-metadata";
import { baseApp } from "./app-core";
import { bootstrapTaxationEventSubscriptions } from "./features/taxation/application/handlers/bootstrap-taxation-event-subscriptions";
import { startFiscalAgentWorker } from "@arkelythex/infrastructure/workers/fiscal-agent.worker";
import { startCsvBatchWorker } from "@arkelythex/infrastructure/workers/csv-batch.worker";
import { createLogger } from "./lib/logger";
import { attachOptionalOpenTelemetry } from "./observability/opentelemetry";
import {
	CANONICAL_SWAGGER_PATH,
	registerLegacySwaggerRedirects,
} from "./swagger-docs-routes";

const logger = createLogger({ module: "app-listen" });

const app = await attachOptionalOpenTelemetry(baseApp);

await bootstrapTaxationEventSubscriptions();

// Start background workers
const fiscalWorker = startFiscalAgentWorker();
const csvWorker = startCsvBatchWorker();
if (fiscalWorker || csvWorker) {
	logger.info(
		{
			fiscalWorker: fiscalWorker !== null,
			csvWorker: csvWorker !== null,
		},
		"Background workers started",
	);
}

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
