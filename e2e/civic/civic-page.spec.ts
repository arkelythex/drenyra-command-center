/**
 * Civic Landing Page — E2E Tests
 *
 * Tests the civic landing page rendering and navigation.
 *
 * Tags: @civic, @e2e, @landing
 *
 * Note: These tests require the landing app to be running.
 * The playwright.config.ts webServer targets apps/web by default.
 * Run manually: cd apps/landing && bun run dev (port 3000)
 * Then: BASE_URL=http://localhost:3000 bunx playwright test e2e/civic/
 */
import { expect, test } from "@playwright/test";

test.describe("Civic Landing Page", () => {
	test("should render the civic page with correct title", async ({ page }) => {
		await page.goto("/civic");

		// Verify the page title is visible
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator("h1")).toContainText("Portal Cívico");
	});

	test("should display feature cards", async ({ page }) => {
		await page.goto("/civic");

		// Feature cards should be visible
		const features = page.locator(
			"section[aria-label='Capacidades del portal cívico']",
		);
		await expect(features).toBeVisible();

		// Check for key feature titles
		await expect(page.getByText("Resultados Electorales")).toBeVisible();
		await expect(page.getByText("Validación de Actas")).toBeVisible();
		await expect(page.getByText("Alertas de Fraude")).toBeVisible();
		await expect(page.getByText("Locales de Votación")).toBeVisible();
	});

	test("should display process steps", async ({ page }) => {
		await page.goto("/civic");

		const processSection = page.locator("section[aria-label='Cómo funciona']");
		await expect(processSection).toBeVisible();

		// Verify process steps
		await expect(page.getByText("Carga de Actas")).toBeVisible();
		await expect(page.getByText("Validación Automática")).toBeVisible();
		await expect(page.getByText("Detección de Anomalías")).toBeVisible();
		await expect(page.getByText("Expediente Trazable")).toBeVisible();
	});

	test("should display API endpoints", async ({ page }) => {
		await page.goto("/civic");

		const apiSection = page.locator("section[aria-label='API cívica']");
		await expect(apiSection).toBeVisible();

		// API endpoints should be listed
		await expect(
			page.getByText("POST /api/civic/v1/acts/validate"),
		).toBeVisible();
		await expect(
			page.getByText("GET /api/civic/v1/results/:electionId"),
		).toBeVisible();
	});

	test("should have working CTA buttons", async ({ page }) => {
		await page.goto("/civic");

		// Hero CTA buttons
		const verResultadosBtn = page.getByRole("link", {
			name: /Ver Resultados/i,
		});
		await expect(verResultadosBtn).toBeVisible();

		const comoFuncionaBtn = page.getByRole("link", {
			name: /Cómo Funciona/i,
		});
		await expect(comoFuncionaBtn).toBeVisible();

		// Contact CTA
		const contactBtn = page.getByRole("link", {
			name: /Contactar al equipo/i,
		});
		await expect(contactBtn).toBeVisible();
	});

	test("should show navbar and footer", async ({ page }) => {
		await page.goto("/civic");

		// Navbar should be present
		const nav = page.locator("nav[aria-label='Navegación principal']");
		await expect(nav).toBeVisible();

		// Footer should be present
		const footer = page.locator("footer");
		await expect(footer).toBeVisible();
	});
});
