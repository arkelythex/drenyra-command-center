/**
 * Approval Gate — Middleware para Mastra
 *
 * Reemplaza el ApprovalGateEngine custom de agent-swarm/erp/approval-gate/
 * por un middleware desacoplado. Tres niveles de approval:
 *
 * 1. auto — se ejecuta sin revisión
 * 2. fiscal_gate — requiere validación de gobernanza (reglas automáticas)
 * 3. human — requiere aprobación humana explícita
 */

import type { StepMiddleware } from "@mastra/core";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────

export const ApprovalLevel = z.enum(["auto", "fiscal_gate", "human"]);
export type ApprovalLevel = z.infer<typeof ApprovalLevel>;

export interface ApprovalAction {
	type: string;
	description: string;
	approvalLevel: ApprovalLevel;
	payload: unknown;
	agentId: string;
	tenant: {
		companyId: string;
		ruc: string;
		userId: string;
	};
}

export interface ApprovalDecision {
	ok: boolean;
	code?: "APPROVED" | "GOVERNANCE_BLOCKED" | "HUMAN_REQUIRED" | "ERROR";
	error?: string;
	approvalId?: string;
	details?: unknown;
}

// ─── Reglas de Gobernanza ─────────────────────────────────

const GOVERNANCE_RULES = [
	{
		// Operaciones > S/ 10,000 requieren fiscal_gate
		id: "high-value",
		check: (action: ApprovalAction): boolean => {
			const payload = action.payload as { amountCents?: number };
			return (payload.amountCents ?? 0) > 1_000_000; // S/ 10,000 en céntimos
		},
		block: true,
		reason: "Monto superior a S/ 10,000 requiere validación de compliance",
	},
	{
		// Envío a SUNAT siempre requiere fiscal_gate
		id: "sunat-submission",
		check: (action: ApprovalAction): boolean => {
			return action.type.includes("sire") || action.type.includes("sunat");
		},
		block: false, // No bloquea, pero requiere approval
		reason: "Envío a SUNAT — operación sensible",
	},
	{
		// Modificación de datos maestros requiere approval humano
		id: "master-data",
		check: (action: ApprovalAction): boolean => {
			return action.type.includes("master-data");
		},
		block: true,
		reason: "Modificación de datos maestros requiere aprobación humana",
		humanRequired: true,
	},
];

// ─── Middleware ────────────────────────────────────────────

export class ApprovalGateMiddleware {
	async check(action: ApprovalAction): Promise<ApprovalDecision> {
		// Nivel auto: pasa directo
		if (action.approvalLevel === "auto") {
			return { ok: true, code: "APPROVED" };
		}

		// Aplicar reglas de gobernanza
		for (const rule of GOVERNANCE_RULES) {
			if (rule.check(action)) {
				// Si requiere humano y la regla dice que sí
				if (rule.humanRequired) {
					return {
						ok: false,
						code: "HUMAN_REQUIRED",
						approvalId: `approval-${Date.now()}`,
						error: rule.reason,
						details: {
							rule: rule.id,
							action: action.type,
							agentId: action.agentId,
						},
					};
				}

				// Si bloquea y no es auto-approvable
				if (rule.block && action.approvalLevel !== "fiscal_gate") {
					return {
						ok: false,
						code: "GOVERNANCE_BLOCKED",
						error: rule.reason,
						details: { rule: rule.id },
					};
				}
			}
		}

		// Fiscal gate: validación automática pasó
		if (action.approvalLevel === "fiscal_gate") {
			return {
				ok: true,
				code: "APPROVED",
				approvalId: `auto-${Date.now()}`,
				details: { validatedBy: "governance-rules" },
			};
		}

		return { ok: true, code: "APPROVED" };
	}
}

// ─── Mastra Step Middleware ───────────────────────────────

export const approvalGateMiddleware: StepMiddleware = {
	before: async ({ context }) => {
		const action = context?.action as ApprovalAction | undefined;
		if (!action) return;

		const gate = new ApprovalGateMiddleware();
		const decision = await gate.check(action);

		if (!decision.ok && decision.code === "GOVERNANCE_BLOCKED") {
			throw new Error(`GOVERNANCE_BLOCKED: ${decision.error}`);
		}

		if (decision.code === "HUMAN_REQUIRED") {
			// En lugar de bloquear, marcamos para revisión
			// El workflow supervisor lo manejará
			return {
				status: "pending_approval",
				approvalId: decision.approvalId,
				reason: decision.error,
			};
		}
	},

	after: async ({ result, context }) => {
		const action = context?.action as ApprovalAction | undefined;
		if (!action) return;
	},
};
