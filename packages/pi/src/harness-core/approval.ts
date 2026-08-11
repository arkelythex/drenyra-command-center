/**
 * Approval Workflow — configurable gate-based approval system.
 *
 * Allows adding named approval gates, each with a condition function
 * that determines if a task requires approval, and an optional handler
 * that performs the actual approval check.
 *
 * Zero fiscal imports — all gates are generic condition functions,
 * not hardcoded fiscal keywords.
 *
 * @module @drenyra/platform-core/harness
 */

import type { ApprovalGate, ApprovalRequest } from "./types.js";

/**
 * Configurable approval workflow with composable gates.
 *
 * @example
 * ```ts
 * const workflow = new ApprovalWorkflow();
 *
 * // Add a gate for submit-like actions
 * workflow.addGate({
 *   name: "submit-gate",
 *   description: "Requires approval for submit operations",
 *   condition: (task) => task.toLowerCase().includes("submit"),
 *   handler: async (request) => {
 *     // Custom approval logic (e.g., notify human)
 *     return true;
 *   },
 * });
 *
 * workflow.taskRequiresApproval("submit report"); // true
 * ```
 */
export class ApprovalWorkflow {
	private gates: ApprovalGate[] = [];

	/**
	 * Add an approval gate to the workflow.
	 * Gates are evaluated in order of addition.
	 */
	addGate(gate: ApprovalGate): void {
		this.gates.push(gate);
	}

	/**
	 * Add multiple gates at once.
	 */
	addGates(gates: ApprovalGate[]): void {
		this.gates.push(...gates);
	}

	/**
	 * Remove a gate by name.
	 */
	removeGate(name: string): boolean {
		const index = this.gates.findIndex((g) => g.name === name);
		if (index === -1) return false;
		this.gates.splice(index, 1);
		return true;
	}

	/**
	 * Get all registered gates.
	 */
	getGates(): readonly ApprovalGate[] {
		return [...this.gates];
	}

	/**
	 * Check if a task matches any gate's condition.
	 * Optionally check only against a specific agentRequiresApproval flag.
	 */
	taskRequiresApproval(task: string, agentRequiresApproval?: boolean): boolean {
		if (agentRequiresApproval) return true;
		return this.gates.some((gate) => gate.condition(task));
	}

	/**
	 * Evaluate all matching gates for a task and return the approval decisions.
	 * If no gates match, the task is considered approved by default.
	 *
	 * Returns an array of results, one per matching gate.
	 * All gates must approve for the task to proceed.
	 */
	async evaluate(
		request: ApprovalRequest,
	): Promise<{ gate: string; approved: boolean; reason?: string | undefined }[]> {
		const results: {
			gate: string;
			approved: boolean;
			reason?: string | undefined;
		}[] = [];

		for (const gate of this.gates) {
			if (!gate.condition(request.task)) continue;

			if (gate.handler) {
				const approved = await gate.handler(request);
				results.push({
					gate: gate.name,
					approved,
					reason: approved
						? undefined
						: `Gate "${gate.name}" rejected the request`,
				});
			} else {
				// Gate matches but has no handler — requires intervention
				results.push({
					gate: gate.name,
					approved: false,
					reason: `Gate "${gate.name}" matches but no handler is registered`,
				});
			}
		}

		// If no gates matched, auto-approved
		if (results.length === 0) {
			results.push({
				gate: "__default__",
				approved: true,
				reason: "No gates matched — auto-approved",
			});
		}

		return results;
	}

	/**
	 * Clear all gates.
	 */
	clear(): void {
		this.gates = [];
	}
}
