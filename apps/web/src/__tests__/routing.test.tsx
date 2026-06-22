import { QueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { createRouter } from "../router";

// ---------------------------------------------------------------------------
// Mocks — root route dependencies (auth session, providers, monitoring)
// ---------------------------------------------------------------------------

vi.mock("../features/auth/hooks/useAuthSession", () => ({
	useAuthSession: () => null,
}));

vi.mock("../lib/monitoring", () => ({
	captureError: vi.fn(),
	trackPageView: vi.fn(),
}));

vi.mock("../features/auth/lib/auth-session-snapshot", () => ({
	readAuthSessionSnapshot: async () => ({
		session: { id: "session-1", userId: "user-1" },
		user: { id: "user-1", email: "user@example.com", name: "Test User" },
	}),
	isAuthenticatedSessionSnapshot: (snapshot: {
		session: unknown;
		user: unknown;
	}) => Boolean(snapshot?.session && snapshot?.user),
}));

vi.mock("../components/layout/MainLayout", () => ({
	MainLayout: ({ children }: { children: ReactNode }) => (
		<div data-testid="private-shell">{children}</div>
	),
}));

vi.mock("../context/SettingsContext", () => ({
	SettingsProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
	useSettings: () => ({ resolvedTheme: "dark" }),
}));

vi.mock("../context/SimulationContext", () => ({
	SimulationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ui/motion-primitives", () => ({
	MotionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
	MotionDiv: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ui/page-transition", () => ({
	PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../components/error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
	Toaster: () => null,
}));

// ---------------------------------------------------------------------------
// Mocks — CodexShell sub-components (so the real CodexShell can render)
// ---------------------------------------------------------------------------

vi.mock("../components/agentic/CommandPalette", () => ({
	CommandPalette: () => <div data-testid="command-palette" />,
}));

vi.mock("../components/agentic/RightPanel", () => ({
	RightPanel: () => <div data-testid="right-panel" />,
}));

vi.mock("../components/agentic/TerminalShell", () => ({
	TerminalShell: () => <div data-testid="terminal-shell" />,
}));

// ---------------------------------------------------------------------------
// Mocks — DrenyraFlexMain (leaf route component)
// ---------------------------------------------------------------------------

vi.mock("../components/agentic/DrenyraFlexMain", () => ({
	DrenyraFlexMain: () => <div data-testid="drenyra-flex-main" />,
}));

// ---------------------------------------------------------------------------
// Mocks — shared utilities
// ---------------------------------------------------------------------------

vi.mock("../lib/utils", () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("../store/ui-store", () => ({
	useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector({
			terminalOpen: false,
			toggleTerminal: vi.fn(),
			setCommandPaletteOpen: vi.fn(),
			swarmMode: "auto",
			setSwarmMode: vi.fn(),
			isSidebarOpen: true,
			isRightRailOpen: true,
			toggleSidebar: vi.fn(),
			toggleRightRail: vi.fn(),
		} as unknown as Record<string, unknown>),
}));

vi.mock("../stores/thread-store", () => ({
	useThreadStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector({
			threads: [] as Array<{
				id: string;
				status: string;
				updatedAt: string;
			}>,
			activeThreadId: null,
			setActiveThread: vi.fn(),
			unarchiveThread: vi.fn(),
		} as unknown as Record<string, unknown>),
}));

vi.mock("lucide-react", async (importOriginal) => {
	const actual = await importOriginal();
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`lucide-${name}`} {...props} />;
		};
	return {
		...actual,
		// Override specific icons with test-friendly data-testid markers
		// All other icons use the real lucide implementation
		MessageSquare: icon("MessageSquare"),
		PanelLeft: icon("PanelLeft"),
		Eye: icon("Eye"),
		Terminal: icon("Terminal"),
		Plus: icon("Plus"),
		Search: icon("Search"),
		Settings: icon("Settings"),
		History: icon("History"),
		Loader2: icon("Loader2"),
		Bot: icon("Bot"),
		ClipboardList: icon("ClipboardList"),
		LayoutDashboard: icon("LayoutDashboard"),
		Paperclip: icon("Paperclip"),
		ScanSearch: icon("ScanSearch"),
		Mic: icon("Mic"),
		Send: icon("Send"),
		ChevronDown: icon("ChevronDown"),
		ChevronUp: icon("ChevronUp"),
		ChevronRight: icon("ChevronRight"),
		ShieldCheck: icon("ShieldCheck"),
		Landmark: icon("Landmark"),
	};
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { gcTime: 0, retry: false },
		},
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("/drenyra routing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders DrenyraFlexMain at /drenyra", async () => {
		window.history.pushState(null, "", "/drenyra");
		const queryClient = createQueryClient();
		const router = createRouter({ queryClient });

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByTestId("drenyra-flex-main")).toBeInTheDocument();
		});
	});

	it("renders DrenyraFlexMain at /drenyra/$threadId", async () => {
		window.history.pushState(null, "", "/drenyra/thread-abc-123");
		const queryClient = createQueryClient();
		const router = createRouter({ queryClient });

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByTestId("drenyra-flex-main")).toBeInTheDocument();
		});
	});

	it("redirects /chat to /drenyra", async () => {
		window.history.pushState(null, "", "/chat");
		const queryClient = createQueryClient();
		const router = createRouter({ queryClient });

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByTestId("drenyra-flex-main")).toBeInTheDocument();
		});

		expect(window.location.pathname).toBe("/drenyra");
	});

	it("redirects /workspace/operations to /drenyra", async () => {
		window.history.pushState(null, "", "/workspace/operations");
		const queryClient = createQueryClient();
		const router = createRouter({ queryClient });

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByTestId("drenyra-flex-main")).toBeInTheDocument();
		});

		expect(window.location.pathname).toBe("/drenyra");
	});
});
