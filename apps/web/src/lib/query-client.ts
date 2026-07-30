// Stub — Query client
import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | null = null;

export function createAppQueryClient() {
	client = new QueryClient({
		defaultOptions: {
			queries: { staleTime: 30_000, retry: 1 },
		},
	});
	return client;
}

export function getAppQueryClient() {
	if (!client) client = createAppQueryClient();
	return client;
}
