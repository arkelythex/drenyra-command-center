import { ComplianceService } from "../../services/compliance.service";
import { ReportsService } from "../reports";
import {
	PseProactiveValidatorService,
	type PseComplianceInput,
} from "../pse-compliance/pse-proactive-validator.service";
import {
	buildPdt621,
	type Pdt621Input,
	type Pdt621Result,
} from "../taxation/pdt-621.service";
import { TaxationService } from "../taxation/application/services/taxation.service";
import { SireService } from "../sire/sire.service";
import type {
	ComplianceDashboard,
	ComplianceIssue,
	ComplianceReproducibilityReport,
} from "../../types/compliance.types";
import type { IGVSummary } from "../../types/taxation.types";
import type {
	BalanceSheetReport,
	CashFlowReport,
	ProfitLossReport,
} from "../reports/reports.schemas";
import type {
	LedgerMonitorFiscalInput,
	LedgerMonitorFiscalResult,
	LedgerNpifBasicQuery,
	LedgerNpifBasicResult,
	LedgerSireAutopilotInput,
	LedgerSireAutopilotResult,
} from "./ledger-mvp.types";
import {
	LedgerSireAutopilotService,
	type LedgerSireAutopilotPorts,
} from "./services/ledger-sire-autopilot.service";
import {
	LedgerNpifBasicService,
	type LedgerNpifBasicPorts,
} from "./services/ledger-npif-basic.service";
import {
	LedgerMonitorFiscalService,
	type LedgerMonitorFiscalPorts,
} from "./services/ledger-monitor-fiscal.service";

interface LedgerMvpSharedPorts {
	traceIdFactory: () => string;
	nowFactory: () => Date;
}

interface LedgerMvpPorts
	extends LedgerMvpSharedPorts,
		Omit<LedgerSireAutopilotPorts, keyof LedgerMvpSharedPorts>,
		Omit<LedgerNpifBasicPorts, keyof LedgerMvpSharedPorts>,
		Omit<LedgerMonitorFiscalPorts, keyof LedgerMvpSharedPorts> {}

/**
 * LedgerMvpService class.
 *
 * @example
 * ```ts
 * const value = new LedgerMvpService();
 * console.log(value);
 * ```
 */
export class LedgerMvpService {
	private readonly sireAutopilotService: LedgerSireAutopilotService;
	private readonly npifBasicService: LedgerNpifBasicService;
	private readonly monitorFiscalService: LedgerMonitorFiscalService;

	constructor(customPorts?: Partial<LedgerMvpPorts>) {
		const taxationService = new TaxationService();
		const pseValidator = new PseProactiveValidatorService();

		const defaultPorts: LedgerMvpPorts = {
			verifySireReproducibility: (input) =>
				ComplianceService.verifySireReproducibility(input),
			getIgvSummary: (companyId, year, month) =>
				taxationService.getIGVSummary(companyId, year, month),
			getSireSummary: (companyId, year, month) =>
				SireService.getSummary({
					companyId,
					year,
					month,
					format: "TXT",
				}),
			getSunatLiveSummary: (input) =>
				SireService.getSunatLiveSummary({
					companyId: input.companyId,
					period: input.period,
					ruc: input.ruc,
				}),
			pdtBuilder: (input) => buildPdt621(input),
			getProfitLoss: (companyId, startDate, endDate) =>
				ReportsService.getProfitLoss(companyId, startDate, endDate),
			getBalanceSheet: (companyId, asOfDate) =>
				ReportsService.getBalanceSheet(companyId, asOfDate),
			getCashFlow: (companyId, startDate, endDate) =>
				ReportsService.getCashFlow(companyId, startDate, endDate),
			getComplianceDashboard: (companyId) =>
				ComplianceService.getDashboard(companyId),
			getComplianceIssues: (companyId) =>
				ComplianceService.getIssues(companyId),
			validatePseCompliance: (input) => pseValidator.validate(input),
			traceIdFactory: () => crypto.randomUUID(),
			nowFactory: () => new Date(),
		};

		const mergedPorts: LedgerMvpPorts = {
			...defaultPorts,
			...customPorts,
		};

		this.sireAutopilotService = new LedgerSireAutopilotService(mergedPorts);
		this.npifBasicService = new LedgerNpifBasicService(mergedPorts);
		this.monitorFiscalService = new LedgerMonitorFiscalService(mergedPorts);
	}

	async runSireAutopilot(
		input: LedgerSireAutopilotInput,
	): Promise<LedgerSireAutopilotResult> {
		return this.sireAutopilotService.run(input);
	}

	async generateNpifBasic(
		query: LedgerNpifBasicQuery,
	): Promise<LedgerNpifBasicResult> {
		return this.npifBasicService.run(query);
	}

	async runMonitorFiscal(
		input: LedgerMonitorFiscalInput,
	): Promise<LedgerMonitorFiscalResult> {
		return this.monitorFiscalService.run(input);
	}
}

export type {
	ComplianceDashboard,
	ComplianceIssue,
	ComplianceReproducibilityReport,
	IGVSummary,
	Pdt621Input,
	Pdt621Result,
	ProfitLossReport,
	BalanceSheetReport,
	CashFlowReport,
	PseComplianceInput,
};
