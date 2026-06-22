/**
 * Eden Treaty client for Credit Notes API.
 *
 * Uses dynamic access since the `credit-notes` route key is not yet in
 * the generated App type. The TreatyClientRoute type provides basic
 * structure without sacrificing type safety at the API wrapper layer.
 *
 * The routes are verified to exist via backend integration tests.
 */

import { registerClient } from "@/lib/treaty-route-client";
import type { TreatyClientRoute } from "@/lib/treaty-route-client";
import { api } from '@/lib/api';

const creditNotesRoute = (api.api as unknown as Record<string, unknown>)['credit-notes'] as TreatyClientRoute;
export const creditNoteTreatyClient = registerClient("credit-notes", creditNotesRoute);
