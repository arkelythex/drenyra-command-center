import { create } from "zustand";
import { generateId } from "@/lib/id";

export interface WorktreeInfo {
  id: string;
  branch: string;
  path: string;
  status: "clean" | "modified" | "conflicts";
  fileCount?: number;
  lastSync?: string;
  isActive: boolean;
}

interface WorktreeState {
  worktrees: WorktreeInfo[];
  activeWorktreeId: string | null;
  isLoading: boolean;
  error: string | null;
  createWorktree: (branch: string) => void;
  switchWorktree: (id: string) => void;
}

const INITIAL_WORKTREES: WorktreeInfo[] = [
  {
    id: "wt-1",
    branch: "main",
    path: "~/arkelythex",
    status: "clean",
    lastSync: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "wt-2",
    branch: "feat/sunat-validation",
    path: "~/arkelythex/worktrees/sunat",
    status: "modified",
    fileCount: 4,
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    isActive: false,
  },
  {
    id: "wt-3",
    branch: "fix/igv-rounding",
    path: "~/arkelythex/worktrees/igv-fix",
    status: "conflicts",
    fileCount: 2,
    lastSync: new Date(Date.now() - 7200000).toISOString(),
    isActive: false,
  },
];

export const useWorktreeStore = create<WorktreeState>((set, get) => ({
  worktrees: INITIAL_WORKTREES,
  activeWorktreeId: "wt-1",
  isLoading: false,
  error: null,

  createWorktree: (branch: string) => {
    const now = new Date().toISOString();
    const worktree: WorktreeInfo = {
      id: generateId(),
      branch,
      path: `~/arkelythex/worktrees/${branch.replace(/[/\s]/g, "-")}`,
      status: "clean",
      lastSync: now,
      isActive: false,
    };
    set((state) => ({
      worktrees: [...state.worktrees, worktree],
    }));
  },

  switchWorktree: (id: string) => {
    set((state) => ({
      worktrees: state.worktrees.map((w) => ({
        ...w,
        isActive: w.id === id,
      })),
      activeWorktreeId: id,
    }));
  },
}));
