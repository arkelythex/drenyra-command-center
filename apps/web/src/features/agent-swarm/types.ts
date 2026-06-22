/**
 * @fileoverview Tipos y constantes para el sistema de agentes
 * @module features/agent-swarm/types
 */

import type { LucideIcon } from "lucide-react";

/**
 * Estados posibles de un agente en el enjambre
 */
export type AgentStatus = "idle" | "ready" | "active" | "completed" | "error";

/**
 * Configuración visual para cada estado de agente
 */
export interface AgentStateConfig {
	/** Clases CSS para el contenedor principal */
	containerClass: string;
	/** Clases CSS para el contenedor del icono */
	iconClass: string;
	/** Texto del badge de estado */
	badgeText: string;
	/** Clases CSS para el badge */
	badgeClass: string;
}

/**
 * Definición de un agente en el sistema
 */
export interface Agent {
	/** Identificador único del agente */
	id: string;
	/** Nombre legible del agente */
	label: string;
	/** Icono Lucide para representar el agente */
	icon: LucideIcon;
	/** Descripción de la función del agente */
	description: string;
	/** Color temático del agente (Tailwind class) */
	themeColor: string;
}

/**
 * Evento de transición de estado de un agente
 */
export interface AgentStateTransition {
	/** ID del agente */
	agentId: string;
	/** Nuevo estado */
	status: AgentStatus;
	/** Timestamp de la transición */
	timestamp: number;
	/** Mensaje opcional del agente */
	message?: string;
	/** Porcentaje de progreso (0-100) */
	progress?: number;
}

/**
 * Configuración visual por estado
 * Nota: Las clases deben mantener contraste WCAG AA mínimo
 */
export const STATE_CONFIG: Record<AgentStatus, AgentStateConfig> = {
	idle: {
		containerClass: "opacity-50 grayscale border-border/50 bg-card/40",
		iconClass: "text-muted-foreground bg-muted/60 border-border",
		badgeText: "Standby",
		badgeClass: "bg-muted/60 border-border text-muted-foreground",
	},
	ready: {
		containerClass: "opacity-100 border-border bg-card",
		iconClass: "text-foreground bg-muted border-border",
		badgeText: "Ready",
		badgeClass: "bg-muted border-border text-muted-foreground",
	},
	active: {
		containerClass:
			"border-primary/40 bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02] z-10",
		iconClass:
			"text-primary bg-primary/15 border-primary/40 shadow-md shadow-primary/20",
		badgeText: "Processing",
		badgeClass: "bg-primary/20 border-primary/30 text-primary animate-pulse",
	},
	completed: {
		containerClass: "border-[rgba(var(--premium-success-rgb),0.30)] bg-[rgba(var(--premium-success-rgb),0.05)]",
		iconClass: "text-[var(--premium-success)] bg-[rgba(var(--premium-success-rgb),0.15)] border-[rgba(var(--premium-success-rgb),0.40)]",
		badgeText: "Done",
		badgeClass: "bg-[rgba(var(--premium-success-rgb),0.20)] border-[rgba(var(--premium-success-rgb),0.30)] text-[var(--premium-success)]",
	},
	error: {
		containerClass: "border-red-500/30 bg-red-500/[0.05]",
		iconClass: "text-red-400 bg-red-500/15 border-red-500/40",
		badgeText: "Error",
		badgeClass: "bg-red-500/20 border-red-500/30 text-red-400",
	},
} as const;

/**
 * Lista de agentes del sistema (orden de ejecución)
 * Nota: Los iconos se importan dinámicamente en el componente
 */
export const AGENT_DEFINITIONS = [
	{
		id: "lector",
		label: "Lector",
		iconName: "ScanLine" as const,
		description: "Ingesta de Datos",
		themeColor: "sky",
	},
	{
		id: "validador",
		label: "Validador",
		iconName: "ShieldAlert" as const,
		description: "Auditoría SUNAT",
		themeColor: "steel",
	},
	{
		id: "arbitro",
		label: "Árbitro",
		iconName: "Zap" as const,
		description: "Estrategia Fiscal",
		themeColor: "amber",
	},
	{
		id: "ejecutor",
		label: "Ejecutor",
		iconName: "PlayCircle" as const,
		description: "Acción Ledger",
		themeColor: "emerald",
	},
] as const;

/** IDs de agentes válidos */
export type AgentId = (typeof AGENT_DEFINITIONS)[number]["id"];

/**
 * Type guard para verificar si un string es un AgentStatus válido
 */
export function isAgentStatus(status: string): status is AgentStatus {
	return ["idle", "ready", "active", "completed", "error"].includes(status);
}

/**
 * Calcula el progreso global del enjambre basado en estados individuales
 */
export function calculateSwarmProgress(states: Record<string, AgentStatus>): {
	completed: number;
	active: number;
	total: number;
	percentage: number;
} {
	const values = Object.values(states);
	const total = values.length;
	const completed = values.filter((s) => s === "completed").length;
	const active = values.filter((s) => s === "active").length;
	const percentage = total > 0 ? (completed / total) * 100 : 0;

	return { completed, active, total, percentage };
}
