/**
 * Monthly-close mission, end to end through the real HTTP transport against a
 * contract-faithful fake API (e2e/fixtures/mission-api.ts).
 */
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "../base-test";
import {
	installMissionApi,
	type MissionApiOptions,
} from "../fixtures/mission-api";

const MISSION_URL =
	"/workspace/00000000-0000-0000-0000-000000000001/2026/07/monthly-close";
const startButton = (page: Page) =>
	page.getByRole("button", { name: /iniciar misión/i });

async function openMission(
	page: Page,
	context: BrowserContext,
	options?: MissionApiOptions,
) {
	const api = await installMissionApi(context, options);
	await page.goto(MISSION_URL, { waitUntil: "networkidle" });
	await expect(startButton(page)).toBeEnabled();
	// Wait for the lazily loaded page, then the primary action must be on screen without scrolling.
	await expect(
		page.getByRole("heading", { level: 1, name: "Cierre mensual" }),
	).toBeVisible();
	await expect(startButton(page)).toBeInViewport();
	return api;
}

test.describe("Mission flow", () => {
	test("opening the page creates and executes nothing", async ({
		page,
		context,
	}) => {
		const { calls } = await openMission(page, context);

		expect(calls).toEqual({
			create: 0,
			execute: 0,
			approve: 0,
			reject: 0,
			reconcile: 0,
		});
		await expect(page.getByText("Ejecutando misión")).toHaveCount(0);
	});

	test("long content scrolls inside the page while the primary action stays on screen", async ({
		page,
		context,
	}) => {
		await openMission(page, context);

		const lastSection = page.getByRole("heading", {
			name: "Estado del cierre",
		});
		await lastSection.scrollIntoViewIfNeeded();

		await expect(lastSection).toBeInViewport();
		await expect(startButton(page)).toBeInViewport();
	});

	test("creates and executes the mission exactly once, even on a double click", async ({
		page,
		context,
	}) => {
		const { calls } = await openMission(page, context);

		await startButton(page).dblclick();

		await expect(page.getByRole("button", { name: "Aprobar" })).toBeVisible();
		expect(calls.create).toBe(1);
		expect(calls.execute).toBe(1);
		await expect(startButton(page)).toHaveCount(0);
	});

	test("approving issues a receipt that shows its id and SHA-256 hash", async ({
		page,
		context,
	}) => {
		const { calls } = await openMission(page, context);
		await startButton(page).click();

		await page.getByRole("button", { name: "Aprobar" }).click();

		await expect(
			page.getByRole("heading", { name: "Recibo de aprobación" }),
		).toBeVisible();
		await expect(page.getByTestId("receipt-id")).toHaveText(
			/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/,
		);
		await expect(page.getByTestId("receipt-hash")).toHaveText(/^[0-9a-f]{64}$/);
		await expect(
			page.getByRole("button", { name: /copiar/i }).first(),
		).toBeVisible();
		expect(calls.approve).toBe(1);
	});

	test("rejecting requires a reason and records it", async ({
		page,
		context,
	}) => {
		const { calls } = await openMission(page, context);
		await startButton(page).click();

		const reject = page.getByRole("button", { name: "Rechazar" });
		await expect(reject).toBeDisabled();

		await page
			.getByLabel("Motivo de rechazo")
			.fill("Falta sustento de las detracciones");
		await expect(reject).toBeEnabled();
		await reject.click();

		await expect(
			page.getByRole("heading", { name: "Propuesta rechazada" }),
		).toBeVisible();
		await expect(
			page.getByText("Falta sustento de las detracciones"),
		).toBeVisible();
		expect(calls.reject).toBe(1);
	});

	test("an unconfirmed outcome is reconciled explicitly, with a reason", async ({
		page,
		context,
	}) => {
		const { calls } = await openMission(page, context, {
			afterExecute: "UNKNOWN",
		});
		await startButton(page).click();

		await expect(
			page.getByRole("heading", { name: "Estado desconocido" }),
		).toBeVisible();
		await page
			.getByLabel("Motivo de la resolución")
			.fill("Confirmado en SUNAT SOL");
		await page.getByRole("button", { name: /marcar como completada/i }).click();

		await expect(
			page.getByRole("heading", { name: "Misión completada" }),
		).toBeVisible();
		expect(calls.reconcile).toBe(1);
	});

	test("after a reload the existing mission is resumed, not executed again", async ({
		page,
		context,
	}) => {
		const { calls } = await openMission(page, context);
		await startButton(page).click();
		await expect(page.getByRole("button", { name: "Aprobar" })).toBeVisible();

		await page.reload({ waitUntil: "networkidle" });
		await startButton(page).click();

		await expect(page.getByRole("button", { name: "Aprobar" })).toBeVisible();
		expect(calls.create).toBe(2); // the second create is answered 409 with the existing mission
		expect(calls.execute).toBe(1);
	});
});
