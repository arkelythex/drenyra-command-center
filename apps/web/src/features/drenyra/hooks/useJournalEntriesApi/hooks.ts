/**
 * TanStack Query hooks for journal entries CRUD
 *
 * Bridges the CentralBoard UI to the new /api/journal-entries endpoints
 * via Eden Treaty. Transforms between domain types and API DTOs.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

import { journalKeys, toTxRow, toPendingRow } from "./data";
import type {
	JournalEntryResponseDTO,
	JournalEntryFiltersDTO,
	JournalTxRow,
	JournalPendingRow,
} from "./types";

const _jeApi = api as unknown as Record<string, unknown>;

// ─── Hooks ──────────────────────────────────────────────────

/** Fetch journal entries with optional filters */
export function useJournalEntries(
	filters?: Partial<JournalEntryFiltersDTO>,
) {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useQuery({
		queryKey: journalKeys.list(companyId, filters),
		queryFn: async (): Promise<JournalTxRow[]> => {
			const queryParams: Record<string, string> = {};
			if (filters?.status && filters.status !== "all") {
				queryParams.status = filters.status as string;
			}
			if (filters?.dateFrom)
				queryParams.dateFrom = filters.dateFrom.toISOString();
			if (filters?.dateTo)
				queryParams.dateTo = filters.dateTo.toISOString();
			if (filters?.documentNumber)
				queryParams.documentNumber = filters.documentNumber;

			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"].index.get({
					query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
					headers: { "X-Company-Id": companyId },
				}),
			);
			const entries =
				(responseData as { success: true; data: JournalEntryResponseDTO[] } | undefined)
					?.data ?? (responseData as JournalEntryResponseDTO[] | undefined) ?? [];
			return entries.map(toTxRow);
		},
		enabled: !!companyId,
	});
}

/** Fetch a single journal entry by ID */
export function useJournalEntry(id: string | undefined) {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useQuery({
		queryKey: journalKeys.detail(companyId, id ?? ""),
		queryFn: async (): Promise<JournalEntryResponseDTO | null> => {
			if (!id) return null;
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"]({ id }).get({
					headers: { "X-Company-Id": companyId },
				}),
			);
			const envelope = responseData as
				| { success: true; data: JournalEntryResponseDTO }
				| undefined;
			return envelope?.data ?? null;
		},
		enabled: !!companyId && !!id,
	});
}

/** Create a new journal entry */
export function useCreateJournalEntry() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			input: Omit<JournalEntryResponseDTO, "id" | "entryNumber" | "status" | "createdAt" | "updatedAt" | "totalDebit" | "totalCredit" | "lines"> & {
				date: string;
				lines: Array<{
					accountId: string;
					description: string;
					debit: number;
					credit: number;
				}>;
			},
		) => {
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"].index.post({
					body: input as never,
					headers: { "X-Company-Id": companyId },
				}),
			);
			return responseData;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: journalKeys.lists(companyId),
			});
		},
	});
}

/** Update a journal entry */
export function useUpdateJournalEntry() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...body
		}: { id: string; date?: string; gloss?: string }) => {
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"]({ id }).patch({
					body: body as never,
					headers: { "X-Company-Id": companyId },
				}),
			);
			return responseData;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: journalKeys.lists(companyId),
			});
		},
	});
}

/** Delete a journal entry */
export function useDeleteJournalEntry() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"]({ id }).delete({
					headers: { "X-Company-Id": companyId },
				}),
			);
			return responseData;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: journalKeys.lists(companyId),
			});
		},
	});
}

/** Mayorizar (post) a journal entry */
export function useMayorizarJournalEntry() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"]({ id })["mayorizar"].post({
					headers: { "X-Company-Id": companyId },
				}),
			);
			return responseData;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: journalKeys.lists(companyId),
			});
		},
	});
}

/** Declarar (declare) a journal entry */
export function useDeclararJournalEntry() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"]({ id })["declarar"].post({
					headers: { "X-Company-Id": companyId },
				}),
			);
			return responseData;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: journalKeys.lists(companyId),
			});
		},
	});
}

/** Fetch pending journal entries (borrador status) for the journal pending list */
export function usePendingJournalEntries() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useQuery({
		queryKey: [...journalKeys.lists(companyId), "pending"],
		queryFn: async (): Promise<JournalPendingRow[]> => {
			const responseData = await unwrap<unknown>(
				_jeApi["journal-entries"].index.get({
					query: { status: "borrador" },
					headers: { "X-Company-Id": companyId },
				}),
			);
			const entries =
				(responseData as { success: true; data: JournalEntryResponseDTO[] } | undefined)
					?.data ?? (responseData as JournalEntryResponseDTO[] | undefined) ?? [];
			return entries.map(toPendingRow);
		},
		enabled: !!companyId,
	});
}
