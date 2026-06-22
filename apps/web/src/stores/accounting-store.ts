import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProposedEntry } from "./accounting-types";
export type {
  Company,
  FiscalPeriod,
  AccountingModuleId,
  AccountingModule,
  FinancialReportData,
  FinancialReportSection,
  KpiMetric,
  ProposedEntry,
} from './accounting-types';
export { ACCOUNTING_MODULES } from './accounting-types';

// ─── Seed data ────────────────────────────────────────────────────────────────

import type { Company, FiscalPeriod, KpiMetric, AccountingModuleId, FinancialReportData } from './accounting-types';

const DEFAULT_COMPANIES: Company[] = [
  { id: 'comp-1', name: 'TechCorp Perú SAC', ruc: '20123456789' },
  { id: 'comp-2', name: 'Distribuidora Norte EIRL', ruc: '20456789012' },
  { id: 'comp-3', name: 'Servicios Generales Sur SA', ruc: '20789012345' },
];

const DEFAULT_PERIODS: FiscalPeriod[] = [
  { id: 'per-2026-04', label: 'Abril 2026', year: 2026, month: 4, isClosed: false, startDate: '2026-04-01', endDate: '2026-04-30' },
  { id: 'per-2026-03', label: 'Marzo 2026', year: 2026, month: 3, isClosed: true, startDate: '2026-03-01', endDate: '2026-03-31' },
  { id: 'per-2026-02', label: 'Febrero 2026', year: 2026, month: 2, isClosed: true, startDate: '2026-02-01', endDate: '2026-02-28' },
  { id: 'per-2026-01', label: 'Enero 2026', year: 2026, month: 1, isClosed: true, startDate: '2026-01-01', endDate: '2026-01-31' },
  { id: 'per-2026-q1', label: 'Q1 2026', year: 2026, isClosed: true, startDate: '2026-01-01', endDate: '2026-03-31' },
];

const DEFAULT_KPI_METRICS: KpiMetric[] = [
  { id: 'kpi-1', label: 'Liquidez Corriente', value: 1.85, previousValue: 1.72, variance: 7.6, trend: 'up', format: 'number' },
  { id: 'kpi-2', label: 'Margen Neto', value: 12.4, previousValue: 11.8, variance: 5.1, trend: 'up', format: 'percentage' },
  { id: 'kpi-3', label: 'Días de Cobranza', value: 45, previousValue: 52, variance: -13.5, trend: 'up', format: 'days' },
  { id: 'kpi-4', label: 'ROE', value: 18.2, previousValue: 19.1, variance: -4.7, trend: 'down', format: 'percentage' },
  { id: 'kpi-5', label: 'Efectivo disponible', value: 2840000, previousValue: 3100000, variance: -8.4, trend: 'down', format: 'currency' },
];

interface AccountingStoreState {
  companies: Company[];
  activeCompanyId: string | null;
  periods: FiscalPeriod[];
  activePeriodId: string | null;
  activeModule: AccountingModuleId;
  financialReports: FinancialReportData[];
  kpiMetrics: KpiMetric[];
  proposedEntries: ProposedEntry[];

  setActiveCompany: (id: string | null) => void;
  setActivePeriod: (id: string | null) => void;
  setActiveModule: (module: AccountingModuleId) => void;
  setFinancialReports: (reports: FinancialReportData[]) => void;
  setKpiMetrics: (metrics: KpiMetric[]) => void;
  addProposedEntry: (entry: ProposedEntry) => void;
  updateProposedEntry: (id: string, updates: Partial<ProposedEntry>) => void;
  approveProposedEntry: (id: string) => void;
  rejectProposedEntry: (id: string) => void;
  approveAllProposed: () => void;
  getActiveCompany: () => Company | null;
  getActivePeriod: () => FiscalPeriod | null;
}

export const useAccountingStore = create<AccountingStoreState>()(
  persist(
    (set, get) => ({
      companies: DEFAULT_COMPANIES,
      activeCompanyId: 'comp-1',
      periods: DEFAULT_PERIODS,
      activePeriodId: 'per-2026-04',
      activeModule: 'asientos' as AccountingModuleId,
      financialReports: [],
      kpiMetrics: DEFAULT_KPI_METRICS,
      proposedEntries: [],

      setActiveCompany: (id) => set({ activeCompanyId: id }),
      setActivePeriod: (id) => set({ activePeriodId: id }),
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
            e.id === id ? { ...e, status: 'approved' as const } : e,
          ),
        })),

      rejectProposedEntry: (id) =>
        set((state) => ({
          proposedEntries: state.proposedEntries.map((e) =>
            e.id === id ? { ...e, status: 'rejected' as const } : e,
          ),
        })),

      approveAllProposed: () =>
        set((state) => ({
          proposedEntries: state.proposedEntries.map((e) =>
            e.status === 'pending' || e.status === 'reviewing'
              ? { ...e, status: 'approved' as const }
              : e,
          ),
        })),

      getActiveCompany: () => {
        const state = get();
        return state.companies.find((c) => c.id === state.activeCompanyId) ?? null;
      },

      getActivePeriod: () => {
        const state = get();
        return state.periods.find((p) => p.id === state.activePeriodId) ?? null;
      },
    }),
    {
      name: 'codex-accounting-state',
      partialize: (state) => ({
        activeCompanyId: state.activeCompanyId,
        activePeriodId: state.activePeriodId,
        activeModule: state.activeModule,
      }),
    },
  ),
);
