import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";

export interface FiscalCase {
  id: string;
  title: string;
  status: 'open' | 'in-review' | 'resolved';
  date: string;
}

const DEFAULT_FISCAL_CASES: FiscalCase[] = [
  { id: 'case-1', title: 'SIRE Marzo 2026', status: 'open', date: '2026-03-15' },
  { id: 'case-2', title: 'Detracciones Febrero', status: 'in-review', date: '2026-02-28' },
  { id: 'case-3', title: 'IGV Irregular', status: 'resolved', date: '2026-01-20' },
  { id: 'case-4', title: 'IR 2025', status: 'open', date: '2026-04-01' },
  { id: 'case-5', title: 'Conciliación Q1', status: 'in-review', date: '2026-04-10' },
];

interface FiscalCaseStoreState {
  fiscalCases: FiscalCase[];
  activeFiscalCaseId: string | null;
  setActiveFiscalCase: (id: string | null) => void;
  createFiscalCase: (title: string) => void;
  updateFiscalCaseStatus: (id: string, status: FiscalCase['status']) => void;
}

export const useFiscalCaseStore = create<FiscalCaseStoreState>()(
  persist(
    (set) => ({
      fiscalCases: DEFAULT_FISCAL_CASES,
      activeFiscalCaseId: null,

      setActiveFiscalCase: (id) => set({ activeFiscalCaseId: id }),

      createFiscalCase: (title) => {
        const newCase: FiscalCase = {
          id: generateId(),
          title,
          status: 'open',
          date: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({
          fiscalCases: [newCase, ...state.fiscalCases],
          activeFiscalCaseId: newCase.id,
        }));
      },

      updateFiscalCaseStatus: (id, status) =>
        set((state) => ({
          fiscalCases: state.fiscalCases.map((c) =>
            c.id === id ? { ...c, status } : c,
          ),
        })),
    }),
    {
      name: 'codex-fiscal-case-state',
      partialize: (state) => ({
        fiscalCases: state.fiscalCases,
        activeFiscalCaseId: state.activeFiscalCaseId,
      }),
    },
  ),
);
