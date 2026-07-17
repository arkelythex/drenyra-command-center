/**
 * Rutas mockeadas compartidas entre E2E de /review y /review-queue.
 */
import type { Page } from "@playwright/test";

export const MOCK_FILE = "e2e-factura-mock.pdf";

export const LIST_WITH_ONE = {
	success: true,
	data: {
		documents: [
			{
				id: "doc-e2e-1",
				companyId: null,
				clientId: "c1",
				clientName: "Cliente demo",
				fileName: MOCK_FILE,
				fileUrl: "https://example.com/f.pdf",
				fileType: "application/pdf",
				fileSize: 1024,
				status: "revision_humana",
				confidenceLevel: "high",
				extractedData: { issuerRUC: "20100017491", total: 100 },
				validatedBy: null,
				validatedAt: undefined,
				validationNotes: null,
				rejectionReason: null,
				rejectedBy: null,
				rejectedAt: undefined,
				uploadedAt: "2026-04-19T12:00:00.000Z",
				processedAt: "2026-04-19T12:01:00.000Z",
			},
		],
		total: 1,
		counts: {
			porProcesar: 0,
			revisionHumana: 1,
			listoParaSIRE: 0,
			rechazadoPorSIRE: 0,
			total: 1,
		},
	},
};

export const LIST_EMPTY = {
	success: true,
	data: {
		documents: [],
		total: 0,
		counts: {
			porProcesar: 0,
			revisionHumana: 0,
			listoParaSIRE: 0,
			rechazadoPorSIRE: 0,
			total: 0,
		},
	},
};

export const SESSION_JSON = JSON.stringify({
	success: true,
	data: {
		session: {
			id: "sess-e2e",
			userId: "user-e2e",
			expiresAt: "2026-12-31T23:59:59.000Z",
			token: "e2e-token",
		},
		user: {
			id: "user-e2e",
			email: "e2e@test.com",
			name: "E2E User",
			emailVerified: true,
			role: "ADMIN",
			activeCompanyId: "00000000-0000-0000-0000-000000000001",
			companyId: "00000000-0000-0000-0000-000000000001",
			companyName: "E2E Company SAC",
			ruc: "20100017491",
			countryCode: "PE",
			legacyUserId: "user-e2e",
			availableCompanies: [
				{
					companyId: "00000000-0000-0000-0000-000000000001",
					companyName: "E2E Company SAC",
					ruc: "20100017491",
					countryCode: "PE",
					membershipRole: "ADMIN",
					isDefault: true,
				},
			],
		},
	},
});

/** `empty` = cola sin ítems; `one` = un documento en revisión humana */
export type ReviewListMode = "empty" | "one";

export async function seedReviewCompanyContext(page: Page): Promise<void> {
	await page.addInitScript(() => {
		const companyId = "00000000-0000-0000-0000-000000000001";
		localStorage.setItem(
			"arkelythex-active-company",
			JSON.stringify({
				companyId,
				companyName: "E2E Company SAC",
				ruc: "20100017491",
				countryCode: "PE",
				isDemoFallback: false,
			}),
		);
	});
}

export async function mockAuthSessionGet(page: Page): Promise<void> {
	await page.route(
		(url) => url.toString().includes("/api/auth/session"),
		async (route) => {
			if (route.request().method() !== "GET") {
				await route.continue();
				return;
			}
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: SESSION_JSON,
			});
		},
	);
}

function isDocumentsListPath(pathname: string): boolean {
	if (!pathname.startsWith("/documents")) return false;
	if (
		pathname.includes("/validate") ||
		pathname.includes("/reject") ||
		pathname.includes("/upload")
	) {
		return false;
	}
	return true;
}

/**
 * Lista GET /documents* mockeada; mutar `mode` tras approve/reject para devolver cola vacía.
 */
export async function mockDocumentsList(
	page: Page,
	mode: { current: ReviewListMode },
): Promise<void> {
	await page.route(
		(url) => isDocumentsListPath(url.pathname),
		async (route) => {
			if (route.request().method() !== "GET") {
				await route.continue();
				return;
			}
			const body =
				mode.current === "one"
					? JSON.stringify(LIST_WITH_ONE)
					: JSON.stringify(LIST_EMPTY);
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body,
			});
		},
	);
}

export async function mockDocumentsValidatePost(
	page: Page,
	onSuccess: () => void,
	responseBody: Record<string, unknown>,
): Promise<void> {
	await page.route(
		(url) => url.pathname.includes("/documents/validate/"),
		async (route) => {
			if (route.request().method() !== "POST") {
				await route.continue();
				return;
			}
			onSuccess();
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(responseBody),
			});
		},
	);
}

export async function mockDocumentsRejectPost(
	page: Page,
	onSuccess: () => void,
	responseBody: Record<string, unknown>,
): Promise<void> {
	await page.route(
		(url) => url.pathname.includes("/documents/reject/"),
		async (route) => {
			if (route.request().method() !== "POST") {
				await route.continue();
				return;
			}
			onSuccess();
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(responseBody),
			});
		},
	);
}
