import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type {
	CreateDebitNotePayload,
	DebitNoteListFilters,
	DebitNoteRecord,
} from "../types";
import { debitNoteTreatyClient } from "./debit-notes-treaty-client";

export const debitNotesApi = {
	list: async (filters: DebitNoteListFilters): Promise<DebitNoteRecord[]> => {
		const body = await unwrap(
			debitNoteTreatyClient.get({
				query: filters,
			}),
		);
		return extractOkDataOrPassthrough<DebitNoteRecord[]>(
			body,
			"debit-notes.list",
		);
	},

	create: async (payload: CreateDebitNotePayload) => {
		return unwrap(debitNoteTreatyClient.post(payload));
	},

	getById: async (id: string) => {
		return unwrap(debitNoteTreatyClient({ id }).get());
	},

	updateStatus: async (id: string, status: string) => {
		// PATCH /api/debit-notes/:id/status
		return unwrap(debitNoteTreatyClient({ id }).status.patch({ status }));
	},

	delete: async (id: string) => {
		return unwrap(debitNoteTreatyClient({ id }).delete());
	},

	sendOse: async (id: string) => {
		// POST /api/debit-notes/:id/send-ose
		return unwrap(debitNoteTreatyClient({ id })["send-ose"].post({}));
	},

	getSummary: async (companyId: string) => {
		return unwrap(debitNoteTreatyClient.summary.get({ query: { companyId } }));
	},
};
