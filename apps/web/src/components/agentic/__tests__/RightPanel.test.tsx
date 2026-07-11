import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RightPanel } from "../RightPanel";

const mockUseArtifactStore = vi.hoisted(() => vi.fn());
const mockUseDiffApprovalStore = vi.hoisted(() => vi.fn());
const mockUseAccountingStore = vi.hoisted(() => vi.fn());
const mockUseFiscalInspector = vi.hoisted(() => vi.fn());
const mockUseAgenticLayout = vi.hoisted(() => vi.fn());
const closeInspector = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		className,
	}: {
		children: ReactNode;
		to: string;
		className?: string;
	}) => (
		<a href={to} className={className}>
			{children}
		</a>
	),
}));

vi.mock("@/stores/artifact-store", () => ({
	useArtifactStore: mockUseArtifactStore,
}));
vi.mock("@/stores/diff-approval-store", () => ({
	useDiffApprovalStore: mockUseDiffApprovalStore,
}));
vi.mock("@/stores/accounting-store", () => ({
	useAccountingStore: mockUseAccountingStore,
}));
vi.mock("@/context/FiscalInspectorContext", () => ({
	useFiscalInspector: mockUseFiscalInspector,
}));
vi.mock(
	"@/components/agentic-shell/AgenticLayout/AgenticLayout.context",
	() => ({
		useAgenticLayout: mockUseAgenticLayout,
	}),
);
vi.mock("../ReportPreview", () => ({
	ReportPreview: () => <div data-testid="report-preview" />,
}));
vi.mock("../KpiDashboard", () => ({
	KpiDashboard: () => <div data-testid="kpi-dashboard" />,
}));
vi.mock("../RightPanel.artifact-panel", () => ({
	ContextPanel: () => <div data-testid="context-panel" />,
}));
vi.mock("../RightPanel.diff-view", () => ({
	DiffView: () => <div data-testid="diff-view" />,
}));

function setDefaultState() {
	mockUseArtifactStore.mockImplementation(
		(selector: (state: { pinnedArtifacts: [] }) => unknown) =>
			selector({ pinnedArtifacts: [] }),
	);
	mockUseDiffApprovalStore.mockImplementation(
		(selector: (state: { diffFiles: [] }) => unknown) =>
			selector({ diffFiles: [] }),
	);
	mockUseAccountingStore.mockImplementation(
		(selector: (state: { financialReports: [] }) => unknown) =>
			selector({ financialReports: [] }),
	);
	mockUseFiscalInspector.mockReturnValue({
		activeAction: null,
		close: closeInspector,
	});
	mockUseAgenticLayout.mockReturnValue({
		workspace: {
			organizationId: "org-1",
			companyId: "company-1",
			period: "Julio 2026",
		},
	});
}

describe("RightPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setDefaultState();
	});

	it("keeps the artifact feed available when no inspector selection exists", () => {
		render(<RightPanel />);

		expect(
			screen.getByRole("heading", { name: "Feed de artefactos" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("kpi-dashboard")).toBeInTheDocument();
	});

	it("opens the inspector from its keyboard-accessible mode control", async () => {
		const user = userEvent.setup();
		render(<RightPanel />);

		await user.tab();
		await user.keyboard("{Enter}");

		expect(screen.getByText("Seleccioná una decisión")).toBeInTheDocument();
	});

	it("renders fiscal evidence and approval context when a Home item is selected", () => {
		mockUseFiscalInspector.mockReturnValue({
			activeAction: {
				traceId: "home-sire-mismatch",
				summary: "Resolver inconsistencias SIRE",
				status: "ANALYZED",
				riskLevel: "CRITICAL",
				impact: "Bloquea la declaración de IGV.",
				proposedBy: "agent",
				requiresApproval: true,
				module: "sire",
				companyRuc: "20123456789",
				createdAt: "2026-07-10T13:00:00.000Z",
				evidence: [
					{
						id: "sire-1",
						kind: "SIRE",
						label: "Cruce SIRE verificado",
						hash: "hash-123",
						verified: true,
						attachedAt: "2026-07-10T13:00:00.000Z",
					},
				],
			},
			close: closeInspector,
		});

		render(<RightPanel />);

		expect(
			screen.getByRole("heading", { name: "Inspector fiscal" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Resolver inconsistencias SIRE"),
		).toBeInTheDocument();
		expect(screen.getByText("Cruce SIRE verificado")).toBeInTheDocument();
		expect(screen.getByText("Período Julio 2026")).toBeInTheDocument();
		expect(screen.getByText(/Requiere aprobación humana/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Cerrar inspector" }));
		expect(closeInspector).toHaveBeenCalledOnce();
	});
});
