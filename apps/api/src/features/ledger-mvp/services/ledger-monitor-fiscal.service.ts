import type { ComplianceDashboard, ComplianceIssue } from "@drenyra/domain";
import { Money } from "@drenyra/domain";
import type {
	PseComplianceInput,
	PseProactiveValidatorService,
} from "../../pse-compliance/pse-proactive-validator.service";
import type {
	LedgerFlowStatus,
	LedgerMonitorFiscalAlert,
	LedgerMonitorFiscalAlertCategory,
	LedgerMonitorFiscalAlertSource,
	LedgerMonitorFiscalInput,
	LedgerMonitorFiscalResult,
} from "../ledger-mvp.types";

function centsToPen(cents: number): number {
	return Money.fromCents(cents, "PEN").toNumber();
}

function uniqueNonEmpty(values: string[]): string[] {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

type ProactiveValidationResult = Awaited<
	ReturnType<PseProactiveValidatorService["validate"]>
>;
type ProactiveValidationAlert =
	ProactiveValidationResult["proactiveAlerts"][number];

function resolveAlertSource(
	proactiveAlerts: ProactiveValidationAlert[],
): LedgerMonitorFiscalAlertSource {
	return proactiveAlerts.some((alert) => /openrouter/i.test(alert.message))
		? "heuristic"
		: "ai";
}

function resolveAlertCategory(
	alert: ProactiveValidationAlert,
): LedgerMonitorFiscalAlertCategory {
	const normalizedText = `${alert.message} ${alert.action}`.toLowerCase();
	if (normalizedText.includes("igv")) return "igv";
	if (normalizedText.includes("rvie") || normalizedText.includes("rce"))
		return "rce";
	if (normalizedText.includes("pdt") || normalizedText.includes("ruc"))
		return "pdt";
	if (
		normalizedText.includes("openrouter") ||
		normalizedText.includes("credential") ||
		normalizedText.includes("provider")
	) {
		return "platform";
	}
	return "general";
}

function mapUnifiedAlerts(
	proactiveValidation: ProactiveValidationResult,
): LedgerMonitorFiscalAlert[] {
	const source = resolveAlertSource(proactiveValidation.proactiveAlerts);
	return proactiveValidation.proactiveAlerts.map((alert, index) => ({
		id: `${proactiveValidation.period}-${source}-${index + 1}`,
		severity: alert.level,
		category: resolveAlertCategory(alert),
		message: alert.message,
		confidence: proactiveValidation.confidence,
		source,
		recommendedAction: alert.action,
	}));
}

export interface LedgerMonitorFiscalPorts {
	validatePseCompliance: (
		input: PseComplianceInput,
	) => Promise<Awaited<ReturnType<PseProactiveValidatorService["validate"]>>>;
	getComplianceDashboard: (companyId: string) => Promise<ComplianceDashboard>;
	getComplianceIssues: (companyId: string) => Promise<ComplianceIssue[]>;
	traceIdFactory: () => string;
	nowFactory: () => Date;
}

export class LedgerMonitorFiscalService {
	constructor(private readonly ports: LedgerMonitorFiscalPorts) {}

	async run(
		input: LedgerMonitorFiscalInput,
	): Promise<LedgerMonitorFiscalResult> {
		const pseInput: PseComplianceInput = {
			companyId: input.companyId,
			period: input.period,
			ruc: input.ruc,
			ple: {
				salesRecords: input.ple.salesRecords,
				purchaseRecords: input.ple.purchaseRecords,
				salesTotalPen: centsToPen(input.ple.salesTotalCents),
				purchaseTotalPen: centsToPen(input.ple.purchaseTotalCents),
			},
			pdt: {
				form: input.pdt.form,
				declaredIgvPen: centsToPen(input.pdt.declaredIgvCents),
				declaredNetSalesPen: centsToPen(input.pdt.declaredNetSalesCents),
			},
			...(input.sire !== undefined ? { sire: input.sire } : {}),
		};

		const [proactiveValidation, complianceDashboard, openIssues] =
			await Promise.all([
				this.ports.validatePseCompliance(pseInput),
				this.ports.getComplianceDashboard(input.companyId),
				this.ports.getComplianceIssues(input.companyId),
			]);

		const criticalIssueExists = openIssues.some(
			(issue) => issue.severity === "CRITICAL",
		);

		const status = this.resolveStatus(
			proactiveValidation.status,
			complianceDashboard.sunatStatus,
			criticalIssueExists,
		);
		const alerts = mapUnifiedAlerts(proactiveValidation);

		const recommendedActions = uniqueNonEmpty([
			...proactiveValidation.recommendedActions,
			...(criticalIssueExists
				? [
						"Resolver issues CRITICAL antes de enviar cualquier declaración SUNAT.",
					]
				: []),
			...(status === "manual_review"
				? [
						"Escalar validación al contador responsable y registrar decisión HITL.",
					]
				: []),
		]);

		return {
			traceId: this.ports.traceIdFactory(),
			flow: "monitor_fiscal",
			generatedAt: this.ports.nowFactory().toISOString(),
			period: input.period,
			status,
			alerts,
			evidence: {
				proactiveValidation,
				complianceDashboard,
				openIssues,
			},
			recommendedActions,
		};
	}

	private resolveStatus(
		proactiveStatus: "ready" | "manual_review" | "blocked",
		sunatStatus: ComplianceDashboard["sunatStatus"],
		criticalIssueExists: boolean,
	): LedgerFlowStatus {
		if (criticalIssueExists || proactiveStatus === "blocked") {
			return "blocked";
		}

		if (proactiveStatus === "manual_review" || sunatStatus === "WARNINGS") {
			return "manual_review";
		}

		if (sunatStatus === "NON_COMPLIANT") {
			return "blocked";
		}

		return "ready";
	}
}
