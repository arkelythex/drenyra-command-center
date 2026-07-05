import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RightPanel } from "../RightPanel";

// ─── Hoisted mock factories ───────────────────────────────────────────────────
// vi.mock is hoisted, so we must define fns via vi.hoisted first.

const mockUseArtifactStore = vi.hoisted(() => vi.fn());
const mockUseDiffApprovalStore = vi.hoisted(() => vi.fn());
const mockUseThreadStore = vi.hoisted(() => vi.fn());
const mockUseAccountingStore = vi.hoisted(() => vi.fn());

// ─── Mock all four Zustand stores ─────────────────────────────────────────────

vi.mock("@/stores/artifact-store", () => ({
	useArtifactStore: mockUseArtifactStore,
}));

vi.mock("@/stores/diff-approval-store", () => ({
	useDiffApprovalStore: mockUseDiffApprovalStore,
}));

vi.mock("@/stores/thread-store", () => ({
	useThreadStore: mockUseThreadStore,
}));

vi.mock("@/stores/accounting-store", () => ({
	useAccountingStore: mockUseAccountingStore,
}));

// ─── Mock sub-components used by RightPanel ──────────────────────────────────
// We render simple placeholders to avoid importing their real implementations.

vi.mock(
	"@/features/cognitive-hub/components/artifacts/ArtifactRenderer",
	() => ({
		ArtifactRenderer: () => <div data-testid="artifact-renderer" />,
	}),
);

vi.mock("../ReportPreview", () => ({
	ReportPreview: () => <div data-testid="report-preview">ReportPreview</div>,
}));

vi.mock("../KpiDashboard", () => ({
	KpiDashboard: () => <div data-testid="kpi-dashboard">KpiDashboard</div>,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reset all store mocks to their default (empty) state.
 * Call this in beforeEach so every test starts clean.
 */
function setDefaultStoreState() {
	mockUseArtifactStore.mockImplementation(
		(selector: (s: Record<string, unknown>) => unknown) =>
			selector({
				pinnedArtifacts: [],
				activeArtifactId: null,
				unpinArtifact: vi.fn(),
				setActiveArtifactId: vi.fn(),
			}),
	);

	mockUseDiffApprovalStore.mockImplementation(
		(selector: (s: Record<string, unknown>) => unknown) =>
			selector({
				diffFiles: [],
			}),
	);

	mockUseThreadStore.mockImplementation(
		(selector: (s: Record<string, unknown>) => unknown) =>
			selector({
				threads: [],
				activeThreadId: null,
				renameThread: vi.fn(),
			}),
	);

	mockUseAccountingStore.mockImplementation(
		(selector: (s: Record<string, unknown>) => unknown) =>
			selector({
				financialReports: [],
			}),
	);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("RightPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setDefaultStoreState();
	});

	it("renders without crashing with default (empty) state", () => {
		render(<RightPanel />);

		// The panel heading is always rendered — just verify presence
		expect(screen.getByRole("heading")).toBeInTheDocument();

		// With all stores empty the auto-view falls back to "kpi"
		expect(screen.getByTestId("kpi-dashboard")).toBeInTheDocument();
	});

	it("shows diff view when diff files are available", () => {
		// Override the diff store to return one file
		mockUseDiffApprovalStore.mockImplementation(
			(selector: (s: Record<string, unknown>) => unknown) =>
				selector({
					diffFiles: [
						{
							fileName: "test.ts",
							oldText: "console.log('old')",
							newText: "console.log('new')",
							status: "modified",
						},
					],
				}),
		);

		render(<RightPanel />);

		// The view should auto-switch to "diff" → shows "Conciliación" in the header
		expect(screen.getByText("Conciliación")).toBeInTheDocument();

		// Should render the diff file name in the sidebar
		expect(screen.getByText("test.ts")).toBeInTheDocument();
	});

	it("shows artifact panel when artifacts are pinned", () => {
		mockUseArtifactStore.mockImplementation(
			(selector: (s: Record<string, unknown>) => unknown) =>
				selector({
					pinnedArtifacts: [
						{
							id: "a1",
							title: "Test summary",
							type: "explanation",
							content: "hello",
						},
					],
					activeArtifactId: null,
					unpinArtifact: vi.fn(),
					setActiveArtifactId: vi.fn(),
				}),
		);

		render(<RightPanel />);

		// View should auto-switch to "artifact"
		expect(screen.getByText("Previsualización")).toBeInTheDocument();
	});
});
