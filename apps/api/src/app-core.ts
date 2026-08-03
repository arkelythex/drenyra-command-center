import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { apiModules, backwardCompatRedirects } from "./api-module-surface";
import { resolveCorsOrigins } from "./config/cors";
import { accountingPrRoutes } from "./features/accounting-prs";
import { agenticLedgerModule } from "./features/agentic-ledger";
import { agentsRoutes } from "./features/agents";
import { aiRagModule } from "./features/ai-rag";
import { cognitiveStreamRoute } from "./features/ai-swarm/api/cognitive-stream.route";
import { contextControlPlaneRoute } from "./features/ai-swarm/api/context-control-plane.route";
import { aiSwarmRoutes } from "./features/ai-swarm/api/routes";
import { sireAuditRoute } from "./features/ai-swarm/api/sire-audit.route";
import { aiControlPlaneModule } from "./features/ai-swarm/control-plane";
import { aiWorkersRoutes } from "./features/ai-swarm/workers";
import { apiMarketplaceModule } from "./features/api-marketplace";
import { authRoutes } from "./features/auth/auth.routes";
import { invitationRoutes } from "./features/auth/invitations";
import { automationStudioRoutes } from "./features/automation-studio";
import { automationsRoutes } from "./features/automations";
import { bankingRoutes } from "./features/banking";
import { bankingProvidersRoutes } from "./features/banking-providers/api/routes";
import { billRoutes, invoiceRoutes } from "./features/billing";
import { cashflowRoutes } from "./features/cashflow/api/routes";
import { clientCommsModule } from "./features/client-comms";
import { companySettingsRoute } from "./features/company/api/settings.route";
import { customerRoutes } from "./features/customers";
import { dashboardModule } from "./features/dashboard";
import { detractionsModule } from "./features/detractions";
import { diffsRoutes, reviewQueueRoutes } from "./features/diffs";
import { doctorModeModule } from "./features/doctor-mode";
import { drenyraModule } from "./features/drenyra/drenyra.routes";
import { evidenceV2Routes } from "./features/evidence-v2";
import { expedientesModule } from "./features/expedientes";
import { feosModule } from "./features/feos";
import { firmRoutes } from "./features/firm";
import {
	fiscalCommandCenterModule,
	fiscalTruthModule,
} from "./features/fiscal";
import { fiscalAgentRoutes } from "./features/fiscal-agent/routes";
import { fiscalMemoryRoutes } from "./features/fiscal-memory";
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
import { missionsModule } from "./features/missions";
import { monthlyCloseModule } from "./features/monthly-close";
import { platformMcpModule } from "./features/platform";
import { pleModule } from "./features/ple";
import { pseComplianceRoutes } from "./features/pse-compliance";
import { ragEnterpriseRoutes } from "./features/rag-enterprise";
import { reportsModule } from "./features/reports";
import { sireComparisonModule } from "./features/sire-comparison";
import { skillsRoutes } from "./features/skills";
import { sunatApiModule } from "./features/sunat";
import { threadRoutes } from "./features/threads";
import { vendorRoutes } from "./features/vendors";
import { createLogger } from "./lib/logger";
import { metricsMiddleware } from "./middleware/metrics.middleware";
import { routePermissionGuard } from "./shared/auth/route-permission-guard";
import {
	globalErrorHandler,
	rateLimiter,
	requestLogger,
} from "./shared/plugins";
import { companyScopeGuard } from "./shared/plugins/company-scope-guard";
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
					title: "Drenyra API",
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
						name: "SIRE Comparison",
						description:
							"Multi-period SIRE reconciliation: discrepancy detection, resolution, and comparison reports",
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
						name: "Intelligence",
						description:
							"Fiscal intelligence: anomaly detection, cashflow analysis, compliance checks, supplier analysis, document classification",
					},
					{
						name: "RAG Enterprise",
						description:
							"Enterprise knowledge base with document management and semantic search",
					},
					// ─── Phases 2-4 Feature Tags ───────────────────────────
					{
						name: "Accounting PRs",
						description:
							"Accounting pull request workflow: create, review, approve, and post journal entry adjustments",
					},
					{
						name: "Monthly Close",
						description:
							"Monthly closing checklists, gates, and period-end workflow",
					},
					{
						name: "CFO Analytics",
						description:
							"CFO dashboard KPIs: revenue, expenses, profitability, liquidity, tax compliance",
					},
					{
						name: "Client Comms",
						description:
							"Client communication templates, automation, and delivery tracking",
					},
					{
						name: "Judgment Day",
						description:
							"AI-powered fiscal audit reviews, findings, and rule-based compliance scoring",
					},
					{
						name: "Doctor",
						description:
							"System diagnostic checks, health dashboards, and operational runbooks",
					},
					{
						name: "API Marketplace",
						description:
							"External API integrations marketplace for third-party service connections",
					},
					{
						name: "Automation Studio",
						description:
							"Workflow automation engine: triggers, steps, executions, and dashboards",
					},
					{
						name: "Evidence",
						description:
							"Evidence management: upload, classify, validate, and link to fiscal entities",
					},
					{
						name: "Fiscal Agent",
						description:
							"24/7 autonomous fiscal agent: nightly categorization, SUNAT reconciliation, exceptions",
					},
					{
						name: "Firm",
						description:
							"Firm dashboard: multi-company overview, user management, and firm-level settings",
					},
					{
						name: "Compliance",
						description:
							"Compliance tracking, fiscal obligations roadmap, accounting job automation, and obligation execution",
					},
					{
						name: "Agents",
						description:
							"Agent sessions: monitor, pause, resume, and cancel AI agent workflows",
					},
					{
						name: "Diffs",
						description:
							"Accounting diffs: Before/After changes proposed by agents for review and approval",
					},
					{
						name: "Review Queue",
						description:
							"Prioritized review queue for accounting diff approval workflow",
					},
					{
						name: "FEOS",
						description:
							"Financial Engineering OS: workspace management, tool contracts, agent events, attention rollups, evidence root and receipt protocol",
					},
					{
						name: "Threads",
						description:
							"Thread system — accounting work sessions with tasks, agents, and evidence",
					},
				],
			},
		}),
	)
	.use(requestLogger)
	.use(metricsMiddleware)
	.use(globalErrorHandler)
	.use(rateLimiter({ windowMs: 60_000, max: 100 }))
	// ── Auth & permission guard (global — applies to all API routes) ──
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.use(routePermissionGuard())
	.use(apiModules)
	.use(backwardCompatRedirects)
	.use(healthModule)
	.use(firmRoutes)
	.use(frontendTelemetryModule)
	.use(ledgerMvpEnabled ? ledgerMvpModule : new Elysia())
	.use(authRoutes)
	.use(invitationRoutes)
	.use(aiWorkersRoutes)
	.use(bankingRoutes)
	.use(bankingProvidersRoutes)
	.use(reportsModule)
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
	.use(apiMarketplaceModule)
	.use(aiControlPlaneModule)
	.use(accountingPrRoutes)
	.use(automationStudioRoutes)
	.use(agenticLedgerModule)
	.use(aiSwarmRoutes)
	.use(cognitiveStreamRoute)
	.use(contextControlPlaneRoute)
	.use(sireAuditRoute)
	.use(cashflowRoutes)
	.use(pleModule)
	.use(pseComplianceRoutes)
	.use(platformMcpModule)
	.use(companySettingsRoute)
	.use(journalEntryRoutes)
	.use(expedientesModule)
	.use(detractionsModule)
	.use(monthlyCloseModule)
	.use(missionsModule)
	.use(drenyraModule)
	.use(doctorModeModule)
	.use(clientCommsModule)
	.use(sunatApiModule)
	.use(sireComparisonModule)
	.use(ragEnterpriseRoutes)
	.use(agentsRoutes)
	.use(diffsRoutes)
	.use(reviewQueueRoutes)
	.use(skillsRoutes)
	.use(automationsRoutes)
	.use(evidenceV2Routes)
	.use(threadRoutes)
	.use(fiscalAgentRoutes)
	.use(fiscalMemoryRoutes)
	.use(feosModule);

/** Public contract for Eden Treaty clients — use `baseApp` so OTEL/listen do not narrow inference. */
export type App = typeof baseApp;

export { baseApp };
