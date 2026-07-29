import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewCockpitPage } from "../ReviewCockpitPage";

const mocks = vi.hoisted(() => ({
	refetch: vi.fn(),
	useReviewQueue: vi.fn(),
}));

vi.mock("../hooks/useReviewQueue", () => ({ useReviewQueue: mocks.useReviewQueue }));

const baseResult = {
	data: [],
	isLoading: false,
	isError: false,
	error: null,
	refetch: mocks.refetch,
	actionError: null,
	actionInFlight: null,
	isActionPending: false,
	approveDocument: vi.fn(),
	rejectDocument: vi.fn(),
	retryLastAction: vi.fn(),
};

describe("ReviewCockpitPage", () => {
	beforeEach(() => {
		mocks.refetch.mockReset();
	});

	it("shows a loading state while the queue is loading", () => {
		mocks.useReviewQueue.mockReturnValue({ ...baseResult, isLoading: true });
		render(<ReviewCockpitPage />);
		expect(screen.getByText("Cargando cola de revisión…")).toBeInTheDocument();
	});

	it("shows an empty-state prompt when no item is selected", () => {
		mocks.useReviewQueue.mockReturnValue(baseResult);
		render(<ReviewCockpitPage />);
		expect(screen.getByText(/Seleccioná un documento/)).toBeInTheDocument();
	});

	it("renders the load error and retries on request", () => {
		mocks.useReviewQueue.mockReturnValue({
			...baseResult,
			isError: true,
			error: new Error("Servicio no disponible"),
		});
		render(<ReviewCockpitPage />);

		expect(screen.getByText("Servicio no disponible")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Reintentar carga" }));
		expect(mocks.refetch).toHaveBeenCalledOnce();
	});
});
