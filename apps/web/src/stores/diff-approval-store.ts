import { create } from "zustand";

export interface DiffFile {
	fileName: string;
	oldText: string;
	newText: string;
	status?: "added" | "modified" | "deleted";
}

export type ApprovalStatus =
	| "pending"
	| "approved"
	| "denied"
	| "approved-once"
	| "approved-session";

export interface ApprovalRequest {
	id: string;
	action: string;
	description: string;
	riskLevel: "low" | "medium" | "high";
	filesChanged?: string[];
	timestamp: string;
	status: ApprovalStatus;
}

interface DiffApprovalStoreState {
	diffFiles: DiffFile[];
	approvalRequests: ApprovalRequest[];

	setDiffFiles: (files: DiffFile[]) => void;
	addApprovalRequest: (request: ApprovalRequest) => void;
	resolveApproval: (id: string, status: ApprovalStatus) => void;
	clearApprovals: () => void;
}

export const useDiffApprovalStore = create<DiffApprovalStoreState>()((set) => ({
	diffFiles: [],
	approvalRequests: [],

	setDiffFiles: (files) => set({ diffFiles: files }),

	addApprovalRequest: (request) =>
		set((state) => ({
			approvalRequests: [...state.approvalRequests, request],
		})),

	resolveApproval: (id, status) =>
		set((state) => ({
			approvalRequests: state.approvalRequests.map((r) =>
				r.id === id ? { ...r, status } : r,
			),
		})),

	clearApprovals: () => set({ approvalRequests: [] }),
}));
