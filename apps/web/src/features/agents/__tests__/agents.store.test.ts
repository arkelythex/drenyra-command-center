import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAgentsWindowStore } from "../agents.store";

function createStore() {
	return renderHook(() => useAgentsWindowStore());
}

describe("AgentsWindowStore", () => {
	it("starts with default values", () => {
		const { result } = createStore();
		expect(result.current.selectedSessionId).toBeNull();
		expect(result.current.gridMode).toBe("grid");
		expect(result.current.filters).toEqual({});
	});

	it("selectSession sets the selected session id", () => {
		const { result } = createStore();
		act(() => result.current.selectSession("session-1"));
		expect(result.current.selectedSessionId).toBe("session-1");
	});

	it("selectSession null clears selection", () => {
		const { result } = createStore();
		act(() => result.current.selectSession("session-1"));
		act(() => result.current.selectSession(null));
		expect(result.current.selectedSessionId).toBeNull();
	});

	it("setGridMode toggles to tabs", () => {
		const { result } = createStore();
		act(() => result.current.setGridMode("tabs"));
		expect(result.current.gridMode).toBe("tabs");
	});

	it("setGridMode toggles back to grid", () => {
		const { result } = createStore();
		act(() => result.current.setGridMode("tabs"));
		act(() => result.current.setGridMode("grid"));
		expect(result.current.gridMode).toBe("grid");
	});

	it("setFilters merges partial filters", () => {
		const { result } = createStore();
		act(() => result.current.setFilters({ status: "running" }));
		expect(result.current.filters).toEqual({ status: "running" });
	});

	it("setFilters merges additional fields", () => {
		const { result } = createStore();
		act(() => result.current.setFilters({ status: "running" }));
		act(() => result.current.setFilters({ risk: "high" }));
		expect(result.current.filters).toEqual({ status: "running", risk: "high" });
	});

	it("resetFilters clears all filters", () => {
		const { result } = createStore();
		act(() =>
			result.current.setFilters({
				status: "running",
				risk: "high",
				client: "test",
			}),
		);
		act(() => result.current.resetFilters());
		expect(result.current.filters).toEqual({});
	});
});
