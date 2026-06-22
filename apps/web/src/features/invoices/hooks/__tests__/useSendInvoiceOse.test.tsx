import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/features/invoices/api/invoicing.api", () => ({
	invoicingApi: {
		sendOSE: vi.fn(),
	},
}));

import { toast } from "sonner";
import { invoicingApi } from "@/features/invoices/api/invoicing.api";
import { useSendInvoiceOse } from "../useSendInvoiceOse";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	return { queryClient, wrapper };
}

describe("useSendInvoiceOse", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(invoicingApi.sendOSE).mockResolvedValue({
			invoiceId: "inv-1",
			transactionId: "tx-1",
			oseStatus: "ACCEPTED",
		});
	});

	it("sends the invoice through OSE and invalidates invoices cache", async () => {
		const { queryClient, wrapper } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useSendInvoiceOse(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-1");
		});

		expect(invoicingApi.sendOSE).toHaveBeenCalledWith("inv-1");
		expect(invalidateSpy).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ["invoices"] }),
		);
		expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
			"Factura enviada a OSE",
			expect.objectContaining({
				description: expect.stringContaining("Ticket tx-1"),
			}),
		);
	});

	it("shows an error toast when OSE submission fails", async () => {
		vi.mocked(invoicingApi.sendOSE).mockRejectedValue(new Error("COMPANY_SCOPE_REQUIRED"));
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useSendInvoiceOse(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-2").catch(() => undefined);
		});

		await waitFor(() => {
			expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
				"Selecciona una empresa activa",
				expect.objectContaining({
					description: expect.stringContaining("empresa activa"),
				}),
			);
		});
	});
});
