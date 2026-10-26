import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/use-reconciliation-workspace", () => ({
	useReconciliationWorkspace: () => ({
		activeCandidate: null,
		activeTransaction: null,
		setSelectedCandidateId: vi.fn(),
		setSelectedTransactionId: vi.fn(),
		transactions: [],
		summary: {
			reconciledRate: null,
			requiresHumanDecision: 0,
			unresolvedCount: 0,
			unresolvedExposureCents: 0,
		},
		isLoading: false,
		error: new Error("Local API unavailable"),
		hasCompany: true,
		confirmCandidate: vi.fn(),
	}),
}));
vi.mock("@/stores/agentic-shell.store", () => ({
	useAgenticShell: () => vi.fn(),
}));
vi.mock("../sections/StatementImportDialog", () => ({
	StatementImportDialog: () => null,
}));

import { ReconciliationView } from "../ReconciliationView";

describe("ReconciliationView load failure", () => {
	it("explains the failure in Spanish without leaking the raw error", () => {
		const { container } = render(<ReconciliationView />);

		expect(
			screen.getByRole("heading", {
				name: "No pudimos cargar los movimientos",
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/revisa tu conexión/i)).toBeInTheDocument();
		expect(container.textContent).not.toMatch(/Local API unavailable/);
	});
});
