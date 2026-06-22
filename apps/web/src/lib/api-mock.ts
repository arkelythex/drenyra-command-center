let apiMockInstalled = false;

/**
 * Installs the local-only API mock layer.
 *
 * This must be called explicitly from a DEV-only, opt-in path. Keeping the
 * mock behind an installer prevents production bundles from silently
 * monkey-patching `window.fetch` just because this module was imported.
 */
export function installApiMock(): void {
	if (typeof window === "undefined" || apiMockInstalled) return;

	apiMockInstalled = true;
	const originalFetch = window.fetch;
	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === "string" ? input : input.toString();

		// Solo mockear llamadas a /api que fallen en modo local explícito.
		if (url.includes("/api/") && init?.method !== "OPTIONS") {
			try {
				const response = await originalFetch(input, init);
				if (!response.ok) {
					// Devolver datos mock según el endpoint
					return new Response(JSON.stringify(getMockData(url)), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}
				return response;
			} catch {
				return new Response(JSON.stringify(getMockData(url)), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
		}
		return originalFetch(input, init);
	};
}

function getMockData(url: string): unknown {
	if (url.includes("/banking/accounts")) {
		return { data: [] };
	}
	if (url.includes("/invoices")) {
		return { data: [] };
	}
	if (url.includes("/inventory")) {
		return { data: [] };
	}
	if (url.includes("/dashboard")) {
		return { data: { kpis: [], charts: [] } };
	}
	return { data: null };
}
