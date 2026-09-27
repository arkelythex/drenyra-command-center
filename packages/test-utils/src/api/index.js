export function assertStatus(response, expectedStatus, message) {
    const msg = message || `Expected status ${expectedStatus}`;
    if (response.status !== expectedStatus) {
        throw new Error(`${msg}, got ${response.status}`);
    }
}
export function assertSuccess(response, message) {
    const msg = message || "Expected successful response (2xx)";
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`${msg}, got status ${response.status}`);
    }
}
export function assertClientError(response, message) {
    const msg = message || "Expected client error response (4xx)";
    if (response.status < 400 || response.status >= 500) {
        throw new Error(`${msg}, got status ${response.status}`);
    }
}
export function assertServerError(response, message) {
    const msg = message || "Expected server error response (5xx)";
    if (response.status < 500 || response.status >= 600) {
        throw new Error(`${msg}, got status ${response.status}`);
    }
}
export function assertError(response, expectedCode, message) {
    const msg = message || `Expected error code "${expectedCode}"`;
    const actualCode = response.data?.code;
    if (actualCode !== expectedCode) {
        throw new Error(`${msg}, got "${actualCode}". Response: ${JSON.stringify(response.data)}`);
    }
}
export function assertResponseShape(response, schema, message) {
    const result = schema.safeParse(response.data);
    if (!result.success) {
        const msg = message || "Response does not match expected schema";
        throw new Error(`${msg}: ${result.error?.message}`);
    }
}
export function createAuthHeaders(options) {
    const headers = {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": options.contentType || "application/json",
    };
    if (options.tenantId) {
        headers["x-tenant-id"] = options.tenantId;
    }
    return headers;
}
export function createTenantRequestHeaders(options) {
    return {
        Authorization: `Bearer ${options.token}`,
        "x-tenant-id": options.tenantId,
        "x-tenant-ruc": options.ruc,
        "Content-Type": options.contentType || "application/json",
    };
}
export function createRequestFactory(baseUrl, method, defaultHeaders = {}) {
    return async function request(body, headers) {
        const response = await fetch(`${baseUrl}`, {
            method,
            headers: { ...defaultHeaders, ...headers },
            body: body ? JSON.stringify(body) : undefined,
        });
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            data = await response.json();
        }
        else {
            data = await response.text();
        }
        return {
            status: response.status,
            headers: response.headers,
            data,
        };
    };
}
export function createEdenTestClient(app) {
    return {
        async request(path, options = {}) {
            const method = options.method || "GET";
            const headers = new Headers(options.headers);
            if (options.body && !headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
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
            const response = await app.handle(request);
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                data = await response.json();
            }
            else {
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
//# sourceMappingURL=index.js.map