import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DrenyraFlexMain } from "../DrenyraFlexMain";

// ---------------------------------------------------------------------------
// Shared mutable state (vi.hoisted)
// ---------------------------------------------------------------------------

const mockThreadState = vi.hoisted(() => ({
	activeThreadId: null as string | null,
}));

const mockFiscalCaseState = vi.hoisted(() => ({
	activeFiscalCaseId: null as string | null,
}));

const mockNavigate = vi.hoisted(() => vi.fn());
const mockSendMessage = vi.hoisted(() => vi.fn());
const mockClearError = vi.hoisted(() => vi.fn());
const mockExtractNavigationIntent = vi.hoisted(() => vi.fn());

const mockUsePersistedChatReturn = vi.hoisted(() => ({
	messages: [] as Array<{
		id: string;
		role: string;
		content: string;
		timestamp: string;
	}>,
	sendMessage: mockSendMessage,
	isLoading: false,
	isStreaming: false,
	loadingHistory: false,
	error: null as string | null,
	clearError: mockClearError,
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/stores/thread-store", () => ({
	useThreadStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector(mockThreadState as unknown as Record<string, unknown>),
}));

vi.mock("@/stores/fiscal-case-store", () => ({
	useFiscalCaseStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector(mockFiscalCaseState as unknown as Record<string, unknown>),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/features/drenyra-workspace/hooks/usePersistedChat", () => ({
	usePersistedChat: () => mockUsePersistedChatReturn,
}));

vi.mock("@/features/cognitive-hub/logic/intent-parser", () => ({
	extractNavigationIntent: mockExtractNavigationIntent,
	getCommandSuggestions: vi.fn((_input: string) => []),
	parseIntent: vi.fn(() => "query"),
}));

vi.mock("@/features/cognitive-hub/hooks/cognitive-stream", () => ({
	readPersistedTimeline: () => [],
}));

// Mock child components
vi.mock("../ThreadView", () => ({
	ThreadView: () => <div data-testid="thread-view" />,
}));

vi.mock("../SplitView", () => ({
	SplitView: ({ left, right }: { left: ReactNode; right: ReactNode }) => (
		<div data-testid="split-view">
			<div data-testid="split-view-left">{left}</div>
			<div data-testid="split-view-right">{right}</div>
		</div>
	),
}));

vi.mock("@/features/central-board/CentralBoard", () => ({
	CentralBoard: () => <div data-testid="central-board" />,
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
		Bot: icon("Bot"),
		ClipboardList: icon("ClipboardList"),
		LayoutDashboard: icon("LayoutDashboard"),
		Paperclip: icon("Paperclip"),
		ScanSearch: icon("ScanSearch"),
		Mic: icon("Mic"),
		Send: icon("Send"),
		ChevronDown: icon("ChevronDown"),
		ChevronUp: icon("ChevronUp"),
	};
});

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DrenyraFlexMain", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockThreadState.activeThreadId = null;
		mockFiscalCaseState.activeFiscalCaseId = null;
		mockUsePersistedChatReturn.messages = [];
		mockUsePersistedChatReturn.error = null;
		mockUsePersistedChatReturn.isStreaming = false;
		mockUsePersistedChatReturn.loadingHistory = false;
	});

	it("renders chat as single canvas (no mode tabs)", async () => {
		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		// Verify no mode tabs (thread/command/agents) are rendered
		expect(
			screen.queryByRole("tab", { name: /thread/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("tab", { name: /command/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("tab", { name: /agents/i }),
		).not.toBeInTheDocument();

		// Verify ThreadView is present (lazy-loaded, use findBy)
		expect(await screen.findByTestId("thread-view")).toBeInTheDocument();

		// Verify the composer textarea is present
		expect(
			screen.getByPlaceholderText("Message Drenyra..."),
		).toBeInTheDocument();

		// Verify inline agent status labels are shown
		expect(screen.getByText("Validador SIRE")).toBeInTheDocument();
		expect(screen.getByText("Revisor CPE")).toBeInTheDocument();
		expect(screen.getByText("Contabilizador")).toBeInTheDocument();
		expect(screen.getByText("Gestor Evidencia")).toBeInTheDocument();
	});

	it("renders SplitView with CentralBoard", () => {
		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		// Verify the split view is rendered
		expect(screen.getByTestId("split-view")).toBeInTheDocument();

		// Verify CentralBoard is present in the right pane
		const rightPane = screen.getByTestId("split-view-right");
		expect(
			rightPane.querySelector('[data-testid="central-board"]'),
		).toBeInTheDocument();
	});

	it("handles slash command /detalle navigation", async () => {
		const user = userEvent.setup();
		mockExtractNavigationIntent.mockReturnValue({
			type: "navigation",
			target: "/dashboard",
			title: "Vista Detalle",
		});

		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		// Type /detalle in composer and send
		const textarea = screen.getByPlaceholderText("Message Drenyra...");
		await user.type(textarea, "/detalle");

		// Find the send button (lucide-Send icon wrapped in a button)
		const sendIcon = screen.getByTestId("lucide-Send");
		const sendButton = sendIcon.closest("button");
		expect(sendButton).not.toBeNull();
		expect(sendButton).not.toBeDisabled();

		await user.click(sendButton!);

		// Verify navigation intent was extracted
		expect(mockExtractNavigationIntent).toHaveBeenCalledWith("/detalle");

		// Verify navigate was called with the correct target
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });

		// Verify it did NOT fall through to sendMessage
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("handles unknown command as normal message", async () => {
		const user = userEvent.setup();
		mockExtractNavigationIntent.mockReturnValue(null);

		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		const textarea = screen.getByPlaceholderText("Message Drenyra...");
		await user.type(textarea, "/unknowncommand");

		const sendIcon = screen.getByTestId("lucide-Send");
		const sendButton = sendIcon.closest("button");
		await user.click(sendButton!);

		// Should NOT navigate
		expect(mockNavigate).not.toHaveBeenCalled();

		// Should pass to the chat hook as a normal message
		expect(mockSendMessage).toHaveBeenCalledWith("/unknowncommand");
	});

	it("renders with no active thread", async () => {
		// activeThreadId is null by default
		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		// Should still render the main structure without errors
		expect(await screen.findByTestId("thread-view")).toBeInTheDocument();
		expect(screen.getByTestId("split-view")).toBeInTheDocument();
		expect(screen.getByTestId("central-board")).toBeInTheDocument();

		// Verify inline agent status labels are shown even without active thread
		expect(screen.getByText("Validador SIRE")).toBeInTheDocument();
	});

	it("shows error bar when error is present", () => {
		mockUsePersistedChatReturn.error = "Connection failed";

		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		expect(screen.getByText("Connection failed")).toBeInTheDocument();
		expect(screen.getByText("Reintentar")).toBeInTheDocument();
		expect(screen.getByText("Descartar")).toBeInTheDocument();
	});

	it("clears error when Descartar is clicked", async () => {
		const user = userEvent.setup();
		mockUsePersistedChatReturn.error = "Connection failed";

		render(<DrenyraFlexMain />, { wrapper: createWrapper() });

		await user.click(screen.getByText("Descartar"));

		expect(mockClearError).toHaveBeenCalled();
	});
});
