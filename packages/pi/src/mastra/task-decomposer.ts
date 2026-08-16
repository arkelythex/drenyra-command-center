import type { AgentContext } from "../types/agent-context";

/** A decomposed task step */
export interface TaskStep {
	id: string;
	goal: string;
	domain: string;
	tools: string[];
	dependencies: string[];
}

/** Result from task decomposition */
export interface TaskDecompositionResult {
	goal: string;
	steps: TaskStep[];
	parallelGroups: string[][];
}

/**
 * Decomposes a complex goal into parallel/sequential task steps.
 * Maps naturally to Mastra's workflow step system.
 */
export class TaskDecomposer {
	/**
	 * Decompose a high-level goal into granular steps.
	 * Follows the FD workflow phases.
	 */
	decompose(
		goal: string,
		_context: AgentContext,
		availableDomains: string[],
	): TaskDecompositionResult {
		const goalLower = goal.toLowerCase();
		const steps: TaskStep[] = [];
		const stepId = () => `step-${steps.length + 1}`;

		// Always: Extract + Validate
		steps.push({
			id: stepId(),
			goal: `Extract data for: ${goal}`,
			domain: "scripta",
			tools: ["extract"],
			dependencies: [],
		});
		steps.push({
			id: stepId(),
			goal: `Validate extracted data for: ${goal}`,
			domain: "regula",
			tools: ["validate"],
			dependencies: ["step-1"],
		});

		// Classify if not data-only
		if (!goalLower.includes("extract") && !goalLower.includes("list")) {
			steps.push({
				id: stepId(),
				goal: `Classify: ${goal}`,
				domain: "cerno",
				tools: ["classify"],
				dependencies: ["step-2"],
			});
		}

		// Comply if fiscal/regulatory
		if (
			availableDomains.includes("regula") &&
			(goalLower.includes("igv") ||
				goalLower.includes("tax") ||
				goalLower.includes("compliance") ||
				goalLower.includes("sunat") ||
				goalLower.includes("fiscal"))
		) {
			const prevStep = steps[steps.length - 1];
			steps.push({
				id: stepId(),
				goal: `Compliance check for: ${goal}`,
				domain: "regula",
				tools: ["comply"],
				dependencies: prevStep ? [prevStep.id] : [],
			});
		}

		// Insights if analysis needed
		if (
			goalLower.includes("analyz") ||
			goalLower.includes("report") ||
			goalLower.includes("insight") ||
			goalLower.includes("compare")
		) {
			const prevStep = steps[steps.length - 1];
			steps.push({
				id: stepId(),
				goal: `Analyze: ${goal}`,
				domain: "lumen",
				tools: ["analyze"],
				dependencies: prevStep ? [prevStep.id] : [],
			});
		}

		// Consolidate if multiple sources
		if (
			steps.length > 3 ||
			goalLower.includes("merge") ||
			goalLower.includes("consolidate") ||
			goalLower.includes("compare")
		) {
			steps.push({
				id: stepId(),
				goal: `Consolidate results for: ${goal}`,
				domain: "fusio",
				tools: ["consolidate"],
				dependencies: steps.slice(-3).map((s) => s.id),
			});
		}

		// Build parallel groups
		const parallelGroups: string[][] = [];
		const processed = new Set<string>();

		for (const step of steps) {
			if (processed.has(step.id)) continue;

			if (step.dependencies.length === 0) {
				// Find all steps with no dependencies → parallel group
				const parallel = steps
					.filter((s) => s.dependencies.length === 0 && !processed.has(s.id))
					.map((s) => s.id);

				if (parallel.length > 0) {
					parallelGroups.push(parallel);
					for (const p of parallel) processed.add(p);
				}
			} else {
				processed.add(step.id);
				// Check if we should run remaining steps in parallel
				const remaining = steps.filter(
					(s) =>
						!processed.has(s.id) &&
						s.dependencies.every((d) => processed.has(d)),
				);
				if (remaining.length > 1) {
					parallelGroups.push(remaining.map((s) => s.id));
					for (const r of remaining) processed.add(r.id);
				} else if (remaining.length === 1) {
					const only = remaining[0];
					if (only) processed.add(only.id);
				}
			}
		}

		// Ensure all steps are accounted for
		for (const step of steps) {
			if (!processed.has(step.id)) {
				parallelGroups.push([step.id]);
				processed.add(step.id);
			}
		}

		return {
			goal,
			steps,
			parallelGroups,
		};
	}
}
