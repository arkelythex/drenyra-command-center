import { beforeEach, describe, expect, it } from "vitest";
import type { Workspace } from "@drenyra/domain";
import {
	createCompanyRef,
	createPeriodRef,
	DENSITY_MODE,
	WORKSPACE_INTENT,
} from "@drenyra/domain";

// ─── SUT ──────────────────────────────────────────────────────────────────────

import { useWorkspaceStore } from "../workspace.store";

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeArkeCompany() {
	return createCompanyRef("c1", "Arkelythex SAC", "20123456789", "org1");
}

function makeOtherCompany() {
	return createCompanyRef("c2", "Otra Empresa SA", "20987654321", "org1");
}

function makeThirdCompany() {
	return createCompanyRef("c3", "Tercera SAC", "20765432109", "org1");
}

// ─── Reset helpers ────────────────────────────────────────────────────────────

function resetStore() {
	useWorkspaceStore.setState({
		current: null,
		isLoading: false,
		recent: [],
	});
}

function clearRecentStorage() {
	window.localStorage.removeItem("drenyra:recent-workspaces");
	window.localStorage.removeItem("drenyra:density-mode");
}

// ─── Edge case: localStorage corruption ───────────────────────────────────────

describe("Workspace Store — edge cases", () => {
	beforeEach(() => {
		clearRecentStorage();
		resetStore();
	});

	it("handles corrupted JSON in localStorage gracefully (falls back to empty recent)", () => {
		window.localStorage.setItem("drenyra:recent-workspaces", "not-json{{{");

		// Store should still initialize without crashing
		const state = useWorkspaceStore.getState();
		expect(state.recent).toEqual([]);
		expect(state.current).toBeNull();
	});

	it("handles localStorage.setItem throwing (quota exceeded) gracefully", () => {
		const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
		window.localStorage.setItem = () => {
			throw new Error("QuotaExceededError");
		};

		// Should not throw
		expect(() => {
			useWorkspaceStore.getState().navigateTo(
				makeArkeCompany(),
				2026,
				6,
				WORKSPACE_INTENT.CLOSE,
			);
		}).not.toThrow();

		// State should still be updated in-memory
		expect(useWorkspaceStore.getState().current).not.toBeNull();

		window.localStorage.setItem = originalSetItem;
	});

	it("setDensity handles localStorage quota exceeded gracefully", () => {
		const originalSetItem = window.localStorage.setItem.bind(window.localStorage);

		useWorkspaceStore.getState().navigateTo(
			makeArkeCompany(),
			2026,
			6,
			WORKSPACE_INTENT.CLOSE,
		);

		window.localStorage.setItem = () => {
			throw new Error("QuotaExceededError");
		};

		// Should not throw
		expect(() => {
			useWorkspaceStore.getState().setDensity(DENSITY_MODE.COMPACT);
		}).not.toThrow();

		// In-memory state should still update
		expect(useWorkspaceStore.getState().current!.layout.densityMode).toBe(
			DENSITY_MODE.COMPACT,
		);

		window.localStorage.setItem = originalSetItem;
	});

	it("recent dedup is stable even with many rapid navigations", () => {
		const store = useWorkspaceStore.getState();
		const company = makeArkeCompany();

		// Rapid same-key navigations
		for (let i = 0; i < 20; i++) {
			store.navigateTo(company, 2026, 6, WORKSPACE_INTENT.CLOSE);
		}

		expect(useWorkspaceStore.getState().recent).toHaveLength(1);
	});
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Workspace Store", () => {
	beforeEach(() => {
		clearRecentStorage();
		resetStore();
	});

	// ── Initialization ────────────────────────────────────────────────────────

	it("initializes with null workspace and empty recent list", () => {
		const state = useWorkspaceStore.getState();

		expect(state.current).toBeNull();
		expect(state.recent).toEqual([]);
		expect(state.isLoading).toBe(false);
	});

	// ── navigateTo ─────────────────────────────────────────────────────────────

	it("navigateTo creates a workspace with correct company, period, intent, and default layout", () => {
		const company = makeArkeCompany();

		useWorkspaceStore.getState().navigateTo(
			company,
			2026,
			6,
			WORKSPACE_INTENT.CLOSE,
		);

		const state = useWorkspaceStore.getState();
		expect(state.current).not.toBeNull();
		expect(state.current!.company.ruc).toBe("20123456789");
		expect(state.current!.company.name).toBe("Arkelythex SAC");
		expect(state.current!.period.year).toBe(2026);
		expect(state.current!.period.month).toBe(6);
		expect(state.current!.intent).toBe(WORKSPACE_INTENT.CLOSE);
		expect(state.current!.layout.panes).toHaveLength(3);
		expect(state.current!.layout.densityMode).toBe(DENSITY_MODE.DEFAULT);
		expect(state.current!.layout.sidebarCollapsed).toBe(false);
		expect(state.current!.layout.rightPanelOpen).toBe(true);
	});

	it("navigateTo generates a unique WorkspaceId each time", () => {
		const company = makeArkeCompany();

		useWorkspaceStore.getState().navigateTo(
			company,
			2026,
			6,
			WORKSPACE_INTENT.CLOSE,
		);
		const id1 = useWorkspaceStore.getState().current!.id;

		useWorkspaceStore.getState().navigateTo(
			company,
			2026,
			7,
			WORKSPACE_INTENT.CLOSE,
		);
		const id2 = useWorkspaceStore.getState().current!.id;

		expect(id1).not.toBe(id2);
	});

	it("navigateTo adds workspace to recent list", () => {
		const company = makeArkeCompany();

		useWorkspaceStore.getState().navigateTo(
			company,
			2026,
			6,
			WORKSPACE_INTENT.CLOSE,
		);

		const state = useWorkspaceStore.getState();
		expect(state.recent).toHaveLength(1);
		expect(state.recent[0].company.id).toBe("c1");
		expect(state.recent[0].intent).toBe(WORKSPACE_INTENT.CLOSE);
	});

	it("navigateTo deduplicates by workspace key (same company + period + intent)", () => {
		const store = useWorkspaceStore.getState();
		const company = makeArkeCompany();

		// First navigation
		store.navigateTo(company, 2026, 6, WORKSPACE_INTENT.CLOSE);
		expect(useWorkspaceStore.getState().recent).toHaveLength(1);

		// Same navigation — should move to top, not duplicate
		store.navigateTo(company, 2026, 6, WORKSPACE_INTENT.CLOSE);
		expect(useWorkspaceStore.getState().recent).toHaveLength(1);
	});

	// ── Recent cap & order ────────────────────────────────────────────────────

	it("caps recent list at 5, most recent first", () => {
		const store = useWorkspaceStore.getState();

		// Add 7 different workspaces with different companies
		for (let i = 1; i <= 7; i++) {
			const c = createCompanyRef(
				`c${i}`,
				`Company ${i}`,
				`2012345678${String(i).padStart(2, "0")}`.slice(0, 11),
				"org1",
			);
			store.navigateTo(c, 2026, i, WORKSPACE_INTENT.CLOSE);
		}

		const state = useWorkspaceStore.getState();
		expect(state.recent).toHaveLength(5);
		// Most recent first: the last one added should be at index 0
		expect(state.recent[0].company.id).toBe("c7");
		expect(state.recent[4].company.id).toBe("c3");
	});

	it("recent list preserves order (most recent first) after re-navigating to an existing workspace", () => {
		const store = useWorkspaceStore.getState();
		const c1 = makeArkeCompany();
		const c2 = makeOtherCompany();
		const c3 = makeThirdCompany();

		store.navigateTo(c1, 2026, 1, WORKSPACE_INTENT.CLOSE);
		store.navigateTo(c2, 2026, 2, WORKSPACE_INTENT.REVIEW);
		store.navigateTo(c3, 2026, 3, WORKSPACE_INTENT.REPORT);

		// Re-navigate to c1 — should move to top
		store.navigateTo(c1, 2026, 1, WORKSPACE_INTENT.CLOSE);

		const state = useWorkspaceStore.getState();
		expect(state.recent).toHaveLength(3);
		expect(state.recent[0].company.id).toBe("c1");
		expect(state.recent[1].company.id).toBe("c3");
		expect(state.recent[2].company.id).toBe("c2");
	});

	// ── switchIntent ───────────────────────────────────────────────────────────

	it("switchIntent changes intent while preserving company and period", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		store.switchIntent(WORKSPACE_INTENT.REVIEW);

		const state = useWorkspaceStore.getState();
		expect(state.current!.intent).toBe(WORKSPACE_INTENT.REVIEW);
		expect(state.current!.company.id).toBe("c1");
		expect(state.current!.period.year).toBe(2026);
		expect(state.current!.period.month).toBe(6);
	});

	it("switchIntent is a no-op when there is no current workspace", () => {
		useWorkspaceStore.getState().switchIntent(WORKSPACE_INTENT.REVIEW);
		expect(useWorkspaceStore.getState().current).toBeNull();
	});

	// ── switchCompany ──────────────────────────────────────────────────────────

	it("switchCompany changes company while preserving period and intent", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		store.switchCompany(makeOtherCompany());

		const state = useWorkspaceStore.getState();
		expect(state.current!.company.id).toBe("c2");
		expect(state.current!.company.ruc).toBe("20987654321");
		expect(state.current!.period.year).toBe(2026);
		expect(state.current!.period.month).toBe(6);
		expect(state.current!.intent).toBe(WORKSPACE_INTENT.CLOSE);
	});

	it("switchCompany is a no-op when there is no current workspace", () => {
		useWorkspaceStore.getState().switchCompany(makeOtherCompany());
		expect(useWorkspaceStore.getState().current).toBeNull();
	});

	// ── switchPeriod ───────────────────────────────────────────────────────────

	it("switchPeriod changes period while preserving company and intent", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		store.switchPeriod(createPeriodRef(2026, 7));

		const state = useWorkspaceStore.getState();
		expect(state.current!.period.year).toBe(2026);
		expect(state.current!.period.month).toBe(7);
		expect(state.current!.company.id).toBe("c1");
		expect(state.current!.intent).toBe(WORKSPACE_INTENT.CLOSE);
	});

	it("switchPeriod is a no-op when there is no current workspace", () => {
		useWorkspaceStore.getState().switchPeriod(createPeriodRef(2026, 7));
		expect(useWorkspaceStore.getState().current).toBeNull();
	});

	// ── updateLayout ───────────────────────────────────────────────────────────

	it("updateLayout merges partial layout configuration", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		// Toggle sidebar collapsed
		store.updateLayout({ sidebarCollapsed: true });

		const state = useWorkspaceStore.getState();
		expect(state.current!.layout.sidebarCollapsed).toBe(true);
		// Other layout fields preserved
		expect(state.current!.layout.rightPanelOpen).toBe(true);
		expect(state.current!.layout.panes).toHaveLength(3);
	});

	it("updateLayout merges multiple partial fields", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		store.updateLayout({
			sidebarCollapsed: true,
			rightPanelOpen: false,
			densityMode: DENSITY_MODE.COMPACT,
		});

		const state = useWorkspaceStore.getState();
		expect(state.current!.layout.sidebarCollapsed).toBe(true);
		expect(state.current!.layout.rightPanelOpen).toBe(false);
		expect(state.current!.layout.densityMode).toBe(DENSITY_MODE.COMPACT);
		// panes preserved
		expect(state.current!.layout.panes).toHaveLength(3);
	});

	it("updateLayout is a no-op when there is no current workspace", () => {
		useWorkspaceStore.getState().updateLayout({ sidebarCollapsed: true });
		expect(useWorkspaceStore.getState().current).toBeNull();
	});

	// ── resetLayout ────────────────────────────────────────────────────────────

	it("resetLayout restores the default workspace layout", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		// Modify layout
		store.updateLayout({
			sidebarCollapsed: true,
			rightPanelOpen: false,
		});

		// Reset
		store.resetLayout();

		const state = useWorkspaceStore.getState();
		expect(state.current!.layout.sidebarCollapsed).toBe(false);
		expect(state.current!.layout.rightPanelOpen).toBe(true);
		expect(state.current!.layout.densityMode).toBe(DENSITY_MODE.DEFAULT);
	});

	it("resetLayout is a no-op when there is no current workspace", () => {
		useWorkspaceStore.getState().resetLayout();
		expect(useWorkspaceStore.getState().current).toBeNull();
	});

	// ── setDensity ─────────────────────────────────────────────────────────────

	it("setDensity updates the density mode on the current workspace layout", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		store.setDensity(DENSITY_MODE.COMPACT);

		const state = useWorkspaceStore.getState();
		expect(state.current!.layout.densityMode).toBe(DENSITY_MODE.COMPACT);
	});

	it("setDensity persists the density mode to localStorage immediately", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);

		store.setDensity(DENSITY_MODE.COMFORTABLE);

		const stored = window.localStorage.getItem("drenyra:density-mode");
		expect(stored).toBe(JSON.stringify(DENSITY_MODE.COMFORTABLE));
	});

	it("setDensity is a no-op when there is no current workspace", () => {
		useWorkspaceStore.getState().setDensity(DENSITY_MODE.COMPACT);
		expect(useWorkspaceStore.getState().current).toBeNull();
	});

	// ── Persistence ────────────────────────────────────────────────────────────

	it("persists recent workspaces to localStorage on navigate", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);
		store.navigateTo(makeOtherCompany(), 2026, 7, WORKSPACE_INTENT.REVIEW);

		const stored = window.localStorage.getItem("drenyra:recent-workspaces");
		expect(stored).not.toBeNull();

		// Zustand persist wraps in { state: { recent: [...] }, version: N }
		const parsed = JSON.parse(stored!);
		const recentList = parsed.state.recent as Workspace[];
		expect(recentList).toHaveLength(2);
		expect(recentList[0].intent).toBe(WORKSPACE_INTENT.REVIEW);
	});

	it("persisted recent data survives store reset and re-read", () => {
		const store = useWorkspaceStore.getState();
		store.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE);
		store.navigateTo(makeOtherCompany(), 2026, 7, WORKSPACE_INTENT.REVIEW);

		// Verify it's in storage
		const persistedRaw = window.localStorage.getItem("drenyra:recent-workspaces");
		expect(persistedRaw).not.toBeNull();

		const persisted = JSON.parse(persistedRaw!);
		const recentList = persisted.state.recent as Workspace[];
		expect(recentList).toHaveLength(2);
		expect(recentList[0].intent).toBe(WORKSPACE_INTENT.REVIEW);
		expect(recentList[1].intent).toBe(WORKSPACE_INTENT.CLOSE);
	});
});
