/**
 * Supervisor review: cola → ítem → aprobar/rechazar → cola vacía.
 * Sesión mockeada (GET /api/auth/session) para no requerir API en :3000 durante el login.
 *
 * CI robustness:
 * - Captures unhandled page errors (NOT console errors — 503 on /api/auth/session is expected
 *   when the API backend isn't running on CI self-hosted runners).
 * - Uses navigateAndBoot() that waits for document.readyState before asserting.
 * - Explicit timeouts on every assertion (Playwright default 5 s is too short for SPA boot).
 * - Final test.expect(errors).toHaveLength(0) catches real JS exceptions.
 */

import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
	MOCK_FILE,
	mockAuthSessionGet,
	mockDocumentsList,
	mockDocumentsRejectPost,
	mockDocumentsValidatePost,
	seedReviewCompanyContext,
} from "./review-helpers";

const VALIDATE_OK = {
	success: true,
	data: {
		id: "doc-e2e-1",
		status: "listo_para_sire",
	},
};

const REJECT_OK = {
	success: true,
	data: {
		id: "doc-e2e-1",
		status: "rechazado_por_sire",
	},
};

/** Wire global error collectors — call once per test. */
function capturePageErrors(page: Page): { errors: string[] } {
	const errors: string[] = [];
	page.on("pageerror", (err) => {
		errors.push(`[PAGE_ERROR] ${err.message}`);
	});
	return { errors };
}

/**
 * Navigate and wait for the SPA to fully initialise before making assertions.
 * TanStack Router boot + lazy imports may take several seconds on colder runners.
 */
async function navigateAndBoot(page: Page, path: string): Promise<void> {
	await page.goto(path);
	await page.waitForFunction(() => document.readyState === "complete", {
		timeout: 15_000,
	});
}

test.describe("Review supervisor", () => {
	test("queue → select item → approve → empty queue (mocked API)", async ({
		page,
	}) => {
		const { errors } = capturePageErrors(page);
		const listMode = { current: "one" as const };

		await seedReviewCompanyContext(page);
		await mockAuthSessionGet(page);
		await mockDocumentsList(page, listMode);
		await mockDocumentsValidatePost(
			page,
			() => {
				listMode.current = "empty";
			},
			VALIDATE_OK,
		);

		await navigateAndBoot(page, "/review");

		await expect(page.getByText("Cola de trabajo (1)")).toBeVisible({
			timeout: 30_000,
		});

		await page.getByText(MOCK_FILE).click();
		await page.getByRole("button", { name: /Aprobar & Registrar/i }).click();

		await expect(page.getByText("Cola de trabajo (0)")).toBeVisible({
			timeout: 30_000,
		});

		// Fail the test explicitly if unhandled page errors were captured.
		test.expect(errors).toHaveLength(0);
	});

	test("queue → select item → reject → empty queue (mocked API)", async ({
		page,
	}) => {
		const { errors } = capturePageErrors(page);
		const listMode = { current: "one" as const };

		await seedReviewCompanyContext(page);
		await mockAuthSessionGet(page);
		await mockDocumentsList(page, listMode);
		await mockDocumentsRejectPost(
			page,
			() => {
				listMode.current = "empty";
			},
			REJECT_OK,
		);

		await navigateAndBoot(page, "/review");

		await expect(page.getByText("Cola de trabajo (1)")).toBeVisible({
			timeout: 30_000,
		});

		await page.getByText(MOCK_FILE).click();
		await page.getByRole("button", { name: /^Rechazar$/i }).click();

		await expect(page.getByText("Cola de trabajo (0)")).toBeVisible({
			timeout: 30_000,
		});

		test.expect(errors).toHaveLength(0);
	});
});

test.describe("Review queue dashboard", () => {
	test("redirects legacy queue URL to the review cockpit with mocked documents API", async ({
		page,
	}) => {
		const { errors } = capturePageErrors(page);
		const listMode = { current: "one" as const };

		await seedReviewCompanyContext(page);
		await mockAuthSessionGet(page);
		await mockDocumentsList(page, listMode);

		await navigateAndBoot(page, "/review-queue");

		// TanStack Router's throw-redirect is async and may take a moment on slower runners.
		await expect(page).toHaveURL(/\/review$/, { timeout: 30_000 });

		await expect(
			page.getByRole("heading", { name: "Review Cockpit" }),
		).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.getByText("Cola de trabajo (1)")).toBeVisible({
			timeout: 15_000,
		});

		test.expect(errors).toHaveLength(0);
	});
});
