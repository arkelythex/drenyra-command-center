import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useHubState } from "../useHubState";

function resetHubState() {
	useHubState.setState({
		mode: "commands",
		density: "normal",
		preferences: {
			favoriteMetrics: ["liquidez", "igv"],
			riskTolerance: "medium",
			automationLevel: 50,
		},
		isOpen: false,
		activeArtifact: null,
		query: "",
		isAuditMode: false,
		showHistory: false,
		fiscalCaseId: null,
		fiscalCaseLabel: null,
	});
}

describe("useHubState", () => {
	beforeEach(() => {
		resetHubState();
	});

	it("updates primary UI state with setters", () => {
		const { result } = renderHook(() => useHubState());

		expect(result.current.mode).toBe("commands");
		expect(result.current.density).toBe("normal");
		expect(result.current.isOpen).toBe(false);

		act(() => {
			result.current.setMode("chat");
			result.current.setDensity("compact");
			result.current.setOpen(true);
			result.current.setQuery("revisar facturas");
			result.current.setAuditMode(true);
		});

		expect(result.current.mode).toBe("chat");
		expect(result.current.density).toBe("compact");
		expect(result.current.isOpen).toBe(true);
		expect(result.current.query).toBe("revisar facturas");
		expect(result.current.isAuditMode).toBe(true);
	});

	it("merges preferences and toggles flags", () => {
		const { result } = renderHook(() => useHubState());

		act(() => {
			result.current.setPreferences({
				automationLevel: 90,
			});
		});

		expect(result.current.preferences.automationLevel).toBe(90);
		expect(result.current.preferences.riskTolerance).toBe("medium");
		expect(result.current.preferences.favoriteMetrics).toEqual([
			"liquidez",
			"igv",
		]);

		act(() => {
			result.current.toggleHistory();
			result.current.toggle();
		});

		expect(result.current.showHistory).toBe(true);
		expect(result.current.isOpen).toBe(true);

		act(() => {
			result.current.toggleHistory();
			result.current.toggle();
		});

		expect(result.current.showHistory).toBe(false);
		expect(result.current.isOpen).toBe(false);
	});

	it("stores selected artifact", () => {
		const { result } = renderHook(() => useHubState());

		act(() => {
			result.current.setActiveArtifact({
				id: "artifact-1",
				type: "explanation",
				title: "Razón del Arbitro",
				content: "Se detectó inconsistencia de IGV.",
				metadata: { source: "arbiter" },
			});
		});

		expect(result.current.activeArtifact?.id).toBe("artifact-1");
		expect(result.current.activeArtifact?.type).toBe("explanation");

		act(() => {
			result.current.setActiveArtifact(null);
		});

		expect(result.current.activeArtifact).toBeNull();
	});
});
