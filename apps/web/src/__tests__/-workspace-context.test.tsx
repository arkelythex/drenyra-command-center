import { render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCompanyRef,
	WORKSPACE_INTENT,
} from "@drenyra/domain";

import { WorkspaceProvider, useWorkspace } from "../contexts/workspace-context";

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeArkeCompany() {
	return createCompanyRef("c1", "Arkelythex SAC", "20123456789", "org1");
}

// ─── Test consumer component ──────────────────────────────────────────────────

function Consumer() {
	const ws = useWorkspace();
	return (
		<div>
			<span data-testid="has-workspace">
				{ws.workspace ? "yes" : "no"}
			</span>
			<span data-testid="is-loading">
				{ws.isLoading ? "yes" : "no"}
			</span>
			<button
				data-testid="navigate-btn"
				type="button"
				onClick={() =>
					ws.navigateTo(makeArkeCompany(), 2026, 6, WORKSPACE_INTENT.CLOSE)
				}
			>
				Navigate
			</button>
			<button
				data-testid="switch-intent-btn"
				type="button"
				onClick={() => ws.switchIntent(WORKSPACE_INTENT.REVIEW)}
			>
				Switch Intent
			</button>
		</div>
	);
}

function MultipleConsumers() {
	return (
		<div>
			<Consumer />
			<Consumer />
		</div>
	);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkspaceContext", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("provides workspace via useWorkspace (defaults: null, not loading)", () => {
		render(
			<WorkspaceProvider>
				<Consumer />
			</WorkspaceProvider>,
		);

		expect(screen.getByTestId("has-workspace").textContent).toBe("no");
		expect(screen.getByTestId("is-loading").textContent).toBe("no");
	});

	it("throws when useWorkspace is used outside WorkspaceProvider", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		function BadConsumer() {
			useWorkspace();
			return <div>bad</div>;
		}

		expect(() => render(<BadConsumer />)).toThrow();
		spy.mockRestore();
	});

	it("navigateTo updates all consumers", async () => {
		render(
			<WorkspaceProvider>
				<MultipleConsumers />
			</WorkspaceProvider>,
		);

		const buttons = screen.getAllByTestId("navigate-btn");
		expect(buttons).toHaveLength(2);

		await act(async () => {
			buttons[0].click();
		});

		// Both consumers should reflect the updated state
		const indicators = screen.getAllByTestId("has-workspace");
		expect(indicators).toHaveLength(2);
		expect(indicators[0].textContent).toBe("yes");
		expect(indicators[1].textContent).toBe("yes");
	});

	it("switchIntent updates all consumers", async () => {
		render(
			<WorkspaceProvider>
				<MultipleConsumers />
			</WorkspaceProvider>,
		);

		// First navigate
		await act(async () => {
			screen.getAllByTestId("navigate-btn")[0].click();
		});

		// Then switch intent
		await act(async () => {
			screen.getAllByTestId("switch-intent-btn")[0].click();
		});

		const indicators = screen.getAllByTestId("has-workspace");
		expect(indicators[0].textContent).toBe("yes");
		expect(indicators[1].textContent).toBe("yes");
	});
});
