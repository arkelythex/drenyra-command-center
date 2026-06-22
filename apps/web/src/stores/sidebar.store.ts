import { create } from "zustand";

export interface FiscalPeriod {
	month: number; // 1-12
	year: number;
	label: string; // e.g. "Dic 2025"
}

export interface SidebarState {
	// Fiscal period
	activePeriod: FiscalPeriod;
	setActivePeriod: (period: FiscalPeriod) => void;

	// Module group collapse state
	expandedGroups: Record<string, boolean>;
	toggleGroup: (groupId: string) => void;

	// Activity feed
	isActivityExpanded: boolean;
	toggleActivity: () => void;
}

export const MOCK_PERIODS: FiscalPeriod[] = [
	{ month: 12, year: 2025, label: "Dic 2025" },
	{ month: 1, year: 2026, label: "Ene 2026" },
	{ month: 2, year: 2026, label: "Feb 2026" },
	{ month: 3, year: 2026, label: "Mar 2026" },
];

export const useSidebarStore = create<SidebarState>((set) => ({
	activePeriod: { month: 12, year: 2025, label: "Dic 2025" },
	setActivePeriod: (period) => set({ activePeriod: period }),

	// By default: Tesoreria + Contabilidad expanded, others collapsed
	expandedGroups: {
		treasury: true,
		accounting: true,
		invoicing: false,
		operations: false,
		fiscal: false,
		reports: false,
		plugins: false,
		automations: false,
	},
	toggleGroup: (groupId) =>
		set((state) => ({
			expandedGroups: {
				...state.expandedGroups,
				[groupId]: !state.expandedGroups[groupId],
			},
		})),

	isActivityExpanded: false,
	toggleActivity: () =>
		set((state) => ({ isActivityExpanded: !state.isActivityExpanded })),
}));
