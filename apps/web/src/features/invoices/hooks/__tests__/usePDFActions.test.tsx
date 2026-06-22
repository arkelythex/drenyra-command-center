import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/features/invoices/api/invoicing.api", () => ({
	invoicingApi: {
		downloadInvoicePdf: vi.fn(),
		previewInvoicePdf: vi.fn(),
	},
	downloadBlobFile: vi.fn(),
	normalizeInvoicingError: vi.fn((error: unknown, fallbackMessage: string) => {
		if (error instanceof Error) {
			return error;
		}

		return new Error(fallbackMessage);
	}),
}));

import { toast } from "sonner";
import {
	downloadBlobFile,
	invoicingApi,
} from "@/features/invoices/api/invoicing.api";
import { useDownloadInvoicePDF, usePreviewInvoicePDF } from "../usePDFActions";

function createWrapper(): ({
	children,
}: {
	children: ReactNode;
}) => ReactElement {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("usePDFActions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(invoicingApi.downloadInvoicePdf).mockResolvedValue({
			blob: new Blob(["pdf"]),
			filename: "Factura_inv-1.pdf",
		});
		vi.mocked(invoicingApi.previewInvoicePdf).mockResolvedValue({
			blob: new Blob(["preview"]),
			filename: "Factura_inv-1.pdf",
		});
	});

	it("downloads invoice PDF and reports success toast", async () => {
		const wrapper = createWrapper();
		const { result } = renderHook(() => useDownloadInvoicePDF(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-1");
		});

		expect(invoicingApi.downloadInvoicePdf).toHaveBeenCalledWith("inv-1");
		expect(downloadBlobFile).toHaveBeenCalledTimes(1);
		expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
			"PDF descargado",
			expect.objectContaining({
				description: expect.stringContaining("Factura_inv-1.pdf"),
			}),
		);
	});

	it("shows download error toast when download fails", async () => {
		vi.mocked(invoicingApi.downloadInvoicePdf).mockRejectedValue(
			new Error("download failed"),
		);
		const wrapper = createWrapper();
		const { result } = renderHook(() => useDownloadInvoicePDF(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("inv-2").catch(() => undefined);
		});

		await waitFor(() => {
			expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
				"Error al descargar PDF",
				expect.objectContaining({ description: "download failed" }),
			);
		});
	});

	it("creates preview URL from preview PDF blob", async () => {
		const objectUrlSpy = vi
			.spyOn(URL, "createObjectURL")
			.mockReturnValue("blob:preview-url");
		const wrapper = createWrapper();
		const { result } = renderHook(() => usePreviewInvoicePDF(), { wrapper });

		let previewResult: { url: string; invoiceId: string } | undefined;
		await act(async () => {
			previewResult = await result.current.mutateAsync("inv-3");
		});

		expect(invoicingApi.previewInvoicePdf).toHaveBeenCalledWith("inv-3");
		expect(objectUrlSpy).toHaveBeenCalledTimes(1);
		expect(previewResult).toEqual({
			url: "blob:preview-url",
			invoiceId: "inv-3",
		});

		objectUrlSpy.mockRestore();
	});
});
