/**
 * @vitest-environment jsdom
 *
 * CommandCenterChat — Test Suite
 *
 * Covers: empty state, quick action cards, case badge, action buttons,
 * agent selector, density toggles, input bar, streaming indicator,
 * approval UI, message bubbles, command parsing (/compacto),
 * file upload chips, and chip removal.
 *
 * @since Jun 2026
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

vi.mock("@/features/drenyra-command-center/i18n/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"chat.empty.title": "Chat Fiscal",
				"chat.empty.subtitle": "Agentes IA especializados para tu cierre mensual",
				"chat.empty.quick.conciliate": "Conciliar banco",
				"chat.empty.quick.sire": "Preparar SIRE",
				"chat.empty.quick.risk": "Análisis de riesgo",
				"chat.empty.quick.igv": "Validar IGV",
				"chat.placeholder": "Escribí un comando fiscal...",
				"chat.streaming": "El agente está procesando...",
				"chat.approval.title": "Aprobación requerida",
				"chat.approval.approve": "Aprobar",
				"chat.approval.deny": "Denegar",
				"chat.case.noSelection": "Sin caso seleccionado",
				"chat.case.change": "Cambiar",
				"chat.case.details": "Detalles del caso",
				"chat.case.status.open": "Abierto",
				"chat.case.status.review": "En revisión",
				"chat.case.status.approval": "Aprobación pendiente",
				"chat.case.status.resolved": "Resuelto",
				"chat.case.status.archived": "Archivado",
				"density.compact": "Compacto",
				"density.detail": "Detalle",
				"density.numbers": "Números",
				"actions.runAgent": "Ejecutar Agente",
				"actions.upload": "Subir",
				"actions.newCase": "Nuevo Caso",
				"actions.approval": "Aprobación",
			};
			return translations[key] || key;
		},
		i18n: { language: "es" },
	}),
}));

// ── Hoisted mock factories ───────────────────────────────────────────────────

const {
	mockUseChatHistory,
	mockUseCognitiveStream,
	mockExtractArtifacts,
	mockStripArtifacts,
} = vi.hoisted(() => ({
	mockUseChatHistory: vi.fn(),
	mockUseCognitiveStream: vi.fn(),
	mockExtractArtifacts: vi.fn(() => []),
	mockStripArtifacts: vi.fn((content: string) => content),
}));

// ── Module mocks (hoisted above imports by vitest) ───────────────────────────

vi.mock("@/features/cognitive-hub/hooks/useCognitiveStream", () => ({
	useCognitiveStream: mockUseCognitiveStream,
}));

vi.mock("@/features/drenyra-command-center/hooks/useChatHistory", () => ({
	useChatHistory: mockUseChatHistory,
}));

vi.mock("@/features/cognitive-hub/logic/artifact-extractor", () => ({
	extractArtifacts: mockExtractArtifacts,
	stripArtifacts: mockStripArtifacts,
}));

vi.mock("lucide-react", () => {
	const React = require("react");
	const iconNames = [
		"AlertTriangle",
		"BarChart3",
		"Bot",
		"Check",
		"ChevronDown",
		"ChevronRight",
		"FileSpreadsheet",
		"FileText",
		"Loader2",
		"Paperclip",
		"Pin",
		"Plus",
		"Receipt",
		"SendHorizontal",
		"Sparkles",
		"ThumbsUp",
		"User",
		"X",
	] as const;

	const result: Record<string, ReturnType<typeof createIcon>> = {};
	for (const name of iconNames) {
		const Icon = (props: Record<string, unknown>) =>
			React.createElement("span", {
				"data-testid": `lucide-${name.toLowerCase()}`,
				...props,
			});
		Icon.displayName = name;
		result[name] = Icon;
	}
	return result;
});

vi.mock("@/components/ui/button", () => {
	const React = require("react");
	return {
		Button: React.forwardRef(
			(
				{
					children,
					onClick,
					disabled,
					className,
					...props
				}: {
					children?: React.ReactNode;
					onClick?: () => void;
					disabled?: boolean;
					className?: string;
					[key: string]: unknown;
				},
				ref: React.Ref<HTMLButtonElement>,
			) =>
				React.createElement(
					"button",
					{
						onClick,
						disabled,
						className,
						ref,
						"data-testid": "ui-button",
						...props,
					},
					children,
				),
		),
	};
});

vi.mock(
	"@/features/drenyra-command-center/components/ArtifactCollapsible",
	() => {
		const React = require("react");
		return {
			ArtifactCollapsible: ({
				artifact,
				density,
				isPinned,
				onPin,
				onFocus,
				onCreateCase,
			}: {
				artifact?: { id: string; title: string };
				density?: string;
				isPinned?: boolean;
				onPin?: (id: string) => void;
				onFocus?: (a: unknown) => void;
				onCreateCase?: (a: unknown) => void;
			}) =>
				React.createElement("div", {
					"data-testid": "artifact-collapsible",
					"data-artifact-id": artifact?.id,
					"data-density": density,
					"data-pinned": isPinned,
				}),
		};
	},
);

vi.mock(
	"@/features/drenyra-command-center/components/EvidenceAttachmentForm",
	() => {
		const React = require("react");
		return {
			EvidenceAttachmentForm: ({
				onSubmit,
				isPending,
				isDisabled,
			}: {
				onSubmit?: () => void;
				isPending?: boolean;
				isDisabled?: boolean;
			}) =>
				React.createElement("div", {
					"data-testid": "evidence-attachment-form",
					"data-pending": isPending,
					"data-disabled": isDisabled,
				}),
		};
	},
);

vi.mock(
	"@/features/drenyra-command-center/components/FiscalCaseCreationForm",
	() => {
		const React = require("react");
		return {
			FiscalCaseCreationForm: ({
				onSubmit,
				isPending,
			}: {
				onSubmit?: () => void;
				isPending?: boolean;
			}) =>
				React.createElement("div", {
					"data-testid": "fiscal-case-creation-form",
					"data-pending": isPending,
				}),
		};
	},
);

vi.mock("@/features/drenyra-command-center/components/metric", () => {
	const React = require("react");
	return {
		Metric: ({
			label,
			value,
		}: {
			label: string;
			value: string;
		}) =>
			React.createElement(
				"div",
				{ "data-testid": "metric" },
				React.createElement("span", { "data-testid": "metric-label" }, label),
				React.createElement(
					"span",
					{ "data-testid": "metric-value" },
					value,
				),
			),
	};
});

vi.mock(
	"@/features/cognitive-hub/components/artifacts/ArtifactRenderer",
	() => {
		const React = require("react");
		return {
			ArtifactRenderer: () =>
				React.createElement("div", {
					"data-testid": "artifact-renderer",
				}),
		};
	},
);

vi.mock("@/features/drenyra-command-center/components/VirtualizedMessageList", () => ({
	VirtualizedMessageList: ({
		messages,
		densityMode,
	}: {
		messages: Array<{ id: string; role: string; content: string; timestamp: Date; artifacts?: Array<{ id: string }> }>;
		densityMode?: string;
	}) => (
		<div data-testid="virtualized-msg-list">
			{messages.map((msg) => (
				<div key={msg.id} data-role={msg.role}>
					{msg.content}
					{msg.artifacts?.map((a: { id: string }) => (
						<div key={a.id} data-testid="artifact-collapsible" data-artifact-id={a.id} data-density={densityMode ?? "detail"} />
					))}
				</div>
			))}
		</div>
	),
}));

// ── SUT import (after mocks) ─────────────────────────────────────────────────

import { CommandCenterChat } from "../components/CommandCenterChat";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function messageFixture(
	overrides: Partial<{
		id: string;
		role: "user" | "assistant" | "system";
		content: string;
		timestamp: Date;
	}> = {},
) {
	return {
		id: "msg-1",
		role: "user" as const,
		content: "Test message",
		timestamp: new Date("2026-06-01T10:00:00Z"),
		...overrides,
	};
}

const mockCases = [
	{
		id: "case-1",
		scope: {
			companyId: "test-company-1",
			companyRuc: "20123456789",
			period: "2026-05",
			countryCode: "PE" as const,
		},
		type: "MONTHLY_CLOSE" as const,
		status: "OPEN" as const,
		title: "Cierre Mensual Junio 2026",
		description: "Cierre del período mensual",
		riskLevel: "MEDIUM" as const,
		riskScore: 45,
		autonomyLevel: "ADVISORY" as const,
		createdBy: "user-1",
		createdAt: "2026-06-01T00:00:00Z",
		updatedAt: "2026-06-01T00:00:00Z",
		metadata: {},
	},
	{
		id: "case-2",
		scope: {
			companyId: "test-company-1",
			companyRuc: "20123456789",
			period: "2026-06",
			countryCode: "PE" as const,
		},
		type: "CPE_REVIEW" as const,
		status: "IN_REVIEW" as const,
		title: "Revisión IGV Julio",
		description: "Revisión de comprobantes IGV",
		riskLevel: "HIGH" as const,
		riskScore: 72,
		autonomyLevel: "DRAFT_ONLY" as const,
		createdBy: "user-1",
		createdAt: "2026-06-05T00:00:00Z",
		updatedAt: "2026-06-05T00:00:00Z",
		metadata: {},
	},
];

const mockMessages = [
	messageFixture({
		id: "msg-1",
		role: "user",
		content: "Analizá el riesgo fiscal del período",
	}),
	messageFixture({
		id: "msg-2",
		role: "assistant",
		content: "He completado el análisis de riesgo. Se encontraron 3 anomalías.",
		timestamp: new Date("2026-06-01T10:00:05Z"),
	}),
];

const defaultProps = {
	companyId: "test-company-1",
	cases: [],
	selectedCaseId: null,
	selectedAgent: "LEDGER_AGENT" as const,
	isBusy: false,
	onCreateCase: vi.fn(),
	onRunAgent: vi.fn(),
	onAddEvidence: vi.fn(),
	onUpdateStatus: vi.fn(),
	onSelectCase: vi.fn(),
	onRequestApproval: vi.fn(),
};

// ── Default mock returns ─────────────────────────────────────────────────────

function setupDefaultMocks() {
	mockUseChatHistory.mockReturnValue({
		messages: [],
		appendMessage: vi.fn(),
		updateMessage: vi.fn(),
		setMessages: vi.fn(),
		clearHistory: vi.fn(),
	});

	mockUseCognitiveStream.mockReturnValue({
		streamMessage: vi.fn(),
		submitApprovalDecision: vi.fn(),
		isStreaming: false,
		pendingApproval: null,
	});
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe("CommandCenterChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupDefaultMocks();
		Element.prototype.scrollIntoView = vi.fn();
	});

	// ── Empty state ──────────────────────────────────────────────────────────

	it("renders empty state with bot icon and 4 quick action cards when no messages and not streaming", () => {
		render(<CommandCenterChat {...defaultProps} />);

		// Bot icon present
		expect(screen.getByTestId("lucide-bot")).toBeInTheDocument();

		// Heading
		expect(screen.getByText("Chat Fiscal")).toBeInTheDocument();
		expect(
			screen.getByText("Agentes IA especializados para tu cierre mensual"),
		).toBeInTheDocument();

		// 4 QuickActionCards via their titles
		expect(screen.getByText("Conciliar banco")).toBeInTheDocument();
		expect(screen.getByText("Preparar SIRE")).toBeInTheDocument();
		expect(screen.getByText("Análisis de riesgo")).toBeInTheDocument();
		expect(screen.getByText("Validar IGV")).toBeInTheDocument();

		// Shortcut hint
		expect(
			screen.getByText(/⌘K para comandos/),
		).toBeInTheDocument();
	});

	it("hides empty state when streaming even with no messages", () => {
		mockUseCognitiveStream.mockReturnValue({
			streamMessage: vi.fn(),
			submitApprovalDecision: vi.fn(),
			isStreaming: true,
			pendingApproval: null,
		});

		render(<CommandCenterChat {...defaultProps} />);

		// Quick action cards should NOT be visible
		expect(screen.queryByText("Conciliar banco")).not.toBeInTheDocument();
		expect(screen.queryByText("Chat Fiscal")).not.toBeInTheDocument();
	});

	// ── Case badge ───────────────────────────────────────────────────────────

	it('shows "No case selected" when no active case is selected', () => {
		render(<CommandCenterChat {...defaultProps} />);

		expect(screen.getByText("Sin caso seleccionado")).toBeInTheDocument();
	});

	it("displays active case badge with title and status when a matching case is selected", () => {
		render(
			<CommandCenterChat
				{...defaultProps}
				cases={mockCases}
				selectedCaseId="case-1"
			/>,
		);

		// Case title visible
		expect(
			screen.getByText("Cierre Mensual Junio 2026"),
		).toBeInTheDocument();
		// Status badge
		expect(screen.getByText("Abierto")).toBeInTheDocument();
		// Change button
		expect(screen.getByText("Cambiar")).toBeInTheDocument();
	});

	it("updates badge when selectedCaseId changes to a different case", () => {
		const { rerender } = render(
			<CommandCenterChat
				{...defaultProps}
				cases={mockCases}
				selectedCaseId="case-1"
			/>,
		);

		expect(
			screen.getByText("Cierre Mensual Junio 2026"),
		).toBeInTheDocument();

		rerender(
			<CommandCenterChat
				{...defaultProps}
				cases={mockCases}
				selectedCaseId="case-2"
			/>,
		);

		expect(screen.getByText("Revisión IGV Julio")).toBeInTheDocument();
		expect(screen.getByText("En revisión")).toBeInTheDocument();
	});

	// ── Action buttons ───────────────────────────────────────────────────────

	it("disables Run Agent, Upload, and Approval buttons when no case is selected", () => {
		render(<CommandCenterChat {...defaultProps} />);

		// Run Agent
		const runAgent = screen.getByRole("button", {
			name: "Ejecutar agente fiscal",
		});
		expect(runAgent).toBeDisabled();

		// Upload
		const upload = screen.getByRole("button", {
			name: "Adjuntar evidencia",
		});
		expect(upload).toBeDisabled();

		// Approval
		const approval = screen.getByRole("button", {
			name: "Solicitar aprobación",
		});
		expect(approval).toBeDisabled();

		// New Case is never disabled
		const newCase = screen.getByRole("button", {
			name: "Crear nuevo caso fiscal",
		});
		expect(newCase).not.toBeDisabled();
	});

	it("enables Run Agent, Upload, and Approval buttons when a case is selected and not busy", () => {
		render(
			<CommandCenterChat
				{...defaultProps}
				cases={mockCases}
				selectedCaseId="case-1"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Ejecutar agente fiscal" }),
		).not.toBeDisabled();

		expect(
			screen.getByRole("button", { name: "Adjuntar evidencia" }),
		).not.toBeDisabled();

		expect(
			screen.getByRole("button", { name: "Solicitar aprobación" }),
		).not.toBeDisabled();
	});

	it("re-disables Run Agent and Approval when isBusy is true", () => {
		render(
			<CommandCenterChat
				{...defaultProps}
				cases={mockCases}
				selectedCaseId="case-1"
				isBusy={true}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Ejecutar agente fiscal" }),
		).toBeDisabled();

		expect(
			screen.getByRole("button", { name: "Solicitar aprobación" }),
		).toBeDisabled();
	});

	// ── Agent selector ───────────────────────────────────────────────────────

	it("renders agent selector with all 6 fiscal agent options", () => {
		render(<CommandCenterChat {...defaultProps} />);

		const select = screen.getByLabelText("Seleccionar agente");
		expect(select).toBeInTheDocument();
		expect(select).toHaveValue("LEDGER_AGENT");

		const options = Array.from(
			select.querySelectorAll("option"),
		).map((opt) => opt.value);
		expect(options).toEqual([
			"LEDGER_AGENT",
			"SIRE_AGENT",
			"CPE_AGENT",
			"CONCILIATION_AGENT",
			"FISCAL_REVIEWER_AGENT",
			"EVIDENCE_AGENT",
		]);
	});

	it("calls onSelectedAgentChange when a different agent is selected", async () => {
		const onSelectedAgentChange = vi.fn();
		render(
			<CommandCenterChat
				{...defaultProps}
				onSelectedAgentChange={onSelectedAgentChange}
			/>,
		);

		const select = screen.getByLabelText("Seleccionar agente");
		fireEvent.change(select, { target: { value: "SIRE_AGENT" } });

		expect(onSelectedAgentChange).toHaveBeenCalledWith("SIRE_AGENT");
	});

	// ── Density toggles ──────────────────────────────────────────────────────

	it("renders 3 density toggle buttons with Detalle active by default", () => {
		render(<CommandCenterChat {...defaultProps} />);

		expect(screen.getByTitle("Compacto")).toBeInTheDocument();
		expect(screen.getByTitle("Detalle")).toBeInTheDocument();
		expect(screen.getByTitle("Números")).toBeInTheDocument();

		// Detalle should have the active class
		const detalle = screen.getByTitle("Detalle");
		expect(detalle.className).toContain("bg-[var(--color-info)]");

		// Compacto should NOT have the active class
		const compacto = screen.getByTitle("Compacto");
		expect(compacto.className).not.toContain("bg-[var(--color-info)]");
	});

	// ── Input bar ────────────────────────────────────────────────────────────

	it("renders input bar with text input, paperclip and send button", () => {
		render(<CommandCenterChat {...defaultProps} />);

		// Text input
		expect(
			screen.getByPlaceholderText(/Escribí un comando fiscal/),
		).toBeInTheDocument();

		// Paperclip (hidden file input + trigger button)
		expect(
			screen.getByLabelText("Adjuntar archivos"),
		).toBeInTheDocument();

		// Send button
		expect(screen.getByTestId("lucide-sendhorizontal")).toBeInTheDocument();
		// The wrapping <button> from Button component
		const sendButton = screen.getByTestId("ui-button");
		expect(sendButton).toBeInTheDocument();
		expect(sendButton).toBeDisabled(); // no text, no files → disabled
	});

	it("enables send button when text is entered", async () => {
		const user = userEvent.setup();
		render(<CommandCenterChat {...defaultProps} />);

		const input = screen.getByPlaceholderText(/Escribí un comando fiscal/);
		const sendButton = screen.getByTestId("ui-button");

		expect(sendButton).toBeDisabled();

		await user.type(input, "test message");
		expect(sendButton).not.toBeDisabled();
	});

	// ── Streaming indicator ──────────────────────────────────────────────────

	it("shows streaming indicator with spinner while agent is processing", () => {
		mockUseCognitiveStream.mockReturnValue({
			streamMessage: vi.fn(),
			submitApprovalDecision: vi.fn(),
			isStreaming: true,
			pendingApproval: null,
		});

		render(<CommandCenterChat {...defaultProps} />);

		expect(
			screen.getByText("El agente está procesando..."),
		).toBeInTheDocument();
		// Spinner icon present
		expect(screen.getByTestId("lucide-loader2")).toBeInTheDocument();
	});

	it("hides streaming indicator when not streaming", () => {
		// default: isStreaming === false
		render(<CommandCenterChat {...defaultProps} />);

		expect(
			screen.queryByText("El agente está procesando..."),
		).not.toBeInTheDocument();
	});

	// ── Approval UI ──────────────────────────────────────────────────────────

	it("renders approval UI with Aprobar and Denegar buttons when pendingApproval exists", () => {
		mockUseChatHistory.mockReturnValue({
			messages: [messageFixture()],
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});
		mockUseCognitiveStream.mockReturnValue({
			streamMessage: vi.fn(),
			submitApprovalDecision: vi.fn(),
			isStreaming: false,
			pendingApproval: {
				key: "submit_adjustment",
				name: "submit_adjustment",
				args: { amount: 1500.5 },
			},
		});

		render(<CommandCenterChat {...defaultProps} />);

		expect(screen.getByText("Aprobación requerida")).toBeInTheDocument();
		expect(screen.getByText("submit_adjustment")).toBeInTheDocument();
		expect(screen.getByText("Aprobar")).toBeInTheDocument();
		expect(screen.getByText("Denegar")).toBeInTheDocument();
	});

	it("calls submitApprovalDecision with true when Aprobar is clicked", async () => {
		const submitApprovalDecision = vi.fn();
		mockUseChatHistory.mockReturnValue({
			messages: [messageFixture()],
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});
		mockUseCognitiveStream.mockReturnValue({
			streamMessage: vi.fn(),
			submitApprovalDecision,
			isStreaming: false,
			pendingApproval: {
				key: "test_approval",
				name: "test_approval",
			},
		});

		render(<CommandCenterChat {...defaultProps} />);

		await userEvent.click(screen.getByText("Aprobar"));
		expect(submitApprovalDecision).toHaveBeenCalledWith(
			expect.objectContaining({ key: "test_approval" }),
			true,
		);
	});

	it("calls submitApprovalDecision with false when Denegar is clicked", async () => {
		const submitApprovalDecision = vi.fn();
		mockUseChatHistory.mockReturnValue({
			messages: [messageFixture()],
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});
		mockUseCognitiveStream.mockReturnValue({
			streamMessage: vi.fn(),
			submitApprovalDecision,
			isStreaming: false,
			pendingApproval: {
				key: "test_approval",
				name: "test_approval",
			},
		});

		render(<CommandCenterChat {...defaultProps} />);

		await userEvent.click(screen.getByText("Denegar"));
		expect(submitApprovalDecision).toHaveBeenCalledWith(
			expect.objectContaining({ key: "test_approval" }),
			false,
			expect.objectContaining({ reason: expect.any(String) }),
		);
	});

	// ── Message bubbles ──────────────────────────────────────────────────────

	it("renders user and assistant messages with role-based styling", () => {
		mockUseChatHistory.mockReturnValue({
			messages: mockMessages,
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});

		render(<CommandCenterChat {...defaultProps} />);

		// User message
		expect(
			screen.getByText("Analizá el riesgo fiscal del período"),
		).toBeInTheDocument();

		// Assistant message
		expect(
			screen.getByText(
				"He completado el análisis de riesgo. Se encontraron 3 anomalías.",
			),
		).toBeInTheDocument();

		// No empty state
		expect(screen.queryByText("Chat Fiscal")).not.toBeInTheDocument();
	});

	it("renders artifacts inside assistant messages when present", () => {
		const messagesWithArtifacts = [
			messageFixture({
				id: "asst-1",
				role: "assistant",
				content: "Aquí está el análisis:",
				timestamp: new Date("2026-06-01T10:00:05Z"),
			}),
		];
		messagesWithArtifacts[0].artifacts = [
			{
				id: "art-1",
				title: "Sheet Diff Report",
				type: "sheet_diff",
				payload: {
					command: "diff",
					sourceName: "Banco Nación",
					acceptShortcut: "Ctrl+Enter",
					rows: [],
					summary: { total: 10, updated: 3, flagged: 1 },
				},
			},
		];

		mockUseChatHistory.mockReturnValue({
			messages: messagesWithArtifacts,
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});

		render(<CommandCenterChat {...defaultProps} />);

		const collapsible = screen.getByTestId("artifact-collapsible");
		expect(collapsible).toBeInTheDocument();
		expect(collapsible).toHaveAttribute("data-artifact-id", "art-1");
		// Default density is "detail"
		expect(collapsible).toHaveAttribute("data-density", "detail");
	});

	// ── /compacto command ────────────────────────────────────────────────────

	it("changes density mode to compact when /compacto command is entered", async () => {
		const user = userEvent.setup();

		// Give at least one message so the message area is rendered,
		// which makes ArtifactCollapsible visible for density check.
		mockUseChatHistory.mockReturnValue({
			messages: mockMessages,
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});

		render(<CommandCenterChat {...defaultProps} />);

		// Wait for render
		expect(
			screen.getByText("Analizá el riesgo fiscal del período"),
		).toBeInTheDocument();

		const input = screen.getByPlaceholderText(/Escribí un comando fiscal/);
		await user.type(input, "/compacto{Enter}");

		// After command, the input should be cleared
		expect(input).toHaveValue("");

		// The Compacto button should now be active
		const compactoBtn = screen.getByTitle("Compacto");
		expect(compactoBtn.className).toContain("bg-[var(--color-info)]");

		// Detalle should no longer be active
		const detalleBtn = screen.getByTitle("Detalle");
		expect(detalleBtn.className).not.toContain("bg-[var(--color-info)]");
	});

	it("changes density mode to numbers-only when /numeros command is entered", async () => {
		const user = userEvent.setup();

		mockUseChatHistory.mockReturnValue({
			messages: mockMessages,
			appendMessage: vi.fn(),
			updateMessage: vi.fn(),
			setMessages: vi.fn(),
			clearHistory: vi.fn(),
		});

		render(<CommandCenterChat {...defaultProps} />);

		const input = screen.getByPlaceholderText(/Escribí un comando fiscal/);
		await user.type(input, "/numeros{Enter}");

		const numerosBtn = screen.getByTitle("Números");
		expect(numerosBtn.className).toContain("bg-[var(--color-info)]");
	});

	// ── File upload ──────────────────────────────────────────────────────────

	it("shows file chip after selecting a file via the upload input", () => {
		render(<CommandCenterChat {...defaultProps} />);

		// Hidden file input
		const fileInput = screen.getByLabelText("Seleccionar archivos");
		expect(fileInput).toBeInTheDocument();

		// Simulate file selection
		const file = new File(["test content"], "reporte.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(fileInput, { target: { files: [file] } });

		// File chip should appear
		expect(screen.getByText("reporte.pdf")).toBeInTheDocument();
	});

	it("removes file chip when X button on the chip is clicked", () => {
		render(<CommandCenterChat {...defaultProps} />);

		const fileInput = screen.getByLabelText("Seleccionar archivos");
		const file = new File(["test"], "reporte.pdf", { type: "application/pdf" });
		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("reporte.pdf")).toBeInTheDocument();

		// Click X to remove
		const removeBtn = screen.getByLabelText("Remover reporte.pdf");
		fireEvent.click(removeBtn);

		expect(screen.queryByText("reporte.pdf")).not.toBeInTheDocument();
	});

	// ── Form toggles ─────────────────────────────────────────────────────────

	it("shows FiscalCaseCreationForm when New Case button is clicked", async () => {
		const user = userEvent.setup();
		render(<CommandCenterChat {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: "Crear nuevo caso fiscal" }));

		expect(
			screen.getByTestId("fiscal-case-creation-form"),
		).toBeInTheDocument();
	});

	it("shows EvidenceAttachmentForm when Upload button is clicked and a case is selected", async () => {
		const user = userEvent.setup();
		render(
			<CommandCenterChat
				{...defaultProps}
				cases={mockCases}
				selectedCaseId="case-1"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Adjuntar evidencia" }));

		expect(
			screen.getByTestId("evidence-attachment-form"),
		).toBeInTheDocument();
	});
});
