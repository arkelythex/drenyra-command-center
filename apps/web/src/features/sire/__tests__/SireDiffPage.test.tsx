import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock TanStack Router Link BEFORE importing SireDiffPage
vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, className }: any) =>
		React.createElement("a", { href: to, className }, children),
}));

// Mock hooks and dependencies
vi.mock("../hooks/useSireDiff", () => ({
	useSireDiffMutation: () => ({
		mutateAsync: vi.fn(),
		isPending: false,
	}),
}));

vi.mock("../mapSireDiffResponseToArtifact", () => ({
	mapSireDiffResponseToArtifact: vi.fn(),
}));

vi.mock("@/features/artifacts/api/artifact-governance-audit.api", () => ({
	persistArtifactGovernanceEvent: vi.fn(),
}));

vi.mock("../buildExpedienteEvidenceHref", () => ({
	buildExpedienteEvidenceHref: () =>
		"/cumplimiento/expedientes?periodo=2026-03&kind=sire",
	resolveSireExpedienteKind: () => "SIRE_VENTAS",
}));

vi.mock("@/components/agentic/DiffViewerV3", () => ({
	DiffViewerV3: ({
		lines,
	}: { title: string; lines: { content: string }[] }) => (
		<div data-testid="diff-viewer-v3">
			{lines.map((l, i) => (
				<span key={i}>{l.content}</span>
			))}
		</div>
	),
}));

// Mock the workspace store
const mockStoreState = {
	period: "2026-03",
	artifactId: null as string | null,
	artifact: null as any,
	workspaceStep: "context" as const,
	decisions: {} as Record<string, string>,
	draftsByRow: {} as Record<string, unknown>,
	isLoading: false,
	error: null as string | null,
	setPeriod: vi.fn(),
	setArtifact: vi.fn(),
	setWorkspaceStep: vi.fn(),
	setDecision: vi.fn(),
	setLoading: vi.fn(),
	setError: vi.fn(),
	clearError: vi.fn(),
	reset: vi.fn(),
};

vi.mock("../stores/sire-diff-workspace.store", () => ({
	useSireDiffWorkspaceStore: (selector?: any) =>
		selector ? selector(mockStoreState) : mockStoreState,
}));

vi.mock("@/features/artifacts/components/SireDiffArtifactCard", () => ({
	SireDiffArtifactCard: ({ artifact }: any) => (
		<div data-testid="sire-diff-artifact-card">
			Artifact: {artifact?.id}
		</div>
	),
}));

import { SireDiffPage } from "../SireDiffPage";

function renderWithProviders(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
}

function resetStore() {
	Object.assign(mockStoreState, {
		period: "2026-03",
		artifactId: null,
		artifact: null,
		workspaceStep: "context" as const,
		isLoading: false,
		error: null,
		decisions: {},
		draftsByRow: {},
	});
}

beforeEach(resetStore);

describe("SireDiffPage — vocabulary (REQ-E-005)", () => {
	it('renders page title "Conciliación SIRE"', () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByText("Conciliación SIRE")).toBeDefined();
	});

	it("description uses Spanish text", () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByText(/Conciliación de tres vías/)).toBeDefined();
	});

	it('button label says "Ejecutar conciliación"', () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByText("Ejecutar conciliación")).toBeDefined();
	});
});

describe("SireDiffPage — loading state (REQ-E-004)", () => {
	beforeEach(() => {
		resetStore();
		mockStoreState.isLoading = true;
	});

	it("renders skeleton when isLoading and no artifact", () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByRole("status")).toBeDefined();
	});

	it("does not show artifact content while loading with no artifact", () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.queryByTestId("diff-viewer-v3")).toBeNull();
	});
});

describe("SireDiffPage — empty state (REQ-E-004)", () => {
	beforeEach(() => {
		resetStore();
		mockStoreState.artifactId = "artifact-123";
		mockStoreState.artifact = {
			id: "artifact-123",
			type: "sire.diff.v1",
			version: "1.0",
			status: "PREVIEW",
			metadata: {
				traceId: "t-1",
				correlationId: "c-1",
				source: "SUNAT",
				createdAt: new Date().toISOString(),
				actor: "user-1",
			},
			title: "SIRE Diff 2026-03",
			data: {
				period: "2026-03",
				currency: "PEN",
				summary: {
					matched: 50,
					mismatched: 0,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 0,
					totalDifference: 0,
				},
				rows: [],
			},
			actions: [],
		};
		mockStoreState.workspaceStep = "diff";
	});

	it("renders all-match message when zero discrepancies", () => {
		renderWithProviders(<SireDiffPage />);
		expect(
			screen.getByText("Todos los registros coinciden — sin discrepancias"),
		).toBeDefined();
	});

	it("still shows the summary with zero counts", () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByText("Coinciden: 50")).toBeDefined();
	});
});

describe("SireDiffPage — error state (REQ-E-004)", () => {
	beforeEach(() => {
		resetStore();
		mockStoreState.artifactId = "artifact-456";
		mockStoreState.artifact = {
			id: "artifact-456",
			type: "sire.diff.v1",
			version: "1.0",
			status: "PREVIEW",
			metadata: {
				traceId: "t-2",
				correlationId: "c-2",
				source: "SUNAT",
				createdAt: new Date().toISOString(),
				actor: "user-2",
			},
			title: "SIRE Diff",
			data: {
				period: "2026-03",
				currency: "PEN",
				summary: {
					matched: 10,
					mismatched: 2,
					missingOnLedger: 1,
					missingOnSunat: 0,
					critical: 3,
					totalDifference: 500,
				},
				rows: [],
			},
			actions: [],
		};
		mockStoreState.workspaceStep = "diff";
		mockStoreState.error = "Network failure while computing diff";
	});

	it("renders error message", () => {
		renderWithProviders(<SireDiffPage />);
		expect(
			screen.getByText("Network failure while computing diff"),
		).toBeDefined();
	});

	it("renders retry button", () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByText("Reintentar")).toBeDefined();
	});

	it("preserves previous artifact when error occurs", () => {
		renderWithProviders(<SireDiffPage />);
		expect(screen.getByText("Coinciden: 10")).toBeDefined();
	});
});
