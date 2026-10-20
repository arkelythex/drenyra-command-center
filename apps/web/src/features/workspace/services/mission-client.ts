/**
 * HTTP client for `/api/v1/missions`.
 *
 * Same transport as the rest of the app (`lib/api-client`): the session cookie
 * (`credentials: "include"`) plus the active company's tenant headers. The API
 * wraps every answer in `{ success, data }` / `{ success, error }`; this client
 * returns `data` and turns errors into a `HarnessError`.
 */

import { resolveRequestHeaders } from "@/lib/api-client";
import { runtimeConfig } from "@/lib/runtime-config";
import { mapAPIErrorToHarnessError } from "./mission-errors";

export async function missionFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${runtimeConfig.apiUrl}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...resolveRequestHeaders(),
			...(options.headers as Record<string, string> | undefined),
		},
	});

	const body: unknown = await response.json().catch(() => ({}));
	const envelope = body as { success?: unknown; data?: unknown };

	if (!response.ok || envelope.success === false) {
		throw mapAPIErrorToHarnessError(response.status, body);
	}

	return ("data" in envelope ? envelope.data : body) as T;
}
