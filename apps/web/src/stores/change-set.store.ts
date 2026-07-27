import { create } from "zustand";
import type { ChangeSetSummary, ChangeSetStatus } from "../types/change-set";

interface ChangeSetStore {
	changeSets: ChangeSetSummary[];
	selectedId: string | null;

	// CRUD
	addChangeSet: (cs: ChangeSetSummary) => void;
	updateStatus: (id: string, status: ChangeSetStatus) => void;
	removeChangeSet: (id: string) => void;
	selectChangeSet: (id: string | null) => void;

	// Queries
	getChangeSet: (id: string) => ChangeSetSummary | undefined;
	getActiveChangeSets: () => ChangeSetSummary[];
	getChangeSetsByStatus: (status: ChangeSetStatus) => ChangeSetSummary[];
}

export const useChangeSetStore = create<ChangeSetStore>((set, get) => ({
	changeSets: [],
	selectedId: null,

	addChangeSet: (cs) => {
		set((state) => ({
			changeSets: [...state.changeSets, cs],
		}));
	},

	updateStatus: (id, status) => {
		set((state) => ({
			changeSets: state.changeSets.map((cs) =>
				cs.id === id
					? { ...cs, status, updatedAt: new Date().toISOString() }
					: cs,
			),
		}));
	},

	removeChangeSet: (id) => {
		set((state) => ({
			changeSets: state.changeSets.filter((cs) => cs.id !== id),
		}));
	},

	selectChangeSet: (id) => set({ selectedId: id }),

	getChangeSet: (id) => get().changeSets.find((cs) => cs.id === id),

	getActiveChangeSets: () =>
		get().changeSets.filter(
			(cs) =>
				cs.status === "draft" ||
				cs.status === "proposed" ||
				cs.status === "in_review" ||
				cs.status === "changes_requested",
		),

	getChangeSetsByStatus: (status) =>
		get().changeSets.filter((cs) => cs.status === status),
}));

// Seed with initial mock data
const MOCK_CHANGE_SETS: ChangeSetSummary[] = [
	{
		id: "cs-001",
		label: "Cierre junio 2026",
		description:
			"Cierre mensual completo con clasificaciones, conciliaciones y ajustes",
		status: "in_review",
		risk: "high",
		companyName: "Arkelythex SAC",
		period: "Junio 2026",
		intent: "close",
		totalChanges: 412,
		approvedChanges: 380,
		rejectedChanges: 2,
		pendingChanges: 30,
		estimatedImpact: 184000,
		impactCurrency: "PEN",
		materiality: "material",
		evidenceCount: 47,
		createdAt: "2026-07-20T10:00:00Z",
		updatedAt: "2026-07-27T14:00:00Z",
		reviewDeadline: "2026-07-30T00:00:00Z",
		requiresSeniorReview: true,
		approvalCount: 1,
		requiredApprovals: 2,
		preparedByAgent: "Ledger Agent",
		agentConfidence: 0.86,
	},
	{
		id: "cs-002",
		label: "Corrección auditoría - gastos servicios",
		description: "Reclasificación de S/ 4,300 de gastos a activo intangible",
		status: "approved",
		risk: "medium",
		companyName: "Arkelythex SAC",
		period: "Junio 2026",
		intent: "review",
		totalChanges: 18,
		approvedChanges: 18,
		rejectedChanges: 0,
		pendingChanges: 0,
		estimatedImpact: 4300,
		impactCurrency: "PEN",
		materiality: "immaterial",
		evidenceCount: 4,
		createdAt: "2026-07-25T08:00:00Z",
		updatedAt: "2026-07-26T16:00:00Z",
		requiresSeniorReview: false,
		approvalCount: 1,
		requiredApprovals: 1,
		preparedByAgent: "Fiscal SIRE Agent",
		agentConfidence: 0.92,
	},
	{
		id: "cs-003",
		label: "SIRE RCE reemplazo",
		description: "Preparación de RCE de reemplazo con 1,842 comprobantes",
		status: "proposed",
		risk: "critical",
		companyName: "Arkelythex SAC",
		period: "Junio 2026",
		intent: "close",
		totalChanges: 1842,
		approvedChanges: 0,
		rejectedChanges: 0,
		pendingChanges: 1842,
		estimatedImpact: 184000,
		impactCurrency: "PEN",
		materiality: "very_material",
		evidenceCount: 12,
		createdAt: "2026-07-27T09:00:00Z",
		updatedAt: "2026-07-27T09:00:00Z",
		reviewDeadline: "2026-07-29T00:00:00Z",
		requiresSeniorReview: true,
		approvalCount: 0,
		requiredApprovals: 2,
		preparedByAgent: "SIRE Agent",
		agentConfidence: 0.78,
	},
];

// Seed on import
useChangeSetStore.getState().changeSets.push(...MOCK_CHANGE_SETS);
