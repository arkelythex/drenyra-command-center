import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewCockpitPage } from "../ReviewCockpitPage";
import type { ReviewItem } from "../types/review.types";

const mocks = vi.hoisted(() => ({
	approveDocument: vi.fn(async () => undefined),
	rejectDocument: vi.fn(async () => undefined),
	retryLastAction: vi.fn(async () => undefined),
	refetch: vi.fn(async () => ({ data: undefined })),
	useReviewQueue: vi.fn(),
}));

vi.mock("../hooks/useReviewQueue", () => ({
	useReviewQueue: mocks.useReviewQueue,
}));

vi.mock("@/components/agentic/AgentHeartbeat", () => ({
	AgentHeartbeat: () => <div data-testid="agent-heartbeat">heartbeat</div>,
}));

vi.mock("@/components/agentic/ConflictDiffView", () => ({
	ConflictDiffView: () => <div data-testid="conflict-diff">diff</div>,
}));

const BASE_ITEM: ReviewItem = {
	id: "doc-1",
	filename: "factura-demo.pdf",
	date: "2026-04-18",
	amount: 1200,
	confidence: 0.92,
	status: "conflict",
	conflicts: {
		total: {
			original: 1199,
			extracted: 1200,
			isDifferent: true,
			label: "Monto total",
			confidence: 0.88,
		},
	},
};

describe("ReviewCockpitPage feature flow", () => {
	it("supports supervisor flow: select queue item and approve", async () => {
		mocks.useReviewQueue.mockReturnValue({
			data: [BASE_ITEM],
			isLoading: false,
			isError: false,
			error: null,
			refetch: mocks.refetch,
			actionError: null,
			actionInFlight: null,
			isActionPending: false,
			approveDocument: mocks.approveDocument,
			rejectDocument: mocks.rejectDocument,
			retryLastAction: mocks.retryLastAction,
		});

		render(<ReviewCockpitPage />);

		fireEvent.click(screen.getByText("factura-demo.pdf"));
		fireEvent.click(
			await screen.findByRole(
				"button",
				{ name: /Aprobar & Registrar/i },
				{ timeout: 5000 },
			),
		);

		expect(mocks.approveDocument).toHaveBeenCalledWith("doc-1");
	});

	it("renders action error with runbook and allows retry", async () => {
		mocks.useReviewQueue.mockReturnValue({
			data: [BASE_ITEM],
			isLoading: false,
			isError: false,
			error: null,
			refetch: mocks.refetch,
			actionError: {
				action: "approve",
				documentId: "doc-1",
				message: "No se pudo aprobar el documento",
				runbook: { id: "RB-DOC-001", title: "Documents fallback" },
			},
			actionInFlight: null,
			isActionPending: false,
			approveDocument: mocks.approveDocument,
			rejectDocument: mocks.rejectDocument,
			retryLastAction: mocks.retryLastAction,
		});

		render(<ReviewCockpitPage />);

		fireEvent.click(screen.getByText("factura-demo.pdf"));

		expect(
			await screen.findByText("No se pudo aprobar el documento"),
		).toBeInTheDocument();
		expect(screen.getByText(/RB-DOC-001/)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));
		expect(mocks.retryLastAction).toHaveBeenCalledTimes(1);
	});
});
