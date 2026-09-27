export interface ApiResponse<T = unknown> {
    status: number;
    headers: Headers;
    data: T;
}
export declare function assertStatus(response: {
    status: number;
}, expectedStatus: number, message?: string): void;
export declare function assertSuccess(response: {
    status: number;
}, message?: string): void;
export declare function assertClientError(response: {
    status: number;
}, message?: string): void;
export declare function assertServerError(response: {
    status: number;
}, message?: string): void;
export declare function assertError(response: {
    status: number;
    data?: {
        code?: string;
        message?: string;
    };
}, expectedCode: string, message?: string): void;
export declare function assertResponseShape<T>(response: {
    data: unknown;
}, schema: {
    safeParse: (data: unknown) => {
        success: boolean;
        error?: {
            message: string;
        };
    };
}, message?: string): asserts response is {
    data: T;
};
export declare function createAuthHeaders(options: {
    token: string;
    tenantId?: string;
    contentType?: string;
}): Record<string, string>;
export declare function createTenantRequestHeaders(options: {
    token: string;
    tenantId: string;
    ruc: string;
    contentType?: string;
}): Record<string, string>;
export declare function createRequestFactory(baseUrl: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", defaultHeaders?: Record<string, string>): (body?: Record<string, unknown>, headers?: Record<string, string>) => Promise<ApiResponse>;
export declare function createEdenTestClient<TApp>(app: TApp): {
    request(path: string, options?: {
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
        query?: Record<string, string>;
    }): Promise<ApiResponse>;
};
//# sourceMappingURL=index.d.ts.map