import { createHash, randomUUID } from "node:crypto";

export type GovernanceAction =
	| "process_invoices"
	| "multi_ruc_process"
	| "reconcile"
	| "sire_submit"
	| "electronic_invoice_send";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface AutonomyApproval {
	approvedBy: string;
	reason: string;
	approvedAt?: string;
}

export interface AutonomyEvaluationInput {
	action: GovernanceAction;
	priority: TaskPriority;
	objective?: string;
	estimatedAmountPen?: number;
	riskScore?: number;
	approval?: AutonomyApproval;
}

export interface AutonomyRuleEvaluation {
	rule: string;
	passed: boolean;
	reason: string;
	actual?: number | string | boolean;
	threshold?: number | boolean;
}

export interface AutonomyDecisionTrace {
	decisionId: string;
	timestamp: string;
	action: GovernanceAction;
	objective: string;
	decision: "ALLOW" | "BLOCK";
	reason: string;
	constraints: {
		enabled: boolean;
		globalKillSwitch: boolean;
		maxAutoExecutionPen: number;
		maxRiskScore: number;
		requireApprovalForCritical: boolean;
	};
	rules: AutonomyRuleEvaluation[];
	hash: string;
}

export interface AutonomyEvaluationResult {
	allowed: boolean;
	statusCode?: 403 | 503;
	code?: string;
	message?: string;
	requiresApproval: boolean;
	trace: AutonomyDecisionTrace;
}

interface AutonomyConfig {
	enabled: boolean;
	globalKillSwitch: boolean;
	maxAutoExecutionPen: number;
	maxRiskScore: number;
	requireApprovalForCritical: boolean;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
	if (!value) return fallback;
	const normalized = value.trim().toLowerCase();
	if (normalized === "1" || normalized === "true" || normalized === "yes")
		return true;
	if (normalized === "0" || normalized === "false" || normalized === "no")
		return false;
	return fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) return fallback;
	return parsed;
}

function hasValidApproval(approval?: AutonomyApproval): boolean {
	if (!approval) return false;
	return (
		approval.approvedBy.trim().length > 0 && approval.reason.trim().length > 0
	);
}

export class AutonomyPolicyService {
	static evaluate(input: AutonomyEvaluationInput): AutonomyEvaluationResult {
		const config = AutonomyPolicyService.readConfig();
		const rules: AutonomyRuleEvaluation[] = [];
		const approvalValid = hasValidApproval(input.approval);

		rules.push({
			rule: "autonomy.enabled",
			passed: config.enabled,
			reason: config.enabled
				? "Autonomy policies enabled"
				: "Autonomy policies disabled by configuration",
			actual: config.enabled,
			threshold: true,
		});

		if (!config.enabled) {
			return AutonomyPolicyService.allow({
				input,
				config,
				rules,
				reason: "Autonomy layer disabled",
			});
		}

		rules.push({
			rule: "autonomy.global_kill_switch",
			passed: !config.globalKillSwitch,
			reason: config.globalKillSwitch
				? "Global kill switch is active"
				: "Global kill switch is inactive",
			actual: config.globalKillSwitch,
			threshold: false,
		});

		if (config.globalKillSwitch) {
			return AutonomyPolicyService.block({
				input,
				config,
				rules,
				requiresApproval: false,
				statusCode: 503,
				code: "AUTONOMY_KILL_SWITCH_ACTIVE",
				message:
					"Autonomous execution is globally disabled (kill switch active).",
				reason: "Global kill switch active",
			});
		}

		if (input.approval && !approvalValid) {
			rules.push({
				rule: "autonomy.approval.payload",
				passed: false,
				reason:
					"Approval payload is malformed (approvedBy and reason are required)",
			});

			return AutonomyPolicyService.block({
				input,
				config,
				rules,
				requiresApproval: true,
				statusCode: 403,
				code: "AUTONOMY_INVALID_APPROVAL",
				message: "Approval payload is invalid. Provide approvedBy and reason.",
				reason: "Invalid approval payload",
			});
		}

		const breaches: string[] = [];

		if (config.requireApprovalForCritical) {
			const criticalAllowed = input.priority !== "critical" || approvalValid;
			rules.push({
				rule: "autonomy.critical_requires_approval",
				passed: criticalAllowed,
				reason: criticalAllowed
					? "Critical policy satisfied"
					: "Critical execution requires human approval",
				actual: input.priority === "critical",
				threshold: true,
			});
			if (!criticalAllowed)
				breaches.push("critical execution requires approval");
		}

		if (typeof input.estimatedAmountPen === "number") {
			const amountAllowed =
				input.estimatedAmountPen <= config.maxAutoExecutionPen || approvalValid;
			rules.push({
				rule: "autonomy.max_auto_execution_pen",
				passed: amountAllowed,
				reason: amountAllowed
					? "Amount policy satisfied"
					: `Amount exceeds max auto execution threshold (${config.maxAutoExecutionPen} PEN)`,
				actual: input.estimatedAmountPen,
				threshold: config.maxAutoExecutionPen,
			});
			if (!amountAllowed)
				breaches.push("amount exceeds auto-execution threshold");
		}

		if (typeof input.riskScore === "number") {
			const riskAllowed =
				input.riskScore <= config.maxRiskScore || approvalValid;
			rules.push({
				rule: "autonomy.max_risk_score",
				passed: riskAllowed,
				reason: riskAllowed
					? "Risk policy satisfied"
					: `Risk score exceeds maximum threshold (${config.maxRiskScore})`,
				actual: input.riskScore,
				threshold: config.maxRiskScore,
			});
			if (!riskAllowed) breaches.push("risk exceeds allowed threshold");
		}

		if (breaches.length > 0) {
			return AutonomyPolicyService.block({
				input,
				config,
				rules,
				requiresApproval: true,
				statusCode: 403,
				code: "AUTONOMY_APPROVAL_REQUIRED",
				message: `Execution blocked by autonomy policy: ${breaches.join("; ")}.`,
				reason: "Policy breaches without approved override",
			});
		}

		if (approvalValid) {
			rules.push({
				rule: "autonomy.approval.override",
				passed: true,
				reason: `Approved by ${input.approval?.approvedBy}`,
			});
		}

		return AutonomyPolicyService.allow({
			input,
			config,
			rules,
			reason: approvalValid
				? "Allowed with human approval"
				: "Allowed by policy",
		});
	}

	private static allow(args: {
		input: AutonomyEvaluationInput;
		config: AutonomyConfig;
		rules: AutonomyRuleEvaluation[];
		reason: string;
	}): AutonomyEvaluationResult {
		const trace = AutonomyPolicyService.buildTrace({
			input: args.input,
			config: args.config,
			rules: args.rules,
			decision: "ALLOW",
			reason: args.reason,
		});

		return {
			allowed: true,
			requiresApproval: false,
			trace,
		};
	}

	private static block(args: {
		input: AutonomyEvaluationInput;
		config: AutonomyConfig;
		rules: AutonomyRuleEvaluation[];
		requiresApproval: boolean;
		statusCode: 403 | 503;
		code: string;
		message: string;
		reason: string;
	}): AutonomyEvaluationResult {
		const trace = AutonomyPolicyService.buildTrace({
			input: args.input,
			config: args.config,
			rules: args.rules,
			decision: "BLOCK",
			reason: args.reason,
		});

		return {
			allowed: false,
			statusCode: args.statusCode,
			code: args.code,
			message: args.message,
			requiresApproval: args.requiresApproval,
			trace,
		};
	}

	private static buildTrace(args: {
		input: AutonomyEvaluationInput;
		config: AutonomyConfig;
		rules: AutonomyRuleEvaluation[];
		decision: "ALLOW" | "BLOCK";
		reason: string;
	}): AutonomyDecisionTrace {
		const timestamp = new Date().toISOString();
		const decisionId = randomUUID();

		const traceCore = {
			decisionId,
			timestamp,
			action: args.input.action,
			objective: args.input.objective ?? "unspecified",
			decision: args.decision,
			reason: args.reason,
			constraints: {
				enabled: args.config.enabled,
				globalKillSwitch: args.config.globalKillSwitch,
				maxAutoExecutionPen: args.config.maxAutoExecutionPen,
				maxRiskScore: args.config.maxRiskScore,
				requireApprovalForCritical: args.config.requireApprovalForCritical,
			},
			rules: args.rules,
		};

		const hash = createHash("sha256")
			.update(JSON.stringify(traceCore))
			.digest("hex");

		return { ...traceCore, hash };
	}

	private static readConfig(): AutonomyConfig {
		return {
			enabled: parseBoolean(process.env.AUTONOMY_ENABLED, true),
			globalKillSwitch: parseBoolean(
				process.env.AUTONOMY_GLOBAL_KILL_SWITCH,
				false,
			),
			maxAutoExecutionPen: parseNumber(
				process.env.AUTONOMY_MAX_AUTO_EXECUTION_PEN,
				10_000,
			),
			maxRiskScore: parseNumber(process.env.AUTONOMY_MAX_RISK_SCORE, 0.25),
			requireApprovalForCritical: parseBoolean(
				process.env.AUTONOMY_REQUIRE_APPROVAL_FOR_CRITICAL,
				true,
			),
		};
	}
}
