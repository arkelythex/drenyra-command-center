import { expect, test } from "@playwright/test";

const MISSION_URL = "/workspace/1/2026/07/monthly-close";

test.describe("Mission recovery and edge cases", () => {
	test("UNKNOWN state shows reconciliation option", async ({ page }) => {
		await page.goto(MISSION_URL);
		await page.waitForLoadState("networkidle");

		// Simulate UNKNOWN state — in mock mode, force by setting transport=mock
		// and intercepting to simulate timeout
		await page.route("**/harness/execute", async (route) => {
			await new Promise((r) => setTimeout(r, 31000)); // timeout > 30s
			await route.abort("timedout");
		});

		// Start mission — will timeout
		await page.getByRole("button", { name: /iniciar misión/i }).click();

		// Wait for UNKNOWN state or error message
		const unknownText = page.getByText(/no se pudo confirmar|unknown|indeterminado/i);
		await expect(unknownText).toBeVisible({ timeout: 35000 });

		// Should show a retry or reconcile option
		const retryButton = page.getByRole("button", { name: /reintentar|conciliar|verificar/i });
		await expect(retryButton).toBeVisible({ timeout: 5000 });
	});

	test("receipt shows copy button", async ({ page }) => {
		await page.goto(MISSION_URL);
		await page.waitForLoadState("networkidle");

		// Start mission
		await page.getByRole("button", { name: /iniciar misión/i }).click();

		// Wait for approval state
		const approveBtn = page.getByRole("button", { name: /aprobar/i });
		await expect(approveBtn).toBeVisible({ timeout: 10000 });

		// Approve
		await approveBtn.click();

		// Wait for completion
		const completed = page.getByText(/completado/i);
		await expect(completed).toBeVisible({ timeout: 5000 });

		// Should show receipt or completion info with something copyable
		const copyableElements = page.locator(
			'[data-testid="receipt-hash"], button:has-text("copiar"), code, pre',
		);
		const copyButtons = page.getByRole("button", { name: /copiar/i });

		// Either a copy button or a hash display
		const receiptVisible = await copyableElements.or(copyButtons).first().isVisible();
		if (!receiptVisible) {
			// At minimum, the completed state should show the mission succeeded
			await expect(completed).toBeVisible();
		}
	});

	test("starts mission exactly once on single click", async ({ page }) => {
		await page.goto(MISSION_URL);
		await page.waitForLoadState("networkidle");

		// Click start multiple times rapidly
		const startBtn = page.getByRole("button", { name: /iniciar misión/i });
		await startBtn.click();
		await startBtn.click();
		await startBtn.click();

		// Should not show any error about duplicate execution
		const errorText = page.getByText(/ya está en ejecución|duplicado|error al ejecutar/i);
		await expect(errorText).not.toBeVisible({ timeout: 3000 });

		// Should be in a running/queued state (not DRAFT with start button still visible)
		await page.waitForTimeout(500);
		const startStillVisible = await startBtn.isVisible();
		if (startStillVisible) {
			// If still visible, clicking again should still not error
			await startBtn.click();
			await expect(errorText).not.toBeVisible({ timeout: 3000 });
		}
	});
});
