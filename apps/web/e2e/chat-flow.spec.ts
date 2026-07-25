import { expect, test } from "@playwright/test";

test.describe("ChatAgent — flujo completo tipo Codex", () => {
	test("landing page carga el chat con mensaje de bienvenida", async ({
		page,
	}) => {
		await page.goto("/");

		// Should show the chat header
		await expect(page.locator("text=Drenyra")).toBeVisible();

		// Should show welcome message
		await expect(page.locator("text=Bienvenido a Drenyra")).toBeVisible();

		// Should show the sidebar
		await expect(page.locator("text=Chats")).toBeVisible();
		await expect(page.locator("text=Skills")).toBeVisible();
		await expect(page.locator("text=Auto")).toBeVisible();
		await expect(page.locator("text=Config")).toBeVisible();
	});

	test("sidebar muestra threads existentes", async ({ page }) => {
		await page.goto("/");

		// Should show project names
		await expect(page.locator("text=Drenyra Fiscal")).toBeVisible();

		// Should show thread titles
		await expect(page.locator("text=Bienvenida")).toBeVisible();
		await expect(page.locator("text=IGV Julio 2026")).toBeVisible();
		await expect(page.locator("text=Detracciones pendientes")).toBeVisible();
	});

	test("new thread button crea thread vacío", async ({ page }) => {
		await page.goto("/");

		// Click new thread
		await page.locator("text=Nuevo thread").click();

		// Should show the new empty thread
		await expect(page.locator("text=Nueva consulta")).toBeVisible();
	});

	test("sidebar colapsa y expande", async ({ page }) => {
		await page.goto("/");

		// Click collapse button (←)
		await page.locator('button:has-text("←")').click();

		// Sidebar should be collapsed — icons only
		await expect(page.locator("text=Drenyra")).not.toBeVisible();

		// Click expand button (→)
		await page.locator('button:has-text("→")').click();

		// Sidebar should be expanded again
		await expect(page.locator("text=Drenyra")).toBeVisible();
	});

	test("skills section muestra skills", async ({ page }) => {
		await page.goto("/");

		// Click Skills section
		await page.locator("text=Skills").click();

		// Should show skills
		await expect(page.locator("text=Fiscal Query")).toBeVisible();
		await expect(page.locator("text=Approval Manager")).toBeVisible();
		await expect(page.locator("text=Compliance Pipeline")).toBeVisible();
	});

	test("automations section muestra automatizaciones", async ({ page }) => {
		await page.goto("/");

		// Click Auto section
		await page.locator("text=Auto").click();

		// Should show automations
		await expect(page.locator("text=Cierre Mensual")).toBeVisible();
		await expect(page.locator("text=SIRE Auto-Report")).toBeVisible();
	});

	test("settings section muestra configuración", async ({ page }) => {
		await page.goto("/");

		// Click Config section
		await page.locator("text=Config").click();

		// Should show settings
		await expect(page.locator("text=Configuración")).toBeVisible();
		await expect(page.locator("text=RUC por defecto")).toBeVisible();
	});

	test("cambiar de thread preserva historial", async ({ page }) => {
		await page.goto("/");

		// Click on a different thread
		await page.locator("text=IGV Julio 2026").click();

		// Should show that thread's messages
		await expect(page.locator("text=IGV — 2026-07")).toBeVisible();

		// Switch back
		await page.locator("text=Bienvenida").click();

		// Should show welcome message again
		await expect(page.locator("text=Bienvenido a Drenyra")).toBeVisible();
	});

	test("input field acepta texto y tiene botón Enviar", async ({ page }) => {
		await page.goto("/");

		const input = page.locator('input[placeholder*="Escribí"]');
		await expect(input).toBeVisible();

		await input.fill("IGV de julio 2026");
		await expect(input).toHaveValue("IGV de julio 2026");

		// Send button should be enabled
		await expect(page.locator('button:has-text("Enviar")')).toBeEnabled();
	});

	test("respuesta del chat se muestra", async ({ page }) => {
		await page.goto("/");

		const input = page.locator('input[placeholder*="Escribí"]');
		await input.fill("qué sabes hacer");
		await page.locator('button:has-text("Enviar")').click();

		// Should show skills response
		await expect(page.locator("text=Skills disponibles")).toBeVisible({
			timeout: 5000,
		});
	});

	test("aprobación desde el chat muestra confirmación", async ({ page }) => {
		await page.goto("/");

		const input = page.locator('input[placeholder*="Escribí"]');
		await input.fill("qué hay pendiente");
		await page.locator('button:has-text("Enviar")').click();

		// Should show pending count
		await expect(page.locator("text=pendiente")).toBeVisible({ timeout: 5000 });
	});

	test("error handling cuando API no disponible", async ({ page }) => {
		await page.goto("/");

		const input = page.locator('input[placeholder*="Escribí"]');
		await input.fill("IGV de julio 2026");
		await page.locator('button:has-text("Enviar")').click();

		// Should show error message
		await expect(page.locator("text=Error de conexión")).toBeVisible({
			timeout: 5000,
		});
	});
});
