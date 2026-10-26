import { expect, test } from "../base-test";

const FORMS = [
	{ path: "/signup", button: "Crear cuenta" },
	{ path: "/forgot-password", button: "Enviar enlace" },
] as const;

for (const { path, button } of FORMS) {
	test(`${path}: the primary action is visible, painted and not uppercase`, async ({
		page,
	}) => {
		await page.goto(path, { waitUntil: "networkidle" });
		const action = page.getByRole("button", { name: button });
		await expect(action).toBeVisible();

		const style = await action.evaluate((el) => {
			const css = getComputedStyle(el);
			return { bg: css.backgroundColor, transform: css.textTransform };
		});
		expect(style.bg).not.toBe("rgba(0, 0, 0, 0)");
		expect(style.transform).toBe("none");
	});
}

test("forgot password sends the request to the auth API and confirms", async ({
	page,
}) => {
	let body: unknown;
	await page.route("**/api/auth/forget-password", async (route) => {
		body = route.request().postDataJSON();
		await route.fulfill({ status: 200, json: { status: true } });
	});

	await page.goto("/forgot-password", { waitUntil: "networkidle" });
	await page.getByRole("textbox").first().fill("contadora@andina.pe");
	await page.getByRole("button", { name: "Enviar enlace" }).click();

	await expect(page.getByText(/revisa tu bandeja/i).first()).toBeVisible();
	expect(body).toMatchObject({ email: "contadora@andina.pe" });
});
