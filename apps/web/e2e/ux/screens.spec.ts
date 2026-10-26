/**
 * UX safety net for the key screens, on desktop and mobile projects.
 *
 * - Screenshot baselines catch unintended visual change.
 * - Accessibility violations (axe) and undersized touch targets are a ratchet:
 *   counts may only go down. Run with UPDATE_UX_BUDGET=1 after an improvement
 *   to lower the recorded budget.
 * - Known defects are `test.fail()`: when a fix lands, Playwright reports the
 *   unexpected pass and the marker must be removed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../base-test";

const SCREENS = [
	{ id: "login", path: "/login" },
	{ id: "cierre-mensual", path: "/cierre-mensual" },
	{
		id: "workspace",
		path: "/workspace/00000000-0000-0000-0000-000000000001/2026/01/monthly-close",
	},
	{ id: "invoices", path: "/invoices" },
	{ id: "reconciliations", path: "/tesoreria/reconciliations" },
	{ id: "cumplimiento", path: "/cumplimiento/expedientes" },
	{ id: "settings", path: "/settings" },
] as const;

const MIN_TOUCH_TARGET_PX = 44;
const budgetFile = fileURLToPath(new URL("./ux-budget.json", import.meta.url));
type Budget = Record<string, { axe: number; smallTargets: number }>;
const budget: Budget = JSON.parse(readFileSync(budgetFile, "utf8"));

async function openScreen(page: Page, path: string) {
	await page.goto(path, { waitUntil: "networkidle" });
	// Lazy route chunks render a "Loading..." fallback after network idle.
	await expect(page.getByText(/^Loading\.\.\.$/)).toHaveCount(0, {
		timeout: 15_000,
	});
	// Positive readiness signal: every key screen renders a visible h1 once mounted.
	await expect(page.locator("h1:visible").first()).toBeVisible({
		timeout: 15_000,
	});
	await page.waitForLoadState("networkidle");
	await page.evaluate(() => document.fonts.ready);
	// Let finite transitions (e.g. sidebar width) settle; infinite spinners are allowed to keep running.
	await page.waitForFunction(() =>
		document
			.getAnimations()
			.every(
				(animation) =>
					animation.playState !== "running" ||
					animation.effect?.getTiming().iterations === Number.POSITIVE_INFINITY,
			),
	);
}

function countSmallTargets(page: Page) {
	return page.evaluate((min) => {
		const interactive = document.querySelectorAll(
			"button, a[href], [role='button'], input, select, textarea",
		);
		return [...interactive].filter((el) => {
			// A visually hidden native radio/checkbox is operated through its label.
			const isToggle =
				el instanceof HTMLInputElement &&
				(el.type === "radio" || el.type === "checkbox");
			const target = isToggle && el.labels?.length ? el.labels[0] : el;
			const box = target.getBoundingClientRect();
			// checkVisibility() also excludes visibility:hidden (e.g. a closed drawer), which still has a box.
			const visible =
				box.width > 0 &&
				box.height > 0 &&
				el.checkVisibility({ visibilityProperty: true });
			return visible && (box.width < min || box.height < min);
		}).length;
	}, MIN_TOUCH_TARGET_PX);
}

for (const screen of SCREENS) {
	test.describe(screen.id, () => {
		test("matches the visual baseline", async ({ page }) => {
			await openScreen(page, screen.path);
			await expect(page).toHaveScreenshot(`${screen.id}.png`);
		});

		test("exposes exactly one h1", async ({ page }) => {
			await openScreen(page, screen.path);
			// One visible h1 per breakpoint: a display:none heading is not exposed to assistive tech.
			await expect(page.locator("h1:visible")).toHaveCount(1);
		});

		test("has no horizontal overflow", async ({ page }) => {
			await openScreen(page, screen.path);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - window.innerWidth,
			);
			expect(overflow).toBeLessThanOrEqual(0);
		});

		test("does not exceed the accessibility and touch-target budget", async ({
			page,
		}, testInfo) => {
			await openScreen(page, screen.path);
			const axe = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
				.analyze();
			const measured = {
				axe: axe.violations.reduce(
					(total, violation) => total + violation.nodes.length,
					0,
				),
				smallTargets: await countSmallTargets(page),
			};
			const key = `${testInfo.project.name}:${screen.id}`;

			if (process.env.UPDATE_UX_BUDGET) {
				// Read-modify-write: run the update with --workers=1.
				const current: Budget = JSON.parse(readFileSync(budgetFile, "utf8"));
				current[key] = measured;
				const sorted = Object.fromEntries(
					Object.entries(current).sort(([a], [b]) => a.localeCompare(b)),
				);
				writeFileSync(budgetFile, `${JSON.stringify(sorted, null, 2)}\n`);
				return;
			}

			const allowed = budget[key];
			expect(
				allowed,
				`no UX budget recorded for ${key}; run with UPDATE_UX_BUDGET=1`,
			).toBeDefined();
			expect(
				measured.axe,
				`axe violations grew: ${axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}`,
			).toBeLessThanOrEqual(allowed.axe);
			expect(measured.smallTargets).toBeLessThanOrEqual(allowed.smallTargets);
		});
	});
}

test.describe("mobile navigation", () => {
	test.skip(({ isMobile }) => !isMobile, "mobile only");

	test("opens the drawer from the app bar and closes it with Escape", async ({
		page,
	}) => {
		await openScreen(page, "/invoices");
		const sidebar = page.locator("#app-sidebar");
		await expect(sidebar).toBeHidden();

		const menu = page.getByRole("button", { name: "Abrir menú" });
		await menu.click();
		await expect(sidebar).toBeVisible();
		await expect(menu).toHaveAttribute("aria-expanded", "true");
		await expect(sidebar.getByText("Comprobantes")).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(sidebar).toBeHidden();
	});

	test("navigation does not cover content on first paint", async ({ page }) => {
		await openScreen(page, "/invoices");
		const heading = page.locator("h1:visible").first();
		const box = await heading.boundingBox();
		expect(box).not.toBeNull();
		const topElement = await page.evaluate(
			({ x, y }) => document.elementFromPoint(x, y)?.closest("h1") !== null,
			{
				x: (box?.x ?? 0) + 4,
				y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
			},
		);
		expect(topElement).toBe(true);
	});
});

test.describe("unknown address", () => {
	test("shows a Spanish not-found page with a way home", async ({ page }) => {
		await page.goto("/esta-ruta-no-existe", { waitUntil: "networkidle" });
		await expect(
			page.getByRole("heading", { level: 1, name: "Página no encontrada" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Ir al inicio" }),
		).toBeVisible();
	});
});
