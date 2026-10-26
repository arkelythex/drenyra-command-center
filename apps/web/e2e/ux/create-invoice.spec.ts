import type { Page } from "@playwright/test";
import { expect, test } from "../base-test";

async function openDialog(page: Page) {
	await page.goto("/invoices", { waitUntil: "networkidle" });
	await page
		.getByRole("button", { name: /emitir factura|nueva factura/i })
		.first()
		.click();
	const dialog = page.getByRole("dialog", { name: "Nueva factura" });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByLabel("Moneda")).toBeVisible();
	return dialog;
}

test.describe("Nueva factura", () => {
	test("shows every field without horizontal overflow and with readable labels", async ({
		page,
	}) => {
		const dialog = await openDialog(page);

		for (const label of [
			"Cliente",
			"Tipo y serie",
			"Fecha de emisión",
			"Fecha de vencimiento",
			"Moneda",
			"Notas",
		]) {
			await expect(dialog.getByLabel(label)).toBeVisible();
		}
		await expect(
			dialog.getByRole("heading", { name: "Conceptos" }),
		).toBeVisible();

		const overflow = await dialog.evaluate(
			(el) => el.scrollWidth > el.clientWidth + 1,
		);
		expect(overflow).toBe(false);

		const forcedUppercase = await dialog.evaluate((el) =>
			[...el.querySelectorAll("label, h2, h3, button")].some(
				(node) => getComputedStyle(node).textTransform === "uppercase",
			),
		);
		expect(forcedUppercase).toBe(false);
	});

	test("adds a concept and updates the total with IGV", async ({ page }) => {
		const dialog = await openDialog(page);
		await dialog.getByRole("button", { name: "Agregar concepto" }).click();

		await dialog
			.getByLabel(/^Cantidad/)
			.last()
			.fill("2");
		await dialog
			.getByLabel(/^Precio unitario/)
			.last()
			.fill("118");

		const totals = dialog.getByRole("region", { name: "Totales" });
		await expect(totals).toContainText("IGV (18%)");
		await expect(totals).toContainText("236.00");
		await expect(
			dialog.getByRole("button", { name: "Emitir factura" }),
		).toBeInViewport();
	});
});
