import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import { creditNoteTreatyClient } from "./credit-notes-treaty-client";
import type { CreateCreditNotePayload, CreditNoteListFilters, CreditNoteRecord } from "../types";

export const creditNotesApi = {
  list: async (filters: CreditNoteListFilters): Promise<CreditNoteRecord[]> => {
    const body = await unwrap(
      creditNoteTreatyClient.get({
        query: filters,
      }),
    );
    return extractOkDataOrPassthrough<CreditNoteRecord[]>(body, "credit-notes.list");
  },

  create: async (payload: CreateCreditNotePayload) => {
    return unwrap(creditNoteTreatyClient.post(payload));
  },

  getById: async (id: string) => {
    return unwrap(creditNoteTreatyClient({ id }).get());
  },

  updateStatus: async (id: string, status: string) => {
    // PATCH /api/credit-notes/:id/status
    return unwrap(creditNoteTreatyClient({ id }).status.patch({ status }));
  },

  delete: async (id: string) => {
    return unwrap(creditNoteTreatyClient({ id }).delete());
  },

  sendOse: async (id: string) => {
    // POST /api/credit-notes/:id/send-ose
    return unwrap(creditNoteTreatyClient({ id })['send-ose'].post({}));
  },

  getSummary: async (companyId: string) => {
    return unwrap(creditNoteTreatyClient.summary.get({ query: { companyId } }));
  },
};
