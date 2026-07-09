/**
 * Tests for useJournalEntriesApi hooks.
 *
 * Strategy:
 *   Mock @/lib/api-client → control Eden Treaty responses
 *   Mock @/lib/use-active-company-context → provide test companyId
 *   Use renderHook from @testing-library/react with QueryClientProvider
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/api-client", () => {
	// Sub-resource returned when api["journal-entries"]({ id }) is called
	function subResource() {
		return {
			get: (...args: unknown[]) => mockGet(...args),
			patch: (...args: unknown[]) => mockPatch(...args),
			delete: (...args: unknown[]) => mockDelete(...args),
			mayorizar: { post: (...args: unknown[]) => mockPost(...args) },
			declarar: { post: (...args: unknown[]) => mockPost(...args) },
		};
	}

	return {
		api: {
			"journal-entries": Object.assign(subResource, {
				index: {
					get: (...args: unknown[]) => mockGet(...args),
					post: (...args: unknown[]) => mockPost(...args),
				},
			}),
		},
	};
});

vi.mock("@/lib/api-helpers", () => ({
	unwrap: vi.fn(async (promise: Promise<{ data: unknown; error: unknown }>) => {
		const response = await promise;
		if ("error" in response && response.error) {
			const err = response.error;
			const message =
				typeof err === "string"
					? err
					: typeof err === "object" && err !== null && "value" in err
						? (err as { value: string }).value
						: "API Error";
			throw new Error(message);
		}
		return response.data;
	}),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: { companyId: "test-company-id" },
	}),
}));

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false },
		},
	});

	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate the Elysia ok() envelope that Eden Treaty wraps */
function okEnvelope(data: unknown) {
	return { data: { success: true, data }, error: null };
}

function errorEnvelope(error: string) {
	return { data: null, error };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useJournalEntriesApi", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("useJournalEntries", () => {
		it("fetches and maps journal entries", async () => {
			mockGet.mockResolvedValue(
				okEnvelope([
					{
						id: "je-1",
						entryNumber: "000001-2026",
						date: "2026-06-01T00:00:00.000Z",
						gloss: "Apertura",
						status: "borrador",
						lines: [
							{
								accountCode: "10",
								accountName: "Caja",
								debit: 1000,
								credit: 0,
							},
						],
						totalDebit: 1000,
						totalCredit: 1000,
					},
				]),
			);

			const { useJournalEntries } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useJournalEntries(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toHaveLength(1);
			expect(result.current.data?.[0]).toMatchObject({
				id: "je-1",
				entryNumber: "000001-2026",
				gloss: "Apertura",
				status: "borrador",
			});
		});

		it("passes filters to the API call", async () => {
			mockGet.mockResolvedValue(okEnvelope([]));

			const { useJournalEntries } = await import("../useJournalEntriesApi");
			renderHook(
				() =>
					useJournalEntries({
						status: "borrador",
						dateFrom: new Date("2026-01-01"),
						dateTo: new Date("2026-12-31"),
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => expect(mockGet).toHaveBeenCalled());

			const callArgs = mockGet.mock.calls[0][0] as {
				query?: Record<string, string>;
			};
			expect(callArgs.query?.status).toBe("borrador");
			expect(callArgs.query?.dateFrom).toBeTruthy();
		});

		it("handles empty response gracefully", async () => {
			mockGet.mockResolvedValue(okEnvelope([]));

			const { useJournalEntries } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useJournalEntries(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data).toEqual([]);
		});

		it("throws error when API returns error", async () => {
			mockGet.mockResolvedValue(errorEnvelope("API Error"));

			const { useJournalEntries } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useJournalEntries(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));
		});
	});

	describe("useJournalEntry (single)", () => {
		it("fetches a single entry by ID", async () => {
			mockGet.mockResolvedValue(
				okEnvelope({
					id: "je-1",
					entryNumber: "000001-2026",
					gloss: "Test",
					status: "borrador",
					lines: [],
				}),
			);

			const { useJournalEntry } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useJournalEntry("je-1"), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data).toBeTruthy();
		});

		it("does not fetch when id is undefined", async () => {
			const { useJournalEntry } = await import("../useJournalEntriesApi");
			renderHook(() => useJournalEntry(undefined), {
				wrapper: createWrapper(),
			});

			// Should not call the API
			await waitFor(() => {
				expect(mockGet).not.toHaveBeenCalled();
			});
		});
	});

	describe("useCreateJournalEntry", () => {
		it("calls POST with correct body", async () => {
			mockPost.mockResolvedValue(
				okEnvelope({
					id: "je-new",
					entryNumber: "000002-2026",
				}),
			);

			const { useCreateJournalEntry } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useCreateJournalEntry(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				date: "2026-06-01",
				gloss: "Test entry",
				lines: [
					{ accountId: "acc-1", description: "Debit", debit: 100, credit: 0 },
					{
						accountId: "acc-2",
						description: "Credit",
						debit: 0,
						credit: 100,
					},
				],
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockPost).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({
						date: "2026-06-01",
						gloss: "Test entry",
					}),
				}),
			);
		});
	});

	describe("useUpdateJournalEntry", () => {
		it("calls PATCH with correct id and body", async () => {
			mockPatch.mockResolvedValue(okEnvelope({ id: "je-1" }));

			const { useUpdateJournalEntry } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useUpdateJournalEntry(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ id: "je-1", gloss: "Updated" });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockPatch).toHaveBeenCalledWith({
				body: { gloss: "Updated" },
				headers: { "X-Company-Id": "test-company-id" },
			});
		});
	});

	describe("useDeleteJournalEntry", () => {
		it("calls DELETE with correct id", async () => {
			mockDelete.mockResolvedValue(okEnvelope({ deleted: true }));

			const { useDeleteJournalEntry } = await import("../useJournalEntriesApi");
			const { result } = renderHook(() => useDeleteJournalEntry(), {
				wrapper: createWrapper(),
			});

			result.current.mutate("je-1");

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockDelete).toHaveBeenCalledWith({
				headers: { "X-Company-Id": "test-company-id" },
			});
		});
	});

	describe("status mutation hooks", () => {
		it("useMayorizarJournalEntry calls POST mayorizar", async () => {
			const { useMayorizarJournalEntry } = await import(
				"../useJournalEntriesApi"
			);
			const { result } = renderHook(() => useMayorizarJournalEntry(), {
				wrapper: createWrapper(),
			});

			result.current.mutate("je-1");

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			// Sub-resource already wires mayorizar.post to mockPost
			expect(mockPost).toHaveBeenCalled();
		});
	});

	describe("usePendingJournalEntries", () => {
		it("fetches only borrador entries", async () => {
			mockGet.mockResolvedValue(
				okEnvelope([
					{
						id: "je-1",
						entryNumber: "000001-2026",
						date: "2026-06-01T00:00:00.000Z",
						gloss: "Pending entry",
						status: "borrador",
						lines: [{ accountCode: "10", accountName: "Caja" }],
						totalDebit: 500,
						totalCredit: 500,
					},
				]),
			);

			const { usePendingJournalEntries } = await import(
				"../useJournalEntriesApi"
			);
			const { result } = renderHook(() => usePendingJournalEntries(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toHaveLength(1);
			expect(result.current.data?.[0]).toMatchObject({
				status: "borrador",
				gloss: "Pending entry",
			});

			// Verify it called with status=borrador filter
			expect(mockGet).toHaveBeenCalledWith(
				expect.objectContaining({
					query: { status: "borrador" },
				}),
			);
		});
	});
});
