import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { apiModules, backwardCompatRedirects } from "./api-module-surface";
import { resolveCorsOrigins } from "./config/cors";
import { accountingPrRoutes } from "./features/accounting-prs";
import { agenticLedgerModule } from "./features/agentic-ledger";
import { aiRagModule } from "./features/ai-rag";
import { cognitiveStreamRoute } from "./features/ai-swarm/api/cognitive-stream.route";
import { contextControlPlaneRoute } from "./features/ai-swarm/api/context-control-plane.route";
import { aiSwarmRoutes } from "./features/ai-swarm/api/routes";
import { sireAuditRoute } from "./features/ai-swarm/api/sire-audit.route";
import { aiControlPlaneModule } from "./features/ai-swarm/control-plane";
import { aiWorkersRoutes } from "./features/ai-swarm/workers";
import { aiToolPermissionsModule } from "./features/ai-tool-permissions";
import { authRoutes } from "./features/auth/auth.routes";
import { bankingRoutes } from "./features/banking";
import { bankingProvidersRoutes } from "./features/banking-providers/api/routes";
import { billRoutes, invoiceRoutes } from "./features/billing";
import { cashflowRoutes } from "./features/cashflow/api/routes";
import { civicModule } from "./features/civic";
import { clientCommsModule } from "./features/client-comms";
import { companySettingsRoute } from "./features/company/api/settings.route";
import { customerRoutes } from "./features/customers";
import { dashboardModule } from "./features/dashboard";
import { detractionsModule } from "./features/detractions";
import { doctorModeModule } from "./features/doctor-mode";
import { drenyraModule } from "./features/drenyra/drenyra.routes";
import { expedientesModule } from "./features/expedientes";
import { firmRoutes } from "./features/firm";
import {
	fiscalCommandCenterModule,
	fiscalTruthModule,
} from "./features/fiscal";
import { frontendTelemetryModule } from "./features/frontend-telemetry";
import { healthModule } from "./features/health";
import { journalEntryRoutes } from "./features/journal-entries";
import { judgmentDayRoutes } from "./features/judgment-day";
import { ledgerMvpModule } from "./features/ledger-mvp";
import {
	isLedgerMvpEnabled,
	validateLedgerMvpStartupPolicy,
} from "./features/ledger-mvp/ledger-mvp-rollout.service";
import { llmGatewayModule } from "./features/llm-gateway/module";
import { monthlyCloseModule } from "./features/monthly-close";
import { platformMcpModule } from "./features/platform";
import { pseComplianceRoutes } from "./features/pse-compliance";
import { sireComparisonModule } from "./features/sire-comparison";
import { sunatApiModule } from "./features/sunat";
import { vendorRoutes } from "./features/vendors";
import { createLogger } from "./lib/logger";
import { metricsMiddleware } from "./middleware/metrics.middleware";
import { CANONICAL_SWAGGER_PATH } from "./swagger-docs-routes";

const logger = createLogger({ module: "app-core" });

validateLedgerMvpStartupPolicy();
const ledgerMvpEnabled = isLedgerMvpEnabled();

// Stable canonical entrypoint selected by `src/index.ts`.
const corsOrigins = resolveCorsOrigins();
if (corsOrigins.length === 0) {
	logger.warn(
		"CORS_ALLOWED_ORIGINS is empty in production; cross-origin browser requests will be blocked.",
	);
}
if (!ledgerMvpEnabled) {
	logger.info(
		"Ledger MVP routes are disabled via LEDGER_MVP_ENABLED=false (or legacy FLUX_MVP_ENABLED=false)",
	);
}

const baseApp = new Elysia()
	.use(
		cors({
			origin: corsOrigins,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: [
				"Content-Type",
				"Authorization",
				"X-User-Id",
				"X-User-Role",
				"X-Company-Id",
				"X-Company-Ruc",
				"X-Fiscal-Period",
				"X-Organization-Id",
				"X-Trace-Id",
				"X-Correlation-Id",
				"X-Fiscal-Correlation-Id",
				"X-Drenyra-Capability",
				"X-Drenyra-Capabilities",
			],
			credentials: true,
		}),
	)
	.use(
		helmet({
			contentSecurityPolicy: false,
			xFrameOptions: { action: "deny" },
			xContentTypeOptions: true,
			strictTransportSecurity: {
				maxAge: 31536000,
				includeSubDomains: true,
			},
			xXssProtection: false,
			referrerPolicy: { policy: "strict-origin-when-cross-origin" },
		}),
	)
	.onTransform(({ set }) => {
		set.headers["Content-Security-Policy"] =
			`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
		set.headers["Permissions-Policy"] =
			"camera=(), microphone=(), geolocation=()";
	})
	.use(
		swagger({
			path: CANONICAL_SWAGGER_PATH,
			documentation: {
				info: {
					title: "Arkelythex API",
					version: "2.0.0",
					description:
						"Single supported API surface (auth + banking + dashboard + analytics + CxC/CxP + SIRE)",
				},
				tags: [
					{ name: "Health", description: "Service health checks" },
					{ name: "Auth", description: "Authentication" },
					{ name: "Analytics", description: "Business intelligence and KPIs" },
					{
						name: "Dashboard",
						description: "Dashboard widgets and fiscal indicators",
					},
					{ name: "Documents", description: "OCR intake and review workflow" },
					{
						name: "Banking",
						description: "Banking ingestion and reconciliation",
					},
					{
						name: "Electronic Invoicing",
						description: "SUNAT/OSE electronic invoicing and CDR lifecycle",
					},
					{
						name: "Governance Audit",
						description: "Autonomy policy decisions and audit trail",
					},
					{
						name: "Banking Providers",
						description:
							"Bank connections via Prometeo API (BCP, Interbank, BBVA, Scotiabank)",
					},
					{
						name: "Customers",
						description: "Customer catalog for AR/AP flows",
					},
					{ name: "Invoices", description: "Accounts receivable (CxC) routes" },
					{ name: "Vendors", description: "Supplier catalog for AP flows" },
					{ name: "Bills", description: "Accounts payable (CxP) routes" },
					{ name: "Agentic Ledger", description: "Peru bank CSV ingestion" },
					{ name: "AI Swarm", description: "Multi-agent AI automation" },
					{
						name: "Drenyra",
						description:
							"Fiscal command center: cases, evidence, mock agent runs and approvals",
					},

					{
						name: "LLM Gateway",
						description:
							"Multi-provider AI gateway with failover, rate limiting, and unified API",
					},
					{
						name: "AI RAG",
						description:
							"RAG pipeline with hybrid search and LLM generation for SUNAT knowledge",
					},
					{
						name: "SIRE",
						description: "SIRE reporting, validation, and audit workflow",
					},
					{
						name: "SUNAT Knowledge",
						description: "RAG pipeline for SUNAT legal norms search",
					},
					{
						name: "Taxation",
						description:
							"PDT 621, IGV, retenciones y calendario fiscal SUNAT 2026",
					},
					{
						name: "Ledger MVP",
						description:
							"Orquestación MVP de flujos SIRE Autopilot, NPIF básico y Monitor Fiscal",
					},
					{
						name: "PSE Compliance",
						description: "Validación proactiva PLE/PDT antes del envío por PSE",
					},
					{
						name: "Reports",
						description:
							"Financial statements (P&L, balance sheet, cash flow) as promotion surface",
					},
					{
						name: "Inventory",
						description: "Warehouses, stock levels, movements, and kardex",
					},
					{
						name: "Observability",
						description: "Frontend telemetry capture and monitoring",
					},
					{
						name: "Civic",
						description:
							"Electoral validation, fraud detection, and civic data",
					},
					{
						name: "Intelligence",
						description:
							"Fiscal intelligence: anomaly detection, cashflow analysis, compliance checks, supplier analysis, document classification",
					},
				],
			},
		}),
	)
	.use(metricsMiddleware)
	.use(apiModules)
	.use(backwardCompatRedirects)
	.use(healthModule)
	.use(firmRoutes)
	.use(frontendTelemetryModule)
	.use(ledgerMvpEnabled ? ledgerMvpModule : new Elysia())
	.use(authRoutes)
	.use(aiWorkersRoutes)
	.use(bankingRoutes)
	.use(bankingProvidersRoutes)
	.use(customerRoutes)
	.use(invoiceRoutes)
	.use(billRoutes)
	.use(vendorRoutes)
	.use(judgmentDayRoutes)
	.use(fiscalTruthModule)
	.use(fiscalCommandCenterModule)
	.use(dashboardModule)
	.use(llmGatewayModule)
	.use(aiRagModule)
	.use(aiControlPlaneModule)
	.use(accountingPrRoutes)
	.use(agenticLedgerModule)
	.use(aiSwarmRoutes)
	.use(cognitiveStreamRoute)
	.use(contextControlPlaneRoute)
	.use(sireAuditRoute)
	.use(cashflowRoutes)
	.use(pseComplianceRoutes)
	.use(platformMcpModule)
	.use(companySettingsRoute)
	.use(journalEntryRoutes)
	.use(expedientesModule)
	.use(detractionsModule)
	.use(monthlyCloseModule)
	.use(drenyraModule)
	.use(doctorModeModule)
	.use(civicModule)
	.use(clientCommsModule)
	.use(sunatApiModule)
	.use(sireComparisonModule);

/** Public contract for Eden Treaty clients — use `baseApp` so OTEL/listen do not narrow inference. */
export type App = typeof baseApp;

export { baseApp };
