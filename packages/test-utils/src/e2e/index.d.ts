import type { Page, Response } from "@playwright/test";
export declare function createAssertions(expectFn: typeof import("@playwright/test").expect): {
    assertVisible(locator: ReturnType<Page["locator"]>): Promise<void>;
    assertHidden(locator: ReturnType<Page["locator"]>): Promise<void>;
    assertText(locator: ReturnType<Page["locator"]>, text: string): Promise<void>;
};
export declare class BasePage {
    protected readonly page: Page;
    protected readonly baseUrl: string;
    constructor(page: Page, baseUrl?: string);
    navigate(path: string): Promise<void>;
    waitForSelector(selector: string, timeout?: number): Promise<void>;
    fill(selector: string, value: string): Promise<void>;
    click(selector: string): Promise<void>;
    assertUrl(expectedPath: string): Promise<void>;
    waitForApiCall(endpoint: string, timeout?: number): Promise<Response>;
    screenshot(name: string): Promise<void>;
}
export declare function authenticate(page: Page, credentials: {
    email: string;
    password: string;
}, options?: {
    baseUrl?: string;
    loginPath?: string;
    dashboardPath?: string;
    submitSelector?: string;
}): Promise<void>;
export declare function seedTestData(baseUrl: string, authToken: string, data: Record<string, unknown>): Promise<void>;
export declare function cleanupTestData(baseUrl: string, authToken: string): Promise<void>;
export declare function waitForApiCall(page: Page, endpoint: string, timeout?: number): Promise<Response>;
export declare const testCredentials: {
    readonly admin: {
        readonly email: "admin@test.drenyrafounders.com";
        readonly password: "TestP@ssw0rd!";
    };
    readonly accountant: {
        readonly email: "accountant@test.drenyrafounders.com";
        readonly password: "TestP@ssw0rd!";
    };
    readonly viewer: {
        readonly email: "viewer@test.drenyrafounders.com";
        readonly password: "TestP@ssw0rd!";
    };
};
export declare function authenticateAndSave(page: Page, credentials: {
    email: string;
    password: string;
}, storagePath?: string): Promise<void>;
//# sourceMappingURL=index.d.ts.map