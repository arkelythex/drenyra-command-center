/**
 * Fiscal Approval — Approval Gate
 *
 * A gatekeeper check that integrates with GatedPhasePipeline.
 * Pauses the pipeline until a human approves or rejects the recommendation.
 * Returns MANUAL_REVIEW status (not STOP) so the pipeline runner can continue
 * with other work while waiting.
 */

import type {
	GatekeeperCheck,
	GatekeeperContext,
	GatekeeperVerdict,
} from "@drenyra/orchestrator";
import { approvalStore } from "./approval-store";
import type { ApprovalGateConfig, Recommendation } from "./types";
import { DEFAULT_APPROVAL_GATE_CONFIG } from "./types";

/** Options for the approval gate. */
export interface ApprovalGateOptions {
	config?: Partial<ApprovalGateConfig>;
	store?: typeof approvalStore;
}

/**
 * Creates an approval gate for a specific recommendation.
 * The gate polls the approval store until the recommendation is approved,
 * rejected, or times out.
 */
export function createApprovalGate(
	rec: Recommendation,
	options?: ApprovalGateOptions,
): GatekeeperCheck<unknown> {
	const config: ApprovalGateConfig = {
		...DEFAULT_APPROVAL_GATE_CONFIG,
		...options?.config,
	};
	const store = options?.store ?? approvalStore;
	const created = new Date(rec.creado).getTime();

	return {
		name: `ApprovalGate-${rec.id}`,
		description: `Requires human approval for ${rec.tipoAccion} (REC-${rec.id})`,

		check: async (
			_data: unknown,
			_ctx: GatekeeperContext,
		): Promise<GatekeeperVerdict> => {
			// Store the recommendation if not already stored
			const existing = store.get(rec.id);
			if (!existing) {
				store.save(rec);
			}

			// Check current status (simulates polling)
			const current = store.get(rec.id);
			if (!current) {
				return {
					passed: false,
					reasons: [`REC-${rec.id}: recommendation not found`],
					severity: "BLOCKING",
					details: { rec },
				};
			}

			const elapsed = Date.now() - created;
			const elapsedHoras = elapsed / (1000 * 60 * 60);

			switch (current.status) {
				case "approved":
					return {
						passed: true,
						reasons: [`REC-${rec.id}: approved by ${current.aprobadoPor}`],
						severity: "INFO",
						details: { rec: current },
					};

				case "rejected":
					return {
						passed: false,
						reasons: [
							`REC-${rec.id}: rejected. Motivo: ${current.motivoRechazo}`,
						],
						severity: "BLOCKING",
						details: { rec: current, motivo: current.motivoRechazo },
					};

				case "timeout":
					return {
						passed: false,
						reasons: [`REC-${rec.id}: timed out after ${config.timeoutHoras}h`],
						severity: "BLOCKING",
						details: { rec: current, timeoutHoras: config.timeoutHoras },
					};

				case "pending":
					// Check for timeout
					if (elapsedHoras >= config.timeoutHoras) {
						const updated = store.get(rec.id);
						if (updated) {
							updated.status = "timeout";
						}
						return {
							passed: false,
							reasons: [
								`REC-${rec.id}: timed out after ${config.timeoutHoras}h`,
							],
							severity: "BLOCKING",
							details: { rec, timeoutHoras: config.timeoutHoras },
						};
					}

					// Still pending — return MANUAL_REVIEW
					return {
						passed: false,
						reasons: [
							`REC-${rec.id}: waiting for approval (${elapsedHoras.toFixed(1)}h / ${config.timeoutHoras}h)`,
						],
						severity: "BLOCKING",
						details: {
							rec,
							elapsedHoras: elapsedHoras.toFixed(1),
							timeoutHoras: config.timeoutHoras,
							escalateAfter: config.escalateAfter,
						},
					};

				default:
					return {
						passed: false,
						reasons: [`REC-${rec.id}: unexpected status '${current.status}'`],
						severity: "BLOCKING",
						details: { rec: current },
					};
			}
		},
	};
}
