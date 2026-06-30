/**
 * E2E Test Helpers for Playwright
 *
 * Provides page object base class, authentication helpers,
 * and shared E2E utilities for end-to-end testing.
 */
import type { Page, Response } from "@playwright/test";

/**
 * Assertion helpers that work with Playwright's expect.
 * Pass the `expect` function from @playwright/test.
 */
export function createAssertions(
	expectFn: typeof import("@playwright/test").expect,
) {
	return {
		async assertVisible(locator: ReturnType<Page["locator"]>): Promise<void> {
			await expectFn(locator).toBeVisible();
		},
		async assertHidden(locator: ReturnType<Page["locator"]>): Promise<void> {
			await expectFn(locator).toBeHidden();
		},
		async assertText(
			locator: ReturnType<Page["locator"]>,
			text: string,
		): Promise<void> {
			await expectFn(locator).toContainText(text);
		},
	};
}

/**
 * Base Page Object class for Playwright E2E tests.
 *
 * Extends this class to create page-specific page objects.
 *
 * Usage:
 *   class LoginPage extends BasePage {
 *     async login(email: string, password: string) {
 *       await this.fill('#email', email);
 *       await this.fill('#password', password);
 *       await this.click('button[type="submit"]');
 *     }
 *   }
 */
export class BasePage {
	constructor(
		protected readonly page: Page,
		protected readonly baseUrl: string = process.env.BASE_URL ||
			"http://localhost:5173",
	) {}

	/**
	 * Navigate to a relative path within the app.
	 */
	async navigate(path: string): Promise<void> {
		await this.page.goto(`${this.baseUrl}${path}`);
	}

	/**
	 * Wait for a selector to be visible.
	 */
	async waitForSelector(selector: string, timeout?: number): Promise<void> {
		await this.page.waitForSelector(selector, { state: "visible", timeout });
	}

	/**
	 * Fill an input field.
	 */
	async fill(selector: string, value: string): Promise<void> {
		await this.page.fill(selector, value);
	}

	/**
	 * Click a button or element.
	 */
	async click(selector: string): Promise<void> {
		await this.page.click(selector);
	}

	/**
	 * Assert the current URL contains the expected path.
	 */
	async assertUrl(expectedPath: string): Promise<void> {
		const url = this.page.url();
		if (!url.includes(expectedPath)) {
			throw new Error(
				`Expected URL to contain "${expectedPath}", got "${url}"`,
			);
		}
	}

	/**
	 * Wait for an API call to complete.
	 */
	async waitForApiCall(endpoint: string, timeout?: number): Promise<Response> {
		return this.page.waitForResponse(
			(response: Response) => response.url().includes(endpoint),
			{ timeout },
		);
	}

	/**
	 * Take a screenshot for debugging.
	 */
	async screenshot(name: string): Promise<void> {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}-${Date.now()}.png`,
		});
	}
}

/**
 * Authentication helper for E2E tests.
 *
 * Logs in a user through the UI and waits for redirect.
 *
 * @param page - Playwright page instance
 * @param credentials - User credentials
 * @param options - Optional configuration
 */
export async function authenticate(
	page: Page,
	credentials: { email: string; password: string },
	options?: {
		baseUrl?: string;
		loginPath?: string;
		dashboardPath?: string;
		submitSelector?: string;
	},
): Promise<void> {
	const baseUrl =
		options?.baseUrl || process.env.BASE_URL || "http://localhost:5173";
	const loginPath = options?.loginPath || "/auth/login";
	const dashboardPath = options?.dashboardPath || "/dashboard";
	const submitSelector = options?.submitSelector || 'button[type="submit"]';

	await page.goto(`${baseUrl}${loginPath}`);
	await page.fill('input[name="email"]', credentials.email);
	await page.fill('input[name="password"]', credentials.password);
	await page.click(submitSelector);

	// Wait for navigation to dashboard
	await page.waitForURL(`**${dashboardPath}`, { timeout: 10000 });
}

/**
 * Seed test data via API before E2E test.
 *
 * @param baseUrl - Base URL of the app
 * @param authToken - Auth token for seeding requests
 * @param data - Seed data payload
 */
export async function seedTestData(
	baseUrl: string,
	authToken: string,
	data: Record<string, unknown>,
): Promise<void> {
	const response = await fetch(`${baseUrl}/api/v1/test/seed`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${authToken}`,
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to seed test data: ${response.status} ${response.statusText}`,
		);
	}
}

/**
 * Clean up test data via API after E2E test.
 *
 * @param baseUrl - Base URL of the app
 * @param authToken - Auth token for cleanup requests
 */
export async function cleanupTestData(
	baseUrl: string,
	authToken: string,
): Promise<void> {
	const response = await fetch(`${baseUrl}/api/v1/test/cleanup`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to cleanup test data: ${response.status} ${response.statusText}`,
		);
	}
}

/**
 * Wait for an API call to complete during E2E test.
 *
 * @param page - Playwright page instance
 * @param endpoint - URL pattern to match
 * @param timeout - Maximum wait time in ms
 * @returns The matched response
 */
export async function waitForApiCall(
	page: Page,
	endpoint: string,
	timeout?: number,
): Promise<Response> {
	return page.waitForResponse(
		(response: Response) => response.url().includes(endpoint),
		{ timeout },
	);
}

/**
 * Test credentials for E2E testing.
 * Use these with the test seed endpoint.
 */
export const testCredentials = {
	admin: {
		email: "admin@test.arkelythexfounders.com",
		password: "TestP@ssw0rd!",
	},
	accountant: {
		email: "accountant@test.arkelythexfounders.com",
		password: "TestP@ssw0rd!",
	},
	viewer: {
		email: "viewer@test.arkelythexfounders.com",
		password: "TestP@ssw0rd!",
	},
} as const;

/**
 * Storage state helper for authenticated sessions.
 * Saves authentication state to reuse across tests.
 *
 * Usage:
 *   test.beforeAll(async ({ browser }) => {
 *     const page = await browser.newPage();
 *     await authenticateAndSave(page, testCredentials.admin);
 *   });
 */
export async function authenticateAndSave(
	page: Page,
	credentials: { email: string; password: string },
	storagePath: string = "test-results/.auth/user.json",
): Promise<void> {
	await authenticate(page, credentials);
	await page.context().storageState({ path: storagePath });
}
