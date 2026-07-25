/**
 * Fiscal Approval — Approval Store
 *
 * In-memory store for pending/approved/rejected recommendations.
 * In production, this is backed by the Evidence Store for audit trail persistence.
 */

import type { ApprovalAction, ApprovalSummary, Recommendation } from "./types";

/**
 * In-memory store. Replace with Evidence Store persistence in production.
 */
class InMemoryApprovalStore {
	private recommendations = new Map<string, Recommendation>();
	private approvals: ApprovalAction[] = [];

	/** Save a new pending recommendation. */
	save(rec: Recommendation): void {
		this.recommendations.set(rec.id, { ...rec });
	}

	/** Get a recommendation by ID. */
	get(id: string): Recommendation | undefined {
		return this.recommendations.get(id);
	}

	/** List all recommendations (optionally filtered by status and RUC). */
	list(options?: {
		status?: string;
		ruc?: string;
		periodo?: string;
		limit?: number;
	}): Recommendation[] {
		let results = Array.from(this.recommendations.values());

		if (options?.status) {
			results = results.filter((r) => r.status === options.status);
		}
		if (options?.ruc) {
			results = results.filter((r) => r.ruc === options.ruc);
		}
		if (options?.periodo) {
			results = results.filter((r) => r.periodo === options.periodo);
		}

		// Sort by creation date (newest first)
		results.sort((a, b) => b.creado.localeCompare(a.creado));

		if (options?.limit && results.length > options.limit) {
			results = results.slice(0, options.limit);
		}

		return results;
	}

	/** Approve a recommendation. Returns the updated recommendation or undefined if not found. */
	approve(id: string, userId: string): Recommendation | undefined {
		const rec = this.recommendations.get(id);
		if (rec?.status !== "pending") return undefined;

		rec.status = "approved";
		rec.aprobadoPor = userId;
		rec.aprobadoEn = new Date().toISOString();

		this.approvals.push({
			recommendationId: id,
			action: "approve",
			userId,
			timestamp: rec.aprobadoEn,
		});

		this.recommendations.set(id, { ...rec });
		return { ...rec };
	}

	/** Reject a recommendation with an optional reason. */
	reject(
		id: string,
		userId: string,
		motivo: string,
	): Recommendation | undefined {
		const rec = this.recommendations.get(id);
		if (rec?.status !== "pending") return undefined;

		rec.status = "rejected";
		rec.aprobadoPor = userId;
		rec.aprobadoEn = new Date().toISOString();
		rec.motivoRechazo = motivo;

		this.approvals.push({
			recommendationId: id,
			action: "reject",
			userId,
			motivo,
			timestamp: rec.aprobadoEn,
		});

		this.recommendations.set(id, { ...rec });
		return { ...rec };
	}

	/** Get summary statistics. */
	getSummary(): ApprovalSummary {
		const all = Array.from(this.recommendations.values());
		return {
			total: all.length,
			pending: all.filter((r) => r.status === "pending").length,
			approved: all.filter((r) => r.status === "approved").length,
			rejected: all.filter((r) => r.status === "rejected").length,
			escalated: all.filter(
				(r) => r.status === "escalated" || r.status === "timeout",
			).length,
			recommendations: all,
		};
	}

	/** Get approval action history. */
	getHistory(): ApprovalAction[] {
		return [...this.approvals];
	}

	/** Clear all data (for tests). */
	clear(): void {
		this.recommendations.clear();
		this.approvals = [];
	}
}

/** Default singleton store. */
export const approvalStore = new InMemoryApprovalStore();
