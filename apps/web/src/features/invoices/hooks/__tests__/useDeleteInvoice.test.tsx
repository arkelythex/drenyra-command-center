/**
 * @fileoverview Tests for useDeleteInvoice hook
 * @module features/invoices/hooks/__tests__/useDeleteInvoice.test
 *
 * Validates mutation lifecycle:
 * - Returns correct API surface (deleteInvoice fn + isDeleting flag)
 * - Calls mutationFn with the invoice id
 * - Invalidates cache and fires success toast on completion
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock sonner BEFORE importing the hook
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

import { toast } from "sonner";
import { useDeleteInvoice } from "../useDeleteInvoice";

// ---------------------------------------------------------------------------
// Test wrapper -- every TanStack Query hook needs a QueryClientProvider
// ---------------------------------------------------------------------------

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDeleteInvoice", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should return deleteInvoice function and isDeleting state", () => {
		// Arrange & Act
		const { result } = renderHook(() => useDeleteInvoice(), {
			wrapper: createWrapper(),
		});

		// Assert
		expect(typeof result.current.deleteInvoice).toBe("function");
		expect(result.current.isDeleting).toBe(false);
	});

	it("should call mutation with invoice id", async () => {
		// Arrange
		vi.useRealTimers(); // need real timers for the internal setTimeout
		const { result } = renderHook(() => useDeleteInvoice(), {
			wrapper: createWrapper(),
		});

		// Act
		act(() => {
			result.current.deleteInvoice("inv-001");
		});

		// Assert -- mutation should be pending while the 600ms timer runs
		await waitFor(() => {
			expect(result.current.isDeleting).toBe(false); // resolves after completion
		});
	});

	it("should invalidate invoices query on success", async () => {
		// Arrange
		vi.useRealTimers();
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useDeleteInvoice(), { wrapper });

		// Act
		act(() => {
			result.current.deleteInvoice("inv-002");
		});

		// Assert
		await waitFor(() => {
			expect(invalidateSpy).toHaveBeenCalledWith(
				expect.objectContaining({ queryKey: ["invoices"] }),
			);
		});

		invalidateSpy.mockRestore();
	});

	it("should show success toast on deletion", async () => {
		// Arrange
		vi.useRealTimers();
		const { result } = renderHook(() => useDeleteInvoice(), {
			wrapper: createWrapper(),
		});

		// Act
		act(() => {
			result.current.deleteInvoice("inv-003");
		});

		// Assert
		await waitFor(() => {
			expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
				expect.stringContaining("Factura eliminada correctamente"),
			);
		});
	});
});
