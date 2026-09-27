/**
 * Fiscal Approval — Audit Trail
 *
 * Records every approval/rejection action with full context:
 * who, what, when, why, and the evidence hash.
 */

import type { ApprovalAction, Recommendation } from "./types";

/** A single audit log entry. */
export interface AuditEntry {
	id: string;
	recommendationId: string;
	action: "approve" | "reject" | "escalate" | "timeout";
	userId: string;
	motivo?: string | undefined;
	timestamp: string;
	ruc: string;
	periodo: string;
	tipoAccion: string;
	monto: number;
	confianza: number;
}

let _nextAuditId = 1;

/**
 * Create an audit entry for an approval or rejection.
 */
export function createAuditEntry(
	action: ApprovalAction,
	recommendation: Recommendation,
): AuditEntry {
	return {
		id: `AUDIT-${String(_nextAuditId++).padStart(4, "0")}`,
		recommendationId: action.recommendationId,
		action: action.action === "approve" ? "approve" : "reject",
		userId: action.userId,
		motivo: action.motivo,
		timestamp: action.timestamp,
		ruc: recommendation.ruc,
		periodo: recommendation.periodo,
		tipoAccion: recommendation.tipoAccion,
		monto: recommendation.monto,
		confianza: recommendation.confianza,
	};
}

/**
 * Format an audit entry as human-readable text.
 */
export function formatAuditEntry(entry: AuditEntry): string {
	const actionLabel =
		entry.action === "approve" ? "✅ Aprobada" : "❌ Rechazada";
	const lines: string[] = [
		`${actionLabel} — ${entry.recommendationId}`,
		`  Por: ${entry.userId}`,
		`  Fecha: ${entry.timestamp}`,
	];

	if (entry.motivo) {
		lines.push(`  Motivo: ${entry.motivo}`);
	}

	lines.push(
		`  Acción: ${entry.tipoAccion}`,
		`  RUC: ${entry.ruc}`,
		`  Período: ${entry.periodo}`,
		`  Monto: PEN ${entry.monto.toFixed(2)}`,
		`  Confianza: ${(entry.confianza * 100).toFixed(0)}%`,
		`  ID: ${entry.id}`,
	);

	return lines.join("\n");
}
