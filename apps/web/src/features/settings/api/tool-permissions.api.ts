/**
 * @fileoverview API client for ai_tool_permissions CRUD.
 *
 * Uses the `createCrudApi` factory which auto-injects tenant context and
 * normalises server responses.
 */

import { createCrudApi } from "@/lib/api-factory";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionEffect = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";

export interface ToolPermission {
	id: string;
	toolName: string;
	effect: PermissionEffect;
	companyId: string | null;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateToolPermissionDTO {
	toolName: string;
	effect: PermissionEffect;
	companyId?: string;
	organizationId?: string;
}

export interface UpdateToolPermissionDTO {
	toolName?: string;
	effect?: PermissionEffect;
	companyId?: string;
	organizationId?: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const toolPermissionsApi = createCrudApi<
	CreateToolPermissionDTO,
	UpdateToolPermissionDTO
>("ai.tool-permissions", {
	extract: true,
	messages: {
		list: "No se pudieron cargar los permisos de herramientas",
		create: "No se pudo crear el permiso",
		update: "No se pudo actualizar el permiso",
		delete: "No se pudo eliminar el permiso",
	},
});
