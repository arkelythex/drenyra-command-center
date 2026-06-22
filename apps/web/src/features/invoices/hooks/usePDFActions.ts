/**
 * PDF Actions Hooks
 * TanStack Query hooks for PDF operations
 */

import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	downloadBlobFile,
	invoicingApi,
	normalizeInvoicingError,
} from "../api/invoicing.api";

/**
 * Download invoice PDF
 */
export function useDownloadInvoicePDF(): UseMutationResult<
	{ success: true; filename: string },
	Error,
	string
> {
	return useMutation<{ success: true; filename: string }, Error, string>({
		mutationFn: async (invoiceId: string) => {
			try {
				const { blob, filename } =
					await invoicingApi.downloadInvoicePdf(invoiceId);
				downloadBlobFile(blob, filename);
				return { success: true, filename };
			} catch (error: unknown) {
				throw normalizeInvoicingError(error, "Error al descargar PDF");
			}
		},
		onSuccess: (data) => {
			toast.success("PDF descargado", {
				description: `Archivo: ${data.filename}`,
			});
		},
		onError: (error: Error) => {
			toast.error("Error al descargar PDF", {
				description: error.message,
			});
		},
	});
}

/**
 * Get PDF preview URL
 */
export function usePreviewInvoicePDF(): UseMutationResult<
	{ url: string; invoiceId: string },
	Error,
	string
> {
	return useMutation<{ url: string; invoiceId: string }, Error, string>({
		mutationFn: async (invoiceId: string) => {
			try {
				const { blob } = await invoicingApi.previewInvoicePdf(invoiceId);
				const url = window.URL.createObjectURL(blob);
				return { url, invoiceId };
			} catch (error: unknown) {
				throw normalizeInvoicingError(error, "Error al generar vista previa");
			}
		},
		onError: (error: Error) => {
			toast.error("Error al generar vista previa", {
				description: error.message,
			});
		},
	});
}
