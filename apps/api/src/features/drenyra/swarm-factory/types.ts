import type { LatinAgentId } from "@arkelythex/drenyra-orchestrator";

export interface LatinDomainConfig {
	id: LatinAgentId;
	name: string;
	description: string;
	capabilities: string[];
	approvalRequired: boolean;
	maxRetries: number;
	matchPatterns: RegExp[];
}

export const LATIN_DOMAIN_CONFIGS: LatinDomainConfig[] = [
	{
		id: "cerno",
		name: "Cerno — Evidence Discovery",
		description:
			"Evidence discovery across fiscal sources, anomaly detection, pattern recognition",
		capabilities: [
			"evidence-discovery",
			"anomaly-detection",
			"pattern-recognition",
			"data-analysis",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/evidence/i,
			/anomaly/i,
			/pattern/i,
			/investigat/i,
			/discover/i,
			/correlation/i,
			/statistical/i,
			/time.series/i,
			/feature.engineer/i,
		],
	},
	{
		id: "custos",
		name: "Custos — Fiscal Risk Monitoring",
		description:
			"Fiscal risk monitoring, threat detection, vulnerability management",
		capabilities: [
			"risk-monitoring",
			"threat-detection",
			"vulnerability-management",
			"incident-response",
		],
		approvalRequired: true,
		maxRetries: 3,
		matchPatterns: [
			/risk/i,
			/secur/i,
			/threat/i,
			/vulnerability/i,
			/incident/i,
			/monitor/i,
			/alert/i,
			/uptime/i,
			/slo/i,
			/capacity/i,
		],
	},
	{
		id: "necto",
		name: "Necto — Audit Trail Assembly",
		description: "Audit trail assembly, provenance tracking, compliance logging",
		capabilities: ["audit-trail", "provenance", "tracking", "logging"],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/audit/i,
			/trail/i,
			/provenance/i,
			/logger/i,
			/log/i,
			/retention/i,
			/compliance-audit/i,
			/data-classifier/i,
		],
	},
	{
		id: "regula",
		name: "Regula — Regulatory Compliance",
		description:
			"LATAM regulatory compliance validation per country-pack",
		capabilities: [
			"regulatory-compliance",
			"validation",
			"schema-validation",
			"sunat-validation",
		],
		approvalRequired: true,
		maxRetries: 2,
		matchPatterns: [
			/regulat/i,
			/compliance/i,
			/valid/i,
			/schema/i,
			/sunat/i,
			/gdpr/i,
			/privacy/i,
			/consent/i,
		],
	},
	{
		id: "lumen",
		name: "Lumen — Insights & Analytics",
		description:
			"Insights, forecasts, executive summaries, KPI analysis",
		capabilities: [
			"insights",
			"analytics",
			"forecasting",
			"kpi",
			"business-analysis",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/insight/i,
			/analytics/i,
			/forecast/i,
			/kpi/i,
			/pricing/i,
			/market/i,
			/competitor/i,
			/recommendation/i,
			/prediction/i,
		],
	},
	{
		id: "fusio",
		name: "Fusio — External Integrations",
		description:
			"External integrations, API connectivity, data transfer, deployment",
		capabilities: [
			"integration",
			"api-connectivity",
			"data-transfer",
			"deployment",
		],
		approvalRequired: false,
		maxRetries: 3,
		matchPatterns: [
			/integrat/i,
			/api/i,
			/deploy/i,
			/connect/i,
			/gateway/i,
			/broker/i,
			/queue/i,
			/webhook/i,
			/dns/i,
			/ssl/i,
			/infrastructure/i,
			/chaos/i,
		],
	},
	{
		id: "scripta",
		name: "Scripta — Report Generation",
		description:
			"Report generation, documentation, customer-facing narratives",
		capabilities: [
			"report-generation",
			"documentation",
			"narratives",
			"testing",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/report/i,
			/doc/i,
			/test/i,
			/coverage/i,
			/e2e/i,
			/ui-test/i,
			/visual/i,
			/accessibility/i,
			/usability/i,
			/responsive/i,
			/design.system/i,
		],
	},
	{
		id: "capsa",
		name: "Capsa — Evidence Retention",
		description:
			"Evidence retention, immutable archival, cost optimization, backup",
		capabilities: [
			"retention",
			"archival",
			"cost-optimization",
			"backup",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/retention/i,
			/archiv/i,
			/cost/i,
			/backup/i,
			/optimization/i,
			/waste/i,
			/budget/i,
			/allocator/i,
			/reservation/i,
			/spot/i,
		],
	},
];

export const FINANCIAL_AGENT_MAP: Record<string, LatinAgentId> = {
	"sunat-compliance-agent": "regula",
	"spot-calculator-agent": "regula",
	"invoice-processor-agent": "cerno",
	"banking-reconciliation-agent": "cerno",
	"financial-analyzer-agent": "lumen",
	"tax-optimizer-agent": "lumen",
};
