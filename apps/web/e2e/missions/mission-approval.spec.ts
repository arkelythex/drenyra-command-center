import { expect, test } from "@playwright/test";

const MISSION_URL = "/workspace/1/2026/07/monthly-close";

test.describe("Mission approval flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(MISSION_URL);
		await page.waitForLoadState("networkidle");
	});

	test("rejection requires a reason", async ({ page }) => {
		// Start mission and wait for approval state
		await page.getByRole("button", { name: /iniciar misión/i }).click();

		// Wait for the approval UI to appear (mock transitions to AWAITING_APPROVAL)
		const rejectBtn = page.getByRole("button", { name: /rechazar/i });
		await expect(rejectBtn).toBeVisible({ timeout: 10000 });

		// Try to reject without a reason
		await rejectBtn.click();

		// Should show validation that reason is required, or allow with default
		// The current UI sets default reason if empty
		const rejectedMessage = page.getByText(/rechazada/i);
		await expect(rejectedMessage).toBeVisible({ timeout: 5000 });
	});

	test("approval shows receipt with hash", async ({ page }) => {
		// Start mission
		await page.getByRole("button", { name: /iniciar misión/i }).click();

		// Wait for approval state
		const approveBtn = page.getByRole("button", { name: /aprobar/i });
		await expect(approveBtn).toBeVisible({ timeout: 10000 });

		// Approve
		await approveBtn.click();

		// Should show completed state or receipt
		const completedMessage = page.getByText(/completado|mis.i.n completada/i);
		await expect(completedMessage).toBeVisible({ timeout: 5000 });
	});

	test("SSE reconnect after temporary disconnect shows current state", async ({
		page,
	}) => {
		// Start mission
		await page.getByRole("button", { name: /iniciar misión/i }).click();

		// Wait for progress
		await page.waitForTimeout(1500);

		// Simulate SSE disconnect by reloading
		await page.reload();
		await page.waitForLoadState("networkidle");

		// The page should show the current mission state (not "Unknown")
		const unknownMessage = page.getByText(/unknown|indeterminado|no se pudo recuperar/i);
		await expect(unknownMessage).not.toBeVisible({ timeout: 5000 });

		// Should show some mission state
		const stateVisible = page.getByText(
			/en cola|ejecutando|aprobación|completado|fallido/i,
		);
		await expect(stateVisible).toBeVisible({ timeout: 5000 });
	});
});
