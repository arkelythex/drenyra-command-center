import { expect, test } from "../base-test";

/**
 * Layout stability is measured in the dev server, where it is reliable.
 * Paint timing is not: Vite serves unbundled modules (LCP is 8s+ here), so an
 * LCP budget belongs on a production build, not in this spec.
 */
const BUDGET = { cls: 0.1 };
const SCREENS = ["/invoices", "/tesoreria/reconciliations", "/settings"];

for (const path of SCREENS) {
	test(`${path}: does not shift while loading`, async ({ page }) => {
		await page.addInitScript(() => {
			const w = window as unknown as { __cls: number };
			w.__cls = 0;
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries() as unknown as Array<{
					value: number;
					hadRecentInput: boolean;
				}>) {
					if (!entry.hadRecentInput) w.__cls += entry.value;
				}
			}).observe({ type: "layout-shift", buffered: true });
		});

		await page.goto(path, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const cls = await page.evaluate(
			() => (window as unknown as { __cls: number }).__cls,
		);
		expect(cls).toBeLessThan(BUDGET.cls);
	});
}
