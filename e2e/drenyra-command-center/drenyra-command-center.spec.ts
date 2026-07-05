/**
 * Drenyra Command Center E2E Smoke Tests
 *
 * Verifies that the Command Center page loads correctly with its
 * sidebar, chat area, header actions, agent selector, density toggles,
 * and file upload UI.
 *
 * API calls are mocked so tests run without a backend.
 */
import { expect, test } from "../base-test";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CASE = {
	id: "case-e2e-001",
	scope: {
		companyId: "00000000-0000-0000-0000-000000000001",
		companyRuc: "20546296564",
		period: "2026-05",
		countryCode: "PE",
	},
	type: "MONTHLY_CLOSE",
	status: "OPEN",
	title: "Cierre Mensual Mayo 2026",
	description:
		"Cierre fiscal mensual con conciliación bancaria y revisión SIRE",
	riskLevel: "MEDIUM",
	riskScore: 45,
	autonomyLevel: "ADVISORY",
	createdBy: "user-e2e",
	createdAt: "2026-06-01T10:00:00.000Z",
	updatedAt: "2026-06-01T10:00:00.000Z",
	metadata: {},
};

const ACTIVE_COMPANY = {
	companyId: "00000000-0000-0000-0000-000000000001",
	companyName: "DRENYRA S.A.C.",
	ruc: "20546296564",
	countryCode: "pe",
	isDemoFallback: false,
};

const AUTH_SESSION = {
	success: true,
	data: {
		session: {
			id: "session-e2e",
			userId: "user-e2e",
			expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		},
		user: {
			id: "user-e2e",
			email: "admin@test.com",
			name: "Admin Tester",
			role: "ADMIN",
			companyId: "00000000-0000-0000-0000-000000000001",
			activeCompanyId: "00000000-0000-0000-0000-000000000001",
			companyName: "DRENYRA S.A.C.",
			ruc: "20546296564",
			countryCode: "pe",
		},
	},
};

const AGENT_OPTIONS = [
	{ value: "LEDGER_AGENT", label: "Ledger" },
	{ value: "SIRE_AGENT", label: "SIRE" },
	{ value: "CPE_AGENT", label: "CPE" },
	{ value: "CONCILIATION_AGENT", label: "Conciliación" },
	{ value: "FISCAL_REVIEWER_AGENT", label: "Reviewer" },
	{ value: "EVIDENCE_AGENT", label: "Evidencia" },
] as const;

async function dismissOnboardingTour(page: import("@playwright/test").Page) {
	const skipTour = page.getByRole("button", { name: "Saltar tour" });
	if (await skipTour.isVisible().catch(() => false)) {
		await skipTour.click();
	}
}

function isAppApiRequest(url: string): boolean {
	try {
		return new URL(url).pathname.startsWith("/api/");
	} catch {
		return false;
	}
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

async function mockAuthSession(page: import("@playwright/test").Page) {
	await page.route(
		(url) =>
			isAppApiRequest(url.toString()) &&
			new URL(url).pathname === "/api/auth/session",
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(AUTH_SESSION),
			});
		},
	);
}

async function mockCommandCenterApis(page: import("@playwright/test").Page) {
	// Cases list
	await page.route(
		(url) =>
			isAppApiRequest(url.toString()) &&
			new URL(url).pathname === "/api/drenyra/command-center/cases",
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ data: [MOCK_CASE] }),
			});
		},
	);

	// Case details
	await page.route(
		(url) => {
			if (!isAppApiRequest(url.toString())) return false;
			const { pathname } = new URL(url);
			return (
				pathname.startsWith("/api/drenyra/command-center/cases/") &&
				pathname !== "/api/drenyra/command-center/cases"
			);
		},
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					data: {
						case: MOCK_CASE,
						evidence: [],
						agentRuns: [],
						approvals: [],
						auditEvents: [],
					},
				}),
			});
		},
	);

	// Fiscal work item details (inspect)
	await page.route(
		(url) => {
			if (!isAppApiRequest(url.toString())) return false;
			return new URL(url).pathname.startsWith("/api/drenyra/fiscal-work/");
		},
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					status: "success",
					data: {
						case: MOCK_CASE,
						evidence: [],
						agentRuns: [],
						approvals: [],
						auditEvents: [],
					},
				}),
			});
		},
	);

	// Drenyra API catch-all
	await page.route(
		(url) => {
			if (!isAppApiRequest(url.toString())) return false;
			return new URL(url).pathname.startsWith("/api/drenyra/");
		},
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ data: {} }),
			});
		},
	);

	// Chat streaming endpoint (PostHog and other observability)
	await page.route(
		(url) => {
			if (!isAppApiRequest(url.toString())) return false;
			return new URL(url).pathname.startsWith("/api/cognitive-hub/chat/stream");
		},
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "text/event-stream",
				body: 'event: connected\ndata: {"connectionId":"e2e"}\n\nevent: done\ndata: {}\n\n',
			});
		},
	);

	// API catch-all (non-drenyra)
	await page.route(
		(url) => isAppApiRequest(url.toString()),
		async (route) => {
			const pathname = new URL(route.request().url()).pathname;
			if (
				pathname === "/api/auth/session" ||
				pathname.startsWith("/api/drenyra/") ||
				pathname.startsWith("/api/cognitive-hub/")
			) {
				return route.fallback();
			}
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ data: {} }),
			});
		},
	);
}

async function installSessionState(page: import("@playwright/test").Page) {
	await page.addInitScript((company: typeof ACTIVE_COMPANY) => {
		window.localStorage.setItem(
			"drenyra-active-company",
			JSON.stringify(company),
		);
	}, ACTIVE_COMPANY);

	// Override fetch to intercept auth calls at the script level
	await page.addInitScript(() => {
		const originalFetch = window.fetch.bind(window);

		window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.href
						: input.url;

			if (url.includes("/api/auth/session")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							success: true,
							data: {
								session: { id: "session-e2e" },
								user: {
									id: "user-e2e",
									email: "admin@test.com",
									name: "Admin Tester",
									role: "ADMIN",
									companyId: "00000000-0000-0000-0000-000000000001",
									activeCompanyId: "00000000-0000-0000-0000-000000000001",
									companyName: "DRENYRA S.A.C.",
									ruc: "20546296564",
									countryCode: "pe",
								},
							},
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					),
				);
			}

			return originalFetch(input, init);
		}) as typeof window.fetch;
	});
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Drenyra Command Center", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
		await mockAuthSession(page);
		await mockCommandCenterApis(page);
	});

	async function gotoCommandCenter(page: import("@playwright/test").Page) {
		await page.goto("/drenyra");
		await dismissOnboardingTour(page);
	}

	test("Page loads and shows sidebar with company info", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-001"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		await expect(
			page.getByRole("heading", { name: "Fiscal Command Center" }),
		).toBeVisible({ timeout: 15_000 });

		const companies = page.getByRole("region", { name: "Companies" });
		await expect(companies.getByText("DRENYRA S.A.C.")).toBeVisible();
		await expect(companies.getByText("RUC 20546296564")).toBeVisible();
	});

	test("Chat area renders with empty state and quick action cards", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-002"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		await expect(
			page.getByRole("heading", { name: "Fiscal Chat" }),
		).toBeVisible({ timeout: 15_000 });

		await expect(page.getByText("Reconcile bank")).toBeVisible();
		await expect(page.getByText("Prepare SIRE")).toBeVisible();
		await expect(page.getByText("Risk analysis")).toBeVisible();
		await expect(page.getByText("Validate IGV")).toBeVisible();
	});

	test("Chat input bar renders with send button and file upload button", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-003"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		const input = page.getByRole("textbox", {
			name: "Comando fiscal conversacional",
		});
		await expect(input).toBeVisible({ timeout: 15_000 });
		await expect(input).toHaveAttribute("placeholder", /Type a fiscal command/);

		const sendButton = page.getByRole("button", { name: "Enviar mensaje" });
		await expect(sendButton).toBeVisible();
		await expect(sendButton).toBeDisabled();

		const paperclipButton = page.getByRole("button", {
			name: "Adjuntar archivos",
		});
		await expect(paperclipButton).toBeVisible();
	});

	test("Action buttons render in header — Run Agent, Upload, New Case, Approval", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-004"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		await expect(
			page.getByRole("button", { name: "Ejecutar agente fiscal" }),
		).toBeVisible({ timeout: 15_000 });

		await expect(
			page.getByRole("button", { name: "Adjuntar evidencia" }),
		).toBeVisible();

		await expect(
			page.getByRole("button", { name: "Crear nuevo caso fiscal" }),
		).toBeVisible();

		await expect(
			page.getByRole("button", { name: "Solicitar aprobación" }),
		).toBeVisible();
	});

	test("Agent selector renders in header with all agent options", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-005"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		const agentSelect = page.getByRole("combobox", {
			name: "Seleccionar agente",
		});
		await expect(agentSelect).toBeVisible({ timeout: 15_000 });

		const options = agentSelect.locator("option");
		await expect(options).toHaveCount(AGENT_OPTIONS.length);

		for (const agent of AGENT_OPTIONS) {
			await expect(
				agentSelect.locator(`option[value="${agent.value}"]`),
			).toHaveCount(1);
		}
	});

	test("Density mode toggle buttons render and allow selection", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-006"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		const densityTabs = page.getByRole("tablist", { name: "Modo de densidad" });
		const compactTab = densityTabs.getByRole("tab", { name: "Compact" });
		const detailTab = densityTabs.getByRole("tab", { name: "Detail" });
		const numbersTab = densityTabs.getByRole("tab", { name: "Numbers" });

		await expect(compactTab).toBeVisible({ timeout: 15_000 });
		await expect(detailTab).toBeVisible();
		await expect(numbersTab).toBeVisible();

		await compactTab.click();
		await expect(compactTab).toHaveAttribute("aria-selected", "true");
	});

	test("File upload UI works — paperclip opens file input and selection shows preview chip", {
		tag: ["@e2e", "@drenyra", "@command-center", "@CC-E2E-007"],
	}, async ({ page }) => {
		await gotoCommandCenter(page);

		const paperclipBtn = page.getByRole("button", {
			name: "Adjuntar archivos",
		});
		await expect(paperclipBtn).toBeVisible({ timeout: 15_000 });

		// Set up file chooser handler BEFORE clicking
		const fileChooserPromise = page.waitForEvent("filechooser");
		await paperclipBtn.click();

		const fileChooser = await fileChooserPromise;
		expect(fileChooser).toBeDefined();

		// Select a file
		await fileChooser.setFiles({
			name: "balance-comprobacion-mayo-2026.pdf",
			mimeType: "application/pdf",
			buffer: Buffer.from("fake-pdf-content"),
		});

		// Wait for the preview chip to appear with the file name
		await expect(
			page.getByText("balance-comprobacion-mayo-2026.pdf"),
		).toBeVisible();

		// Remove file chip button should be present
		const removeBtn = page.getByRole("button", {
			name: "Remover balance-comprobacion-mayo-2026.pdf",
		});
		await expect(removeBtn).toBeVisible();

		// Click remove — chip should disappear
		await removeBtn.click();
		await expect(
			page.getByText("balance-comprobacion-mayo-2026.pdf"),
		).not.toBeVisible();
	});
});
