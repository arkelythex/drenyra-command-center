/**
 * Agent Workspace E2E Smoke Tests
 *
 * Verifies that each agent workspace page loads correctly
 * with its title and the chat panel renders its input.
 *
 * API calls are mocked so tests run without a backend.
 */
import { expect, test } from "../base-test";

const WORKSPACES = [
	{ path: "/workspace/finance", title: "Finance Agent" },
	{ path: "/workspace/operations", title: "Operations Agent" },
	{ path: "/workspace/compliance", title: "Compliance (Fiscal) Agent" },
	{ path: "/workspace/system-admin", title: "System Admin Agent" },
	{ path: "/approvals", title: "Centro de Aprobaciones" },
] as const;

const CHAT_WORKSPACES = [
	{ path: "/workspace/finance", name: "finance" },
	{ path: "/workspace/operations", name: "operations" },
] as const;

const ACTIVE_COMPANY = {
	companyId: "00000000-0000-0000-0000-000000000001",
	companyName: "ARKELYTHEX S.A.C.",
	ruc: "20546296564",
	countryCode: "pe",
	isDemoFallback: false,
} as const;

function mockAuthSession(page: import("@playwright/test").Page) {
	return page.route("**/api/auth/session", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					session: {
						id: "session-e2e",
						userId: "user-e2e",
						expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
					},
					user: {
						id: "user-e2e",
						email: "smoke@arkalythix.test",
						name: "Smoke Tester",
						role: "ADMIN",
						companyId: "00000000-0000-0000-0000-000000000001",
						activeCompanyId: "00000000-0000-0000-0000-000000000001",
						companyName: "ARKELYTHEX S.A.C.",
						ruc: "20546296564",
						countryCode: "pe",
					},
				},
			}),
		});
	});
}

async function mockDrenyraApis(page: import("@playwright/test").Page) {
	await page.route("**/api/drenyra/approvals", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: [] }),
		});
	});

	await page.route("**/api/drenyra/chat", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					message: "Respuesta mockeada para smoke test",
					sessionId: "session-e2e",
				},
			}),
		});
	});

	await page.route("**/api/drenyra/chat/stream**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "text/event-stream",
			body: 'event: chunk\ndata: {"content":"OK"}\n\nevent: done\ndata: {}\n\n',
		});
	});

	await page.route("**/api/drenyra/approvals/stream**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "text/event-stream",
			body: 'event: connected\ndata: {"connectionId":"e2e"}\n\nevent: snapshot\ndata: []\n\n',
		});
	});
}

async function installSessionState(page: import("@playwright/test").Page) {
	await page.addInitScript((company) => {
		window.localStorage.setItem(
			"arkelythex-active-company",
			JSON.stringify(company),
		);

		class FakeEventSource extends EventTarget {
			static readonly CONNECTING = 0;
			static readonly OPEN = 1;
			static readonly CLOSED = 2;

			onopen: ((event: Event) => void) | null = null;
			onmessage: ((event: MessageEvent) => void) | null = null;
			onerror: ((event: Event) => void) | null = null;
			readyState = FakeEventSource.CONNECTING;
			readonly url: string;
			readonly withCredentials = false;

			constructor(url: string | URL) {
				super();
				this.url = String(url);

				window.setTimeout(() => {
					if (this.readyState === FakeEventSource.CLOSED) return;
					this.readyState = FakeEventSource.OPEN;
					const openEvent = new Event("open");
					this.onopen?.(openEvent);
					this.dispatchEvent(openEvent);

					this.emit("connected", { connectionId: "e2e" });
					this.emit("snapshot", []);
				}, 0);
			}

			close() {
				this.readyState = FakeEventSource.CLOSED;
			}

			private emit(type: string, payload: unknown) {
				const event = new MessageEvent(type, { data: JSON.stringify(payload) });
				if (type === "message") {
					this.onmessage?.(event);
				}
				this.dispatchEvent(event);
			}
		}

		window.EventSource = FakeEventSource as typeof EventSource;
	}, ACTIVE_COMPANY);
}

test.describe("Agent Workspaces — smoke", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
		await mockDrenyraApis(page);
		await mockAuthSession(page);
	});

	for (const ws of WORKSPACES) {
		test(`loads ${ws.path} with correct title`, async ({ page }) => {
			await page.goto(ws.path);

			await expect(page.getByRole("heading", { name: ws.title })).toBeVisible({
				timeout: 15_000,
			});
		});
	}

	for (const ws of CHAT_WORKSPACES) {
		test(`chat panel input and send button are present on ${ws.name} workspace`, async ({
			page,
		}) => {
			await page.goto(ws.path);

			await expect(
				page.getByRole("textbox", { name: "Escribí tu consulta..." }),
			).toBeVisible({ timeout: 15_000 });
			await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible();
		});
	}

	test("approvals page shows filter buttons", async ({ page }) => {
		await page.goto("/approvals");

		await expect(
			page.getByRole("heading", { name: "Centro de Aprobaciones" }),
		).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("Pendientes", { exact: true })).toBeVisible();
		await expect(page.getByText("Alto Riesgo", { exact: true })).toBeVisible();
		await expect(page.getByText("Urgentes", { exact: true })).toBeVisible();
	});
});

test.describe("Agent Workspaces — chat interaction", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
		await mockDrenyraApis(page);
		await mockAuthSession(page);
	});

	test("typing in chat input shows the text and send button enables", async ({
		page,
	}) => {
		await page.goto("/workspace/finance");

		const input = page.getByRole("textbox", { name: "Escribí tu consulta..." });
		await expect(input).toBeVisible({ timeout: 15_000 });

		await input.fill("¿Cuál es el saldo actual?");
		await expect(input).toHaveValue("¿Cuál es el saldo actual?");

		const sendButton = page.getByRole("button", { name: "Enviar" });
		await expect(sendButton).toBeEnabled();
	});

	test("tools sidebar renders on finance workspace (lg+ viewport)", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/workspace/finance");

		await expect(
			page.getByRole("heading", { name: "Tools disponibles" }),
		).toBeVisible({ timeout: 15_000 });
	});
});
