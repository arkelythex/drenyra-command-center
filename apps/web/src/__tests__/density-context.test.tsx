import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DENSITY_MODE } from "@drenyra/domain";

import { DensityProvider, useDensity } from "../contexts/density-context";

// ─── Test consumer ────────────────────────────────────────────────────────────

function DensityDisplay() {
	const { mode, setDensity } = useDensity();
	return (
		<div>
			<span data-testid="mode">{mode}</span>
			<button
				data-testid="set-comfortable"
				type="button"
				onClick={() => setDensity(DENSITY_MODE.COMFORTABLE)}
			>
				Comfortable
			</button>
			<button
				data-testid="set-compact"
				type="button"
				onClick={() => setDensity(DENSITY_MODE.COMPACT)}
			>
				Compact
			</button>
			<button
				data-testid="set-default"
				type="button"
				onClick={() => setDensity(DENSITY_MODE.DEFAULT)}
			>
				Default
			</button>
		</div>
	);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DensityContext", () => {
	beforeEach(() => {
		window.localStorage.clear();
		// Reset data-density attribute
		document.documentElement.removeAttribute("data-density");
	});

	afterEach(() => {
		document.documentElement.removeAttribute("data-density");
	});

	it("sets data-density attribute on mount (default)", () => {
		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		expect(document.documentElement.getAttribute("data-density")).toBe(
			DENSITY_MODE.DEFAULT,
		);
	});

	it("defaults to 'default' mode when localStorage has no stored value", () => {
		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		expect(screen.getByTestId("mode").textContent).toBe(DENSITY_MODE.DEFAULT);
	});

	it("reads initial density from localStorage when available", () => {
		window.localStorage.setItem(
			"drenyra:density-mode",
			JSON.stringify(DENSITY_MODE.COMPACT),
		);

		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		expect(screen.getByTestId("mode").textContent).toBe(DENSITY_MODE.COMPACT);
		expect(document.documentElement.getAttribute("data-density")).toBe(
			DENSITY_MODE.COMPACT,
		);
	});

	it("changing density updates data-density CSS attribute on <html>", async () => {
		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		await act(async () => {
			screen.getByTestId("set-comfortable").click();
		});

		expect(document.documentElement.getAttribute("data-density")).toBe(
			DENSITY_MODE.COMFORTABLE,
		);
	});

	it("changing density persists to localStorage", async () => {
		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		await act(async () => {
			screen.getByTestId("set-compact").click();
		});

		const stored = window.localStorage.getItem("drenyra:density-mode");
		expect(stored).toBe(JSON.stringify(DENSITY_MODE.COMPACT));
	});

	it("density persists across remounts (reads from localStorage)", async () => {
		const { unmount } = render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		// Change to comfortable
		await act(async () => {
			screen.getByTestId("set-comfortable").click();
		});

		// Unmount
		unmount();

		// Remount — should read comfortable from localStorage
		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		expect(screen.getByTestId("mode").textContent).toBe(
			DENSITY_MODE.COMFORTABLE,
		);
		expect(document.documentElement.getAttribute("data-density")).toBe(
			DENSITY_MODE.COMFORTABLE,
		);
	});

	it("throws when useDensity is used outside DensityProvider", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		function BadConsumer() {
			useDensity();
			return <div>bad</div>;
		}

		expect(() => render(<BadConsumer />)).toThrow();
		spy.mockRestore();
	});

	it("handles corrupted JSON in localStorage gracefully (falls back to default)", () => {
		window.localStorage.setItem("drenyra:density-mode", "not-valid-json{{{");

		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		expect(screen.getByTestId("mode").textContent).toBe(DENSITY_MODE.DEFAULT);
		expect(document.documentElement.getAttribute("data-density")).toBe(
			DENSITY_MODE.DEFAULT,
		);
	});

	it("handles invalid density value in localStorage (falls back to default)", () => {
		window.localStorage.setItem(
			"drenyra:density-mode",
			JSON.stringify("invalid-mode"),
		);

		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		expect(screen.getByTestId("mode").textContent).toBe(DENSITY_MODE.DEFAULT);
	});

	it("handles localStorage.setItem throwing (quota) gracefully", async () => {
		const originalSetItem = window.localStorage.setItem.bind(window.localStorage);

		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		window.localStorage.setItem = () => {
			throw new Error("QuotaExceededError");
		};

		// Should not throw
		await act(async () => {
			expect(() => {
				screen.getByTestId("set-comfortable").click();
			}).not.toThrow();
		});

		// State should still update in-memory
		expect(screen.getByTestId("mode").textContent).toBe(DENSITY_MODE.COMFORTABLE);

		window.localStorage.setItem = originalSetItem;
	});

	it("restoring to default updates attribute and localStorage", async () => {
		// Start with compact
		window.localStorage.setItem(
			"drenyra:density-mode",
			JSON.stringify(DENSITY_MODE.COMPACT),
		);

		render(
			<DensityProvider>
				<DensityDisplay />
			</DensityProvider>,
		);

		await act(async () => {
			screen.getByTestId("set-default").click();
		});

		expect(document.documentElement.getAttribute("data-density")).toBe(
			DENSITY_MODE.DEFAULT,
		);
		expect(
			JSON.parse(window.localStorage.getItem("drenyra:density-mode")!),
		).toBe(DENSITY_MODE.DEFAULT);
	});
});
