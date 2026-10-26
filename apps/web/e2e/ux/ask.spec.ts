import { expect, test } from "../base-test";

const sse = (events: Array<[string, unknown]>) =>
	events
		.map(
			([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
		)
		.join("");

test.describe("Pregunta a Drenyra", () => {
	test("streams a real answer from the cognitive stream and keeps the user on the page", async ({
		page,
	}) => {
		let requestBody: unknown;
		await page.route("**/api/ai-swarm/cognitive-stream", async (route) => {
			requestBody = route.request().postDataJSON();
			await route.fulfill({
				status: 200,
				headers: { "Content-Type": "text/event-stream" },
				body: sse([
					["run_started", { runId: "r1" }],
					["token", { content: "El IGV de setiembre " }],
					["token", { content: "vence según el último dígito del RUC." }],
					["done", { finish_reason: "stop" }],
				]),
			});
		});

		await page.goto("/invoices", { waitUntil: "networkidle" });
		const composer = page.getByRole("textbox", { name: "Pregunta a Drenyra" });
		await composer.fill("¿Cuándo vence el IGV?");
		await page.getByRole("button", { name: "Enviar" }).click();

		const answer = page.getByRole("region", { name: "Respuesta de Drenyra" });
		await expect(answer).toContainText(
			"El IGV de setiembre vence según el último dígito del RUC.",
		);
		await expect(answer).toContainText("¿Cuándo vence el IGV?");
		await expect(page).toHaveURL(/\/invoices$/);
		expect(requestBody).toMatchObject({
			messages: [{ role: "user", content: "¿Cuándo vence el IGV?" }],
			tools: false,
		});
	});

	test("explains when the session is missing", async ({ page }) => {
		await page.route("**/api/ai-swarm/cognitive-stream", (route) =>
			route.fulfill({ status: 401, json: { success: false } }),
		);

		await page.goto("/invoices", { waitUntil: "networkidle" });
		await page
			.getByRole("textbox", { name: "Pregunta a Drenyra" })
			.fill("hola");
		await page.getByRole("button", { name: "Enviar" }).click();

		await expect(page.getByRole("alert")).toContainText("Inicia sesión");
	});
});
