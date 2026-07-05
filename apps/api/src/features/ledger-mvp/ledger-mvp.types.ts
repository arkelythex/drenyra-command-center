import type {
	ComplianceDashboard,
	ComplianceIssue,
	ComplianceReproducibilityReport,
	IGVSummary,
	SIRESummary,
	SIRESunatLiveSummary,
} from "@drenyra/domain";
import type {
	PseComplianceInput,
	PseProactiveValidatorService,
} from "../pse-compliance/pse-proactive-validator.service";
import type {
	BalanceSheetReport,
	CashFlowReport,
	ProfitLossReport,
} from "../reports/reports.schemas";
import type { Pdt621Result } from "../taxation/pdt-621.service";

export type LedgerFlowStatus = "ready" | "manual_review" | "blocked";
export type LedgerSunatCrossCheckStatus =
	| "matched"
	| "mismatch"
	| "unavailable";
export type LedgerSunatCrossCheckReason =
	| "missing_config"
	| "auth_error"
	| "timeout"
	| "upstream_error"
	| "not_applicable";
export type LedgerSunatCrossCheckRecommendedAction =
	| "auto_continue"
	| "manual_review";

export interface LedgerSunatCrossCheck {
	status: LedgerSunatCrossCheckStatus;
	reason: LedgerSunatCrossCheckReason;
	recommendedAction: LedgerSunatCrossCheckRecommendedAction;
}

export interface LedgerExecutionMetadata {
	traceId: string;
	flow: "sire_autopilot" | "npif_basic" | "monitor_fiscal";
	generatedAt: string;
	period: string;
}

export interface LedgerSireAutopilotInput {
	companyId: string;
	period: string;
	ruc: string;
	razonSocial: string;
	percepcionesCents: number;
	retencionesCents: number;
	totalTolerance?: number;
	igvTolerance?: number;
	recordTolerance?: number;
}

export interface LedgerSireAutopilotResult extends LedgerExecutionMetadata {
	flow: "sire_autopilot";
	status: LedgerFlowStatus;
	evidence: {
		reproducibility: ComplianceReproducibilityReport;
		sireSummary: SIRESummary;
		sunatLiveSummary: SIRESunatLiveSummary;
		sunatCrossCheck: LedgerSunatCrossCheck;
		sunatVsLocalGap: {
			recordCount: number;
			totalAmount: number;
			totalIGV: number;
		} | null;
		igvSummary: IGVSummary;
		pdt621Prefill: Pdt621Result;
	};
	recommendedActions: string[];
}

export interface LedgerNpifBasicQuery {
	companyId: string;
	period: string;
}

export interface LedgerNpifBasicResult extends LedgerExecutionMetadata {
	flow: "npif_basic";
	status: LedgerFlowStatus;
	evidence: {
		profitLoss: ProfitLossReport;
		balanceSheet: BalanceSheetReport;
		cashFlow: CashFlowReport;
		igvSummary: IGVSummary;
	};
	recommendedActions: string[];
	warnings: string[];
}

export interface LedgerMonitorFiscalInput {
	companyId: string;
	period: string;
	ruc: string;
	ple: {
		salesRecords: number;
		purchaseRecords: number;
		salesTotalCents: number;
		purchaseTotalCents: number;
	};
	pdt: {
		form: "621" | "626";
		declaredIgvCents: number;
		declaredNetSalesCents: number;
	};
	sire?: {
		rvieRecords: number;
		rceRecords: number;
		accepted?: boolean;
	};
}

export type LedgerMonitorFiscalAlertSeverity = "info" | "warning" | "critical";
export type LedgerMonitorFiscalAlertCategory =
	| "igv"
	| "rce"
	| "pdt"
	| "platform"
	| "general";
export type LedgerMonitorFiscalAlertSource = "ai" | "heuristic";

export interface LedgerMonitorFiscalAlert {
	id: string;
	severity: LedgerMonitorFiscalAlertSeverity;
	category: LedgerMonitorFiscalAlertCategory;
	message: string;
	confidence: number;
	source: LedgerMonitorFiscalAlertSource;
	recommendedAction: string;
}

export interface LedgerMonitorFiscalResult extends LedgerExecutionMetadata {
	flow: "monitor_fiscal";
	status: LedgerFlowStatus;
	alerts: LedgerMonitorFiscalAlert[];
	evidence: {
		proactiveValidation: Awaited<
			ReturnType<PseProactiveValidatorService["validate"]>
		>;
		complianceDashboard: ComplianceDashboard;
		openIssues: ComplianceIssue[];
	};
	recommendedActions: string[];
}

export type LedgerPseComplianceInput = PseComplianceInput;
