/**
 * Eden Treaty client for Debit Notes API.
 *
 * Uses dynamic access since the `debit-notes` route key is not yet in
 * the generated App type. The TreatyClientRoute type provides basic
 * structure without sacrificing type safety at the API wrapper layer.
 */

import { api } from "@/lib/api";
import type { TreatyClientRoute } from "@/lib/treaty-route-client";
import { registerClient } from "@/lib/treaty-route-client";

const debitNotesRoute = (api.api as unknown as Record<string, unknown>)[
	"debit-notes"
] as TreatyClientRoute;
export const debitNoteTreatyClient = registerClient(
	"debit-notes",
	debitNotesRoute,
);
