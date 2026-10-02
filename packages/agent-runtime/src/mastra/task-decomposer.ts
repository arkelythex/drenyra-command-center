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

	/**
	 * Group steps into topological levels: every step in a group has all its
	 * dependencies in earlier groups, so a group can run in parallel.
	 * Each step appears in exactly one group.
	 */
	private buildParallelGroups(steps: TaskStep[]): string[][] {
		const groups: string[][] = [];
		const done = new Set<string>();
		let pending = [...steps];

		while (pending.length > 0) {
			const ready = pending.filter((s) =>
				s.dependencies.every((d) => done.has(d)),
			);
			// Unresolvable dependencies: schedule the next step alone instead of looping forever.
			const level = ready.length > 0 ? ready : [pending[0]];
			groups.push(level.map((s) => s.id));
			for (const s of level) done.add(s.id);
			pending = pending.filter((s) => !done.has(s.id));
		}

		return groups;
	}
}
