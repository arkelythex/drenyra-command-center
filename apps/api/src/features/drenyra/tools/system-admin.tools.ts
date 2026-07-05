import type { AgentContext, AgentTool } from "@drenyra/drenyra-orchestrator";
import { z } from "zod";

/**
 * manageIntegrationsTool const.
 *
 * @example
 * ```ts
 * console.log(manageIntegrationsTool);
 * ```
 */
export const manageIntegrationsTool: AgentTool = {
	name: "manage_integrations",
	description: "Gestiona las integraciones y conexiones externas del sistema.",
	inputSchema: z.object({
		action: z.enum(["list", "test", "configure"]),
		integrationType: z.string().optional(),
		config: z.record(z.string(), z.any()).optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		integrations: z.array(z.any()).optional(),
		message: z.string(),
	}),
	approvalLevel: "notify",
	async execute(input: unknown, _context: AgentContext) {
		const inp = input as { action: string };
		return {
			success: true,
			integrations: [],
			message: `Integration ${inp.action} completed`,
		};
	},
};

/**
 * updateSettingsTool const.
 *
 * @example
 * ```ts
 * console.log(updateSettingsTool);
 * ```
 */
export const updateSettingsTool: AgentTool = {
	name: "update_settings",
	description: "Actualiza la configuración general del sistema.",
	inputSchema: z.object({
		settings: z.record(z.string(), z.any()),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	approvalLevel: "gate",
	async execute(input: unknown, _context: AgentContext) {
		const inp = input as { settings: { [key: string]: unknown } };
		return {
			success: true,
			message: `Settings updated: ${Object.keys(inp.settings).join(", ")}`,
		};
	},
};

/**
 * updateProfileTool const.
 *
 * @example
 * ```ts
 * console.log(updateProfileTool);
 * ```
 */
export const updateProfileTool: AgentTool = {
	name: "update_profile",
	description: "Actualiza el perfil del usuario actual.",
	inputSchema: z.object({
		name: z.string().optional(),
		email: z.string().email().optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	approvalLevel: "auto",
	async execute(_input: unknown, _context: AgentContext) {
		return {
			success: true,
			message: "Profile updated",
		};
	},
};

/**
 * toggleSurfaceTool const.
 *
 * @example
 * ```ts
 * console.log(toggleSurfaceTool);
 * ```
 */
export const toggleSurfaceTool: AgentTool = {
	name: "toggle_surface",
	description: "Activa o desactiva una surface de producto (feature).",
	inputSchema: z.object({
		surfaceId: z.string(),
		enabled: z.boolean(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	approvalLevel: "gate",
	async execute(input: unknown, _context: AgentContext) {
		const inp = input as { surfaceId: string; enabled: boolean };
		return {
			success: true,
			message: `Surface "${inp.surfaceId}" ${inp.enabled ? "enabled" : "disabled"}`,
		};
	},
};

/**
 * systemAdminTools const.
 *
 * @example
 * ```ts
 * console.log(systemAdminTools);
 * ```
 */
export const systemAdminTools: AgentTool[] = [
	manageIntegrationsTool,
	updateSettingsTool,
	updateProfileTool,
	toggleSurfaceTool,
];
