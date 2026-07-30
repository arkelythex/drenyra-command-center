import { QueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRouter } from "../../router";

const authState = vi.hoisted(() => ({
	isAuthenticated: false,
}));

vi.mock("../../features/auth/hooks/useAuthSession", () => ({
	useAuthSession: () => null,
}));

vi.mock("../../lib/monitoring", () => ({
	captureError: vi.fn(),
	trackPageView: vi.fn(),
}));

vi.mock("../../components/layout/MainLayout", () => ({
	MainLayout: ({ children }: { children: ReactNode }) => (
		<div data-testid="private-shell">{children}</div>
	),
}));

vi.mock("../../features/auth/components/LoginForm", () => ({
	LoginForm: () => <div data-testid="login-route">Login route</div>,
}));

vi.mock("../../features/auth/components/SignupForm", () => ({
	SignupForm: () => <div data-testid="signup-route">Signup route</div>,
}));

vi.mock("../../features/onboarding/components/DemoShowcase", () => ({
	DemoShowcase: ({ autoPlayId }: { autoPlayId?: string }) => (
		<div data-testid="onboarding-demos-route">Demo: {autoPlayId}</div>
	),
}));

vi.mock("../../features/onboarding/components/OnboardingWizard", () => ({
	OnboardingWizard: () => (
		<div data-testid="onboarding-wizard-route">Onboarding wizard</div>
	),
}));

vi.mock("../../features/dashboard", () => ({
	DashboardView: () => <p data-testid="home-route">Dashboard route</p>,
}));

vi.mock("../../features/cognitive-hub/pages/CognitiveWorkspacePage", () => ({
	CognitiveWorkspacePage: () => (
		<div data-testid="chat-route">Cognitive hub route</div>
	),
}));

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 0,
				retry: false,
			},
		},
	});
}

async function renderRoute(path: string, expectedTestId: string) {
	window.history.pushState(null, "", path);
	const queryClient = createQueryClient();
	const router = createRouter({ queryClient });

	render(<RouterProvider router={router} />);

	await waitFor(() => {
		expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
	});
}

async function renderRouteWithRouter(path: string, expectedTestId: string) {
	window.history.pushState(null, "", path);
	const queryClient = createQueryClient();
	const router = createRouter({ queryClient });

	render(<RouterProvider router={router} />);

	await waitFor(() => {
		expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
	});

	return router;
}

describe("lazy route smoke", () => {
	beforeEach(() => {
		authState.isAuthenticated = false;
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json(
					authState.isAuthenticated
						? {
								success: true,
								data: {
									session: { id: "session-1" },
									user: { id: "user-1", email: "user@example.com" },
								},
							}
						: {
								success: true,
								data: {
									session: null,
									user: null,
								},
							},
				),
			),
		);
	});

	it("cold-loads public login route without private shell", async () => {
		await renderRoute("/login", "login-route");

		expect(screen.queryByTestId("private-shell")).not.toBeInTheDocument();
	});

	it("cold-loads public signup route without private shell", async () => {
		await renderRoute("/signup", "signup-route");

		expect(screen.queryByTestId("private-shell")).not.toBeInTheDocument();
	});

	it("cold-loads onboarding demos with validated search params", async () => {
		await renderRoute(
			"/onboarding/demos?play=igv-error",
			"onboarding-demos-route",
		);

		expect(screen.getByText("Demo: igv-error")).toBeInTheDocument();
		expect(screen.queryByTestId("private-shell")).not.toBeInTheDocument();
	});

	it("cold-loads private drenyra route as standalone (bypasses MainLayout)", async () => {
		authState.isAuthenticated = true;

		window.history.pushState(null, "", "/drenyra");
		const queryClient = createQueryClient();
		const router = createRouter({ queryClient });

		render(<RouterProvider router={router} />);

		// Drenyra is a standalone route (CodexShell), not wrapped by MainLayout
		await waitFor(() => {
			expect(screen.queryByTestId("private-shell")).not.toBeInTheDocument();
		});
	});

	it("updates the shell when navigating from public login to private dashboard", async () => {
		authState.isAuthenticated = true;
		const router = await renderRouteWithRouter("/login", "login-route");

		await act(async () => {
			await router.navigate({ to: "/dashboard" });
		});

		await waitFor(() => {
			expect(screen.getByTestId("home-route")).toBeInTheDocument();
			expect(screen.getByTestId("private-shell")).toBeInTheDocument();
		});
	});
});
