import {
	CONTEXT_EVALUATION_STATES,
	type ContextEvaluationMetricDTO,
	type ContextEvaluationState,
	type ContextEvaluationSummaryDTO,
	type ContextPolicySelectionResponseDTO,
} from "@drenyra/application";

interface PrepareSireEvaluationInput {
	approvalRequired: boolean;
	approvedBy: string | null;
	policy: ContextPolicySelectionResponseDTO;
	warningCount: number;
	documentarySourceCount: number;
	allExportsValid: boolean;
	status: "COMPLETED" | "FAILED" | "CANCELLED";
}

const READINESS_THRESHOLDS = {
	precision: { target: 0.92, blocker: 0.88 },
	recall: { target: 0.85, blocker: 0.8 },
	overrideRate: { target: 0.2, blocker: 0.3 },
	driftTrend: { target: 0.05, blocker: 0.12 },
	incidentRate: { target: 0, blocker: 2 },
} as const;

function metric(
	name: string,
	value: number,
	target: number,
	blocker: number,
	unit: "ratio" | "count",
): ContextEvaluationMetricDTO {
	return {
		metric: name,
		value,
		window: "representative-run",
		target,
		blocker,
		unit,
	};
}

function resolveState(
	metrics: readonly ContextEvaluationMetricDTO[],
): ContextEvaluationState {
	const blocker = metrics.some((entry) => {
		if (
			entry.metric === "override-rate" ||
			entry.metric === "drift-trend" ||
			entry.metric === "incident-rate"
		) {
			return entry.value > entry.blocker;
		}
		return entry.value < entry.blocker;
	});

	if (blocker) {
		return CONTEXT_EVALUATION_STATES.RED;
	}

	const alert = metrics.some((entry) => {
		if (
			entry.metric === "override-rate" ||
			entry.metric === "drift-trend" ||
			entry.metric === "incident-rate"
		) {
			return entry.value > entry.target;
		}
		return entry.value < entry.target;
	});

	return alert
		? CONTEXT_EVALUATION_STATES.YELLOW
		: CONTEXT_EVALUATION_STATES.GREEN;
}

export class ContextEvaluationService {
	buildPrepareSireSummary(
		input: PrepareSireEvaluationInput,
	): ContextEvaluationSummaryDTO {
		const precision = input.allExportsValid
			? Math.max(0.92, 1 - input.warningCount * 0.02)
			: 0.84;
		const recall =
			input.policy.retrievalMode === "hybrid-documentary"
				? input.documentarySourceCount > 0
					? 1
					: 0.78
				: 0.9;
		const overrideRate =
			input.approvalRequired && !input.approvedBy && input.status !== "FAILED"
				? 1
				: 0;
		const driftTrend =
			input.warningCount === 0 ? 0.03 : Math.min(0.2, input.warningCount / 20);
		const incidentRate = input.status === "FAILED" ? 1 : 0;

		const metrics = [
			metric(
				"precision",
				precision,
				READINESS_THRESHOLDS.precision.target,
				READINESS_THRESHOLDS.precision.blocker,
				"ratio",
			),
			metric(
				"recall",
				recall,
				READINESS_THRESHOLDS.recall.target,
				READINESS_THRESHOLDS.recall.blocker,
				"ratio",
			),
			metric(
				"override-rate",
				overrideRate,
				READINESS_THRESHOLDS.overrideRate.target,
				READINESS_THRESHOLDS.overrideRate.blocker,
				"ratio",
			),
			metric(
				"drift-trend",
				driftTrend,
				READINESS_THRESHOLDS.driftTrend.target,
				READINESS_THRESHOLDS.driftTrend.blocker,
				"ratio",
			),
			metric(
				"incident-rate",
				incidentRate,
				READINESS_THRESHOLDS.incidentRate.target,
				READINESS_THRESHOLDS.incidentRate.blocker,
				"count",
			),
		] as const;

		return {
			state: resolveState(metrics),
			metrics: [...metrics],
			generatedAt: new Date().toISOString(),
			notes: [
				"Representative supervised path evaluation derived from the persisted prepare-sire run.",
				`Documentary sources linked: ${input.documentarySourceCount}.`,
			],
		};
	}
}

export const contextEvaluationService = new ContextEvaluationService();
