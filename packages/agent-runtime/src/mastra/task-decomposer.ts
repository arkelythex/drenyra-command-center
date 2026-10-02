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
		const steps = this.buildSteps(goal, availableDomains);
		const parallelGroups = this.buildParallelGroups(steps);

		return {
			goal,
			steps,
			parallelGroups,
		};
	}

	/** Linear step plan for the goal (extract → validate → optional stages). */
	private buildSteps(goal: string, availableDomains: string[]): TaskStep[] {
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
			steps.push({
				id: stepId(),
				goal: `Compliance check for: ${goal}`,
				domain: "regula",
				tools: ["comply"],
				dependencies: [steps[steps.length - 1].id],
			});
		}

		// Insights if analysis needed
		if (
			goalLower.includes("analyz") ||
			goalLower.includes("report") ||
			goalLower.includes("insight") ||
			goalLower.includes("compare")
		) {
			steps.push({
				id: stepId(),
				goal: `Analyze: ${goal}`,
				domain: "lumen",
				tools: ["analyze"],
				dependencies: [steps[steps.length - 1].id],
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

		return steps;
	}

	/** Group steps whose dependencies are satisfied so they can run in parallel. */
	private buildParallelGroups(steps: TaskStep[]): string[][] {
		const parallelGroups: string[][] = [];
		const processed = new Set<string>();

		for (const step of steps) {
			if (processed.has(step.id)) continue;
			const group =
				step.dependencies.length === 0
					? rootGroup(steps, processed)
					: readyGroup(step, steps, processed);
			if (group) parallelGroups.push(group);
		}

		// Ensure all steps are accounted for
		for (const step of steps) {
			if (!processed.has(step.id)) {
				parallelGroups.push([step.id]);
				processed.add(step.id);
			}
		}

		return parallelGroups;
	}
}

/** All still-unprocessed steps with no dependencies form one parallel group. */
function rootGroup(steps: TaskStep[], processed: Set<string>): string[] | null {
	const parallel = steps
		.filter((s) => s.dependencies.length === 0 && !processed.has(s.id))
		.map((s) => s.id);
	if (parallel.length === 0) return null;
	for (const id of parallel) processed.add(id);
	return parallel;
}

/** Mark the step done; if several others became ready, they run in parallel. */
function readyGroup(
	step: TaskStep,
	steps: TaskStep[],
	processed: Set<string>,
): string[] | null {
	processed.add(step.id);
	const remaining = steps.filter(
		(s) =>
			!processed.has(s.id) && s.dependencies.every((d) => processed.has(d)),
	);
	for (const r of remaining) processed.add(r.id);
	return remaining.length > 1 ? remaining.map((r) => r.id) : null;
}
