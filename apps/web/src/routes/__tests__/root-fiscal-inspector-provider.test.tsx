import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const locationState = vi.hoisted(() => ({ pathname: "/login" }));

vi.mock("@tanstack/react-router", () => ({
	createRootRoute: <T,>(config: T) => config,
	Outlet: () => <div data-testid="route-outlet" />,
	useLocation: ({
		select,
	}: {
		select: (location: { pathname: string }) => string;
	}) => select({ pathname: locationState.pathname }),
}));

vi.mock("@/context/FiscalInspectorContext", () => ({
	FiscalInspectorProvider: ({ children }: { children: ReactNode }) => (
		<div data-testid="fiscal-inspector-provider">{children}</div>
	),
}));

import { Route } from "../__root";

const RootComponent = (Route as unknown as { component: () => ReactNode })
	.component;

describe("root FiscalInspectorProvider boundary", () => {
	it("does not mount the fiscal inspector provider for public routes", () => {
		locationState.pathname = "/login";

		render(<RootComponent />);

		expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
		expect(screen.queryByTestId("fiscal-inspector-provider")).toBeNull();
	});

	it("mounts one fiscal inspector provider around authenticated routes", () => {
		locationState.pathname = "/dashboard";

		render(<RootComponent />);

		expect(screen.getAllByTestId("fiscal-inspector-provider")).toHaveLength(1);
		expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
	});
});
