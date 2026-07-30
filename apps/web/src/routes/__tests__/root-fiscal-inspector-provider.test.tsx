import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const locationState = vi.hoisted(() => ({ pathname: "/login" }));

vi.mock("@tanstack/react-router", () => ({
	createRootRoute: <T,>(config: T) => config,
	Outlet: () => <div data-testid="route-outlet" />,
	useLocation: () => ({ pathname: locationState.pathname }),
}));

vi.mock("@/components/agentic-shell/AgenticLayout/AgenticLayout", () => ({
	AgenticLayout: ({ children }: { children?: ReactNode }) => (
		<div data-testid="agentic-layout">
			{children ?? <div data-testid="route-outlet" />}
		</div>
	),
}));

vi.mock("sonner", () => ({
	Toaster: () => null,
}));

import { Route } from "../__root";

const RootComponent = (Route as unknown as { component: () => ReactNode })
	.component;

describe("root layout routing boundary", () => {
	it("renders public routes without the agentic shell", () => {
		locationState.pathname = "/login";

		render(<RootComponent />);

		expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
		expect(screen.queryByTestId("agentic-layout")).toBeNull();
	});

	it("renders the agentic shell for authenticated workspace routes", () => {
		locationState.pathname = "/workspace/1/2026/3/close";

		render(<RootComponent />);

		expect(screen.getByTestId("agentic-layout")).toBeInTheDocument();
	});
});
