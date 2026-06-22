/**
 * API Test Utilities
 *
 * Provides request factories, response assertions, and Eden Treaty test client
 * utilities for integration testing of ElysiaJS API endpoints.
 */

/**
 * Standard API response shape for assertions.
 */
export interface ApiResponse<T = unknown> {
	status: number;
	headers: Headers;
	data: T;
}

/**
 * Assert that an API response has the expected status code.
 *
 * @param response - API response
 * @param expectedStatus - Expected HTTP status code
 * @param message - Optional custom assertion message
 */
export function assertStatus(
	response: { status: number },
	expectedStatus: number,
	message?: string,
): void {
	const msg = message || `Expected status ${expectedStatus}`;
	if (response.status !== expectedStatus) {
		throw new Error(`${msg}, got ${response.status}`);
	}
}

/**
 * Assert that an API response is successful (2xx).
 *
 * @param response - API response
 * @param message - Optional custom assertion message
 */
export function assertSuccess(
	response: { status: number },
	message?: string,
): void {
	const msg = message || "Expected successful response (2xx)";
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`${msg}, got status ${response.status}`);
	}
}

/**
 * Assert that an API response is a client error (4xx).
 *
 * @param response - API response
 * @param message - Optional custom assertion message
 */
export function assertClientError(
	response: { status: number },
	message?: string,
): void {
	const msg = message || "Expected client error response (4xx)";
	if (response.status < 400 || response.status >= 500) {
		throw new Error(`${msg}, got status ${response.status}`);
	}
}

/**
 * Assert that an API response is a server error (5xx).
 *
 * @param response - API response
 * @param message - Optional custom assertion message
 */
export function assertServerError(
	response: { status: number },
	message?: string,
): void {
	const msg = message || "Expected server error response (5xx)";
	if (response.status < 500 || response.status >= 600) {
		throw new Error(`${msg}, got status ${response.status}`);
	}
}

/**
 * Assert that an API response contains an error object with expected properties.
 *
 * @param response - API response with data
 * @param expectedCode - Expected error code
 * @param message - Optional custom assertion message
 */
export function assertError(
	response: { status: number; data?: { code?: string; message?: string } },
	expectedCode: string,
	message?: string,
): void {
	const msg = message || `Expected error code "${expectedCode}"`;
	const actualCode = response.data?.code;
	if (actualCode !== expectedCode) {
		throw new Error(
			`${msg}, got "${actualCode}". Response: ${JSON.stringify(response.data)}`,
		);
	}
}

/**
 * Assert that an API response matches a Zod-validated shape.
 *
 * @param response - API response
 * @param schema - Zod schema to validate against
 * @param message - Optional custom assertion message
 */
export function assertResponseShape<T>(
	response: { data: unknown },
	schema: {
		safeParse: (data: unknown) => {
			success: boolean;
			error?: { message: string };
		};
	},
	message?: string,
): asserts response is { data: T } {
	const result = schema.safeParse(response.data);
	if (!result.success) {
		const msg = message || "Response does not match expected schema";
		throw new Error(`${msg}: ${result.error?.message}`);
	}
}

/**
 * Create authenticated request headers.
 *
 * @param options - Authentication options
 * @returns Headers object for authenticated requests
 */
export function createAuthHeaders(options: {
	token: string;
	tenantId?: string;
	contentType?: string;
}): Record<string, string> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${options.token}`,
		"Content-Type": options.contentType || "application/json",
	};

	if (options.tenantId) {
		headers["x-tenant-id"] = options.tenantId;
	}

	return headers;
}

/**
 * Create request headers for a specific tenant context.
 *
 * @param options - Tenant and auth options
 * @returns Headers object for tenant-scoped requests
 */
export function createTenantRequestHeaders(options: {
	token: string;
	tenantId: string;
	ruc: string;
	contentType?: string;
}): Record<string, string> {
	return {
		Authorization: `Bearer ${options.token}`,
		"x-tenant-id": options.tenantId,
		"x-tenant-ruc": options.ruc,
		"Content-Type": options.contentType || "application/json",
	};
}

/**
 * Create a test request factory for a specific endpoint.
 *
 * Usage:
 *   const createInvoice = createRequestFactory('/api/v1/invoices', 'POST', authHeaders);
 *   const response = await createInvoice({ customerId: '123', items: [...] });
 */
export function createRequestFactory(
	baseUrl: string,
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
	defaultHeaders: Record<string, string> = {},
) {
	return async function request(
		body?: Record<string, unknown>,
		headers?: Record<string, string>,
	): Promise<ApiResponse> {
		const response = await fetch(`${baseUrl}`, {
			method,
			headers: { ...defaultHeaders, ...headers },
			body: body ? JSON.stringify(body) : undefined,
		});

		let data: unknown;
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			data = await response.json();
		} else {
			data = await response.text();
		}

		return {
			status: response.status,
			headers: response.headers,
			data,
		};
	};
}

/**
 * Eden Treaty test client wrapper.
 *
 * Provides a typed client for testing ElysiaJS API endpoints with
 * automatic error handling and response assertions.
 *
 * Usage:
 *   const client = createEdenTestClient(app);
 *   const result = await client.invoices.post({ body: invoiceData });
 *   assertSuccess(result);
 */
export function createEdenTestClient<TApp>(app: TApp) {
	return {
		/**
		 * Make a test request through the Elysia app (no HTTP server needed).
		 *
		 * @param path - API path
		 * @param options - Request options
		 * @returns API response
		 */
		async request(
			path: string,
			options: {
				method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
				body?: Record<string, unknown>;
				headers?: Record<string, string>;
				query?: Record<string, string>;
			} = {},
		): Promise<ApiResponse> {
			const method = options.method || "GET";
			const headers = new Headers(options.headers);

			if (options.body && !headers.has("Content-Type")) {
				headers.set("Content-Type", "application/json");
			}

			// Build URL with query params
			const url = new URL(path, "http://localhost:3001");
			if (options.query) {
				Object.entries(options.query).forEach(([key, value]) => {
					url.searchParams.set(key, value);
				});
			}

			const request = new Request(url, {
				method,
				headers,
				body: options.body ? JSON.stringify(options.body) : undefined,
			});

			const response = await (
				app as { handle: (req: Request) => Promise<Response> }
			).handle(request);

			let data: unknown;
			const contentType = response.headers.get("content-type");
			if (contentType?.includes("application/json")) {
				data = await response.json();
			} else {
				data = await response.text();
			}

			return {
				status: response.status,
				headers: response.headers,
				data,
			};
		},
	};
}
