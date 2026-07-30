// ─── Authorization Types ────────────────────────────────────────────────────

// Permission levels for workspace resources
export const WORKSPACE_PERMISSION = {
	READ: "read",
	WRITE: "write",
	ADMIN: "admin",
	NONE: "none",
} as const;

export type WorkspacePermission =
	(typeof WORKSPACE_PERMISSION)[keyof typeof WORKSPACE_PERMISSION];

// Authorization context
export interface AuthorizationContext {
	readonly userId: string;
	readonly organizationId: string;
	readonly roles: readonly string[];
}

// Authorization decision
export interface AuthorizationDecision {
	readonly granted: boolean;
	readonly permission: WorkspacePermission;
	readonly reason?: string;
}

// Protected resource
export interface AuthorizedResource {
	readonly resourceId: string;
	readonly resourceType: "view" | "execution" | "workspace" | "evidence";
	readonly ownerId: string;
	readonly organizationId: string;
	readonly sensitivity: SensitivityLevel;
}

export const SENSITIVITY_LEVEL = {
	PUBLIC: "public",
	INTERNAL: "internal",
	SENSITIVE: "sensitive",
	RESTRICTED: "restricted",
} as const;

export type SensitivityLevel =
	(typeof SENSITIVITY_LEVEL)[keyof typeof SENSITIVITY_LEVEL];
