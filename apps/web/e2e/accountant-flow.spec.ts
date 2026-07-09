import { test, expect } from "@playwright/test";

test.describe("Accountant Flow — E2E", () => {
	test("dashboard page loads and shows fiscal summary", async ({ page }) => {
		await page.goto("/accountant");

		// Should show the dashboard header
		await expect(page.locator("h1")).toContainText("Panel Contable");

		// Should show summary cards
		await expect(page.locator("text=IGV Compra")).toBeVisible();
		await expect(page.locator("text=IGV Venta")).toBeVisible();
		await expect(page.locator("text=Detracciones")).toBeVisible();
		await expect(page.locator("text=Pendientes")).toBeVisible();
	});

	test("consulta page accepts input and shows example buttons", async ({
		page,
	}) => {
		await page.goto("/consulta");

		// Should show the page title
		await expect(page.locator("h1")).toContainText("Consulta Fiscal");

		// Should show example query buttons
		await expect(page.locator("text=IGV de julio 2026")).toBeVisible();
		await expect(page.locator("text=detracciones pendientes")).toBeVisible();

		// Should allow typing a query
		const input = page.locator('input[placeholder*="IGV"]');
		await input.fill("IGV de julio 2026");
		await expect(input).toHaveValue("IGV de julio 2026");
	});

	test("approval page shows pending recommendations", async ({ page }) => {
		await page.goto("/approval");

		// Should show the page title
		await expect(page.locator("h1")).toContainText("Recomendaciones");

		// Mock data fallback: should show pending approvals
		// (when API is not available, mock data kicks in)
		await expect(page.locator("text=Pendientes")).toBeVisible();
	});

	test("approval detail page shows recommendation detail", async ({ page }) => {
		await page.goto("/approval/REC-001");

		// Should show the recommendation ID
		await expect(page.locator("text=REC-001")).toBeVisible();

		// Should show action buttons for pending
		await expect(page.locator("text=Aprobar")).toBeVisible();
		await expect(page.locator("text=Rechazar")).toBeVisible();
	});

	test("approve flow — click approve button", async ({ page }) => {
		await page.goto("/approval/REC-001");

		// Click approve
		await page.locator('button:has-text("Aprobar")').click();

		// Should show approved status
		await expect(page.locator("text=Aprobada")).toBeVisible();
	});

	test("reject flow — requires motivo input", async ({ page }) => {
		await page.goto("/approval/REC-001");

		// Click reject
		await page.locator('button:has-text("Rechazar")').click();

		// Should show motivo input
		const motivoInput = page.locator('input[placeholder*="Motivo"]');
		await expect(motivoInput).toBeVisible();

		// Fill motivo and confirm
		await motivoInput.fill("Período incorrecto");
		await page.locator('button:has-text("Confirmar")').click();

		// Should show rejected status
		await expect(page.locator("text=Rechazada")).toBeVisible();
	});

	test("evidence viewer shows expandable sources", async ({ page }) => {
		await page.goto("/approval/REC-001");

		// Should show evidence section
		await expect(page.locator("text=Evidencia")).toBeVisible();

		// Should show at least one source
		await expect(
			page.locator("text=F001-123").or(page.locator("text=F001")),
		).toBeVisible();
	});

	test("dashboard shows pending approvals widget", async ({ page }) => {
		await page.goto("/accountant");

		// Should show pending approvals section
		await expect(page.locator("text=Pendientes por Aprobar")).toBeVisible();

		// Should show at least one pending recommendation
		await expect(
			page.locator("text=REC-001").or(page.locator("text=REC")),
		).toBeVisible();
	});

	test("sidebar navigation works", async ({ page }) => {
		await page.goto("/accountant");

		// Dashboard → Consulta
		await page.locator('a:has-text("Consultar")').click();
		await expect(page.locator("h1")).toContainText("Consulta Fiscal");

		// Consulta → Aprobaciones
		await page.locator('a:has-text("Aprobaciones")').click();
		await expect(page.locator("h1")).toContainText("Recomendaciones");
	});
});
