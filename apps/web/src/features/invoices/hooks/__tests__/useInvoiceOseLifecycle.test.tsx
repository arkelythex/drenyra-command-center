import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { successMock, errorMock } = vi.hoisted(() => ({
	successMock: vi.fn(),
	errorMock: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: successMock,
		error: errorMock,
	},
}));

vi.mock("../../api/invoicing.api", () => ({
	invoicingApi: {
		getOseLifecycleByInvoice: vi.fn(),
	},
}));

import { invoicingApi } from "../../api/invoicing.api";
import { useInvoiceOseLifecycle } from "../useInvoiceOseLifecycle";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return {
		wrapper: ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	};
}

describe("useInvoiceOseLifecycle", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads lifecycle and emits a success toast", async () => {
		vi.mocked(invoicingApi.getOseLifecycleByInvoice).mockResolvedValue({
			transactionId: "tx-1",
			invoiceNumber: "F001-1",
			currentStatus: "ACCEPTED",
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useInvoiceOseLifecycle(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-1");
		});

		expect(invoicingApi.getOseLifecycleByInvoice).toHaveBeenCalledWith("inv-1");
		expect(successMock).toHaveBeenCalledWith("Trazabilidad OSE actualizada", {
			description: "ACCEPTED · tx-1",
		});
	});

	it("emits an error toast when lifecycle retrieval fails", async () => {
		vi.mocked(invoicingApi.getOseLifecycleByInvoice).mockRejectedValue(
			new Error("trace unavailable"),
		);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useInvoiceOseLifecycle(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-2").catch(() => undefined);
		});

		await waitFor(() => {
			expect(errorMock).toHaveBeenCalledWith(
				"No se pudo cargar la trazabilidad OSE",
				{
					description: "trace unavailable",
				},
			);
		});
	});

	it("maps backend scope errors to a contextual Spanish toast", async () => {
		vi.mocked(invoicingApi.getOseLifecycleByInvoice).mockRejectedValue(
			new Error("COMPANY_SCOPE_MISMATCH"),
		);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useInvoiceOseLifecycle(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-3").catch(() => undefined);
		});

		await waitFor(() => {
			expect(errorMock).toHaveBeenCalledWith(
				"La factura pertenece a otra empresa",
				expect.objectContaining({
					description: expect.stringContaining("empresa distinta"),
				}),
			);
		});
	});
});
