import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CentralBoardTab = 'ledger' | 'journal' | 'documents';

export interface JournalEntry {
  id: string;
  date: string;
  cuenta: string;
  glosa: string;
  debe: number;
  haber: number;
  status: 'pending' | 'approved' | 'rejected';
  proposedBy: string;
  threadId?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'csv' | 'xlsx' | 'other';
  size: number;
  uploadedAt: string;
  threadId?: string;
  status: 'processing' | 'ready' | 'error';
  url?: string;
  mimeType?: string;
}

interface CentralBoardStoreState {
  centralBoardTab: CentralBoardTab;
  splitRatio: number;
  journalEntries: JournalEntry[];
  documents: DocumentItem[];

  setCentralBoardTab: (tab: CentralBoardTab) => void;
  setSplitRatio: (ratio: number) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  approveJournalEntry: (id: string) => void;
  rejectJournalEntry: (id: string) => void;
  addDocument: (doc: DocumentItem) => void;
  updateDocument: (id: string, updates: Partial<DocumentItem>) => void;
  removeDocument: (id: string) => void;
}

export const useCentralBoardStore = create<CentralBoardStoreState>()(
  persist(
    (set) => ({
      centralBoardTab: 'ledger',
      splitRatio: 0.5,
      journalEntries: [],
      documents: [],

      setCentralBoardTab: (tab) => set({ centralBoardTab: tab }),
      setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.3, Math.min(0.7, ratio)) }),

      addJournalEntry: (entry) =>
        set((state) => ({
          journalEntries: [...state.journalEntries, entry],
        })),

      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),

      approveJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, status: 'approved' as const } : e,
          ),
        })),

      rejectJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, status: 'rejected' as const } : e,
          ),
        })),

      addDocument: (doc) =>
        set((state) => ({
          documents: [...state.documents, doc],
        })),

      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d,
          ),
        })),

      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
    }),
    {
      name: 'codex-central-board-state',
      partialize: (state) => ({
        centralBoardTab: state.centralBoardTab,
        splitRatio: state.splitRatio,
      }),
    },
  ),
);
