import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
	CompanyRef,
	DensityMode,
	PeriodRef,
	Workspace,
	WorkspaceIntent,
	WorkspaceLayout,
} from "@drenyra/domain";
import {
	createPeriodRef,
	createWorkspaceId,
	defaultWorkspaceLayout,
} from "@drenyra/domain";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceStore {
	current: Workspace | null;
	isLoading: boolean;
	recent: Workspace[];

	navigateTo: (
		company: CompanyRef,
		year: number,
		month: number,
		intent: WorkspaceIntent,
	) => void;
	switchIntent: (intent: WorkspaceIntent) => void;
	switchCompany: (company: CompanyRef) => void;
	switchPeriod: (period: PeriodRef) => void;
	updateLayout: (layout: Partial<WorkspaceLayout>) => void;
	resetLayout: () => void;
	setDensity: (mode: DensityMode) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_RECENT = 5;

function workspaceKey(companyId: string, year: number, month: number, intent: string): string {
	return `${companyId}:${year}:${month}:${intent}`;
}

function pushRecent(recent: Workspace[], workspace: Workspace): Workspace[] {
	const key = workspaceKey(
		workspace.company.id,
		workspace.period.year,
		workspace.period.month,
		workspace.intent,
	);

	// Remove existing entry with same key (dedup)
	const filtered = recent.filter(
		(w) =>
			workspaceKey(
				w.company.id,
				w.period.year,
				w.period.month,
				w.intent,
			) !== key,
	);

	// Prepend and cap
	return [workspace, ...filtered].slice(0, MAX_RECENT);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStore>()(
	persist(
		(set, get) => ({
			current: null,
			isLoading: false,
			recent: [],

			navigateTo: (company, year, month, intent) => {
				const period = createPeriodRef(year, month);

				const workspace: Workspace = {
					id: createWorkspaceId(),
					company,
					period,
					intent,
					label: `${company.name} — ${period.label} — ${intent}`,
					layout: defaultWorkspaceLayout(),
				};

				set((state) => ({
					current: workspace,
					recent: pushRecent(state.recent, workspace),
				}));
			},

			switchIntent: (intent) => {
				const { current } = get();
				if (!current) return;

				const updated: Workspace = {
					...current,
					id: createWorkspaceId(),
					intent,
					label: `${current.company.name} — ${current.period.label} — ${intent}`,
				};

				set((state) => ({
					current: updated,
					recent: pushRecent(state.recent, updated),
				}));
			},

			switchCompany: (company) => {
				const { current } = get();
				if (!current) return;

				const updated: Workspace = {
					...current,
					id: createWorkspaceId(),
					company,
					label: `${company.name} — ${current.period.label} — ${current.intent}`,
				};

				set((state) => ({
					current: updated,
					recent: pushRecent(state.recent, updated),
				}));
			},

			switchPeriod: (period) => {
				const { current } = get();
				if (!current) return;

				const updated: Workspace = {
					...current,
					id: createWorkspaceId(),
					period,
					label: `${current.company.name} — ${period.label} — ${current.intent}`,
				};

				set((state) => ({
					current: updated,
					recent: pushRecent(state.recent, updated),
				}));
			},

			updateLayout: (partialLayout) => {
				const { current } = get();
				if (!current) return;

				set({
					current: {
						...current,
						layout: {
							...current.layout,
							...partialLayout,
						},
					},
				});
			},

			resetLayout: () => {
				const { current } = get();
				if (!current) return;

				set({
					current: {
						...current,
						layout: defaultWorkspaceLayout(),
					},
				});
			},

			setDensity: (mode) => {
				const { current } = get();
				// Always persist density to localStorage, regardless of current workspace
				try {
					window.localStorage.setItem("drenyra:density-mode", JSON.stringify(mode));
				} catch {
					// localStorage might be full or unavailable — silent no-op
				}

				if (!current) return;

				set({
					current: {
						...current,
						layout: {
							...current.layout,
							densityMode: mode,
						},
					},
				});
			},
		}),
		{
			name: "drenyra:recent-workspaces",
			partialize: (state) => ({
				recent: state.recent,
			}),
		},
	),
);
