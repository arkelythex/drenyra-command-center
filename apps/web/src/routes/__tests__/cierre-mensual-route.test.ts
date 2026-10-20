import { afterEach, describe, expect, it } from "vitest";
import { ACTIVE_FISCAL_PERIOD_STORAGE_KEY } from "@/lib/fiscal-period";
import { Route } from "../cierre-mensual";

function redirectOf(): { to?: string; params?: Record<string, string> } {
	const loader = (Route.options as { loader: () => unknown }).loader;
	try {
		loader();
	} catch (thrown) {
		return (
			thrown as { options: { to?: string; params?: Record<string, string> } }
		).options;
	}
	throw new Error("expected a redirect");
}

describe("/cierre-mensual", () => {
	afterEach(() => localStorage.clear());

	it("opens the active period's monthly-close workspace", () => {
		localStorage.setItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY, "2026-08");
		window.dispatchEvent(new Event("storage"));

		const target = redirectOf();

		expect(target.to).toBe("/workspace/$companyId/$year/$month/$intent");
		expect(target.params).toMatchObject({
			year: "2026",
			month: "08",
			intent: "monthly-close",
		});
		expect(target.params?.companyId).toBeTruthy();
	});
});
