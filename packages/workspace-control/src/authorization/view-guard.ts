import { WORKSPACE_PERMISSION, SENSITIVITY_LEVEL } from "./types";
import type {
	AuthorizationContext,
	AuthorizationDecision,
	AuthorizedResource,
} from "./types";
import type { AuthorizationPolicy } from "./policy";

// ─── View Guard ──────────────────────────────────────────────────────────────

const VIEW_RESOURCE_OWNER = "view-owner";

export function authorizeViewAccess(
	viewId: string,
	viewKind: string,
	context: AuthorizationContext,
	policy: AuthorizationPolicy,
): AuthorizationDecision {
	switch (viewKind) {
		case "evidence": {
			// Evidence → minimum "internal" sensitivity check
			const resource: AuthorizedResource = {
				resourceId: viewId,
				resourceType: "evidence",
				ownerId: VIEW_RESOURCE_OWNER,
				organizationId: context.organizationId,
				sensitivity: SENSITIVITY_LEVEL.INTERNAL,
			};
			return policy.checkAccess(resource, context, WORKSPACE_PERMISSION.READ);
		}

		case "approval": {
			// Approval → write permission required
			const resource: AuthorizedResource = {
				resourceId: viewId,
				resourceType: "view",
				ownerId: VIEW_RESOURCE_OWNER,
				organizationId: context.organizationId,
				sensitivity: SENSITIVITY_LEVEL.INTERNAL,
			};
			return policy.checkAccess(resource, context, WORKSPACE_PERMISSION.WRITE);
		}

		case "agent-activity": {
			// Agent-activity → read is sufficient
			const resource: AuthorizedResource = {
				resourceId: viewId,
				resourceType: "view",
				ownerId: VIEW_RESOURCE_OWNER,
				organizationId: context.organizationId,
				sensitivity: SENSITIVITY_LEVEL.INTERNAL,
			};
			return policy.checkAccess(resource, context, WORKSPACE_PERMISSION.READ);
		}

		case "ledger": {
			// Ledger → read is sufficient
			const resource: AuthorizedResource = {
				resourceId: viewId,
				resourceType: "view",
				ownerId: VIEW_RESOURCE_OWNER,
				organizationId: context.organizationId,
				sensitivity: SENSITIVITY_LEVEL.INTERNAL,
			};
			return policy.checkAccess(resource, context, WORKSPACE_PERMISSION.READ);
		}

		case "document-viewer": {
			// Document-viewer → sensitivity depends on document
			const resource: AuthorizedResource = {
				resourceId: viewId,
				resourceType: "view",
				ownerId: VIEW_RESOURCE_OWNER,
				organizationId: context.organizationId,
				sensitivity: SENSITIVITY_LEVEL.INTERNAL,
			};
			return policy.checkAccess(resource, context, WORKSPACE_PERMISSION.READ);
		}

		default: {
			// Unknown view kind → default to read with internal sensitivity
			const resource: AuthorizedResource = {
				resourceId: viewId,
				resourceType: "view",
				ownerId: VIEW_RESOURCE_OWNER,
				organizationId: context.organizationId,
				sensitivity: SENSITIVITY_LEVEL.INTERNAL,
			};
			return policy.checkAccess(resource, context, WORKSPACE_PERMISSION.READ);
		}
	}
}
