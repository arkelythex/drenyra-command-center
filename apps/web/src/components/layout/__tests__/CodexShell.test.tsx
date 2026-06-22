import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodexShell } from "../CodexShell";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Shared mutable state — use vi.hoisted for mutable store state
// ---------------------------------------------------------------------------

const mockStoreState = vi.hoisted(() => ({
	isSidebarOpen: true,
	isRightRailOpen: true,
	terminalOpen: false,
	toggleSidebar: vi.fn(),
	toggleRightRail: vi.fn(),
	toggleTerminal: vi.fn(),
	setCommandPaletteOpen: vi.fn(),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/store/ui-store", () => ({
	useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector(mockStoreState as unknown as Record<string, unknown>),
}));

vi.mock("@tanstack/react-router", () => ({
	Outlet: () => <div data-testid="outlet" />,
	useNavigate: () => mockNavigate,
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

// Mock paths are relative to the test file at components/layout/__tests__/
vi.mock("../Sidebar", () => ({
	Sidebar: () => <div data-testid="drenyra-sidebar" />,
}));

vi.mock("../../agentic/AccountingTopBar", () => ({
	AccountingTopBar: () => <div data-testid="accounting-topbar" />,
}));

vi.mock("../../agentic/CodexBottomNav", () => ({
	CodexBottomNav: () => <div data-testid="codex-bottom-nav" />,
}));

vi.mock("../../agentic/CommandPalette", () => ({
	CommandPalette: () => <div data-testid="command-palette" />,
}));

vi.mock("../../agentic/RightPanel", () => ({
	RightPanel: () => <div data-testid="right-panel" />,
}));

vi.mock("../../agentic/TerminalShell", () => ({
	TerminalShell: () => <div data-testid="terminal-shell" />,
}));

vi.mock("@/lib/utils", () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => {
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`lucide-${name}`} {...props} />;
		};
	return {
		ArrowLeftRight: icon("ArrowLeftRight"),
		BarChart3: icon("BarChart3"),
		BookOpen: icon("BookOpen"),
		Bot: icon("Bot"),
		Building2: icon("Building2"),
		Calculator: icon("Calculator"),
		Calendar: icon("Calendar"),
		CalendarCheck: icon("CalendarCheck"),
		CheckCheck: icon("CheckCheck"),
		ChevronDown: icon("ChevronDown"),
		ChevronRight: icon("ChevronRight"),
		Clock: icon("Clock"),
		Download: icon("Download"),
		Eye: icon("Eye"),
		FileText: icon("FileText"),
		History: icon("History"),
		Landmark: icon("Landmark"),
		MessageSquare: icon("MessageSquare"),
		PanelLeft: icon("PanelLeft"),
		Play: icon("Play"),
		Plus: icon("Plus"),
		Receipt: icon("Receipt"),
		Search: icon("Search"),
		Settings: icon("Settings"),
		ShieldCheck: icon("ShieldCheck"),
		Sparkles: icon("Sparkles"),
		Terminal: icon("Terminal"),
	};
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockMatchMediaMobile() {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: true,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

function mockMatchMediaDesktop() {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CodexShell", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockStoreState.isSidebarOpen = true;
		mockStoreState.isRightRailOpen = true;
		mockStoreState.terminalOpen = false;
		mockMatchMediaDesktop();
	});

	it("renders 3-panel layout (sidebar, main, right panel)", () => {
		render(<CodexShell />);

		// CommandPalette should be present
		expect(screen.getByTestId("command-palette")).toBeInTheDocument();

		// Sidebar should be open and visible
		expect(screen.getByTestId("drenyra-sidebar")).toBeInTheDocument();

		// Main area with Outlet
		expect(screen.getByTestId("outlet")).toBeInTheDocument();

		// Right panel should be visible
		expect(screen.getByTestId("right-panel")).toBeInTheDocument();
	});

	it("renders terminal drawer when terminalOpen is true", async () => {
		mockStoreState.terminalOpen = true;

		render(<CodexShell />);

		// TerminalShell is lazy-loaded — wait for it to resolve
		expect(await screen.findByTestId("terminal-shell")).toBeInTheDocument();

		// Terminal header should show
		const terminalLabels = screen.getAllByText("Terminal");
		expect(terminalLabels.length).toBeGreaterThanOrEqual(1);
	});

	it("hides terminal drawer when terminalOpen is false", () => {
		mockStoreState.terminalOpen = false;

		render(<CodexShell />);

		expect(screen.queryByTestId("terminal-shell")).not.toBeInTheDocument();
		// Terminal appears in the mobile bottom nav which is always rendered
	});

	it("toggles sidebar with Cmd+B", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: "b", metaKey: true, shiftKey: false });

		expect(mockStoreState.toggleSidebar).toHaveBeenCalledTimes(1);
	});

	it("toggles right panel with Cmd+Shift+B", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: "b", metaKey: true, shiftKey: true });

		expect(mockStoreState.toggleRightRail).toHaveBeenCalledTimes(1);
	});

	it("toggles terminal with Cmd+J", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: "j", metaKey: true });

		expect(mockStoreState.toggleTerminal).toHaveBeenCalledTimes(1);
	});

	it("does not trigger shortcuts without modifier key", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: "b", metaKey: false });

		expect(mockStoreState.toggleSidebar).not.toHaveBeenCalled();
		expect(mockStoreState.toggleRightRail).not.toHaveBeenCalled();
		expect(mockStoreState.toggleTerminal).not.toHaveBeenCalled();
	});

	it("renders mobile bottom nav on small viewports", () => {
		mockMatchMediaMobile();
		mockStoreState.isSidebarOpen = false;

		render(<CodexShell />);

		// On mobile with sidebar closed, the sidebar is hidden
		expect(screen.queryByTestId("drenyra-sidebar")).not.toBeInTheDocument();

		// The bottom nav mock is rendered
		expect(screen.getByTestId("codex-bottom-nav")).toBeInTheDocument();

		// Main area still renders
		expect(screen.getByTestId("outlet")).toBeInTheDocument();
	});

	it("shows backdrop overlay on mobile with sidebar open", () => {
		mockMatchMediaMobile();
		mockStoreState.isSidebarOpen = true;
		mockStoreState.isRightRailOpen = false;

		render(<CodexShell />);

		// Sidebar should be visible
		expect(screen.getByTestId("drenyra-sidebar")).toBeInTheDocument();

		// The backdrop overlay should be present
		const overlays = document.querySelectorAll(".fixed.inset-0");
		expect(overlays.length).toBeGreaterThanOrEqual(1);
	});

	it("navigates to settings on Cmd+,", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: ",", metaKey: true });

		expect(mockNavigate).toHaveBeenCalledWith({ to: "/configuracion" });
	});

	it("navigates to dashboard on Cmd+D", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: "d", metaKey: true });

		expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
	});

	it("opens command palette on Cmd+P", () => {
		render(<CodexShell />);

		fireEvent.keyDown(window, { key: "p", metaKey: true });

		expect(mockStoreState.setCommandPaletteOpen).toHaveBeenCalledWith(true);
	});
});
