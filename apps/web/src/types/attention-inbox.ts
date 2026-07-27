/**
 * Attention Inbox — prioritization model for the Workbench.
 *
 * Not sorted by date. Priority = Risk × materiality × deadline proximity × downstream impact.
 * This is the main screen for daily work.
 */

export type AttentionCategory =
	| "r3_approvals"
	| "material_risks"
	| "blocked_closes"
	| "missing_evidence"
	| "agent_questions"
	| "failed_automations"
	| "completed_ready";

export type AttentionPriority = "critical" | "high" | "medium" | "low";

export interface AttentionItem {
	id: string;
	category: AttentionCategory;
	title: string;
	description: string;
	priority: AttentionPriority;
	companyName: string;
	period: string;

	// Risk scoring
	riskScore: number; // 0-1
	materiality: number; // S/ estimated impact
	deadline: string | null; // ISO date or null
	downstreamImpact: number; // number of affected entities
	affectedCompanies: number;

	// Status
	status: "pending" | "in_progress" | "resolved";
	createdAt: string;

	// Actions
	primaryAction: string;
	primaryActionRoute?: string;
}

export interface AttentionCategoryInfo {
	id: AttentionCategory;
	label: string;
	icon: string;
	color: string;
	description: string;
}

export const ATTENTION_CATEGORIES: Record<
	AttentionCategory,
	AttentionCategoryInfo
> = {
	r3_approvals: {
		id: "r3_approvals",
		label: "Aprobaciones R3",
		icon: "ShieldAlert",
		color: "red",
		description: "Ejecuciones externas que requieren autorización profesional",
	},
	material_risks: {
		id: "material_risks",
		label: "Riesgos materiales",
		icon: "AlertTriangle",
		color: "amber",
		description: "Hallazgos con impacto financiero significativo",
	},
	blocked_closes: {
		id: "blocked_closes",
		label: "Cierres bloqueados",
		icon: "AlertOctagon",
		color: "red",
		description: "Empresas que no pueden cerrar el periodo",
	},
	missing_evidence: {
		id: "missing_evidence",
		label: "Evidencia faltante",
		icon: "FileSearch",
		color: "amber",
		description: "Documentos soporte requeridos no adjuntos",
	},
	agent_questions: {
		id: "agent_questions",
		label: "Preguntas de agentes",
		icon: "HelpCircle",
		color: "blue",
		description: "Agentes esperando información del usuario",
	},
	failed_automations: {
		id: "failed_automations",
		label: "Automatizaciones fallidas",
		icon: "AlertCircle",
		color: "red",
		description: "Tareas automáticas que no pudieron completarse",
	},
	completed_ready: {
		id: "completed_ready",
		label: "Completados y listos",
		icon: "CheckCircle",
		color: "green",
		description: "Trabajos finalizados listos para revisión final",
	},
};

/**
 * Calculate priority score for sorting.
 * Higher = more urgent.
 */
export function calculatePriorityScore(item: AttentionItem): number {
	let score = item.riskScore * 100; // 0-100

	// Materiality factor: S/ 10k+ adds up to 30 points
	score += Math.min((item.materiality / 10000) * 10, 30);

	// Deadline proximity: due within 24h adds 40 points, within week adds 20
	if (item.deadline) {
		const hoursUntilDeadline =
			(new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
		if (hoursUntilDeadline < 0)
			score += 50; // Past deadline
		else if (hoursUntilDeadline < 24) score += 40;
		else if (hoursUntilDeadline < 168) score += 20;
	}

	// Downstream impact: each affected company adds 5 points
	score += item.affectedCompanies * 5;

	// Critical items get a bonus
	if (item.priority === "critical") score += 30;
	if (item.priority === "high") score += 15;

	return score;
}

/**
 * Get color class for priority.
 */
export function priorityColor(priority: AttentionPriority): string {
	switch (priority) {
		case "critical":
			return "text-red-600 bg-red-500/10 border-red-500/20";
		case "high":
			return "text-orange-600 bg-orange-500/10 border-orange-500/20";
		case "medium":
			return "text-amber-600 bg-amber-500/10 border-amber-500/20";
		case "low":
			return "text-blue-600 bg-blue-500/10 border-blue-500/20";
	}
}
