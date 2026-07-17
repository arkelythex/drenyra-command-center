/**
 * Drenyra Orchestrator — Fiscal-Driven Workflow
 *
 * Inspirado en gentle-orchestrator de Gentleman-Programming.
 * Donde Gentle-AI usa SDD (Spec-Driven Development) para software,
 * Drenyra usa FD (Fiscal-Driven) para contabilidad.
 *
 * FD Phases:
 *   EXTRACT → CLASSIFY → VALIDATE → COMPLY → APPROVE → SUBMIT → ARCHIVE
 *
 * Cada fase es ejecutada por el Latin Agent correspondiente.
 * Las reglas de trigger (T1/T2/T3) determinan el nivel de procesamiento.
 */

import { type Agent, Mastra } from "@mastra/core";
import { type LatinAgentId, latinAgents } from "../agents/latin-agents";
import { approvalGateMiddleware } from "../middleware/approval-gate";
import { evidenceGraph } from "./evidence-graph";
import { fiscalRegistry } from "./fiscal-registry";
import { type TriggerLevel, triggerEngine } from "./trigger-engine";

// ─── Types ───────────────────────────────────────────────

export interface Tenant {
	companyId: string;
	ruc: string;
	userId: string;
	organizationId?: string;
	period?: string; // YYYYMM
}

export interface FiscalDocument {
	id: string;
	type:
		| "invoice"
		| "bill"
		| "credit-note"
		| "debit-note"
		| "retencion"
		| "percepcion"
		| "guia";
	format: "xml" | "pdf" | "txt" | "csv" | "json";
	content: string; // base64 or raw
	metadata: Record<string, unknown>;
}

export interface FiscalRequest {
	sessionId?: string;
	document: FiscalDocument;
	tenant: Tenant;
}

export interface FiscalStepResult {
	phase: string;
	agentId: LatinAgentId;
	status: "completed" | "skipped" | "blocked" | "escalated" | "error";
	data: unknown;
	confidence: number;
	durationMs: number;
	evidenceIds: string[];
}

export interface FiscalResult {
	success: boolean;
	steps: FiscalStepResult[];
	evidenceTrace: string[];
	summary: {
		triggerLevel: TriggerLevel;
		totalDurationMs: number;
		approved: boolean;
		submitted: boolean;
		archived: boolean;
	};
}

// ─── Drenyra Orchestrator ───────────────────────────────

/**
 * DrenyraOrchestrator — el corazón del sistema.
 *
 * Como gentle-orchestrator coordina las fases SDD,
 * DrenyraOrchestrator coordina las fases FD (Fiscal-Driven).
 *
 * Flujo típico:
 *   1. Llega un documento fiscal (factura XML, extracto CSV, etc.)
 *   2. TriggerEngine evalúa el nivel de procesamiento (T1/T2/T3)
 *   3. FiscalRegistry determina qué capacidades están disponibles
 *   4. Workflow ejecuta las fases necesarias secuencialmente
 *   5. Cada fase produce evidencia que queda registrada
 *   6. Si hay errores o triggers T3, escala a humano
 */
export class DrenyraOrchestrator {
	private agents: Record<LatinAgentId, Agent>;

	constructor() {
		this.agents = latinAgents;
		this.mastra = new Mastra({
			name: "Drenyra",
			agents: this.agents,
			middleware: [approvalGateMiddleware],
			telemetry: {
				serviceName: "drenyra",
				enabled: true,
			},
		});

		// Build fiscal workflow
		this.workflow = this.buildFiscalWorkflow();
	}

	/**
	 * Procesa un documento fiscal completo.
	 *
	 * Equivalente a gentle-orchestrator procesando un SDD cycle,
	 * pero para el dominio fiscal.
	 */
	async process(request: FiscalRequest): Promise<FiscalResult> {
		const sessionId = request.sessionId ?? `session-${Date.now()}`;
		const startTime = Date.now();
		const steps: FiscalStepResult[] = [];

		// 1. Registry: qué capacidades tiene este tenant?
		const capabilities = await fiscalRegistry.getForTenant(request.tenant.ruc);

		// 2. Trigger: qué nivel de procesamiento aplica?
		const trigger = await triggerEngine.evaluate({
			documentType: request.document.type,
			document: request.document,
			tenant: request.tenant,
			capabilities,
		});

		// 3. Execute fiscal phases
		const phases = this.determinePhases(request.document, trigger.level);

		for (const phase of phases) {
			const agent = this.agents[phase.agentId];
			if (!agent) {
				steps.push({
					phase: phase.id,
					agentId: phase.agentId,
					status: "skipped",
					data: { error: `Agent not found: ${phase.agentId}` },
					confidence: 0,
					durationMs: 0,
					evidenceIds: [],
				});
				continue;
			}

			const phaseStart = Date.now();

			try {
				// Si el trigger level bloquea esta fase, escalar
				if (trigger.level === "T3_critical" && phase.requiresApproval) {
					steps.push({
						phase: phase.id,
						agentId: phase.agentId,
						status: "escalated",
						data: { message: "Requires human approval (T3 critical)" },
						confidence: 0,
						durationMs: Date.now() - phaseStart,
						evidenceIds: [],
					});
					continue;
				}

				// Ejecutar el agente con el contexto fiscal
				const result = await agent.execute({
					prompt: phase.buildPrompt(request.document, request.tenant),
					context: {
						sessionId,
						tenant: request.tenant,
						triggerLevel: trigger.level,
					},
				});

				// Registrar evidencia
				const evidenceId = evidenceGraph.append({
					sessionId,
					traceId: `trace-${sessionId}`,
					agentId: phase.agentId,
					actionType: `fd-${phase.id}`,
					input: {
						documentId: request.document.id,
						tenant: request.tenant.ruc,
					},
					output: result,
					confidence: 0.85,
					metadata: {
						phase: phase.id,
						durationMs: Date.now() - phaseStart,
						triggerLevel: trigger.level,
					},
				});

				steps.push({
					phase: phase.id,
					agentId: phase.agentId,
					status: "completed",
					data: result,
					confidence: 0.85,
					durationMs: Date.now() - phaseStart,
					evidenceIds: [evidenceId],
				});
			} catch (error) {
				steps.push({
					phase: phase.id,
					agentId: phase.agentId,
					status: "error",
					data: {
						error: error instanceof Error ? error.message : String(error),
					},
					confidence: 0,
					durationMs: Date.now() - phaseStart,
					evidenceIds: [],
				});
			}
		}

		// 4. Determinar resultado final
		const errors = steps.filter((s) => s.status === "error");
		const escalated = steps.filter((s) => s.status === "escalated");
		const success = errors.length === 0 && escalated.length === 0;

		return {
			success,
			steps,
			evidenceTrace: steps.flatMap((s) => s.evidenceIds),
			summary: {
				triggerLevel: trigger.level,
				totalDurationMs: Date.now() - startTime,
				approved: !steps.some((s) => s.status === "blocked"),
				submitted: steps.some(
					(s) => s.phase === "submit" && s.status === "completed",
				),
				archived: steps.some(
					(s) => s.phase === "archive" && s.status === "completed",
				),
			},
		};
	}

	/**
	 * Determina qué fases ejecutar según el tipo de documento y trigger level.
	 *
	 * Inspirado en cómo gentle-orchestrator determina qué fases SDD ejecutar
	 * según la complejidad del cambio de código.
	 */
	private determinePhases(
		_document: FiscalDocument,
		triggerLevel: TriggerLevel,
	): Array<{
		id: string;
		agentId: LatinAgentId;
		requiresApproval: boolean;
		buildPrompt: (doc: FiscalDocument, tenant: Tenant) => string;
	}> {
		const basePhases = [
			{
				id: "extract",
				agentId: "cerno" as LatinAgentId,
				requiresApproval: false,
				buildPrompt: (doc: FiscalDocument, _t: Tenant) =>
					`Analiza el siguiente documento fiscal:\nTipo: ${doc.type}\nFormato: ${doc.format}\n\nExtrae: RUC emisor, RUC receptor, montos, IGV, fecha, serie-número`,
			},
			{
				id: "classify",
				agentId: "regula" as LatinAgentId,
				requiresApproval: false,
				buildPrompt: (doc: FiscalDocument, t: Tenant) =>
					`Clasifica el documento ${doc.id} según PCGE para el RUC ${t.ruc}`,
			},
			{
				id: "validate",
				agentId: "custos" as LatinAgentId,
				requiresApproval: false,
				buildPrompt: (doc: FiscalDocument, _t: Tenant) =>
					`Valida compliance SUNAT para el documento ${doc.id}. Verifica CPE, UBL 2.1, RUC.`,
			},
		];

		const compliancePhases = [
			{
				id: "comply",
				agentId: "custos" as LatinAgentId,
				requiresApproval: triggerLevel === "T2_strong",
				buildPrompt: (doc: FiscalDocument, t: Tenant) =>
					`Verifica compliance completo para ${doc.id} (RUC ${t.ruc}): detracciones, retenciones, IGV.`,
			},
			{
				id: "approve",
				agentId: "custos" as LatinAgentId,
				requiresApproval: false,
				buildPrompt: (_doc: FiscalDocument, _t: Tenant) =>
					"Ejecuta approval gate. Determina si la operación requiere aprobación humana o puede auto-aprobarse.",
			},
		];

		const submissionPhases = [
			{
				id: "submit",
				agentId: "necto" as LatinAgentId,
				requiresApproval: triggerLevel !== "T1_advisory",
				buildPrompt: (doc: FiscalDocument, t: Tenant) =>
					`Prepara y envía el documento ${doc.id} para RUC ${t.ruc}. Genera XML firmado, envía a OSE.`,
			},
			{
				id: "archive",
				agentId: "capsa" as LatinAgentId,
				requiresApproval: false,
				buildPrompt: (doc: FiscalDocument, _t: Tenant) =>
					`Archiva el documento ${doc.id} con toda la evidencia del procesamiento.`,
			},
		];

		// T1: solo análisis y validación
		if (triggerLevel === "T1_advisory") {
			return [
				...basePhases,
				...submissionPhases.filter((p) => p.id === "archive"),
			];
		}

		// T2: análisis + compliance
		if (triggerLevel === "T2_strong") {
			return [...basePhases, ...compliancePhases, ...submissionPhases];
		}

		// T3: todo + escalación
		return [...basePhases, ...compliancePhases, ...submissionPhases];
	}
}

// ─── Singleton ──────────────────────────────────────────

export const drenyra = new DrenyraOrchestrator();
