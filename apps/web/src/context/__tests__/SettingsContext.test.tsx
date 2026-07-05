import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { useUIStore } from "@/store/ui-store";

function wrapper({ children }: { children: ReactNode }) {
	return <SettingsProvider>{children}</SettingsProvider>;
}

describe("SettingsContext theme bridge", () => {
	beforeEach(() => {
		window.localStorage.clear();
		useUIStore.setState({
			themePreference: "mono-dark",
			complexityLevel: "advanced",
			isSidebarOpen: true,
			isRightRailOpen: false,
		});
	});

	it("bridges settings.theme updates to ui-store themePreference", async () => {
		const { result } = renderHook(() => useSettings(), { wrapper });

		await waitFor(() => {
			expect(result.current.settings.theme).toBe("dark");
		});

		act(() => {
			result.current.updateSettings({ theme: "light" });
		});

		expect(useUIStore.getState().themePreference).toBe("mono-light");
	});

	it("persists bridged themePreference in ui storage", async () => {
		const { result } = renderHook(() => useSettings(), { wrapper });

		act(() => {
			result.current.updateSettings({ theme: "auto" });
		});

		const persisted = window.localStorage.getItem("drenyra-ui-storage");
		expect(persisted).not.toBeNull();
		expect(persisted).toContain('"themePreference":"system"');
	});
});
