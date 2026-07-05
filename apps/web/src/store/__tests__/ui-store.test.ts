import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "../ui-store";

const STORAGE_KEY = "drenyra-ui-storage";

function readPersistedState() {
	const raw = localStorage.getItem(STORAGE_KEY);
	return raw ? JSON.parse(raw) : null;
}

describe("UIStore", () => {
	beforeEach(() => {
		useUIStore.setState({
			isSidebarOpen: true,
			isRightRailOpen: false,
			terminalOpen: false,
			rightPanelTab: "diff",
			commandPaletteOpen: false,
			swarmMode: "auto",
			themePreference: "mono-dark",
			complexityLevel: "advanced",
		});
	});

	it("should toggle sidebar", () => {
		expect(useUIStore.getState().isSidebarOpen).toBe(true);
		useUIStore.getState().toggleSidebar();
		expect(useUIStore.getState().isSidebarOpen).toBe(false);
		useUIStore.getState().toggleSidebar();
		expect(useUIStore.getState().isSidebarOpen).toBe(true);
	});

	it("should toggle right rail", () => {
		expect(useUIStore.getState().isRightRailOpen).toBe(false);
		useUIStore.getState().toggleRightRail();
		expect(useUIStore.getState().isRightRailOpen).toBe(true);
		useUIStore.getState().toggleRightRail();
		expect(useUIStore.getState().isRightRailOpen).toBe(false);
	});

	it("should set right rail open explicitly", () => {
		useUIStore.getState().setRightRailOpen(true);
		expect(useUIStore.getState().isRightRailOpen).toBe(true);
		useUIStore.getState().setRightRailOpen(false);
		expect(useUIStore.getState().isRightRailOpen).toBe(false);
	});

	it("should toggle terminal", () => {
		expect(useUIStore.getState().terminalOpen).toBe(false);
		useUIStore.getState().toggleTerminal();
		expect(useUIStore.getState().terminalOpen).toBe(true);
		useUIStore.getState().toggleTerminal();
		expect(useUIStore.getState().terminalOpen).toBe(false);
	});

	it("should set right panel tab", () => {
		useUIStore.getState().setRightPanelTab("artifact");
		expect(useUIStore.getState().rightPanelTab).toBe("artifact");

		useUIStore.getState().setRightPanelTab("kpi");
		expect(useUIStore.getState().rightPanelTab).toBe("kpi");
	});

	it("should set command palette open with boolean", () => {
		useUIStore.getState().setCommandPaletteOpen(true);
		expect(useUIStore.getState().commandPaletteOpen).toBe(true);

		useUIStore.getState().setCommandPaletteOpen(false);
		expect(useUIStore.getState().commandPaletteOpen).toBe(false);
	});

	it("should set command palette open with function updater", () => {
		expect(useUIStore.getState().commandPaletteOpen).toBe(false);

		// Toggle: false -> true
		useUIStore.getState().setCommandPaletteOpen((prev) => !prev);
		expect(useUIStore.getState().commandPaletteOpen).toBe(true);

		// Toggle: true -> false
		useUIStore.getState().setCommandPaletteOpen((prev) => !prev);
		expect(useUIStore.getState().commandPaletteOpen).toBe(false);
	});

	it("should set swarm mode", () => {
		useUIStore.getState().setSwarmMode("ledger");
		expect(useUIStore.getState().swarmMode).toBe("ledger");

		useUIStore.getState().setSwarmMode("sire");
		expect(useUIStore.getState().swarmMode).toBe("sire");

		useUIStore.getState().setSwarmMode("analysis");
		expect(useUIStore.getState().swarmMode).toBe("analysis");
	});

	it("should set theme preference", () => {
		useUIStore.getState().setThemePreference("cocoa-light");
		expect(useUIStore.getState().themePreference).toBe("cocoa-light");
	});

	it("should set complexity level", () => {
		useUIStore.getState().setComplexityLevel("basic");
		expect(useUIStore.getState().complexityLevel).toBe("basic");

		useUIStore.getState().setComplexityLevel("expert");
		expect(useUIStore.getState().complexityLevel).toBe("expert");
	});

	it("should handle all complexity levels", () => {
		const levels = ["basic", "advanced", "expert"] as const;
		for (const level of levels) {
			useUIStore.getState().setComplexityLevel(level);
			expect(useUIStore.getState().complexityLevel).toBe(level);
		}
	});

	it("should persist to localStorage", () => {
		useUIStore.getState().setSwarmMode("ledger");
		useUIStore.getState().setComplexityLevel("expert");
		useUIStore.getState().toggleTerminal();

		const persisted = readPersistedState();
		expect(persisted).not.toBeNull();
		expect(persisted.state.swarmMode).toBe("ledger");
		expect(persisted.state.complexityLevel).toBe("expert");
		expect(persisted.state.terminalOpen).toBe(true);
	});
});
