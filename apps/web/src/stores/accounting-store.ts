import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProposedEntry } from "./accounting-types";
export type {
	AccountingModuleId,
	AccountingModule,
	FinancialReportData,
	FinancialReportSection,
	KpiMetric,
	ProposedEntry,
} from "./accounting-types";
export { ACCOUNTING_MODULES } from "./accounting-types";

// ─── Seed data ────────────────────────────────────────────────────────────────

import type {
	KpiMetric,
	AccountingModuleId,
	FinancialReportData,
} from "./accounting-types";

const DEFAULT_KPI_METRICS: KpiMetric[] = [
	{
		id: "kpi-1",
		label: "Liquidez Corriente",
		value: 1.85,
		previousValue: 1.72,
		variance: 7.6,
		trend: "up",
		format: "number",
	},
	{
		id: "kpi-2",
		label: "Margen Neto",
		value: 12.4,
		previousValue: 11.8,
		variance: 5.1,
		trend: "up",
		format: "percentage",
	},
	{
		id: "kpi-3",
		label: "Días de Cobranza",
		value: 45,
		previousValue: 52,
		variance: -13.5,
		trend: "up",
		format: "days",
	},
	{
		id: "kpi-4",
		label: "ROE",
		value: 18.2,
		previousValue: 19.1,
		variance: -4.7,
		trend: "down",
		format: "percentage",
	},
	{
		id: "kpi-5",
		label: "Efectivo disponible",
		value: 2840000,
		previousValue: 3100000,
		variance: -8.4,
		trend: "down",
		format: "currency",
	},
];

interface AccountingStoreState {
	activeModule: AccountingModuleId;
	// TODO: Cada fetch debe incluir companyContext.companyId + fiscalPeriod como dependencia.
	// Actualmente son datos mock/static que NO cambian al cambiar empresa.
	financialReports: FinancialReportData[];
	kpiMetrics: KpiMetric[];
	proposedEntries: ProposedEntry[];

	setActiveModule: (module: AccountingModuleId) => void;
	setFinancialReports: (reports: FinancialReportData[]) => void;
	setKpiMetrics: (metrics: KpiMetric[]) => void;
	addProposedEntry: (entry: ProposedEntry) => void;
	updateProposedEntry: (id: string, updates: Partial<ProposedEntry>) => void;
	approveProposedEntry: (id: string) => void;
	rejectProposedEntry: (id: string) => void;
	approveAllProposed: () => void;
}

export const useAccountingStore = create<AccountingStoreState>()(
	persist(
		(set) => ({
			activeModule: "asientos" as AccountingModuleId,
			financialReports: [],
			kpiMetrics: DEFAULT_KPI_METRICS,
			proposedEntries: [],

			setActiveModule: (module) => set({ activeModule: module }),
			setFinancialReports: (reports) => set({ financialReports: reports }),
			setKpiMetrics: (metrics) => set({ kpiMetrics: metrics }),

			addProposedEntry: (entry) =>
				set((state) => ({
					proposedEntries: [...state.proposedEntries, entry],
				})),

			updateProposedEntry: (id, updates) =>
				set((state) => ({
					proposedEntries: state.proposedEntries.map((e) =>
						e.id === id ? { ...e, ...updates } : e,
					),
				})),

			approveProposedEntry: (id) =>
				set((state) => ({
					proposedEntries: state.proposedEntries.map((e) =>
						e.id === id ? { ...e, status: "approved" as const } : e,
					),
				})),

			rejectProposedEntry: (id) =>
				set((state) => ({
					proposedEntries: state.proposedEntries.map((e) =>
						e.id === id ? { ...e, status: "rejected" as const } : e,
					),
				})),

			approveAllProposed: () =>
				set((state) => ({
					proposedEntries: state.proposedEntries.map((e) =>
						e.status === "pending" || e.status === "reviewing"
							? { ...e, status: "approved" as const }
							: e,
					),
				})),
		}),
		{
			name: "codex-accounting-state",
			partialize: (state) => ({
				activeModule: state.activeModule,
			}),
		},
	),
);
