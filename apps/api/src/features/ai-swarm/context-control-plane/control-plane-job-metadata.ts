import {
	APPROVAL_REQUIREMENTS,
	type ApprovalRequirement,
} from "@drenyra/application";

export interface ControlPlaneJobMetadata {
	surfaceId: string;
	approvalsRequired: readonly ApprovalRequirement[];
	representativePath: boolean;
	defaultRequestedCorpora: readonly string[];
}

export const CONTROL_PLANE_JOB_METADATA: Readonly<
	Record<string, ControlPlaneJobMetadata>
> = {
	"prepare-sire": {
		surfaceId: "prepare-sire",
		approvalsRequired: [APPROVAL_REQUIREMENTS.SUPERVISOR],
		representativePath: true,
		defaultRequestedCorpora: ["sunat-sire-manuals"],
	},
	"bank-reconciliation": {
		surfaceId: "bank-reconciliation",
		approvalsRequired: [APPROVAL_REQUIREMENTS.SUPERVISOR],
		representativePath: false,
		defaultRequestedCorpora: [],
	},
	"validate-cpe": {
		surfaceId: "validate-cpe",
		approvalsRequired: [],
		representativePath: false,
		defaultRequestedCorpora: ["sunat-cpe-specs"],
	},
} as const;

export function getControlPlaneJobMetadata(
	jobId: string,
): ControlPlaneJobMetadata | null {
	return CONTROL_PLANE_JOB_METADATA[jobId] ?? null;
}
