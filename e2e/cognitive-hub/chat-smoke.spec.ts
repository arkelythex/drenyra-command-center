import { expect, test } from "../base-test";

test.describe("Cognitive Hub /chat smoke", () => {
	test("loads authenticated Drenyra workspace without backend dependencies", async ({
		page,
	}) => {
		const consoleErrors: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "error") consoleErrors.push(message.text());
		});
		await page.route("**/*", async (route) => {
			const request = route.request();
			const url = new URL(route.request().url());
			const isApiFetch =
				url.pathname.startsWith("/api/") &&
				(request.resourceType() === "fetch" ||
					request.resourceType() === "xhr");
			if (!isApiFetch) {
				await route.continue();
				return;
			}

			if (url.pathname === "/api/auth/session") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						success: true,
						data: {
							session: {
								id: "session-smoke",
								userId: "user-smoke",
								expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
							},
							user: {
								id: "user-smoke",
								legacyUserId: "legacy-smoke",
								email: "smoke@arkalythix.test",
								name: "Smoke Auditor",
								role: "ADMIN",
								companyId: "00000000-0000-0000-0000-000000000001",
								activeCompanyId: "00000000-0000-0000-0000-000000000001",
								companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
								ruc: "20608451231",
								countryCode: "pe",
							},
						},
					}),
				});
				return;
			}

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					data: {},
				}),
			});
		});

		await page.addInitScript(() => {
			window.localStorage.setItem(
				"arkelythex-active-company",
				JSON.stringify({
					companyId: "00000000-0000-0000-0000-000000000001",
					companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
					ruc: "20608451231",
					countryCode: "pe",
					isDemoFallback: false,
				}),
			);
		});

		await page.goto("/chat");

		try {
			await expect(page.getByTestId("cognitive-workspace-route")).toBeVisible({
				timeout: 20_000,
			});
		} catch (error) {
			throw new Error(
				[
					error instanceof Error ? error.message : String(error),
					`HTML: ${await page.content()}`,
					`Console errors: ${consoleErrors.join(" | ") || "<none>"}`,
				].join("\n\n"),
			);
		}
		await expect(page).not.toHaveURL(/login|auth/);
	});
});
