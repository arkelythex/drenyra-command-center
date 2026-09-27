export function createAssertions(expectFn) {
    return {
        async assertVisible(locator) {
            await expectFn(locator).toBeVisible();
        },
        async assertHidden(locator) {
            await expectFn(locator).toBeHidden();
        },
        async assertText(locator, text) {
            await expectFn(locator).toContainText(text);
        },
    };
}
export class BasePage {
    page;
    baseUrl;
    constructor(page, baseUrl = process.env.BASE_URL ||
        "http://localhost:5173") {
        this.page = page;
        this.baseUrl = baseUrl;
    }
    async navigate(path) {
        await this.page.goto(`${this.baseUrl}${path}`);
    }
    async waitForSelector(selector, timeout) {
        await this.page.waitForSelector(selector, { state: "visible", timeout });
    }
    async fill(selector, value) {
        await this.page.fill(selector, value);
    }
    async click(selector) {
        await this.page.click(selector);
    }
    async assertUrl(expectedPath) {
        const url = this.page.url();
        if (!url.includes(expectedPath)) {
            throw new Error(`Expected URL to contain "${expectedPath}", got "${url}"`);
        }
    }
    async waitForApiCall(endpoint, timeout) {
        return this.page.waitForResponse((response) => response.url().includes(endpoint), { timeout });
    }
    async screenshot(name) {
        await this.page.screenshot({
            path: `test-results/screenshots/${name}-${Date.now()}.png`,
        });
    }
}
export async function authenticate(page, credentials, options) {
    const baseUrl = options?.baseUrl || process.env.BASE_URL || "http://localhost:5173";
    const loginPath = options?.loginPath || "/auth/login";
    const dashboardPath = options?.dashboardPath || "/dashboard";
    const submitSelector = options?.submitSelector || 'button[type="submit"]';
    await page.goto(`${baseUrl}${loginPath}`);
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.click(submitSelector);
    await page.waitForURL(`**${dashboardPath}`, { timeout: 10000 });
}
export async function seedTestData(baseUrl, authToken, data) {
    const response = await fetch(`${baseUrl}/api/v1/test/seed`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to seed test data: ${response.status} ${response.statusText}`);
    }
}
export async function cleanupTestData(baseUrl, authToken) {
    const response = await fetch(`${baseUrl}/api/v1/test/cleanup`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to cleanup test data: ${response.status} ${response.statusText}`);
    }
}
export async function waitForApiCall(page, endpoint, timeout) {
    return page.waitForResponse((response) => response.url().includes(endpoint), { timeout });
}
export const testCredentials = {
    admin: {
        email: "admin@test.drenyrafounders.com",
        password: "TestP@ssw0rd!",
    },
    accountant: {
        email: "accountant@test.drenyrafounders.com",
        password: "TestP@ssw0rd!",
    },
    viewer: {
        email: "viewer@test.drenyrafounders.com",
        password: "TestP@ssw0rd!",
    },
};
export async function authenticateAndSave(page, credentials, storagePath = "test-results/.auth/user.json") {
    await authenticate(page, credentials);
    await page.context().storageState({ path: storagePath });
}
//# sourceMappingURL=index.js.map